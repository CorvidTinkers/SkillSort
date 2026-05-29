import React, { useState } from 'react';
import { Settings2, ListChecks, Activity, FileDown, Search, Check, CheckCircle2 } from 'lucide-react';
import { Table } from '@tanstack/react-table';
import { StudentData } from '../../types';

interface ActionControlsProps {
  table: Table<StudentData>;
  hasJobDescription: boolean;
  checklistItems: string[];
  onRunATS: () => void;
  onExportClick: () => void;
}

export const ActionControls: React.FC<ActionControlsProps> = ({ 
  table, 
  hasJobDescription, 
  checklistItems, 
  onRunATS, 
  onExportClick 
}) => {
  const [columnsMenuOpen, setColumnsMenuOpen] = useState(false);
  const [weightsOpen, setWeightsOpen] = useState(false);
  const [colSearchQuery, setColSearchQuery] = useState('');

  const filteredColumns = table.getAllLeafColumns().filter(col => {
    const headerTitle = String(col.columnDef.header);
    return headerTitle.toLowerCase().includes(colSearchQuery.toLowerCase());
  });

  return (
    <div className="h-12 border-b border-slate-200 flex items-center justify-between px-6 shrink-0 bg-slate-50/80 relative">
      <div className="flex gap-2.5">
        {/* Columns Visibility Selector */}
        <div className="relative">
          <button 
            type="button"
            onClick={() => {
              setColumnsMenuOpen(!columnsMenuOpen);
              setWeightsOpen(false);
            }}
            className={`flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border px-3 py-2 rounded-lg cursor-pointer transition shadow-sm ${columnsMenuOpen ? 'border-primary ring-1 ring-primary z-50 text-slate-900' : 'border-slate-200 hover:border-slate-300'}`}
          >
            <Settings2 size={13} /> Display Columns
          </button>
          
          {columnsMenuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setColumnsMenuOpen(false)} />
              <div className="absolute left-0 top-full mt-2 w-64 bg-slate-900 text-slate-100 rounded-xl shadow-xl border border-slate-800 p-3.5 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Select Fields</span>
                  <button 
                    type="button"
                    onClick={() => {
                      const allVisible = table.getIsAllColumnsVisible();
                      table.toggleAllColumnsVisible(!allVisible);
                    }}
                    className="text-[11px] tracking-tight text-primary hover:text-primary-container font-bold cursor-pointer"
                  >
                    {table.getIsAllColumnsVisible() ? 'Clear All' : 'Reset All'}
                  </button>
                </div>

                <div className="relative mb-2">
                  <Search size={12} className="absolute left-2.5 top-2.5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Filter column keys..."
                    value={colSearchQuery}
                    onChange={(e) => setColSearchQuery(e.target.value)}
                    className="w-full text-xs pl-8 pr-2 py-1.5 bg-slate-950 border border-slate-800 rounded-lg focus:outline-none focus:border-primary text-white placeholder-slate-600 font-medium"
                  />
                </div>

                <div className="space-y-1.5 max-h-52 overflow-y-auto pr-0.5">
                  {filteredColumns.map(column => {
                    const isVisible = column.getIsVisible();
                    return (
                      <button
                        type="button"
                        key={column.id}
                        onClick={() => column.toggleVisibility(!isVisible)}
                        className={`w-full flex items-center justify-between text-left px-2 py-1.5 rounded-md text-xs transition-colors cursor-pointer ${isVisible ? 'bg-slate-800/60 text-white' : 'hover:bg-slate-800/40 text-slate-500'}`}
                      >
                        <span className="font-semibold">{String(column.columnDef.header)}</span>
                        <div className={`h-4 w-4 rounded flex items-center justify-center border transition-all shrink-0 ${isVisible ? 'bg-primary border-primary text-white' : 'border-slate-700 bg-slate-950'}`}>
                          {isVisible && <Check size={11} strokeWidth={3} />}
                        </div>
                      </button>
                    );
                  })}
                  {filteredColumns.length === 0 && (
                    <p className="text-center text-xs text-slate-600 py-3">No matching keys</p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Knockout Checklist Toggle */}
        <div className="relative">
          <button 
            type="button"
            disabled={!hasJobDescription}
            onClick={() => {
              setWeightsOpen(!weightsOpen);
              setColumnsMenuOpen(false);
            }}
            className={`flex items-center gap-1.5 text-xs font-bold bg-white border px-3 py-2 rounded-lg transition shadow-sm ${
              !hasJobDescription 
                ? 'opacity-50 cursor-not-allowed border-slate-200 text-slate-400' 
                : weightsOpen 
                  ? 'border-primary text-primary cursor-pointer' 
                  : 'text-slate-600 hover:text-slate-900 border-slate-200 hover:border-slate-300 cursor-pointer'
            }`}
            title={!hasJobDescription ? "Enable ATS with a Job Description first to use the Checklist" : ""}
          >
            <ListChecks size={13} /> ATS Knockout Checklist
          </button>
          
          {weightsOpen && hasJobDescription && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setWeightsOpen(false)} />
              <div className="absolute left-0 top-full mt-2 w-72 bg-slate-900 text-slate-100 rounded-xl shadow-xl border border-slate-800 p-3.5 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Required Criteria</span>
                </div>
                <div className="space-y-1.5 max-h-64 overflow-y-auto pr-0.5">
                  {(checklistItems && checklistItems.length > 0) ? checklistItems.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 p-2.5 rounded-md bg-slate-800/60 border border-slate-700/50">
                      <CheckCircle2 size={14} className="text-primary shrink-0 mt-0.5" />
                      <span className="text-xs font-medium text-slate-200 leading-snug">{item}</span>
                    </div>
                  )) : (
                    <p className="text-center text-xs text-slate-500 py-3">No knockout criteria found.</p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Fallback ATS Run Button */}
        <button 
          type="button"
          onClick={onRunATS}
          className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-2 rounded-lg cursor-pointer transition shadow-sm"
        >
          <Activity size={13} className="text-emerald-600" /> Run ATS Analysis
        </button>
      </div>

      {/* Export Action */}
      <button 
        type="button"
        onClick={onExportClick}
        className="flex items-center gap-1.5 text-xs font-bold text-white bg-primary hover:bg-primary-container px-3.5 py-2 rounded-lg cursor-pointer transition shadow-sm border border-primary/20"
      >
        <FileDown size={13} /> Export Shortlist
      </button>
    </div>
  );
};
