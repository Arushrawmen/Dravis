/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Central Stage: Greeting Banner, Quick Actions, Genuine Hardware Controls,
 * 3D Arc Reactor Core, System Overview, and Command Input Bar
 */

import React, { useState } from "react";
import {
  Youtube,
  Chrome,
  Camera,
  Power,
  ScanText,
  Mic,
  MicOff,
  Send,
  Sparkles,
  Bot,
  MessageCircle,
  Sheet,
  Wifi,
  Signal,
  Plane,
  Flashlight,
  Bluetooth,
  Phone,
  FolderPlus,
  Calculator,
  Code2,
  Terminal,
} from "lucide-react";
import {
  QuickActionItem,
  SystemTelemetry,
  UserProfile,
  VoiceState,
  DeviceSystemControls,
  NavigationTab,
} from "../types";
import { ArcReactor } from "./ArcReactor";
import { AvatarHologram } from "./AvatarHologram";
import { ScreenMonitorControlStrip } from "./ScreenMonitorControlStrip";
import { soundEffects } from "../utils/audioSynth";
import { GoogleAdSenseBanner } from "./AdSense/GoogleAdSenseBanner";

interface HomeViewProps {
  userProfile: UserProfile;
  voiceState: VoiceState;
  telemetry: SystemTelemetry;
  quickActions: QuickActionItem[];
  onExecuteAction: (action: QuickActionItem) => void;
  onSendCommand: (commandText: string) => void;
  onToggleMic: () => void;
  isListening: boolean;
  latestGreeting?: string;
  latestSubGreeting?: string;
  deviceControls?: DeviceSystemControls;
  onToggleDeviceControl?: (control: keyof DeviceSystemControls) => void;
  onOpenContactsModal?: () => void;
  onCreateRealFolderQuick?: () => void;
  onSelectTab?: (tab: NavigationTab) => void;
  onSpeakEmotionalCheckIn?: (spokenText: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  userProfile,
  voiceState,
  telemetry,
  quickActions,
  onExecuteAction,
  onSendCommand,
  onToggleMic,
  isListening,
  latestGreeting,
  latestSubGreeting,
  deviceControls = {
    wifi: true,
    mobileData: true,
    flightMode: false,
    flashlight: false,
    bluetooth: true,
  },
  onToggleDeviceControl,
  onOpenContactsModal,
  onCreateRealFolderQuick,
  onSelectTab,
  onSpeakEmotionalCheckIn,
}) => {
  const [inputText, setInputText] = useState("");
  const [lastSubmittedCmd, setLastSubmittedCmd] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    if (userProfile.soundEffects) soundEffects.playChirp();
    const cmd = inputText.trim();
    setLastSubmittedCmd(cmd);
    onSendCommand(cmd);
    setInputText("");
  };

  const getQuickIcon = (iconName: string) => {
    switch (iconName) {
      case "Youtube":
        return <Youtube className="w-4 h-4 text-red-500" />;
      case "Chrome":
        return <Chrome className="w-4 h-4 text-cyan-400" />;
      case "Bot":
        return <Bot className="w-4 h-4 text-emerald-400" />;
      case "MessageCircle":
        return <MessageCircle className="w-4 h-4 text-green-400" />;
      case "Sheet":
        return <Sheet className="w-4 h-4 text-teal-400" />;
      case "Camera":
        return <Camera className="w-4 h-4 text-amber-400" />;
      case "Power":
        return <Power className="w-4 h-4 text-red-400" />;
      case "ScanText":
        return <ScanText className="w-4 h-4 text-purple-400" />;
      default:
        return <Sparkles className="w-4 h-4 text-cyan-400" />;
    }
  };

  return (
    <div
      id="dravis-home-view"
      className="flex-1 flex flex-col justify-between p-3 sm:p-5 overflow-y-auto gap-3 relative"
    >
      {/* 1. Top Section: Dravis Living World Bar (Home & Garden) + Flame-Spirit Body + Human Emotions */}
      <AvatarHologram
        userName={userProfile.name || "Boss"}
        voiceState={voiceState}
        greetingText={latestGreeting}
        subGreetingText={
          latestSubGreeting ||
          "System status is 100% optimal. Ready for your next command."
        }
        isListening={isListening}
        lastUserCommand={lastSubmittedCmd}
        liveUserInput={inputText}
        onClickAvatar={() => {
          if (userProfile.soundEffects) soundEffects.playWakeWordPing();
          onToggleMic();
        }}
        onSpeakEmotionalCheckIn={(text) => {
          if (userProfile.soundEffects) soundEffects.playChirp();
          onSpeakEmotionalCheckIn?.(text);
        }}
      />

      {/* 1B. GENUINE DEVICE & HARDWARE CONTROLS BAR (1:1 Parity with Android Mode) */}
      <div
        id="hud-hardware-controls-bar"
        className="w-full rounded-2xl border border-cyan-500/25 bg-slate-950/65 backdrop-blur-2xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 shadow-[0_0_20px_rgba(6,182,212,0.1)]"
      >
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono font-bold text-cyan-300 uppercase tracking-wider">
            DEVICE & HARDWARE CONTROLS
          </span>
          <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-400/30">
            TOUCH + VOICE ACTIVE
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onToggleDeviceControl?.("wifi")}
            className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              deviceControls.wifi
                ? "bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-[0_0_12px_rgba(34,211,238,0.3)]"
                : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
            }`}
            title="Toggle Genuine Wi-Fi & OS Network Panel"
          >
            <Wifi className="w-3.5 h-3.5" />
            <span>Wi-Fi: {deviceControls.wifi ? "ON" : "OFF"}</span>
          </button>

          <button
            type="button"
            onClick={() => onToggleDeviceControl?.("mobileData")}
            className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              deviceControls.mobileData
                ? "bg-emerald-500/20 border-emerald-400 text-emerald-200 shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
            }`}
            title="Toggle Cellular / Mobile Data"
          >
            <Signal className="w-3.5 h-3.5" />
            <span>Data: {deviceControls.mobileData ? "ON" : "OFF"}</span>
          </button>

          <button
            type="button"
            onClick={() => onToggleDeviceControl?.("flightMode")}
            className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              deviceControls.flightMode
                ? "bg-amber-500/20 border-amber-400 text-amber-200 shadow-[0_0_12px_rgba(245,158,11,0.3)]"
                : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
            }`}
            title="Toggle Flight / Airplane Mode"
          >
            <Plane className="w-3.5 h-3.5" />
            <span>Flight: {deviceControls.flightMode ? "ON" : "OFF"}</span>
          </button>

          <button
            type="button"
            onClick={() => onToggleDeviceControl?.("flashlight")}
            className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              deviceControls.flashlight
                ? "bg-yellow-400/25 border-yellow-300 text-yellow-200 shadow-[0_0_15px_rgba(250,204,21,0.45)]"
                : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
            }`}
            title="Toggle Camera LED Torch / Flashlight"
          >
            <Flashlight className="w-3.5 h-3.5" />
            <span>Torch: {deviceControls.flashlight ? "ON" : "OFF"}</span>
          </button>

          <button
            type="button"
            onClick={() => onToggleDeviceControl?.("bluetooth")}
            className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              deviceControls.bluetooth
                ? "bg-blue-500/20 border-blue-400 text-blue-200 shadow-[0_0_12px_rgba(59,130,246,0.3)]"
                : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
            }`}
            title="Toggle Bluetooth & Pair Device"
          >
            <Bluetooth className="w-3.5 h-3.5" />
            <span>BT: {deviceControls.bluetooth ? "ON" : "OFF"}</span>
          </button>

          {onOpenContactsModal && (
            <button
              type="button"
              onClick={onOpenContactsModal}
              className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/50 text-emerald-300 font-mono text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              title="Open Country-Code Phone Dialer (+91) & Contacts"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Call (+91)</span>
            </button>
          )}

          {onCreateRealFolderQuick && (
            <button
              type="button"
              onClick={onCreateRealFolderQuick}
              className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 text-amber-300 font-mono text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              title="Create Real Folder on PC / Phone via File System Access API"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              <span>Real Folder</span>
            </button>
          )}
        </div>
      </div>

      {/* 1C. LIVE SCREEN MONITOR, HANDS-FREE VOICE CLICKER & MEDIA FORGE STRIP */}
      <ScreenMonitorControlStrip
        onSendCommand={onSendCommand}
        onSelectTab={onSelectTab}
      />

      {/* 2. Middle Section: 3-Column Sub-grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center my-auto py-1">
        {/* Left Column: Quick Actions & Direct App Launcher */}
        <div
          id="hud-quick-actions-card"
          className="lg:col-span-3 rounded-2xl border border-white/10 bg-slate-950/60 backdrop-blur-md p-3 sm:p-4 flex flex-col gap-2.5 shadow-[0_0_20px_rgba(0,0,0,0.3)]"
        >
          <div className="flex items-center justify-between pb-1 border-b border-white/10">
            <span className="text-[11px] font-mono font-bold text-cyan-400 uppercase tracking-widest">
              QUICK ACTIONS & APPS
            </span>
            <span className="text-[9px] font-mono text-emerald-400 uppercase">
              INSTANT LAUNCH
            </span>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-1 gap-1.5">
            {quickActions.map((action) => (
              <button
                key={action.id}
                id={`quick-action-${action.id}`}
                onClick={() => {
                  if (userProfile.soundEffects) soundEffects.playChirp();
                  onExecuteAction(action);
                }}
                className="flex items-center justify-between px-3 py-2 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 hover:border-cyan-400/40 transition-all duration-200 group text-left cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-white/5 group-hover:scale-110 transition-transform">
                    {getQuickIcon(action.iconName)}
                  </div>
                  <span className="text-xs font-medium text-slate-200 group-hover:text-white">
                    {action.name}
                  </span>
                </div>
                <span className="text-[9px] font-mono text-slate-400 group-hover:text-cyan-400 uppercase">
                  {action.type}
                </span>
              </button>
            ))}

            {/* Built-in System Utility App Launchers */}
            <div className="grid grid-cols-3 gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => onSendCommand("open calculator")}
                className="p-2 rounded-xl border border-amber-400/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-mono text-[10px] font-bold flex flex-col items-center gap-1 cursor-pointer"
              >
                <Calculator className="w-3.5 h-3.5" />
                <span>Calc</span>
              </button>
              <button
                type="button"
                onClick={() => onSendCommand("open vs code")}
                className="p-2 rounded-xl border border-cyan-400/30 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 font-mono text-[10px] font-bold flex flex-col items-center gap-1 cursor-pointer"
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>Code</span>
              </button>
              <button
                type="button"
                onClick={() => onSendCommand("open terminal")}
                className="p-2 rounded-xl border border-purple-400/30 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 font-mono text-[10px] font-bold flex flex-col items-center gap-1 cursor-pointer"
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>Shell</span>
              </button>
            </div>
          </div>
        </div>

        {/* Center Column: Quantum Holographic Arc Reactor Core */}
        <div className="lg:col-span-6 flex items-center justify-center py-2">
          <ArcReactor
            voiceState={voiceState}
            onClick={() => {
              if (userProfile.soundEffects) soundEffects.playActivatePulse();
              onToggleMic();
            }}
            statusText="ONLINE"
          />
        </div>

        {/* Right Column: System Overview & DRAVIS Power Gauge */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          <div
            id="hud-system-overview-card"
            className="rounded-2xl border border-white/10 bg-slate-950/60 backdrop-blur-md p-3 sm:p-4 flex flex-col gap-2.5 shadow-[0_0_20px_rgba(0,0,0,0.3)]"
          >
            <span className="text-[11px] font-mono font-bold text-cyan-400 uppercase tracking-widest pb-1 border-b border-white/10">
              SYSTEM OVERVIEW
            </span>

            <div className="flex flex-col gap-2 font-mono text-xs tabular-nums">
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-400">OS</span>
                <span className="text-slate-200 font-semibold">{telemetry.os}</span>
              </div>

              <div className="flex justify-between text-slate-300">
                <span className="text-slate-400">CPU</span>
                <span className="text-cyan-400 font-bold">{telemetry.cpu}</span>
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-400">RAM</span>
                  <span className="text-white font-bold">{telemetry.ram}</span>
                </div>
                <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${telemetry.ramRaw}%` }}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-400">DISK</span>
                  <span className="text-white font-bold">{telemetry.disk}</span>
                </div>
                <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden">
                  <div
                    className="bg-cyan-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${telemetry.diskRaw}%` }}
                  />
                </div>
              </div>

              <div className="flex justify-between text-slate-300">
                <span className="text-slate-400">NETWORK</span>
                <span className="text-emerald-400 font-semibold">
                  {deviceControls.flightMode
                    ? "FLIGHT MODE"
                    : deviceControls.wifi
                    ? telemetry.network
                    : deviceControls.mobileData
                    ? "5G CELLULAR"
                    : "OFFLINE"}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-white/10">
              <svg className="w-full h-8 text-cyan-400" viewBox="0 0 200 40">
                <defs>
                  <linearGradient id="sparklineGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path
                  d="M 0 30 Q 30 15, 60 25 T 120 10 T 170 20 L 200 15 L 200 40 L 0 40 Z"
                  fill="url(#sparklineGrad)"
                />
                <path
                  d="M 0 30 Q 30 15, 60 25 T 120 10 T 170 20 L 200 15"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="drop-shadow-[0_0_6px_rgba(34,211,238,0.8)]"
                />
              </svg>
            </div>
          </div>

          <div
            id="hud-dravis-power-card"
            className="rounded-2xl border border-white/10 bg-slate-950/60 backdrop-blur-md p-3 sm:p-4 flex flex-col items-center justify-center text-center shadow-[0_0_20px_rgba(0,0,0,0.3)]"
          >
            <span className="text-[11px] font-mono font-bold text-cyan-400 uppercase tracking-widest mb-2">
              DRAVIS POWER
            </span>

            <div className="relative w-24 h-24 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <circle
                  cx="18"
                  cy="18"
                  r="15"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  className="text-white/10"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="15"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeDasharray="94.2"
                  strokeDashoffset={94.2 - (94.2 * telemetry.power) / 100}
                  strokeLinecap="round"
                  className="text-cyan-400 drop-shadow-[0_0_6px_rgba(34,211,238,0.9)]"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-bold text-white font-mono tabular-nums leading-none drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]">
                  {telemetry.power}%
                </span>
                <span className="text-[9px] font-mono text-cyan-400 font-bold uppercase mt-1">
                  OPTIMAL
                </span>
              </div>
            </div>
          </div>

          {/* GOOGLE ADSENSE SPONSORED UNIT (ca-pub-2203384651585087) */}
          <GoogleAdSenseBanner
            client="ca-pub-2203384651585087"
            adSlot="1002003004"
            variant="SIDEBAR_BOX"
          />
        </div>
      </div>

      {/* 3. Bottom Section: Command Input Bar with Glowing Mic */}
      <div
        id="hud-command-input-container"
        className="w-full rounded-2xl border border-white/10 bg-slate-950/65 backdrop-blur-xl p-2.5 sm:p-3 shadow-[0_0_25px_rgba(0,0,0,0.4)] flex flex-col gap-2"
      >
        <form onSubmit={handleSubmit} className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            id="hud-mic-button"
            onClick={() => {
              if (userProfile.soundEffects) soundEffects.playWakeWordPing();
              onToggleMic();
            }}
            className={`relative p-3 rounded-xl border transition-all duration-300 flex-shrink-0 cursor-pointer ${
              isListening
                ? "bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-[0_0_20px_rgba(52,211,153,0.5)] animate-pulse"
                : "bg-white/5 border-white/10 text-cyan-400 hover:bg-white/10 hover:border-cyan-400/40 shadow-[0_0_15px_rgba(34,211,238,0.2)]"
            }`}
            title={isListening ? "Listening... (Click to stop)" : "Click to speak to Dravis"}
          >
            {isListening ? (
              <Mic className="w-5 h-5 animate-bounce" />
            ) : (
              <MicOff className="w-5 h-5" />
            )}
            {isListening && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            )}
          </button>

          <div className="relative flex-1">
            <input
              id="hud-command-input"
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Command Dravis... ('Call +91 9876543210', 'Turn on Torch', 'Open YouTube', 'Create folder MyProject')"
              className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm sm:text-base text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400/60 focus:ring-1 focus:ring-cyan-400/30 transition-all font-sans"
            />
          </div>

          <button
            type="submit"
            id="hud-send-button"
            className="p-3 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold transition-all shadow-[0_0_15px_rgba(34,211,238,0.4)] flex-shrink-0 flex items-center justify-center group cursor-pointer"
            title="Execute Command"
          >
            <Send className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </button>
        </form>

        {/* Quick Suggestion Chips */}
        <div className="hidden sm:flex items-center gap-2 overflow-x-auto pb-1 text-[11px] font-mono">
          <span className="text-slate-400 uppercase font-semibold text-[10px]">Try:</span>
          {[
            "Call +91 9876543210",
            "Turn on Torch",
            "Open Calculator",
            "Open YouTube",
            "Create folder /Dravis_AI and file app.py",
            "Switch to Android Mode",
          ].map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                if (userProfile.soundEffects) soundEffects.playChirp();
                onSendCommand(prompt);
              }}
              className="px-2.5 py-1 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 text-slate-300 hover:text-white whitespace-nowrap transition-all cursor-pointer"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
