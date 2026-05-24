import { StudentData, ExtractedField } from '../types';

interface CandidateResult {
  id: string;
  fileName: string;
  extractedData: Record<string, ExtractedField>;
  atsScore: ExtractedField;
  knockoutResults: Record<string, boolean>;
}

export const extractResumesBatch = async (
  zipFile: File, 
  fields: string[],
  jdText: string,
  checklist: string[],
  onCandidateReceived: (student: StudentData) => void
): Promise<void> => {
  const formData = new FormData();
  formData.append('file', zipFile);
  fields.forEach(f => formData.append('fields', f));
  if (jdText) {
    formData.append('jobDescription', jdText);
  }
  if (checklist && checklist.length > 0) {
    checklist.forEach(c => formData.append('checklist', c));
  }

  const response = await fetch('http://localhost:8080/api/resumes/extract', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok || !response.body) {
    const errorText = await response.text();
    throw new Error(errorText || 'Failed to extract resumes');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    
    // SSE blocks are separated by double newlines
    const chunks = buffer.split('\n\n');
    buffer = chunks.pop() || ''; // Keep the incomplete chunk in the buffer

    for (const chunk of chunks) {
      if (chunk.trim().startsWith('event:candidate') || chunk.trim().startsWith('data:')) {
        // Extract the JSON payload after 'data:'
        const dataMatch = chunk.match(/data:(.+)/);
        if (dataMatch && dataMatch[1]) {
          try {
            const result: CandidateResult = JSON.parse(dataMatch[1].trim());
            
            const student: StudentData = {
              id: result.id,
              name: result.extractedData.name || { value: result.fileName, confidence: 'low' },
              domain: result.extractedData.domain || { value: 'N/A', confidence: 'low' },
              skills: result.extractedData.skills || { value: 'N/A', confidence: 'low' },
              experience: result.extractedData.experience || { value: 'N/A', confidence: 'low' },
              role: result.extractedData.role || { value: 'N/A', confidence: 'low' },
              atsScore: result.atsScore || { value: 50, confidence: 'low' },
              githubInfo: result.extractedData.githubInfo || { value: 'N/A', confidence: 'low' },
              resumeUrl: `http://localhost:8080/resumes/${result.fileName}`, // The backend mapped the static URL here
              resumeText: {
                header: result.fileName,
                contact: 'Extracted via AI',
                summary: '',
                skills: String(result.extractedData.skills?.value || ''),
                experience: String(result.extractedData.experience?.value || ''),
                education: ''
              },
              knockoutResults: result.knockoutResults || {}
            };
            
            onCandidateReceived(student);
          } catch (e) {
            console.error('Failed to parse SSE data chunk:', e);
          }
        }
      }
    }
  }
};

