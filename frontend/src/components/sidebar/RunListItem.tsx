import React from 'react';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { RunHistory } from '../../services/api';

interface RunListItemProps {
  run: RunHistory;
  isActive: boolean;
  onClick: () => void;
}

export const RunListItem: React.FC<RunListItemProps> = ({ run, isActive, onClick }) => {
  if (isActive) {
    return (
      <div 
        onClick={onClick}
        className="relative flex flex-col gap-1 p-3 rounded-xl bg-primary/10 cursor-pointer group transition-all duration-200"
      >
        <div className="absolute left-0 top-3 bottom-3 w-1 bg-primary rounded-full"></div>
        <div className="flex justify-between items-center pl-2">
          <h3 className="font-semibold text-sm text-primary">Run {run.run_id}</h3>
          <CheckCircle className="text-primary w-4 h-4" />
        </div>
        <div className="flex justify-between items-end pl-2">
          <div className="flex flex-col">
            <span className="text-xs text-slate-700 font-semibold">
              {new Date(run.run_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
            <span className="text-[11px] text-slate-800 font-medium">{run.candidate_count} Resumes</span>
          </div>
          <ArrowRight className="text-primary/40 w-4 h-4" />
        </div>
      </div>
    );
  }

  return (
    <div 
      onClick={onClick}
      className="relative flex flex-col gap-1 p-3 rounded-xl bg-slate-50 border border-slate-100 shadow-sm hover:bg-slate-100 hover:border-slate-200 cursor-pointer group transition-all duration-200"
    >
      <div className="flex justify-between items-center pl-2">
        <h3 className="font-semibold text-sm text-slate-800 group-hover:text-primary">Run {run.run_id}</h3>
      </div>
      <div className="flex justify-between items-end pl-2">
        <div className="flex flex-col">
          <span className="text-xs text-slate-700 font-semibold">
            {new Date(run.run_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
          <span className="text-[11px] text-slate-800 font-medium">{run.candidate_count} Resumes</span>
        </div>
        <ArrowRight className="text-slate-400/50 group-hover:text-primary/40 transition-colors w-4 h-4" />
      </div>
    </div>
  );
};
