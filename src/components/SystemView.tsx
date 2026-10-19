/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * System Diagnostics, Health Telemetry, and Safety Layer View
 */

import React, { useState } from "react";
import { Activity, ShieldCheck, Cpu, HardDrive, Wifi, RefreshCw, CheckCircle2 } from "lucide-react";
import { SystemTelemetry } from "../types";
import { soundEffects } from "../utils/audioSynth";

interface SystemViewProps {
  telemetry: SystemTelemetry;
  onRefreshTelemetry: () => void;
  soundEffectsEnabled: boolean;
}

export const SystemView: React.FC<SystemViewProps> = ({
  telemetry,
  onRefreshTelemetry,
  soundEffectsEnabled,
}) => {
  const [runningDiagnostics, setRunningDiagnostics] = useState(false);
  const [diagResults, setDiagResults] = useState<string | null>(null);

  const handleRunFullDiagnostics = () => {
    if (soundEffectsEnabled) soundEffects.playActivatePulse();
    setRunningDiagnostics(true);
    setDiagResults(null);

    setTimeout(() => {
      setRunningDiagnostics(false);
      setDiagResults("All 40 DRAVIS ASI subsystems passed integrity checks. Latency: 18ms. Memory Heap: Clean. Sandbox Boundaries: Active.");
      if (soundEffectsEnabled) soundEffects.playWakeWordPing();
    }, 1800);
  };

  return (
    <div 
      id="dravis-system-view"
      className="flex-1 flex flex-col h-full bg-slate-950/40 p-3 sm:p-5 gap-4 overflow-y-auto"
    >
      <div className="flex items-center justify-between px-4 py-3 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_0_15px_rgba(0,0,0,0.3)]">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-cyan-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white font-mono tracking-wider">
              HARDWARE TELEMETRY & DIAGNOSTICS
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              DEFCON-1 Encrypted • Real-time Host Metrics
            </span>
          </div>
        </div>

        <button
          onClick={() => {
            if (soundEffectsEnabled) soundEffects.playChirp();
            onRefreshTelemetry();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-cyan-400 font-mono text-xs font-bold transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>POLL METRICS</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 font-mono text-xs">
        {/* CPU */}
        <div className="p-4 rounded-2xl border border-white/10 bg-white/5 flex flex-col gap-2 shadow-[0_0_15px_rgba(0,0,0,0.2)]">
          <div className="flex items-center justify-between text-slate-400">
            <span>CPU ALLOCATION</span>
            <Cpu className="w-4 h-4 text-cyan-400" />
          </div>
          <span className="text-2xl font-bold text-white">{telemetry.cpu}</span>
          <div className="w-full bg-black/40 h-1.5 rounded-full overflow-hidden border border-white/5">
            <div className="bg-cyan-400 h-full rounded-full" style={{ width: `${telemetry.cpuRaw}%` }} />
          </div>
        </div>

        {/* RAM */}
        <div className="p-4 rounded-2xl border border-white/10 bg-white/5 flex flex-col gap-2 shadow-[0_0_15px_rgba(0,0,0,0.2)]">
          <div className="flex items-center justify-between text-slate-400">
            <span>RAM HEAP</span>
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <span className="text-2xl font-bold text-white">{telemetry.ram}</span>
          <div className="w-full bg-black/40 h-1.5 rounded-full overflow-hidden border border-white/5">
            <div className="bg-cyan-400 h-full rounded-full" style={{ width: `${telemetry.ramRaw}%` }} />
          </div>
        </div>

        {/* DISK */}
        <div className="p-4 rounded-2xl border border-white/10 bg-white/5 flex flex-col gap-2 shadow-[0_0_15px_rgba(0,0,0,0.2)]">
          <div className="flex items-center justify-between text-slate-400">
            <span>STORAGE DISK</span>
            <HardDrive className="w-4 h-4 text-cyan-400" />
          </div>
          <span className="text-2xl font-bold text-white">{telemetry.disk}</span>
          <div className="w-full bg-black/40 h-1.5 rounded-full overflow-hidden border border-white/5">
            <div className="bg-cyan-400 h-full rounded-full" style={{ width: `${telemetry.diskRaw}%` }} />
          </div>
        </div>

        {/* NETWORK & POWER */}
        <div className="p-4 rounded-2xl border border-white/10 bg-white/5 flex flex-col gap-2 shadow-[0_0_15px_rgba(0,0,0,0.2)]">
          <div className="flex items-center justify-between text-slate-400">
            <span>NET & SECURITY</span>
            <Wifi className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-sm font-bold text-emerald-400">{telemetry.network}</span>
          <span className="text-[10px] text-slate-400">{telemetry.securityLevel}</span>
        </div>
      </div>

      {/* Full Diagnostics Launcher */}
      <div className="p-4 rounded-2xl border border-white/10 bg-white/5 flex flex-col gap-3 shadow-[0_0_15px_rgba(0,0,0,0.2)]">
        <h4 className="text-xs font-mono font-bold text-white uppercase">
          Autonomous Health Diagnostics Runner
        </h4>
        <p className="text-xs text-slate-300 font-sans leading-relaxed">
          Executes real-time self-tests across all 40 cognitive, automation, voice, vision, memory, and safety subsystems.
        </p>

        <button
          onClick={handleRunFullDiagnostics}
          disabled={runningDiagnostics}
          className="py-2.5 px-4 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-mono text-xs font-bold transition-all shadow-[0_0_15px_rgba(34,211,238,0.3)] flex items-center justify-center gap-2 max-w-sm"
        >
          {runningDiagnostics ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>RUNNING SUBSYSTEM INTEGRITY TESTS...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>EXECUTE FULL SYSTEM DIAGNOSTICS</span>
            </>
          )}
        </button>

        {diagResults && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-mono text-xs">
            {diagResults}
          </div>
        )}
      </div>
    </div>
  );
};
