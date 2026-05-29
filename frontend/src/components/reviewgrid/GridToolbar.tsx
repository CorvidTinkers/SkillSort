import React from 'react';
import { Layers } from 'lucide-react';

interface GridToolbarProps {
  recordCount: number;
  isExtracting: boolean;
}

export const GridToolbar: React.FC<GridToolbarProps> = ({ recordCount, isExtracting }) => {
  return (
    <div className="h-14 border-b border-slate-200 flex items-center px-6 shrink-0 bg-white relative overflow-hidden">
      
      {/* Active Connection Indeterminate Loading Bar */}
      {isExtracting && (
        <div className="absolute top-0 left-0 w-full h-1 bg-slate-100 overflow-hidden">
          <div className="h-full bg-primary/80 w-1/3 animate-[pulse_1.5s_infinite_linear] rounded-r-full" />
        </div>
      )}

      <div className="flex items-center gap-3">
        <Layers className="h-5 w-5 text-primary" />
        <h2 className="font-semibold text-slate-800">Review Extraction ({recordCount} Records)</h2>
        
        {/* Subtle palatable legend displaying confidence mapping */}
        <div className="flex items-center gap-3.5 ml-4 pl-4 border-l border-slate-200 text-xs text-slate-500 font-medium select-none">
          <span className="text-slate-400">Confidence:</span>
          <span className="flex items-center gap-1 font-semibold">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-100 border border-emerald-400" /> 
            High
          </span>
          <span className="flex items-center gap-1 font-semibold">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-100 border border-amber-400" /> 
            Med
          </span>
          <span className="flex items-center gap-1 font-semibold">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-100 border border-rose-400" /> 
            Low
          </span>
        </div>
      </div>
    </div>
  );
};
