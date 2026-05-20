package com.SkillSort.Backend.controller;

import com.SkillSort.Backend.service.PdfService;
import com.SkillSort.Backend.agent.ExtractionAgent;
import com.SkillSort.Backend.model.StudentAttribute;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/resumes")
public class ResumeController {

    @Autowired
    private PdfService pdfService;

    @Autowired
    private ExtractionAgent extractionAgent;

    @PostMapping(value = "/extract", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> extractResumeData(
            @RequestPart("file") MultipartFile file,
            @RequestParam("fields") List<String> fields) {
        try {
            // 1. Extract plain text from multi-part file content
            String rawText = pdfService.extractText(file);
            
            // 2. Direct plain text and schema fields straight to the Agent
            StudentAttribute result = extractionAgent.extractFields(rawText, fields);
            
            // 3. Return structured json output straight to the review grid
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(result);
                    
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body("{\"error\": \"Processing failed: " + e.getMessage() + "\"}");
        }
    }
}