package com.SkillSort.Backend.agent;

import com.SkillSort.Backend.model.StudentAttribute;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;

@Component
public class ExtractionAgent {

    private final ChatClient chatClient;
    private final ObjectMapper objectMapper;

    // Load your clean system prompt file from resources/prompts
    @Value("classpath:prompts/extraction-system-prompt.txt")
    private Resource systemPromptResource;

    // Injecting the auto-configured ChatClient framework
    public ExtractionAgent(ChatClient.Builder chatClientBuilder) {
        this.chatClient = chatClientBuilder.build();
        this.objectMapper = new ObjectMapper();
    }

    public StudentAttribute extractFields(String rawPdfText, List<String> fieldsToExtract) {
        String baseSystemPrompt;
        
        // 1. Read your isolated prompt text file
        try {
            baseSystemPrompt = systemPromptResource.getContentAsString(StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new RuntimeException("Machi! Failed to read prompt file: " + e.getMessage());
        }

        // 2. Append dynamic request values and specific JSON instructions to prompt
        String formattedSystemPrompt = """
            %s
            
            Target parameters requested by operator: %s
            
            IMPORTANT: Ensure your output is a single, valid JSON object containing all requested fields as keys, in addition to the "student_name" and "confidence_score" keys.
            """.formatted(baseSystemPrompt, fieldsToExtract.toString());

        String userPrompt = String.format("Resume raw layout data:\n\n%s", rawPdfText);

        // 3. Fire the extraction request and get the raw response string
        String response = chatClient.prompt()
                .system(formattedSystemPrompt)
                .user(userPrompt)
                .call()
                .content();

        if (response == null) {
            throw new RuntimeException("Machi! Model returned an empty response.");
        }

        // 4. Clean up any markdown code block wrappers
        response = response.trim();
        if (response.startsWith("```")) {
            // Strip opening backticks and language tag
            response = response.replaceAll("^```[a-zA-Z]*\\s*", "");
            // Strip closing backticks
            response = response.replaceAll("\\s*```$", "");
            response = response.trim();
        }

        // 5. Deserialize the JSON response directly into the StudentAttribute POJO
        try {
            return objectMapper.readValue(response, StudentAttribute.class);
        } catch (IOException e) {
            throw new RuntimeException("Machi! Failed to parse JSON response from LLM into StudentAttribute: " + e.getMessage() + "\nRaw response: " + response);
        }
    }
}