'use client';

import React, { useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Shield, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

// ─── Inner component — all useSearchParams() logic lives here ───────────────
// This component is only ever rendered client-side (inside <Suspense>).
export function VerifyOtpForm() {
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [demoOtp, setDemoOtp] = useState('');

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { login } = useAuth();
  const router = useRouter();

  // useSearchParams is safe here because this component is always inside <Suspense>
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';

  const otp = otpDigits.join('');

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const digits = [...otpDigits];
    digits[index] = value.slice(-1);
    setOtpDigits(digits);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtpDigits(pasted.split(''));
      inputRefs.current[5]?.focus();
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await apiClient.post('/auth/verify-otp', { email, otp_code: otp });
      if (res.data.success) {
        const { access_token, refresh_token } = res.data.data;
        await login(access_token, refresh_token);
        router.push('/citizen');
      }
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { detail?: string } } })?.response?.data;
      setError(data?.detail || 'Invalid or expired OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    setResendSuccess(false);
    setError('');
    try {
      const res = await apiClient.post('/auth/request-otp', { email });
      if (res.data.data?.demo_otp_code) setDemoOtp(res.data.data.demo_otp_code);
      setOtpDigits(['', '', '', '', '', '']);
      setResendSuccess(true);
      setTimeout(() => setResendSuccess(false), 4000);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch {
      setError('Failed to resend OTP. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="glass-panel max-w-md w-full p-8 rounded-2xl border border-slate-700 shadow-2xl relative z-10">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-12 h-12 rounded-xl bg-cyan-950 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mx-auto mb-3">
          <Shield className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold text-white">Email Verification</h1>
        <p className="text-sm text-slate-400 mt-1">
          Code sent to <span className="text-cyan-400 font-semibold">{email || 'your email'}</span>
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-4 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
          {error}
        </div>
      )}

      {/* Resend Success */}
      {resendSuccess && (
        <div className="mb-4 p-3 rounded-xl bg-green-950/60 border border-green-800 text-green-300 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-400" />
          New OTP dispatched! Check your inbox.
        </div>
      )}

      {/* Dev OTP hint */}
      {demoOtp && (
        <div className="mb-5 p-3 rounded-xl bg-cyan-950/50 border border-cyan-800/50 text-center">
          <p className="text-xs text-cyan-500 font-semibold uppercase tracking-wider mb-1">Dev Mode — OTP Code</p>
          <button
            type="button"
            onClick={() => setOtpDigits(demoOtp.split(''))}
            className="text-2xl font-mono font-bold tracking-widest text-cyan-300 hover:text-white transition"
          >
            {demoOtp}
          </button>
          <p className="text-[10px] text-slate-500 mt-0.5">Click to auto-fill</p>
        </div>
      )}

      {/* OTP Form */}
      <form onSubmit={handleVerify} className="space-y-6">
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3 text-center">
            Enter 6-Digit OTP
          </label>
          <div className="flex gap-2 justify-center" onPaste={handleOtpPaste}>
            {otpDigits.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { inputRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(i, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(i, e)}
                className={`w-12 h-14 text-center text-2xl font-bold rounded-xl border transition bg-slate-900/80 text-white focus:outline-none focus:border-cyan-500 caret-transparent
                  ${digit ? 'border-cyan-500 bg-cyan-950/30' : 'border-slate-700'}`}
              />
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || otp.length !== 6}
          className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg shadow-cyan-900/40 flex items-center justify-center gap-2 transition disabled:opacity-50"
        >
          {loading ? 'Verifying...' : 'Verify & Sign In'}
        </button>

        <div className="flex items-center justify-center gap-3 text-sm text-slate-500">
          Didn&apos;t receive the code?
          <button
            type="button"
            onClick={handleResend}
            disabled={resendLoading}
            className="text-cyan-400 font-semibold hover:text-cyan-300 flex items-center gap-1 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${resendLoading ? 'animate-spin' : ''}`} />
            Resend
          </button>
        </div>
      </form>
    </div>
  );
}
