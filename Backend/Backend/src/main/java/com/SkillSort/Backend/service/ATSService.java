package com.SkillSort.Backend.service;

import com.SkillSort.Backend.model.ExtractedField;
import dev.langchain4j.data.embedding.Embedding;
import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.model.embedding.onnx.allminilml6v2.AllMiniLmL6V2EmbeddingModel;
import dev.langchain4j.store.embedding.EmbeddingMatch;
import dev.langchain4j.store.embedding.EmbeddingSearchRequest;
import dev.langchain4j.store.embedding.EmbeddingSearchResult;
import dev.langchain4j.store.embedding.inmemory.InMemoryEmbeddingStore;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class ATSService {

    private final EmbeddingModel embeddingModel;

    public ATSService() {
        // Initialize the local ONNX model bundles in the dependency
        this.embeddingModel = new AllMiniLmL6V2EmbeddingModel();
        System.out.println("Initialized local ATSService with all-MiniLM-L6-v2 ONNX Model.");
    }

    public ExtractedField calculateMatchScore(String resumeText, String jobDescription) {
        System.out.println("Calculating match score... for resume :" + resumeText.substring(0, 20));
        if (jobDescription == null || jobDescription.trim().isEmpty()) {
            return new ExtractedField("0", "low"); // Default score if no JD
        }

        try {
            // Fresh volatile RAM store for this single ATS calculation
            InMemoryEmbeddingStore<TextSegment> store = new InMemoryEmbeddingStore<>();

            // Naive text chunking
            String[] chunks = resumeText.split("\n\n|\n");
            List<TextSegment> segments = new ArrayList<>();
            for (String chunk : chunks) {
                String trimmed = chunk.trim();
                if (trimmed.length() > 20) { // Keep meaningful chunks
                    segments.add(TextSegment.from(trimmed));
                }
            }

            if (segments.isEmpty()) {
                return new ExtractedField("0", "low");
            }

            // Embed resume chunks and store in RAM
            List<Embedding> embeddings = embeddingModel.embedAll(segments).content();
            for (int i = 0; i < embeddings.size(); i++) {
                store.add(embeddings.get(i), segments.get(i));
            }

            // Embed the Job Description query
            Embedding queryEmbedding = embeddingModel.embed(jobDescription).content();

            // Search for top 5 matching chunks from the resume
            EmbeddingSearchRequest searchRequest = EmbeddingSearchRequest.builder()
                    .queryEmbedding(queryEmbedding)
                    .maxResults(5)
                    .minScore(0.0)
                    .build();

            EmbeddingSearchResult<TextSegment> result = store.search(searchRequest);
            List<EmbeddingMatch<TextSegment>> matches = result.matches();

            if (matches.isEmpty()) {
                return new ExtractedField("0", "low");
            }

            // Calculate aggregate similarity score
            double totalScore = 0.0;
            for (EmbeddingMatch<TextSegment> match : matches) {
                totalScore += match.score(); // Cosine similarity
            }
            
            double averageScore = totalScore / matches.size();
            
            // Curve the cosine similarity to a more realistic 0-100 percentage distribution
            double curvedScore = (averageScore - 0.4) / (0.9 - 0.4) * 100;
            int finalScore = (int) Math.round(Math.max(0, Math.min(100, curvedScore)));
            System.out.println("Calculated match score: " + finalScore);
            String confidence = finalScore >= 80 ? "high" : finalScore >= 60 ? "medium" : "low";
            return new ExtractedField(String.valueOf(finalScore), confidence);
            
        } catch (Exception e) {
            e.printStackTrace();
            return new ExtractedField("0", "low");
        }
    }
}
