import React from 'react';
import { Navigate } from 'react-router-dom';
import { ReviewWorkspace } from '../components/ReviewWorkspace';
import { useResume } from '../context/ResumeContext';
import { StudentData } from '../types';

export const ReviewPage: React.FC = () => {
  const { 
    hasUploaded,
    students, setStudents,
    activeStudentId, setActiveStudentId,
    activeField, setActiveField,
    hasJobDescription,
    checklistItems,
    isProcessing
  } = useResume();

  if (!hasUploaded) {
    return <Navigate to="/upload" replace />;
  }

  const handleSelectCell = (studentId: string, field: keyof StudentData) => {
    setActiveStudentId(studentId);
    setActiveField(field);
  };

  return (
    <ReviewWorkspace 
      students={students}
      activeStudentId={activeStudentId}
      activeField={activeField}
      hasJobDescription={hasJobDescription}
      checklistItems={checklistItems}
      isProcessing={isProcessing}
      onStudentsChange={setStudents}
      onSelectCell={handleSelectCell}
    />
  );
};
