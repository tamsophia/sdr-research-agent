import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { serperSearch } from "./serper";
import type { Brief, Lead } from "@/types";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

type Emit = (step: string) => void;

// ── Tier 1: Disqualifiers ────────────────────────────────────────────────────

async function checkDisqualifiers(
  lead: Lead,
  emit: Emit
): Promise<string | null> {
  const { company_name: company, company_domain: domain } = lead;

  emit("Checking if existing Notion customer…");
  const customerCheck = await serperSearch(
    `"${company}" "Notion" site:linkedin.com/jobs "required" OR "must have"` +
      ` OR site:notion.so "${company}" case study`
  );
  if (
    customerCheck.toLowerCase().includes("notion") &&
    customerCheck.toLowerCase().includes(company.toLowerCase()) &&
    customerCheck.toLowerCase().includes("case study")
  ) {
    return "Likely existing Notion customer (case study found)";
  }

  emit("Checking company financial health…");
  const healthCheck = await serperSearch(
    `"${company}" layoffs OR "going out of business" OR shutdown OR "chapter 11" 2024 2025`
  );
  const riskTerms = ["layoffs", "shutdown", "bankrupt", "chapter 11", "closing"];
  if (riskTerms.some((t) => healthCheck.toLowerCase().includes(t))) {
    return "Financial distress signals detected";
  }

  emit("Checking company size…");
  const sizeCheck = await serperSearch(
    `"${company}" employees headcount site:linkedin.com OR site:craft.co`
  );
  if (
    sizeCheck.match(/\b(5,000|10,000|20,000|50,000)\b/) ||
    sizeCheck.toLowerCase().includes("enterprise")
  ) {
    return "Company likely too large (enterprise tier)";
  }

  return null;
}

// ── Tier 2+3: Research ───────────────────────────────────────────────────────

async function gatherResearch(lead: Lead, emit: Emit) {
  const { company_name: company, contact_name: contact, company_domain: domain } = lead;

  emit("Researching company recent news…");
  const [news, funding, product, jobs, contactBio, contactPosts, contactRecent] =
    await Promise.all([
      serperSearch(`"${company}" news 2024 2025`),
      serperSearch(`"${company}" funding OR "series" OR valuation`),
      serperSearch(`"${company}" product launch OR new feature 2024 2025`),
      serperSearch(
        `site:linkedin.com/jobs "${company}" knowledge management OR documentation OR wiki OR "internal tools"`
      ),
      serperSearch(`"${contact}" "${company}" site:linkedin.com`),
      serperSearch(`"${contact}" site:linkedin.com/posts OR site:twitter.com`),
      serperSearch(`"${contact}" "${company}" interview OR podcast OR keynote 2024 2025`),
    ]);

  emit("Researching knowledge management pain points…");
  const [kmPain, notionCompare, teamStack] = await Promise.all([
    serperSearch(`"${company}" knowledge management OR documentation OR "information silos"`),
    serperSearch(`"${company}" Notion OR Confluence OR wiki tool`),
    serperSearch(`"${company}" tech stack OR tools site:stackshare.io OR site:g2.com`),
  ]);

  return {
    news,
    funding,
    product,
    jobs,
    contactBio,
    contactPosts,
    contactRecent,
    kmPain,
    notionCompare,
    teamStack,
  };
}

// ── Synthesis ────────────────────────────────────────────────────────────────

async function synthesizeBrief(lead: Lead, research: Record<string, string>, emit: Emit): Promise<Brief> {
  emit("Synthesising research with Claude…");

  const researchText = Object.entries(research)
    .map(([k, v]) => `### ${k}\n${v}`)
    .join("\n\n");

  const prompt = `You are an expert SDR researcher preparing a pre-call brief for Notion (the productivity SaaS).

Lead: ${lead.contact_name}, ${lead.contact_title} at ${lead.company_name} (${lead.headcount} employees, contact tenure ~${lead.estimated_tenure})

RESEARCH:
${researchText}

FOUR BUYING PATTERNS (pick one best fit):
1. Hyper-Scale Knowledge Chaos — rapid growth causing documentation debt; teams can't find info
2. Cross-Functional Coordination Debt — silos between eng/product/ops/sales causing misalignment
3. Multi-Market Alignment at Scale — multiple geos/segments needing consistent playbooks
4. Startup Velocity Preservation — post-funding, want to move fast without losing culture/context

OUTPUT as strict JSON (no markdown):
{
  "hypothesis": "2–3 sentence value hypothesis referencing specific company signals",
  "buying_pattern": "exact pattern name",
  "evidence": ["signal 1 from research", "signal 2", "signal 3"],
  "opening_question": "one sharp, non-generic question for ${lead.contact_name} that shows you did your homework",
  "red_flags": ["any risks or reasons to be careful"]
}

Only use facts traceable to the research. Do not fabricate.`;

  const msg = await anthropic.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  const raw = (msg.content[0] as { text: string }).text.trim();
  const json = JSON.parse(raw.replace(/^```json\n?/, "").replace(/\n?```$/, ""));

  return {
    company: lead.company_name,
    contact: lead.contact_name,
    title: lead.contact_title,
    hypothesis: json.hypothesis,
    buying_pattern: json.buying_pattern,
    evidence: json.evidence,
    opening_question: json.opening_question,
    red_flags: json.red_flags ?? [],
    fact_check_score: 0,
    fact_check_notes: "",
    generated_at: new Date().toISOString(),
  };
}

// ── Fact-check ───────────────────────────────────────────────────────────────

async function factCheck(brief: Brief, research: Record<string, string>, emit: Emit): Promise<Brief> {
  emit("GPT-4o fact-checking the brief…");

  const researchText = Object.values(research).join("\n");

  const resp = await openai.chat.completions.create({
    model: "gpt-4o",
    max_tokens: 512,
    messages: [
      {
        role: "system",
        content:
          "You are an independent fact-checker. Given raw research and a brief, score how well the brief's claims are supported by the research. Score 0–100. Output JSON only.",
      },
      {
        role: "user",
        content: `RAW RESEARCH:\n${researchText}\n\nBRIEF:\n${JSON.stringify(brief, null, 2)}\n\nOutput: {"score": <0-100>, "notes": "<one sentence assessment>"}`,
      },
    ],
  });

  const raw = resp.choices[0].message.content ?? "{}";
  const { score, notes } = JSON.parse(
    raw.replace(/^```json\n?/, "").replace(/\n?```$/, "")
  );

  return { ...brief, fact_check_score: score, fact_check_notes: notes };
}

// ── Main export ──────────────────────────────────────────────────────────────

export async function runResearch(
  lead: Lead,
  emit: Emit
): Promise<{ brief?: Brief; disqualifyReason?: string }> {
  // Tier 1
  const disqualifyReason = await checkDisqualifiers(lead, emit);
  if (disqualifyReason) return { disqualifyReason };

  // Tier 2+3
  const research = await gatherResearch(lead, emit);

  // Synthesis
  let brief = await synthesizeBrief(lead, research, emit);

  // Fact-check
  brief = await factCheck(brief, research, emit);

  emit("Brief complete ✓");
  return { brief };
}
