"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  type AuditDocument,
  type Clause,
  type LogEntry,
  type LogLevel,
  type RiskCategory,
  type RiskLevel,
  type Stage,
  RISK_CATEGORIES,
  STAGE_LABEL,
  STAGE_ORDER,
  emptyRiskByCategory,
} from "@/lib/audit"

let counter = 0
function uid(prefix: string) {
  counter += 1
  return `${prefix}-${Date.now().toString(36)}-${counter}`
}

const STAGE_SPEED: Record<Stage, number> = {
  uploading: 20,
  uploaded: 55,
  chunking: 15,
  extracting: 8.5,
  scoring: 12,
  complete: 0,
}

const TICK_MS = 380

const DEFAULT_APPLICABILITY = {
  gdpr: "not_determined",
  soc2: "not_determined",
  ccpa: "not_determined",
} as const

type NonCompleteStage = Exclude<Stage, "complete">

function nextStage(stage: Stage): Stage {
  if (stage === "scoring") return "scoring"
  const i = STAGE_ORDER.indexOf(stage)
  return STAGE_ORDER[Math.min(i + 1, STAGE_ORDER.length - 1)]
}

function inferRiskLevel(text: string): RiskLevel {
  const lower = text.toLowerCase()
  if (
    lower.includes("unlimited") ||
    lower.includes("breach") ||
    lower.includes("critical") ||
    lower.includes("unauthorized") ||
    lower.includes("violation")
  ) {
    return "critical"
  }
  if (
    lower.includes("high") ||
    lower.includes("material") ||
    lower.includes("materially") ||
    lower.includes("significant")
  ) {
    return "high"
  }
  if (lower.includes("review") || lower.includes("missing") || lower.includes("unclear")) {
    return "medium"
  }
  return "low"
}

function inferRiskCategory(text: string): RiskCategory {
  if (typeof text !== 'string') {
    console.warn('inferRiskCategory received non-string text:', text);
    return "Data Privacy"; // Default or handle as appropriate
  }
  const lower = text.toLowerCase()
  if (lower.includes("privacy") || lower.includes("personal data") || lower.includes("gdpr") || lower.includes("ccpa")) {
    return "Data Privacy"
  }
  if (
    lower.includes("security") ||
    lower.includes("mfa") ||
    lower.includes("multi-factor") ||
    lower.includes("encryption") ||
    lower.includes("access control") ||
    lower.includes("security audit")
  ) return "Security"
  if (lower.includes("indemn")) return "Indemnification"
  if (lower.includes("liability") || lower.includes("damages")) return "Liability"
  if (lower.includes("termination") || lower.includes("notice")) return "Termination"
  if (lower.includes("ip") || lower.includes("intellectual property") || lower.includes("ownership")) return "IP Ownership"
  if (lower.includes("confidential")) return "Confidentiality"
  if (lower.includes("payment") || lower.includes("invoice") || lower.includes("fee")) return "Payment Terms"
  if (lower.includes("governing law") || lower.includes("jurisdiction") || lower.includes("venue")) return "Governing Law"
  if (lower.includes("governance") || lower.includes("board") || lower.includes("corporate")) return "Governance"
  return "Data Privacy"
}

export type AuditFinding = {
  clause?: string
  category?: string
  riskLevel?: string
  evidenceStatus?: string
  confidence?: string
  explanation?: string
  recommendation?: string
  legalReference?: string
  evidenceNeeded?: string
}

function normalizeCategory(value: string | undefined, fallback: string): RiskCategory {
  const category = value?.trim().toLowerCase()
  const match = RISK_CATEGORIES.find((item) => item.toLowerCase() === category)
  return match ?? inferRiskCategory(fallback)
}

function normalizeRiskLevel(value: string | undefined, fallback: string): RiskLevel {
  const level = value?.trim().toLowerCase()
  if (level === "critical" || level === "high" || level === "medium" || level === "low") return level
  return inferRiskLevel(fallback)
}

function buildClauseFromFinding(finding: string | AuditFinding, index: number): Clause {
  const text = typeof finding === "string" ? finding : finding.clause ?? finding.explanation ?? ""
  const metadata = typeof finding === "string" ? {} : finding
  const category = normalizeCategory(metadata.category, text)
  const riskLevel = normalizeRiskLevel(metadata.riskLevel, text)

  // Make sure we always populate a risk level other than 'none' if the backend
  // is returning any findings at all.
  const normalizedRiskLevel: RiskLevel = text.trim().length
    ? riskLevel === "none"
      ? "medium"
      : riskLevel
    : "none"


  return {
    id: `clause-${Date.now()}-${index}`,
    category,
    title: text.slice(0, 48) || `Risk finding ${index + 1}`,
    original: text,
    recommendation: metadata.recommendation ?? "Review this clause against the company policy and legal playbook.",
    riskLevel: normalizedRiskLevel,
    rationale: metadata.explanation ?? "Derived from backend audit findings.",
    evidenceStatus: metadata.evidenceStatus,
    confidence: metadata.confidence,
    legalReference: metadata.legalReference,
    evidenceNeeded: metadata.evidenceNeeded,
  }
}


function buildRiskMap(clauses: Clause[]): Record<RiskCategory, RiskLevel> {
  const riskByCategory = emptyRiskByCategory()
  for (const clause of clauses) {
    const current = riskByCategory[clause.category]
    const currentWeight = current === "none" ? 0 : current === "low" ? 1 : current === "medium" ? 2 : current === "high" ? 3 : 4
    const nextWeight = clause.riskLevel === "none" ? 0 : clause.riskLevel === "low" ? 1 : clause.riskLevel === "medium" ? 2 : clause.riskLevel === "high" ? 3 : 4
    if (nextWeight >= currentWeight) {
      riskByCategory[clause.category] = clause.riskLevel
    }
  }
  return riskByCategory
}

export function useAuditEngine() {
  const [documents, setDocuments] = useState<AuditDocument[]>([])
  const [log, setLog] = useState<LogEntry[]>([])

  const docsRef = useRef<AuditDocument[]>(documents)
  docsRef.current = documents

  const pushLogs = useCallback((entries: LogEntry[]) => {
    if (!entries.length) return
    setLog((prev) => [...entries, ...prev].slice(0, 120))
  }, [])

  const registerPendingDocument = useCallback(
    (file: { id: string; name: string; sizeBytes: number; fileType: "PDF" | "DOCX" | "TXT" }) => {
      console.log("[useAuditEngine] registerPendingDocument", file)

      setDocuments((prev) => {
        const existing = prev.find((doc) => doc.id === file.id)
        if (existing) return prev
        return [
          {
            id: file.id,
            name: file.name,
            sizeBytes: file.sizeBytes,
            fileType: file.fileType,
            stage: "uploading",
            progress: 0,
            chunks: 0,
            risksFound: 0,
            complianceScore: null,
            frameworkScores: { gdpr: null, soc2: null, ccpa: null },
            applicability: { ...DEFAULT_APPLICABILITY },
            riskByCategory: emptyRiskByCategory(),
            clauses: [],
            createdAt: Date.now(),
          },
          ...prev,
        ]
      })
      pushLogs([
        {
          id: uid("log"),
          docId: file.id,
          docName: file.name,
          stage: "uploading",
          message: "File received — starting secure upload",
          level: "info",
          time: Date.now(),
        },
      ])
    },
    [pushLogs],
  )

  const finalizeDocument = useCallback(
    (payload: {
      id: string
      name: string
      sizeBytes: number
      fileType: "PDF" | "DOCX" | "TXT"
      score: number
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
      findings: Array<string | AuditFinding>
      error?: string
    }) => {
      const clauses = payload.findings.map((finding, index) => buildClauseFromFinding(finding, index))
      const riskByCategory = buildRiskMap(clauses)

      setDocuments((prev) => {
        const existingIndex = prev.findIndex((doc) => doc.id === payload.id)
        const nextDoc: AuditDocument = {
          id: payload.id,
          name: payload.name,
          sizeBytes: payload.sizeBytes,
          fileType: payload.fileType,
          stage: "complete",
          progress: 100,
          chunks: Math.max(clauses.length, 1),
          risksFound: clauses.length,
          complianceScore: payload.score,
          frameworkScores: payload.frameworkScores,
          applicability: payload.applicability,
          riskByCategory,
          clauses,
          createdAt: existingIndex >= 0 ? prev[existingIndex].createdAt : Date.now(),
        }

        if (existingIndex >= 0) {
          const updated = [...prev]
          updated[existingIndex] = nextDoc
          return updated
        }

        return [nextDoc, ...prev]
      })

      pushLogs([
        {
          id: uid("log"),
          docId: payload.id,
          docName: payload.name,
          stage: "complete",
          message: `Audit complete — compliance score ${payload.score}`,
          level: "success",
          time: Date.now(),
        },
      ])
    },
    [pushLogs],
  )

  useEffect(() => {
    const interval = setInterval(() => {
      const current = docsRef.current
      if (current.every((d) => d.stage === "complete")) return

      const logs: LogEntry[] = []
      const next = current.map((doc) => {
        if (doc.stage === "complete") return doc

        // runtime: doc.stage is not "complete" here.
        // cast is safe and avoids TS index issues.
        const nonCompleteStage = doc.stage as Exclude<Stage, "complete">
        const speed = STAGE_SPEED[nonCompleteStage]
        const inc = speed * (0.6 + Math.random() * 0.8)
        let progress = doc.progress + inc
        let stage: Stage = doc.stage
        let { chunks, risksFound, complianceScore, riskByCategory, clauses } = doc as AuditDocument


        if (progress >= 100) {
          const nextNonComplete = nextStage(doc.stage)
          if (nextNonComplete === doc.stage) {
            progress = 99
            return {
              ...doc,
              progress,
              chunks,
              risksFound,
              complianceScore,
              riskByCategory,
              clauses,
            }
          }
          progress = 0
          stage = nextNonComplete

          if (stage === "chunking") chunks = 0
          if (stage === "extracting") {
            chunks = Math.max(chunks, 1)
          }
          if (stage === "scoring") {
            risksFound = Math.max(risksFound, 1)
          }



          logs.push(
            buildTransitionLog(doc, stage, {
              chunks,
              complianceScore,
              clauses,
            }),
          )
        }

        return {
          ...doc,
          stage,
          progress,
          chunks,
          risksFound,
          complianceScore,
          riskByCategory,
          clauses,
        }
      })

      setDocuments(next)
      if (logs.length) pushLogs(logs)
    }, TICK_MS)

    return () => clearInterval(interval)
  }, [pushLogs])

  return { documents, log, registerPendingDocument, finalizeDocument }
}

function buildTransitionLog(
  doc: AuditDocument,
  stage: Stage,
  data: { chunks: number; complianceScore: number | null; clauses: Clause[] },
): LogEntry {
  let message = STAGE_LABEL[stage]
  let level: LogLevel = "info"

  switch (stage) {
    case "uploaded":
      message = "Upload complete — queued for analysis"
      level = "success"
      break
    case "chunking":
      message = `Extracting document text for backend analysis across ${data.chunks.toLocaleString()} chunks`
      break
    case "extracting":
      message = "Running compliance checks against core policy rules"
      break
    case "scoring":
      message = "Scoring clauses against policy rules"
      break
    case "complete":
      message = `Audit complete — compliance score ${
        data.complianceScore ?? "pending"
      }`
      level = "success"
      break
  }

  return {
    id: uid("log"),
    docId: doc.id,
    docName: doc.name,
    stage,
    message,
    level,
    time: Date.now(),
  }
}

export type { AuditDocument, LogEntry }
