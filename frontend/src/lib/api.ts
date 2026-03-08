// AuthDoc API Service Layer (Production Ready)

const API_BASE_URL = 'http://localhost:3000/api';

/* ------------------------------------------------------------------ */
/* Domain Types (Authoritative)                                        */
/* ------------------------------------------------------------------ */

export type VerificationStatus = 'VERIFIED' | 'FLAGGED' | 'MISSING';

export interface SubjectMismatch {
  subject: string;
  expected?: string;
  found?: string;
  issue?: string;
}

export interface VerificationPayload {
  overall_status: VerificationStatus;
  reason?: string;
  mismatches?: SubjectMismatch[];
  arrears?: string[];
}

export interface VerificationResults {
  document_id: string;
  verification: VerificationPayload;
}

export interface BatchCandidate {
  document_id: string;
  overall_status: VerificationStatus;
}

export interface BatchVerificationResponse {
  candidates: BatchCandidate[];
}

export interface IngestResponse {
  document_id: string;
}

/* ------------------------------------------------------------------ */
/* Internal helper                                                     */
/* ------------------------------------------------------------------ */

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      typeof data?.error === 'string'
        ? data.error
        : response.statusText
    );
  }

  return data;
}

/* ------------------------------------------------------------------ */
/* API Calls                                                          */
/* ------------------------------------------------------------------ */

export async function ingestDocument(file: File): Promise<IngestResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/ingest`, {
    method: 'POST',
    body: formData,
  });

  return parseJsonResponse<IngestResponse>(response);
}

export async function verifyDocument(
  documentId: string
): Promise<VerificationResults> {
  const response = await fetch(`${API_BASE_URL}/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ document_id: documentId }),
  });

  return parseJsonResponse<VerificationResults>(response);
}

export async function batchVerifyDocuments(
  documentIds: string[]
): Promise<BatchVerificationResponse> {
  const response = await fetch(`${API_BASE_URL}/verify/batch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ document_ids: documentIds }),
  });

  return parseJsonResponse<BatchVerificationResponse>(response);
}
