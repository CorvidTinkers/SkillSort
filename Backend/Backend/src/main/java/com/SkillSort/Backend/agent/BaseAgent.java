package com.SkillSort.Backend.agent;

import org.springframework.ai.chat.client.ChatClient;

import com.SkillSort.Backend.exception.AiApiException;
import com.SkillSort.Backend.config.ChatModelFactory;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
public abstract class BaseAgent {

    protected final ChatModelFactory chatModelFactory;

    public BaseAgent(ChatModelFactory chatModelFactory) {
        this.chatModelFactory = chatModelFactory;
    }

    protected abstract String getUserPrompt(Object... params);
    
    public static class ParseResult<T> {
        public final Map<String, T> successfulFields = new HashMap<>();
        public final List<String> failedFields = new ArrayList<>();
    }

    private <T> ParseResult<T> parseJsonResponse(
            String rawJson, 
            List<String> expectedFields, 
            Function<JsonNode, T> fieldMapper) {
        
        ParseResult<T> result = new ParseResult<>();
        result.failedFields.addAll(expectedFields);
        
        if (rawJson == null) return result;

        try {
            ObjectMapper mapper = new ObjectMapper();
            
            if (rawJson.startsWith("```json")) rawJson = rawJson.substring(7, rawJson.lastIndexOf("```"));
            else if (rawJson.startsWith("```")) rawJson = rawJson.substring(3, rawJson.lastIndexOf("```"));
            
            JsonNode rootNode = mapper.readTree(rawJson);
            
            for (String reqField : expectedFields) {
                try {
                    JsonNode fieldNode = rootNode.get(reqField);
                    if (fieldNode != null && !fieldNode.isNull()) {
                        T mappedValue = fieldMapper.apply(fieldNode);
                        if (mappedValue != null) {
                            result.successfulFields.put(reqField, mappedValue);
                            result.failedFields.remove(reqField);
                        }
                    }
                } catch (Exception fieldEx) {
                    System.err.println("Failed to map field: " + reqField);
                }
            }
        } catch (Exception parseEx) {
            System.err.println("Failed to parse overall JSON tree.");
        }
        
        return result;
    }

    protected String executePromptForString(String systemPrompt, String userPrompt, String provider, String modelName) {
        try {
            ChatClient chatClient = chatModelFactory.createChatClient(provider, modelName);
            return chatClient.prompt()
                    .system(systemPrompt)
                    .user(userPrompt)
                    .call()
                    .content();
        } catch (Exception e) {
            handleException(e);
            return null;
        }
    }

    protected <T> Map<String, T> executeExtraction(
            String baseSystemPrompt, 
            String userPrompt, 
            List<String> expectedFields, 
            Function<JsonNode, T> fieldMapper,
            T defaultValue,
            String provider, 
            String modelName) {

        int maxAttempts = 3;
        int attempt = 0;
        
        List<String> currentMissingFields = new ArrayList<>(expectedFields);
        Map<String, T> finalResult = new HashMap<>();

        while (attempt < maxAttempts && !currentMissingFields.isEmpty()) {
            System.out.println("Attempt: " + attempt+ "for resume starting like: " + userPrompt.substring(0, Math.min(userPrompt.length(),44))+"starting time: " + System.currentTimeMillis());
            long startingtime = System.currentTimeMillis();
            String fieldsStr = String.join(", ", currentMissingFields);
            String retryInstruction = attempt > 0 
                ? "\n\nCRITICAL: You forgot these fields. You must generate ONLY these missing fields now: " + fieldsStr 
                : "\n\nPlease extract: " + fieldsStr;
            
            String finalSystemPrompt = baseSystemPrompt + retryInstruction;

            String rawJson = executePromptForString(finalSystemPrompt, userPrompt, provider, modelName);

            System.out.println("result time:" + System.currentTimeMillis()+ " time differnece: " + (System.currentTimeMillis()-startingtime));
            ParseResult<T> parseResult = parseJsonResponse(rawJson, currentMissingFields, fieldMapper);
            
            finalResult.putAll(parseResult.successfulFields);
            currentMissingFields = parseResult.failedFields;
            System.out.println("attempt end time difference: " + (System.currentTimeMillis()-startingtime));     
            attempt++;
        }
        
        for (String field : expectedFields) {
            finalResult.putIfAbsent(field, defaultValue);
        }
        System.out.println("ending time: " + System.currentTimeMillis());
        return finalResult;
    }

    protected void handleException(Exception e) {
        String message = e.getMessage() != null ? e.getMessage().toLowerCase() : "";
        if (message.contains("429") || message.contains("rate limit") || message.contains("too many requests")) {
            throw new AiApiException("RATE_LIMIT_EXCEEDED", "Rate limit exceeded. Please try again later.");
        }
        if (message.contains("token limit") || message.contains("context length") || message.contains("maximum context")) {
            throw new AiApiException("TOKEN_LIMIT_EXCEEDED", "Token limit exceeded. Please reduce the input size.");
        }
        throw new AiApiException("AI_API_ERROR", "An error occurred while communicating with the AI service: " + e.getMessage());
    }
}
