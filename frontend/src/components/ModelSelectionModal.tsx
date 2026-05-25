import React, { useState, useEffect } from 'react';
import { X, Server, Cpu } from 'lucide-react';

interface ModelSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProvider: string;
  currentModel: string;
  onSave: (provider: string, modelName: string) => void;
}

export function ModelSelectionModal({ isOpen, onClose, currentProvider, currentModel, onSave }: ModelSelectionModalProps) {
  const [provider, setProvider] = useState(currentProvider);
  const [modelName, setModelName] = useState(currentModel);
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      setProvider(currentProvider);
      setModelName(currentModel);
      
      const savedHistory = localStorage.getItem('modelHistory');
      if (savedHistory) {
        try {
          setHistory(JSON.parse(savedHistory));
        } catch(e) {
          console.error("Failed to parse model history", e);
        }
      }
    }
  }, [isOpen, currentProvider, currentModel]);

  const handleSave = () => {
    let newHistory = [...history];
    if (modelName.trim() && !history.includes(modelName.trim())) {
      newHistory = [modelName.trim(), ...history].slice(0, 5); // keep last 5
      setHistory(newHistory);
      localStorage.setItem('modelHistory', JSON.stringify(newHistory));
    }
    
    // Also save current selection to persist across reloads
    localStorage.setItem('currentModelProvider', provider);
    localStorage.setItem('currentModelName', modelName.trim() || modelName);

    onSave(provider, modelName.trim() || modelName);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">Model Selection</h2>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Provider Selection */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-slate-700">AI Provider</label>
            <div className="grid grid-cols-2 gap-3">
              <label className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${provider === 'groq' ? 'border-primary bg-primary/5 text-primary' : 'border-slate-200 hover:border-slate-300 text-slate-600'}`}>
                <input 
                  type="radio" 
                  name="provider" 
                  value="groq" 
                  checked={provider === 'groq'}
                  onChange={(e) => setProvider(e.target.value)}
                  className="sr-only"
                />
                <Server size={24} />
                <span className="font-semibold text-sm">Groq (Cloud)</span>
              </label>
              
              <label className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${provider === 'ollama' ? 'border-primary bg-primary/5 text-primary' : 'border-slate-200 hover:border-slate-300 text-slate-600'}`}>
                <input 
                  type="radio" 
                  name="provider" 
                  value="ollama" 
                  checked={provider === 'ollama'}
                  onChange={(e) => setProvider(e.target.value)}
                  className="sr-only"
                />
                <Cpu size={24} />
                <span className="font-semibold text-sm">Ollama (Local)</span>
              </label>
            </div>
          </div>

          {/* Model Name Input */}
          <div className="space-y-3">
            <label htmlFor="modelName" className="text-sm font-semibold text-slate-700">Model Name</label>
            <input 
              id="modelName"
              type="text" 
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              placeholder={provider === 'groq' ? "e.g., llama-3.3-70b-versatile" : "e.g., gemma2"}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm font-medium text-slate-700"
            />
            
            {/* History Badges */}
            {history.length > 0 && (
              <div className="pt-2">
                <p className="text-xs text-slate-500 mb-2 font-medium">Recent Models</p>
                <div className="flex flex-wrap gap-2">
                  {history.map((histModel, idx) => (
                    <button
                      key={idx}
                      onClick={() => setModelName(histModel)}
                      className="px-3 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium transition-colors cursor-pointer"
                    >
                      {histModel}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white text-sm font-semibold shadow-sm transition-colors cursor-pointer"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
