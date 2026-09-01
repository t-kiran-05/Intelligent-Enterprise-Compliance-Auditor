// // "use client";

// // import { useEffect, useRef, useState } from "react";

// // type BackendResult = {
// //   Status?: string;
// //   Score?: number;
// //   Findings?: string[];
// //   [k: string]: any;
// // };

// // export default function DocumentAuditor() {
// //   const [status, setStatus] = useState<
// //     "idle" | "uploading" | "processing" | "completed" | "failed"
// //   >("idle");
// //   const [auditData, setAuditData] = useState<BackendResult | null>(null);

// //   const [lastFileName, setLastFileName] = useState<string>("");

// //   // Core base configuration matching your permanent live API
// //   const API_BASE = "https://vbkod6j4wc.execute-api.us-east-1.amazonaws.com";

// //   const pollIntervalRef = useRef<number | null>(null);

// //   useEffect(() => {
// //     console.log("[DocumentAuditor] mounted");
// //     return () => {
// //       if (pollIntervalRef.current) {
// //         clearInterval(pollIntervalRef.current);
// //         pollIntervalRef.current = null;
// //       }
// //     };
// //   }, []);

// //   const handleFileUpload = async (file: File | null) => {
// //     if (!file) return;

// //     try {
// //       setLastFileName(file.name);
// //       setAuditData(null);
// //       setStatus("uploading");

// //       console.log("[DocumentAuditor] uploading file", {
// //         name: file.name,
// //         type: file.type,
// //         size: file.size,
// //       });

// //       // STEP 1: Main dynamic entry point for Secure S3 Presigned URL
// //       const tokenRes = await fetch(`${API_BASE}/upload`, {

// //         method: "POST",
// //         headers: {
// //           "Content-Type": "application/json",
// //           Accept: "application/json",
// //         },
// //         body: JSON.stringify({ filename: file.name }),
// //       });

// //       if (!tokenRes.ok) {
// //         const t = await tokenRes.text().catch(() => "");
// //         throw new Error(`POST /upload failed: ${tokenRes.status} ${t}`);
// //       }

// //       const tokenData = (await tokenRes.json()) as {
// //         uploadUrl: string;
// //         documentId: string;
// //       };

// //       console.log("[DocumentAuditor] /upload response", tokenData);

// //       // STEP 2: Direct Binary S3 Put Object execution (Bypassing proxy)
// //       setStatus("uploading");
// //       console.log("[DocumentAuditor] PUT to pre-signed URL (start)", {
// //         uploadUrl: String(tokenData.uploadUrl).slice(0, 70) + "...",
// //         documentId: tokenData.documentId,
// //       });

// //       const putRes = await fetch(tokenData.uploadUrl, {
// //         method: "PUT",
// //         headers: {
// //           "Content-Type": file.type || "application/octet-stream",
// //         },
// //         body: file,
// //       });

// //       if (!putRes.ok) {
// //         const text = await putRes.text().catch(() => "");
// //         throw new Error(
// //           `PUT to pre-signed URL failed: ${putRes.status} ${text}`,
// //         );
// //       }

// //       console.log("[DocumentAuditor] PUT to pre-signed URL succeeded");

// //       // STEP 3: Polling
// //       setStatus("processing");

// //       if (pollIntervalRef.current) {
// //         clearInterval(pollIntervalRef.current);
// //         pollIntervalRef.current = null;
// //       }

// //       pollIntervalRef.current = window.setInterval(async () => {
// //         try {
// //           console.log("[DocumentAuditor] polling results", {
// //             documentId: tokenData.documentId,
// //           });

// //           const r = await fetch(`${API_BASE}/results/${tokenData.documentId}`, {
// //             method: "GET",
// //             headers: { Accept: "application/json" },
// //           });

// //           if (r.status === 404) {
// //             // backend still processing
// //             return;
// //           }

// //           if (!r.ok) {
// //             const t = await r.text().catch(() => "");
// //             throw new Error(`GET /results failed: ${r.status} ${t}`);
// //           }

// //           const data = (await r.json()) as BackendResult;

// //           if (data?.Status === "COMPLETED") {
// //             if (pollIntervalRef.current) {
// //               clearInterval(pollIntervalRef.current);
// //               pollIntervalRef.current = null;
// //             }
// //             setAuditData(data);
// //             setStatus("completed");
// //           } else if (data?.Status === "FAILED") {
// //             if (pollIntervalRef.current) {
// //               clearInterval(pollIntervalRef.current);
// //               pollIntervalRef.current = null;
// //             }
// //             setStatus("failed");
// //           }
// //         } catch (e) {
// //           console.error(e);
// //           setStatus("failed");
// //           if (pollIntervalRef.current) {
// //             clearInterval(pollIntervalRef.current);
// //             pollIntervalRef.current = null;
// //           }
// //         }
// //       }, 3000);
// //     } catch (err) {
// //       console.error(err);
// //       setStatus("failed");

// //       if (pollIntervalRef.current) {
// //         clearInterval(pollIntervalRef.current);
// //         pollIntervalRef.current = null;
// //       }
// //     }
// //   };

// //   return (
// //     <div className="p-6 max-w-xl mx-auto bg-white rounded-xl shadow-md">
// //       <h2 className="text-xl font-bold mb-4">AI Compliance Document Auditor</h2>

// //       <input
// //         type="file"
// //         disabled={status !== "idle" && status !== "failed"}
// //         onChange={(e) => {
// //           const f = e.target.files?.[0] ?? null;
// //           if (f) {
// //             console.log("[DocumentAuditor] file selected", {
// //               name: f.name,
// //               type: f.type,
// //               size: f.size,
// //             });
// //           } else {
// //             console.log("[DocumentAuditor] file selection cleared");
// //           }
// //           void handleFileUpload(f);
// //         }}

// //         className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
// //       />

// //       {lastFileName ? (
// //         <p className="mt-2 text-xs text-muted-foreground">
// //           Selected: <span className="font-medium text-foreground">{lastFileName}</span>
// //         </p>
// //       ) : null}

// //       <div className="mt-4 text-xs text-muted-foreground">
// //         Debug: status=<span className="font-mono text-foreground">{status}</span>
// //         <br />
// //         Debug: lastFileName=<span className="font-mono text-foreground">{lastFileName || ""}</span>
// //       </div>

// //       <div className="mt-2 font-semibold text-sm">

// //         {status === "uploading" && (
// //           <p className="text-amber-500">📤 Sending document stream securely to S3...</p>
// //         )}
// //         {status === "processing" && (
// //           <p className="text-blue-500">
// //             🤖 S3 linked. Triggering Groq Llama 3.1 Auditor engine...
// //           </p>
// //         )}
// //         {status === "completed" && (
// //           <p className="text-green-500">✅ Audit analysis fully resolved!</p>
// //         )}
// //         {status === "failed" && (
// //           <p className="text-red-500">❌ Audit mapping processing failed.</p>
// //         )}
// //       </div>

// //       {status === "completed" && auditData && (
// //         <div className="mt-6 p-4 border-t border-gray-200">
// //           <div className="flex justify-between items-center mb-2">
// //             <span className="text-gray-600 font-medium">Compliance Score:</span>
// //             <span
// //               className={`text-lg font-bold ${
// //                 (auditData.Score ?? 0) > 80
// //                   ? "text-green-600"
// //                   : "text-rose-600"
// //               }`}
// //             >
// //               {typeof auditData.Score === "number" ? `${auditData.Score}%` : "—"}
// //             </span>
// //           </div>
// //           <div className="mb-2">
// //             <span className="text-gray-600 font-medium block">Risk Highlights:</span>
// //             <ul className="list-disc list-inside text-sm text-gray-700 pl-2">
// //               {(auditData.Findings ?? []).map((item, idx) => (
// //                 <li key={idx}>{item}</li>
// //               ))}
// //             </ul>
// //           </div>
// //         </div>
// //       )}
// //     </div>
// //   );
// // }

// "use client";

// import { useEffect, useRef, useState } from "react";
// import { IngestionDropzone } from "./ingestion-dropzone";
// import { type AuditDocument } from "@/lib/audit"; // ✓ Added standard import

// type BackendResult = {
//   Status?: string;
//   Score?: number;
//   Findings?: string[];
//   [k: string]: any;
// };


// export default function DocumentAuditor() {
//   const [status, setStatus] = useState<
//     "idle" | "uploading" | "processing" | "completed" | "failed"
//   >("idle");
//   const [auditData, setAuditData] = useState<BackendResult | null>(null);
//   const [lastFileName, setLastFileName] = useState<string>("");
//   const [queueDocs, setQueueDocs] = useState<AuditDocument[]>([]);

//   const API_BASE = "https://vbkod6j4wc.execute-api.us-east-1.amazonaws.com";
//   const pollIntervalRef = useRef<number | null>(null);

//   // Updated function that accepts the real raw file directly from Dropzone browser events
//   const handleFileUpload = async (file: File | null) => {
//     if (!file) return;

//     try {
//       console.log("[DocumentAuditor] handleFileUpload invoked", {
//         name: file.name,
//         type: file.type,
//         size: file.size,
//       });

//       const isDocx = file.name.toLowerCase().endsWith(".docx");

//       const currentDoc: AuditDocument = {
//         id: Math.random().toString(36).substring(7),
//         name: file.name,
//         sizeBytes: file.size,
//         fileType: isDocx ? "DOCX" : "PDF",
//         stage: "uploaded",
//         progress: 10,
//         chunks: 0,
//         risksFound: 0,
//         complianceScore: null,
//         // initialize with a typed empty record to satisfy strict Record<...> typing in AuditDocument
//         riskByCategory: {} as AuditDocument["riskByCategory"],
//         clauses: [],
//         createdAt: 0
//       };

//       setQueueDocs([currentDoc]);
//       setLastFileName(file.name);
//       setAuditData(null);
//       setStatus("uploading");

//       // STEP 1: Secure Token/Presigned URL generation request
//       let tokenData: { uploadUrl: string; documentId: string };
//       try {
//         const tokenRes = await fetch(`${API_BASE}/upload`, {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//             Accept: "application/json",
//           },
//           body: JSON.stringify({ filename: file.name }),
//         });

//         if (!tokenRes.ok) {
//           const t = await tokenRes.text().catch(() => "");
//           throw new Error(`POST /upload failed: ${tokenRes.status} ${t}`);
//         }

//         // Token may occasionally be non-JSON (proxy/Lambda errors). Capture body for easier debugging.
//         try {
//           tokenData = (await tokenRes.json()) as { uploadUrl: string; documentId: string };
//         } catch {
//           const t = await tokenRes.text().catch(() => "");
//           throw new Error(`POST /upload returned non-JSON. body=${t}`);
//         }
//       } catch (e: any) {
//         console.error("[DocumentAuditor] upload token step failed", e);
//         throw new Error(`Upload token step failed: ${e?.message ?? String(e)}`);
//       }

//       // Update progress gauge
//       setQueueDocs(prev => prev.map(d => d.id === currentDoc.id ? ({ ...d, progress: 40 } as AuditDocument) : d));

//       // STEP 2: Pure Binary Upload to S3 (No proxy overhead)
//       try {
//         const putRes = await fetch(tokenData.uploadUrl, {
//           method: "PUT",
//           headers: {
//             "Content-Type": file.type || "application/octet-stream",
//           },
//           body: file,
//         });

//         if (!putRes.ok) {
//           // Many S3 PUT failures return no body; still attempt to read for debugging.
//           const t = await putRes.text().catch(() => "");
//           const safeHost = (() => {
//             try {
//               const u = new URL(tokenData.uploadUrl);
//               return u.origin + u.pathname;
//             } catch {
//               return "<invalid-upload-url>";
//             }
//           })();
//           throw new Error(`PUT to S3 pre-signed URL failed: ${putRes.status} ${t} (url=${safeHost}...)`);
//         }
//       } catch (e: any) {
//         console.error("[DocumentAuditor] S3 PUT step failed", e);
//         throw new Error(`S3 PUT step failed: ${e?.message ?? String(e)}`);
//       }

//       // STEP 3: Initiate Polling Engine Loop
//       setStatus("processing");
//       setQueueDocs(prev => prev.map(d => d.id === currentDoc.id ? { ...d, stage: "processing", progress: 70 } : d));

//       if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

//       let currentFakeProgress = 70; // Start point for processing state

//       pollIntervalRef.current = window.setInterval(async () => {
//         try {
//           // ✓ ADDED: Fake dynamic increment taake user ko 70% pr stuck na lage
//           if (currentFakeProgress < 95) {
//             currentFakeProgress += 2; // Har 3 seconds baad 2% barhega
//             setQueueDocs(prev => prev.map(d => d.id === currentDoc.id ? { ...d, progress: currentFakeProgress } : d));
//           }

//           console.log("[DocumentAuditor] polling database for key:", tokenData.documentId);
//           const r = await fetch(`${API_BASE}/results/${tokenData.documentId}`, {
//             method: "GET",
//             headers: { Accept: "application/json" },
//           });

//           if (r.status === 404) return; // Core Lambda is still processing the text with Groq LLM

//           if (!r.ok) throw new Error(`GET /results status error: ${r.status}`);
//           const data = (await r.json()) as BackendResult;

//           // Target achieved!
//           if (data?.Status === "COMPLETED") {
//             if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            
//             // Set to 100% instantly before completion layout transition
//             setQueueDocs(prev => prev.map(d => d.id === currentDoc.id ? { ...d, progress: 100 } : d));
            
//             setTimeout(() => {
//               setAuditData(data);
//               setStatus("completed");
//               setQueueDocs([]); // Success par queue clear
//             }, 600);

//           } else if (data?.Status === "FAILED") {
//             if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
//             setStatus("failed");
//             setQueueDocs(prev => prev.map(d => d.id === currentDoc.id ? { ...d, stage: "failed", progress: 100, errorDetails: data?.Error } : d));
//           }
//         } catch (e) {
//           console.error(e);
//           setStatus("failed");
//           if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
//         }
//   // };
//   }, 3000);

//   useEffect(() => {
//     // Inject custom runtime window bridge execution
//     (window as any).globalHandleUpload = handleFileUpload;
//     console.log("[DocumentAuditor] Live AWS cloud framework bridge active.");
    
//     return () => {
//       if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
//       (window as any).globalHandleUpload = null;
//     };
//   }, [handleFileUpload]);

//   return (
//     <div className="grid grid-cols-1 gap-6 p-6 max-w-5xl mx-auto">
//       {/* 1. Integrated Dropzone that triggers cloud pipeline functionality */}
//       <IngestionDropzone 
//         activeDocs={queueDocs} 
//         onRawFileTrigger={handleFileUpload}
//       />

//       {/* 2. Structured metrics metrics viewport dashboard summary metrics */}
//       {status === "completed" && auditData && (
//         <div className="mt-4 p-5 bg-white rounded-xl shadow-md border border-gray-100 animate-in fade-in duration-300">
//           <div className="flex justify-between items-center mb-4">
//             <h3 className="font-bold text-lg text-slate-800">Compliance Audit Summary</h3>
//             <span
//               className={`text-xl font-black px-3 py-1 rounded-full ${
//                 (auditData.Score ?? 0) > 80
//                   ? "bg-green-50 text-green-600"
//                   : "bg-rose-50 text-rose-600"
//               }`}
//             >
//               {typeof auditData.Score === "number" ? `${auditData.Score}%` : "—"}
//             </span>
//           </div>
//           <div className="mb-2">
//             <span className="text-sm font-semibold text-slate-600 block mb-1">Risk Highlights:</span>
//             <ul className="list-disc list-inside text-sm text-slate-700 pl-2 space-y-1">
//               {(auditData.Findings ?? []).map((item, idx) => (
//                 <li key={idx} className="hover:text-slate-900 transition-colors">{item}</li>
//               ))}
//             </ul>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }



// "use client";

// import { useEffect, useRef, useState } from "react";
// import { IngestionDropzone } from "./ingestion-dropzone";
// import { type AuditDocument } from "@/lib/audit";

// type BackendResult = {
//   Status?: string;
//   Score?: number;
//   Findings?: string[];
//   [k: string]: any;
// };

// export default function DocumentAuditor() {
//   const [status, setStatus] = useState<"idle" | "uploading" | "processing" | "completed" | "failed">("idle");
//   const [auditData, setAuditData] = useState<BackendResult | null>(null);
//   const [uploadProgress, setUploadProgress] = useState<number>(0);
//   const [queueDocs, setQueueDocs] = useState<AuditDocument[]>([]);

//   const API_BASE = "https://vbkod6j4wc.execute-api.us-east-1.amazonaws.com";
//   const pollIntervalRef = useRef<number | null>(null);

//   useEffect(() => {
//     // Expose local file trigger to global window for Dropzone linkage
//     (window as any).globalHandleUpload = handleFileUpload;
//     return () => {
//       if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
//       (window as any).globalHandleUpload = null;
//     };
//   }, []);

//   const handleFileUpload = async (file: File | null) => {
//     if (!file) return;

//     try {
//       setAuditData(null);
//       setUploadProgress(0);
//       setStatus("uploading");

//       // Setup clean tracking doc structure matching your lib standards
//       const currentDoc: any = {
//         id: Math.random().toString(36).substring(7),
//         name: file.name,
//         sizeBytes: file.size,
//         fileType: file.name.toLowerCase().endsWith(".docx") ? "DOCX" : "PDF",
//         stage: "uploaded",
//         progress: 0
//       };
//       setQueueDocs([currentDoc]);

//       // STEP 1: Fetch Presigned URL
//       const tokenRes = await fetch(`${API_BASE}/upload`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ filename: file.name }),
//       });
//       if (!tokenRes.ok) throw new Error("Failed to get upload authorization link");
//       const tokenData = await tokenRes.json();

//       // STEP 2: Pure S3 PUT Upload with XMLHttpRequest to capture REAL progress
//       setUploadProgress(20);
//       const xhr = new XMLHttpRequest();
//       xhr.open("PUT", tokenData.uploadUrl, true);
//       xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");

//       xhr.upload.onprogress = (event) => {
//         if (event.lengthComputable) {
//           const percentage = Math.round((event.loaded / event.total) * 100);
//           setUploadProgress(percentage);
//         }
//       };

//       const uploadToS3 = () => new Promise<void>((resolve, reject) => {
//         xhr.onload = () => (xhr.status >= 200 && xhr.status < 300) ? resolve() : reject();
//         xhr.onerror = () => reject(new Error("S3 Upload Failed"));
//         xhr.send(file);
//       });

//       await uploadToS3();
      
//       // STEP 3: Switch directly to dynamic Processing Loader
//       setStatus("processing");
//       setQueueDocs([]); // Clear the uploading queue component view

//       // Start fetching the real status from DynamoDB
//       if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
//       pollIntervalRef.current = window.setInterval(async () => {
//         try {
//           const res = await fetch(`${API_BASE}/results/${tokenData.documentId}`);
//           if (res.status === 404) return; // Keep waiting silently

//           const data = await res.json() as BackendResult;
          
//           const realStatus = data?.Status || data?.Item?.Status;
//           const finalResult = data?.Item ? data.Item : data;

//           if (realStatus === "COMPLETED") {
//             if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
//             setAuditData(finalResult);
//             setStatus("completed");
//           } else if (realStatus === "FAILED") {
//             if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
//             setStatus("failed");
//           }
//         } catch (e) {
//           console.error("Polling encounter error:", e);
//         }
//       }, 3000);

//     } catch (err) {
//       console.error(err);
//       setStatus("failed");
//     }
//   };

//   return (
//     <div className="grid grid-cols-1 gap-6 p-6 max-w-4xl mx-auto">
//       {/* Dynamic Gateway Dropzone */}
//       <IngestionDropzone activeDocs={queueDocs} onRawFileTrigger={handleFileUpload} />

//       {/* Realistic Realtime Status HUD Indicators */}
//       <div className="mt-2 space-y-3">
//         {status === "uploading" && (
//           <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
//             <p className="text-sm font-medium text-amber-700 flex justify-between">
//               <span>📤 Uploading to AWS S3 Storage Vault...</span>
//               <span className="font-mono font-bold">{uploadProgress}%</span>
//             </p>
//             <div className="mt-2 w-full bg-amber-200 h-2 rounded-full overflow-hidden">
//               <div className="bg-amber-600 h-full transition-all duration-200" style={{ width: `${uploadProgress}%` }} />
//             </div>
//           </div>
//         )}

//         {status === "processing" && (
//           <div className="p-5 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-3 animate-pulse">
//             <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent" />
//             <p className="text-sm font-semibold text-blue-700">
//               🤖 AWS Lambda active. Groq Llama 3.1 is reading and auditing compliance details...
//             </p>
//           </div>
//         )}

//         {status === "failed" && (
//           <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-700 font-medium">
//             ❌ Document processing failed or backend integration timeout.
//           </div>
//         )}
//       </div>

//       {/* True Dynamic Compliance Analytics Dashboard Display */}
//       {status === "completed" && auditData && (
//         <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xl space-y-6">
//           <div className="flex justify-between items-center border-b pb-4">
//             <div>
//               <h3 className="text-xl font-bold text-slate-800">Compliance Audit Ledger</h3>
//               <p className="text-xs text-slate-400 mt-0.5">Document ID: {auditData.DocumentId}</p>
//             </div>
//             <div className="text-center">
//               <span className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">Score Matrix</span>
//               <span className={`text-2xl font-black px-4 py-1.5 rounded-2xl ${
//                 (auditData.Score ?? 0) > 80 ? "bg-green-50 text-green-600" : "bg-rose-50 text-rose-600"
//               }`}>
//                 {auditData.Score ?? auditData.Analysis?.compliance_score ?? 0}%
//               </span>
//             </div>
//           </div>

//           <div>
//             <span className="text-sm font-bold text-slate-700 block mb-2">Primary Risk Highlights:</span>
//             <ul className="space-y-2">
//               {(auditData.Findings ?? auditData.Analysis?.risk_highlights ?? ["No immediate violations mapped."]).map((item: string, idx: number) => (
//                 <li key={idx} className="text-sm bg-slate-50 border-l-4 border-slate-400 px-3 py-2 rounded-r text-slate-600">
//                   {item}
//                 </li>
//               ))}
//             </ul>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }


"use client";

import { useEffect, useRef, useState } from "react";
import { IngestionDropzone } from "./ingestion-dropzone";
import { type AuditDocument } from "@/lib/audit";
import { useAuditEngineContext } from "@/hooks/audit-engine-context"
import type { AuditFinding } from "@/hooks/use-audit-engine"


type BackendResult = {
  Status?: string;
  Score?: number;
  OverallScore?: number;
  GdprScore?: number;
  Soc2Score?: number;
  CcpaScore?: number;
  Applicability?: string | Record<string, string>;
  Limitations?: string | string[];
  Findings?: string | Array<string | AuditFinding>;
  Error?: string;
  [k: string]: any;
};

type Applicability = "applicable" | "potentially_applicable" | "not_determined" | "not_applicable";

function parseJsonValue<T>(value: string | T | undefined, fallback: T): T {
  if (typeof value !== "string") return value ?? fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function frameworkScore(value: unknown, applicability: string | undefined): number | null {
  if (applicability === "not_determined" || applicability === "not_applicable") return null;
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function normalizeApplicability(value: unknown): Applicability {
  return value === "applicable" || value === "potentially_applicable" || value === "not_applicable"
    ? value
    : "not_determined";
}

function fileTypeFor(file: File): "PDF" | "DOCX" | "TXT" {
  const lower = file.name.toLowerCase();
  return lower.endsWith(".docx") ? "DOCX" : lower.endsWith(".txt") ? "TXT" : "PDF";
}

export default function DocumentAuditor() {
  const { registerPendingDocument, finalizeDocument } = useAuditEngineContext()


  const [status, setStatus] = useState<"idle" | "uploading" | "processing" | "completed" | "failed">("idle");

  const [auditData, setAuditData] = useState<BackendResult | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [queueDocs, setQueueDocs] = useState<AuditDocument[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const API_BASE = "https://vbkod6j4wc.execute-api.us-east-1.amazonaws.com";
  const pollIntervalRef = useRef<number | null>(null);

  const handleAgreementFiles = async (files: File[]) => {
    const groupId = `agreement-${Date.now().toString(36)}`;
    const groupName = `Agreement set (${files.length} documents)`;
    const sizeBytes = files.reduce((total, file) => total + file.size, 0);
    const fileType = fileTypeFor(files[0]);

    try {
      setAuditData(null);
      setErrorMessage("");
      setStatus("uploading");
      registerPendingDocument({ id: groupId, name: groupName, sizeBytes, fileType });
      const documentIds: string[] = [];

      for (const file of files) {
        const key = `agreements/${groupId}/${file.name}`;
        const tokenRes = await fetch(`${API_BASE}/upload`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ filename: key }),
        });
        if (!tokenRes.ok) throw new Error(`Could not authorize ${file.name}`);
        const tokenData = await tokenRes.json() as { uploadUrl: string; documentId: string };
        const putRes = await fetch(tokenData.uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": "application/octet-stream" },
          body: file,
        });
        if (!putRes.ok) throw new Error(`Could not upload ${file.name}`);
        documentIds.push(tokenData.documentId);
      }

      const startRes = await fetch(`${API_BASE}/agreement-audit`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ groupId, documentIds }),
      });
      if (!startRes.ok) throw new Error("Could not start agreement audit");
      setStatus("processing");
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = window.setInterval(async () => {
        try {
          const resultRes = await fetch(`${API_BASE}/agreement-results/${encodeURIComponent(groupId)}`);
          if (resultRes.status === 404) return;
          if (!resultRes.ok) throw new Error("Could not read agreement audit result");
          const data = await resultRes.json() as BackendResult;
          if (data.Status === "FAILED") throw new Error(data.Error || "Agreement audit failed");
          if (data.Status !== "COMPLETED") return;
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          const rawFindings = parseJsonValue<unknown[]>(data.Findings, []);
          const findings: Array<string | AuditFinding> = Array.isArray(rawFindings)
            ? rawFindings.filter((finding): finding is string | AuditFinding =>
                typeof finding === "string" || Boolean(finding && typeof finding === "object"),
              )
            : [];
          const rawApplicability = parseJsonValue<Record<string, string>>(data.Applicability, {});
          const applicability = {
            gdpr: normalizeApplicability(rawApplicability.gdpr),
            soc2: normalizeApplicability(rawApplicability.soc2),
            ccpa: normalizeApplicability(rawApplicability.ccpa),
          };
          finalizeDocument({
            id: groupId,
            name: groupName,
            sizeBytes,
            fileType,
            score: data.OverallScore ?? 0,
            frameworkScores: {
              gdpr: frameworkScore(data.GdprScore, applicability.gdpr),
              soc2: frameworkScore(data.Soc2Score, applicability.soc2),
              ccpa: frameworkScore(data.CcpaScore, applicability.ccpa),
            },
            applicability,
            findings,
          });
          setAuditData({ ...data, Findings: findings });
          setStatus("completed");
        } catch (error) {
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          setErrorMessage(error instanceof Error ? error.message : "Agreement audit failed");
          setStatus("failed");
        }
      }, 3000);
    } catch (error) {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      setErrorMessage(error instanceof Error ? error.message : "Agreement audit failed");
      setStatus("failed");
    }
  };

  useEffect(() => {
    (window as any).globalHandleUpload = handleFileUpload;
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      (window as any).globalHandleUpload = null;
    };
  }, []);

  const handleFileUpload = async (file: File | null) => {
    if (!file) return;

    try {
      setAuditData(null);
      setErrorMessage("");
      setUploadProgress(0);
      setStatus("uploading");

      const currentDoc: any = {
        id: Math.random().toString(36).substring(7),
        name: file.name,
        sizeBytes: file.size,
        fileType: file.name.toLowerCase().endsWith(".docx")
          ? "DOCX"
          : file.name.toLowerCase().endsWith(".txt")
            ? "TXT"
            : "PDF",
        stage: "uploaded",
        progress: 0
      };
      setQueueDocs([currentDoc]);

      // Phase 1: Call API Gateway to generate secure presigned URL
      const tokenRes = await fetch(`${API_BASE}/upload`, {
        method: "POST",

        headers: { 
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify({ 
          filename: file.name,
          file_name: file.name
      }),
      });
      if (!tokenRes.ok) throw new Error("Could not acquire AWS S3 authorization.");
      const tokenData = await tokenRes.json();

      // Register this document in the shared dashboard state so gauges/heatmap update.
      registerPendingDocument({
        id: tokenData.documentId,
        name: file.name,
        sizeBytes: file.size,
        fileType: file.name.toLowerCase().endsWith(".docx")
          ? "DOCX"
          : file.name.toLowerCase().endsWith(".txt")
            ? "TXT"
            : "PDF",
      });


      // Phase 2: Binary PUT Stream to S3 with real tracking progress indicator
      // const xhr = new XMLHttpRequest();
      // xhr.open("PUT", tokenData.uploadUrl, true);
      // xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");

      // xhr.upload.onprogress = (e) => {
      //   if (e.lengthComputable) {
      //     const pct = Math.round((e.loaded / e.total) * 100);
      //     setUploadProgress(pct);
      //   }
      // };

      // const uploadToS3 = () => new Promise<void>((resolve, reject) => {
      //   xhr.onload = () => (xhr.status >= 200 && xhr.status < 300) ? resolve() : reject();
      //   xhr.onerror = () => reject(new Error("S3 Network stream failed. Check CORS configuration."));
      //   xhr.send(file);
      // });

      // await uploadToS3();
      

      // Phase 2: Binary PUT Stream to S3 - Standard Structure Sync
      setStatus("processing"); // Direct interface shift to clear pending queues
      
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", tokenData.uploadUrl, true);
      
      // ✓ CRITICAL ALIGNMENT: Content-Type must strictly match the S3 signature parameters
      xhr.setRequestHeader("Content-Type", "application/octet-stream");

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const pct = Math.round((e.loaded / e.total) * 100);
          setUploadProgress(pct);
        }
      };

      const uploadToS3 = () => new Promise<void>((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`S3 Rejected with status payload: ${xhr.status} ${xhr.statusText}`));
          }
        };
        xhr.onerror = () => reject(new Error("S3 Network stream configuration payload dropped."));
        xhr.send(file);
      });

      await uploadToS3();
      

      
      // Phase 3: Transition to processing stage and pull database metrics reactively
      setStatus("processing");
      setQueueDocs([]); // Clear client tracking layout queue

      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      
      // Poll DynamoDB to read authentic status generated by Lambda
      pollIntervalRef.current = window.setInterval(async () => {
        try {
          const res = await fetch(`${API_BASE}/results/${encodeURIComponent(tokenData.documentId)}`);
          
          if (res.status === 404) {
            // Document hasn't hit S3 event lifecycle block yet, wait silently
            return;
          }

          const data = await res.json() as BackendResult;
          const currentStatus = data?.Status;

          if (currentStatus === "COMPLETED") {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

            // Write backend result into shared dashboard state.
            const rawFindings: unknown = typeof data?.Findings === "string"
              ? JSON.parse(data.Findings)
              : data?.Findings;
            const parsedFindings: Array<string | AuditFinding> = Array.isArray(rawFindings)
              ? rawFindings.filter((finding): finding is string | AuditFinding =>
                  typeof finding === "string" || Boolean(finding && typeof finding === "object"),
                )
              : [];
            const rawApplicability = parseJsonValue<Record<string, string>>(
              data.Applicability,
              { gdpr: "not_determined", soc2: "not_determined", ccpa: "not_determined" },
            );
            const applicability = {
              gdpr: normalizeApplicability(rawApplicability.gdpr),
              soc2: normalizeApplicability(rawApplicability.soc2),
              ccpa: normalizeApplicability(rawApplicability.ccpa),
            } satisfies Record<"gdpr" | "soc2" | "ccpa", Applicability>;

            finalizeDocument({
              id: tokenData.documentId,
              name: file.name,
              sizeBytes: file.size,
              fileType: file.name.toLowerCase().endsWith(".docx")
                ? ("DOCX" as const)
                : file.name.toLowerCase().endsWith(".txt")
                  ? ("TXT" as const)
                  : ("PDF" as const),
              score: typeof data?.OverallScore === "number" ? data.OverallScore : data.Score ?? 0,
              frameworkScores: {
                gdpr: frameworkScore(data.GdprScore, applicability.gdpr),
                soc2: frameworkScore(data.Soc2Score, applicability.soc2),
                ccpa: frameworkScore(data.CcpaScore, applicability.ccpa),
              },
              applicability,
              findings: parsedFindings,
            });

            setAuditData({ ...data, Findings: parsedFindings });
            setStatus("completed");
          } else if (currentStatus === "FAILED") {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            setErrorMessage(data?.Error || "Groq processing extraction failure.");
            setStatus("failed");
          }
        } catch (e) {
          console.error("Polling fetch encounter error:", e);
        }
      }, 3000);

    } catch (err: any) {
      console.error(err);
      setErrorMessage(err?.message || "Pipeline execution failed.");
      setStatus("failed");
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 p-6 max-w-4xl mx-auto">
      <IngestionDropzone
        activeDocs={queueDocs}
        onRawFileTrigger={handleFileUpload}
        onAgreementFiles={handleAgreementFiles}
      />

      <div className="mt-2 space-y-3">
        {status === "uploading" && (
          <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
            <p className="text-sm font-medium text-amber-700 flex justify-between">
              <span>📤 Uploading file binary payloads directly to S3 Vault...</span>
              <span className="font-mono font-bold">{uploadProgress}%</span>
            </p>
            <div className="mt-2 w-full bg-amber-200 h-2 rounded-full overflow-hidden">
              <div className="bg-amber-600 h-full transition-all duration-200" style={{ width: `${uploadProgress}%` }} />
            </div>
          </div>
        )}

        {status === "processing" && (
          <div className="p-5 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-3 animate-pulse">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent" />
            <p className="text-sm font-semibold text-blue-700">
              🤖 AWS S3 linked. Groq Llama 3.1 is reading and auditing compliance parameters from DynamoDB stream...
            </p>
          </div>
        )}

        {status === "failed" && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-700 font-medium">
            ❌ Process Failure: {errorMessage}
          </div>
        )}
      </div>

      {status === "completed" && auditData && (
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex justify-between items-center border-b pb-4">
            <div>
              <h3 className="text-xl font-bold text-slate-800">Compliance Audit Ledger</h3>
              <p className="text-xs text-slate-400 mt-0.5">Target Key ID: {auditData.DocumentId}</p>
            </div>
            <div className="text-center">
              <span className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">Score Matrix</span>
              <span className={`text-2xl font-black px-4 py-1.5 rounded-2xl ${
                (auditData.OverallScore ?? auditData.Score ?? 0) > 80 ? "bg-green-50 text-green-600" : "bg-rose-50 text-rose-600"
              }`}>
                {auditData.OverallScore ?? auditData.Score ?? "—"}%
              </span>
            </div>
          </div>

          <div className="grid gap-2 border-b border-slate-100 pb-4 sm:grid-cols-3">
            {(["gdpr", "ccpa", "soc2"] as const).map((framework) => {
              const applicability = parseJsonValue<Record<string, string>>(
                auditData.Applicability,
                {},
              )[framework] ?? "not_determined";
              const label = applicability.replaceAll("_", " ");
              return (
                <div key={framework} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{framework}</p>
                  <p className="mt-1 text-xs font-semibold capitalize text-slate-700">{label}</p>
                </div>
              );
            })}
          </div>

          <div>
            <span className="text-sm font-bold text-slate-700 block mb-2">Primary Risk Highlights:</span>
            <p className="mb-3 text-xs text-slate-500">
              This is an evidence-based screening result, not a legal opinion or certification.
            </p>
            <ul className="space-y-2">
              {(Array.isArray(auditData.Findings) ? auditData.Findings : []).map((item, idx: number) => (
                <li key={idx} className="text-sm bg-slate-50 border-l-4 border-slate-500 px-3 py-2 rounded-r text-slate-600">
                  {typeof item === "string" ? item : `${item.category ?? "Finding"}: ${item.clause ?? item.explanation ?? "Review required"}`}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}