package com.SkillSort.Backend.model;

public record PdfExtractionResult(
    String id,
    String originalFileName,
    String savedFileName,
    String rawText,
    byte[] pdfBytes
) {}
