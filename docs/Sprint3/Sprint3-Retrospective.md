# Sprint 3 Retrospective & End Review

This document tracks the stabilization efforts and architectural modifications implemented during Sprint 3. The scope was strictly defined to resolve technical debt and finalize baseline infrastructure before proceeding with new feature integration.

## Completed Objectives

### 1. UI Architecture & Component Decoupling
We refactored the presentation layer to adhere to the Single Responsibility Principle (SRP) and eliminate monolithic component structures.
- **`Sidebar` Refactoring:** Decomposed the unified sidebar into a modular `src/components/sidebar/` domain (`Sidebar.tsx`, `SidebarHeader.tsx`, `RunList.tsx`, `RunListItem.tsx`).
- **`ReviewGrid` Decomposition:** Dismantled the 800+ line grid matrix into an isolated sub-component architecture (`src/components/reviewgrid/`). We separated state management from rendering logic by extracting presentation components (`ExtractedCell`, `SortableHeader`, `GridToolbar`) and functional overlays (`ActionControls`, `ExportModal`, `RecalculatingOverlay`).
- **Type Safety & Patch Removal:** Removed inline type assertions and null-coalescing bypasses (monkey patches) across the frontend codebase, establishing strict TypeScript interfaces for inter-component data flow.

### 2. Backend Infrastructure & LLM Resilience
We stabilized the AI extraction pipeline to ensure deterministic outputs and graceful failure handling.
- **Agent Framework Migration:** Transitioned from Spring AI to LangChain4j. This enforces strict JSON schema adherence and mitigates LLM hallucinations by mapping missing data to explicit "N/A" strings.
- **Fault Tolerance:** Engineered a retry mechanism with exponential backoff on all AI service calls, isolating the backend processing loop from transient network or API rate-limit failures.
- **Error Propagation:** Standardized error state types between the backend responses and frontend state, allowing the UI to ingest and display extraction limits or timeouts without unhandled exceptions.

### 3. Application Routing State
Replaced the state-driven Single Page Application (SPA) architecture with a Multi-Page Application (MPA) router using `react-router-dom`. This provides distinct URI endpoints (`/login`, `/upload`, `/review`).

### 4. Database Persistence & History API (Task 2)
Implemented the relational data layer and API endpoints required to persist and retrieve past extraction runs.
- **Schema Definition:** Designed normalized SQLite tables (`users`, `runs`, `candidates`, `candidate_attributes`, `candidate_knockouts`) utilizing strict `FOREIGN KEY` constraints and `ON DELETE CASCADE` triggers.
- **Data Access Layer:** Implemented `DatabaseRepository` methods (`getHistoryByUser`, `getCandidatesByRun`) to successfully aggregate historical run metadata and reconstruct full candidate profiles from the normalized schema.

---

## Unresolved Issues & Pending Work

### 1. Deferred Scope (Future Sprints)
- **Landing Page Integration:** The static marketing UI and corresponding routing entry points were deprioritized in favor of core application stability.
- **ATS Evaluation Rerun Endpoint:** The frontend overlays for job description modification were constructed, but the corresponding backend endpoint to evaluate new parameters against existing `candidate_attributes` remains unimplemented.

---

## Action Items for Next Sprint
Rehaul the UI and add essential features