import React from 'react';
import { Database } from 'lucide-react';

interface RecalculatingOverlayProps {
  isVisible: boolean;
  progress: number;
  subtext: string;
}

export const RecalculatingOverlay: React.FC<RecalculatingOverlayProps> = ({ isVisible, progress, subtext }) => {
  if (!isVisible) return null;

  return (
    <div className="absolute inset-0 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center z-40 transition-all duration-300">
      <div className="max-w-md w-full px-6 flex flex-col items-center text-center">
        <div className="relative mb-6">
          <div className="h-16 w-16 rounded-full border-4 border-slate-100 border-t-primary animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Database size={18} className="text-primary animate-pulse" />
          </div>
        </div>

        <h3 className="text-base font-bold text-slate-800 tracking-tight">Recalculating Compatibility Ratings</h3>
        <p className="text-xs text-slate-500 h-5 mt-1.5 animate-pulse font-medium">{subtext}</p>
        
        {/* Progress Line */}
        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-6 mb-3.5 border border-slate-200">
          <div 
            className="bg-primary h-full transition-all duration-300 rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
        
        <span className="text-xs font-mono font-bold text-primary">{progress}% Complete</span>
      </div>
    </div>
  );
};
