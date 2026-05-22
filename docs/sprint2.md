Got it, bro. Stripping out the developer assignments makes it a much cleaner, unified checklist. You can just hand this straight to the team and tackle it feature by feature.

Here is the finalized, master-coder action plan structured purely as a to-do list.

---

## 🚀 Sprint 2: The "Brain, Backbone & Control" Sprint

**Duration:** 3-5 Days

**Objective:** Establish database persistence, close security loopholes, implement the ATS scoring engine, and give the user total control over extraction and editing.

### 1. Dynamic Control & Editing

* 
**Dynamic Field Config (UI & API):** Implement the frontend interface allowing users to define custom extraction fields (e.g., "Skill Stack", "Domain"). Update the backend Spring AI `SystemMessage` to dynamically ingest these parameters before hitting the LLM.


* 
**Editable Data Grid:** Upgrade the TanStack Table to support cell-level editing. The "human-in-the-loop" core premise relies entirely on placement officers being able to manually correct the AI's data before exporting.



### 2. Explainable AI & ATS Engine

* 
**Observability Strings:** Update the Spring AI `StructuredOutputConverter` schema. Alongside `value` and `confidence`, force the LLM to return a short `reasoning` string (e.g., *"Extracted from Project X bullet points"*). Display this as a tooltip in the React grid.


* 
**Job Description (JD) Input:** Add a text area in the React frontend where placement officers can paste an upcoming company's specific role requirements.


* 
**The ATS Simulation:** Cross-reference the extracted student JSON against the user-provided JD to generate an ATS Match Score. Add this score as a sortable column in the grid.



### 3. Database & Security

* 
**SQLite Persistence:** Implement JPA Entities for `Student` and `ExtractedAttribute`. Save the validated, human-edited JSON data to your SQLite database so it survives page refreshes.


* 
**Fix the PDF Vulnerability:** Stop leaving uncompressed `.pdf` files exposed on the host filesystem. Refactor `PdfService.java` to either immediately delete the physical file after `PagePdfDocumentReader` finishes, or store it securely as a `BLOB` in the database.


