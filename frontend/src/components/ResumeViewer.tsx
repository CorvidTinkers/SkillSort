import { StudentData } from '../types';
import { MOCK_STUDENTS } from '../data';
import { ChevronRight, Maximize2, Minimize2, ZoomIn } from 'lucide-react';

interface ResumeViewerProps {
  studentId: string | null;
  activeField: keyof StudentData | null;
  students?: StudentData[];
  onCollapse: () => void;
  onToggleMaximize: () => void;
  isMaximized: boolean;
}

export function ResumeViewer({ 
  studentId, 
  activeField, 
  students = MOCK_STUDENTS,
  onCollapse,
  onToggleMaximize,
  isMaximized
}: ResumeViewerProps) {
  if (!studentId) {
    return (
      <div className="flex flex-col h-full bg-slate-100 border-l border-slate-200">
        <div className="h-14 border-b border-slate-200 bg-white flex items-center justify-between px-4 text-sm font-medium text-slate-600 shadow-sm z-10 select-none">
          <span className="font-semibold text-slate-400">No Document Selected</span>
          <button 
            onClick={onCollapse}
            className="flex items-center gap-1 hover:text-rose-600 cursor-pointer transition py-1 px-1.5 hover:bg-slate-50 rounded text-slate-500"
            title="Collapse panel"
          >
            <ChevronRight size={16} />
            <span className="text-xs">Hide</span>
          </button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
          <p>No document selected</p>
        </div>
      </div>
    );
  }

  const student = students.find(s => s.id === studentId);
  
  if (!student) return null;

  // Function to apply highlighting if the section matches the active field
  const getHighlightClass = (fields: (keyof StudentData)[]) => {
    if (activeField && fields.includes(activeField)) {
      return "bg-emerald-200 ring-4 ring-emerald-300 ring-opacity-50 text-emerald-900 rounded-sm transition-all duration-300";
    }
    return "transition-all duration-300";
  };

  return (
    <div className="flex flex-col h-full bg-slate-100 border-l border-slate-200">
      {/* Viewer Toolbar */}
      <div className="h-14 border-b border-slate-200 bg-white flex items-center justify-between px-4 text-sm font-medium text-slate-600 shadow-sm z-10 select-none">
        <div className="flex items-center gap-2">
          <span className="bg-slate-800 text-white text-[10px] uppercase px-2 py-0.5 rounded animate-pulse">PDF</span>
          <span className="truncate max-w-[150px] sm:max-w-[200px] font-semibold text-slate-700">{student.resumeUrl.split('/').pop()}</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1 hover:text-teal-600 cursor-pointer transition py-1 px-1.5 hover:bg-slate-50 rounded">
            <ZoomIn size={14} />
            <span className="hidden sm:inline text-xs">Zoom</span>
          </button>
          
          <div className="h-4 w-px bg-slate-200" />
          
          {/* Maximize / Split Toggle */}
          <button 
            onClick={onToggleMaximize}
            className="flex items-center gap-1 hover:text-teal-600 cursor-pointer transition py-1 px-1.5 hover:bg-slate-50 rounded text-slate-600"
            title={isMaximized ? "Split View (40%)" : "Maximize Resume (75%)"}
          >
            {isMaximized ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            <span className="hidden sm:inline text-xs">{isMaximized ? "Split" : "Expand"}</span>
          </button>

          <div className="h-4 w-px bg-slate-200" />

          {/* Collapse panel button */}
          <button 
            onClick={onCollapse}
            className="flex items-center gap-1 hover:text-rose-600 cursor-pointer transition py-1 px-1.5 hover:bg-slate-50 rounded text-slate-500"
            title="Collapse Panel"
          >
            <ChevronRight size={16} />
            <span className="hidden sm:inline text-xs">Hide</span>
          </button>
        </div>
      </div>

      {/* Document Canvas */}
      <div className="flex-1 overflow-y-auto p-6 flex justify-center pb-20">
        <div className="bg-white w-full max-w-[21cm] min-h-[29.7cm] shadow-md p-10 font-sans text-slate-800 border border-slate-200 ring-1 ring-slate-900/5">
          {/* Mock Document Render */}
          <div className="space-y-6">
            
            <div className={`text-center pb-6 border-b border-slate-200 ${getHighlightClass(['name'])}`}>
              <h1 className="text-3xl font-bold uppercase tracking-widest text-slate-900 mb-2">{student.resumeText.header}</h1>
              <p className={`text-sm text-slate-500 inline-block ${getHighlightClass(['githubInfo'])}`}>{student.resumeText.contact}</p>
            </div>

            <div className={`pt-2 ${getHighlightClass(['domain', 'role'])}`}>
              <h2 className="text-sm font-bold uppercase tracking-wider text-teal-700 mb-2">Professional Summary</h2>
              <p className="text-sm leading-relaxed text-slate-600">{student.resumeText.summary}</p>
            </div>

            <div className={`pt-2 ${getHighlightClass(['skills'])}`}>
              <h2 className="text-sm font-bold uppercase tracking-wider text-teal-700 mb-2">Technical Core</h2>
              <p className="text-sm leading-relaxed text-slate-600">{student.resumeText.skills}</p>
            </div>

            <div className={`pt-2 ${getHighlightClass(['experience'])}`}>
              <h2 className="text-sm font-bold uppercase tracking-wider text-teal-700 mb-2">Professional Experience</h2>
              <p className="text-sm leading-relaxed text-slate-600">{student.resumeText.experience}</p>
            </div>

            <div className="pt-2">
              <h2 className="text-sm font-bold uppercase tracking-wider text-teal-700 mb-2">Education</h2>
              <p className="text-sm leading-relaxed text-slate-600">{student.resumeText.education}</p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
