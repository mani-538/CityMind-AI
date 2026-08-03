'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Shield, Activity, User, LogOut, Bell, Compass } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="glass-panel sticky top-0 z-50 px-6 py-3 border-b border-slate-700 flex items-center justify-between">
      <Link href="/" className="flex items-center gap-3 group">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center glow-blue text-white font-bold text-xl shadow-lg group-hover:scale-105 transition-transform">
          A
        </div>
        <div>
          <span className="font-extrabold text-lg text-white tracking-wide">ASHMORA</span>
          <span className="text-xs ml-2 px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-700 font-mono">CityMind AI</span>
        </div>
      </Link>

      <div className="flex items-center gap-6 text-sm">
        <Link href="/map" className="flex items-center gap-2 text-slate-300 hover:text-cyan-400 transition">
          <Compass className="w-4 h-4" /> Live Map
        </Link>
        
        {user ? (
          <>
            {user.roles.some((r) => r.name === 'Citizen') && (
              <Link href="/citizen" className="text-slate-300 hover:text-cyan-400 transition">
                Citizen Portal
              </Link>
            )}
            {user.roles.some((r) => ['Government Officer', 'Department Admin', 'Super Admin'].includes(r.name)) && (
              <Link href="/government" className="text-slate-300 hover:text-cyan-400 transition font-semibold text-cyan-400">
                Gov Command Center
              </Link>
            )}
            <Link href="/analytics" className="text-slate-300 hover:text-cyan-400 transition">
              Analytics
            </Link>

            <div className="flex items-center gap-4 pl-4 border-l border-slate-700">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-slate-800 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-semibold">
                  {user.full_name[0]}
                </div>
                <div className="hidden md:block">
                  <div className="text-xs font-semibold text-white">{user.full_name}</div>
                  <div className="text-[10px] text-cyan-400 font-mono">
                    {user.roles.map((r) => r.name).join(', ')}
                  </div>
                </div>
              </div>

              <button
                onClick={logout}
                className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-slate-300 hover:text-white transition text-sm font-medium"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-lg font-semibold text-sm shadow-md shadow-cyan-900/30 transition hover:scale-[1.02]"
            >
              Get Started
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};
