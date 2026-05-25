package com.SkillSort.Backend.config;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.ollama.OllamaChatModel;
import org.springframework.ai.ollama.api.OllamaApi;
import org.springframework.ai.ollama.api.OllamaChatOptions;
import org.springframework.ai.openai.OpenAiChatModel;
import org.springframework.ai.openai.OpenAiChatOptions;
import com.openai.client.OpenAIClient;
import com.openai.client.okhttp.OpenAIOkHttpClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class ChatModelFactory {

    @Value("${llm.api.key}")
    private String groqApiKey;

    @Value("${llm.api.url}")
    private String groqApiUrl;

    @Value("${llm.ollama.url:http://localhost:11434}")
    private String ollamaUrl;

    public ChatClient createChatClient(String provider, String modelName) {
        if ("ollama".equalsIgnoreCase(provider)) {
            org.springframework.http.client.SimpleClientHttpRequestFactory requestFactory = new org.springframework.http.client.SimpleClientHttpRequestFactory();
            
            RestClient.Builder customRestClientBuilder = RestClient.builder().requestFactory(requestFactory);

            OllamaApi ollamaApi = OllamaApi.builder()
                    .baseUrl(ollamaUrl)
                    .restClientBuilder(customRestClientBuilder)
                    .build();
            
            OllamaChatOptions options = OllamaChatOptions.builder()
                    .model(modelName)
                    .format("json")
                    .build();
                    
            OllamaChatModel chatModel = OllamaChatModel.builder()
                    .ollamaApi(ollamaApi)
                    .defaultOptions(options)
                    .build();
            return ChatClient.builder(chatModel).build();
        } else {
            // Default to Groq using modern Spring AI Builders
            OpenAIClient openAiClient = OpenAIOkHttpClient.builder()
                    .baseUrl(groqApiUrl)
                    .apiKey(groqApiKey)
                    .build();

            OpenAiChatOptions options = OpenAiChatOptions.builder()
                    .model(modelName)
                    .build();

            // Uses the official builder to avoid manual infrastructure wiring
            OpenAiChatModel chatModel = OpenAiChatModel.builder()
                    .openAiClient(openAiClient)
                    .options(options)
                    .build();

            return ChatClient.builder(chatModel).build();
        }
    }
}
