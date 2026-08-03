'use client';

import React from 'react';
import Link from 'next/link';
import { Shield, Cpu, Activity, MapPin, Flame, Navigation, Users, ArrowRight, Zap, CheckCircle } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex-1 flex flex-col">
      {/* Hero Section */}
      <section className="relative py-24 px-6 max-w-7xl mx-auto text-center flex flex-col items-center justify-center overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-panel border border-cyan-500/30 text-cyan-400 text-xs font-mono font-medium mb-8">
          <Zap className="w-3.5 h-3.5" /> Ashmora Agentic AI Smart City Engine
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-6 max-w-4xl leading-tight">
          One City. One Intelligence.{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-teal-300">
            Infinite Possibilities.
          </span>
        </h1>

        <p className="text-lg md:text-xl text-slate-400 max-w-2xl mb-10 leading-relaxed">
          CityMind AI connects citizens, municipal departments, and autonomous AI agents in real time to coordinate emergency responses, optimize traffic corridors, and resolve urban issues automatically.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/citizen"
            className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-xl shadow-xl shadow-cyan-900/40 flex items-center gap-3 transition transform hover:-translate-y-0.5"
          >
            Report an Incident <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            href="/map"
            className="px-8 py-4 glass-panel border border-slate-700 hover:border-cyan-500 text-slate-200 font-semibold rounded-xl flex items-center gap-3 transition"
          >
            <MapPin className="w-5 h-5 text-cyan-400" /> Explore Live City Map
          </Link>
          <Link
            href="/government"
            className="px-8 py-4 glass-panel border border-amber-500/30 hover:border-amber-500 text-amber-400 font-semibold rounded-xl flex items-center gap-3 transition"
          >
            <Shield className="w-5 h-5" /> Gov Command Center
          </Link>
        </div>
      </section>

      {/* Autonomous AI Agents Grid */}
      <section className="py-16 px-6 max-w-7xl mx-auto w-full">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-3">Multi-Agent AI Ecosystem</h2>
          <p className="text-slate-400">Isolated, intelligent agents working in synergy to govern municipal operations.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card p-6 rounded-2xl relative overflow-hidden group hover:border-cyan-500/50 transition">
            <div className="w-12 h-12 rounded-xl bg-cyan-950 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-4 font-bold text-xl">
              <Cpu />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Head Agent (Orchestrator)</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Synthesizes real-time city data, delegating priority complaints and critical emergency alerts to specialized agent modules.
            </p>
          </div>

          <div className="glass-card p-6 rounded-2xl relative overflow-hidden group hover:border-rose-500/50 transition">
            <div className="w-12 h-12 rounded-xl bg-rose-950 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-4 font-bold text-xl">
              <Flame />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Fire & Emergency Agent</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Analyzes thermal/hazard reports, calculates emergency severity, and alerts nearest fire stations and hospitals instantly.
            </p>
          </div>

          <div className="glass-card p-6 rounded-2xl relative overflow-hidden group hover:border-amber-500/50 transition">
            <div className="w-12 h-12 rounded-xl bg-amber-950 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4 font-bold text-xl">
              <Navigation />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Traffic Corridor Agent</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Detects road blockages, dynamically plans green corridors for emergency vehicles, and suggests alternate citizen rerouting.
            </p>
          </div>
        </div>
      </section>

      {/* Footer Branding */}
      <footer className="mt-auto border-t border-slate-800 py-8 px-6 text-center text-sm text-slate-500">
        <p className="font-mono text-cyan-500 mb-1">Ashmora — Building the Intelligence Behind Tomorrow.</p>
        <p>© 2026 Ashmora Technologies Inc. CityMind AI MVP. All rights reserved.</p>
      </footer>
    </div>
  );
}
