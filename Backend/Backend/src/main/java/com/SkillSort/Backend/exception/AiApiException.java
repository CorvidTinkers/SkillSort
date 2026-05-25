package com.SkillSort.Backend.exception;

public class AiApiException extends RuntimeException {
    private final String code;
    
    public AiApiException(String code, String message) {
        super(message);
        this.code = code;
    }
    
    public String getCode() {
        return code;
    }
}
