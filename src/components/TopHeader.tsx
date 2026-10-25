/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Sci-Fi Holographic Top Navigation & HUD Header Bar
 * Brand: Dravis Autonomous Superintelligence
 * Features:
 * - Auto-hides at the top edge and smoothly slides down ONLY when the user moves their cursor to the top
 * - Single horizontal line alignment with crisp icon-first controls (zero text congestion)
 */

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Minus,
  Maximize2,
  Minimize2,
  X,
  Phone,
  Smartphone,
  Globe,
  Sparkles,
  Search,
  Check,
  Cpu,
  Mic,
  MicOff,
  Terminal,
  RotateCcw,
  Crown,
  CreditCard,
} from "lucide-react";
import { soundEffects } from "../utils/audioSynth";
import { DRAVIS_LANGUAGES } from "../types";
import dravisSparkLogo from "../assets/images/dravis_spark_logo_1789562293560.jpg";
import { PWAInstallButton } from "./PWAInstallButton";

interface TopHeaderProps {
  wakeWord: string;
  wakeWordActive: boolean;
  onToggleWakeWord: (active: boolean) => void;
  isListening: boolean;
  soundEffectsEnabled: boolean;
  llmProvider?: "GOOGLE" | "OPENAI";
  llmModel?: string;
  onToggleLLMProvider?: (provider: "GOOGLE" | "OPENAI") => void;
  preferredLanguage?: string;
  autoAdaptLanguage?: boolean;
  detectedLanguage?: string;
  onSelectLanguage?: (langCode: string, autoAdapt: boolean) => void;
  onToggleFullscreen?: () => void;
  isFullscreen?: boolean;
  onMinimize?: () => void;
  onClose?: () => void;
  onOpenContacts?: () => void;
  onOpenSubscriptions?: () => void;
  onToggleAndroidResolution?: () => void;
  isAndroidResolutionActive?: boolean;
  onOpenGitHubModal?: () => void;
  onOpenAndroidCli?: () => void;
  desktopMonitorComponent?: React.ReactNode;
  emotionIndicatorComponent?: React.ReactNode;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  wakeWord,
  wakeWordActive,
  onToggleWakeWord,
  isListening,
  soundEffectsEnabled,
  llmProvider = "GOOGLE",
  llmModel = "gemini-3.6-flash",
  onToggleLLMProvider,
  preferredLanguage = "AUTO_ADAPT",
  autoAdaptLanguage = true,
  detectedLanguage = "en-US",
  onSelectLanguage,
  onToggleFullscreen,
  isFullscreen = false,
  onMinimize,
  onClose,
  onOpenContacts,
  onOpenSubscriptions,
  onToggleAndroidResolution,
  isAndroidResolutionActive = false,
  onOpenGitHubModal,
  onOpenAndroidCli,
  desktopMonitorComponent,
  emotionIndicatorComponent,
}) => {
  const [currentTime, setCurrentTime] = useState<string>("");
  const [isLangMenuOpen, setIsLangMenuOpen] = useState<boolean>(false);
  const [langSearch, setLangSearch] = useState<string>("");
  const [langRegionFilter, setLangRegionFilter] = useState<"ALL" | "INDIAN" | "GLOBAL">("ALL");
  const [isTopBarExpanded, setIsTopBarExpanded] = useState<boolean>(false);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const activeLangObj =
    DRAVIS_LANGUAGES.find((l) => l.code === preferredLanguage) || DRAVIS_LANGUAGES[0];
  const detectedLangObj =
    DRAVIS_LANGUAGES.find((l) => l.code === detectedLanguage) ||
    DRAVIS_LANGUAGES.find((l) => l.code === "en-US")!;

  const filteredLanguages = DRAVIS_LANGUAGES.filter((l) => {
    if (langRegionFilter === "INDIAN" && l.region !== "INDIAN" && l.region !== "AUTO") return false;
    if (langRegionFilter === "GLOBAL" && l.region !== "GLOBAL" && l.region !== "AUTO") return false;
    if (!langSearch.trim()) return true;
    const q = langSearch.toLowerCase();
    return (
      l.name.toLowerCase().includes(q) ||
      l.nativeName.toLowerCase().includes(q) ||
      l.code.toLowerCase().includes(q)
    );
  });

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
      setCurrentTime(timeStr);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Detect cursor moving to top edge of screen to smoothly slide down the top bar
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (e.clientY <= 18) {
        if (hideTimeoutRef.current) {
          clearTimeout(hideTimeoutRef.current);
          hideTimeoutRef.current = null;
        }
        setIsTopBarExpanded(true);
      } else if (e.clientY > 68 && !isLangMenuOpen) {
        if (!hideTimeoutRef.current) {
          hideTimeoutRef.current = setTimeout(() => {
            setIsTopBarExpanded(false);
            hideTimeoutRef.current = null;
          }, 260);
        }
      }
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, [isLangMenuOpen]);

  const handleMouseEnterBar = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    setIsTopBarExpanded(true);
  };

  const handleMouseLeaveBar = () => {
    if (isLangMenuOpen) return;
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    hideTimeoutRef.current = setTimeout(() => {
      setIsTopBarExpanded(false);
      hideTimeoutRef.current = null;
    }, 280);
  };

  const handleWakeWordToggle = () => {
    if (soundEffectsEnabled) {
      soundEffects.playChirp();
    }
    onToggleWakeWord(!wakeWordActive);
  };

  const handleExpandHUD = () => {
    if (onToggleFullscreen) {
      onToggleFullscreen();
    } else {
      const docEl = document.documentElement as any;
      const fullEl =
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).msFullscreenElement;
      if (!fullEl) {
        const req =
          docEl.requestFullscreen ||
          docEl.webkitRequestFullscreen ||
          docEl.msRequestFullscreen;
        if (req) {
          Promise.resolve(req.call(docEl)).catch(() => {});
        }
      } else {
        const doc = document as any;
        const exit =
          doc.exitFullscreen ||
          doc.webkitExitFullscreen ||
          doc.msExitFullscreen;
        if (exit) {
          Promise.resolve(exit.call(doc)).catch(() => {});
        }
      }
    }
    if (soundEffectsEnabled) {
      soundEffects.playChirp();
    }
  };

  const handleMinimize = () => {
    if (soundEffectsEnabled) {
      soundEffects.playChirp();
    }
    if (onMinimize) onMinimize();
  };

  const handleCloseHUD = () => {
    if (soundEffectsEnabled) {
      soundEffects.playAlert();
    }
    if (onClose) onClose();
  };

  const showBar = isTopBarExpanded || isLangMenuOpen;

  return (
    <div
      className="fixed top-0 inset-x-0 z-50 pointer-events-none select-none flex flex-col items-center"
      onMouseEnter={handleMouseEnterBar}
      onMouseLeave={handleMouseLeaveBar}
    >
      {/* Top Edge Hover Sensor Strip (Always active so hovering at top reveals the bar) */}
      <div
        onMouseEnter={handleMouseEnterBar}
        className="w-full h-3 pointer-events-auto cursor-pointer flex items-start justify-center group"
        title="Move cursor here to reveal Dravis Top Control Bar"
      >
        {/* Subtle glowing micro-accent line when collapsed */}
        <motion.div
          initial={false}
          animate={{
            opacity: showBar ? 0 : 0.55,
            scaleX: showBar ? 0.5 : 1,
          }}
          transition={{ duration: 0.25 }}
          className="w-28 h-[2px] rounded-full bg-gradient-to-r from-transparent via-cyan-400/80 to-transparent group-hover:via-cyan-300 shadow-[0_0_8px_rgba(34,211,238,0.6)]"
        />
      </div>

      {/* Smooth Slide-Down Single-Line Icon Bar (Like Core Modules Hover Reveal) */}
      <AnimatePresence>
        {showBar && (
          <motion.header
            initial={{ y: -56, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -56, opacity: 0 }}
            transition={{ type: "spring", stiffness: 360, damping: 30, mass: 0.7 }}
            className="pointer-events-auto -mt-2 w-[96%] max-w-6xl h-12 rounded-2xl bg-slate-950/90 border border-cyan-500/35 backdrop-blur-2xl shadow-[0_10px_35px_rgba(0,0,0,0.8),0_0_20px_rgba(34,211,238,0.18)] px-3.5 flex items-center justify-between gap-2 whitespace-nowrap"
          >
            {/* Left: Compact Dravis Logo + Single-Line Brand & Clock */}
            <div className="flex items-center gap-2.5 shrink-0">
              <div className="relative w-8 h-8 rounded-full overflow-hidden flex items-center justify-center border border-cyan-400/60 shadow-[0_0_12px_rgba(34,211,238,0.5)] bg-slate-950">
                <img
                  src={dravisSparkLogo}
                  alt="Dravis"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover scale-110"
                />
              </div>
              <span className="text-sm font-extrabold tracking-widest text-white font-mono">
                DRAVIS
              </span>
              <span className="text-[11px] font-mono text-cyan-400/90 border-l border-white/15 pl-2.5 hidden sm:inline">
                {currentTime}
              </span>
            </div>

            {/* Right: All Controls Aligned in One Clean Horizontal Row of Icons */}
            <div className="flex items-center gap-1.5 shrink-0">
              {/* 1. Language & Auto-Adapt Icon Button */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    if (soundEffectsEnabled) soundEffects.playChirp();
                    setIsLangMenuOpen((prev) => !prev);
                  }}
                  className={`relative w-8 h-8 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                    autoAdaptLanguage || preferredLanguage === "AUTO_ADAPT"
                      ? "border-violet-400/60 bg-violet-950/60 text-violet-300 shadow-[0_0_10px_rgba(167,139,250,0.25)] hover:border-violet-300"
                      : "border-cyan-400/50 bg-cyan-950/50 text-cyan-300 hover:border-cyan-300"
                  }`}
                  title={
                    autoAdaptLanguage || preferredLanguage === "AUTO_ADAPT"
                      ? `Language: Auto-Adapt (${detectedLangObj.nativeName})`
                      : `Language: ${activeLangObj.name} (${activeLangObj.nativeName})`
                  }
                >
                  <Globe className="w-4 h-4" />
                  <span className="absolute -bottom-0.5 -right-0.5 text-[8px] leading-none">
                    {autoAdaptLanguage ? "✨" : activeLangObj.flag}
                  </span>
                </button>

                {isLangMenuOpen && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-cyan-500/40 bg-slate-950/95 backdrop-blur-2xl shadow-[0_10px_40px_rgba(0,0,0,0.85)] p-3 z-50 font-mono text-xs flex flex-col gap-2.5 whitespace-normal">
                    <div className="flex items-center justify-between pb-2 border-b border-white/10">
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-violet-400" />
                        <span className="text-white font-bold text-xs uppercase">
                          All Languages & Auto-Adapt
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsLangMenuOpen(false)}
                        className="text-slate-400 hover:text-white p-1"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="p-2.5 rounded-xl bg-violet-950/40 border border-violet-500/40 flex items-center justify-between gap-2">
                      <div>
                        <span className="text-white font-bold text-[11px] block">
                          Auto-Adapt Language Mode
                        </span>
                        <span className="text-[10px] text-violet-200/80 font-sans block">
                          Automatically detects & replies in your language
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (soundEffectsEnabled) soundEffects.playChirp();
                          const nextAuto = !autoAdaptLanguage;
                          if (onSelectLanguage) {
                            onSelectLanguage(
                              nextAuto
                                ? "AUTO_ADAPT"
                                : preferredLanguage === "AUTO_ADAPT"
                                ? "en-US"
                                : preferredLanguage,
                              nextAuto
                            );
                          }
                        }}
                        className={`px-2.5 py-1 rounded-lg font-bold text-[10px] cursor-pointer transition-all shrink-0 ${
                          autoAdaptLanguage
                            ? "bg-violet-400 text-slate-950 shadow-[0_0_10px_rgba(167,139,250,0.5)]"
                            : "bg-white/10 text-slate-300 hover:bg-white/20"
                        }`}
                      >
                        {autoAdaptLanguage ? "AUTO ON" : "MANUAL"}
                      </button>
                    </div>

                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={langSearch}
                        onChange={(e) => setLangSearch(e.target.value)}
                        placeholder="Search 43+ languages..."
                        className="w-full bg-black/60 border border-white/15 rounded-lg pl-8 pr-2.5 py-1.5 text-[11px] text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-1">
                      {(["ALL", "INDIAN", "GLOBAL"] as const).map((reg) => (
                        <button
                          key={reg}
                          type="button"
                          onClick={() => setLangRegionFilter(reg)}
                          className={`py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${
                            langRegionFilter === reg
                              ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/50"
                              : "bg-white/5 text-slate-400 hover:text-white"
                          }`}
                        >
                          {reg === "ALL" ? "All (43)" : reg === "INDIAN" ? "Indian (17)" : "Global (25)"}
                        </button>
                      ))}
                    </div>

                    <div className="max-h-60 overflow-y-auto grid grid-cols-2 gap-1.5 pr-1">
                      {filteredLanguages.map((lang) => {
                        const isSelected =
                          (lang.code === "AUTO_ADAPT" && autoAdaptLanguage) ||
                          (!autoAdaptLanguage && preferredLanguage === lang.code);
                        return (
                          <button
                            key={lang.code}
                            type="button"
                            onClick={() => {
                              if (soundEffectsEnabled) soundEffects.playChirp();
                              if (onSelectLanguage) {
                                onSelectLanguage(lang.code, lang.code === "AUTO_ADAPT");
                              }
                              setIsLangMenuOpen(false);
                            }}
                            className={`p-2 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-1.5 ${
                              isSelected
                                ? "bg-cyan-500/20 border-cyan-400 text-white shadow-[0_0_10px_rgba(34,211,238,0.25)]"
                                : "bg-black/40 border-white/10 text-slate-300 hover:border-white/25 hover:text-white"
                            }`}
                          >
                            <div className="min-w-0">
                              <div className="font-bold text-[11px] truncate flex items-center gap-1">
                                <span>{lang.flag}</span>
                                <span className="truncate">{lang.name}</span>
                              </div>
                              <div className="text-[10px] text-cyan-300/80 truncate">{lang.nativeName}</div>
                            </div>
                            {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Dual LLM Engine Switcher Icon Button */}
              <button
                type="button"
                onClick={() => {
                  if (soundEffectsEnabled) soundEffects.playChirp();
                  if (onToggleLLMProvider) {
                    onToggleLLMProvider(llmProvider === "GOOGLE" ? "OPENAI" : "GOOGLE");
                  }
                }}
                className={`relative w-8 h-8 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                  llmProvider === "GOOGLE"
                    ? "border-cyan-400/50 bg-cyan-950/50 text-cyan-300 hover:border-cyan-300"
                    : "border-emerald-400/50 bg-emerald-950/50 text-emerald-300 hover:border-emerald-300"
                }`}
                title={`AI Engine: ${llmProvider} (${llmModel}) — Click to switch`}
              >
                <Cpu className="w-4 h-4" />
                <span
                  className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border border-slate-950 ${
                    llmProvider === "GOOGLE" ? "bg-cyan-400" : "bg-emerald-400"
                  }`}
                />
              </button>

              {/* 3. Acoustic Wake Word Toggle Icon Button */}
              <button
                type="button"
                onClick={handleWakeWordToggle}
                className={`relative w-8 h-8 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                  wakeWordActive
                    ? "border-cyan-400/60 bg-cyan-950/60 text-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.25)]"
                    : "border-white/15 bg-white/5 text-slate-400 opacity-70"
                }`}
                title={`Wake Word (${wakeWord}): ${wakeWordActive ? "ON" : "OFF"}`}
              >
                {wakeWordActive ? (
                  <Mic className={`w-4 h-4 ${isListening ? "text-emerald-400 animate-pulse" : "text-cyan-400"}`} />
                ) : (
                  <MicOff className="w-4 h-4 text-slate-400" />
                )}
                <span
                  className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-slate-950 ${
                    wakeWordActive ? "bg-emerald-400" : "bg-slate-600"
                  }`}
                />
              </button>

              {/* 4. Emotion Resonance Indicator (Icon Badge) */}
              {emotionIndicatorComponent}

              {/* 5. Continuous Screen Vision Monitor (Icon Badge) */}
              {desktopMonitorComponent}

              {/* 6. Android Mobile View Shifter Icon Button */}
              <button
                id="hud-btn-android-resolution"
                type="button"
                onClick={() => {
                  if (soundEffectsEnabled) soundEffects.playChirp();
                  if (onToggleAndroidResolution) onToggleAndroidResolution();
                }}
                className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-all cursor-pointer active:scale-95 ${
                  isAndroidResolutionActive
                    ? "border-cyan-400 bg-cyan-950/80 text-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.4)]"
                    : "border-white/15 bg-slate-900/70 hover:border-cyan-400/50 text-slate-300 hover:text-cyan-300"
                }`}
                title="Android Liquid Glass Mode"
              >
                <Smartphone className="w-4 h-4" />
              </button>

              {/* 7. GitHub Repository Sync Icon Button */}
              {onOpenGitHubModal && (
                <button
                  id="hud-btn-github-push"
                  type="button"
                  onClick={() => {
                    if (soundEffectsEnabled) soundEffects.playChirp();
                    onOpenGitHubModal();
                  }}
                  className="w-8 h-8 rounded-xl border border-white/15 bg-slate-900/70 hover:bg-slate-800 hover:border-cyan-400/50 text-slate-200 hover:text-cyan-300 flex items-center justify-center transition-all cursor-pointer active:scale-95"
                  title="GitHub Repository Sync & Export"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                    />
                  </svg>
                </button>
              )}

              {/* 8. Official Google Android CLI Icon Button */}
              {onOpenAndroidCli && (
                <button
                  id="hud-btn-android-cli"
                  type="button"
                  onClick={() => {
                    if (soundEffectsEnabled) soundEffects.playChirp();
                    onOpenAndroidCli();
                  }}
                  className="w-8 h-8 rounded-xl border border-emerald-500/40 bg-emerald-950/50 hover:bg-emerald-900/60 hover:border-emerald-400 text-emerald-300 flex items-center justify-center transition-all cursor-pointer active:scale-95"
                  title="Official Google Android CLI & Agent Studio"
                >
                  <Terminal className="w-4 h-4 text-emerald-400" />
                </button>
              )}

              {/* 9. Contacts & Direct Calling Hub Icon Button */}
              {onOpenContacts && (
                <button
                  id="hud-btn-contacts-call"
                  type="button"
                  onClick={() => {
                    if (soundEffectsEnabled) soundEffects.playChirp();
                    onOpenContacts();
                  }}
                  className="w-8 h-8 rounded-xl border border-emerald-500/50 bg-emerald-950/50 hover:bg-emerald-900/60 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.25)] flex items-center justify-center transition-all cursor-pointer active:scale-95"
                  title="Contacts & Direct Calling Hub"
                >
                  <Phone className="w-4 h-4 text-emerald-400" />
                </button>
              )}

              {/* 9.5 Razorpay Subscriptions & Upgrade Button */}
              {onOpenSubscriptions && (
                <button
                  id="hud-btn-subscriptions"
                  type="button"
                  onClick={() => {
                    if (soundEffectsEnabled) soundEffects.playActivatePulse();
                    onOpenSubscriptions();
                  }}
                  className="px-2.5 py-1 rounded-xl border border-amber-400/50 bg-gradient-to-r from-amber-500/20 via-orange-500/15 to-violet-500/20 hover:from-amber-500/30 hover:to-violet-500/30 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.25)] flex items-center gap-1.5 font-mono text-[11px] font-bold cursor-pointer transition-all active:scale-95"
                  title="Subscription Plans & Upgrades (Razorpay Verified)"
                >
                  <Crown className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">Plans</span>
                </button>
              )}
 
               {/* 9.6 PWA Native App Install Button */}
               <PWAInstallButton />

               {/* Divider */}
              <div className="h-5 w-[1px] bg-white/15 mx-0.5" />

              {/* 10. Window & HUD Controls (Minimize Sidebars, Fullscreen / Exit Fullscreen, Restart/Close HUD) */}
              <div className="flex items-center gap-1">
                <button
                  id="hud-btn-minimize"
                  type="button"
                  onClick={handleMinimize}
                  className="w-8 h-8 rounded-xl border border-white/10 bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
                  title="Minimize Sidebars"
                >
                  <Minus className="w-4 h-4" />
                </button>

                <button
                  id="hud-btn-fullscreen"
                  type="button"
                  onClick={handleExpandHUD}
                  className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                    isFullscreen
                      ? "border-cyan-400/60 bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30"
                      : "border-white/10 bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white"
                  }`}
                  title={isFullscreen ? "Exit Fullscreen" : "Fullscreen HUD"}
                >
                  {isFullscreen ? (
                    <Minimize2 className="w-4 h-4" />
                  ) : (
                    <Maximize2 className="w-4 h-4" />
                  )}
                </button>

                <button
                  id="hud-btn-close"
                  type="button"
                  onClick={handleCloseHUD}
                  className="w-8 h-8 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/25 text-rose-300 hover:text-rose-200 flex items-center justify-center transition-all cursor-pointer"
                  title="Restart / Reset Dravis HUD"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </motion.header>
        )}
      </AnimatePresence>
    </div>
  );
};
