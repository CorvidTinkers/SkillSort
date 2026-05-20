import { FileUp, Inbox, FileText } from 'lucide-react';

interface UploadZoneProps {
  onUpload: () => void;
}

export function UploadZone({ onUpload }: UploadZoneProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] w-full bg-slate-50 p-6">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-3">
            SkillSort Inbox
          </h1>
          <p className="text-slate-500 text-lg">
            Batch process student resumes into a searchable database with AI-powered extraction.
          </p>
        </div>

        <div onClick={onUpload} className="bg-white border-2 border-dashed border-teal-300 rounded-2xl p-12 flex flex-col items-center text-center cursor-pointer hover:border-teal-500 hover:bg-emerald-50/30 transition-all shadow-sm group">
          <div className="h-20 w-20 bg-teal-100 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <FileUp className="h-10 w-10 text-teal-600" />
          </div>
          <h3 className="text-xl font-semibold text-slate-800 mb-2">
            Drag & drop placement files
          </h3>
          <p className="text-slate-500 max-w-sm mb-6 pb-6 border-b border-slate-100">
            Upload .zip of PDF resumes or a .csv containing cloud drive links.
          </p>
          <div className="flex items-center gap-4 text-sm text-slate-400">
            <span className="flex items-center gap-1.5 bg-slate-100 px-3 py-1 rounded-full"><FileText size={14}/> PDF</span>
            <span className="flex items-center gap-1.5 bg-slate-100 px-3 py-1 rounded-full"><Inbox size={14}/> ZIP</span>
            <span className="flex items-center gap-1.5 bg-slate-100 px-3 py-1 rounded-full"><FileText size={14}/> CSV</span>
          </div>
        </div>
      </div>
    </div>
  );
}
