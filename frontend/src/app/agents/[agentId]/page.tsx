'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { RoleGuard } from '@/components/layout/RoleGuard';
import { AGENT_REGISTRY } from '@/data/agents';
import { Cpu, Activity, CheckCircle2, ArrowLeft, Play, Zap, Layers } from 'lucide-react';

export default function AgentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const agentId = params.agentId as string;

  const agent = AGENT_REGISTRY.find((a) => a.id === agentId) || AGENT_REGISTRY[0];

  const [simulating, setSimulating] = useState(false);
  const [logs, setLogs] = useState([
    { id: '1', time: '10:42 AM', action: 'INIT_ASSESSMENT', details: `Evaluated priority matrix for incoming ${agent.name} event.` },
    { id: '2', time: '10:40 AM', action: 'OPTIMIZE_PARAMETERS', details: `Recalibrated predictive ML confidence score to ${agent.accuracy}.` },
    { id: '3', time: '10:35 AM', action: 'DISPATCH_SIGNAL', details: `Dispatched automated signal to ${agent.connectedDept}.` },
  ]);

  const handleRunSim = () => {
    setSimulating(true);
    setTimeout(() => {
      const newLog = {
        id: Date.now().toString(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        action: 'SIMULATED_REASSESSMENT',
        details: `Simulated live operational evaluation executed by ${agent.name}. Status: OPTIMAL.`,
      };
      setLogs([newLog, ...logs]);
      setSimulating(false);
    }, 1200);
  };

  return (
    <RoleGuard>
      <div className="flex-1 p-6 space-y-8 max-w-6xl mx-auto w-full">
        {/* Navigation */}
        <button
          onClick={() => router.push('/agents')}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> Return to AI Agent Hub
        </button>

        {/* Hero Header */}
        <div className={`glass-panel p-8 rounded-2xl border bg-gradient-to-r ${agent.color} flex flex-col md:flex-row md:items-center justify-between gap-6`}>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center shadow-xl">
              {agent.icon}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-slate-950 text-cyan-400 border border-cyan-800 uppercase">
                  {agent.category}
                </span>
                <span className="text-xs font-mono text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> SYSTEM ACTIVE
                </span>
              </div>
              <h1 className="text-2xl font-extrabold text-white">{agent.name}</h1>
              <p className="text-sm text-slate-300 mt-1 max-w-2xl">{agent.description}</p>
            </div>
          </div>

          <button
            onClick={handleRunSim}
            disabled={simulating}
            className="px-5 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-900/40 transition shrink-0 disabled:opacity-50"
          >
            <Play className={`w-4 h-4 ${simulating ? 'animate-spin' : ''}`} />
            {simulating ? 'Evaluating AI Model...' : 'Simulate Live Agent Assessment'}
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 font-mono">
          <div className="glass-panel p-5 rounded-xl border border-slate-800 text-center">
            <div className="text-xs text-slate-400 uppercase">Connected Department</div>
            <div className="text-sm font-bold text-white mt-1">{agent.connectedDept}</div>
          </div>
          <div className="glass-panel p-5 rounded-xl border border-slate-800 text-center">
            <div className="text-xs text-slate-400 uppercase">Tasks Executed Today</div>
            <div className="text-2xl font-extrabold text-cyan-400 mt-1">{agent.tasksToday}</div>
          </div>
          <div className="glass-panel p-5 rounded-xl border border-slate-800 text-center">
            <div className="text-xs text-slate-400 uppercase">Model Accuracy</div>
            <div className="text-2xl font-extrabold text-emerald-400 mt-1">{agent.accuracy}</div>
          </div>
          <div className="glass-panel p-5 rounded-xl border border-slate-800 text-center">
            <div className="text-xs text-slate-400 uppercase">Response Latency</div>
            <div className="text-2xl font-extrabold text-purple-400 mt-1">12.4 ms</div>
          </div>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column (2 cols): Responsibilities & Decision History */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-cyan-400" /> Operational Responsibilities
              </h2>
              <ul className="space-y-2.5 text-xs text-slate-300 font-mono">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" /> Autonomous monitoring of city incident reports & sensor feeds.
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" /> Direct integration with {agent.connectedDept}.
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" /> Real-time parameter recalibration and risk assessment modeling.
                </li>
              </ul>
            </div>

            {/* Decision Activity Feed */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-cyan-400" /> Recent Decision History & Event Logs
                </h3>
                <span className="text-xs text-slate-400 font-mono font-bold">Real-time Stream</span>
              </div>

              <div className="space-y-3">
                {logs.map((log) => (
                  <div key={log.id} className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono space-y-1">
                    <div className="flex items-center justify-between text-cyan-400">
                      <span className="font-bold">{log.action}</span>
                      <span className="text-slate-500">{log.time}</span>
                    </div>
                    <p className="text-slate-300">{log.details}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column (1 col): Future AI Roadmap */}
          <div className="space-y-6">
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" /> Future AI Expansion Roadmap
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Planned enhancements for {agent.name} in upcoming CityMind AI OS updates:
              </p>
              <div className="space-y-2 text-xs font-mono text-slate-300">
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                  <div className="text-cyan-400 font-bold">Phase 1: Deep Vision ML</div>
                  <div className="text-[11px] text-slate-400">Integration with traffic CCTV & satellite thermal imagery.</div>
                </div>
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                  <div className="text-purple-400 font-bold">Phase 2: Predictive Dispatch</div>
                  <div className="text-[11px] text-slate-400">Automated pre-positioning of units 15 minutes before peak hazard windows.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
