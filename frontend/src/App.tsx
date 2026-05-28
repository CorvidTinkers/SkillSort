import React, { useState, useRef, useEffect } from 'react';
import { UploadZone } from './components/UploadZone';
import { ReviewGrid } from './components/ReviewGrid';
import { ResumeViewer } from './components/ResumeViewer';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { ErrorModal } from './components/ErrorModal';
import { ModelSelectionModal } from './components/ModelSelectionModal';
import { Login } from './components/Login';
import { extractResumesBatch } from './services/api';
import { StudentData, User } from './types';
import { Briefcase, LayoutGrid, BarChart3, ChevronLeft, ChevronRight, Settings } from 'lucide-react';

const getInitials = (user: User | null): string => {
  if (!user || !user.name) return 'PO';
  return user.name.charAt(0).toUpperCase();
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [students, setStudents] = useState<StudentData[]>([]);
  const [hasUploaded, setHasUploaded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeStudentId, setActiveStudentId] = useState<string | null>(null);
  const [activeField, setActiveField] = useState<keyof StudentData | null>(null);
  const [hasJobDescription, setHasJobDescription] = useState(false);
  const [checklistItems, setChecklistItems] = useState<string[]>([]);
  const [view, setView] = useState<'grid' | 'dashboard'>('grid');
  
  const [errorModal, setErrorModal] = useState<{isOpen: boolean, type: string, message: string}>({
    isOpen: false,
    type: '',
    message: ''
  });

  const [resumeWidth, setResumeWidth] = useState(40);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [preCollapseWidth, setPreCollapseWidth] = useState(40);
  const [isDragging, setIsDragging] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  // Model Selection State
  const [modelProvider, setModelProvider] = useState('groq');
  const [modelName, setModelName] = useState('llama-3.3-70b-versatile');
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isModelModalOpen, setIsModelModalOpen] = useState(false);

  // Load persisted model settings
  useEffect(() => {
    const savedProvider = localStorage.getItem('currentModelProvider');
    const savedModel = localStorage.getItem('currentModelName');
    if (savedProvider) setModelProvider(savedProvider);
    if (savedModel) setModelName(savedModel);
    
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLoginSuccess = (loggedUser: User) => {
    setUser(loggedUser);
  };

  const handleToggleMaximize = () => {
    if (resumeWidth > 55) {
      setResumeWidth(40);
      setIsCollapsed(false);
    } else {
      setResumeWidth(75);
      setIsCollapsed(false);
    }
  };

  const startDragging = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    const container = containerRef.current;
    if (!container) return;
    
    const containerWidth = container.getBoundingClientRect().width;
    const initialWidth = resumeWidth;
    const startX = e.clientX;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaPercent = (deltaX / containerWidth) * 100;
      const newWidth = Math.max(15, Math.min(85, initialWidth - deltaPercent));
      setResumeWidth(newWidth);
      if (isCollapsed) {
        setIsCollapsed(false);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleUpload = async (file: File, hasJd: boolean, jdText: string, checklist: string[], enableAts: boolean, enableKnockouts: boolean) => {
    setIsProcessing(true);
    setHasUploaded(true);
    setHasJobDescription(hasJd);
    setChecklistItems(checklist);
    setStudents([]);
    
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

  const handleSelectCell = (studentId: string, field: keyof StudentData) => {
    setActiveStudentId(studentId);
    setActiveField(field);
  };

  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="h-screen w-full flex flex-col bg-surface-container-low overflow-hidden font-sans">
      {/* Global Header */}
      <header className="h-16 bg-surface-container-lowest border-b border-slate-200 shrink-0 flex items-center px-6 justify-between select-none shadow-sm">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-primary/10 text-primary rounded flex items-center justify-center shadow-sm">
              <Briefcase size={18} strokeWidth={2.5} />
            </div>
            <span className="text-primary font-display font-bold text-2xl tracking-tight">SkillSort</span>
            <span className="text-slate-400 ml-2 text-sm border-l border-slate-200 pl-4 font-normal">Placement Intelligence</span>
          </div>

          {hasUploaded && (
            <div className="flex gap-6 h-full items-center pl-6 border-l border-slate-200">
              <button 
                onClick={() => setView('grid')}
                className={`text-[14px] font-semibold pb-1 cursor-pointer transition-colors relative ${view === 'grid' ? 'text-primary' : 'text-slate-600 hover:text-primary'}`}
              >
                Review Grid
                {view === 'grid' && (
                  <span className="absolute bottom-[-20px] left-0 right-0 h-[2.5px] bg-primary rounded-t-full" />
                )}
              </button>
              <button 
                onClick={() => setView('dashboard')}
                className={`text-[14px] font-semibold pb-1 cursor-pointer transition-colors relative ${view === 'dashboard' ? 'text-primary' : 'text-slate-600 hover:text-primary'}`}
              >
                Analytics
                {view === 'dashboard' && (
                  <span className="absolute bottom-[-20px] left-0 right-0 h-[2.5px] bg-primary rounded-t-full" />
                )}
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 text-sm font-semibold text-slate-600 relative">
          <button className="hover:text-primary transition-colors cursor-pointer">Documentation</button>
          
          <div className="relative" ref={profileDropdownRef}>
            <div 
              onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
              className="h-8 w-8 rounded-full bg-primary-container text-on-primary-container border border-primary/20 flex items-center justify-center font-bold text-xs select-none cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
            >
              {getInitials(user)}
            </div>

            {/* Profile Dropdown */}
            {isProfileDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 py-2 animate-in slide-in-from-top-2 fade-in duration-200">
                <div className="px-4 py-2 border-b border-slate-100 mb-2">
                  <p className="text-sm font-semibold text-slate-800 truncate">{user?.name}</p>
                  <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                </div>
                <button 
                  onClick={() => {
                    setIsProfileDropdownOpen(false);
                    setIsModelModalOpen(true);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-3 text-sm text-slate-700 transition-colors"
                >
                  <Settings size={16} className="text-slate-400" />
                  Model Selection
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {!hasUploaded ? (
          <UploadZone onUpload={handleUpload} isProcessing={isProcessing} />
        ) : view === 'dashboard' ? (
          <AnalyticsDashboard students={students} />
        ) : (
          <div ref={containerRef} className="flex flex-1 w-full relative select-none">
            <div 
              style={{ width: isCollapsed ? '100%' : `${100 - resumeWidth}%` }}
              className={`flex flex-col z-10 shadow-[4px_0_24px_rgba(0,0,0,0.05)] border-r border-slate-200 bg-white select-text ${isDragging ? '' : 'transition-all duration-300'}`}
            >
              <ReviewGrid 
                students={students}
                onStudentsChange={setStudents}
                onSelectCell={handleSelectCell}
                activeStudentId={activeStudentId}
                activeField={activeField}
                hasJobDescription={hasJobDescription}
                checklistItems={checklistItems}
                isExtracting={isProcessing}
              />
            </div>
            
            {!isCollapsed && (
              <div 
                onMouseDown={startDragging}
                className="w-1.5 hover:w-2 bg-slate-200 hover:bg-teal-500 cursor-col-resize transition-all relative flex items-center justify-center select-none z-20 group shrink-0"
              >
                <div className="absolute top-1/2 -translate-y-1/2 w-4.5 h-10 bg-white border border-slate-200 rounded-lg shadow-md flex flex-col items-center justify-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <div className="w-0.5 h-1 bg-slate-400 rounded-full" />
                  <div className="w-0.5 h-1 bg-slate-400 rounded-full" />
                  <div className="w-0.5 h-1 bg-slate-400 rounded-full" />
                </div>
              </div>
            )}

            <div 
              style={{ width: isCollapsed ? '0%' : `${resumeWidth}%` }}
              className={`flex flex-col bg-slate-50 relative overflow-hidden select-text ${isCollapsed ? 'border-none' : 'border-l border-slate-200'} ${isDragging ? '' : 'transition-all duration-300'}`}
            >
              <ResumeViewer 
                studentId={activeStudentId}
                activeField={activeField}
                students={students}
                onCollapse={() => {
                  setPreCollapseWidth(resumeWidth);
                  setIsCollapsed(true);
                }}
                onToggleMaximize={handleToggleMaximize}
                isMaximized={resumeWidth > 55}
              />
            </div>

            {isCollapsed && (
              <button
                onClick={() => {
                  setIsCollapsed(false);
                  setResumeWidth(preCollapseWidth);
                }}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-30 bg-slate-900 hover:bg-teal-600 text-white rounded-l-xl shadow-lg border-l border-t border-b border-slate-800 hover:border-teal-500 px-2.5 py-5 flex flex-col items-center gap-1.5 cursor-pointer transition-all duration-300 group"
                title="Expand Resume Viewer"
              >
                <ChevronLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
                <span className="text-[10px] uppercase font-bold tracking-wider [writing-mode:vertical-lr] rotate-180 select-none">
                  Resume
                </span>
              </button>
            )}
          </div>
        )}
      </main>
      
      <ErrorModal 
        isOpen={errorModal.isOpen} 
        onClose={() => setErrorModal(prev => ({ ...prev, isOpen: false }))}
        errorType={errorModal.type}
        errorMessage={errorModal.message}
      />
      
      <ModelSelectionModal 
        isOpen={isModelModalOpen}
        onClose={() => setIsModelModalOpen(false)}
        currentProvider={modelProvider}
        currentModel={modelName}
        onSave={(provider, model) => {
          setModelProvider(provider);
          setModelName(model);
        }}
      />
    </div>
  );
}
