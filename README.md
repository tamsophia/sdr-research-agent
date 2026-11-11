# SDR Research Agent

An AI-powered pre-call research pipeline built for Notion's SDR team. Given a list of leads, it automatically generates structured research briefs so reps walk into every call with a sharp hypothesis, grounded evidence, and a non-generic opening question.

## The problem

SDR research is repetitive, inconsistent, and slow. Reps either skip it and sound generic, or spend 20–30 minutes per lead doing it manually. Neither scales.

## What it does

Feed it a lead. Get back a brief in ~30 seconds.

Each brief includes:
- A value hypothesis tied to the company's specific situation
- The buying pattern that best fits (see below)
- 3 evidence bullets sourced from real research
- One sharp opening question tailored to the contact
- Red flags to watch for on the call
- A GPT-4o fact-check score (0–100) on how well the claims are supported

## Architecture

Three tiers, run in sequence:

**Tier 1 — Disqualifiers** (sequential, stops early)
Checks if the company is an existing Notion customer, in financial distress, or outside the target size range. If any fire, the pipeline stops and returns DISQUALIFIED — no Claude call wasted.

**Tier 2+3 — Research** (parallel)
13 Serper searches across company news, funding, product launches, job postings, knowledge management signals, contact bio, recent posts, and interviews. Company and contact research run in parallel.

**Synthesis**
Claude Sonnet reads all research and writes the brief — hypothesis, buying pattern, evidence, opening question, red flags — as structured JSON.

**Fact-check**
GPT-4o independently reads the raw research and the finished brief. It has no knowledge of how the brief was written. It scores whether each claim is traceable to the research. This matters: a model can't objectively review its own output.

## Buying patterns

| Pattern | When it fits |
|---|---|
| **Hyper-Scale Knowledge Chaos** | Rapid headcount growth creating documentation debt |
| **Cross-Functional Coordination Debt** | Silos between eng, product, ops, and sales |
| **Multi-Market Alignment at Scale** | Multiple geos or segments needing consistent playbooks |
| **Startup Velocity Preservation** | Post-funding, want to move fast without losing culture or context |

## Stack

**Python 3**
**Anthropic Claude Sonnet** — research synthesis
**OpenAI GPT-4o** — independent fact-check
**Serper** — Google search API (13 searches per lead)
**Notion API** — brief output destination
## Key design decisions

**Disqualifiers before synthesis** — the pipeline stops the moment a lead fails a check. No brief is generated for a bad lead. This isn't just about efficiency — it's about trust. An SDR who opens a Notion page and reads a full hypothesis for a company that turns out to be an existing customer loses confidence in the tool.

**Two models, two jobs** — Claude writes the brief, GPT-4o checks it. The separation is what makes the verification meaningful. A model reviewing its own output reads it charitably. An independent model doesn't.

**Query + prompt, both layers** — the original Notion customer check was returning false positives because competitor comparison pages matched the query. The fix required tightening the search query *and* the synthesis prompt simultaneously. One layer wasn't enough.

---
