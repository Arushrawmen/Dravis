/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * DRAVIS Neural Learning & Continuous Discovery Engine
 * "Try to find out and what have you discovered?"
 */

import React, { useState } from "react";
import { motion } from "motion/react";
import { 
  Brain, 
  Sparkles, 
  ShieldCheck, 
  Search, 
  Compass, 
  Lightbulb, 
  Cpu, 
  CheckCircle2, 
  Zap, 
  Database,
  Lock,
  ArrowRight
} from "lucide-react";
import { MemoryEntry, UserProfile } from "../types";
import { soundEffects } from "../utils/audioSynth";

interface DravisLearningViewProps {
  userProfile: UserProfile;
  memories: MemoryEntry[];
  onSendCommand: (cmd: string) => void;
  soundEffectsEnabled: boolean;
}

export const DravisLearningView: React.FC<DravisLearningViewProps> = ({
  userProfile,
  memories,
  onSendCommand,
  soundEffectsEnabled,
}) => {
  const [activeTab, setActiveTab] = useState<"DISCOVERIES" | "MEMORY_VAULT" | "SECURITY">("DISCOVERIES");
  const [searchQuery, setSearchQuery] = useState("");

  const sampleDiscoveries = [
    {
      id: "disc-1",
      topic: "User Interaction Patterns",
      discovery: "Prefers swift, direct vocal responses and clean holographic HUD layout without visual clutter.",
      confidence: "99.4%",
      category: "Behavioral",
      timestamp: "Today, 10:24 AM",
    },
    {
      id: "disc-2",
      topic: "Android Mobile Optimization",
      discovery: "Liquid Glass UI framework activated with dedicated resolution shifting and bottom gesture controls.",
      confidence: "98.8%",
      category: "Architecture",
      timestamp: "Today, 11:15 AM",
    },
    {
      id: "disc-3",
      topic: "Google Workspace & Play Store Protocol",
      discovery: "Linked account initialized for Android Studio export and Play Console deployment.",
      confidence: "99.9%",
      category: "Authentication",
      timestamp: "Just now",
    },
    {
      id: "disc-4",
      topic: "Child-Safe & Multi-Lingual Nuances",
      discovery: "Hindi and English dual-phonetic speech synthesis active with gentle, articulate conversational tone.",
      confidence: "97.5%",
      category: "Speech Engine",
      timestamp: "Today, 08:30 AM",
    },
  ];

  const handleTriggerDiscovery = (query: string) => {
    if (soundEffectsEnabled) soundEffects.playActivatePulse();
    onSendCommand(query);
  };

  return (
    <div id="dravis-learning-view" className="flex-1 flex flex-col h-full overflow-y-auto p-4 sm:p-6 space-y-6 select-none custom-scrollbar">
      {/* Top Banner: Liquid Glass Header */}
      <div className="relative rounded-2xl sm:rounded-3xl border border-cyan-500/20 bg-gradient-to-r from-cyan-950/40 via-black/60 to-emerald-950/30 p-5 sm:p-6 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-400/40 flex items-center justify-center shadow-[0_0_20px_rgba(34,211,238,0.25)]">
              <Brain className="w-7 h-7 text-cyan-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold font-mono tracking-wider text-white">
                  DRAVIS LEARNING ENGINE
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                  ONLINE
                </span>
              </div>
              <p className="text-xs sm:text-sm text-cyan-200/70 font-mono mt-1">
                Continuous Heuristic Knowledge Acquisition & Autonomous Discovery
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleTriggerDiscovery("Try to find out and what have you discovered?")}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-mono font-bold text-xs flex items-center gap-2 shadow-[0_0_20px_rgba(34,211,238,0.4)] transition-all cursor-pointer active:scale-95"
            >
              <Sparkles className="w-4 h-4" />
              <span>QUERY RECENT DISCOVERIES</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-3">
        {[
          { id: "DISCOVERIES", label: "Autonomous Discoveries", icon: Lightbulb },
          { id: "MEMORY_VAULT", label: "Neural Memory Bank", icon: Database },
          { id: "SECURITY", label: "Safety & Privacy Guardrails", icon: ShieldCheck },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                if (soundEffectsEnabled) soundEffects.playChirp();
                setActiveTab(tab.id as any);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                isActive
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-[0_0_15px_rgba(34,211,238,0.2)]"
                  : "bg-white/5 text-slate-400 hover:text-slate-200 border border-transparent hover:border-white/10"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content 1: DISCOVERIES */}
      {activeTab === "DISCOVERIES" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sampleDiscoveries.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-5 rounded-2xl bg-slate-900/60 border border-white/10 backdrop-blur-xl hover:border-cyan-400/40 transition-all flex flex-col justify-between group shadow-lg"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-400/20">
                      {item.category}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">{item.timestamp}</span>
                  </div>
                  <h3 className="text-sm font-mono font-bold text-white group-hover:text-cyan-300 transition-colors">
                    {item.topic}
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    {item.discovery}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-400">Confidence: <strong className="text-emerald-400">{item.confidence}</strong></span>
                  <button
                    onClick={() => handleTriggerDiscovery(`Tell me more about ${item.topic}`)}
                    className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
                  >
                    <span>Analyze</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Prompt Suggestion Pill */}
          <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/20 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Compass className="w-5 h-5 text-cyan-400 shrink-0" />
              <div className="text-xs font-mono">
                <span className="text-white font-bold">Ask Dravis directly via voice or text: </span>
                <span className="text-cyan-300">"Try to find out and what have you discovered?"</span>
              </div>
            </div>
            <button
              onClick={() => handleTriggerDiscovery("What have you discovered about my preferences today?")}
              className="px-3.5 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 border border-cyan-400/40 text-xs font-mono font-bold cursor-pointer transition-all"
            >
              Ask Now
            </button>
          </div>
        </div>
      )}

      {/* Tab Content 2: MEMORY VAULT */}
      {activeTab === "MEMORY_VAULT" && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/10 backdrop-blur-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-mono font-bold text-white uppercase">
                Long-Term Associative Memory Vault ({memories.length} Entries)
              </span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              AES-256 Encrypted
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {memories.map((mem) => {
              const confPct =
                typeof mem.confidence === "number"
                  ? mem.confidence <= 1
                    ? Math.round(mem.confidence * 100)
                    : Math.round(mem.confidence)
                  : 98;
              return (
                <div
                  key={mem.id}
                  className="p-4 rounded-2xl bg-slate-900/40 border border-white/10 hover:border-cyan-400/30 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-400/20">
                        {mem.category}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {mem.lastUpdated || mem.timestamp || mem.createdAt || "Active"}
                      </span>
                    </div>
                    <h4 className="text-xs font-mono font-bold text-white">{mem.key}</h4>
                    <p className="text-xs text-slate-300 font-sans leading-relaxed">
                      {mem.value || mem.fact}
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span>
                      Confidence: <strong className="text-cyan-300">{confPct}%</strong>
                    </span>
                    <span className="text-emerald-400">{mem.source || "ACTIVE IN BRAIN"}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab Content 3: SECURITY */}
      {activeTab === "SECURITY" && (
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/10 backdrop-blur-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-mono font-bold text-white">
                  Autonomous Privacy & Guardrails Architecture
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  Dravis operates under strict local security protocols and data sovereignty
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold">Local Edge Memory</span>
                <p className="text-xs text-slate-300 font-sans">
                  Zero telemetry leak. Learned user traits remain on client storage.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold">Child Safe Mode</span>
                <p className="text-xs text-slate-300 font-sans">
                  {userProfile.kidsFriendlyMode ? "Active: Explicit filter enabled." : "Standard: Unfiltered engineering mode."}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                <span className="text-[10px] font-mono text-amber-400 uppercase font-bold">Offline Neural Heuristics</span>
                <p className="text-xs text-slate-300 font-sans">
                  Fail-safe fallback operates without active cloud API connection.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
