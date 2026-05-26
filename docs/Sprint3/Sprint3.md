# Sprint 3 Planning (2-Member Team)

Learning from the "Scope Creep" retrospective of Sprint 2, we are strictly defining the boundaries of Sprint 3. To ensure an even workload distribution and to prevent the team from falling into another technical rabbit hole, we have narrowed this sprint down to exactly **4 tightly scoped tasks** (2 tasks per developer).

The goal is to deliver working, integrated features rather than endless architectural perfection.

---

## Task Allocation

### Developer A: Backend & Data Integrity
**Task 1: Fix Monkey Patches & Strict API Contracts (Tech Debt)**
- **What it is:** Ensure the backend never returns null/undefined fields, and clean up the frontend's defensive rendering logic.
- **In Scope:** 
  - Update `ResumeExtractionAgent` prompts to guarantee the return of the exact JSON schema, using explicit "N/A" strings when data is missing.
  - Implement the exact fixes mapped out in `monky_patch_fixing.md` (remove `||`, `?`, and `as` casts in the React components).
- **OUT OF SCOPE (Do NOT do this):** Do not refactor the `BaseAgent` again. Do not add new extraction fields. Just stabilize what we currently have.

**Task 2: Chats and DB History Sidebar (Database Feature)**
- **What it is:** A side navigation panel allowing users to view and reload past resume extraction runs.
- **In Scope:** 
  - Backend: Create a simple `GET /api/resumes/history` endpoint fetching basic metadata (run ID, date, summary) from the persistence layer.
  - Frontend: Build a simple, read-only Sidebar component. Clicking a past run fetches and populates the `ReviewGrid`.
- **OUT OF SCOPE (Do NOT do this):** No infinite scrolling. No complex search or filtering mechanisms. No real-time WebSockets synchronization. Keep the DB queries and the UI strictly MVP.

---

### Developer B: UI & Core Application Workflow
**Task 3: Landing Page & Upload Integration (UI/UX)**
- **What it is:** Create a welcoming entry point for the application that flows naturally into the core product.
- **In Scope:** 
  - Build a clean, static landing page detailing the product's value proposition.
  - Implement seamless routing: `Landing Page -> Login -> Upload Zone -> Review Grid`.
- **OUT OF SCOPE (Do NOT do this):** No heavy 3D animations (Three.js), scroll-jacking, or custom CMS integrations. Use standard Tailwind/Lucide components for a polished but fast build.

**Task 4: ATS Rerun with Job Description Tweaking (Core Feature)**
- **What it is:** Allow recruiters to test different Job Descriptions against the same pool of extracted resumes.
- **In Scope:** 
  - Frontend: Add a modal/text-area to the "Run ATS Analysis" button where the user can paste a new Job Description.
  - Backend: Wire an endpoint that takes the existing resume IDs and the new JD, and strictly re-runs the ATS Cosine Similarity and Knockout evaluation.
- **OUT OF SCOPE (Do NOT do this):** Do not re-run the heavy LLM extraction phase for the raw resumes. Do not build an entire "Job Description Builder" UI. Just accept a raw text string.

---

## Pushed to Sprint 4 (The Scope Creep Traps)
- **Dynamic Field Generation:** Allowing the user to define custom extraction fields dynamically is deferred.
- **LLM Prompt Finetuning:** Overhauling the core extraction prompts to squeeze out 5% better accuracy is deferred until the application workflow is fully usable end-to-end.
