'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/lib/api';
import { CityMap, MapMarkerItem } from '@/components/map/CityMap';
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  Activity,
  Cpu,
  Flame,
  Clock,
  Filter,
  RefreshCw,
  Zap,
  Bot,
  UserCheck,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

export default function GovernmentDashboard() {
  const { user, hasRole } = useAuth();
  const [complaints, setComplaints] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [agentLogs, setAgentLogs] = useState<any[]>([]);
  const [selectedComplaint, setSelectedComplaint] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [updatingStatus, setUpdatingStatus] = useState<boolean>(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [compRes, anaRes, logRes] = await Promise.all([
        apiClient.get('/complaints/'),
        apiClient.get('/analytics/summary'),
        apiClient.get('/agents/logs'),
      ]);

      if (compRes.data.success) setComplaints(compRes.data.data);
      if (anaRes.data.success) setAnalytics(anaRes.data.data);
      if (logRes.data.success) setAgentLogs(logRes.data.data);
    } catch (err) {
      console.error('Failed to load command center data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateStatus = async (complaintId: string, newStatus: string) => {
    setUpdatingStatus(true);
    try {
      const res = await apiClient.patch(`/complaints/${complaintId}/status`, {
        status: newStatus,
        notes: `Status updated to ${newStatus} by Officer Command Center`,
      });
      if (res.data.success) {
        fetchData();
        if (selectedComplaint && selectedComplaint.id === complaintId) {
          setSelectedComplaint(res.data.data);
        }
      }
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleTriggerAgents = async (complaintId: string) => {
    try {
      const res = await apiClient.post(`/agents/trigger/${complaintId}`);
      if (res.data.success) {
        alert('Multi-Agent AI Workflow re-executed successfully!');
        fetchData();
      }
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Agent trigger failed');
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
    <div className="flex-1 flex flex-col p-6 max-w-7xl mx-auto w-full space-y-6">
      {/* Top Banner & Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 rounded-2xl border border-cyan-500/20 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-2xl glow-blue shadow-lg">
            <Shield />
          </div>
          <div>
            <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs font-semibold uppercase tracking-wider">
              <Zap className="w-3.5 h-3.5" /> Ashmora Smart City Central Command
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white">Government Officer Dashboard</h1>
          </div>
        </div>

        <button
          onClick={fetchData}
          className="px-4 py-2.5 glass-panel hover:bg-slate-800 rounded-xl text-slate-300 hover:text-cyan-400 font-medium text-sm flex items-center gap-2 transition"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} /> Refresh Telemetry
        </button>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs font-mono text-slate-400 uppercase mb-1">Total Incidents</div>
            <div className="text-3xl font-extrabold text-white">{analytics?.total_complaints || 0}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-cyan-400">
            <Activity />
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs font-mono text-slate-400 uppercase mb-1">Critical Emergencies</div>
            <div className="text-3xl font-extrabold text-rose-500">{analytics?.critical_emergencies || 0}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-950 border border-rose-800 flex items-center justify-center text-rose-400">
            <Flame />
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs font-mono text-slate-400 uppercase mb-1">AI Verified %</div>
            <div className="text-3xl font-extrabold text-cyan-400">{analytics?.ai_verification_rate || 98.4}%</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400">
            <Cpu />
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs font-mono text-slate-400 uppercase mb-1">Avg Response Time</div>
            <div className="text-3xl font-extrabold text-emerald-400">{analytics?.avg_response_time_minutes || 18.5}m</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400">
            <Clock />
          </div>
        </div>
      </div>

      {/* Main Grid: Incident Table & Agent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Incident Queue & Dispatch Controls */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card p-6 rounded-2xl border border-slate-800">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-cyan-400" /> Real-Time Incident Stream & Dispatch Queue
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-xs font-mono text-slate-400 uppercase">
                    <th className="pb-3 px-2">Incident</th>
                    <th className="pb-3 px-2">Category</th>
                    <th className="pb-3 px-2">Priority</th>
                    <th className="pb-3 px-2">Status</th>
                    <th className="pb-3 px-2">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-sm">
                  {complaints.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-900/50 transition">
                      <td className="py-3 px-2">
                        <div className="font-bold text-white leading-tight">{c.title}</div>
                        <div className="text-xs text-slate-400 line-clamp-1">{c.address}</div>
                      </td>
                      <td className="py-3 px-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          {c.category}
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            c.priority === 'Critical'
                              ? 'bg-rose-950 text-rose-400 border border-rose-800'
                              : c.priority === 'High'
                              ? 'bg-amber-950 text-amber-400 border border-amber-800'
                              : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          }`}
                        >
                          {c.priority}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-xs font-mono text-cyan-400">{c.status}</td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setSelectedComplaint(c)}
                            className="px-2.5 py-1 text-xs glass-panel hover:bg-slate-800 rounded-lg text-cyan-400 transition"
                          >
                            Details
                          </button>
                          {c.status !== 'Completed' && (
                            <button
                              onClick={() => handleUpdateStatus(c.id, 'Work Started')}
                              disabled={updatingStatus}
                              className="px-2.5 py-1 text-xs bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition"
                            >
                              Dispatch
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* GIS Map Panel */}
          <div className="glass-card p-6 rounded-2xl border border-slate-800">
            <h2 className="text-lg font-bold text-white mb-4">Command Center GIS Map Overlay</h2>
            <div className="h-[400px]">
              <CityMap markers={mapMarkers} />
            </div>
          </div>
        </div>

        {/* Right Col: AI Agent Activity Stream & Selected Incident Detail */}
        <div className="space-y-6">
          {/* Selected Complaint Detail Box */}
          {selectedComplaint ? (
            <div className="glass-card p-6 rounded-2xl border border-cyan-500/40 relative">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono font-bold uppercase text-cyan-400">Incident Telemetry</span>
                <button
                  onClick={() => setSelectedComplaint(null)}
                  className="text-slate-400 hover:text-white text-xs font-bold"
                >
                  Close
                </button>
              </div>

              <h3 className="text-lg font-bold text-white mb-2">{selectedComplaint.title}</h3>
              <p className="text-xs text-slate-300 mb-4">{selectedComplaint.description}</p>

              {selectedComplaint.ai_summary && (
                <div className="p-3 rounded-xl bg-slate-900 border border-cyan-900/60 mb-4 text-xs text-cyan-300">
                  <span className="font-bold text-cyan-400 block mb-1">AI Recommendation:</span>
                  {selectedComplaint.ai_summary}
                </div>
              )}

              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="text-xs text-slate-400">Change Incident Status:</div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleUpdateStatus(selectedComplaint.id, 'Assigned')}
                    className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-xs text-white rounded-lg font-semibold"
                  >
                    Assign Officer
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedComplaint.id, 'Completed')}
                    className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-xs text-white rounded-lg font-semibold"
                  >
                    Mark Resolved
                  </button>
                </div>
                <button
                  onClick={() => handleTriggerAgents(selectedComplaint.id)}
                  className="w-full py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-xs text-white rounded-lg font-bold flex items-center justify-center gap-2 mt-2"
                >
                  <Bot className="w-3.5 h-3.5" /> Re-trigger Gemini Multi-Agent Workflow
                </button>
              </div>
            </div>
          ) : (
            <div className="glass-card p-6 rounded-2xl border border-slate-800 text-center text-xs text-slate-500">
              Select an incident from the stream to view full AI telemetry and execute manual dispatch actions.
            </div>
          )}

          {/* AI Agent Execution Logs Stream */}
          <div className="glass-card p-6 rounded-2xl border border-slate-800">
            <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <Bot className="w-4 h-4 text-purple-400" /> Multi-Agent Execution Stream ({agentLogs.length})
            </h2>

            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
              {agentLogs.map((log) => (
                <div key={log.id} className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-bold text-cyan-400 font-mono">{log.agent_name}</span>
                    <span className="text-[10px] text-slate-500">{new Date(log.created_at).toLocaleTimeString()}</span>
                  </div>
                  <div className="text-slate-300 font-medium mb-1">{log.action}</div>
                  <div className="text-[10px] font-mono text-slate-500 truncate">{log.output_data}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
