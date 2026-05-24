package com.SkillSort.Backend.controller;

import com.SkillSort.Backend.service.PdfService;
import com.SkillSort.Backend.service.ATSService;
import com.SkillSort.Backend.agent.ExtractionAgent;
import com.SkillSort.Backend.model.CandidateResult;
import com.SkillSort.Backend.model.ExtractedField;
import com.SkillSort.Backend.model.PdfExtractionResult;
import org.springframework.beans.factory.annotation.Autowired;
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

    private final ExecutorService executor = Executors.newCachedThreadPool();

    @PostMapping(value = "/extract", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public SseEmitter extractResumeData(
            @RequestPart("file") MultipartFile zipFile,
            @RequestParam("fields") List<String> fields,
            @RequestParam(value = "jobDescription", required = false) String jobDescription,
            @RequestParam(value = "checklist", required = false) List<String> checklist) {
        
        SseEmitter emitter = new SseEmitter(180_000L); // 3-minute timeout
        
        executor.execute(() -> {
            try {
                // 1. Extract plain texts and save files to backend disk
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
                    
                    emitter.send(SseEmitter.event()
                        .name("candidate")
                        .data(new CandidateResult(
                            entry.id(),
                            entry.savedFileName(), // overriding fileName with savedFileName so frontend knows exactly where to fetch it
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
}