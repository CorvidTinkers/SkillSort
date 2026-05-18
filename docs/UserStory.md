
# Epic: The Candidate Shortlisting & ATS Pre-Screening Hub

### 📖 The Epic Statement

> **As a** college placement officer,  
> **I want to** bulk-upload student resumes to automatically parse and enrich candidate attributes using AI, specifically extracting relevant skills and programming proficiencies, and then test them against a simulated ATS layer,  
> **So that** I can easily identify what each student is uniquely qualified for and generate specialized, highly qualified candidate shortlists for upcoming company roles.

---

### 🧩 Breaking it down into User Stories

To actually build this Epic, you will tackle these smaller stories in your upcoming sprints:

- **User Story 1: Targeted Attribute Extraction**  
    *Requirement:* I want the ability to define specific extraction fields via the UI (like "programming proficiency", "skill stack", or "relevant industry experience").  
    *Why:* So the core Agentic AI pipeline knows exactly what specific technical metrics to pull from the highly unstructured resume data.

- **User Story 2: The Job Description (JD) Input**  
    *Requirement:* I want a text area in the UI where I can paste an upcoming company's specific Job Description and role requirements.  
    *Why:* So the system has a baseline metric to compare the students against.

- **User Story 3: The ATS Simulation Engine**  
    *Requirement:* I want the AI to cross-reference the extracted student JSON data against the provided Job Description to generate a simple "ATS Match Score" (e.g., 85% match).  
    *Why:* So I can instantly know if a candidate's resume would survive an automated corporate screening layer.

- **User Story 4: Triage & Filtering**  
    *Requirement:* I want robust column headers in the Review Grid that allow filtering based on the new ATS match score and programming skills.  
    *Why:* So I can instantly triage my review process and export a highly specialized list of just the students who are qualified for that specific company.

- **User Story 5: External Coding Profile Verification**  
    *Requirement:* I want the system to automatically extract URLs for developer profiles (e.g., GitHub, LeetCode, Codeforces, HackerRank) from the resume text, scrape those external links for live metrics (like repository count, commit activity, or competitive programming ratings), and populate these verified stats as distinct columns in the review grid.  
    *Why:* So I can validate a student's self-reported programming proficiencies with objective, real-world data, ensuring that my final candidate shortlist is backed by proven coding capability rather than just resume padding

---
