'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Shield, Activity, User, LogOut, Bell, Compass, Cpu, CheckSquare, UserCircle, ChevronDown } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const isSuperAdmin = user?.roles.some((r) => r.name === 'Super Admin');
  const isGovMember = user?.roles.some((r) =>
    ['Government Officer', 'Department Admin', 'Super Admin'].includes(r.name)
  );

  const handleLogout = () => {
    setDropdownOpen(false);
    logout();
  };

  return (
    <nav className="glass-panel sticky top-0 z-50 px-6 py-3 border-b border-slate-700 flex items-center justify-between">
      <Link href="/" className="flex items-center gap-3 group">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center glow-blue text-white font-bold text-xl shadow-lg group-hover:scale-105 transition-transform">
          A
        </div>
        <div>
          <span className="font-extrabold text-lg text-white tracking-wide">ASHMORA</span>
          <span className="text-xs ml-2 px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-700 font-mono">
            CityMind AI
          </span>
        </div>
      </Link>

      <div className="flex items-center gap-6 text-sm">
        <Link href="/map" className="flex items-center gap-1.5 text-slate-300 hover:text-cyan-400 transition font-medium">
          <Compass className="w-4 h-4" /> Live Map
        </Link>

        {user ? (
          <>
            {user.roles.some((r) => r.name === 'Citizen') && (
              <Link href="/citizen" className="text-slate-300 hover:text-cyan-400 transition font-medium">
                Citizen Portal
              </Link>
            )}

            {isGovMember && (
              <Link href="/government" className="text-slate-300 hover:text-cyan-400 transition font-semibold text-cyan-400">
                Gov Command Center
              </Link>
            )}

            {isSuperAdmin && (
              <Link href="/admin" className="text-amber-400 hover:text-amber-300 transition font-semibold flex items-center gap-1">
                <CheckSquare className="w-4 h-4" /> Super Admin
              </Link>
            )}

            <Link href="/agents" className="flex items-center gap-1.5 text-cyan-300 hover:text-cyan-200 transition font-medium">
              <Cpu className="w-4 h-4 text-cyan-400" /> AI Agent Center
            </Link>

            <Link href="/analytics" className="text-slate-300 hover:text-cyan-400 transition font-medium">
              Analytics
            </Link>

            {/* User Dropdown */}
            <div className="relative pl-4 border-l border-slate-700">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 hover:opacity-80 transition"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-600 to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                  {user.full_name[0].toUpperCase()}
                </div>
                <div className="hidden md:block text-left">
                  <div className="text-xs font-semibold text-white leading-none">{user.full_name}</div>
                  <div className="text-[10px] text-cyan-400 font-mono mt-0.5">
                    {user.roles.map((r) => r.name).join(', ')}
                  </div>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-44 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50">
                  <Link
                    href="/profile"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-slate-300 hover:bg-slate-800 hover:text-cyan-400 transition"
                  >
                    <UserCircle className="w-4 h-4" />
                    My Profile
                  </Link>
                  <div className="border-t border-slate-800" />
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 transition"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex items-center gap-3">
            <Link href="/login" className="px-4 py-2 text-slate-300 hover:text-white transition text-sm font-medium">
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
