import React, { useState, useRef, useEffect } from 'react';
import { Briefcase, Settings } from 'lucide-react';
import { User } from '../types';

interface GlobalHeaderProps {
  user: User;
  hasUploaded: boolean;
  view: 'grid' | 'dashboard';
  onViewChange: (view: 'grid' | 'dashboard') => void;
  onModelSelectClick: () => void;
}

export const GlobalHeader: React.FC<GlobalHeaderProps> = ({
  user,
  hasUploaded,
  view,
  onViewChange,
  onModelSelectClick
}) => {
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getInitials = (user: User | null): string => {
    if (!user || !user.name) return 'PO';
    return user.name.charAt(0).toUpperCase();
  };

  return (
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
              onClick={() => onViewChange('grid')}
              className={`text-[14px] font-semibold pb-1 cursor-pointer transition-colors relative ${view === 'grid' ? 'text-primary' : 'text-slate-600 hover:text-primary'}`}
            >
              Review Grid
              {view === 'grid' && (
                <span className="absolute bottom-[-20px] left-0 right-0 h-[2.5px] bg-primary rounded-t-full" />
              )}
            </button>
            <button 
              onClick={() => onViewChange('dashboard')}
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
            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 py-2 animate-in slide-in-from-top-2 fade-in duration-200 z-50">
              <div className="px-4 py-2 border-b border-slate-100 mb-2">
                <p className="text-sm font-semibold text-slate-800 truncate">{user?.name}</p>
                <p className="text-xs text-slate-500 truncate">{user?.email}</p>
              </div>
              <button 
                onClick={() => {
                  setIsProfileDropdownOpen(false);
                  onModelSelectClick();
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
  );
};
