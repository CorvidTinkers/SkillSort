import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadZone } from '../components/UploadZone';
import { ErrorModal } from '../components/ErrorModal';
import { useResume } from '../context/ResumeContext';
import { extractResumesBatch } from '../services/api';

export const UploadPage: React.FC = () => {
  const { 
    setHasUploaded, 
    isProcessing, setIsProcessing,
    setStudents, setHasJobDescription, setChecklistItems,
    setActiveStudentId, setActiveField,
    modelProvider, modelName
  } = useResume();
  const navigate = useNavigate();

  const [errorModal, setErrorModal] = useState<{isOpen: boolean, type: string, message: string}>({
    isOpen: false, type: '', message: ''
  });

  const handleUpload = async (file: File, hasJd: boolean, jdText: string, checklist: string[], enableAts: boolean, enableKnockouts: boolean) => {
    setIsProcessing(true);
    setHasUploaded(true);
    setHasJobDescription(hasJd);
    setChecklistItems(checklist);
    setStudents([]);
    
    navigate('/review');
    
    try {
      const targetFields = ['name', 'domain', 'skills', 'experience', 'role', 'githubInfo'];
      let isFirst = true;
      
      await extractResumesBatch(file, targetFields, jdText, checklist, enableAts, enableKnockouts, modelProvider, modelName, (student) => {
        setStudents(prev => [...prev, student]);
        
        if (isFirst) {
          setActiveStudentId(student.id);
          setActiveField('domain');
          isFirst = false;
        }
      }, (error) => {
        setErrorModal({
          isOpen: true,
          type: error.type,
          message: error.message
        });
      });
      
    } catch (err) {
      console.error('Upload failed', err);
      setErrorModal({
        isOpen: true,
        type: 'UNKNOWN_ERROR',
        message: 'Failed to process the batch. Please check console for details.'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <UploadZone onUpload={handleUpload} isProcessing={isProcessing} />
      <ErrorModal 
        isOpen={errorModal.isOpen} 
        onClose={() => setErrorModal(prev => ({ ...prev, isOpen: false }))}
        errorType={errorModal.type}
        errorMessage={errorModal.message}
      />
    </>
  );
};
