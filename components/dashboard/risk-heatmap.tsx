"use client"

import { Grid3x3 } from "lucide-react"
import {
  type AuditDocument,
  type RiskCategory,
  RISK_CATEGORIES,
  RISK_LEVELS,
  RISK_META,
} from "@/lib/audit"

const CATEGORY_ABBR: Record<RiskCategory, string> = {
  "Data Privacy": "Privacy",
  Security: "Security",
  Liability: "Liability",
  Termination: "Term.",
  "IP Ownership": "IP",
  Indemnification: "Indemn.",
  Confidentiality: "Confid.",
  "Payment Terms": "Payment",
  "Governing Law": "Law",
  Governance: "Governance",
}

export function RiskHeatmap({ documents }: { documents: AuditDocument[] }) {
  const scored = documents.filter((d) => d.stage === "complete")


  return (
    <section className="flex h-full flex-col rounded-xl border border-border bg-card">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
        <div className="flex items-center gap-2">
          <Grid3x3 className="size-4 text-primary" aria-hidden="true" />
          <h2 className="text-sm font-semibold tracking-tight">Risk Heatmap</h2>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {RISK_LEVELS.filter((l) => l !== "none").map((level) => (
            <div key={level} className="flex items-center gap-1.5">
              <span
                className="size-2.5 rounded-[3px]"
                style={{ backgroundColor: RISK_META[level].token }}
              />
              <span className="text-[11px] text-muted-foreground">
                {RISK_META[level].label}
              </span>
            </div>
          ))}
        </div>
      </header>

      {scored.length === 0 ? (
        <div className="flex flex-1 items-center justify-center p-10 text-sm text-muted-foreground">
          Complete an audit to populate the risk matrix.
        </div>
      ) : (
        <div className="flex-1 overflow-x-auto p-5">
          <div className="min-w-[760px]">
            {/* Header row */}
            <div className="grid grid-cols-[minmax(190px,1fr)_repeat(10,42px)] gap-1">
              <div />
              {RISK_CATEGORIES.map((cat) => (
                <div
                  key={cat}
                  className="pb-1 text-center text-[10px] font-medium text-muted-foreground"
                  title={cat}
                >
                  {CATEGORY_ABBR[cat]}
                </div>
              ))}
            </div>

            {/* Document rows */}
            <div className="flex flex-col gap-1.5">
              {scored.map((doc) => (
                <div
                  key={doc.id}
                  className="grid grid-cols-[minmax(190px,1fr)_repeat(10,42px)] items-center gap-1"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold text-primary">
                      {doc.fileType}
                    </span>
                    <span className="truncate text-xs font-medium" title={doc.name}>
                      {doc.name}
                    </span>
                  </div>
                  {RISK_CATEGORIES.map((cat) => {
                    const level = doc.riskByCategory[cat]
                    const meta = RISK_META[level]
                    return (
                      <div
                        key={cat}
                        title={`${doc.name} — ${cat}: ${meta.label} risk`}
                        className="group relative flex h-8 items-center justify-center rounded transition-transform hover:z-10 hover:scale-[1.08]"
                        style={{
                          backgroundColor:
                            level === "none"
                              ? "color-mix(in oklch, var(--muted) 60%, transparent)"
                              : `color-mix(in oklch, ${meta.token} 26%, transparent)`,
                          boxShadow:
                            level === "none"
                              ? "none"
                              : `inset 0 0 0 1px color-mix(in oklch, ${meta.token} 55%, transparent)`,
                        }}
                      >
                        <span
                          className="text-[10px] font-semibold uppercase"
                          style={{
                            color:
                              level === "none"
                                ? "var(--muted-foreground)"
                                : meta.token,
                          }}
                        >
                          {level === "none" ? "—" : meta.label[0]}
                        </span>
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
