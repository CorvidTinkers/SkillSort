import React, { useState, useMemo } from 'react';
import { FileDown, X, AlertCircle } from 'lucide-react';
import { StudentData } from '../../types';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: StudentData[];
  onExport: (format: 'csv' | 'xlsx' | 'json', threshold: number, eligibleCandidates: StudentData[]) => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, students, onExport }) => {
  const [exportThreshold, setExportThreshold] = useState(80);
  const [exportFormat, setExportFormat] = useState<'csv' | 'xlsx' | 'json'>('csv');

  const eligibleCandidates = useMemo(() => {
    return students.filter(s => !Number.isNaN(s.atsScore.value) && s.atsScore.value >= exportThreshold);
  }, [students, exportThreshold]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[100] animate-in fade-in duration-200 select-none">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg p-6 max-h-[85vh] flex flex-col animate-in scale-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4 shrink-0">
          <div className="flex items-center gap-2.5 animate-pulse">
            <div className="h-8 w-8 bg-primary/5 text-primary rounded-lg flex items-center justify-center">
              <FileDown size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 tracking-tight">Configure Placement Export</h3>
              <p className="text-[11px] text-slate-500 font-medium">Bundle records into an actionable spreadsheet portfolio.</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-50 p-1.5 rounded-lg transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto space-y-5 pr-1 py-1">
          
          {/* ATS Threshold Setting slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-700">Minimum Compatible Match Rating</span>
              <span className="text-primary font-mono font-bold text-xs bg-primary/5 px-2.5 py-0.5 rounded border border-primary/20">&gt;= {exportThreshold}% ATS Score</span>
            </div>
            <input
              type="range"
              min="55"
              max="95"
              step="5"
              value={exportThreshold}
              onChange={(e) => setExportThreshold(Number(e.target.value))}
              className="h-1.5 w-full bg-slate-200 accent-primary cursor-pointer rounded-lg appearance-none"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-semibold px-0.5">
              <span>55% Minimal match</span>
              <span>75% Primary recommendations</span>
              <span>95% Gold star candidates</span>
            </div>
          </div>

          {/* Spreadsheets format */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-700 block">Export Ledger Format</span>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setExportFormat('csv')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition cursor-pointer ${exportFormat === 'csv' ? 'border-primary bg-primary/5 text-primary font-bold ring-1 ring-primary' : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-medium'}`}
              >
                <span className="text-xs font-bold tracking-tight">CSV Ledger</span>
                <span className="text-[10px] text-slate-400 font-semibold mt-1">Universal Sheets</span>
              </button>
              <button
                type="button"
                onClick={() => setExportFormat('xlsx')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition cursor-pointer ${exportFormat === 'xlsx' ? 'border-primary bg-primary/5 text-primary font-bold ring-1 ring-primary' : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-medium'}`}
              >
                <span className="text-xs font-bold tracking-tight">XLSX Document</span>
                <span className="text-[10px] text-slate-400 font-semibold mt-1">Excel Formatted</span>
              </button>
              <button
                type="button"
                onClick={() => setExportFormat('json')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition cursor-pointer ${exportFormat === 'json' ? 'border-primary bg-primary/5 text-primary font-bold ring-1 ring-primary' : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-medium'}`}
              >
                <span className="text-xs font-bold tracking-tight">JSON Matrix</span>
                <span className="text-[10px] text-slate-400 font-semibold mt-1">Full API Schema</span>
              </button>
            </div>
          </div>

          {/* dynamic list check preview */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-700">Matched Candidates Shortlist ({eligibleCandidates.length})</span>
              <span className="text-[10px] text-slate-500 font-semibold select-none">Meets Criterion cutoff</span>
            </div>

            <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-40 overflow-y-auto bg-slate-50">
              {eligibleCandidates.map(candidate => (
                <div key={candidate.id} className="flex px-3.5 py-2.5 items-center justify-between text-xs transition hover:bg-white select-none">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-bold text-slate-800">{String(candidate.name.value)}</span>
                    <span className="text-[10px] text-slate-400 font-semibold">{String(candidate.domain.value)}</span>
                  </div>
                  <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                    {Number(candidate.atsScore.value)}% Match
                  </span>
                </div>
              ))}
              {eligibleCandidates.length === 0 && (
                <div className="text-center py-8 text-slate-400 text-xs flex flex-col items-center gap-1.5 justify-center">
                  <AlertCircle size={15} className="text-slate-400" />
                  <span>No candidates currently score above {exportThreshold}% Match. Try lowering the threshold criteria slider.</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions Footer */}
        <div className="pt-4 border-t border-slate-100 mt-4 flex gap-3 shrink-0 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-bold text-slate-500 hover:text-slate-800 px-4 py-2 border border-slate-200 hover:bg-slate-50 transition rounded-lg"
          >
            Dismiss Window
          </button>
          <button
            type="button"
            disabled={eligibleCandidates.length === 0}
            onClick={() => onExport(exportFormat, exportThreshold, eligibleCandidates)}
            className="bg-primary hover:bg-primary-container disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 disabled:cursor-not-allowed text-white font-bold text-xs px-4 py-2 flex items-center gap-2 rounded-lg transition shadow-sm border border-primary/20 cursor-pointer"
          >
            <FileDown size={14} /> Download Filtered Shortlist
          </button>
        </div>
      </div>
    </div>
  );
};
