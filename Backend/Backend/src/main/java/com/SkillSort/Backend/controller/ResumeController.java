package com.SkillSort.Backend.controller;

import com.SkillSort.Backend.config.UserContext;
import com.SkillSort.Backend.service.PdfService;
import com.SkillSort.Backend.service.ATSService;
import com.SkillSort.Backend.agent.ExtractionAgent;
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
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@RestController
@RequestMapping("/api/resumes")
public class ResumeController {

    @Autowired
    private PdfService pdfService;

    @Autowired
    private ExtractionAgent extractionAgent;

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
            @RequestParam(value = "checklist", required = false) List<String> checklist) {
        
        SseEmitter emitter = new SseEmitter(180_000L); // 3-minute timeout
        
        // Capture authenticated user context on the request thread before invoking the async thread pool
        final String currentUserId = UserContext.getCurrentUser();
        
        executor.execute(() -> {
            try {
                // 1. Extract plain texts and raw bytes in-memory
                List<PdfExtractionResult> rawTexts = pdfService.extractFromZip(zipFile);
                
                // 2. Process each text through the AI Agents concurrently and stream
                for (PdfExtractionResult entry : rawTexts) {
                    
                    // Task A: Asynchronous LLM Extraction (Groq)
                    CompletableFuture<Map<String, ExtractedField>> extractionFuture = CompletableFuture.supplyAsync(
                            () -> extractionAgent.extractFields(entry.rawText(), fields), executor);
                            
                    // Task B: Asynchronous Local ATS Embedding Match
                    CompletableFuture<ExtractedField> atsFuture = CompletableFuture.supplyAsync(
                            () -> atsService.calculateMatchScore(entry.rawText(), jobDescription), executor);
                            
                    // Task C: Asynchronous LLM Knockout Evaluation
                    CompletableFuture<Map<String, Boolean>> knockoutFuture = CompletableFuture.supplyAsync(
                            () -> extractionAgent.evaluateKnockoutCriteria(entry.rawText(), checklist), executor);
                            
                    // Wait for all to complete
                    CompletableFuture.allOf(extractionFuture, atsFuture, knockoutFuture).join();
                    
                    Map<String, ExtractedField> extractedFields = extractionFuture.get();
                    ExtractedField atsScore = atsFuture.get();
                    Map<String, Boolean> knockoutResults = knockoutFuture.get();
                    
                    Double atsScoreVal = 50.0;
                    try {
                        atsScoreVal = Double.parseDouble(atsScore.value().replace("%", "").trim());
                    } catch (Exception ignored) {}

                    // 3. Save directly to SQLite database partitioned under current SSO user
                    databaseRepository.saveCandidate(entry.id(), currentUserId, entry.savedFileName(), entry.rawText(), atsScoreVal);
                    databaseRepository.saveDocument(entry.id(), entry.pdfBytes(), entry.pdfBytes().length);

                    for (Map.Entry<String, ExtractedField> fieldEntry : extractedFields.entrySet()) {
                        databaseRepository.saveAttribute(
                            entry.id(), 
                            fieldEntry.getKey(), 
                            fieldEntry.getValue().value(), 
                            fieldEntry.getValue().confidence()
                        );
                    }

                    for (Map.Entry<String, Boolean> koEntry : knockoutResults.entrySet()) {
                        databaseRepository.saveKnockout(entry.id(), koEntry.getKey(), koEntry.getValue());
                    }

                    // 4. Stream response to frontend
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
                emitter.completeWithError(e);
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

    @GetMapping(value = "/blob/{id}", produces = MediaType.APPLICATION_PDF_VALUE)
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