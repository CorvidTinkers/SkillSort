package com.SkillSort.Backend.agent;

import com.SkillSort.Backend.model.ExtractedField;
import com.SkillSort.Backend.config.ChatModelFactory;
import dev.langchain4j.service.SystemMessage;
import dev.langchain4j.service.UserMessage;
import dev.langchain4j.service.V;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
public class ResumeExtractionAgent extends BaseAgent {

    public ResumeExtractionAgent(ChatModelFactory chatModelFactory) {
        super(chatModelFactory);
    }

    @Override
    protected String getUserPrompt(Object... params) {
        return ""; // Not used anymore
    }

    interface ResumeExtractorService {
        @SystemMessage("""
            You are an expert ATS data extraction worker engine. Your task is to process unstructured resume text and convert it into structured data.
            You must extract information ONLY for the specific keys requested.
            
            CRITICAL RULES:
            1. Your output MUST be a JSON object where each requested key maps to a nested object containing exactly two fields: "value" (the extracted string) and "confidence" ("low", "medium", or "high").
            2. If a field cannot be determined from the text, assign its "value" as "Not Provided" and "confidence" as "low". Do not guess or return a simple string.
            3. DO NOT include any conversational introduction, preamble, explanation, notes, markdown formatting, or backticks in your response. The response must contain ONLY the raw JSON object and nothing else.
            4. MUST FILL ALL DATA ACCURATELY AND CORRECTLY 
            for example if the resume lists skills in expereince section , you should extract it as skills as well
            for example if desgniation is not given you should use the information from the resume to extract the probable desgniation
            
            EXAMPLE OF EXPECTED JSON OUTPUT FORMAT:
            {
              "name": { "value": "Jane Doe", "confidence": "high" },
              "domain": { "value": "Software Engineering", "confidence": "high" },
              "skills": { "value": "Java, React, SQL", "confidence": "medium" },
              "summary":{"value":" //a few lines of summary of what ever summary is asked eg: skill summary; experience summary; all summary combined","confidence":"medium"},
              "missing_field": { "value": "Not Provided", "confidence": "low" }
            }
            
            NEVER RETURN ARRAYS OR RAW STRINGS AT THE TOP LEVEL. ONLY RETURN THE EXACT NESTED OBJECT STRUCTURE SHOWN ABOVE.
        """) 
        @UserMessage("Resume raw layout data:\n\n{{text}}\n\nPlease extract the following fields and return as JSON: {{fields}}")
        Map<String, ExtractedField> extract(@V("text") String text, @V("fields") List<String> fields);
    }

    public Map<String, ExtractedField> extractFields(String rawPdfText, List<String> fieldsToExtract, String provider, String modelName) {
        return super.extractFields(
                ResumeExtractorService.class,
                provider,
                modelName,
                service -> service.extract(rawPdfText, fieldsToExtract),
                ExtractedField.class,
                fieldsToExtract,
                new ExtractedField("Not Provided", "low")
        );
    }
}
