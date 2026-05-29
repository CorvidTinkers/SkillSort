## 🔭 The "To Refine" Backlog (Post-Sprint 2)

**Focus:** Polish, verification, complex edge cases, and external integrations. Do not touch these until Sprint 2 is fully merged and bug-free.

* **Visual PDF Highlighting:** Mapping the AI's extracted text back to the exact X/Y coordinate bounding boxes using `PDFBox` to overlay HTML highlights on the original resume. *(Highly complex)*.


* **External Coding Profile Verification:** Scraping GitHub and LeetCode. Web scraping introduces massive latency, CAPTCHA blocks, and rate-limiting issues that will break the fast streaming pipeline.


* **OCR / Vision Pipeline for Scanned PDFs:** `PDFBox` cannot read image-based resumes. Fixing this requires routing the image to a multimodal LLM like GPT-4o or integrating Tesseract OCR.


* **Cell-Wise SSE Streaming:** Streaming AI data cell-by-cell instead of row-by-row, which will require heavy React state management refactoring.

* **Output quality issues** : current llm output is poor and ollama model is too slow

* **ATS output quality issues**: ATS measures also need to be refined 

* **Landing Page**: create a landing page 

* **Observablity lines**: need to add explanation paragrapghs 

* **dyanmic field selection** : We need to add functionality for selecting fields dynamically.
* **editable fields** : We need to add functionality for editing fields.
* **add loading bar in the reviewgrid so that we know it is doing something
* **UI overhaul** : 
- logout button 
- restart button 
- loading bar 
-  basically adding essentials and intutive updates 
- make rerun ats button and the kockout button functional
-if user token is old and backend says bad token error (need to implement this as well) automatic login screen 