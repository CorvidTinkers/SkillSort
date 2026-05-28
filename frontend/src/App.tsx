import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ResumeProvider } from './context/ResumeContext';
import { MainLayout } from './components/layout/MainLayout';
import { LoginPage } from './pages/LoginPage';
import { UploadPage } from './pages/UploadPage';
import { ReviewPage } from './pages/ReviewPage';
import { AnalyticsPage } from './pages/AnalyticsPage';

export default function App() {
  return (
    <AuthProvider>
      <ResumeProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            
            <Route element={<MainLayout />}>
              <Route path="/upload" element={<UploadPage />} />
              <Route path="/review" element={<ReviewPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              
              <Route path="/" element={<Navigate to="/upload" replace />} />
            </Route>
            
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </ResumeProvider>
    </AuthProvider>
  );
}
