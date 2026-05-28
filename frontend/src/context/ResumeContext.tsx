import React, { createContext, useContext, useState } from 'react';
import { StudentData } from '../types';

interface ResumeContextType {
  students: StudentData[];
  setStudents: React.Dispatch<React.SetStateAction<StudentData[]>>;
  hasUploaded: boolean;
  setHasUploaded: (v: boolean) => void;
  isProcessing: boolean;
  setIsProcessing: (v: boolean) => void;
  activeStudentId: string | null;
  setActiveStudentId: (id: string | null) => void;
  activeField: keyof StudentData | null;
  setActiveField: (field: keyof StudentData | null) => void;
  hasJobDescription: boolean;
  setHasJobDescription: (v: boolean) => void;
  checklistItems: string[];
  setChecklistItems: (items: string[]) => void;
  modelProvider: string;
  setModelProvider: (v: string) => void;
  modelName: string;
  setModelName: (v: string) => void;
}

const ResumeContext = createContext<ResumeContextType | undefined>(undefined);

export const ResumeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [students, setStudents] = useState<StudentData[]>([]);
  const [hasUploaded, setHasUploaded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeStudentId, setActiveStudentId] = useState<string | null>(null);
  const [activeField, setActiveField] = useState<keyof StudentData | null>(null);
  const [hasJobDescription, setHasJobDescription] = useState(false);
  const [checklistItems, setChecklistItems] = useState<string[]>([]);
  const [modelProvider, setModelProvider] = useState(() => localStorage.getItem('currentModelProvider') || 'groq');
  const [modelName, setModelName] = useState(() => localStorage.getItem('currentModelName') || 'llama-3.3-70b-versatile');

  return (
    <ResumeContext.Provider value={{
      students, setStudents,
      hasUploaded, setHasUploaded,
      isProcessing, setIsProcessing,
      activeStudentId, setActiveStudentId,
      activeField, setActiveField,
      hasJobDescription, setHasJobDescription,
      checklistItems, setChecklistItems,
      modelProvider, setModelProvider,
      modelName, setModelName
    }}>
      {children}
    </ResumeContext.Provider>
  );
};

export const useResume = () => {
  const context = useContext(ResumeContext);
  if (context === undefined) {
    throw new Error('useResume must be used within a ResumeProvider');
  }
  return context;
};
