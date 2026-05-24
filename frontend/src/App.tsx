import React, { useState, useRef, useEffect } from 'react';
import { UploadZone } from './components/UploadZone';
import { ReviewGrid } from './components/ReviewGrid';
import { ResumeViewer } from './components/ResumeViewer';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { Login } from './components/Login';
import { extractResumesBatch, fetchSavedCandidates } from './services/api';
import { StudentData, User } from './types';
import { Briefcase, ChevronLeft, LogOut } from 'lucide-react';

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

  const [resumeWidth, setResumeWidth] = useState(40);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [preCollapseWidth, setPreCollapseWidth] = useState(40);
  const [isDragging, setIsDragging] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = localStorage.getItem('skillsort_token');
    if (token) {
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(window.atob(base64));
        const loggedInUser: User = {
          id: payload.sub,
          email: payload.email,
          name: payload.name,
          ssoProvider: payload.sso_provider,
          avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(payload.name)}`
        };
        setUser(loggedInUser);
        
        setIsProcessing(true);
        fetchSavedCandidates()
          .then(data => {
            setStudents(data);
            setHasUploaded(data.length > 0);
            if (data.length > 0) {
              setActiveStudentId(data[0].id);
              setActiveField('domain');
            }
          })
          .catch(err => {
            console.error('Failed to load saved candidates', err);
          })
          .finally(() => {
            setIsProcessing(false);
          });
      } catch (e) {
        localStorage.removeItem('skillsort_token');
      }
    }
  }, []);

  const handleLoginSuccess = async (loggedInUser: User) => {
    setUser(loggedInUser);
    setIsProcessing(true);
    try {
      const data = await fetchSavedCandidates();
      setStudents(data);
      setHasUploaded(data.length > 0);
      if (data.length > 0) {
        setActiveStudentId(data[0].id);
        setActiveField('domain');
      }
    } catch (err) {
      console.error('Failed to load saved candidates on login', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('skillsort_token');
    setUser(null);
    setStudents([]);
    setHasUploaded(false);
    setActiveStudentId(null);
    setActiveField(null);
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

  const handleUpload = async (file: File, hasJd: boolean, jdText: string, checklist: string[]) => {
    setIsProcessing(true);
    setHasUploaded(true);
    setHasJobDescription(hasJd);
    setChecklistItems(checklist);
    setStudents([]);
    
    try {
      const targetFields = ['name', 'domain', 'skills', 'experience', 'role', 'githubInfo'];
      let isFirst = true;
      
      await extractResumesBatch(file, targetFields, jdText, checklist, (student) => {
        setStudents(prev => [...prev, student]);
        
        if (isFirst) {
          setActiveStudentId(student.id);
          setActiveField('domain');
          isFirst = false;
        }
      });
      
    } catch (err) {
      console.error('Upload failed', err);
      alert('Failed to process the batch. Please check console for details.');
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
      <header className="h-16 bg-surface-container-lowest border-b border-slate-200 shrink-0 flex items-center px-6 justify-between select-none shadow-sm z-20">
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

        <div className="flex items-center gap-4 text-sm font-semibold text-slate-600">
          <button className="hover:text-primary transition-colors cursor-pointer mr-2">Documentation</button>
          
          <div className="flex items-center gap-3 pl-4 border-l border-slate-200 select-none">
            <img 
              src={user.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name)}`} 
              alt={user.name} 
              className="h-8 w-8 rounded-full border border-slate-200 object-cover shadow-sm"
            />
            <div className="flex flex-col text-left">
              <span className="text-xs font-bold text-slate-800 leading-none">{user.name}</span>
              <span className="text-[9px] font-normal text-slate-400 leading-tight uppercase tracking-wider">{user.ssoProvider} Workspace</span>
            </div>
            <button 
              onClick={handleLogout}
              title="Logout from SkillSort"
              className="h-8 w-8 text-slate-400 hover:text-red-500 bg-slate-100 hover:bg-red-50 rounded-lg flex items-center justify-center border border-slate-200/60 hover:border-red-200 transition-all duration-200 cursor-pointer shadow-sm"
            >
              <LogOut size={14} />
            </button>
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
    </div>
  );
}
