export type Confidence = 'high' | 'medium' | 'low';

export interface ExtractedField {
  value: string | number | null;
  confidence: Confidence;
}

export interface StudentData {
  id: string;
  name: ExtractedField;
  domain: ExtractedField;
  skills: ExtractedField;
  experience: ExtractedField;
  role: ExtractedField;
  atsScore: { value: number | null; confidence: Confidence };
  githubInfo: ExtractedField;
  resumeUrl: string;
  resumeText: {
    header: string;
    contact: string;
    summary: string;
    skills: string;
    experience: string;
    education: string;
  };
  knockoutResults: Record<string, boolean>;
  hasError?: boolean;
  errorMessage?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  ssoProvider?: string;
}

