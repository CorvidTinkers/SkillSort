package com.SkillSort.Backend.agent;

import com.SkillSort.Backend.config.ChatModelFactory;
import dev.langchain4j.service.SystemMessage;
import dev.langchain4j.service.UserMessage;
import dev.langchain4j.service.V;
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
        return ""; // Not used anymore
    }

    interface KnockoutExtractorService {
        @SystemMessage("""
            You are a strict HR ATS Knockout evaluator.
            Evaluate if the resume meets each of the mandatory criteria requested.
            Return a JSON object mapping the exact criteria string to a boolean (true if met, false if unmet).
            Do not return anything else except the JSON.
            
            CRITICAL RULES:
            1. Your output MUST be a JSON object where each requested criterion string is exactly mapped to a boolean value (true or false).
            2. DO NOT include any conversational introduction, preamble, explanation, notes, markdown formatting, or backticks in your response. The response must contain ONLY the raw JSON object and nothing else.
            
            EXAMPLE OF EXPECTED JSON OUTPUT FORMAT:
            {
              "Has a Bachelor's degree": true,
              "Has at least 3 years of experience in Java": false,
              "Lives in San Francisco, CA": true
            }
            
            NEVER RETURN ARRAYS OR RAW STRINGS. ONLY RETURN THE EXACT JSON OBJECT MAP SHOWN ABOVE.
            """)
        @UserMessage("Resume raw data:\n\n{{text}}\n\nPlease evaluate these criteria and return as JSON: {{checklist}}")
        Map<String, Boolean> evaluate(@V("text") String text, @V("checklist") List<String> checklist);
    }

    public Map<String, Boolean> evaluateKnockoutCriteria(String rawPdfText, List<String> checklist, String provider, String modelName) {
        if (checklist == null || checklist.isEmpty()) {
            return new HashMap<>();
        }
        
        return super.extractFields(
                KnockoutExtractorService.class,
                provider,
                modelName,
                service -> service.evaluate(rawPdfText, checklist),
                Boolean.class,
                checklist,
                false
        );
    }
}
