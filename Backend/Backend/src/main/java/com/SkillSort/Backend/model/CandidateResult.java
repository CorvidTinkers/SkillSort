package com.SkillSort.Backend.model;

import java.util.Map;

public record CandidateResult(
    String id,
    String fileName,
    Map<String, ExtractedField> extractedData
) {}
