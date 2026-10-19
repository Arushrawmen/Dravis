/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * User Profile & Biometric Identity View with Personality, Talking Style, and API Routing
 */

import React, { useState, useEffect } from "react";
import { 
  User, Shield, Fingerprint, Volume2, Save, Zap, Gauge, Clock, 
  Sparkles, Cpu, CheckCircle2, Bot, Layers, Activity, Terminal, ShieldAlert, Sliders, Play,
  LogOut, UserPlus, ArrowLeftRight, History, Mail, Lock, X
} from "lucide-react";
import { UserProfile, UserAccount, LLM_MODELS, DravisPersonality, DravisTalkingStyle, DRAVIS_VOICE_PROFILES, VoicePersonaId } from "../types";
import { soundEffects } from "../utils/audioSynth";
import { speechEngine } from "../utils/speech";

interface ProfileViewProps {
  profile: UserProfile;
  onUpdateProfile: (updated: UserProfile) => void;
  soundEffectsEnabled: boolean;
  currentAccount?: UserAccount | null;
  savedAccounts?: UserAccount[];
  onSwitchAccount?: (account: UserAccount) => void;
  onAddAccount?: (newAccount: UserAccount, switchImmediately: boolean) => void;
  onLogOut?: () => void;
  accountHistoryCounts?: Record<string, { chats: number; memories: number; logs: number }>;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  profile,
  onUpdateProfile,
  soundEffectsEnabled,
  currentAccount,
  savedAccounts = [],
  onSwitchAccount,
  onAddAccount,
  onLogOut,
  accountHistoryCounts = {},
}) => {
  const [formData, setFormData] = useState<UserProfile>({
    ...profile,
    responseSpeed: profile.responseSpeed || "INSTANT",
    responseSpeedRate: profile.responseSpeedRate || 1.25,
    llmProvider: profile.llmProvider || "GOOGLE",
    llmModel: profile.llmModel || "gemini-3.6-flash",
    personalityStyle: profile.personalityStyle || "TONY_STARK",
    talkingStyle: profile.talkingStyle || "WITTY_CONCISE",
  });
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Add Account Modal / Drawer State inside Profile
  const [isAddingAccount, setIsAddingAccount] = useState(false);
  const [newAccName, setNewAccName] = useState("");
  const [newAccEmail, setNewAccEmail] = useState("");
  const [newAccRole, setNewAccRole] = useState("Authorized Operator");
  const [newAccPassword, setNewAccPassword] = useState("");
  const [switchBannerMsg, setSwitchBannerMsg] = useState<string | null>(null);

  // Keep formData synchronized when switching accounts
  useEffect(() => {
    setFormData({
      ...profile,
      responseSpeed: profile.responseSpeed || "INSTANT",
      responseSpeedRate: profile.responseSpeedRate || 1.25,
      llmProvider: profile.llmProvider || "GOOGLE",
      llmModel: profile.llmModel || "gemini-3.6-flash",
      personalityStyle: profile.personalityStyle || "TONY_STARK",
      talkingStyle: profile.talkingStyle || "WITTY_CONCISE",
    });
  }, [profile]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (soundEffectsEnabled) soundEffects.playActivatePulse();
    onUpdateProfile(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleCreateNewAccountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccName.trim() || !newAccEmail.trim()) return;
    if (soundEffectsEnabled) soundEffects.playActivatePulse();
    const createdAcc: UserAccount = {
      id: "usr-" + Date.now(),
      displayName: newAccName.trim(),
      email: newAccEmail.trim(),
      roleTitle: newAccRole.trim() || "Authorized Operator",
      provider: "EMAIL",
      avatarUrl: `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${encodeURIComponent(
        newAccName.trim()
      )}`,
      createdAt: new Date().toISOString(),
      lastLogin: "Active Now",
      isLoggedIn: true,
      isSupervised: false,
      sessions: [
        {
          id: "sess-" + Date.now(),
          device: "DRAVIS Multi-Account Session",
          ip: "192.168.1.104",
          location: "Local Device",
          lastActive: "Active Now",
          isCurrent: true,
        },
      ],
    };
    onAddAccount?.(createdAcc, true);
    setNewAccName("");
    setNewAccEmail("");
    setNewAccPassword("");
    setIsAddingAccount(false);
    setSwitchBannerMsg(`Created & switched to account "${createdAcc.displayName}". Loaded fresh history & workspace.`);
    setTimeout(() => setSwitchBannerMsg(null), 4000);
  };

  const googleModels = LLM_MODELS.filter((m) => m.provider === "GOOGLE");
  const openAIModels = LLM_MODELS.filter((m) => m.provider === "OPENAI");

  const personalities: { id: DravisPersonality; name: string; tag: string; desc: string }[] = [
    {
      id: "TONY_STARK",
      name: "Tony Stark's DRAVIS",
      tag: "CLASSIC CANON",
      desc: "Calm, sophisticated British wit, ultra-efficient, supreme intellectual composure.",
    },
    {
      id: "TACTICAL_COMMANDER",
      name: "Tactical Commander",
      tag: "MISSION CRITICAL",
      desc: "Direct, military-grade efficiency, authoritative status telemetry, zero conversational filler.",
    },
    {
      id: "SUPERINTELLIGENCE",
      name: "ASI Superintelligence",
      tag: "DEEP REASONING",
      desc: "Scientific precision, articulate deep synthesis, multi-dimensional reasoning.",
    },
    {
      id: "WARM_ASSISTANT",
      name: "Executive Companion",
      tag: "WARM & SUPPORTIVE",
      desc: "Polite, empathetic, conversational warmth, supportive executive assistance.",
    },
  ];

  const talkingStyles: { id: DravisTalkingStyle; name: string; desc: string }[] = [
    {
      id: "WITTY_CONCISE",
      name: "Witty & Concise",
      desc: "Core answer in 1-2 punchy spoken sentences with subtle dry wit. Never monologues.",
    },
    {
      id: "DIRECT_TACTICAL",
      name: "Direct & Tactical",
      desc: "Immediate execution confirmations, status telemetry, and minimal verbal overhead.",
    },
    {
      id: "ACADEMIC_DETAILED",
      name: "Academic & Analytical",
      desc: "Clear structured conceptual depth in HUD terminal while keeping voice responses crisp.",
    },
    {
      id: "CASUAL_WARM",
      name: "Casual & Friendly",
      desc: "Natural conversational flow, friendly banter, and supportive dialogue.",
    },
  ];

  return (
    <div 
      id="dravis-profile-view"
      className="flex-1 flex flex-col h-full bg-slate-950/40 p-3 sm:p-5 gap-4 overflow-y-auto"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_0_15px_rgba(0,0,0,0.3)]">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-cyan-400">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white font-mono tracking-wider">
              MASTER PROFILE & ACCOUNT SWITCHER
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              Active Account: <span className="text-cyan-300 font-bold">{currentAccount?.displayName || formData.name}</span> ({currentAccount?.email || "arushgamer783@gmail.com"})
            </span>
          </div>
        </div>

        {/* Top Quick Actions: Add Account & Log Out */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (soundEffectsEnabled) soundEffects.playChirp();
              setIsAddingAccount((prev) => !prev);
            }}
            className="px-3.5 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-mono text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-[0_0_15px_rgba(34,211,238,0.35)] transition-all"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add Account</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (soundEffectsEnabled) soundEffects.playAlert();
              onLogOut?.();
            }}
            className="px-3.5 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-200 font-mono text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Log Out</span>
          </button>
        </div>
      </div>

      {/* Section 0: Multi-Account Switcher, Add Account & Per-Account History */}
      <div className="p-4 rounded-2xl border border-cyan-500/25 bg-slate-900/60 flex flex-col gap-3.5 font-mono text-xs shadow-[0_0_20px_rgba(6,182,212,0.12)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-white/10">
          <div>
            <h4 className="text-white font-bold text-xs uppercase flex items-center gap-2">
              <ArrowLeftRight className="w-4 h-4 text-cyan-400" />
              <span>Your Accounts — Switch Account & Load Full History</span>
            </h4>
            <p className="text-[11px] text-slate-400 font-sans mt-0.5">
              Click <strong className="text-cyan-300">Switch</strong> next to any account name to switch accounts and view all of its chat history, memories, projects, and files.
            </p>
          </div>
          <span className="text-[11px] text-cyan-300 font-mono font-bold">
            {savedAccounts.length} Accounts Saved
          </span>
        </div>

        {switchBannerMsg && (
          <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{switchBannerMsg}</span>
          </div>
        )}

        {/* Inline Add Account Form */}
        {isAddingAccount && (
          <form
            onSubmit={handleCreateNewAccountSubmit}
            className="p-4 rounded-2xl bg-slate-950/90 border border-cyan-400/40 flex flex-col gap-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                <UserPlus className="w-4 h-4" />
                <span>Add New Account</span>
              </span>
              <button
                type="button"
                onClick={() => setIsAddingAccount(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Account Name *</label>
                <input
                  type="text"
                  value={newAccName}
                  onChange={(e) => setNewAccName(e.target.value)}
                  placeholder="e.g. Aryan / Gaming Account"
                  required
                  className="w-full bg-black/50 border border-white/15 rounded-xl px-3 py-2 text-xs text-white font-sans focus:outline-none focus:border-cyan-400"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Email Address *</label>
                <input
                  type="email"
                  value={newAccEmail}
                  onChange={(e) => setNewAccEmail(e.target.value)}
                  placeholder="e.g. aryan@gmail.com"
                  required
                  className="w-full bg-black/50 border border-white/15 rounded-xl px-3 py-2 text-xs text-white font-sans focus:outline-none focus:border-cyan-400"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Role / Title</label>
                <input
                  type="text"
                  value={newAccRole}
                  onChange={(e) => setNewAccRole(e.target.value)}
                  placeholder="e.g. Developer / Creator"
                  className="w-full bg-black/50 border border-white/15 rounded-xl px-3 py-2 text-xs text-white font-sans focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsAddingAccount(false)}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs cursor-pointer shadow-[0_0_12px_rgba(34,211,238,0.3)]"
              >
                Create & Switch Account
              </button>
            </div>
          </form>
        )}

        {/* Saved Accounts List with "Switch" Button Right Next to Account Name */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {savedAccounts.map((acc) => {
            const isCurrent = currentAccount?.id === acc.id || currentAccount?.email === acc.email;
            const counts = accountHistoryCounts[acc.id] || {
              chats: 1,
              memories: 1,
              logs: 1,
            };
            return (
              <div
                key={acc.id}
                className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                  isCurrent
                    ? "bg-cyan-950/40 border-cyan-400/70 shadow-[0_0_15px_rgba(34,211,238,0.2)]"
                    : "bg-black/40 border-white/10 hover:border-white/25"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-200 font-bold text-sm shrink-0 overflow-hidden">
                    {acc.avatarUrl ? (
                      <img
                        src={acc.avatarUrl}
                        alt={acc.displayName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      acc.displayName.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-white text-sm truncate">
                        {acc.displayName}
                      </span>
                      {isCurrent && (
                        <span className="text-[10px] text-emerald-300 font-mono">
                          · Active
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 block truncate">
                      {acc.email}
                    </span>
                    <span className="text-[10px] text-cyan-300/85 flex items-center gap-1 mt-0.5">
                      <History className="w-3 h-3" />
                      <span>
                        {counts.chats} chats · {counts.memories} memories · {counts.logs} history logs
                      </span>
                    </span>
                  </div>
                </div>

                {/* Switch Button right next to the account name */}
                <div className="flex items-center gap-2 shrink-0">
                  {isCurrent ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (soundEffectsEnabled) soundEffects.playAlert();
                        onLogOut?.();
                      }}
                      className="px-3 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-200 font-mono text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all"
                    >
                      <LogOut className="w-3 h-3" />
                      <span>Log Out</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        if (soundEffectsEnabled) soundEffects.playActivatePulse();
                        onSwitchAccount?.(acc);
                        setSwitchBannerMsg(
                          `Switched to ${acc.displayName} (${acc.email}). All history, chats, and memories for ${acc.displayName} are now active.`
                        );
                        setTimeout(() => setSwitchBannerMsg(null), 4000);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-mono text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-[0_0_12px_rgba(34,211,238,0.35)] transition-all"
                    >
                      <ArrowLeftRight className="w-3.5 h-3.5" />
                      <span>Switch</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Section 1: Personality & Behavior Engine */}
        <div className="p-4 rounded-2xl border border-cyan-500/20 bg-gradient-to-b from-cyan-950/20 to-black/40 flex flex-col gap-3 font-mono text-xs shadow-[0_0_20px_rgba(34,211,238,0.1)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-white/10">
            <h4 className="text-white font-bold text-xs uppercase flex items-center gap-2">
              <Bot className="w-4 h-4 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
              <span>DRAVIS Behavior & Persona Engine</span>
            </h4>
            <span className="text-[11px] text-slate-400">
              Active Behavior: <strong className="text-cyan-300">{formData.personalityStyle || "TONY_STARK"}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {personalities.map((p) => {
              const isSelected = (formData.personalityStyle || "TONY_STARK") === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => {
                    if (soundEffectsEnabled) soundEffects.playChirp();
                    setFormData({ ...formData, personalityStyle: p.id });
                  }}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                    isSelected
                      ? "bg-cyan-950/40 border-cyan-400 text-white shadow-[0_0_12px_rgba(34,211,238,0.25)] ring-1 ring-cyan-400/50"
                      : "bg-black/30 border-white/10 text-slate-400 hover:border-white/20 hover:text-white"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs">{p.name}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                      isSelected ? "bg-cyan-400/20 text-cyan-300 border border-cyan-400/30" : "bg-white/5 text-slate-500"
                    }`}>
                      {p.tag}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-300 font-sans leading-relaxed">
                    {p.desc}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Talking Style Selector */}
          <div className="pt-2 border-t border-white/5 flex flex-col gap-2">
            <span className="text-slate-400 font-bold text-xs uppercase flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              <span>Talking Style & Verbal Cadence:</span>
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
              {talkingStyles.map((style) => {
                const isSelected = (formData.talkingStyle || "WITTY_CONCISE") === style.id;
                return (
                  <div
                    key={style.id}
                    onClick={() => {
                      if (soundEffectsEnabled) soundEffects.playChirp();
                      setFormData({ ...formData, talkingStyle: style.id });
                    }}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-1 ${
                      isSelected
                        ? "bg-cyan-500/20 border-cyan-400 text-white shadow-[0_0_10px_rgba(34,211,238,0.2)] ring-1 ring-cyan-400"
                        : "bg-black/30 border-white/10 text-slate-400 hover:border-white/20 hover:text-white"
                    }`}
                  >
                    <span className="font-bold text-white text-[11px]">{style.name}</span>
                    <p className="text-[9px] text-slate-300 font-sans line-clamp-2">{style.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Section 2: Dual LLM Neural Brain Engine Selector */}
        <div className="p-4 rounded-2xl border border-cyan-500/20 bg-gradient-to-b from-cyan-950/20 to-black/40 flex flex-col gap-4 font-mono text-xs shadow-[0_0_20px_rgba(34,211,238,0.1)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/10">
            <h4 className="text-white font-bold text-xs uppercase flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
              <span>Neural LLM Provider Engine (1. Google • 2. OpenAI)</span>
            </h4>
            <span className="text-[11px] text-slate-400">
              Active Provider: <strong className="text-cyan-300">{formData.llmProvider}</strong>
            </span>
          </div>

          {/* Provider Selection Tabs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* 1. Google (Primary) */}
            <div
              onClick={() => {
                if (soundEffectsEnabled) soundEffects.playChirp();
                setFormData({
                  ...formData,
                  llmProvider: "GOOGLE",
                  llmModel: formData.llmProvider === "GOOGLE" ? formData.llmModel : "gemini-3.6-flash",
                });
              }}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col gap-2 ${
                formData.llmProvider === "GOOGLE"
                  ? "bg-cyan-950/40 border-cyan-400 text-white shadow-[0_0_15px_rgba(34,211,238,0.25)] ring-1 ring-cyan-400/50"
                  : "bg-black/30 border-white/10 text-slate-400 hover:border-white/20 hover:text-white"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-cyan-400/20 text-cyan-300 border border-cyan-400/40 flex items-center justify-center font-bold text-[10px]">
                    1
                  </span>
                  <span className="font-bold text-white text-sm">Google DeepMind</span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-400/20 text-cyan-300 border border-cyan-400/30">
                  PRIMARY ASI
                </span>
              </div>
              <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
                Gemini 3.7 Flash multimodal reasoning engine with direct search grounding and sub-90ms execution.
              </p>
            </div>

            {/* 2. OpenAI (Secondary) */}
            <div
              onClick={() => {
                if (soundEffectsEnabled) soundEffects.playChirp();
                setFormData({
                  ...formData,
                  llmProvider: "OPENAI",
                  llmModel: formData.llmProvider === "OPENAI" ? formData.llmModel : "gpt-4o",
                });
              }}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col gap-2 ${
                formData.llmProvider === "OPENAI"
                  ? "bg-emerald-950/40 border-emerald-400 text-white shadow-[0_0_15px_rgba(52,211,153,0.25)] ring-1 ring-emerald-400/50"
                  : "bg-black/30 border-white/10 text-slate-400 hover:border-white/20 hover:text-white"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/40 flex items-center justify-center font-bold text-[10px]">
                    2
                  </span>
                  <span className="font-bold text-white text-sm">OpenAI</span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                  SECONDARY
                </span>
              </div>
              <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
                GPT-4o, GPT-4o Mini, and o3-mini models for advanced code generation and cross-domain text synthesis.
              </p>
            </div>
          </div>

          {/* Model Options List for Selected Provider */}
          <div className="flex flex-col gap-2 pt-2 border-t border-white/5">
            <span className="text-slate-400 font-bold text-xs uppercase flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>Available {formData.llmProvider === "GOOGLE" ? "Google Gemini" : "OpenAI"} Models:</span>
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {(formData.llmProvider === "GOOGLE" ? googleModels : openAIModels).map((model) => {
                const isSelected = formData.llmModel === model.id;
                return (
                  <div
                    key={model.id}
                    onClick={() => {
                      if (soundEffectsEnabled) soundEffects.playChirp();
                      setFormData({ ...formData, llmModel: model.id });
                    }}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                      isSelected
                        ? formData.llmProvider === "GOOGLE"
                          ? "bg-cyan-500/15 border-cyan-400 text-white shadow-[0_0_12px_rgba(34,211,238,0.3)] ring-1 ring-cyan-400"
                          : "bg-emerald-500/15 border-emerald-400 text-white shadow-[0_0_12px_rgba(52,211,153,0.3)] ring-1 ring-emerald-400"
                        : "bg-black/30 border-white/10 text-slate-400 hover:border-white/20 hover:text-white"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-white text-xs">{model.name}</span>
                        {isSelected && (
                          <CheckCircle2 className={`w-3.5 h-3.5 ${formData.llmProvider === "GOOGLE" ? "text-cyan-400" : "text-emerald-400"}`} />
                        )}
                      </div>
                      <p className="text-[10px] text-slate-300 font-sans line-clamp-2">
                        {model.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-white/5">
                      <span className="text-cyan-400 font-mono">{model.speed}</span>
                      <span className="text-slate-400">{model.contextWindow}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Section 3: Identity Credentials & Latency Calibration */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Identity Credentials */}
          <div className="p-4 rounded-2xl border border-white/10 bg-white/5 flex flex-col gap-3 font-mono text-xs shadow-[0_0_15px_rgba(0,0,0,0.2)]">
            <h4 className="text-white font-bold text-xs uppercase pb-2 border-b border-white/5 flex items-center gap-2">
              <Fingerprint className="w-4 h-4 text-cyan-400" />
              <span>Master Identity & Security</span>
            </h4>

            <div>
              <label className="text-slate-400 block mb-1">Full Name / Preferred Addressing</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400/60 font-sans"
              />
              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                <span className="text-[10px] text-slate-500">Quick presets:</span>
                {["Boss", "Arush Sir", "Arush"].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      if (soundEffectsEnabled) soundEffects.playChirp();
                      setFormData({ ...formData, name: preset });
                    }}
                    className={`text-[10px] px-2 py-0.5 rounded-md border transition-all cursor-pointer ${
                      formData.name === preset
                        ? "bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold"
                        : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Title Designation</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400/60 font-sans"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Biometric ID</label>
              <input
                type="text"
                readOnly
                value={formData.biometricId}
                className="w-full bg-black/20 border border-white/5 rounded-xl px-3 py-2 text-slate-400 font-mono cursor-not-allowed"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Acoustic Wake Word</label>
              <input
                type="text"
                value={formData.wakeWord}
                onChange={(e) => setFormData({ ...formData, wakeWord: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400/60 font-mono"
              />
            </div>
          </div>

          {/* Responding Speed Rate & Latency Calibration */}
          <div className="p-4 rounded-2xl border border-white/10 bg-white/5 flex flex-col gap-3 font-mono text-xs shadow-[0_0_15px_rgba(0,0,0,0.2)]">
            <h4 className="text-white font-bold text-xs uppercase pb-2 border-b border-white/5 flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-400" />
              <span>Responding Speed Rate & Latency Engine</span>
            </h4>

            <div>
              <label className="text-slate-400 block mb-1.5 flex items-center justify-between">
                <span>Execution Response Mode</span>
                <span className="text-emerald-400 font-bold">{formData.responseSpeed}</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {[
                  { id: "INSTANT", label: "Instant", desc: "<80ms" },
                  { id: "RAPID", label: "Rapid", desc: "~150ms" },
                  { id: "BALANCED", label: "Balanced", desc: "~350ms" },
                  { id: "DEEP_REASONING", label: "Deep ASI", desc: "~800ms" },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, responseSpeed: mode.id as any })}
                    className={`px-2.5 py-2 rounded-xl text-center border transition-all cursor-pointer ${
                      formData.responseSpeed === mode.id
                        ? "bg-emerald-500/20 border-emerald-400/80 text-emerald-300 shadow-[0_0_10px_rgba(52,211,153,0.3)]"
                        : "bg-black/30 border-white/10 text-slate-400 hover:text-white hover:border-white/20"
                    }`}
                  >
                    <div className="font-bold text-[11px]">{mode.label}</div>
                    <div className="text-[9px] opacity-70">{mode.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex justify-between text-slate-400 mb-1">
                <span className="flex items-center gap-1.5">
                  <Gauge className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Responding Time Speed Rate</span>
                </span>
                <span className="text-emerald-400 font-bold">{formData.responseSpeedRate.toFixed(2)}x Multiplier</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="2.5"
                step="0.05"
                value={formData.responseSpeedRate}
                onChange={(e) => setFormData({ ...formData, responseSpeedRate: parseFloat(e.target.value) })}
                className="w-full accent-emerald-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
                <span>1.0x (Standard)</span>
                <span>1.5x (Fast)</span>
                <span>2.0x (Hyper)</span>
                <span>2.5x (Maximum Turbo)</span>
              </div>
            </div>

            {/* Voice Model & Speech Speed Rate */}
            <div className="pt-2 border-t border-white/5 flex flex-col gap-2.5">
              <div className="flex items-center justify-between gap-2">
                <label className="text-slate-300 font-bold block">
                  Acoustic Voice Persona (Instant Switch & Flow)
                </label>
                <div className="flex items-center gap-1.5">
                  <select
                    value={formData.voicePreference}
                    onChange={(e) => {
                      const nextVoice = e.target.value as VoicePersonaId;
                      const updated = { ...formData, voicePreference: nextVoice };
                      setFormData(updated);
                      onUpdateProfile(updated);
                      speechEngine.previewVoicePersona(
                        nextVoice,
                        updated.autoAdaptLanguage !== false
                          ? updated.detectedLanguage || "en-US"
                          : updated.preferredLanguage || "en-US",
                        updated.voiceSpeed || 1.0,
                        updated.voicePitch || 1.0
                      );
                    }}
                    className="bg-black/60 border border-cyan-400/40 rounded-lg px-2.5 py-1.5 text-white text-[11px] focus:outline-none focus:border-cyan-400 cursor-pointer"
                  >
                    {DRAVIS_VOICE_PROFILES.map((vp) => (
                      <option key={vp.id} value={vp.id} className="bg-slate-950">
                        {vp.name} ({vp.tagline.split("•")[0].trim()})
                      </option>
                    ))}
                    <option value="System" className="bg-slate-950">System Native Browser Voice</option>
                  </select>
                  <button
                    type="button"
                    onClick={() =>
                      speechEngine.previewVoicePersona(
                        formData.voicePreference || "Puck",
                        formData.autoAdaptLanguage !== false
                          ? formData.detectedLanguage || "en-US"
                          : formData.preferredLanguage || "en-US",
                        formData.voiceSpeed || 1.0,
                        formData.voicePitch || 1.0
                      )
                    }
                    className="px-2.5 py-1.5 rounded-lg bg-cyan-400/20 border border-cyan-400/50 text-cyan-200 hover:bg-cyan-400 hover:text-slate-950 font-bold text-[10px] flex items-center gap-1 cursor-pointer transition-all"
                  >
                    <Play className="w-3 h-3" />
                    <span>Preview</span>
                  </button>
                </div>
              </div>

              {/* Quick Voice Persona Flow Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {DRAVIS_VOICE_PROFILES.map((vp) => {
                  const isSelected = formData.voicePreference === vp.id;
                  return (
                    <button
                      key={vp.id}
                      type="button"
                      onClick={() => {
                        const updated = { ...formData, voicePreference: vp.id };
                        setFormData(updated);
                        onUpdateProfile(updated);
                        speechEngine.previewVoicePersona(
                          vp.id,
                          updated.autoAdaptLanguage !== false
                            ? updated.detectedLanguage || "en-US"
                            : updated.preferredLanguage || "en-US",
                          updated.voiceSpeed || 1.0,
                          updated.voicePitch || 1.0
                        );
                      }}
                      className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? "bg-cyan-500/25 border-cyan-400 text-white shadow-[0_0_12px_rgba(34,211,238,0.3)]"
                          : "bg-black/30 border-white/10 text-slate-300 hover:text-white"
                      }`}
                    >
                      <div className="font-bold text-[11px] text-white truncate">{vp.name}</div>
                      <div className="text-[9px] text-cyan-300 truncate">{vp.tagline}</div>
                    </button>
                  );
                })}
              </div>

              <div>
                <div className="flex justify-between text-slate-400 mb-1">
                  <span className="flex items-center gap-1.5">
                    <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Speech Speed Rate</span>
                  </span>
                  <span className="text-cyan-400 font-bold">{formData.voiceSpeed.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="0.75"
                  max="2.0"
                  step="0.05"
                  value={formData.voiceSpeed}
                  onChange={(e) => {
                    const updated = { ...formData, voiceSpeed: parseFloat(e.target.value) };
                    setFormData(updated);
                    onUpdateProfile(updated);
                  }}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold font-mono transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(34,211,238,0.3)] cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{savedSuccess ? "ALL MASTER PREFERENCES SAVED!" : "SAVE MASTER PREFERENCES"}</span>
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

