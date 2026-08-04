'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/lib/api';
import {
  User, Mail, Phone, MapPin, Calendar, Shield, Briefcase, Award,
  Edit3, Save, X, Lock, CheckCircle, AlertCircle, Building2,
  FileText, Star, TrendingUp, Users, Activity, Cpu, Eye, EyeOff,
} from 'lucide-react';

interface DetailedProfile {
  id: string;
  email: string;
  full_name: string;
  phone_number?: string;
  is_active: boolean;
  is_verified: boolean;
  approval_status: string;
  approved_by?: string;
  approved_at?: string;
  employee_id?: string;
  official_email?: string;
  organization_type?: string;
  designation?: string;
  department_address?: string;
  date_of_birth?: string;
  gender?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  aadhaar_masked?: string;
  emergency_contact?: string;
  preferred_language?: string;
  roles: { id: string; name: string }[];
  department_id?: string;
  created_at: string;
  statistics: Record<string, string | number>;
}

const STAT_ICONS: Record<string, React.ReactNode> = {
  total_complaints: <FileText className="w-5 h-5" />,
  completed_complaints: <CheckCircle className="w-5 h-5" />,
  pending_complaints: <AlertCircle className="w-5 h-5" />,
  total_users: <Users className="w-5 h-5" />,
  total_city_complaints: <Activity className="w-5 h-5" />,
  pending_organization_requests: <AlertCircle className="w-5 h-5" />,
  active_ai_agents: <Cpu className="w-5 h-5" />,
  assigned_cases: <Briefcase className="w-5 h-5" />,
  completed_cases: <CheckCircle className="w-5 h-5" />,
};

const STAT_COLORS: Record<string, string> = {
  total_complaints: 'from-cyan-500/20 to-blue-500/20 border-cyan-500/30 text-cyan-400',
  completed_complaints: 'from-emerald-500/20 to-green-500/20 border-emerald-500/30 text-emerald-400',
  pending_complaints: 'from-amber-500/20 to-yellow-500/20 border-amber-500/30 text-amber-400',
  total_users: 'from-violet-500/20 to-purple-500/20 border-violet-500/30 text-violet-400',
  total_city_complaints: 'from-blue-500/20 to-indigo-500/20 border-blue-500/30 text-blue-400',
  pending_organization_requests: 'from-rose-500/20 to-red-500/20 border-rose-500/30 text-rose-400',
  active_ai_agents: 'from-cyan-500/20 to-teal-500/20 border-cyan-500/30 text-cyan-400',
  assigned_cases: 'from-indigo-500/20 to-blue-500/20 border-indigo-500/30 text-indigo-400',
  completed_cases: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30 text-emerald-400',
};

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [profile, setProfile] = useState<DetailedProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPwdForm, setShowPwdForm] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [formData, setFormData] = useState({
    full_name: '',
    phone_number: '',
    date_of_birth: '',
    gender: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    emergency_contact: '',
    preferred_language: '',
    designation: '',
    department_address: '',
  });

  const [pwdData, setPwdData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user) fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/auth/profile');
      if (res.data.success) {
        const p = res.data.data;
        setProfile(p);
        setFormData({
          full_name: p.full_name || '',
          phone_number: p.phone_number || '',
          date_of_birth: p.date_of_birth || '',
          gender: p.gender || '',
          address: p.address || '',
          city: p.city || '',
          state: p.state || '',
          pincode: p.pincode || '',
          emergency_contact: p.emergency_contact || '',
          preferred_language: p.preferred_language || '',
          designation: p.designation || '',
          department_address: p.department_address || '',
        });
      }
    } catch (err) {
      setErrorMsg('Failed to load profile. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      setErrorMsg('');
      const res = await apiClient.put('/auth/profile', formData);
      if (res.data.success) {
        setProfile(res.data.data);
        setEditMode(false);
        setSuccessMsg('Profile updated successfully!');
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.detail || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (pwdData.new_password !== pwdData.confirm_password) {
      setErrorMsg('New passwords do not match.');
      return;
    }
    if (pwdData.new_password.length < 6) {
      setErrorMsg('New password must be at least 6 characters.');
      return;
    }
    try {
      setSaving(true);
      setErrorMsg('');
      const res = await apiClient.post('/auth/change-password', {
        current_password: pwdData.current_password,
        new_password: pwdData.new_password,
      });
      if (res.data.success) {
        setShowPwdForm(false);
        setPwdData({ current_password: '', new_password: '', confirm_password: '' });
        setSuccessMsg('Password changed successfully!');
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.detail || 'Failed to change password.');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 mx-auto mb-4 animate-pulse" />
          <p className="text-slate-400 text-sm">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const userRoles = profile.roles.map((r) => r.name);
  const isSuperAdmin = userRoles.includes('Super Admin');
  const isGovMember = userRoles.some((r) =>
    ['Government Officer', 'Department Admin'].includes(r)
  );
  const isCitizen = userRoles.includes('Citizen');

  const roleColor = isSuperAdmin
    ? 'from-amber-500 to-orange-500'
    : isGovMember
    ? 'from-indigo-500 to-blue-600'
    : 'from-cyan-500 to-blue-600';

  const roleBadgeColor = isSuperAdmin
    ? 'bg-amber-950 text-amber-400 border-amber-700'
    : isGovMember
    ? 'bg-indigo-950 text-indigo-300 border-indigo-700'
    : 'bg-cyan-950 text-cyan-400 border-cyan-700';

  const InputField = ({
    label, field, type = 'text', disabled = false
  }: {
    label: string; field: keyof typeof formData; type?: string; disabled?: boolean;
  }) => (
    <div>
      <label className="block text-[11px] text-slate-400 font-medium mb-1">{label}</label>
      {editMode && !disabled ? (
        <input
          type={type}
          value={formData[field]}
          onChange={(e) => setFormData((prev) => ({ ...prev, [field]: e.target.value }))}
          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 transition"
        />
      ) : (
        <div className="px-3 py-2 bg-slate-900/50 border border-slate-800 rounded-lg text-xs text-slate-300">
          {formData[field] || <span className="text-slate-600 italic">Not set</span>}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 pt-20 pb-16 px-4">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Success / Error Toasts */}
        {successMsg && (
          <div className="fixed top-20 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-emerald-900/90 border border-emerald-600 text-emerald-300 text-xs rounded-xl shadow-xl animate-in slide-in-from-top-2">
            <CheckCircle className="w-4 h-4" /> {successMsg}
          </div>
        )}
        {errorMsg && (
          <div className="flex items-center gap-2 px-4 py-3 bg-rose-950/60 border border-rose-700 text-rose-300 text-xs rounded-xl">
            <AlertCircle className="w-4 h-4" /> {errorMsg}
            <button onClick={() => setErrorMsg('')} className="ml-auto"><X className="w-3.5 h-3.5" /></button>
          </div>
        )}

        {/* Profile Header Card */}
        <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
          <div className={`h-28 bg-gradient-to-r ${roleColor} opacity-30`} />
          <div className="px-8 pb-6 -mt-14">
            <div className="flex items-end justify-between flex-wrap gap-4">
              <div className="flex items-end gap-5">
                <div className={`w-24 h-24 rounded-2xl bg-gradient-to-br ${roleColor} flex items-center justify-center text-white text-4xl font-extrabold shadow-2xl border-4 border-slate-950`}>
                  {profile.full_name[0].toUpperCase()}
                </div>
                <div className="mb-1">
                  <h1 className="text-2xl font-extrabold text-white">{profile.full_name}</h1>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${roleBadgeColor}`}>
                      {userRoles.join(' · ')}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded border font-mono ${
                      profile.approval_status === 'Approved'
                        ? 'bg-emerald-950 text-emerald-400 border-emerald-700'
                        : profile.approval_status === 'Pending'
                        ? 'bg-amber-950 text-amber-400 border-amber-700'
                        : 'bg-rose-950 text-rose-400 border-rose-700'
                    }`}>
                      {profile.approval_status}
                    </span>
                    {profile.is_verified && (
                      <span className="text-[10px] px-2 py-0.5 rounded border bg-cyan-950 text-cyan-400 border-cyan-700 font-mono flex items-center gap-1">
                        <CheckCircle className="w-2.5 h-2.5" /> Verified
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Member since {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {!editMode ? (
                  <button
                    onClick={() => setEditMode(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Edit Profile
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditMode(false)}
                      className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 text-xs rounded-xl transition"
                    >
                      <X className="w-3.5 h-3.5" /> Cancel
                    </button>
                    <button
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold rounded-xl transition disabled:opacity-50"
                    >
                      <Save className="w-3.5 h-3.5" /> {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Row */}
        {Object.keys(profile.statistics).length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(profile.statistics).map(([key, value]) => (
              <div
                key={key}
                className={`glass-panel rounded-xl border bg-gradient-to-br p-4 ${STAT_COLORS[key] || 'from-slate-800 to-slate-900 border-slate-700 text-slate-400'}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-lg opacity-80">{STAT_ICONS[key] || <Star className="w-5 h-5" />}</span>
                </div>
                <div className="text-2xl font-extrabold text-white">{value}</div>
                <div className="text-[10px] text-slate-400 mt-0.5 capitalize">
                  {key.replace(/_/g, ' ')}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Basic Info + Contact */}
          <div className="lg:col-span-2 space-y-6">

            {/* Basic Info */}
            <div className="glass-panel rounded-2xl border border-slate-800 p-6">
              <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <User className="w-4 h-4 text-cyan-400" /> Personal Information
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <InputField label="Full Name" field="full_name" />
                <div>
                  <label className="block text-[11px] text-slate-400 font-medium mb-1">Email Address</label>
                  <div className="px-3 py-2 bg-slate-900/50 border border-slate-800 rounded-lg text-xs text-slate-500">
                    {profile.email} <span className="text-[9px] text-slate-600">(not editable)</span>
                  </div>
                </div>
                <InputField label="Phone Number" field="phone_number" />
                <InputField label="Date of Birth" field="date_of_birth" type="date" />
                <div>
                  <label className="block text-[11px] text-slate-400 font-medium mb-1">Gender</label>
                  {editMode ? (
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData((prev) => ({ ...prev, gender: e.target.value }))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                    >
                      <option value="">Select</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </select>
                  ) : (
                    <div className="px-3 py-2 bg-slate-900/50 border border-slate-800 rounded-lg text-xs text-slate-300">
                      {formData.gender || <span className="text-slate-600 italic">Not set</span>}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 font-medium mb-1">Preferred Language</label>
                  {editMode ? (
                    <select
                      value={formData.preferred_language}
                      onChange={(e) => setFormData((prev) => ({ ...prev, preferred_language: e.target.value }))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                    >
                      <option value="English">English</option>
                      <option value="Hindi">Hindi</option>
                      <option value="Tamil">Tamil</option>
                      <option value="Telugu">Telugu</option>
                      <option value="Kannada">Kannada</option>
                    </select>
                  ) : (
                    <div className="px-3 py-2 bg-slate-900/50 border border-slate-800 rounded-lg text-xs text-slate-300">
                      {formData.preferred_language || 'English'}
                    </div>
                  )}
                </div>
                <InputField label="Emergency Contact" field="emergency_contact" />
              </div>
            </div>

            {/* Address Info */}
            <div className="glass-panel rounded-2xl border border-slate-800 p-6">
              <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-cyan-400" /> Location & Address
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <InputField label="Street Address" field="address" />
                </div>
                <InputField label="City" field="city" />
                <InputField label="State / Region" field="state" />
                <InputField label="Pincode / Zipcode" field="pincode" />
                {(isGovMember || isSuperAdmin) && (
                  <div className="col-span-2">
                    <InputField label="Department Address" field="department_address" />
                  </div>
                )}
              </div>
            </div>

            {/* Organization Info (non-citizen only) */}
            {(isGovMember || isSuperAdmin) && (
              <div className="glass-panel rounded-2xl border border-slate-800 p-6">
                <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-indigo-400" /> Organization Details
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <InputField label="Designation / Title" field="designation" />
                  <div>
                    <label className="block text-[11px] text-slate-400 font-medium mb-1">Employee ID</label>
                    <div className="px-3 py-2 bg-slate-900/50 border border-slate-800 rounded-lg text-xs text-slate-400 font-mono">
                      {profile.employee_id || <span className="italic text-slate-600">Not assigned</span>}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 font-medium mb-1">Official Email</label>
                    <div className="px-3 py-2 bg-slate-900/50 border border-slate-800 rounded-lg text-xs text-slate-400">
                      {profile.official_email || <span className="italic text-slate-600">Not set</span>}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 font-medium mb-1">Organization Type</label>
                    <div className="px-3 py-2 bg-slate-900/50 border border-slate-800 rounded-lg text-xs text-slate-400">
                      {profile.organization_type || <span className="italic text-slate-600">Not set</span>}
                    </div>
                  </div>
                  {profile.approved_by && (
                    <div>
                      <label className="block text-[11px] text-slate-400 font-medium mb-1">Approved By</label>
                      <div className="px-3 py-2 bg-emerald-950/40 border border-emerald-800 rounded-lg text-xs text-emerald-400">
                        {profile.approved_by}
                      </div>
                    </div>
                  )}
                  {profile.approved_at && (
                    <div>
                      <label className="block text-[11px] text-slate-400 font-medium mb-1">Approval Date</label>
                      <div className="px-3 py-2 bg-slate-900/50 border border-slate-800 rounded-lg text-xs text-slate-400">
                        {new Date(profile.approved_at).toLocaleDateString()}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Account Security + Quick Links */}
          <div className="space-y-5">
            {/* Account Status */}
            <div className="glass-panel rounded-2xl border border-slate-800 p-5">
              <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <Shield className="w-4 h-4 text-cyan-400" /> Account Security
              </h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-slate-800">
                  <span className="text-xs text-slate-400">Account Status</span>
                  <span className={`text-xs font-semibold ${profile.is_active ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {profile.is_active ? '● Active' : '○ Inactive'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-slate-800">
                  <span className="text-xs text-slate-400">Email Verified</span>
                  <span className={`text-xs font-semibold ${profile.is_verified ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {profile.is_verified ? '✓ Verified' : '⚠ Unverified'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-xs text-slate-400">Approval Status</span>
                  <span className={`text-xs font-semibold ${
                    profile.approval_status === 'Approved'
                      ? 'text-emerald-400'
                      : profile.approval_status === 'Pending'
                      ? 'text-amber-400'
                      : 'text-rose-400'
                  }`}>
                    {profile.approval_status}
                  </span>
                </div>
              </div>

              {/* Change Password */}
              <button
                onClick={() => setShowPwdForm(!showPwdForm)}
                className="w-full mt-4 flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-300 font-semibold rounded-xl transition"
              >
                <Lock className="w-3.5 h-3.5 text-cyan-400" />
                {showPwdForm ? 'Cancel Password Change' : 'Change Password'}
              </button>

              {showPwdForm && (
                <div className="mt-4 space-y-3 p-4 bg-slate-900/60 border border-slate-800 rounded-xl">
                  <div className="relative">
                    <label className="block text-[11px] text-slate-400 mb-1">Current Password</label>
                    <input
                      type={showCurrentPwd ? 'text' : 'password'}
                      value={pwdData.current_password}
                      onChange={(e) => setPwdData((p) => ({ ...p, current_password: e.target.value }))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 pr-9"
                    />
                    <button type="button" onClick={() => setShowCurrentPwd(!showCurrentPwd)} className="absolute right-2 top-6 text-slate-500 hover:text-slate-300">
                      {showCurrentPwd ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <div className="relative">
                    <label className="block text-[11px] text-slate-400 mb-1">New Password</label>
                    <input
                      type={showNewPwd ? 'text' : 'password'}
                      value={pwdData.new_password}
                      onChange={(e) => setPwdData((p) => ({ ...p, new_password: e.target.value }))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 pr-9"
                    />
                    <button type="button" onClick={() => setShowNewPwd(!showNewPwd)} className="absolute right-2 top-6 text-slate-500 hover:text-slate-300">
                      {showNewPwd ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Confirm New Password</label>
                    <input
                      type="password"
                      value={pwdData.confirm_password}
                      onChange={(e) => setPwdData((p) => ({ ...p, confirm_password: e.target.value }))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <button
                    onClick={handleChangePassword}
                    disabled={saving}
                    className="w-full py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold rounded-xl transition disabled:opacity-50"
                  >
                    {saving ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              )}
            </div>

            {/* Quick Navigation */}
            <div className="glass-panel rounded-2xl border border-slate-800 p-5">
              <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-cyan-400" /> Quick Navigation
              </h2>
              <div className="space-y-2">
                {isCitizen && (
                  <>
                    <a href="/citizen" className="flex items-center gap-2 px-3 py-2.5 bg-slate-900/60 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs text-slate-300 hover:text-cyan-400 transition">
                      <FileText className="w-3.5 h-3.5" /> My Complaints
                    </a>
                    <a href="/map" className="flex items-center gap-2 px-3 py-2.5 bg-slate-900/60 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs text-slate-300 hover:text-cyan-400 transition">
                      <MapPin className="w-3.5 h-3.5" /> Live City Map
                    </a>
                  </>
                )}
                {isGovMember && (
                  <>
                    <a href="/government" className="flex items-center gap-2 px-3 py-2.5 bg-slate-900/60 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs text-slate-300 hover:text-cyan-400 transition">
                      <Briefcase className="w-3.5 h-3.5" /> Department Queue
                    </a>
                  </>
                )}
                {isSuperAdmin && (
                  <>
                    <a href="/admin" className="flex items-center gap-2 px-3 py-2.5 bg-slate-900/60 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs text-slate-300 hover:text-cyan-400 transition">
                      <Shield className="w-3.5 h-3.5" /> Admin Console
                    </a>
                    <a href="/analytics" className="flex items-center gap-2 px-3 py-2.5 bg-slate-900/60 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs text-slate-300 hover:text-cyan-400 transition">
                      <Activity className="w-3.5 h-3.5" /> City Analytics
                    </a>
                  </>
                )}
                <a href="/agents" className="flex items-center gap-2 px-3 py-2.5 bg-slate-900/60 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs text-slate-300 hover:text-cyan-400 transition">
                  <Cpu className="w-3.5 h-3.5" /> AI Agent Center
                </a>
              </div>
            </div>

            {/* Aadhaar Display (Citizen only) */}
            {isCitizen && profile.aadhaar_masked && (
              <div className="glass-panel rounded-2xl border border-slate-800 p-5">
                <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-400" /> Identity Document
                </h2>
                <div>
                  <label className="text-[11px] text-slate-400">Aadhaar (Masked)</label>
                  <div className="mt-1 px-3 py-2 bg-slate-900/50 border border-slate-800 rounded-lg text-xs text-slate-400 font-mono tracking-widest">
                    {profile.aadhaar_masked}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
