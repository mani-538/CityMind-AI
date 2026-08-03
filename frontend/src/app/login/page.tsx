'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/lib/api';
import { Lock, Mail, ArrowRight, AlertCircle, Shield, UserCheck, KeyRound } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const router = useRouter();

  const handleDemoFill = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('DemoPassword123!');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await apiClient.post('/auth/login', { email, password });
      if (response.data.success) {
        const { access_token, refresh_token } = response.data.data;
        await login(access_token, refresh_token);
        
        if (email.includes('officer') || email.includes('admin')) {
          router.push('/government');
        } else {
          router.push('/citizen');
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row items-center justify-center p-6 gap-8 relative overflow-hidden max-w-6xl mx-auto w-full">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Left Box: 1-Click Demo Accounts Quick Selector */}
      <div className="glass-panel p-6 rounded-2xl border border-cyan-500/30 w-full md:w-80 shadow-2xl relative z-10">
        <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs font-bold uppercase tracking-wider mb-2">
          <KeyRound className="w-4 h-4" /> Live Demo Quick Access
        </div>
        <h2 className="text-lg font-bold text-white mb-2">Sample Test Accounts</h2>
        <p className="text-xs text-slate-400 mb-4">Click any persona below to auto-fill test credentials:</p>

        <div className="space-y-2.5">
          <button
            type="button"
            onClick={() => handleDemoFill('citizen@ashmora.gov')}
            className="w-full p-3 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 hover:border-cyan-500 text-left transition flex items-center justify-between group"
          >
            <div>
              <div className="text-xs font-bold text-white group-hover:text-cyan-400">Citizen Persona</div>
              <div className="text-[10px] text-slate-400 font-mono">citizen@ashmora.gov</div>
            </div>
            <UserCheck className="w-4 h-4 text-slate-500 group-hover:text-cyan-400" />
          </button>

          <button
            type="button"
            onClick={() => handleDemoFill('officer@ashmora.gov')}
            className="w-full p-3 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 hover:border-cyan-500 text-left transition flex items-center justify-between group"
          >
            <div>
              <div className="text-xs font-bold text-white group-hover:text-cyan-400">Gov Command Officer</div>
              <div className="text-[10px] text-slate-400 font-mono">officer@ashmora.gov</div>
            </div>
            <UserCheck className="w-4 h-4 text-slate-500 group-hover:text-cyan-400" />
          </button>

          <button
            type="button"
            onClick={() => handleDemoFill('admin@ashmora.gov')}
            className="w-full p-3 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 hover:border-cyan-500 text-left transition flex items-center justify-between group"
          >
            <div>
              <div className="text-xs font-bold text-white group-hover:text-cyan-400">Department Admin</div>
              <div className="text-[10px] text-slate-400 font-mono">admin@ashmora.gov</div>
            </div>
            <UserCheck className="w-4 h-4 text-slate-500 group-hover:text-cyan-400" />
          </button>

          <button
            type="button"
            onClick={() => handleDemoFill('superadmin@ashmora.gov')}
            className="w-full p-3 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 hover:border-cyan-500 text-left transition flex items-center justify-between group"
          >
            <div>
              <div className="text-xs font-bold text-white group-hover:text-cyan-400">Super Admin (CTO)</div>
              <div className="text-[10px] text-slate-400 font-mono">superadmin@ashmora.gov</div>
            </div>
            <UserCheck className="w-4 h-4 text-slate-500 group-hover:text-cyan-400" />
          </button>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] font-mono text-slate-500">
          Default Password: <span className="text-cyan-400 font-bold">DemoPassword123!</span>
        </div>
      </div>

      {/* Right Box: Standard Login Form */}
      <div className="glass-panel max-w-md w-full p-8 rounded-2xl border border-slate-700 shadow-2xl relative z-10">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-cyan-950 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold mx-auto mb-3 text-xl">
            <Shield />
          </div>
          <h1 className="text-2xl font-bold text-white">Sign In to CityMind</h1>
          <p className="text-sm text-slate-400 mt-1">Access Citizen & Officer Smart Portals</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="citizen@ashmora.gov"
                className="w-full bg-slate-900/80 border border-slate-700 rounded-xl pl-11 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-900/80 border border-slate-700 rounded-xl pl-11 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg shadow-cyan-900/40 flex items-center justify-center gap-2 transition disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Sign In'} <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-slate-400">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-cyan-400 font-semibold hover:underline">
            Register Account
          </Link>
        </div>
      </div>
    </div>
  );
}
