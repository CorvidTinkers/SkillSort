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

        SseEmitter emitter = new SseEmitter(0L); 
        // Capture authenticated user context on the request thread before invoking the
        // async thread pool
        final String currentUserId = UserContext.getCurrentUser();
        final Long runId = databaseRepository.createRun(currentUserId);

        executor.execute(() -> {
            try {
                // 1. Extract plain texts and raw bytes in-memory
                List<PdfExtractionResult> rawTexts = pdfService.extractFromZip(zipFile);

                // 2. Process each text through the AI Agents concurrently and stream
                for (PdfExtractionResult entry : rawTexts) {
                    try {
                        // Pre-emptively save the candidate and PDF blob to the database
                        // so the UI can immediately fetch the PDF when the event is received.
                        databaseRepository.saveCandidate(entry.id(), runId, currentUserId, entry.savedFileName(), entry.rawText(),
                                null);
                        databaseRepository.saveDocument(entry.id(), entry.pdfBytes(), entry.pdfBytes().length);

                        // Task B: Asynchronous Local ATS Embedding Match
                        CompletableFuture<ExtractedField> atsFuture = null;
                        if (enableAts && jobDescription != null && !jobDescription.trim().isEmpty()) {
                            atsFuture = CompletableFuture.supplyAsync(
                                    () -> atsService.calculateMatchScore(entry.rawText(), jobDescription), executor);
                        }

                        // Task A: Synchronous LLM Extraction (Dynamic Provider)
                        Map<String, ExtractedField> extractedFields = extractionAgent.extractFields(entry.rawText(), fields,
                                modelProvider, modelName);
                                
                        if (extractedFields != null) {
                            for (Map.Entry<String, ExtractedField> fieldEntry : extractedFields.entrySet()) {
                                databaseRepository.saveAttribute(entry.id(), fieldEntry.getKey(), fieldEntry.getValue().value(), fieldEntry.getValue().confidence());
                            }
                        }

                        // Task C: Synchronous LLM Knockout Evaluation (Dynamic Provider)
                        Map<String, Boolean> knockoutResults = new HashMap<>();
                        if (enableKnockouts && checklist != null && !checklist.isEmpty()) {
                            knockoutResults = knockoutAgent.evaluateKnockoutCriteria(entry.rawText(), checklist,
                                    modelProvider, modelName);
                                    
                            if (knockoutResults != null) {
                                for (Map.Entry<String, Boolean> koEntry : knockoutResults.entrySet()) {
                                    databaseRepository.saveKnockout(entry.id(), koEntry.getKey(), koEntry.getValue());
                                }
                            }
                        }

                        // Wait for the local ATS score to finish before sending the response
                        ExtractedField atsScore = atsFuture != null ? atsFuture.get() : null;

                        // Update ATS score in the database if available
                        if (atsScore != null && atsScore.value() != null) {
                            try {
                                double parsedScore = Double.parseDouble(atsScore.value());
                                // The frontend needs ATS score to be persisted for the /list endpoint
                                databaseRepository.updateCandidateAtsScore(entry.id(), parsedScore);
                            } catch (NumberFormatException e) {
                                System.err.println("Failed to parse ATS score: " + atsScore.value());
                            }
                        }
                        emitter.send(SseEmitter.event()
                                .name("candidate")
                                .data(new CandidateResult(
                                        entry.id(),
                                        entry.savedFileName(),
                                        extractedFields,
                                        atsScore,
                                        knockoutResults)));
                    } catch (Exception itemException) {
                        itemException.printStackTrace();
                        try {
                            emitter.send(SseEmitter.event()
                                    .name("error")
                                    .data("{\"type\": \"ITEM_ERROR\", \"fileName\": \"" + entry.savedFileName() + "\", \"message\": \"Failed to extract resume\"}"));
                        } catch (Exception emitterEx) {
                            System.err.println("Emitter is dead. Halting batch processing.");
                            break;
                        }
                    }
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

    @GetMapping("/past-runs")
    public ResponseEntity<?> getPastRuns() {
        String currentUserId = UserContext.getCurrentUser();
        if (currentUserId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Unauthorized"));
        }
        return ResponseEntity.ok(databaseRepository.getHistoryByUser(currentUserId));
    }

    @GetMapping("/fetch-run")
    public ResponseEntity<?> fetchRun(@RequestParam("runId") Long runId) {
        String currentUserId = UserContext.getCurrentUser();
        if (currentUserId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Unauthorized"));
        }
        System.out.println("Fetching run for user: " + currentUserId + " and run id: " + runId+ " first few records are:"+databaseRepository.getCandidatesByRun(currentUserId, runId));
        return ResponseEntity.ok(databaseRepository.getCandidatesByRun(currentUserId, runId));
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