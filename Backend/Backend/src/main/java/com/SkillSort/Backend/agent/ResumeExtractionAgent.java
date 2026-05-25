package com.SkillSort.Backend.agent;

import com.SkillSort.Backend.model.ExtractedField;
import com.SkillSort.Backend.config.ChatModelFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Component;

import org.springframework.ai.chat.prompt.PromptTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
public class ResumeExtractionAgent extends BaseAgent {

    @Value("classpath:prompts/extraction-system-prompt.txt")
    private Resource systemPromptResource;

    public ResumeExtractionAgent(ChatModelFactory chatModelFactory) {
        super(chatModelFactory);
    }

    @Override
    protected String getUserPrompt(Object... params) {
        String rawPdfText = (String) params[0];
        return "Resume raw layout data:\n\n" + rawPdfText;
    }

    public Map<String, ExtractedField> extractFields(String rawPdfText, List<String> fieldsToExtract, String provider, String modelName) {
        String userPromptText = getUserPrompt(rawPdfText);
        
        PromptTemplate template = new PromptTemplate(systemPromptResource);
        String baseSystemPrompt = template.render(new HashMap<>());
        
        return executeExtraction(
            baseSystemPrompt,
            userPromptText,
            fieldsToExtract,
            fieldNode -> {
                if (fieldNode.isObject() && fieldNode.has("value")) {
                    String val = fieldNode.get("value").asText();
                    String conf = fieldNode.has("confidence") ? fieldNode.get("confidence").asText() : "medium";
                    return new ExtractedField(val, conf);
                } else if (fieldNode.isArray()) {
                    StringBuilder combinedVal = new StringBuilder();
                    for (org.springframework.ai.chat.prompt.PromptTemplate _ignore : new org.springframework.ai.chat.prompt.PromptTemplate[0]){} // ignore just for import warning
                    for (com.fasterxml.jackson.databind.JsonNode arrayItem : fieldNode) {
                        if (arrayItem.isObject() && arrayItem.has("value")) {
                            if (combinedVal.length() > 0) combinedVal.append(" | ");
                            combinedVal.append(arrayItem.get("value").asText());
                        }
                    }
                    if (combinedVal.length() > 0) {
                        return new ExtractedField(combinedVal.toString(), "medium");
                    }
                }
                return null;
            },
            new ExtractedField("Not Provided", "low"),
            provider,
            modelName
        );
    }
}
