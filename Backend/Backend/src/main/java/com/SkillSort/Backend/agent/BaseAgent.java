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
            
        try {
            ChatModel model = chatModelFactory.createChatModel(provider, modelName);
            T service = AiServices.create(serviceClass, model);
            
            Map<String, ?> rawResult = extractionCall.apply(service);
            
            ObjectMapper mapper = new ObjectMapper();
            Map<String, V> cleanResult = new HashMap<>();
            
            if (rawResult != null) {
                for (Map.Entry<String, ?> entry : rawResult.entrySet()) {
                    try {
                        V parsedValue = mapper.convertValue(entry.getValue(), targetValueType);
                        cleanResult.put(entry.getKey(), parsedValue);
                    } catch (Exception e) {
                        cleanResult.put(entry.getKey(), defaultValue);
                    }
                }
            }
            
            for (String key : expectedKeys) {
                cleanResult.putIfAbsent(key, defaultValue);
            }
            
            return cleanResult;
        } catch (Exception e) {
            handleException(e);
            return null;
        }
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
