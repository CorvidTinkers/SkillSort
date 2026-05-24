# SkillSort: AI-Powered Attribute Enrichment 

SkillSort is a web-based B2B platform designed to solve a major administrative bottleneck for college placement cells: standardizing highly unstructured data (resumes) into a clean, searchable database. By automating data transcription and providing an ATS-scoring layer, SkillSort transitions placement officers from manual data entry to a strategic, supervisory role.

## 🚀 Core Features

* **Bulk Resume Parsing:** Drag-and-drop zone accepting `.zip` files of PDF resumes or `.xlsx`/`.csv` files containing resume URLs.
* **Dynamic Attribute Extraction:** Placement officers can define specific extraction fields via the UI (e.g., domain, skill stack, industry experience).
* **Human-in-the-Loop Review Grid:** A powerful, edge-to-edge data grid to review parsed data. It features sticky columns (Student Name, Resume Link) to maintain context while scrolling.
* **AI Confidence Color-Coding:** Builds user trust by highlighting data states:
* **ATS Simulation Engine:** Cross-references the extracted student JSON data against a pasted Job Description to generate a simulated "ATS Match Score".
* **External Coding Profile Verification:** Automatically extracts URLs for developer profiles (GitHub, LeetCode, etc.), scrapes live metrics, and populates verified stats as distinct columns.
* **Seamless Export:** One-click download to CSV, Excel, or ATS integrations to create highly specialized candidate shortlists.

## 🛠️ Tech Stack

**Frontend (Client)**
* **Framework:** React 
* **Table Library:** TanStack Table or AG Grid (for high-density data rendering) 
* **Styling:** Tailwind CSS using the "Modern Teal & Mint" structural palette 
* **Typography:** Inter or Roboto (optimized for dense data interfaces) 

**Backend (Server & AI Pipeline)**
* **Framework:** Java Spring Boot 
* **PDF Extraction:** Apache PDFBox (or similar Java-based parser) 
* **AI Integration:** Spring Boot HTTP client (`RestTemplate` or `WebClient`) routing to an LLM API 
* **Data Handling:** Jackson (for parsing and structuring the LLM's JSON output) 

# ⚙️ Getting Started

### Prerequisites
- Node.js (v18+)
- Java Development Kit (JDK 17+)
- Maven
- Docker (optional, for containerized deployment)
- An active API key for your chosen LLM provider

### Backend Setup
```bash
# Navigate to backend directory
cd Backend/Backend

# Verify Java version (should be 17 or higher)
java -version

# Build and run the Spring Boot application
./mvnw spring-boot:run
```

### Frontend Setup
```bash
# From project root, go to the frontend directory
cd ../../frontend

# Install dependencies and start the development server
npm install
npm run dev
```

### Environment Variables
Create a `.env` file in the `Backend/Backend` directory containing:
```
GROQ_API_KEY=your_api_key_here
```
Ensure the key is loaded by the Spring application at startup.
