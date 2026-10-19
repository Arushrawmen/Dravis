/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Live Screen Monitor, Hands-Free Distant Voice Clicker & Full Navigation Panel Controller
 * Shared 1:1 across Desktop HomeView and Android Mobile Resolution View
 */

import React, { useState } from "react";
import {
  Eye,
  MousePointerClick,
  Compass,
  FolderPlus,
  Image as ImageIcon,
  Film,
  PhoneCall,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { NavigationTab } from "../types";
import { screenMonitorAgent, ScannedScreenElement } from "../utils/screenMonitorAgent";
import { deviceHardware } from "../utils/deviceHardware";

interface ScreenMonitorControlStripProps {
  onSendCommand: (commandText: string) => void;
  onSelectTab?: (tab: NavigationTab) => void;
  compact?: boolean;
}

const NAV_TABS: Array<{ tab: NavigationTab; label: string }> = [
  { tab: "HOME", label: "Home" },
  { tab: "MICRO_DECISION", label: "360° Orbit" },
  { tab: "DRAVIS", label: "AI Chat & Media" },
  { tab: "FILES", label: "Files & Folders" },
  { tab: "HISTORY", label: "Brain & Apps" },
  { tab: "SKILLS", label: "40 Skills" },
  { tab: "LEARNING", label: "Learning" },
  { tab: "AUTOMATION", label: "Automation" },
  { tab: "PLUGINS", label: "Plugins" },
  { tab: "SUPERVISION", label: "Supervision" },
  { tab: "SETTINGS", label: "Settings" },
  { tab: "PROFILE", label: "Profile" },
  { tab: "SYSTEM", label: "System" },
];

export const ScreenMonitorControlStrip: React.FC<ScreenMonitorControlStripProps> = ({
  onSendCommand,
  onSelectTab,
  compact = false,
}) => {
  const [isRadarOpen, setIsRadarOpen] = useState(false);
  const [scannedElements, setScannedElements] = useState<ScannedScreenElement[]>([]);
  const [folderInputName, setFolderInputName] = useState("Dravis_Project");
  const [isFolderPromptOpen, setIsFolderPromptOpen] = useState(false);
  const [statusFeedback, setStatusFeedback] = useState<string>("");

  const handleScanScreen = () => {
    const elements = screenMonitorAgent.scanVisibleScreenElements();
    setScannedElements(elements.slice(0, 24));
    setIsRadarOpen((prev) => !prev);
  };

  const handleCreateFolderNow = async () => {
    const cleanName = folderInputName.trim() || "Dravis_Project";
    setStatusFeedback(`Creating real folder "${cleanName}" on your device...`);
    // 1. Trigger File System Access API while inside direct user gesture if supported
    await deviceHardware.createRealFolderOnDevice(cleanName, [
      {
        name: "README.md",
        content: `# ${cleanName}\n\nCreated genuinely by DRAVIS Autonomous OS on ${new Date().toLocaleString()}.\n`,
      },
    ]);
    // 2. Also dispatch to backend Forge so it creates on disk + downloads .zip folder bundle
    onSendCommand(`Create folder ${cleanName} and file README.md`);
    setIsFolderPromptOpen(false);
    setTimeout(() => setStatusFeedback(""), 4000);
  };

  return (
    <div className="w-full rounded-2xl border border-purple-500/30 bg-slate-950/75 backdrop-blur-2xl p-2.5 sm:px-4 sm:py-2.5 flex flex-col gap-2 shadow-[0_0_22px_rgba(168,85,247,0.12)]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-[10px] font-mono font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-cyan-400" />
            <span>SCREEN MONITOR + VOICE CLICKER + MEDIA FORGE</span>
          </span>
          <span className="hidden sm:inline text-[9px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-400/30">
            SAY &quot;CLICK [BUTTON]&quot; OR &quot;OPEN [PANEL]&quot; FROM AFAR
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {/* Scan Screen & Click Any Button */}
          <button
            type="button"
            onClick={handleScanScreen}
            className={`px-2.5 py-1 rounded-xl border text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer transition-all ${
              isRadarOpen
                ? "bg-cyan-500/25 border-cyan-400 text-cyan-200"
                : "bg-white/5 border-white/15 text-cyan-300 hover:bg-white/10"
            }`}
            title="Scan all visible buttons on screen & click any option by voice or tap"
          >
            <MousePointerClick className="w-3 h-3" />
            <span>{isRadarOpen ? "Hide Screen Targets" : "Scan Screen Buttons"}</span>
          </button>

          {/* Instant Genuine Folder Creator */}
          <button
            type="button"
            onClick={() => setIsFolderPromptOpen((prev) => !prev)}
            className="px-2.5 py-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 text-amber-200 text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer"
            title="Create Real Folder on PC / Android Storage"
          >
            <FolderPlus className="w-3 h-3" />
            <span>+ Create Real Folder</span>
          </button>

          {/* Instant AI Photo Generator */}
          <button
            type="button"
            onClick={() =>
              onSendCommand("Generate an ultra-detailed futuristic cyberpunk AI hologram photo")
            }
            className="px-2.5 py-1 rounded-xl bg-pink-500/20 hover:bg-pink-500/30 border border-pink-400/50 text-pink-200 text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer"
            title="Generate AI Photo"
          >
            <ImageIcon className="w-3 h-3" />
            <span>AI Photo</span>
          </button>

          {/* Instant AI Video / Animation Generator */}
          <button
            type="button"
            onClick={() =>
              onSendCommand("Create a 3D holographic sci-fi animation video of Dravis core")
            }
            className="px-2.5 py-1 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/50 text-purple-200 text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer"
            title="Generate AI Video & Animation"
          >
            <Film className="w-3 h-3" />
            <span>AI Video/Anim</span>
          </button>
        </div>
      </div>

      {statusFeedback && (
        <div className="px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-400/40 text-[11px] font-mono text-emerald-200 flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>{statusFeedback}</span>
        </div>
      )}

      {/* Expandable Real Folder Name Input Bar */}
      {isFolderPromptOpen && (
        <div className="p-2.5 rounded-xl bg-slate-900/95 border border-amber-400/40 flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-mono text-amber-300 font-bold">
            Folder Name:
          </span>
          <input
            type="text"
            value={folderInputName}
            onChange={(e) => setFolderInputName(e.target.value)}
            placeholder="e.g. My_Dravis_Project"
            className="flex-1 min-w-[140px] bg-black/60 border border-white/15 rounded-lg px-2.5 py-1 text-xs font-mono text-white"
          />
          <button
            type="button"
            onClick={handleCreateFolderNow}
            className="px-3 py-1 rounded-lg bg-amber-400 text-slate-950 font-mono text-xs font-bold cursor-pointer"
          >
            Create on PC / Phone & Download .ZIP Folder
          </button>
        </div>
      )}

      {/* Expandable Live Screen Button Radar & Full Navigation Panel Controller */}
      {isRadarOpen && (
        <div className="p-2.5 rounded-xl bg-slate-900/95 border border-cyan-500/35 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-cyan-300">
              FULL NAVIGATION PANEL CONTROLLER (VOICE OR TAP):
            </span>
            <span className="text-[9px] font-mono text-slate-400">
              Say: &quot;Open Micro Decision&quot;, &quot;Click Wi-Fi&quot;, &quot;Open Files&quot;
            </span>
          </div>

          {onSelectTab && (
            <div className="flex flex-wrap gap-1.5">
              {NAV_TABS.map((item) => (
                <button
                  key={item.tab}
                  type="button"
                  onClick={() => onSelectTab(item.tab)}
                  className="px-2 py-1 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/30 border border-cyan-400/40 text-[10px] font-mono text-cyan-200 cursor-pointer"
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}

          <div className="text-[10px] font-mono font-bold text-emerald-300 mt-1">
            DETECTED LIVE SCREEN BUTTONS ({scannedElements.length} LOCATED):
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
            {scannedElements.map((item) => (
              <button
                key={item.id + item.label}
                type="button"
                onClick={() => {
                  screenMonitorAgent.highlightAndClickElement(item.element);
                }}
                className="px-2 py-1 rounded-lg bg-white/5 hover:bg-emerald-500/20 border border-white/10 hover:border-emerald-400/50 text-[10px] font-mono text-slate-200 flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-2.5 h-2.5 text-emerald-400" />
                <span>{item.label}</span>
                <span className="text-[8px] text-slate-400">
                  ({item.xPercent}%,{item.yPercent}%)
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
