import React from 'react';
import Link from 'next/link';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export default function UnauthorizedPage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-rose-950 border border-rose-500/40 flex items-center justify-center text-rose-400 mb-6 text-2xl shadow-xl shadow-rose-950/50">
        <ShieldAlert />
      </div>
      <h1 className="text-3xl font-extrabold text-white mb-2">Access Denied</h1>
      <p className="text-slate-400 max-w-md mb-8">
        You do not have the required Role-Based Access Control (RBAC) permissions to view this government resource.
      </p>
      <Link
        href="/"
        className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-semibold flex items-center gap-2 transition"
      >
        <ArrowLeft className="w-4 h-4" /> Return to Homepage
      </Link>
    </div>
  );
}
