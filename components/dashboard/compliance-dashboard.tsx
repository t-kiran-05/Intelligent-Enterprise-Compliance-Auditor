"use client"

import { AuditEngineProvider, useAuditEngineContext } from "@/hooks/audit-engine-context"
import { AuditLog } from "./audit-log"
import { ClauseEditor } from "./clause-editor"
import { ComplianceGauges } from "./compliance-gauges"
import { RiskHeatmap } from "./risk-heatmap"
import { Sidebar } from "./sidebar"
import { TopBar } from "./top-bar"
import { STAGE_ORDER } from "@/lib/audit"
import { useState } from "react"
import DocumentAuditor from "./document-auditor"


function ComplianceDashboardInner() { 

  const { documents, log } = useAuditEngineContext()
  const [search, setSearch] = useState("")
  const query = search.trim().toLowerCase()
  const visibleDocuments = query
    ? documents.filter((document) =>
        `${document.name} ${document.clauses.map((clause) => `${clause.title} ${clause.original}`).join(" ")}`
          .toLowerCase()
          .includes(query),
      )
    : documents
  const visibleLog = query
    ? log.filter((entry) => `${entry.docName} ${entry.message}`.toLowerCase().includes(query))
    : log
  const activeDocs = documents.filter((d) => d.stage !== STAGE_ORDER[STAGE_ORDER.length - 1])

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar activeCount={activeDocs.length} search={search} onSearch={setSearch} />
        <main className="mx-auto w-full max-w-400 flex-1 space-y-5 p-4 md:p-6">
          <div id="overview"><ComplianceGauges documents={visibleDocuments} /></div>

          <div className="grid gap-5 lg:grid-cols-5">
            <div id="auditing" className="lg:col-span-2 space-y-5">
              <DocumentAuditor />
            </div>
            <div id="live-activity" className="lg:col-span-3">
              <AuditLog log={visibleLog} />
            </div>
          </div>

          <div id="risk-heatmap"><RiskHeatmap documents={visibleDocuments} /></div>

          <div id="clause-review"><ClauseEditor documents={visibleDocuments} /></div>
        </main>
      </div>
    </div>
  )
}

export function ComplianceDashboard() {
  return (
    <AuditEngineProvider>
      <ComplianceDashboardInner />
    </AuditEngineProvider>
  )
}


