import React, { useState } from 'react';
import { X, Lock, Mail, User as UserIcon, Shield, Check } from 'lucide-react';
import { User } from '../types.ts';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onLoginSuccess: (user: User, token: string) => void;
  onLogout: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLoginSuccess,
  onLogout
}) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'customer' | 'sre'>('customer');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
      const body = isRegister ? { name, email, role } : { email };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Authentication failed');
      }

      onLoginSuccess(data.user, data.token);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Auth failure');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (userEmail: string, userName: string, userRole: 'customer' | 'sre') => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Quick login failed');
      }
      onLoginSuccess(data.user, data.token);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
      <div 
        className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 text-white relative shadow-2xl space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
        >
          <X className="w-5 h-5" />
        </button>

        {currentUser ? (
          <div className="space-y-4 text-center py-4">
            <div className="w-14 h-14 rounded-full bg-cyan-950 border border-cyan-700 text-cyan-300 flex items-center justify-center mx-auto text-xl font-bold">
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">{currentUser.name}</h3>
              <p className="text-xs text-slate-400 font-mono">{currentUser.email}</p>
              <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-xs font-mono bg-slate-800 text-cyan-300 border border-slate-700 uppercase">
                Role: {currentUser.role}
              </span>
            </div>

            <button
              onClick={() => {
                onLogout();
                onClose();
              }}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-300 font-medium text-xs transition-colors border border-slate-700"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-1">
              <div className="flex items-center space-x-2 text-cyan-400">
                <Shield className="w-4 h-4" />
                <span className="text-xs font-mono uppercase tracking-wider">CloudCart Auth API</span>
              </div>
              <h3 className="text-lg font-bold text-white">
                {isRegister ? 'Create CloudCart Account' : 'Sign In to CloudCart'}
              </h3>
              <p className="text-xs text-slate-400">
                Authenticates with <code className="text-cyan-300">/api/auth</code> and issues a Bearer JWT token.
              </p>
            </div>

            {/* Quick Demo Switcher */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
              <span className="text-[11px] font-mono uppercase text-slate-400 block font-semibold">
                Quick Demo Switcher:
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => quickLogin('sre@cloudcart.dev', 'Alex Mercer (SRE)', 'sre')}
                  className="p-2 text-left bg-slate-900 hover:bg-slate-850 border border-slate-700 rounded-lg text-xs"
                >
                  <div className="font-bold text-cyan-300">SRE Lead</div>
                  <div className="text-[10px] text-slate-400 truncate">sre@cloudcart.dev</div>
                </button>
                <button
                  type="button"
                  onClick={() => quickLogin('customer@example.com', 'DevOps Customer', 'customer')}
                  className="p-2 text-left bg-slate-900 hover:bg-slate-850 border border-slate-700 rounded-lg text-xs"
                >
                  <div className="font-bold text-white">Customer</div>
                  <div className="text-[10px] text-slate-400 truncate">customer@example.com</div>
                </button>
              </div>
            </div>

            {error && (
              <div className="p-2.5 rounded-lg bg-rose-950 border border-rose-800 text-rose-300 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              {isRegister && (
                <div>
                  <label className="text-xs text-slate-300 block mb-1">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Jordan Lee"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-hidden focus:border-cyan-500"
                  />
                </div>
              )}

              <div>
                <label className="text-xs text-slate-300 block mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="engineer@company.com"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-hidden focus:border-cyan-500 font-mono"
                />
              </div>

              {isRegister && (
                <div>
                  <label className="text-xs text-slate-300 block mb-1">Account Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-hidden focus:border-cyan-500"
                  >
                    <option value="customer">Customer (Standard)</option>
                    <option value="sre">SRE / Administrator</option>
                  </select>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 text-white font-bold text-xs transition-colors shadow-md"
              >
                {loading ? 'Authenticating...' : isRegister ? 'Register Account' : 'Sign In'}
              </button>
            </form>

            <div className="text-center pt-1 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setIsRegister(!isRegister);
                  setError(null);
                }}
                className="text-xs text-cyan-400 hover:text-cyan-300"
              >
                {isRegister ? 'Already have an account? Sign in' : "Don't have an account? Register"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
