/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Universal Contextual Left-Click, Cursor/Wheel-Click & Right-Click Working Buttons Bar
 * Adapts dynamically to every option/module in DRAVIS OS according to its functional need.
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  MousePointer,
  Move,
  Sparkles,
  Camera,
  Zap,
  Globe,
  X,
  CheckCircle2,
} from "lucide-react";
import { NavTab } from "../types";

export interface ContextualClickControlsBarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenCameraPreview: () => void;
  onSpawnMicroDecision: (options?: {
    title?: string;
    command?: string;
    forceNewSector?: boolean;
  }) => void;
  onSendQuickCommand: (command: string) => void;
  onToggleMic: () => void;
  onTriggerAutoFix: () => void;
}

interface OptionClickSpec {
  moduleLabel: string;
  leftTitle: string;
  leftDesc: string;
  leftRun: () => void;
  wheelTitle: string;
  wheelDesc: string;
  wheelRun: () => void;
  rightTitle: string;
  rightDesc: string;
  rightRun: () => void;
}

export const ContextualClickControlsBar: React.FC<ContextualClickControlsBarProps> = ({
  activeTab,
  onSelectTab,
  onOpenCameraPreview,
  onSpawnMicroDecision,
  onSendQuickCommand,
  onToggleMic,
  onTriggerAutoFix,
}) => {
  const [lastTriggeredAction, setLastTriggeredAction] = useState<{
    buttonType: "LEFT" | "WHEEL" | "RIGHT";
    label: string;
  } | null>(null);
  const [globalContextMenu, setGlobalContextMenu] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const notifyTrigger = (buttonType: "LEFT" | "WHEEL" | "RIGHT", label: string) => {
    setLastTriggeredAction({ buttonType, label });
    setTimeout(() => {
      setLastTriggeredAction((prev) => (prev?.label === label ? null : prev));
    }, 2400);
  };

  const getSpecForTab = (tab: NavTab): OptionClickSpec => {
    switch (tab) {
      case "MICRO_DECISION":
        return {
          moduleLabel: "360° Micro-Decision World",
          leftTitle: "L-Click: Select & Inspect Decision",
          leftDesc: "Inspect active 3D sphere & sync blueprint",
          leftRun: () => {
            onSpawnMicroDecision({
              title: "Left-Click Tactical Node Inspection",
              forceNewSector: false,
            });
            notifyTrigger("LEFT", "Inspected & Synced Local Cluster Node");
          },
          wheelTitle: "Wheel/Cursor: Move Camera & Zoom Sector",
          wheelDesc: "Pan across world & zoom to target sector",
          wheelRun: () => {
            onSpawnMicroDecision({
              title: "Wheel-Camera Sector Glide & Focus",
              forceNewSector: false,
            });
            notifyTrigger("WHEEL", "Camera Moved & Zoomed to Target Sector");
          },
          rightTitle: "R-Click: Shoot Line to New Sector",
          rightDesc: "Shoot cross-world line & spawn opposite cluster",
          rightRun: () => {
            onSpawnMicroDecision({
              title: "Cross-World Bridge Line & New Cluster",
              forceNewSector: true,
            });
            notifyTrigger("RIGHT", "Shot Bridge Line & Spawned New Distant Cluster");
          },
        };

      case "HOME":
        return {
          moduleLabel: "Home Core Command Center",
          leftTitle: "L-Click: Toggle Voice Mic",
          leftDesc: "Start/stop live multilingual voice command",
          leftRun: () => {
            onToggleMic();
            notifyTrigger("LEFT", "Toggled Live Voice Recognition");
          },
          wheelTitle: "Wheel/Cursor: Moveable Camera Preview",
          wheelDesc: "Open interactive pan/zoom camera preview",
          wheelRun: () => {
            onOpenCameraPreview();
            notifyTrigger("WHEEL", "Opened Moveable Camera Preview HUD");
          },
          rightTitle: "R-Click: Expand Micro-Decision World",
          rightDesc: "Spawn new sector cluster & open 360° World",
          rightRun: () => {
            onSpawnMicroDecision({
              title: "Home Core Autonomous Sector Expansion",
              forceNewSector: true,
            });
            onSelectTab("MICRO_DECISION");
            notifyTrigger("RIGHT", "Expanded New Sector in Micro-Decision World");
          },
        };

      case "DRAVIS":
        return {
          moduleLabel: "Dravis Neural Chat Studio",
          leftTitle: "L-Click: Quick AI System Status",
          leftDesc: "Run instant dual-API intelligence synthesis",
          leftRun: () => {
            onSendQuickCommand("Give me a quick system status and active micro-decision summary.");
            notifyTrigger("LEFT", "Dispatched Quick AI Status Command");
          },
          wheelTitle: "Wheel/Cursor: Optical Camera Vision",
          wheelDesc: "Open pan/zoom camera for live OCR & vision",
          wheelRun: () => {
            onOpenCameraPreview();
            notifyTrigger("WHEEL", "Opened Optical Camera Vision Preview");
          },
          rightTitle: "R-Click: Sync Chat to New World Sector",
          rightDesc: "Convert chat context into distant cluster",
          rightRun: () => {
            onSpawnMicroDecision({
              title: "Chat Context -> Cross-World Neural Cluster",
              forceNewSector: true,
            });
            notifyTrigger("RIGHT", "Synced Chat Context to New World Sector");
          },
        };

      case "FILES":
      case "CODEX":
        return {
          moduleLabel: tab === "CODEX" ? "Codex IDE Studio" : "Workspace Files Hub",
          leftTitle: "L-Click: Generate Code / Workspace File",
          leftDesc: "Create & sync new module file blueprint",
          leftRun: () => {
            onSpawnMicroDecision({
              title: `${tab} Blueprint: Fast File Synthesis`,
              forceNewSector: false,
            });
            notifyTrigger("LEFT", `Synthesized ${tab} Execution Blueprint`);
          },
          wheelTitle: "Wheel/Cursor: Camera & Screen Code Scan",
          wheelDesc: "Move camera preview to inspect code/screen",
          wheelRun: () => {
            onOpenCameraPreview();
            notifyTrigger("WHEEL", "Opened Camera Preview for Code Inspection");
          },
          rightTitle: "R-Click: Auto-Fix & Bridge to World",
          rightDesc: "Run screen auto-fix & expand world cluster",
          rightRun: () => {
            onTriggerAutoFix();
            onSpawnMicroDecision({
              title: `${tab} Auto-Fix & Cross-Sector Sync`,
              forceNewSector: true,
            });
            notifyTrigger("RIGHT", "Triggered Auto-Fix & New Sector Bridge");
          },
        };

      case "CONTACTS":
      case "GMAIL":
      case "CALENDAR":
      case "DRIVE":
      case "MAPS":
        return {
          moduleLabel: `${tab} Workspace Console`,
          leftTitle: `L-Click: Smart ${tab} Action`,
          leftDesc: `Execute primary ${tab} assistant action`,
          leftRun: () => {
            onSpawnMicroDecision({
              title: `${tab} Smart Execution Node`,
              forceNewSector: false,
            });
            notifyTrigger("LEFT", `Executed ${tab} Primary Action & Synced`);
          },
          wheelTitle: "Wheel/Cursor: Pan Camera / Map View",
          wheelDesc: "Open moveable camera & spatial viewport",
          wheelRun: () => {
            onOpenCameraPreview();
            notifyTrigger("WHEEL", `Activated Moveable Viewport for ${tab}`);
          },
          rightTitle: `R-Click: AI Summary & Sector Bridge`,
          rightDesc: `Synthesize ${tab} insights into new cluster`,
          rightRun: () => {
            onSpawnMicroDecision({
              title: `${tab} AI Summary -> New World Cluster`,
              forceNewSector: true,
            });
            notifyTrigger("RIGHT", `Bridged ${tab} Insights to New World Sector`);
          },
        };

      default:
        return {
          moduleLabel: `${tab} Control Module`,
          leftTitle: `L-Click: Run ${tab} Diagnostic`,
          leftDesc: "Execute module task & record blueprint",
          leftRun: () => {
            onSpawnMicroDecision({
              title: `${tab} Fast-Path Execution Node`,
              forceNewSector: false,
            });
            notifyTrigger("LEFT", `Executed ${tab} Fast-Path Action`);
          },
          wheelTitle: "Wheel/Cursor: Moveable Camera Preview",
          wheelDesc: "Pan & zoom live optical camera viewport",
          wheelRun: () => {
            onOpenCameraPreview();
            notifyTrigger("WHEEL", "Opened Moveable Camera Preview");
          },
          rightTitle: "R-Click: Bridge to New World Sector",
          rightDesc: "Shoot line across space & grow new cluster",
          rightRun: () => {
            onSpawnMicroDecision({
              title: `${tab} Cross-World Bridge Cluster`,
              forceNewSector: true,
            });
            notifyTrigger("RIGHT", `Shot Cross-World Line from ${tab}`);
          },
        };
    }
  };

  const spec = getSpecForTab(activeTab);

  // Global Right-Click handler for non-canvas modules so Right-Click works in every option!
  useEffect(() => {
    const handleWindowContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      // Let canvas and inputs handle their own context menu
      if (target.closest("canvas, input, textarea, [data-custom-context='true']")) {
        return;
      }
      e.preventDefault();
      setGlobalContextMenu({
        x: e.clientX,
        y: e.clientY,
      });
    };

    const handleWindowClick = () => {
      setGlobalContextMenu(null);
    };

    window.addEventListener("contextmenu", handleWindowContextMenu);
    window.addEventListener("click", handleWindowClick);
    return () => {
      window.removeEventListener("contextmenu", handleWindowContextMenu);
      window.removeEventListener("click", handleWindowClick);
    };
  }, []);

  return (
    <>
      {/* Sleek Contextual Click Controls Strip at Bottom-Center of Active Option */}
      {activeTab !== "MICRO_DECISION" && (
        <div className="w-full px-3 py-1.5 bg-black/90 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 font-mono text-[10px] z-20 shrink-0">
          <div className="flex items-center gap-1.5">
            <MousePointer className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-300 font-bold uppercase">
              {spec.moduleLabel} Click Controls:
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Working LEFT-CLICK Button */}
            <button
              type="button"
              onClick={spec.leftRun}
              title={spec.leftDesc}
              className="px-2.5 py-1 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/50 text-cyan-200 font-bold flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <span>{spec.leftTitle}</span>
            </button>

            {/* Working WHEEL / CURSOR CLICK Button */}
            <button
              type="button"
              onClick={spec.wheelRun}
              title={spec.wheelDesc}
              className="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/50 text-emerald-200 font-bold flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <Move className="w-3 h-3 text-emerald-400" />
              <span>{spec.wheelTitle}</span>
            </button>

            {/* Working RIGHT-CLICK Button */}
            <button
              type="button"
              onClick={spec.rightRun}
              title={spec.rightDesc}
              className="px-2.5 py-1 rounded-lg bg-purple-500/15 hover:bg-purple-500/25 border border-purple-400/50 text-purple-200 font-bold flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <Sparkles className="w-3 h-3 text-purple-400" />
              <span>{spec.rightTitle}</span>
            </button>
          </div>
        </div>
      )}

      {/* Live Toast Feedback when any Contextual Click Button is Triggered */}
      <AnimatePresence>
        {lastTriggeredAction && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className="fixed bottom-16 left-1/2 -translate-x-1/2 z-50 px-3.5 py-2 rounded-xl bg-black/95 border border-cyan-400/60 shadow-[0_0_25px_rgba(34,211,238,0.35)] font-mono text-[11px] text-white flex items-center gap-2 pointer-events-none"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-cyan-300 font-bold">
              [{lastTriggeredAction.buttonType}-CLICK EXECUTED]:
            </span>
            <span>{lastTriggeredAction.label}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Universal Right-Click Tactical Menu across all Options */}
      <AnimatePresence>
        {globalContextMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.94 }}
            style={{
              left: Math.min(window.innerWidth - 280, Math.max(12, globalContextMenu.x)),
              top: Math.min(window.innerHeight - 230, Math.max(12, globalContextMenu.y)),
            }}
            onClick={(e) => e.stopPropagation()}
            className="fixed z-50 w-68 liquid-glass rounded-2xl p-2.5 border border-cyan-400/60 shadow-[0_12px_40px_rgba(0,0,0,0.95)] font-mono text-[11px] flex flex-col gap-1"
          >
            <div className="flex items-center justify-between px-2 py-1 border-b border-white/10 text-[10px] text-cyan-300 font-bold uppercase">
              <span>{spec.moduleLabel} • Actions</span>
              <button
                type="button"
                onClick={() => setGlobalContextMenu(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                spec.leftRun();
                setGlobalContextMenu(null);
              }}
              className="w-full px-2.5 py-1.5 rounded-xl hover:bg-cyan-500/20 text-left text-cyan-200 flex items-center gap-2 cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="truncate">{spec.leftTitle}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                spec.wheelRun();
                setGlobalContextMenu(null);
              }}
              className="w-full px-2.5 py-1.5 rounded-xl hover:bg-emerald-500/20 text-left text-emerald-200 flex items-center gap-2 cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="truncate">{spec.wheelTitle}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                spec.rightRun();
                setGlobalContextMenu(null);
              }}
              className="w-full px-2.5 py-1.5 rounded-xl hover:bg-purple-500/20 text-left text-purple-200 flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <span className="truncate">{spec.rightTitle}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onSelectTab("MICRO_DECISION");
                setGlobalContextMenu(null);
              }}
              className="w-full px-2.5 py-1.5 rounded-xl hover:bg-white/10 text-left text-white flex items-center gap-2 cursor-pointer border-t border-white/10 mt-0.5 pt-1.5"
            >
              <Globe className="w-3.5 h-3.5 text-cyan-300 shrink-0" />
              <span>Open 360° Micro-Decision World</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
