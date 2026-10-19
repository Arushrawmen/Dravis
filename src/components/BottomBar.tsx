/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Bottom Holographic System Pods & Status Nodes Bar
 */

import React from "react";
import {
  Database,
  BrainCircuit,
  Cpu,
  Bot,
  Wifi,
  ShieldCheck,
  Mail,
} from "lucide-react";
import { NavigationTab } from "../types";
import { soundEffects } from "../utils/audioSynth";

interface BottomBarProps {
  onSelectTab: (tab: NavigationTab) => void;
  soundEffectsEnabled: boolean;
  learningModeActive: boolean;
  autonomousModeActive: boolean;
}

export const BottomBar: React.FC<BottomBarProps> = ({
  onSelectTab,
  soundEffectsEnabled,
  learningModeActive,
  autonomousModeActive,
}) => {
  const nodes = [
    {
      id: "node-memory",
      title: "MEMORY BANK",
      status: "Active",
      icon: Database,
      tab: "HISTORY" as NavigationTab,
      activeColor: "text-emerald-400",
      dotColor: "bg-emerald-400 shadow-[0_0_8px_#34D399]",
    },
    {
      id: "node-learning",
      title: "LEARNING MODE",
      status: learningModeActive ? "Enabled" : "Paused",
      icon: BrainCircuit,
      tab: "SETTINGS" as NavigationTab,
      activeColor: "text-cyan-300",
      dotColor: "bg-cyan-400 shadow-[0_0_8px_#00E5FF]",
    },
    {
      id: "node-deeplearning",
      title: "DEEP LEARNING",
      status: "Active",
      icon: Cpu,
      tab: "SKILLS" as NavigationTab,
      activeColor: "text-emerald-400",
      dotColor: "bg-emerald-400 shadow-[0_0_8px_#34D399]",
    },
    {
      id: "node-autonomous",
      title: "AUTONOMOUS MODE",
      status: autonomousModeActive ? "Ready" : "Standby",
      icon: Bot,
      tab: "AUTOMATION" as NavigationTab,
      activeColor: "text-cyan-300",
      dotColor: "bg-cyan-400 shadow-[0_0_8px_#00E5FF]",
    },
    {
      id: "node-internet",
      title: "INTERNET ACCESS",
      status: "Connected",
      icon: Wifi,
      tab: "PLUGINS" as NavigationTab,
      activeColor: "text-emerald-400",
      dotColor: "bg-emerald-400 shadow-[0_0_8px_#34D399]",
    },
    {
      id: "node-secure",
      title: "DATA SECURE",
      status: "Encrypted",
      icon: ShieldCheck,
      tab: "SYSTEM" as NavigationTab,
      activeColor: "text-emerald-400",
      dotColor: "bg-emerald-400 shadow-[0_0_8px_#34D399]",
    },
    {
      id: "node-gmail",
      title: "GMAIL HUB",
      status: "OAuth Ready",
      icon: Mail,
      tab: "GMAIL" as NavigationTab,
      activeColor: "text-red-400",
      dotColor: "bg-red-400 shadow-[0_0_8px_#EF4444]",
    },
  ];

  return (
    <footer 
      id="dravis-bottom-status-bar"
      className="relative z-20 w-full bg-slate-950/30 border-t border-white/15 backdrop-blur-xl px-3 py-2 flex items-center justify-between gap-2 overflow-x-auto select-none"
    >
      <div className="flex items-center justify-between w-full max-w-7xl mx-auto gap-2 sm:gap-4">
        {nodes.map((node) => {
          const Icon = node.icon;
          return (
            <div
              key={node.id}
              onClick={() => {
                if (soundEffectsEnabled) soundEffects.playChirp();
                onSelectTab(node.tab);
              }}
              className="flex-1 min-w-[130px] flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-cyan-400/40 transition-all cursor-pointer group backdrop-blur-sm"
            >
              {/* Icon */}
              <div className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-cyan-400 group-hover:text-white transition-colors">
                <Icon className="w-3.5 h-3.5" />
              </div>

              {/* Label & Status */}
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-[9px] font-mono font-bold tracking-wider text-slate-400 group-hover:text-slate-200 truncate uppercase">
                  {node.title}
                </span>
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-mono font-semibold ${node.activeColor}`}>
                    {node.status}
                  </span>
                  <span className={`w-1.5 h-1.5 rounded-full ${node.dotColor}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </footer>
  );
};
