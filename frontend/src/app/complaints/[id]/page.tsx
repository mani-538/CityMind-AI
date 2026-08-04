'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { RoleGuard } from '@/components/layout/RoleGuard';
import { HeadAIWorkflowVisualizer } from '@/components/agents/HeadAIWorkflowVisualizer';
import { Shield, Clock, MapPin, User, CheckCircle2, AlertTriangle, ArrowLeft, Cpu, Activity, Star, Send } from 'lucide-react';
import Link from 'next/link';

interface TimelineEvent {
  id: string;
  stage: string;
  title: string;
  description?: string;
  actor_role?: string;
  actor_name?: string;
  created_at: string;
}

interface ComplaintDetail {
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
  verified_by?: string;
  verification_method?: string;
  verification_time?: string;
  verification_notes?: string;
  ai_verified: boolean;
  ai_summary?: string;
  ai_recommended_action?: string;
  citizen_rating?: number;
  citizen_feedback_text?: string;
  images: { id: string; image_url: string; caption?: string }[];
  timeline_events: TimelineEvent[];
  created_at: string;
}

export default function ComplaintDetailPage() {
  const params = useParams();
  const router = useRouter();
  const complaintId = params.id as string;

  const [complaint, setComplaint] = useState<ComplaintDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [rating, setRating] = useState(5);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/complaints/${complaintId}`);
      if (res.data.success) {
        setComplaint(res.data.data);
      }
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to load complaint details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (complaintId) fetchDetails();
  }, [complaintId]);

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackLoading(true);
    try {
      const res = await apiClient.post(`/complaints/${complaintId}/feedback`, {
        rating,
        feedback_text: feedbackText,
      });
      if (res.data.success) {
        setFeedbackSuccess(true);
        fetchDetails();
      }
    } catch (err) {
      alert('Failed to submit feedback');
    } finally {
      setFeedbackLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12 text-cyan-400 font-mono text-sm">
        Loading Incident Timeline & AI Multi-Agent Workflow...
      </div>
    );
  }

  if (error || !complaint) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="glass-panel p-8 rounded-2xl border border-rose-800 max-w-md text-center">
          <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-white mb-2">Complaint Not Found</h2>
          <p className="text-xs text-slate-400 mb-4">{error}</p>
          <button onClick={() => router.back()} className="px-4 py-2 bg-slate-800 text-white text-xs rounded-xl">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <RoleGuard>
      <div className="flex-1 p-6 space-y-8 max-w-6xl mx-auto w-full">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </button>
          <div className="text-xs font-mono text-slate-500">Incident ID: {complaint.id}</div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column (2 cols): Details & Multi-Agent Visualizer */}
          <div className="lg:col-span-2 space-y-6">
            {/* Main Details Card */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-700 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs px-3 py-1 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 font-mono font-bold">
                  {complaint.category}
                </span>
                <div className="flex gap-2">
                  <span
                    className={`text-xs px-3 py-1 rounded-full font-bold uppercase ${
                      complaint.verification_status === 'Verified'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : complaint.verification_status === 'Rejected'
                        ? 'bg-rose-950 text-rose-400 border border-rose-800'
                        : 'bg-amber-950 text-amber-400 border border-amber-800'
                    }`}
                  >
                    Verification: {complaint.verification_status}
                  </span>
                  <span
                    className={`text-xs px-3 py-1 rounded-full font-bold uppercase ${
                      complaint.priority === 'Critical' ? 'bg-rose-950 text-rose-400 border border-rose-800' : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {complaint.priority} Priority
                  </span>
                </div>
              </div>

              <h1 className="text-2xl font-extrabold text-white">{complaint.title}</h1>

              <p className="text-sm text-slate-300 leading-relaxed">{complaint.description}</p>

              <div className="pt-3 border-t border-slate-800 flex items-center gap-4 text-xs font-mono text-slate-400">
                <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-cyan-400" /> {complaint.address}</span>
                <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-slate-500" /> {new Date(complaint.created_at).toLocaleString()}</span>
              </div>

              {/* Department Verification Audit Info */}
              {complaint.verified_by && (
                <div className="p-4 rounded-xl bg-slate-900/90 border border-emerald-500/40 text-xs font-mono space-y-1">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold">
                    <CheckCircle2 className="w-4 h-4" /> Department Verification Record
                  </div>
                  <div className="text-slate-300">Verified By: <strong>{complaint.verified_by}</strong></div>
                  <div className="text-slate-300">Method: <strong>{complaint.verification_method}</strong></div>
                  {complaint.verification_notes && <div className="text-slate-400">Notes: {complaint.verification_notes}</div>}
                </div>
              )}

              {/* Incident Images */}
              {complaint.images.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Submitted Incident Photos</div>
                  <div className="flex gap-3 overflow-x-auto">
                    {complaint.images.map((img) => (
                      <img
                        key={img.id}
                        src={img.image_url}
                        alt="Incident Evidence"
                        className="w-40 h-28 object-cover rounded-xl border border-slate-700"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Head AI Multi-Agent Workflow Visualizer */}
            <HeadAIWorkflowVisualizer
              complaintTitle={complaint.title}
              category={complaint.category}
              priority={complaint.priority}
              aiSummary={complaint.ai_summary}
              recommendedAction={complaint.ai_recommended_action}
            />
          </div>

          {/* Right Column (1 col): Timeline & Feedback */}
          <div className="space-y-6">
            {/* Timeline Widget */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-5">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-cyan-400" /> Incident Timeline
              </h2>

              <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
                {complaint.timeline_events.length === 0 ? (
                  <div className="text-xs text-slate-500 font-mono">No timeline entries yet.</div>
                ) : (
                  complaint.timeline_events.map((ev, index) => (
                    <div key={ev.id} className="relative">
                      {/* Timeline Node Icon */}
                      <span className={`absolute -left-6 top-0 w-4 h-4 rounded-full border-2 bg-slate-950 ${
                        index === complaint.timeline_events.length - 1 ? 'border-cyan-400 animate-pulse' : 'border-slate-600'
                      }`} />
                      <div className="text-xs font-bold text-white">{ev.title}</div>
                      {ev.description && <div className="text-xs text-slate-400 mt-0.5">{ev.description}</div>}
                      <div className="text-[10px] text-slate-500 font-mono mt-1">
                        {ev.actor_role && <span className="text-cyan-400">{ev.actor_role} • </span>}
                        {new Date(ev.created_at).toLocaleTimeString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Citizen Feedback Form */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-400" /> Citizen Feedback
              </h3>

              {complaint.citizen_rating ? (
                <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-700 text-xs space-y-1">
                  <div className="flex items-center gap-1 text-amber-400 font-bold">
                    {'★'.repeat(complaint.citizen_rating)} <span className="text-slate-400">({complaint.citizen_rating}/5)</span>
                  </div>
                  {complaint.citizen_feedback_text && (
                    <p className="text-slate-300 italic">&ldquo;{complaint.citizen_feedback_text}&rdquo;</p>
                  )}
                </div>
              ) : (
                <form onSubmit={handleFeedbackSubmit} className="space-y-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Rate Incident Resolution</label>
                    <select
                      value={rating}
                      onChange={(e) => setRating(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs text-white"
                    >
                      <option value={5}>5 Stars — Excellent Response</option>
                      <option value={4}>4 Stars — Good Response</option>
                      <option value={3}>3 Stars — Average</option>
                      <option value={2}>2 Stars — Needs Improvement</option>
                      <option value={1}>1 Star — Poor</option>
                    </select>
                  </div>
                  <textarea
                    rows={2}
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder="Share your feedback about the municipal response..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs text-white"
                  />
                  <button
                    type="submit"
                    disabled={feedbackLoading}
                    className="w-full py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition"
                  >
                    <Send className="w-3.5 h-3.5" /> Submit Feedback
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
