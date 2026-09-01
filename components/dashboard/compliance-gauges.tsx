"use client"

import * as React from "react"

// Lightweight inline icon components to avoid dependency on `lucide-react`
const IconBase = ({ children, className, ...props }: any) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    {children}
  </svg>
)

const FileText = (p: any) => (
  <IconBase {...p}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <path d="M14 2v6h6" />
    <path d="M16 13H8M16 17H8M10 9H8" />
  </IconBase>
)

const Gauge = (p: any) => (
  <IconBase {...p}>
    <path d="M12 8v4l2 2" />
    <path d="M21 12a9 9 0 1 0-18 0" />
  </IconBase>
)

const ShieldCheck = (p: any) => (
  <IconBase {...p}>
    <path d="M12 2l7 3v5c0 5-3.8 9.9-7 11-3.2-1.1-7-6-7-11V5l7-3z" />
    <path d="M9 12l2 2 4-4" />
  </IconBase>
)

const TriangleAlert = (p: any) => (
  <IconBase {...p}>
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <path d="M12 9v4" />
    <path d="M12 17h.01" />
  </IconBase>
)
import type { AuditDocument } from "@/lib/audit"

function scoreColor(score: number): string {
  if (score >= 80) return "var(--success)"
  if (score >= 60) return "var(--warning)"
  return "var(--risk-critical)"
}

function clamp(n: number): number {
  return Math.max(4, Math.min(99, Math.round(n)))
}

function RadialGauge({
  score,
  label,
  size = 132,
}: {
  score: number | null
  label: string
  size?: number
}) {
  const r = 42
  const c = 2 * Math.PI * r
  const arc = 0.75 // 270deg gauge
  const track = `${c * arc} ${c}`
  const value = score == null ? `0 ${c}` : `${c * arc * (score / 100)} ${c}`
  const color = score == null ? "var(--muted-foreground)" : scoreColor(score)

  return (
    <div
      className="flex flex-col items-center"
      style={{ width: size, height: size }}
    >
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          viewBox="0 0 100 100"
          className="size-full -rotate-[135deg]"
          aria-hidden="true"
        >
          <circle
            cx="50"
            cy="50"
            r={r}
            fill="none"
            stroke="var(--border)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={track}
          />
          <circle
            cx="50"
            cy="50"
            r={r}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={value}
            style={{ transition: "stroke-dasharray 700ms ease, stroke 400ms" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="text-2xl font-semibold tabular-nums tracking-tight"
            style={{ color }}
          >
            {score == null ? "N/A" : score}
          </span>
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            / 100
          </span>
        </div>
      </div>
      <span className="mt-1 text-xs font-medium text-muted-foreground">
        {label}
      </span>
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof Gauge
  label: string
  value: string
  accent: string
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-secondary/40 p-3">
      <div
        className="flex size-9 items-center justify-center rounded-md"
        style={{
          backgroundColor: `color-mix(in oklch, ${accent} 16%, transparent)`,
          color: accent,
        }}
      >
        <Icon className="size-5" aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <p className="text-lg font-semibold leading-none tabular-nums">
          {value}
        </p>
        <p className="mt-1 truncate text-[11px] text-muted-foreground">
          {label}
        </p>
      </div>
    </div>
  )
}

export function ComplianceGauges({
  documents,
}: {
  documents: AuditDocument[]
}) {
  const complete = documents.filter(
    (d) => d.stage === "complete" && d.complianceScore != null,
  )


  const scores = complete.map((d) => d.complianceScore as number)

  const overall =
    scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0

  const averageFrameworkScore = (key: "gdpr" | "soc2" | "ccpa") => {
    const values = complete
      .map((document) => document.frameworkScores?.[key])
      .filter((score): score is number => typeof score === "number")
    return values.length > 0
      ? Math.round(values.reduce((sum, score) => sum + score, 0) / values.length)
      : null
  }

  const totalRisks = complete.reduce((sum, d) => sum + d.risksFound, 0)
  const criticalClauses = complete.reduce(
    (sum, d) => sum + d.clauses.filter((c) => c.riskLevel === "critical").length,
    0,
  )

  const gdprValue = averageFrameworkScore("gdpr")
  const soc2Value = averageFrameworkScore("soc2")
  const ccpaValue = averageFrameworkScore("ccpa")
  const gdpr = gdprValue == null ? null : clamp(gdprValue)
  const soc2 = soc2Value == null ? null : clamp(soc2Value)
  const ccpa = ccpaValue == null ? null : clamp(ccpaValue)

  return (
    <section className="rounded-xl border border-border bg-card">
      <header className="flex items-center justify-between border-b border-border px-5 py-4">
        <div className="flex items-center gap-2">
          <Gauge className="size-4 text-primary" aria-hidden="true" />
          <h2 className="text-sm font-semibold tracking-tight">
            Compliance Scores
          </h2>
        </div>
        <span className="text-xs text-muted-foreground">
          Across {complete.length} audited{" "}
          {complete.length === 1 ? "document" : "documents"}
        </span>
      </header>

      <div className="grid gap-6 p-5 lg:grid-cols-[auto_1fr]">
        <div className="grid grid-cols-2 place-items-center gap-4 sm:grid-cols-4 lg:border-r lg:border-border lg:pr-6">
          <RadialGauge score={overall} label="Overall" size={140} />
          <RadialGauge score={gdpr} label="GDPR" size={116} />
          <RadialGauge score={soc2} label="SOC 2" size={116} />
          <RadialGauge score={ccpa} label="CCPA" size={116} />
        </div>

        <div className="grid grid-cols-2 content-center gap-3 sm:grid-cols-2">
          <StatCard
            icon={FileText}
            label="Documents audited"
            value={String(complete.length)}
            accent="var(--primary)"
          />
          <StatCard
            icon={ShieldCheck}
            label="Avg. compliance"
            value={`${overall}%`}
            accent="var(--success)"
          />
          <StatCard
            icon={Gauge}
            label="Risks identified"
            value={String(totalRisks)}
            accent="var(--warning)"
          />
          <StatCard
            icon={TriangleAlert}
            label="Critical clauses"
            value={String(criticalClauses)}
            accent="var(--risk-critical)"
          />
        </div>
      </div>
    </section>
  )
}
