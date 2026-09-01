# TODO

- [ ] Wire `components/dashboard/document-auditor.tsx` into the shared dashboard state (`useAuditEngine`) so `ComplianceGauges` and `RiskHeatmap` update.
  - [ ] Import `useAuditEngine`.
  - [ ] On upload start: call `registerPendingDocument` using `documentId` returned by `/upload`.
  - [ ] On backend completion: call `finalizeDocument` using `{ id, name, sizeBytes, fileType, score: data.Score, findings: data.Findings }`.
  - [ ] Ensure stage transitions set `stage: "complete"` and `riskByCategory/complianceScore/clauses` so the UI renders.
- [ ] Run Next.js dev/build (or typecheck) to ensure no TS errors.

