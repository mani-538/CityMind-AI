'use client';

import React, { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { TrendingUp, PieChart as PieIcon, BarChart3, ShieldCheck, Zap } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await apiClient.get('/analytics/summary');
        if (res.data.success) {
          setData(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  const priorityData = {
    labels: ['Critical', 'High', 'Medium', 'Low'],
    datasets: [
      {
        label: 'Incident Priority',
        data: [
          data?.priority_counts?.Critical || 2,
          data?.priority_counts?.High || 5,
          data?.priority_counts?.Medium || 12,
          data?.priority_counts?.Low || 8,
        ],
        backgroundColor: ['#ef4444', '#f97316', '#0284c7', '#10b981'],
        borderWidth: 0,
      },
    ],
  };

  const categoryData = {
    labels: ['Fire', 'Traffic', 'Water', 'Roads', 'Garbage', 'Safety'],
    datasets: [
      {
        label: 'Incidents by Category',
        data: [4, 8, 6, 5, 3, 2],
        backgroundColor: '#38bdf8',
        borderRadius: 8,
      },
    ],
  };

  return (
    <div className="flex-1 flex flex-col p-6 max-w-7xl mx-auto w-full space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs font-semibold uppercase tracking-wider mb-1">
            <TrendingUp className="w-4 h-4" /> Executive Telemetry
          </div>
          <h1 className="text-3xl font-extrabold text-white">Ashmora Smart City Analytics</h1>
          <p className="text-sm text-slate-400">Aggregated urban health index, priority metrics, and AI workflow performance.</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 rounded-2xl border border-slate-800">
          <div className="text-xs font-mono text-slate-400 uppercase mb-1">Municipal Health Index</div>
          <div className="text-4xl font-extrabold text-cyan-400">94.2 / 100</div>
          <p className="text-xs text-slate-500 mt-2">Optimal dispatch efficiency across all 5 municipal sectors.</p>
        </div>

        <div className="glass-card p-6 rounded-2xl border border-slate-800">
          <div className="text-xs font-mono text-slate-400 uppercase mb-1">Total Agent Executions</div>
          <div className="text-4xl font-extrabold text-purple-400">{data?.total_agent_executions || 48}</div>
          <p className="text-xs text-slate-500 mt-2">Autonomous multi-agent verification & emergency routing runs.</p>
        </div>

        <div className="glass-card p-6 rounded-2xl border border-slate-800">
          <div className="text-xs font-mono text-slate-400 uppercase mb-1">Avg Resolution Time</div>
          <div className="text-4xl font-extrabold text-emerald-400">18.5 Mins</div>
          <p className="text-xs text-slate-500 mt-2">Time from incident report to work unit dispatch.</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6 rounded-2xl border border-slate-800 flex flex-col items-center">
          <h3 className="text-base font-bold text-white mb-4 self-start flex items-center gap-2">
            <PieIcon className="w-4 h-4 text-cyan-400" /> Incident Priority Distribution
          </h3>
          <div className="w-64 h-64">
            <Doughnut data={priorityData} options={{ maintainAspectRatio: true }} />
          </div>
        </div>

        <div className="glass-card p-6 rounded-2xl border border-slate-800">
          <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-cyan-400" /> Incident Volume by Category
          </h3>
          <div className="h-64">
            <Bar data={categoryData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>
      </div>
    </div>
  );
}
