# Backend Action Plan: Integrating Embedding Models (Sprint 2)

## 1. Analysis of Your Research
The research presented in `embeddingmodels.md` is excellent and perfectly aligns with modern, production-grade Spring Boot AI practices. 

- **Model Selection**: The recommendation of `sentence-transformers/all-MiniLM-L6-v2` is spot-on for our current stage. It strikes a great balance between speed, resource usage, and accuracy, making it perfect for rapid prototyping and local testing.
- **Framework Choice**: Using **LangChain4j** is the absolute best approach here. It abstracts away the heavy lifting and provides a unified interface. This means when we eventually move to a proper database in Sprint 3, we only have to change one line of code to swap the underlying storage engine.
- **Hybrid Execution**: Providing a way to toggle between Local and API-based execution is fantastic, as it allows offline testing while providing a pathway to use more powerful serverless models if needed.

## 2. Adapting for Sprint 2 (Volatile In-Memory + Hybrid API/Local Model)

Since we are deferring SQLite and user management to Sprint 3, we need to adapt the proposed code to be **100% volatile**. Additionally, per your request, we are renaming the service to `ATSService` and ensuring it supports both **HuggingFace API** and **Local In-Process Execution** via LangChain4j.

### Maven Dependencies
We will add the `langchain4j-embeddings-all-minilm-l6-v2` dependency, which bundles the `all-MiniLM-L6-v2` model in ONNX format so it runs directly inside the JVM locally, without needing any external Python servers.

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j</artifactId>
    <version>0.31.0</version>
</dependency>

<!-- For Hugging Face Serverless API Mode -->
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-hugging-face</artifactId>
    <version>0.31.0</version>
</dependency>

<!-- For 100% Local Offline Inference Mode -->
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-embeddings-all-minilm-l6-v2</artifactId>
    <version>0.31.0</version>
</dependency>
```

### The Volatile ATS Service Implementation

Here is the revised, pure in-memory `ATSService` that supports dynamically switching between the local model and the API model, while ensuring data is erased completely on app shutdown.

```java
package com.example.resumeparser.service;

import dev.langchain4j.data.embedding.Embedding;
import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.model.embedding.onnx.allminilml6v2.AllMiniLmL6V2EmbeddingModel;
import dev.langchain4j.model.huggingface.HuggingFaceEmbeddingModel;
import dev.langchain4j.output.Response;
import dev.langchain4j.store.embedding.inmemory.InMemoryEmbeddingStore;
import dev.langchain4j.store.embedding.EmbeddingMatch;
import dev.langchain4j.store.embedding.EmbeddingSearchRequest;
import dev.langchain4j.store.embedding.EmbeddingSearchResult;
import org.springframework.stereotype.Service;
import jakarta.annotation.PostConstruct;

import java.util.ArrayList;
import java.util.List;

@Service
public class ATSService {

    // Pure volatile RAM storage - erases entirely on app close
    private InMemoryEmbeddingStore<TextSegment> embeddingStore;
    private final String defaultModelId = "sentence-transformers/all-MiniLM-L6-v2";

    @PostConstruct
    public void init() {
        // Initialize an empty store in RAM every time the app starts
        this.embeddingStore = new InMemoryEmbeddingStore<>();
        System.out.println("Initialized fresh, volatile RAM vector store for Sprint 2.");
    }

    /**
     * Factory method to generate the model instance based on user preference.
     */
    private EmbeddingModel getEmbeddingModel(String mode, String userHfToken) {
        if ("API".equalsIgnoreCase(mode)) {
            // Uses HuggingFace Serverless API
            return HuggingFaceEmbeddingModel.builder()
                    .accessToken(userHfToken)
                    .modelId(defaultModelId)
                    .build();
        } else {
            // Uses 100% Offline Local Inference (ONNX Model bundled in dependency)
            return new AllMiniLmL6V2EmbeddingModel();
        }
    }

    public void batchEmbedAndStore(List<String> textChunks, String resumeId, String mode, String userHfToken) {
        EmbeddingModel model = getEmbeddingModel(mode, userHfToken);

        List<TextSegment> segments = new ArrayList<>();
        for (String chunk : textChunks) {
            segments.add(TextSegment.from(chunk, dev.langchain4j.data.document.Metadata.from("resumeId", resumeId)));
        }

        // Call the model (Local or API) to get embeddings
        Response<List<Embedding>> response = model.embedAll(segments);
        List<Embedding> embeddings = response.content();

        // Save into volatile RAM
        for (int i = 0; i < embeddings.size(); i++) {
            this.embeddingStore.add(embeddings.get(i), segments.get(i));
        }
        
        System.out.println("Stored " + embeddings.size() + " vectors in memory for resume: " + resumeId + " using mode: " + mode);
    }

    public List<EmbeddingMatch<TextSegment>> searchResumes(String jobDescription, int topK, String mode, String userHfToken) {
        EmbeddingModel model = getEmbeddingModel(mode, userHfToken);

        // Embed the job description query
        Embedding queryVector = model.embed(jobDescription).content();

        // Search the in-memory RAM vector store
        EmbeddingSearchRequest searchRequest = EmbeddingSearchRequest.builder()
                .queryEmbedding(queryVector)
                .maxResults(topK)
                .minScore(0.0) // We can tune this threshold later for stricter matches
                .build();

        EmbeddingSearchResult<TextSegment> result = this.embeddingStore.search(searchRequest);
        return result.matches();
    }
}
```

## 3. The Unified Architecture (Handling Everything Together)

You are absolutely right—splitting this into multiple endpoints would create a fragmented and sluggish user experience. When the user clicks "Proceed" in `UploadZone.tsx`, they are sending:
1. The Resume PDF
2. The Job Description (JD) text
3. The `checklist` array (Must Haves)

Here is how we handle parsing, ATS Vector Matching, and LLM Knockout criteria all in a **single unified flow** without timing out the browser.

### The Problem with a Standard Endpoint
If you do all of this synchronously in a standard `@PostMapping`, it will take 10-20 seconds per resume because of the LLM calls. The frontend will freeze, and the user will stare at a loading spinner.

### The Solution: Server-Sent Events (SSE)
Instead of a normal JSON response, the endpoint should return a stream of events. As the backend completes each phase of the pipeline, it pushes an update to `ReviewGrid.tsx` in real-time.

**The Unified Endpoint (`POST /api/ats/process`) Flow:**

1. **Phase 1: Fast Parsing** 
   - Backend receives the PDF, JD, and Must-Haves.
   - Extracts raw text using Apache PDFBox.
   - *SSE Event emitted*: `{ "status": "PARSED", "message": "Text extracted..." }`

2. **Phase 2: Local ATS Vector Matching (Instant)**
   - Backend chunks the text and uses our volatile `ATSService` to embed the resume and the JD.
   - Computes the `atsScore` (the % match).
   - *SSE Event emitted*: `{ "status": "ATS_SCORED", "score": 85 }`

3. **Phase 3: Structured Extraction (LLM)**
   - Backend sends the raw text to a generative LLM (like Gemini or OpenAI via LangChain4j) to extract the `StudentData` JSON (Skills, Domain, Experience).
   - *SSE Event emitted*: `{ "status": "EXTRACTED", "data": { ... } }`

4. **Phase 4: Knockout Evaluation (LLM)**
   - Backend takes the user's `checklist` (Must-Haves) and the Resume text, and asks the LLM: *"Does this candidate meet these strict criteria: [List]? Return YES/NO with a reason."*
   - *SSE Event emitted*: `{ "status": "KNOCKOUT_EVALUATED", "checklistResults": [...] }`
   - *Connection Closed.*

### Why this is the best approach
- **No separate endpoints**: The frontend makes exactly one request.
- **Perceived Speed**: The frontend populates instantly. First the name appears, then the ATS score pops in, then the skills populate, and finally the knockout checklist turns green or red—all happening live on the screen just like ChatGPT's typing effect.
- **LLM Integration**: The LLM parsing for the "Must Haves" naturally fits at the end of the pipeline as a background task that reports its results via the SSE stream when it finishes. 

## 4. Does this suffice for our plan?

**Yes, absolutely.** 
This strategy perfectly fulfills the updated requirements:
1. **Dynamic Execution**: Toggle between API and LOCAL embeddings instantly.
2. **`ATSService` Naming**: The naming matches the domain logic.
3. **Volatile Memory**: Avoids DB overhead for Sprint 2.
4. **Unified Processing**: By proposing an SSE stream pipeline, we process vector matching and generative LLM knockout criteria in one fluid motion, updating your `ReviewGrid` dynamically.
