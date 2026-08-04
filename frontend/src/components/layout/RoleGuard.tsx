'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ShieldAlert, Loader2 } from 'lucide-react';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles?: string[]; // e.g. ["Citizen"], ["Government Officer", "Department Admin"], ["Super Admin"]
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ children, allowedRoles }) => {
  const { user, loading, hasRole } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // Guest user attempting to access protected route -> redirect to login
        router.push('/login');
      } else if (allowedRoles && allowedRoles.length > 0 && !hasRole(allowedRoles)) {
        // User logged in but lacks required role -> redirect to unauthorized
        router.push('/unauthorized');
      }
    }
  }, [user, loading, allowedRoles, hasRole, router]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="flex flex-col items-center gap-3 text-cyan-400">
          <Loader2 className="w-8 h-8 animate-spin" />
          <p className="text-xs font-mono tracking-wider uppercase text-slate-400">Verifying Security Credentials...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (allowedRoles && allowedRoles.length > 0 && !hasRole(allowedRoles)) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="glass-panel max-w-md w-full p-8 rounded-2xl border border-rose-800 text-center">
          <ShieldAlert className="w-12 h-12 text-rose-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Access Restricted</h2>
          <p className="text-sm text-slate-400 mb-6">
            You do not have permission to view this command portal. Required roles: {allowedRoles.join(', ')}
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-semibold transition"
          >
            Return to Homepage
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
