'use client';

import React from 'react';
import Link from 'next/link';
import { RoleGuard } from '@/components/layout/RoleGuard';
import { AGENT_REGISTRY } from '@/data/agents';
import { Cpu, ArrowRight } from 'lucide-react';

export default function AgentCenterPage() {
  return (
    <RoleGuard>
      <div className="flex-1 p-6 space-y-8 max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="glass-panel p-6 rounded-2xl border border-cyan-500/30">
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono font-bold uppercase tracking-widest mb-1">
            <Cpu className="w-4 h-4" /> Autonomous Intelligence Layer
          </div>
          <h1 className="text-2xl font-extrabold text-white">Ashmora AI Agent Center</h1>
          <p className="text-sm text-slate-400 mt-1">
            Explore and monitor the 13 specialized AI agents powering Ashmora Smart City Operating System.
          </p>
        </div>

        {/* Agent Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {AGENT_REGISTRY.map((agent) => (
            <div
              key={agent.id}
              className={`glass-panel p-6 rounded-2xl border bg-gradient-to-br ${agent.color} flex flex-col justify-between space-y-4 hover:scale-[1.02] transition-all group`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-700 shadow-md">
                    {agent.icon}
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-slate-950 text-cyan-400 border border-cyan-800 uppercase tracking-wider">
                    {agent.category}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-extrabold text-white group-hover:text-cyan-300 transition">{agent.name}</h3>
                  <p className="text-xs text-slate-300 mt-2 leading-relaxed">{agent.description}</p>
                </div>
              </div>

              <div className="space-y-3 pt-3 border-t border-slate-800/80">
                <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                  <span>Connected Dept:</span>
                  <span className="text-slate-200 font-semibold text-right">{agent.connectedDept}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-800 text-center">
                    <span className="text-slate-400 text-[10px]">Tasks Today</span>
                    <div className="text-sm font-bold text-cyan-400">{agent.tasksToday}</div>
                  </div>
                  <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-800 text-center">
                    <span className="text-slate-400 text-[10px]">Accuracy</span>
                    <div className="text-sm font-bold text-emerald-400">{agent.accuracy}</div>
                  </div>
                </div>

                <Link
                  href={`/agents/${agent.id}`}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-cyan-400 hover:text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 border border-slate-700 transition"
                >
                  Inspect Agent Workspace <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </RoleGuard>
  );
}
