package com.SkillSort.Backend.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonAnySetter;
import com.fasterxml.jackson.annotation.JsonAnyGetter;
import java.util.LinkedHashMap;
import java.util.Map;

public class StudentAttribute {

    @JsonProperty("student_name")
    private String studentName;

    @JsonProperty("confidence_score")
    private Double confidenceScore;

    private Map<String, Object> fields = new LinkedHashMap<>();

    public StudentAttribute() {}

    public String getStudentName() {
        return studentName;
    }

    public void setStudentName(String studentName) {
        this.studentName = studentName;
    }

    public Double getConfidenceScore() {
        return confidenceScore;
    }

    public void setConfidenceScore(Double confidenceScore) {
        this.confidenceScore = confidenceScore;
    }

    @JsonAnySetter
    public void setField(String key, Object value) {
        this.fields.put(key, value);
    }

    @JsonAnyGetter
    public Map<String, Object> getFields() {
        return fields;
    }
}
