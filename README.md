# AI Compliance Dashboard (Prototype)

A Next.js dashboard that lets you upload contract documents (PDF/DOCX/TXT), runs an automated “compliance audit” in AWS (API Gateway + Lambda + S3 + DynamoDB), and visualizes results as:

- **Compliance gauges** (Overall / GDPR / SOC2 / CCPA)
- **Risk heatmap** (risk levels by clause category)
- **Audit log** and **clause editor** (derived from backend findings)

> Note: This is a prototype. Some risk/category mapping is keyword-based on the frontend.

---

## Tech Stack

### Frontend
- **Next.js (App Router)**
- React components under `components/dashboard/*`
- Shared client state via a local hook/context:
  - `hooks/use-audit-engine.ts`
  - `hooks/audit-engine-context.tsx`

### Backend (AWS)
- **API Gateway** (HTTP endpoints)
- **Lambda** for orchestration + Groq calls
- **S3** for document storage (uploaded via presigned PUT URL)
- **DynamoDB** table `ComplianceAuditLogs` to store results

Local backend code:
- `terraform/lambda_src/index.py`

---

## What the dashboard does

1. User drops/uploads a file.
2. Frontend requests a **presigned S3 upload URL**.
3. Frontend uploads the binary to S3 using the presigned URL.
4. S3 triggers Lambda via an event.
5. Lambda extracts text, calls Groq to compute:
   - **Score** (0–100)
   - **Findings** (risk highlights)
6. Lambda stores results in DynamoDB.
7. Frontend polls `/results/{documentId}`.
8. When completed, frontend updates shared dashboard state.
9. Gauges + heatmap automatically re-render from that shared state.

---

## End-to-End Workflow (step-by-step)

### 1) Upload (Frontend)
**File:** `components/dashboard/document-auditor.tsx`

- Uses `IngestionDropzone` to accept file input.
- Calls the API Gateway endpoint:
  - `POST /upload`
- Receives:
  - `uploadUrl` (presigned S3 URL)
  - `documentId`

Then it updates the dashboard pipeline state:
- `registerPendingDocument({ id, name, sizeBytes, fileType })`

### 2) Upload Binary to S3
**File:** `components/dashboard/document-auditor.tsx`

- Performs `PUT uploadUrl` directly to S3.
- Tracks upload progress locally (UI only).

### 3) Backend Processing (AWS)
**File:** `terraform/lambda_src/index.py`

Lambda has two major paths:

#### A) S3 trigger event
- Detects `event['Records'][0]['s3']`
- Extracts text from the uploaded object:
  - PDF: uses `pypdf` if available
  - DOCX: parses `word/document.xml` from the zip
  - TXT: UTF-8 decode fallback
- If extraction fails, uses a heuristic fallback.

Then it calls Groq:
- `_call_groq(raw_text)`
  - score request: returns a single integer 0–100
  - highlights request: returns up to 5 findings separated by `||`
- Stores results in DynamoDB:
  - `Status = COMPLETED`
  - `Score = compliance_score`
  - `Findings = risk_highlights`

If anything fails:
- `Status = FAILED`
- `Error = str(e)`

#### B) API Gateway REST endpoints
- `POST /upload`
  - Generates a presigned URL:
    - bucket: `enterprise-compliance-vault-2026`
    - key: `filename` (used as `documentId`)
- `GET /results/{id}`
  - Reads DynamoDB item by `DocumentId`
  - Returns JSON with `Status`, `Score`, `Findings`, etc.

### 4) Poll for Results (Frontend)
**File:** `components/dashboard/document-auditor.tsx`

- Polls `GET /results/{documentId}` every ~3s.
- When `Status === "COMPLETED"`:
  - calls `finalizeDocument(...)`

### 5) Update shared UI state (Frontend)
**File:** `hooks/use-audit-engine.ts`

`finalizeDocument()` converts backend findings into the UI model:

- `clauses` are created from `findings: string[]`
- each clause has:
  - `category` inferred from keywords
  - `riskLevel` inferred from keywords
- `riskByCategory` is computed as the maximum risk level per category

Then it sets:
- `stage = "complete"`
- `complianceScore = payload.score`

### 6) Render Gauges + Heatmap
**Files:**
- `components/dashboard/compliance-gauges.tsx`
- `components/dashboard/risk-heatmap.tsx`

Both components receive `documents` from the shared context and render only when:
- `d.stage === "complete"`

---

## How Compliance Gauges are calculated

All gauges are derived from the per-document `complianceScore`.

### Overall
Average of all complete documents’ `complianceScore` (rounded).

### GDPR / SOC2 / CCPA
Simple derived offsets from `overall`:
- `GDPR = clamp(overall - 6)`
- `SOC2 = clamp(overall + 5)`
- `CCPA = clamp(overall - 1)`

`clamp()` keeps values in `[4, 99]`.

---

## How the Risk Heatmap is calculated

The heatmap uses `riskByCategory` computed from:

1. Backend `Findings` (array of strings)
2. Frontend inference:
   - `inferRiskCategory(text)` → category (keyword-based)
   - `inferRiskLevel(text)` → risk level (keyword-based)
3. `buildRiskMap(clauses)` → max risk level per category

So **heatmap is derived from Findings**, not directly from the compliance score.

---

## Project Structure (key files)

- `app/page.tsx` – page entry
- `components/dashboard/compliance-dashboard.tsx` – main layout
- `components/dashboard/document-auditor.tsx` – upload + polling + state updates
- `components/dashboard/compliance-gauges.tsx` – gauge UI
- `components/dashboard/risk-heatmap.tsx` – heatmap UI
- `hooks/use-audit-engine.ts` – shared state machine + clause/risk mapping
- `hooks/audit-engine-context.tsx` – context provider
- `terraform/lambda_src/index.py` – AWS Lambda + Groq + DynamoDB logic

---

## Local Development

1. Install deps:
   - `pnpm install`
2. Run Next.js:
   - `pnpm dev`

Then upload documents through the UI.

> The backend is remote (API Gateway + S3 + DynamoDB) using the configured endpoint in `document-auditor.tsx`.

---

## Known Limitations / Notes

- The risk categorization and risk level inference is currently **keyword-based on the frontend**.
- Compliance gauges (GDPR/SOC2/CCPA) are **derived from overall score via simple offsets**, not separately computed by the backend.
- This repo currently includes temporary debug logging during troubleshooting; remove them if desired.

