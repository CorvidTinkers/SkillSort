import React, { useState, useEffect } from 'react';
import { StudentData } from '../types';
import { MOCK_STUDENTS } from '../data';
import { ChevronRight, Maximize2, Minimize2, ZoomIn, FileQuestion } from 'lucide-react';

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
  
  const [pdfState, setPdfState] = useState<{ url: string | null, error: boolean, loading: boolean }>({ 
    url: null, error: false, loading: true 
  });

  useEffect(() => {
    if (!student) return;
    
    setPdfState({ url: null, error: false, loading: true });
    let objectUrl: string | null = null;
    let isMounted = true;

    fetch(student.resumeUrl)
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed');
        const blob = await res.blob();
        if (blob.type !== 'application/pdf') throw new Error('Not a PDF');
        
        objectUrl = URL.createObjectURL(blob);
        if (isMounted) setPdfState({ url: objectUrl, error: false, loading: false });
      })
      .catch(() => {
        if (isMounted) setPdfState({ url: null, error: true, loading: false });
      });

    return () => {
      isMounted = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [student?.resumeUrl]);

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
      <div className="flex-1 overflow-hidden p-0 m-0 bg-slate-50 relative flex items-center justify-center">
        {pdfState.loading && (
           <div className="text-slate-400 flex flex-col items-center gap-3">
             <div className="w-8 h-8 border-4 border-slate-200 border-t-teal-500 rounded-full animate-spin" />
             <span className="text-sm font-medium tracking-wide">Loading document...</span>
           </div>
        )}
        
        {pdfState.error && !pdfState.loading && (
           <div className="flex flex-col items-center justify-center text-slate-400 gap-4 p-8 text-center animate-in fade-in duration-500">
             <div className="text-7xl mb-2 opacity-40 select-none grayscale">🦖</div>
             <h3 className="text-lg font-semibold text-slate-500">Oops! We had trouble opening this resume.</h3>
             <p className="text-sm max-w-sm leading-relaxed">
               The document might be corrupted, deleted from the server, or you might not have the correct permissions to view it.
             </p>
           </div>
        )}

        {pdfState.url && !pdfState.loading && (
          <iframe 
            src={pdfState.url} 
            className="w-full h-full border-none"
            title="Resume PDF"
          />
        )}
      </div>
    </div>
  );
}
