package com.SkillSort.Backend.controller;

import com.SkillSort.Backend.config.UserContext;
import com.SkillSort.Backend.service.PdfService;
import com.SkillSort.Backend.service.ATSService;
import com.SkillSort.Backend.agent.ResumeExtractionAgent;
import com.SkillSort.Backend.agent.KnockoutAgent;
import com.SkillSort.Backend.exception.AiApiException;
import com.SkillSort.Backend.model.CandidateResult;
import com.SkillSort.Backend.model.ExtractedField;
import com.SkillSort.Backend.model.PdfExtractionResult;
import com.SkillSort.Backend.repository.DatabaseRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@RestController
@RequestMapping("/api/resumes")
public class ResumeController {

    @Autowired
    private PdfService pdfService;

    @Autowired
    private ResumeExtractionAgent extractionAgent;

    @Autowired
    private KnockoutAgent knockoutAgent;

    @Autowired
    private ATSService atsService;

    @Autowired
    private DatabaseRepository databaseRepository;

    private final ExecutorService executor = Executors.newCachedThreadPool();

    @PostMapping(value = "/extract", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public SseEmitter extractResumeData(
            @RequestPart("file") MultipartFile zipFile,
            @RequestParam("fields") List<String> fields,
            @RequestParam(value = "jobDescription", required = false) String jobDescription,
            @RequestParam(value = "checklist", required = false) List<String> checklist,
            @RequestParam(value = "enableAts", defaultValue = "false") boolean enableAts,
            @RequestParam(value = "enableKnockouts", defaultValue = "false") boolean enableKnockouts,
            @RequestParam(value = "modelProvider", defaultValue = "groq") String modelProvider,
            @RequestParam(value = "modelName", defaultValue = "llama-3.3-70b-versatile") String modelName) {
        
        SseEmitter emitter = new SseEmitter(180_000L); // 3-minute timeout
        
        // Capture authenticated user context on the request thread before invoking the async thread pool
        final String currentUserId = UserContext.getCurrentUser();
        
        executor.execute(() -> {
            try {
                // 1. Extract plain texts and raw bytes in-memory
                List<PdfExtractionResult> rawTexts = pdfService.extractFromZip(zipFile);
                
                // 2. Process each text through the AI Agents concurrently and stream
                for (PdfExtractionResult entry : rawTexts) {
                    // Task B: Asynchronous Local ATS Embedding Match
                    CompletableFuture<ExtractedField> atsFuture = null;
                    if (enableAts && jobDescription != null && !jobDescription.trim().isEmpty()) {
                        atsFuture = CompletableFuture.supplyAsync(
                                () -> atsService.calculateMatchScore(entry.rawText(), jobDescription), executor);
                    }
                    
                    // Task A: Synchronous LLM Extraction (Dynamic Provider)
                    Map<String, ExtractedField> extractedFields = extractionAgent.extractFields(entry.rawText(), fields, modelProvider, modelName);
                            

                    // Task C: Synchronous LLM Knockout Evaluation (Dynamic Provider)
                    Map<String, Boolean> knockoutResults = new HashMap<>();
                    if (enableKnockouts && checklist != null && !checklist.isEmpty()) {
                        knockoutResults = knockoutAgent.evaluateKnockoutCriteria(entry.rawText(), checklist, modelProvider, modelName);
                    }
                    
                    // Wait for the local ATS score to finish before sending the response
                    ExtractedField atsScore = atsFuture != null ? atsFuture.get() : null;
                    emitter.send(SseEmitter.event()
                        .name("candidate")
                        .data(new CandidateResult(
                            entry.id(),
                            entry.savedFileName(),
                            extractedFields,
                            atsScore,
                            knockoutResults
                        )));
                }
                
                emitter.complete();
            } catch (Exception e) {
                e.printStackTrace();
                
                try {
                    String errorType = "ERROR";
                    String message = e.getMessage() != null ? e.getMessage().replace("\"", "\\\"") : "Unknown Error";
                    
                    if (e instanceof AiApiException) {
                        errorType = ((AiApiException) e).getCode();
                        message = e.getMessage().replace("\"", "\\\"");
                    } else if (e.getCause() instanceof AiApiException) {
                        errorType = ((AiApiException) e.getCause()).getCode();
                        message = e.getCause().getMessage().replace("\"", "\\\"");
                    }
                    
                    emitter.send(SseEmitter.event()
                        .name("error")
                        .data("{\"type\": \"" + errorType + "\", \"message\": \"" + message + "\"}"));
                    emitter.complete(); // Gracefully close so frontend can process the error chunk
                } catch (Exception ex) {
                    // Fallback if unable to send error event
                    emitter.completeWithError(e);
                }
            }
        });
        
        return emitter;
    }

    @GetMapping("/list")
    public ResponseEntity<?> listSavedResumes() {
        String currentUserId = UserContext.getCurrentUser();
        if (currentUserId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Unauthorized"));
        }
        return ResponseEntity.ok(databaseRepository.getCandidatesByUser(currentUserId));
    }

    @GetMapping(value = "/blob/{id}")
    public ResponseEntity<?> getPdfBlob(@PathVariable("id") String id) {
        String currentUserId = UserContext.getCurrentUser();
        if (currentUserId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Unauthorized"));
        }

        // Security check: Verify candidate belongs to the logged-in SSO user
        String ownerId = databaseRepository.getCandidateOwner(id);
        if (ownerId == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Candidate not found"));
        }
        if (!ownerId.equals(currentUserId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access denied to this document"));
        }

        byte[] pdfBytes = databaseRepository.getDocumentContent(id);
        if (pdfBytes == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Document content missing"));
        }

        return ResponseEntity.ok()
                .contentLength(pdfBytes.length)
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdfBytes);
    }
}