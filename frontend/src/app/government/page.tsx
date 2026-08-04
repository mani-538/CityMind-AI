'use client';

import React, { useEffect, useState } from 'react';
import { RoleGuard } from '@/components/layout/RoleGuard';
import { apiClient } from '@/lib/api';
import { Shield, CheckCircle2, XCircle, AlertTriangle, Clock, RefreshCw, FileText, Phone, Mail, MapPin, ArrowRight, Eye } from 'lucide-react';
import Link from 'next/link';

interface ComplaintItem {
  id: string;
  title: string;
  category: string;
  description: string;
  status: string;
  verification_status: string;
  priority: string;
  address: string;
  latitude: number;
  longitude: number;
  created_at: string;
  ai_summary?: string;
  ai_confidence_score?: number;
}

export default function GovernmentDashboardPage() {
  const [queue, setQueue] = useState<ComplaintItem[]>([]);
  const [allComplaints, setAllComplaints] = useState<ComplaintItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'queue' | 'all'>('queue');
  const [verifyModalId, setVerifyModalId] = useState<string | null>(null);
  const [verifyMethod, setVerifyMethod] = useState('Manual Site Verification');
  const [verifyNotes, setVerifyNotes] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [qRes, allRes] = await Promise.all([
        apiClient.get('/complaints/queue/verification'),
        apiClient.get('/complaints/'),
      ]);
      if (qRes.data.success) setQueue(qRes.data.data);
      if (allRes.data.success) setAllComplaints(allRes.data.data);
    } catch (err) {
      console.error('Failed to load department dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleVerify = async (complaintId: string) => {
    setActionLoading(true);
    try {
      const res = await apiClient.post(`/complaints/${complaintId}/verify`, {
        verification_method: verifyMethod,
        notes: verifyNotes || `Verified via ${verifyMethod}`,
      });
      if (res.data.success) {
        setFeedbackMsg(`Complaint ${complaintId.slice(0, 8)} VERIFIED & published to GIS map!`);
        setVerifyModalId(null);
        fetchData();
      }
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Verification failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (complaintId: string) => {
    if (!rejectReason) {
      alert('Please provide a reason for rejecting this complaint.');
      return;
    }
    setActionLoading(true);
    try {
      const res = await apiClient.post(`/complaints/${complaintId}/reject`, {
        reason: rejectReason,
      });
      if (res.data.success) {
        setFeedbackMsg(`Complaint ${complaintId.slice(0, 8)} REJECTED.`);
        setVerifyModalId(null);
        fetchData();
      }
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Rejection failed');
    } finally {
      setActionLoading(false);
    }
  };

  const pendingCount = queue.length;
  const verifiedCount = allComplaints.filter((c) => c.verification_status === 'Verified').length;
  const criticalCount = allComplaints.filter((c) => c.priority === 'Critical').length;

  return (
    <RoleGuard allowedRoles={['Government Officer', 'Department Admin', 'Super Admin']}>
      <div className="flex-1 p-6 space-y-8 max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 rounded-2xl border border-cyan-500/30">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono font-bold uppercase tracking-widest mb-1">
              <Shield className="w-4 h-4" /> Government Command & Dispatch Center
            </div>
            <h1 className="text-2xl font-extrabold text-white">Department Incident Verification Queue</h1>
            <p className="text-sm text-slate-400 mt-1">
              Review, verify, or reject incoming citizen incident reports before they appear on the public GIS map.
            </p>
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 flex items-center gap-2 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Queue
          </button>
        </div>

        {feedbackMsg && (
          <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-sm flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" /> {feedbackMsg}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="glass-panel p-5 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pending Verification</div>
              <div className="text-3xl font-extrabold text-amber-400 mt-1">{pendingCount}</div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-950/60 border border-amber-800 flex items-center justify-center text-amber-400">
              <Clock className="w-6 h-6" />
            </div>
          </div>

          <div className="glass-panel p-5 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Verified Incidents</div>
              <div className="text-3xl font-extrabold text-emerald-400 mt-1">{verifiedCount}</div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-950/60 border border-emerald-800 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>

          <div className="glass-panel p-5 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Critical Priorities</div>
              <div className="text-3xl font-extrabold text-rose-400 mt-1">{criticalCount}</div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-rose-950/60 border border-rose-800 flex items-center justify-center text-rose-400">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-4 border-b border-slate-800 pb-3">
          <button
            onClick={() => setActiveTab('queue')}
            className={`pb-2 text-sm font-bold flex items-center gap-2 border-b-2 transition ${
              activeTab === 'queue' ? 'border-amber-400 text-amber-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-4 h-4" /> Pending Verification Queue ({queue.length})
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`pb-2 text-sm font-bold flex items-center gap-2 border-b-2 transition ${
              activeTab === 'all' ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" /> All Department Complaints ({allComplaints.length})
          </button>
        </div>

        {/* Incident List */}
        <div className="space-y-4">
          {activeTab === 'queue' ? (
            queue.length === 0 ? (
              <div className="glass-panel p-12 text-center text-slate-500 rounded-2xl border border-slate-800">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3 opacity-60" />
                <p className="font-semibold text-white">Verification Queue Clear!</p>
                <p className="text-xs text-slate-400 mt-1">All submitted citizen complaints have been processed.</p>
              </div>
            ) : (
              queue.map((c) => (
                <div key={c.id} className="glass-panel p-6 rounded-2xl border border-amber-500/30 flex flex-col lg:flex-row lg:items-center justify-between gap-6 hover:border-amber-500/60 transition">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-base font-bold text-white">{c.title}</span>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-cyan-400 border border-cyan-700/50 font-mono">
                        {c.category}
                      </span>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase ${
                        c.priority === 'Critical' ? 'bg-rose-950 text-rose-400 border border-rose-800' : 'bg-amber-950 text-amber-400 border border-amber-800'
                      }`}>
                        {c.priority} Priority
                      </span>
                    </div>

                    <p className="text-sm text-slate-300 line-clamp-2">{c.description}</p>

                    <div className="flex items-center gap-4 text-xs text-slate-400 font-mono">
                      <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-slate-500" /> {c.address}</span>
                      <span>Submitted: {new Date(c.created_at).toLocaleTimeString()}</span>
                    </div>

                    {c.ai_summary && (
                      <div className="text-xs bg-slate-950 p-3 rounded-xl border border-cyan-900/50 text-cyan-300 font-mono">
                        <strong className="text-cyan-400">Head AI Agent Assessment:</strong> {c.ai_summary}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <Link
                      href={`/complaints/${c.id}`}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" /> Details
                    </Link>
                    <button
                      onClick={() => setVerifyModalId(c.id)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-900/30 transition"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Verify Complaint
                    </button>
                  </div>
                </div>
              ))
            )
          ) : (
            allComplaints.map((c) => (
              <div key={c.id} className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-6 hover:border-slate-700 transition">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-base font-bold text-white">{c.title}</span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-cyan-400 border border-cyan-700/50 font-mono">
                      {c.category}
                    </span>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                      c.verification_status === 'Verified' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-amber-950 text-amber-400 border border-amber-800'
                    }`}>
                      {c.verification_status}
                    </span>
                  </div>
                  <p className="text-sm text-slate-300">{c.description}</p>
                </div>
                <Link
                  href={`/complaints/${c.id}`}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition flex items-center gap-1 self-start lg:self-center"
                >
                  <Eye className="w-3.5 h-3.5" /> View Timeline <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))
          )}
        </div>

        {/* Verification Modal */}
        {verifyModalId && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="glass-panel max-w-lg w-full p-6 rounded-2xl border border-cyan-500/50 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Shield className="w-5 h-5 text-cyan-400" /> Verify Incident Report
                </h3>
                <button onClick={() => setVerifyModalId(null)} className="text-slate-400 hover:text-white">✕</button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Select Verification Method
                </label>
                <select
                  value={verifyMethod}
                  onChange={(e) => setVerifyMethod(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-cyan-500"
                >
                  <option value="Manual Site Verification">Manual Site Verification (Officer On-site)</option>
                  <option value="Phone Call Verification">Phone Call Verification with Citizen</option>
                  <option value="Email Verification">Official Email Confirmation</option>
                  <option value="Internal Confirmation">Internal Precinct Confirmation</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Verification Notes / Evidence Summary
                </label>
                <textarea
                  rows={3}
                  value={verifyNotes}
                  onChange={(e) => setVerifyNotes(e.target.value)}
                  placeholder="e.g. Officer Vance confirmed main valve burst at 5th Ave..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-rose-400 uppercase tracking-wider mb-2">
                  Reject Reason (Only if rejecting)
                </label>
                <input
                  type="text"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g. Duplicate report or invalid location..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => handleVerify(verifyModalId)}
                  disabled={actionLoading}
                  className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold rounded-xl text-sm transition flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" /> Approve & Publish to Map
                </button>

                <button
                  onClick={() => handleReject(verifyModalId)}
                  disabled={actionLoading}
                  className="py-3 px-4 bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800 font-bold rounded-xl text-sm transition"
                >
                  <XCircle className="w-4 h-4" /> Reject
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
