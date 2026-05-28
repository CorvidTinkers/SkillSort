import { StudentData, ExtractedField, User } from '../types';

interface CandidateResult {
  id: string;
  fileName: string;
  extractedData: Record<string, ExtractedField>;
  atsScore: ExtractedField;
  knockoutResults: Record<string, boolean>;
}

const BASE_URL = 'http://localhost:8080';

const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('skillsort_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

export const loginWithSSO = async (
  id: string,
  email: string,
  name: string,
  provider: string,
  avatarUrl?: string
): Promise<{ token: string; user: User }> => {
  const response = await fetch(`${BASE_URL}/api/auth/sso`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id, email, name, ssoProvider: provider, avatarUrl }),
  });

  if (!response.ok) {
    const errorText = await response.json().catch(() => ({ error: 'Failed to authenticate' }));
    throw new Error(errorText.error || 'Failed to authenticate');
  }

  const data = await response.json();
  localStorage.setItem('skillsort_token', data.token);
  return data;
};

export const signUpWithCredentials = async (
  name: string,
  email: string,
  password: string
): Promise<{ token: string; user: User }> => {
  const response = await fetch(`${BASE_URL}/api/auth/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name, email, password }),
  });

  if (!response.ok) {
    const errorText = await response.json().catch(() => ({ error: 'Failed to sign up' }));
    throw new Error(errorText.error || 'Failed to sign up');
  }

  const data = await response.json();
  localStorage.setItem('skillsort_token', data.token);
  return data;
};

export const loginWithCredentials = async (
  email: string,
  password: string
): Promise<{ token: string; user: User }> => {
  const response = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const errorText = await response.json().catch(() => ({ error: 'Failed to log in' }));
    throw new Error(errorText.error || 'Failed to log in');
  }

  const data = await response.json();
  localStorage.setItem('skillsort_token', data.token);
  return data;
};

export const fetchSavedCandidates = async (): Promise<StudentData[]> => {
  const response = await fetch(`${BASE_URL}/api/resumes/list`, {
    method: 'GET',
    headers: {
      ...getAuthHeaders(),
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('skillsort_token');
      throw new Error('Unauthorized');
    }
    const errorText = await response.text();
    throw new Error(errorText || 'Failed to fetch saved candidates');
  }

  const results = await response.json();
  return results.map((result: any) => {
    const extractedData = result.extractedData || {};
    return {
      id: result.id,
      name: extractedData.name || { value: result.filename, confidence: 'low' },
      domain: extractedData.domain || { value: 'N/A', confidence: 'low' },
      skills: extractedData.skills || { value: 'N/A', confidence: 'low' },
      experience: extractedData.experience || { value: 'N/A', confidence: 'low' },
      role: extractedData.role || { value: 'N/A', confidence: 'low' },
      atsScore: (result.ats_score !== undefined && result.ats_score !== null) ? { value: Math.round(result.ats_score), confidence: 'high' } : { value: NaN, confidence: 'low' },
      githubInfo: extractedData.githubInfo || { value: 'N/A', confidence: 'low' },
      resumeUrl: `${BASE_URL}/api/resumes/blob/${result.id}?token=${encodeURIComponent(localStorage.getItem('skillsort_token') || '')}`,
      resumeText: {
        header: result.filename,
        contact: 'Extracted via AI',
        summary: '',
        skills: String(extractedData.skills?.value || ''),
        experience: String(extractedData.experience?.value || ''),
        education: ''
      },
      knockoutResults: result.knockoutResults || {}
    };
  });
};

export const extractResumesBatch = async (
  zipFile: File,
  fields: string[],
  jdText: string,
  checklist: string[],
  enableAts: boolean,
  enableKnockouts: boolean,
  modelProvider: string,
  modelName: string,
  onCandidateReceived: (student: StudentData) => void,
  onError?: (error: {type: string, message: string}) => void
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
  formData.append('enableAts', enableAts.toString());
  formData.append('enableKnockouts', enableKnockouts.toString());
  formData.append('modelProvider', modelProvider);
  formData.append('modelName', modelName);

  const response = await fetch(`${BASE_URL}/api/resumes/extract`, {
    method: 'POST',
    headers: {
      ...getAuthHeaders(),
    },
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

    const chunks = buffer.split('\n\n');
    buffer = chunks.pop() || '';

    for (const chunk of chunks) {
      if (chunk.trim().startsWith('event:error')) {
        const dataMatch = chunk.match(/data:(.+)/);
        if (dataMatch && dataMatch[1]) {
          try {
            const errorObj = JSON.parse(dataMatch[1].trim());
            if (errorObj.type === 'ITEM_ERROR') {
              const student: StudentData = {
                id: `error-${Date.now()}-${Math.random()}`,
                name: { value: errorObj.fileName || 'Unknown File', confidence: 'low' },
                domain: { value: 'ERROR', confidence: 'low' },
                skills: { value: 'Failed to extract data', confidence: 'low' },
                experience: { value: 'N/A', confidence: 'low' },
                role: { value: 'N/A', confidence: 'low' },
                atsScore: { value: NaN, confidence: 'low' },
                githubInfo: { value: 'N/A', confidence: 'low' },
                resumeUrl: '',
                resumeText: { header: errorObj.fileName, contact: '', summary: '', skills: '', experience: '', education: '' },
                knockoutResults: {},
                hasError: true,
                errorMessage: errorObj.message
              };
              onCandidateReceived(student);
            } else if (onError) {
              onError(errorObj);
            }
          } catch(e) {
            console.error('Failed to parse error chunk:', e);
          }
        }
      } else if (chunk.trim().startsWith('event:candidate') || (chunk.trim().startsWith('data:') && !chunk.trim().includes('event:error'))) {
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
              atsScore: (result.atsScore !== undefined && result.atsScore !== null) ? { value: Number(result.atsScore.value), confidence: result.atsScore.confidence } : { value: NaN, confidence: 'low' },
              githubInfo: result.extractedData.githubInfo || { value: 'N/A', confidence: 'low' },
              resumeUrl: `${BASE_URL}/api/resumes/blob/${result.id}?token=${encodeURIComponent(localStorage.getItem('skillsort_token') || '')}`,
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
