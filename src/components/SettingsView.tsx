/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * System Settings, Audio SFX, and Autonomy Configuration View
 */

import React, { useState } from "react";
import { Settings, Volume2, Cpu, Layers, CheckCircle2, Zap, Globe, Search, Play } from "lucide-react";
import { UserProfile, LLM_MODELS, DRAVIS_LANGUAGES, DRAVIS_VOICE_PROFILES, VoicePersonaId } from "../types";
import { soundEffects } from "../utils/audioSynth";
import { speechEngine } from "../utils/speech";

interface SettingsViewProps {
  profile: UserProfile;
  onUpdateProfile: (p: UserProfile) => void;
  soundEffectsEnabled: boolean;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  profile,
  onUpdateProfile,
  soundEffectsEnabled,
}) => {
  const [langSearch, setLangSearch] = useState("");
  const [langRegion, setLangRegion] = useState<"ALL" | "INDIAN" | "GLOBAL">("ALL");

  const toggleField = (field: keyof UserProfile) => {
    if (soundEffectsEnabled) soundEffects.playChirp();
    const updated = { ...profile, [field]: !profile[field] };
    onUpdateProfile(updated);
  };

  const googleModels = LLM_MODELS.filter((m) => m.provider === "GOOGLE");
  const openAIModels = LLM_MODELS.filter((m) => m.provider === "OPENAI");
  const activeModels = (profile.llmProvider || "GOOGLE") === "GOOGLE" ? googleModels : openAIModels;

  const isAutoAdapt = profile.autoAdaptLanguage !== undefined ? profile.autoAdaptLanguage : true;
  const activeLangCode = profile.preferredLanguage || "AUTO_ADAPT";
  const detectedLangObj =
    DRAVIS_LANGUAGES.find((l) => l.code === (profile.detectedLanguage || "en-US")) ||
    DRAVIS_LANGUAGES[0];

  const filteredLanguages = DRAVIS_LANGUAGES.filter((l) => {
    if (langRegion === "INDIAN" && l.region !== "INDIAN" && l.region !== "AUTO") return false;
    if (langRegion === "GLOBAL" && l.region !== "GLOBAL" && l.region !== "AUTO") return false;
    if (!langSearch.trim()) return true;
    const q = langSearch.toLowerCase();
    return (
      l.name.toLowerCase().includes(q) ||
      l.nativeName.toLowerCase().includes(q) ||
      l.code.toLowerCase().includes(q)
    );
  });

  return (
    <div 
      id="dravis-settings-view"
      className="flex-1 flex flex-col h-full bg-slate-950/40 p-3 sm:p-5 gap-4 overflow-y-auto"
    >
      <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_0_15px_rgba(0,0,0,0.3)]">
        <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-cyan-400">
          <Settings className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm sm:text-base font-bold text-white font-mono tracking-wider">
            Autonomous System, Languages & Model Configuration
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            Active Provider: <strong className={profile.llmProvider === "GOOGLE" ? "text-cyan-400" : "text-emerald-400"}>
              {profile.llmProvider === "GOOGLE" ? "1. Google Gemini (ASI Core)" : "2. OpenAI (GPT Core)"}
            </strong> • Language:{" "}
            <strong className="text-violet-300">
              {isAutoAdapt ? `Auto-Adapt (${detectedLangObj.nativeName})` : activeLangCode}
            </strong>
          </span>
        </div>
      </div>

      {/* Universal All-Languages & Auto-Adapt Language Section */}
      <div className="p-4 rounded-2xl border border-violet-500/30 bg-violet-950/15 flex flex-col gap-3 font-mono text-xs shadow-[0_0_20px_rgba(167,139,250,0.12)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-white/10">
          <div>
            <h4 className="text-white font-bold text-xs uppercase flex items-center gap-2">
              <Globe className="w-4 h-4 text-violet-400" />
              <span>Universal All-Languages & Auto-Adapt Language Engine (43+ Languages)</span>
            </h4>
            <p className="text-[11px] text-slate-300 font-sans mt-0.5">
              When Auto-Adapt is enabled, Dravis automatically detects whatever language or dialect you speak or type (Hindi, Hinglish, Marathi, Tamil, Telugu, Bengali, Gujarati, Punjabi, Spanish, French, Japanese, Arabic, etc.) and replies in that exact language.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (soundEffectsEnabled) soundEffects.playChirp();
              const nextAuto = !isAutoAdapt;
              onUpdateProfile({
                ...profile,
                autoAdaptLanguage: nextAuto,
                preferredLanguage: nextAuto
                  ? "AUTO_ADAPT"
                  : activeLangCode === "AUTO_ADAPT"
                  ? "en-US"
                  : activeLangCode,
              });
            }}
            className={`px-3.5 py-2 rounded-xl font-bold text-xs cursor-pointer transition-all shrink-0 ${
              isAutoAdapt
                ? "bg-violet-400 text-slate-950 shadow-[0_0_15px_rgba(167,139,250,0.5)]"
                : "bg-white/10 text-slate-300 hover:bg-white/20"
            }`}
          >
            {isAutoAdapt ? "🌐 AUTO-ADAPT: ON" : "AUTO-ADAPT: OFF"}
          </button>
        </div>

        {/* Search & Region Filter */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={langSearch}
              onChange={(e) => setLangSearch(e.target.value)}
              placeholder="Search any language (Hindi, Hinglish, Marathi, Tamil, Telugu, Bengali, Spanish, Japanese, Arabic...)"
              className="w-full bg-black/50 border border-white/15 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-400"
            />
          </div>
          <div className="flex items-center gap-1.5">
            {(["ALL", "INDIAN", "GLOBAL"] as const).map((reg) => (
              <button
                key={reg}
                type="button"
                onClick={() => setLangRegion(reg)}
                className={`px-3 py-2 rounded-xl text-[10px] font-bold cursor-pointer transition-all ${
                  langRegion === reg
                    ? "bg-violet-500/30 text-violet-200 border border-violet-400/60"
                    : "bg-black/40 text-slate-400 border border-white/10 hover:text-white"
                }`}
              >
                {reg === "ALL" ? "All (43)" : reg === "INDIAN" ? "Indian (17)" : "Global (25)"}
              </button>
            ))}
          </div>
        </div>

        {/* Languages Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 max-h-56 overflow-y-auto pr-1">
          {filteredLanguages.map((lang) => {
            const isSelected =
              (lang.code === "AUTO_ADAPT" && isAutoAdapt) ||
              (!isAutoAdapt && activeLangCode === lang.code);
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => {
                  if (soundEffectsEnabled) soundEffects.playChirp();
                  onUpdateProfile({
                    ...profile,
                    preferredLanguage: lang.code,
                    autoAdaptLanguage: lang.code === "AUTO_ADAPT",
                  });
                }}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-1.5 ${
                  isSelected
                    ? "bg-violet-500/25 border-violet-400 text-white shadow-[0_0_12px_rgba(167,139,250,0.3)] ring-1 ring-violet-400"
                    : "bg-black/40 border-white/10 text-slate-300 hover:border-white/25 hover:text-white"
                }`}
              >
                <div className="min-w-0">
                  <div className="font-bold text-[11px] truncate flex items-center gap-1">
                    <span>{lang.flag}</span>
                    <span className="truncate">{lang.name}</span>
                  </div>
                  <div className="text-[10px] text-violet-300/90 truncate">{lang.nativeName}</div>
                </div>
                {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-violet-300 shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Primary Neural LLM & Model Selector Section */}
      <div className="p-4 rounded-2xl border border-cyan-500/20 bg-white/5 flex flex-col gap-3 font-mono text-xs shadow-[0_0_15px_rgba(34,211,238,0.1)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-white/10">
          <h4 className="text-white font-bold text-xs uppercase flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span>Neural Intelligence Provider & Model Selector</span>
          </h4>
          <span className="text-[11px] text-slate-400">
            Current Router: <span className="text-cyan-300 font-bold">{profile.llmProvider || "GOOGLE"}</span>
          </span>
        </div>

        {/* Dual Provider Selection Tabs */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => {
              if (soundEffectsEnabled) soundEffects.playChirp();
              onUpdateProfile({
                ...profile,
                llmProvider: "GOOGLE",
                llmModel: profile.llmProvider === "GOOGLE" ? profile.llmModel : "gemini-3.6-flash",
              });
            }}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
              (profile.llmProvider || "GOOGLE") === "GOOGLE"
                ? "bg-cyan-950/40 border-cyan-400 text-white shadow-[0_0_12px_rgba(34,211,238,0.3)] ring-1 ring-cyan-400/60"
                : "bg-black/30 border-white/10 text-slate-400 hover:text-white hover:border-white/20"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-cyan-400/20 text-cyan-300 border border-cyan-400/40 flex items-center justify-center text-[10px]">1</span>
                <span>Google Gemini</span>
              </span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-400/20 text-cyan-300 border border-cyan-400/30 font-bold">PRIMARY ASI</span>
            </div>
            <span className="text-[10px] text-slate-400 font-sans">Multimodal reasoning with Gemini 3.7 Flash & 3.1 Pro</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (soundEffectsEnabled) soundEffects.playChirp();
              onUpdateProfile({
                ...profile,
                llmProvider: "OPENAI",
                llmModel: profile.llmProvider === "OPENAI" ? profile.llmModel : "gpt-4o",
              });
            }}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
              profile.llmProvider === "OPENAI"
                ? "bg-emerald-950/40 border-emerald-400 text-white shadow-[0_0_12px_rgba(52,211,153,0.3)] ring-1 ring-emerald-400/60"
                : "bg-black/30 border-white/10 text-slate-400 hover:text-white hover:border-white/20"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/40 flex items-center justify-center text-[10px]">2</span>
                <span>OpenAI GPT</span>
              </span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 font-bold">SECONDARY</span>
            </div>
            <span className="text-[10px] text-slate-400 font-sans">GPT-4o, GPT-4o Mini, and o3-mini models</span>
          </button>
        </div>

        {/* Model Cards for Selected Provider */}
        <div className="pt-2 border-t border-white/5 flex flex-col gap-2">
          <span className="text-slate-400 font-bold text-[11px] uppercase flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>Select Active {profile.llmProvider === "OPENAI" ? "OpenAI" : "Google Gemini"} Model:</span>
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {activeModels.map((model) => {
              const isSelected = profile.llmModel === model.id;
              return (
                <button
                  key={model.id}
                  type="button"
                  onClick={() => {
                    if (soundEffectsEnabled) soundEffects.playChirp();
                    onUpdateProfile({ ...profile, llmModel: model.id });
                  }}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                    isSelected
                      ? profile.llmProvider === "OPENAI"
                        ? "bg-emerald-500/20 border-emerald-400 text-white shadow-[0_0_10px_rgba(52,211,153,0.3)] ring-1 ring-emerald-400"
                        : "bg-cyan-500/20 border-cyan-400 text-white shadow-[0_0_10px_rgba(34,211,238,0.3)] ring-1 ring-cyan-400"
                      : "bg-black/30 border-white/10 text-slate-400 hover:border-white/20 hover:text-white"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-bold text-white text-xs">{model.name}</span>
                      {isSelected && (
                        <CheckCircle2 className={`w-3.5 h-3.5 ${profile.llmProvider === "OPENAI" ? "text-emerald-400" : "text-cyan-400"}`} />
                      )}
                    </div>
                    <p className="text-[10px] text-slate-300 font-sans line-clamp-2">{model.description}</p>
                  </div>
                  <div className="flex items-center justify-between text-[9px] pt-1 border-t border-white/5 text-slate-400">
                    <span className="text-cyan-300">{model.speed}</span>
                    <span>{model.contextWindow}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
        {/* Subsystem & Audio Toggles */}
        <div className="p-4 rounded-2xl border border-white/10 bg-white/5 flex flex-col gap-3 shadow-[0_0_15px_rgba(0,0,0,0.2)]">
          <h4 className="text-white font-bold text-xs uppercase pb-2 border-b border-white/5 flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-cyan-400" />
            <span>Audio & Sound Feedback</span>
          </h4>

          {/* Sound Effects Switch */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/40 border border-white/10">
            <div>
              <span className="text-white font-bold block">Sci-Fi Audio Synthesizer</span>
              <span className="text-slate-400 text-[11px]">Holographic click and activation chimes</span>
            </div>
            <button
              onClick={() => toggleField("soundEffects")}
              className={`px-3 py-1 rounded-full font-bold text-[11px] transition-all ${
                profile.soundEffects ? "bg-cyan-400 text-slate-950 shadow-[0_0_10px_rgba(34,211,238,0.4)]" : "bg-white/10 text-slate-400"
              }`}
            >
              {profile.soundEffects ? "ENABLED" : "MUTED"}
            </button>
          </div>

          {/* Wake Word Switch */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/40 border border-white/10">
            <div>
              <span className="text-white font-bold block">Continuous Wake Word</span>
              <span className="text-slate-400 text-[11px]">Responds instantly to 'DRAVIS'</span>
            </div>
            <button
              onClick={() => toggleField("wakeWordActive")}
              className={`px-3 py-1 rounded-full font-bold text-[11px] transition-all ${
                profile.wakeWordActive ? "bg-cyan-400 text-slate-950 shadow-[0_0_10px_rgba(34,211,238,0.4)]" : "bg-white/10 text-slate-400"
              }`}
            >
              {profile.wakeWordActive ? "ACTIVE" : "STANDBY"}
            </button>
          </div>

          {/* 6-Voice Acoustic Persona Selector */}
          <div className="p-2.5 rounded-xl bg-black/40 border border-cyan-500/20 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-white font-bold text-[11px]">Active Voice Persona & Flow</span>
              <span className="text-cyan-300 font-bold text-[10px]">
                {profile.voicePreference || "Fenrir"}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {DRAVIS_VOICE_PROFILES.map((vp) => {
                const isSelected = (profile.voicePreference || "Fenrir") === vp.id;
                return (
                  <div
                    key={vp.id}
                    onClick={() => {
                      if (soundEffectsEnabled) soundEffects.playChirp();
                      const updated = { ...profile, voicePreference: vp.id as VoicePersonaId };
                      onUpdateProfile(updated);
                      speechEngine.setVoicePersona(vp.id);
                      speechEngine.previewVoicePersona(vp.id, profile.preferredLanguage || "en-IN");
                    }}
                    className={`p-2 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between gap-1 ${
                      isSelected
                        ? "bg-cyan-500/20 border-cyan-400 text-white shadow-[0_0_10px_rgba(34,211,238,0.3)]"
                        : "bg-black/40 border-white/10 text-slate-300 hover:border-white/25"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[11px] text-white">{vp.id}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          speechEngine.previewVoicePersona(vp.id, profile.preferredLanguage || "en-IN");
                        }}
                        className="px-1.5 py-0.5 rounded bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 text-[9px] font-bold flex items-center gap-0.5"
                      >
                        <Play className="w-2.5 h-2.5" /> Test
                      </button>
                    </div>
                    <span className="text-[9px] text-cyan-200/80 line-clamp-1">{vp.tagline}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Intelligence & Autonomy Toggles */}
        <div className="p-4 rounded-2xl border border-white/10 bg-white/5 flex flex-col gap-3 shadow-[0_0_15px_rgba(0,0,0,0.2)]">
          <h4 className="text-white font-bold text-xs uppercase pb-2 border-b border-white/5 flex items-center gap-2">
            <Zap className="w-4 h-4 text-emerald-400" />
            <span>Latency & Autonomy Execution</span>
          </h4>

          {/* Responding Latency Mode Quick Select */}
          <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
              <span className="text-white font-bold">Responding Speed Mode</span>
              <span className="text-emerald-400 font-bold">{profile.responseSpeed || "INSTANT"} ({profile.responseSpeedRate || 1.25}x)</span>
            </div>
            <div className="grid grid-cols-4 gap-1 pt-1">
              {(["INSTANT", "RAPID", "BALANCED", "DEEP_REASONING"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => {
                    if (soundEffectsEnabled) soundEffects.playChirp();
                    onUpdateProfile({ ...profile, responseSpeed: mode });
                  }}
                  className={`py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                    (profile.responseSpeed || "INSTANT") === mode
                      ? "bg-emerald-400 text-slate-950 shadow-[0_0_8px_rgba(52,211,153,0.4)]"
                      : "bg-white/5 text-slate-400 hover:text-white"
                  }`}
                >
                  {mode === "DEEP_REASONING" ? "DEEP" : mode}
                </button>
              ))}
            </div>
          </div>

          {/* Autonomous Execution Mode */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/40 border border-white/10">
            <div>
              <span className="text-white font-bold block">Autonomous Agent Mode</span>
              <span className="text-slate-400 text-[11px]">Executes multi-step workflows</span>
            </div>
            <button
              onClick={() => toggleField("autonomousMode")}
              className={`px-3 py-1 rounded-full font-bold text-[11px] transition-all ${
                profile.autonomousMode ? "bg-emerald-500 text-slate-950 font-bold shadow-[0_0_10px_rgba(52,211,153,0.4)]" : "bg-white/10 text-slate-400"
              }`}
            >
              {profile.autonomousMode ? "ENABLED" : "OFF"}
            </button>
          </div>

          {/* Continuous Memory Learning */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/40 border border-white/10">
            <div>
              <span className="text-white font-bold block">Continuous Preference Learning</span>
              <span className="text-slate-400 text-[11px]">Extracts & saves facts to Memory Bank</span>
            </div>
            <button
              onClick={() => toggleField("learningMode")}
              className={`px-3 py-1 rounded-full font-bold text-[11px] transition-all ${
                profile.learningMode ? "bg-cyan-400 text-slate-950 shadow-[0_0_10px_rgba(34,211,238,0.4)]" : "bg-white/10 text-slate-400"
              }`}
            >
              {profile.learningMode ? "LEARNING" : "PAUSED"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
