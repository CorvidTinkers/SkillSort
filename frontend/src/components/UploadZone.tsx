import { FileUp, Inbox, FileText, Check, Plus, X, Briefcase, Sparkles, CheckCircle2, RefreshCw } from 'lucide-react';
import { useRef, useState } from 'react';
import { React } from 'react';
interface UploadZoneProps {
  onUpload: (file: File, hasJd: boolean, jdText: string, checklist: string[]) => void;
  isProcessing?: boolean;
}

export function UploadZone({ onUpload, isProcessing }: UploadZoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [haveJd, setHaveJd] = useState(false);
  const [enableAts, setEnableAts] = useState(true);
  const [showMustHaves, setShowMustHaves] = useState(false);
  const [jdText, setJdText] = useState('');
  const [mustHaveInput, setMustHaveInput] = useState('');
  const [mustHaves, setMustHaves] = useState<string[]>([]);

  const handleAddMustHave = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ((e.type === 'keydown' && (e as React.KeyboardEvent).key !== 'Enter') || !mustHaveInput.trim()) return;
    e.preventDefault();
    if (!mustHaves.includes(mustHaveInput.trim())) {
      setMustHaves([...mustHaves, mustHaveInput.trim()]);
    }
    setMustHaveInput('');
  };

  const removeMustHave = (item: string) => {
    setMustHaves(mustHaves.filter(m => m !== item));
  };

  const handleClick = () => {
    if (!isProcessing && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleProceed = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedFile) {
      onUpload(selectedFile, haveJd, jdText, mustHaves);
    }
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] w-full bg-slate-50 p-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-3">
          SkillSort Inbox
        </h1>
        <p className="text-slate-500 text-lg">
          Batch process student resumes into a searchable database with AI-powered extraction.
        </p>
      </div>

      <div className={`flex flex-row items-stretch gap-6 transition-all duration-500 ease-in-out w-full ${haveJd ? 'max-w-5xl' : 'max-w-2xl'}`}>

        {/* Left Side: Toggle & Drop Zone */}
        <div className={`flex flex-col gap-4 transition-all duration-500 ${haveJd ? 'w-1/2' : 'w-full'}`}>
          <button
            onClick={() => setHaveJd(!haveJd)}
            className={`flex items-center justify-between p-4 rounded-xl border transition-all ${haveJd ? 'bg-primary/5 border-primary shadow-sm' : 'bg-white border-slate-200 hover:border-primary/50'}`}
          >
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center transition-colors ${haveJd ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500'}`}>
                <Briefcase size={20} />
              </div>
              <div className="text-left">
                <h3 className={`font-bold tracking-tight transition-colors ${haveJd ? 'text-primary' : 'text-slate-800'}`}>Have Job Description?</h3>
                <p className={`text-xs font-medium transition-colors ${haveJd ? 'text-primary/70' : 'text-slate-500'}`}>Enable targeted AI context extraction</p>
              </div>
            </div>
            <div className={`w-12 h-6 rounded-full transition-colors flex items-center px-1 ${haveJd ? 'bg-primary' : 'bg-slate-200'}`}>
              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${haveJd ? 'translate-x-6' : 'translate-x-0'}`} />
            </div>
          </button>

          <div onClick={!selectedFile ? handleClick : undefined} className={`flex-1 min-h-[350px] bg-white border-2 border-dashed ${selectedFile ? 'border-primary' : 'border-teal-300'} rounded-2xl p-12 flex flex-col items-center justify-center text-center transition-all shadow-sm group ${isProcessing ? 'opacity-70 cursor-wait' : (!selectedFile ? 'cursor-pointer hover:border-teal-500 hover:bg-emerald-50/30' : '')}`}>
            {selectedFile && !isProcessing ? (
              <div className="flex flex-col items-center animate-in zoom-in duration-300 w-full max-w-[280px]">
                <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                  <CheckCircle2 className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2 truncate w-full text-center">
                  {selectedFile.name}
                </h3>
                <p className="text-slate-500 mb-8 font-medium">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                </p>

                <div className="flex items-center gap-3 w-full">
                  <button
                    onClick={handleCancel}
                    className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-rose-200 text-rose-600 font-bold hover:bg-rose-50 transition-colors"
                  >
                    <RefreshCw size={16} /> Replace
                  </button>
                  <button
                    onClick={handleProceed}
                    className="flex-[2] flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-primary text-white font-bold shadow-md shadow-primary/20 hover:bg-primary-container transition-colors"
                  >
                    Proceed <Check size={16} strokeWidth={3} />
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="h-20 w-20 bg-teal-100 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <FileUp className={`h-10 w-10 text-teal-600 ${isProcessing ? 'animate-bounce' : ''}`} />
                </div>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">
                  {isProcessing ? 'Processing batch with AI...' : 'Drag & drop placement files'}
                </h3>
                <p className="text-slate-500 max-w-sm mb-6 pb-6 border-b border-slate-100">
                  {isProcessing ? 'This may take a few seconds per PDF.' : 'Upload .zip of PDF resumes or a .csv containing cloud drive links.'}
                </p>
                {!isProcessing && (
                  <div className="flex items-center gap-4 text-sm text-slate-400">
                    <span className="flex items-center gap-1.5 bg-slate-100 px-3 py-1 rounded-full"><FileText size={14} /> PDF</span>
                    <span className="flex items-center gap-1.5 bg-slate-100 px-3 py-1 rounded-full"><Inbox size={14} /> ZIP</span>
                    <span className="flex items-center gap-1.5 bg-slate-100 px-3 py-1 rounded-full"><FileText size={14} /> CSV</span>
                  </div>
                )}
              </>
            )}
            <input
              type="file"
              accept=".zip"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileChange}
            />
          </div>
        </div>

        {/* Right Side: JD Panel */}
        <div className={`flex flex-col transition-all duration-500 ease-in-out ${haveJd ? 'w-1/2 opacity-100 translate-x-0' : 'w-0 opacity-0 translate-x-32 overflow-hidden'}`}>
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col gap-4 h-full min-w-[380px]">
            <div className="flex items-center gap-3 mb-2 pb-4 border-b border-slate-100">
              <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-primary/10 text-primary">
                <Briefcase size={20} />
              </div>
              <div className="text-left">
                <h3 className="font-bold text-slate-800 tracking-tight">Job Context</h3>
                <p className="text-xs text-slate-500 font-medium">Configure target skills & evaluation parameters</p>
              </div>
            </div>

            <textarea
              placeholder="Paste the Job Description here. The Extractor Agent will use this to find the most relevant skills..."
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
              className="flex-1 min-h-[160px] p-4 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm text-slate-700 resize-none transition-all placeholder:text-slate-400"
            />

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <button
                onClick={() => setEnableAts(!enableAts)}
                className="flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-900 group"
              >
                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${enableAts ? 'bg-primary border-primary text-white' : 'border-slate-300 bg-white group-hover:border-primary'}`}>
                  {enableAts && <Check size={12} strokeWidth={3} />}
                </div>
                Enable ATS Engine?
              </button>

              <button
                onClick={() => setShowMustHaves(!showMustHaves)}
                className={`flex items-center gap-1.5 text-sm font-bold transition-colors ${showMustHaves ? 'text-primary' : 'text-slate-500 hover:text-slate-800'}`}
              >
                <Sparkles size={16} className={showMustHaves ? 'text-primary' : ''} />
                Any must haves?
              </button>
            </div>

            <div className={`transition-all duration-300 overflow-hidden ${showMustHaves ? 'opacity-100 max-h-[300px] pt-2' : 'opacity-0 max-h-0 pt-0'}`}>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  placeholder="e.g. B.Tech in CS (Press Enter)"
                  value={mustHaveInput}
                  onChange={(e) => setMustHaveInput(e.target.value)}
                  onKeyDown={handleAddMustHave}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                />
                <button
                  onClick={handleAddMustHave}
                  className="bg-primary hover:bg-primary-container text-white px-3 py-2 rounded-lg transition flex items-center justify-center"
                >
                  <Plus size={18} />
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {mustHaves.map(item => (
                  <span key={item} className="inline-flex items-center gap-1.5 bg-slate-100 border border-slate-200 text-slate-700 px-2.5 py-1 rounded-md text-xs font-semibold">
                    {item}
                    <button onClick={() => removeMustHave(item)} className="hover:text-rose-500 transition-colors">
                      <X size={12} />
                    </button>
                  </span>
                ))}
                {mustHaves.length === 0 && (
                  <span className="text-xs text-slate-400 font-medium italic">If left blank, LLM will auto-infer from JD.</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

