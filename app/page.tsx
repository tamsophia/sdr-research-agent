"use client";

import { useState, useCallback } from "react";
import type { Lead, LeadResult, Brief, ProgressEvent } from "@/types";

// ── Sample leads ─────────────────────────────────────────────────────────────
const SAMPLE_LEADS: Lead[] = [
  {
    id: "1",
    company_name: "Ashby",
    contact_name: "Benji Encz",
    contact_title: "CEO",
    company_domain: "ashbyhq.com",
    headcount: "~150",
    estimated_tenure: "5+ years",
  },
  {
    id: "2",
    company_name: "Linear",
    contact_name: "Karri Saarinen",
    contact_title: "CEO",
    company_domain: "linear.app",
    headcount: "~100",
    estimated_tenure: "5+ years",
  },
  {
    id: "3",
    company_name: "Liveblocks",
    contact_name: "Steven Fabre",
    contact_title: "CEO",
    company_domain: "liveblocks.io",
    headcount: "~40",
    estimated_tenure: "4 years",
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function newLead(): Lead {
  return {
    id: Math.random().toString(36).slice(2),
    company_name: "",
    contact_name: "",
    contact_title: "",
    company_domain: "",
    headcount: "",
    estimated_tenure: "",
  };
}

function scoreColor(score: number) {
  if (score >= 75) return { bg: "rgba(74,222,128,0.15)", color: "#4ade80" };
  if (score >= 50) return { bg: "rgba(251,191,36,0.15)", color: "#fbbf24" };
  return { bg: "rgba(248,113,113,0.15)", color: "#f87171" };
}

// ── Components ────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: LeadResult["status"] }) {
  const map: Record<string, { cls: string; label: string; dot?: boolean }> = {
    pending:      { cls: "badge-pending", label: "Pending" },
    running:      { cls: "badge-running", label: "Running", dot: true },
    disqualified: { cls: "badge-dis",     label: "Disqualified" },
    completed:    { cls: "badge-done",    label: "Brief ready" },
    error:        { cls: "badge-error",   label: "Error" },
  };
  const { cls, label, dot } = map[status] ?? map.pending;
  return (
    <span className={`badge ${cls}`}>
      {dot && <span className="pulse" style={{ width: 6, height: 6, background: "currentColor", borderRadius: "50%", display: "inline-block" }} />}
      {label}
    </span>
  );
}

function BriefPanel({ brief }: { brief: Brief }) {
  const { bg, color } = scoreColor(brief.fact_check_score);
  const patternColors: Record<string, string> = {
    "Hyper-Scale Knowledge Chaos":        "#c084fc",
    "Cross-Functional Coordination Debt": "#60a5fa",
    "Multi-Market Alignment at Scale":    "#34d399",
    "Startup Velocity Preservation":      "#fbbf24",
  };
  const pColor = patternColors[brief.buying_pattern] ?? "#c084fc";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>{brief.company}</div>
          <div style={{ color: "var(--muted)", fontSize: 13, marginTop: 2 }}>
            {brief.contact} · {brief.title}
          </div>
        </div>
        <div className="score-ring" style={{ background: bg, color }}>
          {brief.fact_check_score}
        </div>
      </div>

      {/* Buying pattern */}
      <div style={{ padding: "10px 14px", borderRadius: 8, background: `${pColor}18`, border: `1px solid ${pColor}40` }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", color: pColor, textTransform: "uppercase", marginBottom: 4 }}>
          Buying Pattern
        </div>
        <div style={{ fontSize: 14, fontWeight: 600, color: pColor }}>{brief.buying_pattern}</div>
      </div>

      {/* Hypothesis */}
      <Section title="Value Hypothesis">
        <p style={{ fontSize: 14, lineHeight: 1.65, color: "var(--text)", margin: 0 }}>{brief.hypothesis}</p>
      </Section>

      {/* Evidence */}
      <Section title="Evidence">
        <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
          {brief.evidence.map((e, i) => (
            <li key={i} style={{ display: "flex", gap: 10, fontSize: 13, lineHeight: 1.5 }}>
              <span style={{ color: "var(--accent)", flexShrink: 0, marginTop: 1 }}>→</span>
              <span style={{ color: "var(--muted)" }}>{e}</span>
            </li>
          ))}
        </ul>
      </Section>

      {/* Opening question */}
      <Section title="Opening Question">
        <div style={{
          padding: "12px 16px",
          borderRadius: 8,
          background: "var(--surface2)",
          borderLeft: "3px solid var(--accent)",
          fontSize: 14,
          fontStyle: "italic",
          color: "var(--text)",
          lineHeight: 1.6,
        }}>
          "{brief.opening_question}"
        </div>
      </Section>

      {/* Red flags */}
      {brief.red_flags.length > 0 && (
        <Section title="Red Flags">
          <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
            {brief.red_flags.map((f, i) => (
              <li key={i} style={{ display: "flex", gap: 10, fontSize: 13, color: "#f87171" }}>
                <span>⚠</span><span>{f}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Fact check */}
      <div style={{ paddingTop: 12, borderTop: "1px solid var(--border)", fontSize: 12, color: "var(--muted)" }}>
        <span style={{ color }}>GPT-4o fact-check: {brief.fact_check_score}/100</span>
        {brief.fact_check_notes && <span> — {brief.fact_check_notes}</span>}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", color: "var(--muted)", textTransform: "uppercase", marginBottom: 8 }}>
        {title}
      </div>
      {children}
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────

export default function Home() {
  const [leads, setLeads] = useState<Lead[]>(SAMPLE_LEADS);
  const [results, setResults] = useState<Record<string, LeadResult>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [newLd, setNewLd] = useState<Lead>(newLead());
  const [running, setRunning] = useState(false);

  const updateResult = useCallback((id: string, patch: Partial<LeadResult>) => {
    setResults((prev) => ({
      ...prev,
      [id]: { ...prev[id], ...patch },
    }));
  }, []);

  async function runLead(lead: Lead) {
    updateResult(lead.id, {
      lead,
      status: "running",
      steps: [],
      brief: undefined,
      disqualifyReason: undefined,
      error: undefined,
    });

    const res = await fetch("/api/research", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lead }),
    });

    if (!res.body) {
      updateResult(lead.id, { status: "error", error: "No stream" });
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const event: ProgressEvent = JSON.parse(line.slice(6));
        if (event.type === "progress") {
          setResults((prev) => ({
            ...prev,
            [lead.id]: {
              ...prev[lead.id],
              steps: [...(prev[lead.id]?.steps ?? []), event.step!],
            },
          }));
        } else if (event.type === "complete") {
          updateResult(lead.id, { status: "completed", brief: event.brief });
          setSelected(lead.id);
        } else if (event.type === "disqualified") {
          updateResult(lead.id, { status: "disqualified", disqualifyReason: event.disqualifyReason });
        } else if (event.type === "error") {
          updateResult(lead.id, { status: "error", error: event.message });
        }
      }
    }
  }

  async function runAll() {
    setRunning(true);
    for (const lead of leads) {
      if (results[lead.id]?.status === "completed") continue;
      await runLead(lead);
    }
    setRunning(false);
  }

  function addLead() {
    if (!newLd.company_name || !newLd.contact_name) return;
    setLeads((prev) => [...prev, { ...newLd, id: Math.random().toString(36).slice(2) }]);
    setNewLd(newLead());
    setAdding(false);
  }

  function removeLead(id: string) {
    setLeads((prev) => prev.filter((l) => l.id !== id));
    setResults((prev) => { const n = { ...prev }; delete n[id]; return n; });
    if (selected === id) setSelected(null);
  }

  const selectedResult = selected ? results[selected] : null;
  const completedCount = Object.values(results).filter((r) => r.status === "completed").length;
  const disqualifiedCount = Object.values(results).filter((r) => r.status === "disqualified").length;

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Top bar */}
      <header style={{
        borderBottom: "1px solid var(--border)",
        padding: "14px 28px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "var(--surface)",
        position: "sticky",
        top: 0,
        zIndex: 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: "var(--accent-dim)",
            border: "1px solid var(--accent)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16,
          }}>⚡</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>SDR Research Agent</div>
            <div style={{ fontSize: 11, color: "var(--muted)" }}>Pre-call briefs · Notion SDR</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {Object.keys(results).length > 0 && (
            <div style={{ fontSize: 12, color: "var(--muted)" }}>
              {completedCount} brief{completedCount !== 1 ? "s" : ""} · {disqualifiedCount} DQ'd
            </div>
          )}
          <button
            className="btn-primary"
            onClick={runAll}
            disabled={running || leads.length === 0}
          >
            {running ? "Running…" : `Run all ${leads.length} leads`}
          </button>
        </div>
      </header>

      {/* Main layout */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden", height: "calc(100vh - 61px)" }}>

        {/* Left: lead list */}
        <div style={{
          width: 320,
          flexShrink: 0,
          borderRight: "1px solid var(--border)",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
        }}>
          {/* Add lead button */}
          <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)" }}>
            <button className="btn-ghost" style={{ width: "100%", textAlign: "left" }} onClick={() => setAdding(true)}>
              + Add lead
            </button>
          </div>

          {/* Add form */}
          {adding && (
            <div style={{ padding: 16, borderBottom: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 8 }}>
              {(["company_name", "contact_name", "contact_title", "company_domain", "headcount", "estimated_tenure"] as const).map((field) => (
                <input
                  key={field}
                  placeholder={field.replace(/_/g, " ")}
                  value={newLd[field]}
                  onChange={(e) => setNewLd((p) => ({ ...p, [field]: e.target.value }))}
                  style={{ width: "100%" }}
                />
              ))}
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn-primary" style={{ flex: 1 }} onClick={addLead}>Add</button>
                <button className="btn-ghost" onClick={() => setAdding(false)}>Cancel</button>
              </div>
            </div>
          )}

          {/* Lead items */}
          {leads.map((lead) => {
            const r = results[lead.id];
            const isSelected = selected === lead.id;
            return (
              <div
                key={lead.id}
                onClick={() => { setSelected(lead.id); }}
                style={{
                  padding: "14px 16px",
                  cursor: "pointer",
                  borderBottom: "1px solid var(--border)",
                  background: isSelected ? "var(--accent-dim)" : "transparent",
                  borderLeft: isSelected ? "3px solid var(--accent)" : "3px solid transparent",
                  transition: "background 0.1s",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {lead.company_name}
                    </div>
                    <div style={{ color: "var(--muted)", fontSize: 12, marginTop: 2 }}>
                      {lead.contact_name} · {lead.contact_title}
                    </div>
                    <div style={{ marginTop: 6 }}>
                      <StatusBadge status={r?.status ?? "pending"} />
                    </div>
                    {r?.status === "running" && r.steps.length > 0 && (
                      <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {r.steps[r.steps.length - 1]}
                      </div>
                    )}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end" }}>
                    <button
                      className="btn-ghost"
                      style={{ padding: "2px 8px", fontSize: 12 }}
                      onClick={(e) => { e.stopPropagation(); runLead(lead); }}
                      disabled={r?.status === "running"}
                    >
                      {r?.status === "running" ? "…" : "Run"}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); removeLead(lead.id); }}
                      style={{ background: "transparent", border: "none", color: "var(--muted)", fontSize: 16, padding: 0, lineHeight: 1 }}
                    >×</button>
                  </div>
                </div>
              </div>
            );
          })}

          {leads.length === 0 && (
            <div style={{ padding: 24, textAlign: "center", color: "var(--muted)", fontSize: 13 }}>
              No leads yet.<br />Add one above.
            </div>
          )}
        </div>

        {/* Right: brief / empty state */}
        <div style={{ flex: 1, overflowY: "auto", padding: 32 }}>
          {!selected && (
            <EmptyState onRun={runAll} running={running} leadsCount={leads.length} />
          )}

          {selected && !selectedResult && (
            <div style={{ color: "var(--muted)", fontSize: 14 }}>
              Select a lead and click Run to generate a brief.
            </div>
          )}

          {selectedResult?.status === "running" && (
            <RunningPanel steps={selectedResult.steps} lead={selectedResult.lead} />
          )}

          {selectedResult?.status === "disqualified" && (
            <DisqualifiedPanel reason={selectedResult.disqualifyReason!} lead={selectedResult.lead} />
          )}

          {selectedResult?.status === "error" && (
            <div className="card" style={{ padding: 24, maxWidth: 540 }}>
              <div style={{ color: "#f87171", fontWeight: 600, marginBottom: 8 }}>Error</div>
              <div style={{ color: "var(--muted)", fontSize: 13 }}>{selectedResult.error}</div>
            </div>
          )}

          {selectedResult?.status === "completed" && selectedResult.brief && (
            <div style={{ maxWidth: 640 }}>
              <div className="card" style={{ padding: 28 }}>
                <BriefPanel brief={selectedResult.brief} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Sub-panels ────────────────────────────────────────────────────────────────

function EmptyState({ onRun, running, leadsCount }: { onRun: () => void; running: boolean; leadsCount: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 16, textAlign: "center" }}>
      <div style={{ fontSize: 48 }}>⚡</div>
      <div>
        <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 8 }}>Pre-call Research Agent</div>
        <div style={{ color: "var(--muted)", fontSize: 14, maxWidth: 380, lineHeight: 1.6 }}>
          Add leads on the left, then run them one at a time or all at once.<br />
          Each brief takes ~30 seconds and includes a hypothesis, evidence, and an opening question.
        </div>
      </div>
      {leadsCount > 0 && (
        <button className="btn-primary" onClick={onRun} disabled={running} style={{ marginTop: 8 }}>
          Run all {leadsCount} leads
        </button>
      )}
    </div>
  );
}

function RunningPanel({ steps, lead }: { steps: string[]; lead: Lead }) {
  return (
    <div style={{ maxWidth: 540 }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 18 }}>{lead.company_name}</div>
        <div style={{ color: "var(--muted)", fontSize: 13, marginTop: 4 }}>
          {lead.contact_name} · {lead.contact_title}
        </div>
      </div>
      <div className="card" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 10 }}>
        {steps.map((step, i) => (
          <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <span style={{ color: "var(--green)", flexShrink: 0, marginTop: 1 }}>✓</span>
            <span style={{ color: "var(--muted)", fontSize: 13 }}>{step}</span>
          </div>
        ))}
        {steps.length > 0 && (
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <span className="pulse" style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--yellow)", flexShrink: 0 }} />
            <span style={{ color: "var(--yellow)", fontSize: 13 }}>Working…</span>
          </div>
        )}
      </div>
    </div>
  );
}

function DisqualifiedPanel({ reason, lead }: { reason: string; lead: Lead }) {
  return (
    <div style={{ maxWidth: 480 }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 18 }}>{lead.company_name}</div>
        <div style={{ color: "var(--muted)", fontSize: 13, marginTop: 4 }}>{lead.contact_name}</div>
      </div>
      <div className="card" style={{ padding: 24 }}>
        <div style={{ color: "#f87171", fontWeight: 600, fontSize: 15, marginBottom: 8 }}>Disqualified</div>
        <div style={{ color: "var(--muted)", fontSize: 14 }}>{reason}</div>
      </div>
    </div>
  );
}
