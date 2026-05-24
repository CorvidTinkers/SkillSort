import React, { useState } from 'react';
import { loginWithCredentials, signUpWithCredentials } from '../services/api';
import { User } from '../types';
import { Shield, ArrowRight, Sparkles, Mail, User as UserIcon, Lock } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: (user: User) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [customTab, setCustomTab] = useState<'signin' | 'signup'>('signin');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all required fields.');
      return;
    }
    if (customTab === 'signup' && !name.trim()) {
      setError('Name is required for registration.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    try {
      if (customTab === 'signup') {
        const data = await signUpWithCredentials(name.trim(), email.trim(), password);
        onLoginSuccess(data.user);
      } else {
        const data = await loginWithCredentials(email.trim(), password);
        onLoginSuccess(data.user);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-900 bg-radial-[circle_at_top,_var(--tw-gradient-stops)] from-slate-800 via-slate-950 to-black p-6 font-sans relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-[150px] pointer-events-none" />

      <div className="w-full max-w-4xl bg-slate-950/70 border border-slate-800 backdrop-blur-xl rounded-2xl shadow-[0_24px_64px_rgba(0,0,0,0.6)] grid md:grid-cols-12 overflow-hidden z-10">
        
        {/* Left Intro Card */}
        <div className="md:col-span-5 bg-gradient-to-br from-primary to-[#004f47] p-8 md:p-12 flex flex-col justify-between text-white relative">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent opacity-40 pointer-events-none" />
          
          <div>
            <div className="flex items-center gap-2 mb-6">
              <div className="h-8 w-8 bg-white/10 text-white rounded flex items-center justify-center border border-white/20">
                <Shield size={18} className="text-white" />
              </div>
              <span className="font-display font-bold text-xl tracking-tight">SkillSort</span>
            </div>
            
            <h1 className="text-2xl md:text-3xl font-display font-extrabold tracking-tight leading-tight mb-4">
              Placement <br />Intelligence Secure Portal
            </h1>
            <p className="text-slate-200 text-sm leading-relaxed font-light font-sans">
              Evaluate talent securely. Dynamic resume data extraction, semantic ATS scoring, and custom knockout checks isolated for every account.
            </p>
          </div>

          <div className="mt-12 md:mt-0">
            <div className="bg-black/20 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-1.5 animate-pulse">
                <Sparkles size={14} className="text-teal-300" />
                <span className="text-[11px] font-bold text-teal-300 uppercase tracking-widest">Multi-Tenant Vault</span>
              </div>
              <p className="text-[12px] text-slate-300 font-light leading-relaxed">
                All resume PDF blobs and candidate records are cryptographically secure and bound only to your user login session.
              </p>
            </div>
          </div>
        </div>

        {/* Right Credentials Form */}
        <div className="md:col-span-7 p-8 md:p-12 flex flex-col justify-center bg-slate-950">
          
          <div className="mb-6">
            <h2 className="text-xl font-bold text-white mb-1.5 flex items-center gap-2">
              {customTab === 'signin' ? 'Account Sign In' : 'Create Account'}
            </h2>
            <p className="text-slate-400 text-xs">
              Enter your credentials to securely access your workspace.
            </p>
          </div>

          {error && (
            <div className="mb-6 bg-red-950/40 border border-red-800/80 rounded-lg p-3.5 text-xs text-red-400 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleCustomSubmit} className="space-y-4">
            
            {/* Elegant Tab Selectors */}
            <div className="flex bg-slate-900 p-1.5 rounded-xl border border-slate-800/80 mb-2 select-none">
              <button
                type="button"
                onClick={() => {
                  setCustomTab('signin');
                  setError(null);
                }}
                className={`flex-1 py-2 text-center text-xs font-semibold rounded-lg transition-all cursor-pointer ${customTab === 'signin' ? 'bg-primary text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setCustomTab('signup');
                  setError(null);
                }}
                className={`flex-1 py-2 text-center text-xs font-semibold rounded-lg transition-all cursor-pointer ${customTab === 'signup' ? 'bg-primary text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Sign Up
              </button>
            </div>

            <div className="grid gap-4">
              {customTab === 'signup' && (
                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-1.5">Full Name</label>
                  <div className="relative">
                    <UserIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Jane Doe"
                      required
                      disabled={isLoading}
                      className="w-full bg-slate-900 border border-slate-800 hover:border-slate-700 focus:border-primary focus:outline-none rounded-xl pl-9 pr-4 py-3 text-sm text-slate-200 placeholder-slate-500 transition-colors"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-slate-400 text-xs font-semibold mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jane.doe@company.com"
                    required
                    disabled={isLoading}
                    className="w-full bg-slate-900 border border-slate-800 hover:border-slate-700 focus:border-primary focus:outline-none rounded-xl pl-9 pr-4 py-3 text-sm text-slate-200 placeholder-slate-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 text-xs font-semibold mb-1.5">Password</label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    disabled={isLoading}
                    className="w-full bg-slate-900 border border-slate-800 hover:border-slate-700 focus:border-primary focus:outline-none rounded-xl pl-9 pr-4 py-3 text-sm text-slate-200 placeholder-slate-500 transition-colors"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 flex flex-col gap-3">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-primary hover:bg-primary-container text-white rounded-xl text-sm font-semibold transition-all duration-200 shadow-md flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isLoading
                  ? 'Processing...'
                  : (customTab === 'signin' ? 'Sign In' : 'Create Account')
                }
                <ArrowRight size={14} />
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
};
