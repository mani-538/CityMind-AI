'use client';

import React, { useEffect, useState } from 'react';
import { CityMap, MapMarkerItem } from '@/components/map/CityMap';
import { apiClient } from '@/lib/api';
import { Compass, Filter, RefreshCw, AlertTriangle, ShieldCheck, Flame, Navigation } from 'lucide-react';

export default function LiveMapPage() {
  const [markers, setMarkers] = useState<MapMarkerItem[]>([]);
  const [filterPriority, setFilterPriority] = useState<string>('ALL');
  const [loading, setLoading] = useState<boolean>(true);

  const fetchMarkers = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/complaints/map/markers');
      if (res.data.success) {
        setMarkers(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch map markers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarkers();
  }, []);

  const filteredMarkers = markers.filter((m) => {
    if (filterPriority === 'ALL') return true;
    return m.priority.toUpperCase() === filterPriority.toUpperCase();
  });

  return (
    <div className="flex-1 flex flex-col p-6 max-w-7xl mx-auto w-full">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs font-semibold uppercase tracking-wider mb-1">
            <Compass className="w-4 h-4" /> Spatial Intelligence Feed
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Live City GIS Map</h1>
          <p className="text-sm text-slate-400">Real-time incident distribution & priority heat layers.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="glass-panel px-3 py-1.5 rounded-xl flex items-center gap-2 border border-slate-700 text-xs text-slate-300">
            <Filter className="w-3.5 h-3.5 text-cyan-400" />
            Priority:
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-slate-900">All Priorities</option>
              <option value="CRITICAL" className="bg-slate-900 text-rose-400">Critical</option>
              <option value="HIGH" className="bg-slate-900 text-amber-400">High</option>
              <option value="MEDIUM" className="bg-slate-900 text-cyan-400">Medium</option>
              <option value="LOW" className="bg-slate-900 text-emerald-400">Low</option>
            </select>
          </div>

          <button
            onClick={fetchMarkers}
            disabled={loading}
            className="p-2.5 glass-panel hover:bg-slate-800 rounded-xl text-slate-300 hover:text-cyan-400 transition"
            title="Refresh Map Feeds"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 w-full h-[650px] relative">
        <CityMap markers={filteredMarkers} />
      </div>
    </div>
  );
}
