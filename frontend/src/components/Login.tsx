import React, { useState } from 'react';
import { loginWithCredentials, signUpWithCredentials } from '../services/api';
import { User } from '../types';
import { Briefcase, ArrowRight, Mail, User as UserIcon, Lock } from 'lucide-react';

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
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 p-6 font-sans">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden z-10 p-8 flex flex-col">
          <div className="flex items-center gap-3 mb-8 justify-center">
            <div className="h-10 w-10 bg-primary/10 text-primary rounded flex items-center justify-center shadow-sm">
              <Briefcase size={22} strokeWidth={2.5} />
            </div>
            <span className="text-primary font-display font-bold text-3xl tracking-tight">SkillSort</span>
          </div>

          <div className="mb-6 text-center">
            <h2 className="text-xl font-bold text-slate-800 mb-1.5">
              {customTab === 'signin' ? 'Welcome back' : 'Create an account'}
            </h2>
            <p className="text-slate-500 text-sm">
              Enter your credentials to securely access your workspace.
            </p>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-100 rounded-lg p-3.5 text-sm text-red-600 font-medium text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleCustomSubmit} className="space-y-4">
            {/* Elegant Tab Selectors */}
            <div className="flex bg-slate-100 p-1 rounded-lg mb-6 select-none">
              <button
                type="button"
                onClick={() => {
                  setCustomTab('signin');
                  setError(null);
                }}
                className={`flex-1 py-2 text-center text-sm font-medium rounded-md transition-all cursor-pointer ${customTab === 'signin' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setCustomTab('signup');
                  setError(null);
                }}
                className={`flex-1 py-2 text-center text-sm font-medium rounded-md transition-all cursor-pointer ${customTab === 'signup' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Sign Up
              </button>
            </div>

            <div className="grid gap-4">
              {customTab === 'signup' && (
                <div>
                  <label className="block text-slate-700 text-sm font-medium mb-1.5">Full Name</label>
                  <div className="relative">
                    <UserIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Jane Doe"
                      required
                      disabled={isLoading}
                      className="w-full bg-white border border-slate-200 hover:border-slate-300 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 transition-colors"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-slate-700 text-sm font-medium mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jane.doe@company.com"
                    required
                    disabled={isLoading}
                    className="w-full bg-white border border-slate-200 hover:border-slate-300 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 text-sm font-medium mb-1.5">Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    disabled={isLoading}
                    className="w-full bg-white border border-slate-200 hover:border-slate-300 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 transition-colors"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 flex flex-col gap-3">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-primary hover:bg-teal-600 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isLoading
                  ? 'Processing...'
                  : (customTab === 'signin' ? 'Sign In' : 'Create Account')
                }
                <ArrowRight size={16} />
              </button>
            </div>
          </form>
      </div>
    </div>
  );
};
