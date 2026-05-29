import React from 'react';
import { History, Plus, ChevronLeft } from 'lucide-react';

interface SidebarHeaderProps {
  onNewRun: () => void;
  onCollapse: () => void;
}

export const SidebarHeader: React.FC<SidebarHeaderProps> = ({ onNewRun, onCollapse }) => {
  return (
    <div className="h-16 flex items-center justify-between px-4 border-b border-border-subtle border-slate-200 bg-surface-bright/50 bg-slate-50">
      <div className="flex items-center gap-3 text-primary flex-1">
        <History className="w-6 h-6 flex-shrink-0" />
        <h2 className="font-bold text-base leading-none pt-0.5">Runs</h2> 
        <button 
          className="ml-auto mr-2 bg-primary text-white p-1.5 rounded-md hover:bg-teal-700 transition-colors shadow-sm flex items-center justify-center" 
          onClick={onNewRun}
          title="New Extraction"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>
      <button
        onClick={onCollapse}
        className="p-1.5 rounded-md text-slate-500 hover:bg-slate-200 hover:text-primary transition-colors flex items-center justify-center"
        title="Collapse sidebar"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
    </div>
  );
};
