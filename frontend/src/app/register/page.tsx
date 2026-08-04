'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { User, Mail, Lock, Phone, Shield, ArrowRight, AlertCircle, Key } from 'lucide-react';

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [roleName, setRoleName] = useState('Citizen');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const router = useRouter();

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
        setStep(2);
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
      setError(getErrorMessage(err, 'Invalid OTP code'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="glass-panel max-w-lg w-full p-8 rounded-2xl border border-slate-700 shadow-2xl relative z-10">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-blue-950 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold mx-auto mb-3 text-xl">
            {step === 1 ? <User /> : <Key />}
          </div>
          <h1 className="text-2xl font-bold text-white">
            {step === 1 ? 'Create CityMind Account' : 'Verify Your Email'}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {step === 1 ? 'Join the Smart City Intelligence Network' : 'Please enter the 6-digit OTP sent to your email.'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
            {error}
          </div>
        )}

        {step === 1 && (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Ashmora"
                  className="w-full bg-slate-900/80 border border-slate-700 rounded-xl pl-11 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@ashmora.gov"
                  className="w-full bg-slate-900/80 border border-slate-700 rounded-xl pl-11 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 019-2834"
                    className="w-full bg-slate-900/80 border border-slate-700 rounded-xl pl-11 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  User Role
                </label>
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
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
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
                  className="w-full bg-slate-900/80 border border-slate-700 rounded-xl pl-11 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg shadow-cyan-900/40 flex items-center justify-center gap-2 transition disabled:opacity-50 mt-2"
            >
              {loading ? 'Sending OTP...' : 'Register'} <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 text-center">
                Enter 6-Digit OTP
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="123456"
                  className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition text-2xl text-center tracking-widest"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg shadow-cyan-900/40 flex items-center justify-center gap-2 transition disabled:opacity-50 mt-2"
            >
              {loading ? 'Verifying...' : 'Verify OTP'} <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        <div className="mt-6 text-center text-sm text-slate-400">
          Already registered?{' '}
          <Link href="/login" className="text-cyan-400 font-semibold hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
