/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Left Navigation Sidebar with Voice & System Telemetry
 */

import React from "react";
import { motion } from "motion/react";
import {
  Home,
  Bot,
  Mail,
  HardDrive,
  Calendar,
  Users,
  MapPin,
  History,
  User,
  Settings,
  Puzzle,
  Cpu,
  Workflow,
  FolderKanban,
  Activity,
  Sparkles,
  ShieldCheck,
  Palette,
  Brain,
  Compass,
  Code2,
} from "lucide-react";
import { NavigationTab, VoiceState, SystemTelemetry } from "../types";
import { soundEffects } from "../utils/audioSynth";

interface LeftSidebarProps {
  activeTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  voiceState: VoiceState;
  telemetry: SystemTelemetry;
  soundEffectsEnabled: boolean;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  activeTab,
  onSelectTab,
  voiceState,
  telemetry,
  soundEffectsEnabled,
}) => {
  const navItems: { id: NavigationTab; label: string; icon: React.FC<any> }[] = [
    { id: "HOME", label: "HOME", icon: Home },
    { id: "DRAVIS", label: "DRAVIS", icon: Bot },
    { id: "CODEX", label: "DRAVIS WORKSPACE", icon: Code2 },
    { id: "MICRO_DECISION", label: "MICRO-DECISION", icon: Compass },
    { id: "GMAIL", label: "GMAIL", icon: Mail },
    { id: "DRIVE", label: "G-DRIVE", icon: HardDrive },
    { id: "CALENDAR", label: "CALENDAR", icon: Calendar },
    { id: "CONTACTS", label: "CONTACTS", icon: Users },
    { id: "MAPS", label: "G-MAPS", icon: MapPin },
    { id: "LEARNING", label: "LEARNING", icon: Brain },
    { id: "SUPERVISION", label: "SUPERVISION", icon: ShieldCheck },
    { id: "HISTORY", label: "HISTORY", icon: History },
    { id: "PROFILE", label: "PROFILE", icon: User },
    { id: "SETTINGS", label: "SETTINGS", icon: Settings },
    { id: "PLUGINS", label: "PLUGINS", icon: Puzzle },
    { id: "SKILLS", label: "SKILLS", icon: Cpu },
    { id: "AUTOMATION", label: "AUTOMATION", icon: Workflow },
    { id: "FILES", label: "FILES", icon: FolderKanban },
    { id: "SYSTEM", label: "SYSTEM", icon: Activity },
  ];

  const handleNav = (tab: NavigationTab) => {
    if (soundEffectsEnabled) {
      soundEffects.playChirp();
    }
    onSelectTab(tab);
  };

  const isSpeaking = voiceState === "SPEAKING";
  const isListening = voiceState === "LISTENING";
  const isThinking = voiceState === "THINKING";

  return (
    <aside
      id="dravis-left-sidebar"
      className="group/sidebar relative z-30 flex flex-col w-16 hover:w-64 transition-all duration-300 ease-out h-full bg-slate-950/65 hover:bg-slate-950/90 border-r border-white/15 backdrop-blur-2xl p-2 hover:p-3 select-none justify-between overflow-y-auto overflow-x-hidden shrink-0 shadow-[4px_0_24px_rgba(0,0,0,0.45)]"
    >
      {/* Top Section: Core Modules Navigation Links (Expands smoothly on cursor hover) */}
      <nav className="flex flex-col gap-1">
        <div className="px-2 py-1.5 mb-1 flex items-center gap-2 overflow-hidden whitespace-nowrap border-b border-white/10">
          <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0 shadow-[0_0_8px_rgba(34,211,238,0.9)]" />
          <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200">
            Core Modules
          </span>
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              id={`nav-btn-${item.id.toLowerCase()}`}
              onClick={() => handleNav(item.id)}
              title={item.label}
              className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl font-mono text-xs font-semibold tracking-wider transition-all duration-200 text-left group whitespace-nowrap overflow-hidden ${
                isActive
                  ? "bg-cyan-500/20 text-white border border-cyan-400/50 shadow-[0_0_12px_rgba(34,211,238,0.25)]"
                  : "text-slate-400 hover:text-slate-100 hover:bg-white/10 border border-transparent"
              }`}
            >
              {/* Active neon highlight indicator */}
              {isActive && (
                <motion.div
                  layoutId="active-indicator"
                  className="absolute left-0 inset-y-1.5 w-1 rounded-r-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]"
                />
              )}

              <Icon
                className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                  isActive
                    ? "text-cyan-400 drop-shadow-[0_0_6px_rgba(34,211,238,0.8)]"
                    : "text-slate-400 group-hover:text-cyan-300"
                }`}
              />

              <span className="opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200 truncate">
                {item.label}
              </span>

              {/* Status pulse dot for active */}
              {isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0 opacity-0 group-hover/sidebar:opacity-100 shadow-[0_0_6px_rgba(34,211,238,0.8)]" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Section: Voice Status and System Status (Visible when sidebar is expanded on hover) */}
      <div className="hidden group-hover/sidebar:flex flex-col gap-3 mt-4 pt-3 border-t border-white/10 animate-fadeIn">
        {/* 1. Section 16: VOICE STATUS Box */}
        <div
          id="hud-voice-status-box"
          className="rounded-2xl border border-white/10 bg-white/5 p-3 flex flex-col gap-2 backdrop-blur-md shadow-[0_0_15px_rgba(0,0,0,0.3)]"
        >
          <div className="flex items-center justify-between pb-1 border-b border-white/10">
            <span className="text-[11px] font-mono font-bold text-cyan-400 uppercase tracking-widest">
              VOICE STATUS
            </span>
            <span
              className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md ${
                isListening
                  ? "bg-emerald-500/20 text-emerald-400"
                  : isSpeaking
                  ? "bg-cyan-500/20 text-cyan-400"
                  : isThinking
                  ? "bg-purple-500/20 text-purple-300"
                  : "bg-slate-500/20 text-slate-400"
              }`}
            >
              {isListening
                ? "Listening..."
                : isSpeaking
                ? "Speaking..."
                : isThinking
                ? "Processing..."
                : "Idle"}
            </span>
          </div>

          {/* Animated dynamic soundwave */}
          <div className="flex items-center justify-center gap-0.5 h-6 py-1">
            {Array.from({ length: 24 }).map((_, i) => (
              <motion.div
                key={i}
                className={`w-0.5 rounded-full ${
                  isSpeaking
                    ? "bg-cyan-400 shadow-[0_0_4px_rgba(34,211,238,0.8)]"
                    : isListening
                    ? "bg-emerald-400 shadow-[0_0_4px_rgba(52,211,153,0.8)]"
                    : isThinking
                    ? "bg-purple-400 shadow-[0_0_4px_rgba(192,132,252,0.8)]"
                    : "bg-white/10"
                }`}
                animate={
                  isSpeaking
                    ? { height: [3, Math.sin(i * 0.6) * 18 + 5, 3] }
                    : isListening
                    ? { height: [2, Math.cos(i * 0.8) * 14 + 4, 2] }
                    : isThinking
                    ? { height: [2, 10, 2] }
                    : { height: 3 }
                }
                transition={{
                  repeat: Infinity,
                  duration: isSpeaking ? 0.4 : isListening ? 0.6 : 1.5,
                  delay: i * 0.02,
                }}
              />
            ))}
          </div>
        </div>

        {/* 2. Section 17: SYSTEM STATUS Box */}
        <div
          id="hud-system-status-box"
          className="rounded-2xl border border-white/10 bg-white/5 p-3 flex flex-col gap-2.5 backdrop-blur-md shadow-[0_0_15px_rgba(0,0,0,0.3)]"
        >
          <div className="flex items-center justify-between pb-1 border-b border-white/10">
            <span className="text-[11px] font-mono font-bold text-cyan-400 uppercase tracking-widest">
              SYSTEM STATUS
            </span>
            <span className="text-[9px] font-mono text-emerald-400 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              HEALTHY
            </span>
          </div>

          <div className="space-y-2.5 font-mono text-[10px]">
            {/* CPU */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-400 uppercase">CPU</span>
                <span className="text-white font-bold">{telemetry.cpu}</span>
              </div>
              <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-cyan-400 rounded-full transition-all duration-500"
                  style={{ width: `${telemetry.cpuRaw}%` }}
                />
              </div>
            </div>

            {/* RAM */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-400 uppercase">RAM</span>
                <span className="text-white font-bold">{telemetry.ram}</span>
              </div>
              <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-400 rounded-full transition-all duration-500"
                  style={{ width: `${telemetry.ramRaw}%` }}
                />
              </div>
            </div>

            {/* DISK & NETWORK */}
            <div className="flex items-center justify-between text-[9px] text-slate-400 pt-1 border-t border-white/5">
              <span>
                DISK: <strong className="text-slate-200">{telemetry.disk}</strong>
              </span>
              <span>
                NETWORK:{" "}
                <strong className="text-emerald-400">{telemetry.network.split(" ")[0]}</strong>
              </span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
