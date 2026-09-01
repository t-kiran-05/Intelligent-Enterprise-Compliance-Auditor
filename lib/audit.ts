export type Stage =
  | "uploading"
  | "uploaded"
  | "chunking"
  | "extracting"
  | "scoring"
  | "complete"

export const STAGE_ORDER: Stage[] = [
  "uploading",
  "uploaded",
  "chunking",
  "extracting",
  "scoring",
  "complete",
]

// Stages shown as active "processing" states in the pipeline
export const PIPELINE_STAGES: Stage[] = [
  "uploaded",
  "chunking",
  "extracting",
  "scoring",
]

export const STAGE_LABEL: Record<Stage, string> = {
  uploading: "Uploading",
  uploaded: "Uploaded",
  chunking: "Chunking Text",
  extracting: "AI Extracting Risks",
  scoring: "Generating Legal Scores",
  complete: "Audit Complete",
}

export type RiskLevel = "none" | "low" | "medium" | "high" | "critical"

export const RISK_LEVELS: RiskLevel[] = [
  "none",
  "low",
  "medium",
  "high",
  "critical",
]

export const RISK_META: Record<
  RiskLevel,
  { label: string; token: string; weight: number }
> = {
  none: { label: "None", token: "var(--risk-none)", weight: 0 },
  low: { label: "Low", token: "var(--risk-low)", weight: 1 },
  medium: { label: "Medium", token: "var(--risk-medium)", weight: 2 },
  high: { label: "High", token: "var(--risk-high)", weight: 3 },
  critical: { label: "Critical", token: "var(--risk-critical)", weight: 4 },
}

// Risk categories become the rows of the heatmap matrix.
export const RISK_CATEGORIES = [
  "Data Privacy",
  "Security",
  "Liability",
  "Termination",
  "IP Ownership",
  "Indemnification",
  "Confidentiality",
  "Payment Terms",
  "Governing Law",
  "Governance",
] as const

export type RiskCategory = (typeof RISK_CATEGORIES)[number]

export type Clause = {
  id: string
  category: RiskCategory
  title: string
  original: string
  recommendation: string
  riskLevel: RiskLevel
  rationale: string
  evidenceStatus?: string
  confidence?: string
  legalReference?: string
  evidenceNeeded?: string
}

export type AuditDocument = {
  id: string
  name: string
  sizeBytes: number
  fileType: "PDF" | "DOCX" | "TXT"
  stage: Stage
  /** progress within the current stage, 0-100 */
  progress: number
  chunks: number
  risksFound: number
  complianceScore: number | null
  frameworkScores: {
    gdpr: number | null
    soc2: number | null
    ccpa: number | null
  }
  applicability: {
    gdpr: string
    soc2: string
    ccpa: string
  }
  riskByCategory: Record<RiskCategory, RiskLevel>
  clauses: Clause[]
  createdAt: number
}

export type LogLevel = "info" | "success" | "warning" | "error"

export type LogEntry = {
  id: string
  docId: string
  docName: string
  stage: Stage
  message: string
  level: LogLevel
  time: number
}

export function emptyRiskByCategory(): Record<RiskCategory, RiskLevel> {
  const map = {} as Record<RiskCategory, RiskLevel>
  for (const category of RISK_CATEGORIES) map[category] = "none"
  return map
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/** Overall pipeline progress across all stages, 0-100. */
export function overallProgress(doc: AuditDocument): number {
  if (doc.stage === "complete") return 100
  const idx = STAGE_ORDER.indexOf(doc.stage)
  const segments = STAGE_ORDER.length - 1
  return Math.min(100, Math.round(((idx + doc.progress / 100) / segments) * 100))
}
