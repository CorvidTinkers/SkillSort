

# Sprint 1: SkillSort Core Foundation

**Duration:** 2-3 Days  
**Objective:** Establish the foundational React UI, implement the PDF ingestion module, and connect the core Agentic AI pipeline to extract user-defined fields.

## 🎯 Sprint Goals

### 1. Frontend UI Implementation (React)

Translate the STICH-generated UI designs into a functional React frontend, adhering strictly to the "Modern Teal & Mint" design document.

- **Dynamic Field Configuration UI (New Feature):** Build an interface allowing placement officers to define the specific fields they want the AI to extract (e.g., Domain, Skill Stack, Relevant Industry Experience, Research Work).
- **Core Review Grid Skeleton:** Initialize the main review grid UI.
- Ensure the layout is a full-width, edge-to-edge data grid.
- Implement sticky columns on the left side to freeze essential identifiers (like Student Name) while scrolling horizontally.

### 2. PDF Parsing Module

Focus entirely on extracting unstructured data from resumes to feed the AI pipeline.

- **File Upload Component:** Build the UI dropzone to accept PDF uploads.
- **Text Extraction:** Implement a robust PDF parser (via a library like `pdf2json` or `pdf-parse` in the backend) to extract raw text from the uploaded resumes.  
	*Note: Pre-existing Excel data matching/filling is explicitly deferred to Sprint 2 to reduce initial complexity.*

### 3. Core Agentic AI Pipeline

Build the "brain" of the application that transforms the raw PDF text into structured data.

- **Prompt/Agent Engineering:** Develop the system prompts required to instruct the AI to read the raw PDF text and search for the dynamically user-defined fields.
- **JSON Structuring:** Ensure the AI pipeline outputs the extracted data in a clean, predictable JSON format so it can be easily mapped to the React frontend data grid.
- **API Integration:** Connect the backend extraction pipeline to the chosen LLM API.

---

## 🚫 Out of Scope for Sprint 1

- Merging extracted PDF data with pre-existing Excel `.xlsx`/`.csv` files.
- Color-coding the data grid for "Suggested Changes" (amber), as this relies on having pre-existing data to edit.
- Exporting data to ATS or CSV.