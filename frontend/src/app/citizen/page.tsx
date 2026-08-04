'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/lib/api';
import { RoleGuard } from '@/components/layout/RoleGuard';
import { CityMap, MapMarkerItem } from '@/components/map/CityMap';
import { Plus, Send, CheckCircle, Clock, MapPin, AlertCircle, FileText, Sparkles, Eye, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function CitizenPortal() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<any[]>([]);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Fire Hazard');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('Central Avenue & 4th Street');
  const [lat, setLat] = useState(40.7128);
  const [lng, setLng] = useState(-74.0060);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const fetchMyComplaints = async () => {
    try {
      const res = await apiClient.get('/complaints/');
      if (res.data.success) {
        setComplaints(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch citizen complaints:', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchMyComplaints();
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await apiClient.post('/complaints/', {
        title,
        category,
        description,
        address,
        latitude: lat,
        longitude: lng,
        image_urls: ['https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3'],
      });

      if (res.data.success) {
        setSuccessMsg('Complaint reported successfully! Sent to department verification queue.');
        setTitle('');
        setDescription('');
        setShowSubmitModal(false);
        fetchMyComplaints();
        setTimeout(() => setSuccessMsg(''), 5000);
      }
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to submit complaint');
    } finally {
      setLoading(false);
    }
  };

  const mapMarkers: MapMarkerItem[] = complaints.map((c) => ({
    id: c.id,
    title: c.title,
    category: c.category,
    description: c.description,
    status: c.status,
    priority: c.priority,
    latitude: c.latitude,
    longitude: c.longitude,
    address: c.address,
  }));

  return (
    <RoleGuard allowedRoles={['Citizen', 'Super Admin']}>
      <div className="flex-1 flex flex-col p-6 max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-white">Citizen Operating Portal</h1>
            <p className="text-sm text-slate-400">Report urban issues and track real-time resolution timeline.</p>
          </div>

          <button
            onClick={() => setShowSubmitModal(true)}
            className="px-6 py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-xl shadow-xl shadow-cyan-900/40 flex items-center gap-2 transition hover:scale-[1.02]"
          >
            <Plus className="w-5 h-5" /> Report New Incident
          </button>
        </div>

        {successMsg && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-sm flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-emerald-400 shrink-0" />
            {successMsg}
          </div>
        )}

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Complaint Tracking List */}
          <div className="lg:col-span-1 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-cyan-400" /> My Reported Complaints ({complaints.length})
            </h2>

            {complaints.length === 0 ? (
              <div className="glass-card p-8 rounded-2xl text-center text-slate-500 text-sm">
                No reported incidents found. Click &quot;Report New Incident&quot; above to submit one.
              </div>
            ) : (
              complaints.map((c) => (
                <div key={c.id} className="glass-card p-5 rounded-2xl border border-slate-800 hover:border-cyan-500/40 transition space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                      {c.category}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        c.priority === 'Critical'
                          ? 'bg-rose-950 text-rose-400 border border-rose-800'
                          : c.priority === 'High'
                          ? 'bg-amber-950 text-amber-400 border border-amber-800'
                          : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      }`}
                    >
                      {c.priority} Priority
                    </span>
                  </div>

                  <h3 className="font-bold text-white text-base">{c.title}</h3>
                  <p className="text-xs text-slate-400 line-clamp-2">{c.description}</p>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs text-slate-400">
                    <div className="flex items-center gap-1 font-mono text-[11px] text-cyan-400">
                      <Clock className="w-3.5 h-3.5 text-cyan-400" /> {c.status}
                    </div>
                    <Link
                      href={`/complaints/${c.id}`}
                      className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" /> Timeline <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Right Column: Live Map Location Overview */}
          <div className="lg:col-span-2 flex flex-col">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-cyan-400" /> Live Spatial Incident Locations
            </h2>
            <div className="flex-1 min-h-[450px]">
              <CityMap markers={mapMarkers} />
            </div>
          </div>
        </div>

        {/* Modal: Incident Submission */}
        {showSubmitModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="glass-panel max-w-xl w-full p-6 rounded-2xl border border-slate-700 shadow-2xl relative max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Send className="w-5 h-5 text-cyan-400" /> Report Municipal Incident
                </h2>
                <button
                  onClick={() => setShowSubmitModal(false)}
                  className="text-slate-400 hover:text-white font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Incident Title
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Major Water Pipe Leak at Main St"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                      Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500 text-sm"
                    >
                      <option value="Fire Hazard">Fire Hazard</option>
                      <option value="Traffic Congestion">Traffic Congestion</option>
                      <option value="Road Damage">Road Damage</option>
                      <option value="Water Leakage">Water Leakage</option>
                      <option value="Garbage Accumulation">Garbage Accumulation</option>
                      <option value="Street Lighting">Street Lighting</option>
                      <option value="Public Safety">Public Safety</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                      Address / Landmark
                    </label>
                    <input
                      type="text"
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="e.g. 5th Ave & 42nd St"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Detailed Description
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the severity, affected area, or immediate danger..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-sm"
                  />
                </div>

                <div className="pt-2">
                  <span className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Drop Pin Location on Map:
                  </span>
                  <div className="h-48 rounded-xl overflow-hidden border border-slate-700">
                    <CityMap
                      markers={[]}
                      selectable={true}
                      onLocationSelect={(selectedLat, selectedLng) => {
                        setLat(selectedLat);
                        setLng(selectedLng);
                      }}
                    />
                  </div>
                  <div className="text-[10px] font-mono text-cyan-400 mt-1">
                    Selected GPS: Lat {lat.toFixed(4)}, Lng {lng.toFixed(4)}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowSubmitModal(false)}
                    className="px-5 py-2.5 glass-panel text-slate-300 hover:text-white rounded-xl text-sm font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-cyan-900/40 transition disabled:opacity-50"
                  >
                    {loading ? 'Submitting...' : 'Submit Incident'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
