package com.SkillSort.Backend.config;

import dev.langchain4j.model.chat.ChatModel;
import dev.langchain4j.model.ollama.OllamaChatModel;
import dev.langchain4j.model.openai.OpenAiChatModel;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import java.time.Duration;

import static dev.langchain4j.model.chat.request.ResponseFormat.JSON;

@Component
public class ChatModelFactory {

    @Value("${llm.api.key}")
    private String groqApiKey;

    @Value("${llm.api.url}")
    private String groqApiUrl;

    @Value("${llm.ollama.url:http://localhost:11434}")
    private String ollamaUrl;

    public ChatModel createChatModel(String provider, String modelName) {
        System.out.println("model:" + modelName + " provider:" + provider);
        try {
            if ("ollama".equalsIgnoreCase(provider)) {
                return OllamaChatModel.builder()
                        .baseUrl(ollamaUrl)
                        .modelName(modelName)
                        .responseFormat(JSON)
                        .timeout(Duration.ofMinutes(3))
                        .build();
            } else {
                return OpenAiChatModel.builder()
                        .baseUrl(groqApiUrl)
                        .apiKey(groqApiKey)
                        .modelName(modelName)
                        .responseFormat(JSON) // Enforce JSON mode
                        .timeout(Duration.ofMinutes(3))
                        .build();
            }
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }
}
