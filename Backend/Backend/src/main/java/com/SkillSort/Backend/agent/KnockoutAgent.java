package com.SkillSort.Backend.agent;

import com.SkillSort.Backend.config.ChatModelFactory;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
public class KnockoutAgent extends BaseAgent {

    public KnockoutAgent(ChatModelFactory chatModelFactory) {
        super(chatModelFactory);
    }

    @Override
    protected String getUserPrompt(Object... params) {
        String rawPdfText = (String) params[0];
        return "Resume raw data:\n\n" + rawPdfText;
    }

    protected String getSystemPrompt(Object... params) {
        @SuppressWarnings("unchecked")
        List<String> checklist = (List<String>) params[0];
        return "You are a strict HR ATS Knockout evaluator. " +
            "Evaluate if the resume meets each of the following mandatory criteria: " + 
            String.join(", ", checklist) + ". " +
            "Return a strict JSON object mapping the exact criteria string to a boolean (true if met, false if unmet). " +
            "Do not return anything else except the JSON.";
    }

    public Map<String, Boolean> evaluateKnockoutCriteria(String rawPdfText, List<String> checklist, String provider, String modelName) {
        if (checklist == null || checklist.isEmpty()) {
            return new HashMap<>();
        }
        
        String userPrompt = getUserPrompt(rawPdfText);
        String systemPrompt = getSystemPrompt(checklist);
            
        return executeExtraction(
            systemPrompt,
            userPrompt,
            checklist,
            fieldNode -> {
                if (fieldNode.isBoolean()) {
                    return fieldNode.asBoolean();
                } else if (fieldNode.isTextual()) {
                    return Boolean.parseBoolean(fieldNode.asText());
                }
                return null;
            },
            false,
            provider,
            modelName
        );
    }
}
