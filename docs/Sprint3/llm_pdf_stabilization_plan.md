# System Architecture & Stabilization Plan: LLM & PDF Rendering
**Sprint 3 Focus: Data Integrity, Resilient Parsing, and Artifact Rendering**

In accordance with our Engineering Standards, we are prioritizing structural resilience over surface-level fixes. The system currently suffers from brittle API boundaries: the LLM violates JSON contracts, the frontend defensively patches the data, and the PDF rendering pipeline is failing. 

This document outlines the architectural plan to stabilize the pipeline. **No code will be executed until this plan is approved.**

---

## 1. LLM Extraction Resilience (The "Not Provided" & Crash Fix)

### Problem Analysis
The backend console logs show `Failed to parse overall JSON tree` when using `llama-3.1-8b-instant` via Groq. Fast/instant LLMs are prone to "chatty" responses, often wrapping JSON in markdown (e.g., ```json { ... } ```) or returning conversational filler. When `BaseAgent` attempts to parse this via Jackson, it throws an exception. Furthermore, if the LLM cannot find data, it deviates from the schema (e.g., returning "not provided" instead of a structured object).

### Architectural Solution
**Separation of Concerns:** The `ResumeExtractionAgent` is responsible for prompt orchestration, while `BaseAgent` must handle the structural extraction of JSON from unpredictable text.
1. **Prompt Hardening (Agent Level):**
   - Inject a strict system directive: *"You are a machine-to-machine API. Output ONLY raw JSON. No markdown, no conversational text. If a field is missing, return exactly `{ "value": "N/A", "confidence": "low" }`."*
2. **Defensive Pre-Parsing (BaseAgent Level):**
   - Before handing the LLM string to Jackson `ObjectMapper`, implement a regex-based pre-processor to extract the JSON block.
   - Example flow: Strip ```json blocks -> Find the first `{` and last `}` -> Extract substring -> Attempt parse.
3. **Fallback Defaults:** If the parse entirely fails after 3 retries, the backend must return a structurally sound, blank JSON schema rather than throwing an unhandled exception to the frontend.

---

## 2. PDF Rendering Pipeline Fix

### Problem Analysis
Currently, the PDF rendering in the UI is throwing errors. The `pdfbox` library is extracting text successfully, but the actual display of the PDF artifact (likely via an `iframe` or `embed` tag hitting `/api/resumes/blob/{id}`) is failing. This usually stems from:
1. Missing or improperly configured CORS/Auth headers for binary streams.
2. The backend returning the wrong `Content-Type` (e.g., returning JSON instead of `application/pdf`).
3. The frontend `ResumeViewer` component not handling the blob stream correctly.

### Architectural Solution
1. **Backend Endpoint Contract (`ResumeController`):**
   - Ensure the `/api/resumes/blob/{id}` endpoint strictly sets `HttpHeaders.CONTENT_TYPE` to `MediaType.APPLICATION_PDF`.
   - **Specific Error Handling:** If the candidate or PDF blob is missing from the database, do not throw a generic exception or a blank 404 that triggers a CORS block. Instead, return a clear, explicit `PDF missing` error payload with correct CORS headers so the frontend can detect the exact failure reason.
   - Ensure the endpoint streams the byte array directly via `ResponseEntity<byte[]>` or `Resource`.
2. **Frontend Consumption:**
   - The UI should request the PDF blob using the JWT token, convert the response to a local `Blob` object, and generate an `URL.createObjectURL(blob)`.
   - The generated Object URL is then safely passed to the `<iframe src={...}>` to bypass browser security restrictions on authenticated cross-origin binary streams.

---

## 3. Frontend Monkey Patch Removal (Strict Boundaries)

### Problem Analysis
Because the backend LLM responses have been unpredictable, the frontend (`api.ts` and `ReviewGrid.tsx`) is littered with inline type coercions (`as string`), null coalescing (`|| { value: "N/A" }`), and defensive DOM rendering.

### Architectural Solution
1. **Strict API Gateway (`api.ts`):**
   - The `api.ts` file will serve as an Anti-Corruption Layer (ACL). When it receives data from the backend, it will validate and map it to a guaranteed `StudentData` object. If the backend misses a field, the ACL injects the default.
2. **UI Component Purity:**
   - React components (`ReviewGrid`, `AnalyticsDashboard`) will treat `StudentData` as an immutable, complete source of truth.
   - All `as ExtractedField` and `||` logic will be stripped from the JSX. The UI simply renders what it is given.

---

## Approval Request
Please review the proposed data flow and architectural boundaries. If you agree with the approach for (1) Resilient LLM JSON parsing, (2) Authenticated PDF Blob streaming, and (3) Frontend ACL implementation, give the approval and we will proceed to execution.
