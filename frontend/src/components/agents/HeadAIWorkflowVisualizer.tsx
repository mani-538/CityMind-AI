'use client';

import React, { useState } from 'react';
import { Cpu, Shield, Flame, Navigation, AlertOctagon, HeartPulse, Zap, Users, BarChart3, CheckCircle, ArrowRight, Play, Layers } from 'lucide-react';

interface VisualizerProps {
  complaintTitle: string;
  category: string;
  priority: string;
  aiSummary?: string;
  recommendedAction?: string;
}

interface AgentStep {
  id: string;
  name: string;
  role: string;
  icon: React.ReactNode;
  color: string;
  action: string;
  status: 'Completed' | 'Active' | 'Queued';
}

export const HeadAIWorkflowVisualizer: React.FC<VisualizerProps> = ({
  complaintTitle,
  category,
  priority,
  aiSummary,
  recommendedAction,
}) => {
  const [activeTab, setActiveTab] = useState<'diagram' | 'agents' | 'decision'>('diagram');
  const [simulating, setSimulating] = useState(false);
  const [simStep, setSimStep] = useState(4);

  const steps: AgentStep[] = [
    {
      id: 'agent-1',
      name: 'Complaint Agent',
      role: 'Incident Classification & Risk Scoring',
      icon: <Layers className="w-5 h-5" />,
      color: 'from-blue-500 to-cyan-500',
      action: `Analyzed '${category}' report. Assigned Priority: ${priority}. Confidence: 98%.`,
      status: 'Completed',
    },
    {
      id: 'agent-2',
      name: 'Head AI Agent (Orchestrator)',
      role: 'Multi-Agency Tactical Coordinator',
      icon: <Cpu className="w-5 h-5" />,
      color: 'from-cyan-500 to-indigo-600',
      action: aiSummary || 'Evaluated spatial impact radius. Triggered multi-agent emergency protocol.',
      status: 'Completed',
    },
    {
      id: 'agent-3',
      name: 'Fire & Rescue Agent',
      role: 'Emergency Team & Unit Dispatch',
      icon: <Flame className="w-5 h-5" />,
      color: 'from-orange-500 to-red-600',
      action: recommendedAction || 'DISPATCH PROTOCOL ALPHA: Deployed 2 Pumper Units. Perimeter established.',
      status: 'Completed',
    },
    {
      id: 'agent-4',
      name: 'Traffic Control Agent',
      role: 'Green Corridor Signal Override',
      icon: <Navigation className="w-5 h-5" />,
      color: 'from-emerald-500 to-teal-600',
      action: 'GREEN CORRIDOR ACTIVATED: Override traffic light signals along emergency route.',
      status: simStep >= 4 ? 'Completed' : 'Active',
    },
    {
      id: 'agent-5',
      name: 'Police Security Agent',
      role: 'Perimeter Blockade & Crowd Safety',
      icon: <AlertOctagon className="w-5 h-5" />,
      color: 'from-amber-500 to-yellow-600',
      action: 'Established 150m perimeter blockade around incident coordinates.',
      status: simStep >= 5 ? 'Completed' : 'Queued',
    },
    {
      id: 'agent-6',
      name: 'Hospital & EMS Agent',
      role: 'ICU Standby & Evacuation Route',
      icon: <HeartPulse className="w-5 h-5" />,
      color: 'from-rose-500 to-pink-600',
      action: 'Alerted Ashmora City Hospital Trauma Unit. ICU bay prepared.',
      status: simStep >= 6 ? 'Completed' : 'Queued',
    },
    {
      id: 'agent-7',
      name: 'Electricity & Grid Agent',
      role: 'Power Cutoff & Grid Isolation',
      icon: <Zap className="w-5 h-5" />,
      color: 'from-yellow-400 to-amber-500',
      action: 'Isolated power grid section #402 to eliminate electrical ignition hazard.',
      status: simStep >= 7 ? 'Completed' : 'Queued',
    },
    {
      id: 'agent-8',
      name: 'Citizen Warning Agent',
      role: 'Geo-Fenced Broadcast Notification',
      icon: <Users className="w-5 h-5" />,
      color: 'from-purple-500 to-violet-600',
      action: 'Dispatched SMS and App emergency broadcast to citizens within 500m radius.',
      status: simStep >= 8 ? 'Completed' : 'Queued',
    },
    {
      id: 'agent-9',
      name: 'City Analytics Agent',
      role: 'Real-time KPI & Heatmap Sync',
      icon: <BarChart3 className="w-5 h-5" />,
      color: 'from-teal-500 to-emerald-600',
      action: 'Updated Municipal Operating Dashboard & Live GIS Incident Heatmaps.',
      status: simStep >= 9 ? 'Completed' : 'Queued',
    },
  ];

  const runSimulation = () => {
    setSimulating(true);
    setSimStep(1);
    let stepCount = 1;
    const interval = setInterval(() => {
      stepCount++;
      setSimStep(stepCount);
      if (stepCount >= 9) {
        clearInterval(interval);
        setSimulating(false);
      }
    }, 600);
  };

  return (
    <div className="glass-panel p-6 rounded-2xl border border-cyan-500/30 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs font-bold uppercase tracking-wider mb-1">
            <Cpu className="w-4 h-4" /> Head AI Agent Workflow Engine
          </div>
          <h2 className="text-lg font-bold text-white">Multi-Agent Incident Orchestration Diagram</h2>
        </div>

        <button
          onClick={runSimulation}
          disabled={simulating}
          className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition disabled:opacity-50 shadow-md shadow-cyan-900/40"
        >
          <Play className="w-3.5 h-3.5 fill-current" /> {simulating ? 'Simulating Workflow...' : 'Replay Agent Orchestration'}
        </button>
      </div>

      {/* Mode Tabs */}
      <div className="flex gap-2 bg-slate-900/80 p-1 rounded-xl border border-slate-800 max-w-md text-xs">
        <button
          onClick={() => setActiveTab('diagram')}
          className={`flex-1 py-1.5 font-bold rounded-lg transition ${activeTab === 'diagram' ? 'bg-cyan-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'}`}
        >
          Visual Flow Diagram
        </button>
        <button
          onClick={() => setActiveTab('agents')}
          className={`flex-1 py-1.5 font-bold rounded-lg transition ${activeTab === 'agents' ? 'bg-cyan-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'}`}
        >
          Connected Agents ({steps.length})
        </button>
        <button
          onClick={() => setActiveTab('decision')}
          className={`flex-1 py-1.5 font-bold rounded-lg transition ${activeTab === 'decision' ? 'bg-cyan-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'}`}
        >
          Head AI Decision Logic
        </button>
      </div>

      {/* Tab 1: Flow Diagram */}
      {activeTab === 'diagram' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-xs font-mono text-slate-300">
            <span className="text-cyan-400 font-bold">Orchestration Target:</span> {complaintTitle} — <span className="text-amber-400 font-bold">{priority} Priority</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`p-4 rounded-xl border transition relative overflow-hidden flex flex-col justify-between ${
                  step.status === 'Completed'
                    ? 'bg-slate-900/90 border-cyan-500/50 shadow-lg shadow-cyan-950/30'
                    : step.status === 'Active'
                    ? 'bg-cyan-950/40 border-cyan-400 animate-pulse'
                    : 'bg-slate-950/50 border-slate-800 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-9 h-9 rounded-lg bg-gradient-to-tr ${step.color} flex items-center justify-center text-white font-bold shadow`}>
                    {step.icon}
                  </div>
                  <span className="text-[10px] font-mono font-bold text-slate-400">Step 0{index + 1}</span>
                </div>

                <div className="space-y-1 mb-3">
                  <div className="text-sm font-bold text-white">{step.name}</div>
                  <div className="text-[11px] text-cyan-400 font-mono">{step.role}</div>
                  <p className="text-xs text-slate-300 mt-2 line-clamp-3 font-sans leading-relaxed">{step.action}</p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[10px] font-mono">
                  <span className={step.status === 'Completed' ? 'text-emerald-400 font-bold flex items-center gap-1' : 'text-slate-500'}>
                    {step.status === 'Completed' && <CheckCircle className="w-3 h-3" />} {step.status}
                  </span>
                  {index < steps.length - 1 && <ArrowRight className="w-3 h-3 text-slate-600 hidden md:block" />}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Connected Agents List */}
      {activeTab === 'agents' && (
        <div className="space-y-3">
          {steps.map((agent) => (
            <div key={agent.id} className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${agent.color} flex items-center justify-center text-white font-bold`}>
                  {agent.icon}
                </div>
                <div>
                  <div className="text-sm font-bold text-white">{agent.name}</div>
                  <div className="text-xs text-slate-400">{agent.role}</div>
                </div>
              </div>
              <span className="text-xs font-mono px-3 py-1 rounded-full bg-slate-950 text-cyan-400 border border-cyan-800">
                ACTIVE PIPELINE
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: Decision Logic */}
      {activeTab === 'decision' && (
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4 text-xs font-mono">
          <div className="text-cyan-400 font-bold uppercase tracking-wider">Head AI Decision Engine Rule Set</div>
          <div className="space-y-2 text-slate-300 leading-relaxed">
            <div><strong className="text-white">Rule 1 (Severity Filter):</strong> IF Priority == Critical OR Category == Fire Hazard THEN Trigger Immediate Multi-Agency Dispatch.</div>
            <div><strong className="text-white">Rule 2 (Corridor Creation):</strong> IF Pumper Units Dispatched THEN Signal Traffic Agent to lock Green Corridor along route.</div>
            <div><strong className="text-white">Rule 3 (Public Safety):</strong> IF Hazard Radius &gt; 100m THEN Broadcast SMS warning to Citizen Agent pipeline.</div>
            <div><strong className="text-white">Rule 4 (Grid Safety):</strong> IF Chemical/Electrical Fire THEN Order Power Grid Isolation Agent to cut sector electricity.</div>
          </div>
        </div>
      )}
    </div>
  );
};
