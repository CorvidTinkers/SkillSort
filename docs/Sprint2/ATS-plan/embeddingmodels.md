# Hugging Face Embedding Models & Spring Boot Integration

This document outlines the best open-source embedding models for resume parsing and provides the Java Spring Boot (LangChain4j) code required to switch between API and Local modes.

## Recommended Embedding Models


| Model Name | Dimension | Context Window | Best Use Case / Notes |
| :--- | :--- | :--- | :--- |
| `sentence-transformers/all-MiniLM-L6-v2` | 384 | 512 tokens | Ultra-fast, lightweight (~90MB). Perfect for local execution on standard laptops. |
| `sentence-transformers/all-mpnet-base-v2` | 768 | 512 tokens | Higher accuracy than MiniLM but larger file size (~420MB). Great balanced choice. |
| `BAAI/bge-large-en-v1.5` | 1024 | 512 tokens | Top tier ranking on MTEB leaderboard. Best for precise semantic search. |
| `google/gemma-2b` (Feature Extraction) | 2048 | 8192 tokens | Massive context window. Use only via API for extracting long, multi-page resumes without chunking. |

---

## 1. Maven Dependencies (`pom.xml`)

Add these dependencies to your Spring Boot project to support both Serverless API calls and 100% offline local embeddings.

```xml
<!-- Core LangChain4j Ecosystem -->
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j</artifactId>
    <version>0.31.0</version>
</dependency>

<!-- For Hugging Face Serverless / BYOK API Mode -->
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-hugging-face</artifactId>
    <version>0.31.0</version>
</dependency>

<!-- For 100% Local Inference Mode (Bundles all-MiniLM-L6-v2 ONNX) -->
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-embeddings-all-minilm-l6-v2</artifactId>
    <version>0.31.0</version>
</dependency>
```

---

## 2. Spring Boot Implementation: Dynamic Embedding Service

This service dynamically switches execution logic based on the user's runtime application settings.

### User Settings DTO
```java
package com.example.resumeparser.dto;

public class EmbeddingSettings {
    private String mode; // "LOCAL" or "API"
    private String apiKey; // User's custom HF Token (optional if LOCAL)
    private String modelId; // e.g., "sentence-transformers/all-MiniLM-L6-v2"

    // Getters and Setters
    public String getMode() { return mode; }
    public void setMode(String mode) { this.mode = mode; }
    public String getApiKey() { return apiKey; }
    public void setApiKey(String apiKey) { this.apiKey = apiKey; }
    public String getModelId() { return modelId; }
    public void setModelId(String modelId) { this.modelId = modelId; }
}
```

### Embedding Router Service
```java
package com.example.resumeparser.service;

import com.example.resumeparser.dto.EmbeddingSettings;
import dev.langchain4j.data.embedding.Embedding;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.model.embedding.onnx.allminilml6v2.AllMiniLmL6V2EmbeddingModel;
import dev.langchain4j.model.huggingface.HuggingFaceEmbeddingModel;
import dev.langchain4j.output.Response;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class EmbeddingService {

    public List<Float> generateEmbedding(String text, EmbeddingSettings settings) {
        EmbeddingModel embeddingModel;

        if ("API".equalsIgnoreCase(settings.getMode())) {
            // Instantiate Cloud API Model (Serverless / BYOK)
            embeddingModel = HuggingFaceEmbeddingModel.builder()
                    .accessToken(settings.getApiKey())
                    .modelId(settings.getModelId() != null ? settings.getModelId() : "sentence-transformers/all-MiniLM-L6-v2")
                    .build();
        } else {
            // Instantiate 100% Offline Local Model
            // Note: This defaults to all-MiniLM-L6-v2 natively
            embeddingModel = new AllMiniLmL6V2EmbeddingModel();
        }

        // Generate vector embedding
        Response<Embedding> response = embeddingModel.embed(text);
        return response.content().vectorAsList();
    }
}
```

### REST Controller End-Point
```java
package com.example.resumeparser.controller;

import com.example.resumeparser.dto.EmbeddingSettings;
import com.example.resumeparser.service.EmbeddingService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/embeddings")
@CrossOrigin(origins = "*") // Allows React Frontend to connect smoothly
public class EmbeddingController {

    private final EmbeddingService embeddingService;

    public EmbeddingController(EmbeddingService embeddingService) {
        this.embeddingService = embeddingService;
    }

    @PostMapping("/extract")
    public ResponseEntity<List<Float>> extractEmbeddings(
            @RequestParam("text") String text,
            @RequestBody EmbeddingSettings settings) {
        
        List<Float> vector = embeddingService.generateEmbedding(text, settings);
        return ResponseEntity.ok(vector);
    }
}
```
# Hugging Face API & Pure Java In-Memory Vector Store

This document combines the Hugging Face Serverless API implementation with a pure Java In-Memory vector store. This architecture requires zero external software installations and compiles perfectly into a standalone desktop application.

---

## 1. Required Dependencies (`pom.xml`)

```xml
<!-- Core LangChain4j Infrastructure -->
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j</artifactId>
    <version>0.31.0</version>
</dependency>

<!-- Hugging Face Serverless API & BYOK Client Connection -->
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-hugging-face</artifactId>
    <version>0.31.0</version>
</dependency>
```

---

## 2. Combined Service Implementation

This service initializes an in-memory vector database backed up to a local text-based JSON file. It connects directly to the Hugging Face Serverless API to process texts using the optimal **batching mantra** (sending multiple chunks in one network call to save your free tier quota).

```java
package com.example.resumeparser.service;

import dev.langchain4j.data.embedding.Embedding;
import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.model.huggingface.HuggingFaceEmbeddingModel;
import dev.langchain4j.output.Response;
import dev.langchain4j.store.embedding.inmemory.InMemoryEmbeddingStore;
import dev.langchain4j.store.embedding.EmbeddingMatch;
import dev.langchain4j.store.embedding.EmbeddingSearchRequest;
import dev.langchain4j.store.embedding.EmbeddingSearchResult;
import org.springframework.stereotype.Service;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;

import java.io.File;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;

@Service
public class ResumeEmbeddingService {

    private InMemoryEmbeddingStore<TextSegment> embeddingStore;
    private final Path storagePath;
    private final String modelId = "sentence-transformers/all-MiniLM-L6-v2";

    public ResumeEmbeddingService() {
        // Automatically creates a hidden configuration folder in the user's OS home directory
        String userHome = System.getProperty("user.home");
        this.storagePath = Paths.get(userHome, ".resumeparser", "vector_database.json");
    }

    @PostConstruct
    public void init() {
        File file = storagePath.toFile();
        if (file.exists()) {
            // Read vectors back into RAM instantly on app startup
            this.embeddingStore = InMemoryEmbeddingStore.fromFile(storagePath);
            System.out.println("Loaded vector storage from disk.");
        } else {
            file.getParentFile().mkdirs();
            this.embeddingStore = new InMemoryEmbeddingStore<>();
            System.out.println("Initialized fresh RAM vector store.");
        }
    }

    /**
     * The Batching Mantra: Takes text chunks, wraps them in a single batch, 
     * calls Hugging Face once, and saves them to the In-Memory RAM DB.
     */
    public void batchEmbedAndStore(List<String> textChunks, String resumeId, String userHfToken) {
        // 1. Setup the API client with the dynamic token provided by the user
        EmbeddingModel client = HuggingFaceEmbeddingModel.builder()
                .accessToken(userHfToken)
                .modelId(this.modelId)
                .build();

        // 2. Wrap strings into LangChain4j Text Segments
        List<TextSegment> segments = new ArrayList<>();
        for (String chunk : textChunks) {
            // Attach the resume ID as a metadata tag to know who this vector belongs to later
            segments.add(TextSegment.from(chunk, dev.langchain4j.data.document.Metadata.from("resumeId", resumeId)));
        }

        // 3. Fire a single batch API request over the network (counts as 1 API call)
        Response<List<Embedding>> response = client.embedAll(segments);
        List<Embedding> embeddings = response.content();

        // 4. Save the generated vector values into RAM storage
        for (int i = 0; i < embeddings.size(); i++) {
            this.embeddingStore.add(embeddings.get(i), segments.get(i));
        }
        
        // 5. Trigger a quick backup to disk
        flushToDisk();
    }

    /**
     * Search the In-Memory RAM database using a job description string
     */
    public List<EmbeddingMatch<TextSegment>> searchResumes(String jobDescription, int topK, String userHfToken) {
        EmbeddingModel client = HuggingFaceEmbeddingModel.builder()
                .accessToken(userHfToken)
                .modelId(this.modelId)
                .build();

        // Convert the search text into a query vector via API
        Embedding queryVector = client.embed(jobDescription).content();

        // Search the RAM records instantly using mathematical Cosine Similarity
        EmbeddingSearchRequest searchRequest = EmbeddingSearchRequest.builder()
                .queryEmbedding(queryVector)
                .maxResults(topK)
                .minScore(0.0)
                .build();

        EmbeddingSearchResult<TextSegment> result = this.embeddingStore.search(searchRequest);
        return result.matches();
    }

    @PreDestroy
    public void flushToDisk() {
        // Safely converts the RAM database state into a local text JSON file
        this.embeddingStore.serializeToFile(storagePath);
        System.out.println("Flushed RAM state to: " + storagePath);
    }
}
```
