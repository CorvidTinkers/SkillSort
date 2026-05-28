import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { GlobalHeader } from '../GlobalHeader';
import { ModelSelectionModal } from '../ModelSelectionModal';
import { useAuth } from '../../context/AuthContext';
import { useResume } from '../../context/ResumeContext';

export const MainLayout: React.FC = () => {
  const { user } = useAuth();
  const { hasUploaded, modelProvider, setModelProvider, modelName, setModelName } = useResume();
  const navigate = useNavigate();
  const location = useLocation();

  const [isModelModalOpen, setIsModelModalOpen] = useState(false);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const currentView = location.pathname.includes('/analytics') ? 'dashboard' : 'grid';

  const handleViewChange = (view: 'grid' | 'dashboard') => {
    if (view === 'grid') navigate('/review');
    if (view === 'dashboard') navigate('/analytics');
  };

  return (
    <div className="h-screen w-full flex flex-col bg-surface-container-low overflow-hidden font-sans">
      <GlobalHeader 
        user={user}
        hasUploaded={hasUploaded}
        view={currentView}
        onViewChange={handleViewChange}
        onModelSelectClick={() => setIsModelModalOpen(true)}
      />

      <main className="flex-1 flex overflow-hidden">
        <Outlet />
      </main>
      
      <ModelSelectionModal 
        isOpen={isModelModalOpen}
        onClose={() => setIsModelModalOpen(false)}
        currentProvider={modelProvider}
        currentModel={modelName}
        onSave={(provider, model) => {
          setModelProvider(provider);
          setModelName(model);
          localStorage.setItem('currentModelProvider', provider);
          localStorage.setItem('currentModelName', model);
        }}
      />
    </div>
  );
};
