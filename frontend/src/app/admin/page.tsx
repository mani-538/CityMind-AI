'use client';

import React, { useEffect, useState } from 'react';
import { RoleGuard } from '@/components/layout/RoleGuard';
import { apiClient } from '@/lib/api';
import { ShieldCheck, UserCheck, UserX, Clock, Building, AlertCircle, CheckCircle, RefreshCw, Cpu, Activity } from 'lucide-react';

interface OrgUserRequest {
  id: string;
  email: string;
  full_name: string;
  phone_number?: string;
  approval_status: string;
  approved_by?: string;
  approved_at?: string;
  employee_id?: string;
  official_email?: string;
  organization_type?: string;
  verification_notes?: string;
  roles: { id: string; name: string }[];
  created_at: string;
}

export default function SuperAdminPage() {
  const [requests, setRequests] = useState<OrgUserRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState<{ [key: string]: string }>({});
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchRequests = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiClient.get('/auth/organization-requests');
      if (res.data.success) {
        setRequests(res.data.data);
      }
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to fetch organization requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleApprove = async (userId: string) => {
    setActionLoading(userId);
    setError('');
    setSuccessMsg('');
    try {
      const res = await apiClient.post(`/auth/organization-requests/${userId}/approve`, {
        admin_notes: adminNotes[userId] || 'Approved by Super Admin',
      });
      if (res.data.success) {
        setSuccessMsg(res.data.message);
        fetchRequests();
      }
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Approval failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (userId: string) => {
    setActionLoading(userId);
    setError('');
    setSuccessMsg('');
    try {
      const res = await apiClient.post(`/auth/organization-requests/${userId}/reject`, {
        admin_notes: adminNotes[userId] || 'Rejected by Super Admin',
      });
      if (res.data.success) {
        setSuccessMsg(res.data.message);
        fetchRequests();
      }
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Rejection failed');
    } finally {
      setActionLoading(null);
    }
  };

  const pendingCount = requests.filter((r) => r.approval_status === 'Pending').length;
  const approvedCount = requests.filter((r) => r.approval_status === 'Approved').length;

  return (
    <RoleGuard allowedRoles={['Super Admin']}>
      <div className="flex-1 p-6 space-y-8 max-w-7xl mx-auto w-full">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 rounded-2xl border border-amber-500/30">
          <div>
            <div className="flex items-center gap-2 text-amber-400 text-xs font-mono font-bold uppercase tracking-widest mb-1">
              <ShieldCheck className="w-4 h-4" /> Super Admin Control Console
            </div>
            <h1 className="text-2xl font-extrabold text-white">Organization Registration Approvals</h1>
            <p className="text-sm text-slate-400 mt-1">Review, approve, or reject municipal department and agency member accounts.</p>
          </div>
          <button
            onClick={fetchRequests}
            disabled={loading}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 flex items-center gap-2 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Requests
          </button>
        </div>

        {/* Status Banners */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" /> {error}
          </div>
        )}

        {successMsg && (
          <div className="p-4 rounded-xl bg-green-950/60 border border-green-800 text-green-300 text-sm flex items-center gap-3">
            <CheckCircle className="w-5 h-5 shrink-0 text-green-400" /> {successMsg}
          </div>
        )}

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="glass-panel p-5 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pending Approval</div>
              <div className="text-3xl font-extrabold text-amber-400 mt-1">{pendingCount}</div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-950/60 border border-amber-800 flex items-center justify-center text-amber-400">
              <Clock className="w-6 h-6" />
            </div>
          </div>

          <div className="glass-panel p-5 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Approved Members</div>
              <div className="text-3xl font-extrabold text-emerald-400 mt-1">{approvedCount}</div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-950/60 border border-emerald-800 flex items-center justify-center text-emerald-400">
              <UserCheck className="w-6 h-6" />
            </div>
          </div>

          <div className="glass-panel p-5 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Agency Requests</div>
              <div className="text-3xl font-extrabold text-cyan-400 mt-1">{requests.length}</div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-cyan-950/60 border border-cyan-800 flex items-center justify-center text-cyan-400">
              <Building className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Requests List */}
        <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-base font-bold text-white">Pending & Processed Registrations</h2>
            <span className="text-xs text-slate-400 font-mono">Real-time Approval Workflow</span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400 font-mono text-xs">Loading organization requests...</div>
          ) : requests.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-sm">No organization registration requests found.</div>
          ) : (
            <div className="divide-y divide-slate-800">
              {requests.map((req) => (
                <div key={req.id} className="p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6 hover:bg-slate-900/50 transition">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-base font-bold text-white">{req.full_name}</span>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-cyan-400 border border-cyan-700/50 font-mono font-semibold">
                        {req.roles.map((r) => r.name).join(', ')}
                      </span>
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase ${
                          req.approval_status === 'Approved'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : req.approval_status === 'Rejected'
                            ? 'bg-rose-950 text-rose-400 border border-rose-800'
                            : 'bg-amber-950 text-amber-400 border border-amber-800 animate-pulse'
                        }`}
                      >
                        {req.approval_status}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-400 font-mono">
                      <div><strong className="text-slate-300">Login Email:</strong> {req.email}</div>
                      <div><strong className="text-slate-300">Official Email:</strong> {req.official_email || req.email}</div>
                      <div><strong className="text-slate-300">Employee ID:</strong> {req.employee_id || 'N/A'}</div>
                      <div><strong className="text-slate-300">Organization:</strong> {req.organization_type || 'Municipal Dept'}</div>
                      <div><strong className="text-slate-300">Phone:</strong> {req.phone_number || 'N/A'}</div>
                      <div><strong className="text-slate-300">Submitted:</strong> {new Date(req.created_at).toLocaleDateString()}</div>
                    </div>

                    {req.verification_notes && (
                      <div className="text-xs bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-slate-300 font-mono">
                        <strong>Admin Notes:</strong> {req.verification_notes}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  {req.approval_status === 'Pending' && (
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 w-full lg:w-auto">
                      <input
                        type="text"
                        placeholder="Admin notes / reason..."
                        value={adminNotes[req.id] || ''}
                        onChange={(e) => setAdminNotes({ ...adminNotes, [req.id]: e.target.value })}
                        className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 w-full lg:w-48"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(req.id)}
                          disabled={actionLoading === req.id}
                          className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition disabled:opacity-50"
                        >
                          <UserCheck className="w-3.5 h-3.5" /> Approve
                        </button>
                        <button
                          onClick={() => handleReject(req.id)}
                          disabled={actionLoading === req.id}
                          className="flex-1 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition disabled:opacity-50"
                        >
                          <UserX className="w-3.5 h-3.5" /> Reject
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </RoleGuard>
  );
}
