/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * PC Control, Workflows, and Desktop Automation View
 */

import React, { useState } from "react";
import { Workflow, Play, Plus, Clock, Terminal, CheckCircle2, Shield } from "lucide-react";
import { AutomationWorkflow } from "../types";
import { soundEffects } from "../utils/audioSynth";

interface AutomationViewProps {
  workflows: AutomationWorkflow[];
  onRunWorkflow: (wf: AutomationWorkflow) => void;
  soundEffectsEnabled: boolean;
}

export const AutomationView: React.FC<AutomationViewProps> = ({
  workflows,
  onRunWorkflow,
  soundEffectsEnabled,
}) => {
  const [runningId, setRunningId] = useState<string | null>(null);

  const handleRun = (wf: AutomationWorkflow) => {
    if (soundEffectsEnabled) soundEffects.playActivatePulse();
    setRunningId(wf.id);
    onRunWorkflow(wf);
    setTimeout(() => {
      setRunningId(null);
    }, 2000);
  };

  return (
    <div 
      id="dravis-automation-view"
      className="flex-1 flex flex-col h-full bg-slate-950/40 p-3 sm:p-5 gap-4 overflow-y-auto"
    >
      <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_0_15px_rgba(0,0,0,0.3)]">
        <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-cyan-400">
          <Workflow className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm sm:text-base font-bold text-white font-mono tracking-wider">
            AUTONOMOUS WORKFLOWS & PC CONTROLLER
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            Voice Triggers • Cron Scheduler • Desktop Macro Executor
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {workflows.map((wf) => {
          const isExecuting = runningId === wf.id;

          return (
            <div
              key={wf.id}
              className="p-4 rounded-2xl border border-white/10 bg-white/5 hover:border-white/20 transition-all flex flex-col justify-between gap-3 shadow-[0_0_15px_rgba(0,0,0,0.2)]"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="text-xs font-bold text-white font-mono">{wf.name}</h4>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] font-mono text-cyan-400 font-bold">
                      {wf.trigger} TRIGGER
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 truncate">
                      {wf.triggerDetail}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleRun(wf)}
                  disabled={isExecuting}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-xs font-bold border transition-all ${
                    isExecuting
                      ? "bg-emerald-500/20 border-emerald-400 text-emerald-300 animate-pulse"
                      : "bg-cyan-400 hover:bg-cyan-300 text-slate-950 shadow-[0_0_12px_rgba(34,211,238,0.3)] border-transparent"
                  }`}
                >
                  {isExecuting ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>EXECUTING...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" />
                      <span>RUN</span>
                    </>
                  )}
                </button>
              </div>

              {/* Action steps list */}
              <div className="space-y-1.5 bg-black/40 p-2.5 rounded-xl border border-white/5">
                <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">
                  Action Steps Sequence:
                </span>
                {wf.actions.map((act, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-slate-300 font-sans">
                    <span className="w-4 h-4 rounded-md bg-white/5 text-cyan-400 font-mono text-[9px] flex items-center justify-center flex-shrink-0 border border-white/10">
                      {i + 1}
                    </span>
                    <span className="truncate">{act}</span>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span>Last executed: <span className="text-slate-200">{wf.lastRun || "Never"}</span></span>
                <span className="text-emerald-400">Sandbox Verified</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
