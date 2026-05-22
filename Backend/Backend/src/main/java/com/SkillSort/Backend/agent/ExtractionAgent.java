package com.SkillSort.Backend.agent;

import com.SkillSort.Backend.model.ExtractedField;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
public class ExtractionAgent {

    private final ChatClient chatClient;

    @Value("classpath:prompts/extraction-system-prompt.txt")
    private Resource systemPromptResource;

    public ExtractionAgent(ChatClient.Builder chatClientBuilder) {
        this.chatClient = chatClientBuilder.build();
    }

    public Map<String, ExtractedField> extractFields(String rawPdfText, List<String> fieldsToExtract) {
        int maxAttempts = 3;
        int inprogresscnt = 0;
        
        List<String> currentFieldsToExtract = new ArrayList<>(fieldsToExtract);
        Map<String, ExtractedField> finalResult = new HashMap<>();
        String userPromptText = "Resume raw layout data:\n\n" + rawPdfText;

        while (inprogresscnt < maxAttempts && !currentFieldsToExtract.isEmpty()) {
            String fieldsStr = String.join(", ", currentFieldsToExtract);
            
            // Add a strict instruction if this is a retry loop
            String extraInstruction = inprogresscnt > 0 
                ? "\n\nCRITICAL: You forgot these fields in the previous attempt. You must generate ONLY these missing fields now." 
                : "";
            
            try {
                Map<String, ExtractedField> partialResult = chatClient.prompt()
                        .system(s -> s.text(systemPromptResource)
                                .param("fields", fieldsStr + extraInstruction))
                        .user(u -> u.text(userPromptText))
                        .call()
                        .entity(new ParameterizedTypeReference<Map<String, ExtractedField>>() {});
                        
                if (partialResult != null) {
                    finalResult.putAll(partialResult);
                }
            } catch (Exception e) {
                System.err.println("Extraction attempt " + (inprogresscnt + 1) + " failed: " + e.getMessage());
            }

            // Validation: determine which fields are still completely missing
            List<String> missingFields = new ArrayList<>();
            for (String reqField : currentFieldsToExtract) {
                if (!finalResult.containsKey(reqField) || finalResult.get(reqField) == null || finalResult.get(reqField).value() == null) {
                    missingFields.add(reqField);
                }
            }
            
            currentFieldsToExtract = missingFields;
            inprogresscnt++;
        }
        
        // Fallback: If it failed after 3 tries, populate with dummy data to avoid null pointer exceptions
        for (String field : fieldsToExtract) {
            finalResult.putIfAbsent(field, new ExtractedField("Not Provided", "low"));
        }
        
        return finalResult;
    }
}