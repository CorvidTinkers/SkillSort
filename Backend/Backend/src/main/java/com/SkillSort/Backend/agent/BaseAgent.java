package com.SkillSort.Backend.agent;

import com.SkillSort.Backend.exception.AiApiException;
import com.SkillSort.Backend.config.ChatModelFactory;
import dev.langchain4j.model.chat.ChatModel;
import dev.langchain4j.service.AiServices;
import com.fasterxml.jackson.databind.ObjectMapper;

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

    protected <T, V> Map<String, V> extractFields(
            Class<T> serviceClass,
            String provider,
            String modelName,
            Function<T, Map<String, ?>> extractionCall,
            Class<V> targetValueType,
            List<String> expectedKeys,
            V defaultValue) {
            
        int maxAttempts = 3;
        long backoffDelayMs = 2000;

        for (int attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                ChatModel model = chatModelFactory.createChatModel(provider, modelName);
                long startime = System.currentTimeMillis();
                System.out.println("starting AI service");
                T service = AiServices.create(serviceClass, model);
                System.out.println("AI service started");
                Map<String, ?> rawResult = extractionCall.apply(service);
                System.out.println("Result got at second:"+(System.currentTimeMillis() - startime)/1000);
                ObjectMapper mapper = new ObjectMapper();
                Map<String, V> cleanResult = new HashMap<>();
                
                System.out.println("Rawresult:"+rawResult);
                int failed_in_cleaning = 0;
                if (rawResult != null) {
                    for (Map.Entry<String, ?> entry : rawResult.entrySet()) {
                        try {
                            V parsedValue = mapper.convertValue(entry.getValue(), targetValueType);
                            cleanResult.put(entry.getKey(), parsedValue);
                        } catch (Exception e) {

                            //lenient backend parsing
                            boolean recovered = false;
                            try {
                                Object rawVal = entry.getValue();
                                String strVal = null;
                                if (rawVal instanceof List) {
                                    List<?> list = (List<?>) rawVal;
                                    strVal = list.stream().map(Object::toString).reduce((a, b) -> a + ", " + b).orElse("");
                                } else if (rawVal instanceof String) {
                                    strVal = (String) rawVal;
                                }
                                
                                if (strVal != null) {
                                    Map<String, String> fallbackMap = new HashMap<>();
                                    fallbackMap.put("value", strVal);
                                    fallbackMap.put("confidence", "medium");
                                    V parsedValue = mapper.convertValue(fallbackMap, targetValueType);
                                    cleanResult.put(entry.getKey(), parsedValue);
                                    recovered = true;
                                }
                            } catch (Exception ignored) {}
                            
                            if (!recovered) {
                                cleanResult.put(entry.getKey(), defaultValue);
                                failed_in_cleaning++;
                                System.out.println("failed in cleaning field :" + entry.getKey());
                            }
                        }
                    }
                }
                System.out.println("failed in cleaning :"+failed_in_cleaning);
                System.out.println("number missing :"+(expectedKeys.size() -cleanResult.size()));//
                for (String key : expectedKeys) {
                    cleanResult.putIfAbsent(key, defaultValue);
                }

                long endtime = System.currentTimeMillis();
                System.out.println("Time taken for extraction: " + (endtime - startime) / 1000 + " seconds");
                
                return cleanResult;
            } catch (Exception e) {
                String message = e.getMessage() != null ? e.getMessage().toLowerCase() : "";
                
                if (message.contains("429") || message.contains("rate limit") || message.contains("too many requests")) {
                    if (attempt == maxAttempts) {
                        handleException(e);
                        return null;
                    }
                    try {
                        System.out.println("Rate limit hit, sleeping for " + (backoffDelayMs * attempt) + "ms before retry...");
                        Thread.sleep(backoffDelayMs * attempt);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                    }
                    continue;
                }
                
                if (message.contains("failed to parse") || message.contains("json") || message.contains("illegalstateexception")) {
                    if (attempt == maxAttempts) {
                        handleException(e);
                        return null;
                    }
                    System.out.println("JSON Parse error, retrying without delay...");
                    continue;
                }
                
                handleException(e);
                return null;
            }
        }
        return null;
    }

    protected void handleException(Exception e) {
        String message = e.getMessage() != null ? e.getMessage().toLowerCase() : "";
        if (message.contains("429") || message.contains("rate limit") || message.contains("too many requests")) {
            throw new AiApiException("RATE_LIMIT_EXCEEDED", "Rate limit exceeded. Please try again later.");
        }
        if (message.contains("token limit") || message.contains("context length") || message.contains("maximum context") || message.contains("content_length_limit")) {
            throw new AiApiException("TOKEN_LIMIT_EXCEEDED", "Token limit exceeded. Please reduce the input size.");
        }
        throw new AiApiException("AI_API_ERROR", "An error occurred while communicating with the AI service: " + e.getMessage());
    }
}
