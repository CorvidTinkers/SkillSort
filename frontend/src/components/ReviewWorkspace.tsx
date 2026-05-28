import React, { useState, useRef } from 'react';
import { ReviewGrid } from './ReviewGrid';
import { ResumeViewer } from './ResumeViewer';
import { StudentData } from '../types';
import { ChevronLeft } from 'lucide-react';

interface ReviewWorkspaceProps {
  students: StudentData[];
  activeStudentId: string | null;
  activeField: keyof StudentData | null;
  hasJobDescription: boolean;
  checklistItems: string[];
  isProcessing: boolean;
  onStudentsChange: React.Dispatch<React.SetStateAction<StudentData[]>>;
  onSelectCell: (studentId: string, field: keyof StudentData) => void;
}

export const ReviewWorkspace: React.FC<ReviewWorkspaceProps> = ({
  students,
  activeStudentId,
  activeField,
  hasJobDescription,
  checklistItems,
  isProcessing,
  onStudentsChange,
  onSelectCell
}) => {
  const [resumeWidth, setResumeWidth] = useState(40);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [preCollapseWidth, setPreCollapseWidth] = useState(40);
  const [isDragging, setIsDragging] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);

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

  return (
    <div ref={containerRef} className="flex flex-1 w-full relative select-none h-full overflow-hidden">
      <div 
        style={{ width: isCollapsed ? '100%' : `${100 - resumeWidth}%` }}
        className={`flex flex-col z-10 shadow-[4px_0_24px_rgba(0,0,0,0.05)] border-r border-slate-200 bg-white select-text ${isDragging ? '' : 'transition-all duration-300'} h-full overflow-hidden`}
      >
        <ReviewGrid 
          students={students}
          onStudentsChange={onStudentsChange}
          onSelectCell={onSelectCell}
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
        className={`flex flex-col bg-slate-50 relative overflow-hidden select-text ${isCollapsed ? 'border-none' : 'border-l border-slate-200'} ${isDragging ? '' : 'transition-all duration-300'} h-full`}
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
  );
};
