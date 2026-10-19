/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Sci-Fi Holographic Top Navigation & HUD Header Bar
 * Brand: Dravis Autonomous Superintelligence
 */

import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Minus, Square, Maximize2, Minimize2, X, Phone, Smartphone, Globe, Sparkles, Search, Check } from "lucide-react";
import { soundEffects } from "../utils/audioSynth";
import { DRAVIS_LANGUAGES } from "../types";
import dravisSparkLogo from "../assets/images/dravis_spark_logo_1789562293560.jpg";

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
  onToggleAndroidResolution?: () => void;
  isAndroidResolutionActive?: boolean;
  onOpenGitHubModal?: () => void;
  onOpenAndroidCli?: () => void;
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
  onToggleAndroidResolution,
  isAndroidResolutionActive = false,
  onOpenGitHubModal,
  onOpenAndroidCli,
}) => {
  const [currentTime, setCurrentTime] = useState<string>("");
  const [currentDate, setCurrentDate] = useState<string>("");
  const [isLangMenuOpen, setIsLangMenuOpen] = useState<boolean>(false);
  const [langSearch, setLangSearch] = useState<string>("");
  const [langRegionFilter, setLangRegionFilter] = useState<"ALL" | "INDIAN" | "GLOBAL">("ALL");

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
        second: "2-digit",
        hour12: true,
      });
      const dateStr = now.toLocaleDateString("en-US", {
        weekday: "long",
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).toUpperCase();

      setCurrentTime(timeStr);
      setCurrentDate(dateStr);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

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

  return (
    <header className="relative w-full h-14 bg-slate-950/35 border-b border-cyan-500/30 backdrop-blur-xl flex items-center justify-between px-3 sm:px-5 select-none z-40">
      {/* Background cyber grid scanline accent */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(6,182,212,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(6,182,212,0.03)_1px,transparent_1px)] bg-[size:14px_14px] pointer-events-none" />

      {/* Left: Section 1 - Dravis Brand Identity & Spark Character Mascot */}
      <div className="flex items-center gap-3">
        {/* Dravis Adorable Glowing Spark Mascot */}
        <div className="relative w-9 h-9 rounded-full overflow-hidden flex items-center justify-center border border-cyan-400/60 shadow-[0_0_15px_rgba(34,211,238,0.6)] group cursor-pointer bg-slate-950">
          <motion.div
            className="absolute inset-0 rounded-full border border-dashed border-cyan-300/80 pointer-events-none"
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
          />
          <img
            src={dravisSparkLogo}
            alt="Dravis Spark Character Mascot"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover scale-110 group-hover:scale-125 transition-transform duration-500"
          />
        </div>

        {/* DRAVIS Name & DRAVIS Core */}
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="text-lg sm:text-xl font-extrabold tracking-widest text-white font-mono leading-none drop-shadow-[0_0_12px_rgba(34,211,238,0.6)]">
              DRAVIS
            </span>
            <span className="text-[9px] font-mono font-extrabold px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-400/40">
              DRAVIS CORE
            </span>
          </div>
          <span className="text-[10px] font-mono tracking-widest text-cyan-400/90 font-semibold uppercase mt-0.5">
            AUTONOMOUS SUPERINTELLIGENCE
          </span>
        </div>
      </div>

      {/* Center: Section 4 - Long Angular HUD Status Bar */}
      <div className="hidden xl:flex relative items-center justify-center px-8 py-1.5 bg-black/60 border border-cyan-500/30 backdrop-blur-md [clip-path:polygon(12px_0,calc(100%-12px)_0,100%_100%,0_100%)] overflow-hidden shadow-[0_0_15px_rgba(34,211,238,0.15)]">
        {/* Subtle animated scanning light line */}
        <motion.div
          className="absolute inset-y-0 w-12 bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent pointer-events-none"
          animate={{ x: [-150, 350] }}
          transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
        />

        <div className="flex items-center gap-4 text-xs font-mono font-bold tracking-widest text-cyan-300">
          <span className="text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.3)]">{currentDate}</span>
          <span className="text-cyan-500/60 font-normal">|</span>
          <span className="text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.7)] font-mono">{currentTime}</span>
        </div>
      </div>

      {/* Right: Section Controls */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Universal All-Languages & Auto-Adapt Language Selector */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              if (soundEffectsEnabled) soundEffects.playChirp();
              setIsLangMenuOpen((prev) => !prev);
            }}
            className={`cursor-pointer flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border transition-all text-xs font-mono font-bold ${
              autoAdaptLanguage || preferredLanguage === "AUTO_ADAPT"
                ? "border-violet-400/60 bg-violet-950/50 text-violet-200 shadow-[0_0_12px_rgba(167,139,250,0.25)] hover:border-violet-300"
                : "border-cyan-400/50 bg-cyan-950/40 text-cyan-200 hover:border-cyan-300"
            }`}
            title="All Languages & Auto-Adapt Language Engine"
          >
            <Globe className="w-3.5 h-3.5 text-violet-400" />
            <span className="hidden md:inline text-[10px]">
              {autoAdaptLanguage || preferredLanguage === "AUTO_ADAPT"
                ? `AUTO-ADAPT • ${detectedLangObj.nativeName}`
                : `${activeLangObj.flag} ${activeLangObj.nativeName}`}
            </span>
            <span className="md:hidden text-[10px]">
              {autoAdaptLanguage ? "AUTO 🌐" : activeLangObj.flag}
            </span>
          </button>

          {isLangMenuOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-cyan-500/40 bg-slate-950/95 backdrop-blur-2xl shadow-[0_10px_40px_rgba(0,0,0,0.85)] p-3 z-50 font-mono text-xs flex flex-col gap-2.5">
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

              {/* Master Auto-Adapt Toggle */}
              <div className="p-2.5 rounded-xl bg-violet-950/40 border border-violet-500/40 flex items-center justify-between gap-2">
                <div>
                  <span className="text-white font-bold text-[11px] block">
                    Auto-Adapt Language Mode
                  </span>
                  <span className="text-[10px] text-violet-200/80 font-sans block">
                    Automatically detects & replies in whatever language you speak or type
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (soundEffectsEnabled) soundEffects.playChirp();
                    const nextAuto = !autoAdaptLanguage;
                    if (onSelectLanguage) {
                      onSelectLanguage(nextAuto ? "AUTO_ADAPT" : preferredLanguage === "AUTO_ADAPT" ? "en-US" : preferredLanguage, nextAuto);
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

              {/* Search & Region Filter */}
              <div className="flex items-center gap-1.5">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={langSearch}
                    onChange={(e) => setLangSearch(e.target.value)}
                    placeholder="Search 43+ languages (Hindi, Tamil, Spanish...)"
                    className="w-full bg-black/60 border border-white/15 rounded-lg pl-8 pr-2.5 py-1.5 text-[11px] text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                  />
                </div>
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

              {/* Scrollable Languages List */}
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

        {/* Dual LLM Engine Quick Switcher Pill */}
        <div
          onClick={() => {
            if (soundEffectsEnabled) soundEffects.playChirp();
            if (onToggleLLMProvider) {
              onToggleLLMProvider(llmProvider === "GOOGLE" ? "OPENAI" : "GOOGLE");
            }
          }}
          className={`cursor-pointer hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all duration-300 ${
            llmProvider === "GOOGLE"
              ? "border-cyan-400/50 bg-cyan-950/40 text-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.2)] hover:border-cyan-300"
              : "border-emerald-400/50 bg-emerald-950/40 text-emerald-300 shadow-[0_0_12px_rgba(52,211,153,0.2)] hover:border-emerald-300"
          }`}
          title={`Active Engine: ${llmProvider === "GOOGLE" ? "1. Google (Gemini Core)" : "2. OpenAI (GPT Core)"} - Click to switch`}
        >
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${llmProvider === "GOOGLE" ? "bg-cyan-400 animate-pulse shadow-[0_0_6px_#22d3ee]" : "bg-emerald-400 animate-pulse shadow-[0_0_6px_#34d399]"}`} />
            <span className="text-[10px] font-mono font-bold tracking-wider uppercase">
              {llmProvider === "GOOGLE" ? "1. GOOGLE" : "2. OPENAI"}
            </span>
          </div>
          <span className="text-[9px] font-mono text-slate-300 bg-black/40 px-1.5 py-0.5 rounded border border-white/10">
            {llmModel}
          </span>
        </div>

        {/* Dedicated Wake Word Panel */}
        <div 
          onClick={handleWakeWordToggle}
          className={`cursor-pointer flex flex-col px-2.5 sm:px-3 py-1.5 rounded-xl border transition-all duration-300 ${
            wakeWordActive 
              ? "border-cyan-400/50 bg-cyan-950/40 shadow-[0_0_15px_rgba(34,211,238,0.25)]" 
              : "border-white/10 bg-white/5 opacity-70"
          }`}
          title="Toggle Hands-Free Acoustic Wake Word"
        >
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className={`w-2 h-2 rounded-full ${wakeWordActive ? "bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse" : "bg-slate-600"}`} />
            <span className="text-[10px] font-mono font-bold tracking-wider text-slate-200 uppercase">
              WAKE: <strong className="text-cyan-400 font-extrabold">{wakeWord}</strong>
            </span>
            <span 
              className={`text-[8px] font-bold px-1.5 py-0.2 rounded tracking-wider font-mono ml-0.5 ${
                wakeWordActive 
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" 
                  : "bg-slate-800 text-slate-400 border border-white/5"
              }`}
            >
              {wakeWordActive ? "ON" : "OFF"}
            </span>
          </div>

          {/* Animated Waveform beneath wake word text */}
          <div className="flex items-center justify-center gap-0.5 h-2.5 mt-1">
            {Array.from({ length: 12 }).map((_, i) => (
              <motion.div
                key={i}
                className={`w-0.5 rounded-full ${
                  isListening && wakeWordActive 
                    ? "bg-emerald-400 shadow-[0_0_4px_#34d399]" 
                    : wakeWordActive 
                    ? "bg-cyan-400" 
                    : "bg-slate-700"
                }`}
                animate={
                  wakeWordActive 
                    ? { height: isListening ? [2, (i % 3) * 4 + 4, 2] : [2, (i % 2) * 2 + 2, 2] } 
                    : { height: 2 }
                }
                transition={{
                  repeat: Infinity,
                  duration: isListening ? 0.4 : 0.9,
                  delay: i * 0.05,
                }}
              />
            ))}
          </div>
        </div>

        {/* Android Resolution Shifter Button (Matches exact style and name requested) */}
        <button
          id="hud-btn-android-resolution"
          onClick={() => {
            if (soundEffectsEnabled) soundEffects.playChirp();
            if (onToggleAndroidResolution) onToggleAndroidResolution();
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all text-xs font-mono font-bold cursor-pointer active:scale-95 ${
            isAndroidResolutionActive
              ? "border-cyan-400 bg-cyan-950/80 text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.4)]"
              : "border-slate-700/80 bg-slate-900/60 hover:border-cyan-500/50 hover:bg-slate-800 text-slate-200 hover:text-cyan-300"
          }`}
          title="Android Resolution Shifter Mode"
        >
          <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
          <span>Android</span>
        </button>

        {/* GitHub Push & Repository Sync Button */}
        {onOpenGitHubModal && (
          <button
            id="hud-btn-github-push"
            type="button"
            onClick={() => {
              if (soundEffectsEnabled) soundEffects.playChirp();
              onOpenGitHubModal();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/20 bg-slate-900/80 hover:bg-slate-800 hover:border-cyan-400/50 text-white hover:text-cyan-300 transition-all text-xs font-mono font-bold cursor-pointer active:scale-95 shadow-sm"
            title="Push App to GitHub / Export Code"
          >
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
            <span className="hidden md:inline">GitHub</span>
          </button>
        )}

        {/* Official Google Android CLI Button */}
        {onOpenAndroidCli && (
          <button
            id="hud-btn-android-cli"
            type="button"
            onClick={() => {
              if (soundEffectsEnabled) soundEffects.playChirp();
              onOpenAndroidCli();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-500/40 bg-emerald-950/50 hover:bg-emerald-900/60 hover:border-emerald-400 text-emerald-300 transition-all text-xs font-mono font-bold cursor-pointer active:scale-95 shadow-sm"
            title="Official Google Android CLI & Agent Studio"
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden md:inline">Android CLI</span>
          </button>
        )}

        {/* Direct Contacts & Calling Quick Button */}
        {onOpenContacts && (
          <button
            id="hud-btn-contacts-call"
            onClick={() => {
              if (soundEffectsEnabled) soundEffects.playChirp();
              onOpenContacts();
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-emerald-500/50 bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.3)] transition-all text-xs font-mono font-bold cursor-pointer active:scale-95"
            title="Open Contacts & Direct Calling Hub"
          >
            <Phone className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">CALL HUB</span>
          </button>
        )}

        {/* Sci-Fi Hologram Window Controls */}
        <div className="flex items-center gap-1 text-slate-400">
          <button 
            id="hud-btn-minimize"
            type="button"
            onClick={handleMinimize}
            className="p-1.5 rounded-lg hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
            title="Minimize Sidebars"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button 
            id="hud-btn-fullscreen"
            type="button"
            onClick={handleExpandHUD}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isFullscreen
                ? "bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30"
                : "hover:bg-white/10 hover:text-white"
            }`}
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen HUD"}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
          <button 
            id="hud-btn-close"
            type="button"
            onClick={handleCloseHUD}
            className="p-1.5 rounded-lg hover:bg-red-500/20 hover:text-red-400 transition-colors cursor-pointer"
            title="Close / Restart Dravis HUD"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
