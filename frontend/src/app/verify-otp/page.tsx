/**
 * /verify-otp page
 *
 * Why this structure?
 * -------------------
 * Next.js 14 App Router statically prerenders pages at build time by default.
 * useSearchParams() reads runtime URL query params (?email=...) which are only
 * available in the browser — NOT at build time.
 *
 * Next.js requires that any component calling useSearchParams() must be:
 *   1. Marked 'use client'
 *   2. Wrapped in a <Suspense> boundary in its parent page
 *
 * Solution: All useSearchParams() logic lives in <VerifyOtpForm> (a separate
 * client component). This page is a thin server-compatible shell that wraps it
 * in <Suspense>, satisfying Next.js 14's static prerendering requirements.
 */

import { Suspense } from 'react';
import { VerifyOtpForm } from './VerifyOtpForm';
import { Shield } from 'lucide-react';

// Skeleton shown while the client bundle hydrates
function VerifyOtpSkeleton() {
  return (
    <div className="glass-panel max-w-md w-full p-8 rounded-2xl border border-slate-700 shadow-2xl relative z-10 animate-pulse">
      <div className="text-center mb-8">
        <div className="w-12 h-12 rounded-xl bg-cyan-950 border border-cyan-500/30 flex items-center justify-center text-cyan-400/30 mx-auto mb-3">
          <Shield className="w-6 h-6" />
        </div>
        <div className="h-7 w-48 bg-slate-700 rounded-lg mx-auto mb-2" />
        <div className="h-4 w-56 bg-slate-800 rounded mx-auto" />
      </div>
      <div className="flex gap-2 justify-center mb-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="w-12 h-14 rounded-xl bg-slate-800 border border-slate-700" />
        ))}
      </div>
      <div className="h-12 bg-slate-700 rounded-xl" />
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <div className="flex-1 flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/*
        Suspense boundary is REQUIRED here because <VerifyOtpForm> calls
        useSearchParams(). Without this, Next.js throws:
        "useSearchParams() should be wrapped in a suspense boundary"
      */}
      <Suspense fallback={<VerifyOtpSkeleton />}>
        <VerifyOtpForm />
      </Suspense>
    </div>
  );
}
