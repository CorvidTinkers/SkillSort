package com.SkillSort.Backend.controller;

import com.SkillSort.Backend.service.PdfService;
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
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@RestController
@RequestMapping("/api/resumes")
public class ResumeController {

    @Autowired
    private PdfService pdfService;

    @Autowired
    private ExtractionAgent extractionAgent;

    private final ExecutorService executor = Executors.newCachedThreadPool();

    @PostMapping(value = "/extract", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public SseEmitter extractResumeData(
            @RequestPart("file") MultipartFile zipFile,
            @RequestParam("fields") List<String> fields) {
        
        SseEmitter emitter = new SseEmitter(180_000L); // 3-minute timeout
        
        executor.execute(() -> {
            try {
                // 1. Extract plain texts and save files to backend disk
                List<PdfExtractionResult> rawTexts = pdfService.extractFromZip(zipFile);
                
                // 2. Process each text through the AI Agent sequentially and stream
                for (PdfExtractionResult entry : rawTexts) {
                    Map<String, ExtractedField> extractedFields = extractionAgent.extractFields(entry.rawText(), fields);
                    
                    CandidateResult result = new CandidateResult(
                        entry.id(),
                        entry.originalFileName(),
                        extractedFields
                    );
                    
                    // Attach the persistent backend resume URL inside the extracted data manually
                    // or simply pass the URL as part of the frontend structure processing.
                    // We'll map "resumeUrl" dynamically in the frontend using the ID and original fileName.
                    // Actually, let's just send it via SSE and let frontend build the URL based on savedFileName.
                    // But CandidateResult doesn't have savedFileName. We will use id.
                    // Let's pass the saved filename to the client.
                    // wait, CandidateResult record takes UUID.
                    // we can just tell frontend to fetch /resumes/savedFileName
                    
                    emitter.send(SseEmitter.event()
                        .name("candidate")
                        .data(new CandidateResult(
                            entry.id(),
                            entry.savedFileName(), // overriding fileName with savedFileName so frontend knows exactly where to fetch it
                            extractedFields
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