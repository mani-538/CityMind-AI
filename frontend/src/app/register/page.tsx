'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { User, Mail, Lock, Phone, Shield, ArrowRight, AlertCircle, Key, RefreshCw, CheckCircle2 } from 'lucide-react';

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [roleName, setRoleName] = useState('Citizen');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [demoOtp, setDemoOtp] = useState('');

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { login } = useAuth();
  const router = useRouter();

  const otp = otpDigits.join('');

  const getErrorMessage = (err: any, fallback: string) => {
    const data = err?.response?.data;
    if (data) {
      if (typeof data.detail === 'string') return data.detail;
      if (Array.isArray(data.detail)) return data.detail.map((d: any) => d.msg).filter(Boolean).join(', ');
      if (typeof data.message === 'string') return data.message;
      if (typeof data.error === 'string') return data.error;
    }
    if (err?.message) return err.message;
    return fallback;
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const digits = [...otpDigits];
    digits[index] = value.slice(-1);
    setOtpDigits(digits);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const regRes = await apiClient.post('/auth/register', {
        email,
        password,
        full_name: fullName,
        phone_number: phone,
        role_name: roleName,
      });

      if (regRes.data.success) {
        if (regRes.data.data?.demo_otp_code) {
          setDemoOtp(regRes.data.data.demo_otp_code);
        }
        setStep(2);
        setTimeout(() => inputRefs.current[0]?.focus(), 100);
      }
    } catch (err: any) {
      setError(getErrorMessage(err, 'Failed to create account'));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const verifyRes = await apiClient.post('/auth/verify-otp', { email, otp_code: otp });
      if (verifyRes.data.success) {
        const { access_token, refresh_token } = verifyRes.data.data;
        await login(access_token, refresh_token);
        if (roleName === 'Government Officer' || roleName === 'Department Admin') {
          router.push('/government');
        } else {
          router.push('/citizen');
        }
      }
    } catch (err: any) {
      setError(getErrorMessage(err, 'Invalid OTP code. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setResendLoading(true);
    setResendSuccess(false);
    setError('');
    try {
      const res = await apiClient.post('/auth/request-otp', { email });
      if (res.data.data?.demo_otp_code) {
        setDemoOtp(res.data.data.demo_otp_code);
      }
      setOtpDigits(['', '', '', '', '', '']);
      setResendSuccess(true);
      setTimeout(() => setResendSuccess(false), 4000);
    } catch (err: any) {
      setError(getErrorMessage(err, 'Failed to resend OTP. Please try again.'));
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="glass-panel max-w-lg w-full p-8 rounded-2xl border border-slate-700 shadow-2xl relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-blue-950 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold mx-auto mb-3 text-xl">
            {step === 1 ? <User /> : <Key />}
          </div>
          <h1 className="text-2xl font-bold text-white">
            {step === 1 ? 'Create CityMind Account' : 'Verify Your Email'}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {step === 1
              ? 'Join the Smart City Intelligence Network'
              : <>A 6-digit code was sent to <span className="text-cyan-400 font-semibold">{email}</span></>}
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-6 justify-center">
          <div className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full ${step >= 1 ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-800 text-slate-500'}`}>
            <span className="w-4 h-4 rounded-full bg-cyan-500 text-white flex items-center justify-center text-[10px] font-bold">1</span>
            Register
          </div>
          <div className={`h-px flex-1 max-w-10 ${step === 2 ? 'bg-cyan-500' : 'bg-slate-700'}`} />
          <div className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full ${step === 2 ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-800 text-slate-500'}`}>
            <span className={`w-4 h-4 rounded-full ${step === 2 ? 'bg-cyan-500' : 'bg-slate-600'} text-white flex items-center justify-center text-[10px] font-bold`}>2</span>
            Verify OTP
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
            {error}
          </div>
        )}

        {/* Resend Success */}
        {resendSuccess && (
          <div className="mb-4 p-3 rounded-xl bg-green-950/60 border border-green-800 text-green-300 text-sm flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-400" />
            New OTP sent successfully!
          </div>
        )}

        {/* Step 1: Registration Form */}
        {step === 1 && (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Full Name</label>
              <div className="relative">
                <User className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text" required value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Ashmora"
                  className="w-full bg-slate-900/80 border border-slate-700 rounded-xl pl-11 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email" required value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@ashmora.gov"
                  className="w-full bg-slate-900/80 border border-slate-700 rounded-xl pl-11 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Phone Number</label>
                <div className="relative">
                  <Phone className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text" value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 019-2834"
                    className="w-full bg-slate-900/80 border border-slate-700 rounded-xl pl-11 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">User Role</label>
                <select
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500 transition text-sm"
                >
                  <option value="Citizen">Citizen</option>
                  <option value="Government Officer">Government Officer</option>
                  <option value="Department Admin">Department Admin</option>
                  <option value="Super Admin">Super Admin</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Password</label>
              <div className="relative">
                <Lock className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="password" required value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" minLength={6}
                  className="w-full bg-slate-900/80 border border-slate-700 rounded-xl pl-11 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition text-sm"
                />
              </div>
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg shadow-cyan-900/40 flex items-center justify-center gap-2 transition disabled:opacity-50 mt-2"
            >
              {loading ? 'Sending OTP...' : 'Create Account & Send OTP'} <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* Step 2: OTP Verification */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="space-y-5">
            {/* Demo OTP hint (for local/staging) */}
            {demoOtp && (
              <div className="p-3 rounded-xl bg-cyan-950/50 border border-cyan-800/50 text-center">
                <p className="text-xs text-cyan-500 font-semibold uppercase tracking-wider mb-1">Dev Mode — Your OTP Code</p>
                <button
                  type="button"
                  onClick={() => setOtpDigits(demoOtp.split(''))}
                  className="text-2xl font-mono font-bold tracking-widest text-cyan-300 hover:text-white transition cursor-pointer"
                >
                  {demoOtp}
                </button>
                <p className="text-[10px] text-slate-500 mt-1">Click to auto-fill</p>
              </div>
            )}

            {/* 6-Digit OTP Boxes */}
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
              className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg shadow-cyan-900/40 flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify OTP & Access CityMind'} <Shield className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-center gap-3 text-sm text-slate-500">
              Didn&apos;t receive the code?
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resendLoading}
                className="text-cyan-400 font-semibold hover:text-cyan-300 flex items-center gap-1 transition disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${resendLoading ? 'animate-spin' : ''}`} />
                Resend OTP
              </button>
            </div>
          </form>
        )}

        <div className="mt-6 text-center text-sm text-slate-400">
          Already registered?{' '}
          <Link href="/login" className="text-cyan-400 font-semibold hover:underline">Sign In</Link>
        </div>
      </div>
    </div>
  );
}
