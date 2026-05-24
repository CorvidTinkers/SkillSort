# Project Goal: The Hybrid ATS Simulation Engine

This document outlines the four-part implementation plan for building a robust, hybrid ATS scoring engine that cross-references extracted student resumes against a provided Job Description (JD). 

## Part 1: UI Integration (Frontend)
The user interface will be updated to collect JD information seamlessly without cluttering the initial experience.

- **Upload Zone Toggles:** Introduce three sleek, animated elements:
  1. `"Have Job Description?"`: A toggle that reveals a glassmorphic rich text area for pasting the JD.
  2. `"Enable ATS?"`: A toggle to determine if the ATS scoring should run in parallel during the initial upload.
  3. `"Any must haves?"`: Expands a dynamic input list allowing users to explicitly add HARD parameters (e.g., "B.Tech", "React.js").
- **Data Grid Updates:** 
  - If ATS is disabled during upload, add an elegant `"Run ATS Analysis"` button in the **grid header** alongside the display columns button, styled with a distinct green shade.
  - Display the `ats_match_score` percentage for each candidate.
  - Clicking a candidate expands a styled "Checklist" side-drawer or modal showing the evaluated soft parameters and evidence.

## Part 2: ATS Math Engine (Backend)
The mathematical semantic matching prong.

- **DTO Contracts:** Create `AtsScoreRequest` and `AtsScoreResponse` to handle the JSON payload containing the parsed resume, JD text, and explicit "must haves".
- **Vector Embeddings:** Use Spring AI's `EmbeddingModel` to generate dense vectors for both the JD and the candidate's parsed text.
- **Cosine Similarity:** Calculate the baseline semantic match percentage by calculating the cosine similarity between the two vectors.
- **Execution Flow:** If "Enable ATS?" is checked, this scoring runs concurrently alongside the extraction process. If triggered from the grid fallback button, it runs post-extraction.

## Part 3: LLM Logic - The Knockout Checklist (Backend)
The strict boolean logic evaluation prong.

- **Evaluator Agent:** Instruct the Groq LLM (via `ChatClient`) to act as a strict recruiter evaluating the resume against the JD.
- **Structured Schema:** Enforce a JSON array response mapping to a `ChecklistItem` POJO containing:
  - `parameter` (String): The specific requirement.
  - `type` (Enum): `HARD` (must-have) or `SOFT` (nice-to-have).
  - `is_met` (Boolean): True/False.
  - `evidence` (String): A 1-liner proving the decision from the resume.
- **Hard Parameter Inference:** If the user leaves "Any must haves?" blank, the LLM auto-infers them from the JD. Otherwise, it strictly evaluates against the explicit list provided by the user.
- **Scoring Aggregation:**
  - If any `HARD` parameter evaluates to `is_met: false`, the candidate is instantly `DISQUALIFIED` (score capped at 0).
  - If passed, a final score is calculated by combining the Cosine Similarity percentage and the percentage of `SOFT` items met.

## Part 4: LLM Logic - The Extractor Agent (Backend)
Upgrading the primary extraction phase to be context-aware.

- **Context-Aware Extraction:** When "Have Job Description?" is toggled and a JD is provided upfront, pass it into the primary resume parsing LLM (`Extractor Agent`) alongside the candidate's PDF text.
- **Targeted Skill Mining:** The Extractor Agent uses the JD to specifically look for and extract skills, experiences, or keywords that align with the role, rather than doing a "blind" generic extraction. 
- **Benefits:** This ensures the resulting extracted JSON natively highlights the most relevant candidate data, significantly improving the accuracy of the subsequent ATS Math and Checklist evaluation phases.