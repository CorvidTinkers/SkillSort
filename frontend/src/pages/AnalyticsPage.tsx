import React from 'react';
import { Navigate } from 'react-router-dom';
import { AnalyticsDashboard } from '../components/AnalyticsDashboard';
import { useResume } from '../context/ResumeContext';

export const AnalyticsPage: React.FC = () => {
  const { hasUploaded, students } = useResume();

  if (!hasUploaded) {
    return <Navigate to="/upload" replace />;
  }

  return <AnalyticsDashboard students={students} />;
};
