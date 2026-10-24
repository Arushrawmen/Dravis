/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Dynamic Island NOTCH for Dravis Master HUD
 * Centered camera punch-hole with animated responsive Dravis expressions, 
 * instant direct phone calling HUD, multi-number contact expansion notch, and real-time status.
 */

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Youtube,
  Globe,
  Bot,
  MessageCircle,
  FileSpreadsheet,
  Camera,
  Mic,
  Activity,
  Zap,
  Volume2,
  Phone,
  PhoneCall,
  PhoneOff,
  MicOff,
  VolumeX,
  X,
  ChevronRight,
  User,
  Music,
  Play,
  Pause,
  SkipForward,
  Wifi,
  Radio,
  Plane,
  Flashlight,
  Bluetooth,
} from "lucide-react";
import { VoiceState, ActiveCallState, ContactSelectionPrompt, MusicPlaybackState } from "../types";
import { speechEngine } from "../utils/speech";

export interface DynamicNotchProps {
  voiceState: VoiceState;
  isListening: boolean;
  activeAppIcon?: string | null;
  activeAppTitle?: string | null;
  statusText?: string;
  onTapNotch?: () => void;
  activeCall?: ActiveCallState | null;
  contactPrompt?: ContactSelectionPrompt | null;
  onSelectPhoneNumber?: (number: string, label: string) => void;
  onEndCall?: () => void;
  onToggleMute?: () => void;
  onToggleSpeaker?: () => void;
  onToggleRecording?: () => void;
  onCancelContactPrompt?: () => void;
  musicPlayback?: MusicPlaybackState | null;
  onTogglePlayMusic?: () => void;
  onNextTrack?: () => void;
  onCloseMusic?: () => void;
  deviceStatusFeedback?: { label: string; active: boolean; type: "WIFI" | "DATA" | "FLIGHT" | "TORCH" | "BT" } | null;
}

export const DynamicIslandNotch: React.FC<DynamicNotchProps> = ({
  voiceState,
  isListening,
  activeAppIcon,
  activeAppTitle,
  statusText,
  onTapNotch,
  activeCall,
  contactPrompt,
  onSelectPhoneNumber,
  onEndCall,
  onToggleMute,
  onToggleSpeaker,
  onToggleRecording,
  onCancelContactPrompt,
  musicPlayback,
  onTogglePlayMusic,
  onNextTrack,
  onCloseMusic,
  deviceStatusFeedback,
}) => {
  const isMultiNumberExpanded = Boolean(contactPrompt?.isOpen);
  const isCallActive = Boolean(activeCall?.isActive);
  const isMusicActive = Boolean(musicPlayback?.isPlaying || (musicPlayback && musicPlayback.currentTime > 0));
  const isDeviceStatusActive = Boolean(deviceStatusFeedback);
  const [isEngineSpeaking, setIsEngineSpeaking] = useState<boolean>(() => speechEngine.isSpeaking());
  const isSpeakingResponse = voiceState === "SPEAKING" || isEngineSpeaking;

  const isExpanded =
    isMultiNumberExpanded ||
    isCallActive ||
    isMusicActive ||
    isDeviceStatusActive ||
    isListening ||
    isSpeakingResponse ||
    voiceState === "THINKING" ||
    Boolean(activeAppTitle);

  const [speechVolume, setSpeechVolume] = useState<number>(0);
  const [waveformBands, setWaveformBands] = useState<number[]>([
    0.15, 0.25, 0.4, 0.6, 0.75, 0.6, 0.4, 0.25, 0.15,
  ]);
  const [wavePhase, setWavePhase] = useState<number>(0);

  useEffect(() => {
    setIsEngineSpeaking(speechEngine.isSpeaking());
    return speechEngine.subscribeSpeakingState((speaking) => {
      setIsEngineSpeaking(speaking);
    });
  }, []);

  // Sample real-time speechEngine output volume & frequency bands during voice responses
  useEffect(() => {
    if (!isSpeakingResponse) {
      setSpeechVolume(0);
      setWaveformBands([0.12, 0.14, 0.16, 0.18, 0.2, 0.18, 0.16, 0.14, 0.12]);
      return;
    }

    let rafId: number | null = null;
    let lastUpdate = 0;

    const tick = (now: number) => {
      if (now - lastUpdate >= 32) {
        lastUpdate = now;
        const vol = speechEngine.getOutputVolume();
        const bands = speechEngine.getOutputWaveformBands(9);
        setSpeechVolume(vol > 0 ? vol : 0.35 + 0.2 * Math.sin(now / 140));
        setWaveformBands(bands);
        setWavePhase((now / 110) % (Math.PI * 2));
      }
      if (voiceState === "SPEAKING" || speechEngine.isSpeaking()) {
        rafId = requestAnimationFrame(tick);
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [isSpeakingResponse, voiceState]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  // Render Dravis Face Emoji & Mouth Animation
  const renderDravisFace = () => {
    if (isCallActive) {
      return (
        <div className="flex items-center gap-1.5">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 1.2 }}
            className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-400/60 flex items-center justify-center text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.5)]"
          >
            <PhoneCall className="w-3.5 h-3.5" />
          </motion.div>
        </div>
      );
    }

    if (isMusicActive) {
      return (
        <div className="flex items-center gap-1">
          <motion.div
            animate={{ rotate: musicPlayback?.isPlaying ? 360 : 0 }}
            transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
            className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.6)]"
          >
            <Music className="w-3.5 h-3.5" />
          </motion.div>
        </div>
      );
    }

    if (deviceStatusFeedback) {
      return (
        <div className="w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-400 flex items-center justify-center text-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.5)]">
          {deviceStatusFeedback.type === "TORCH" ? (
            <Flashlight className="w-3.5 h-3.5 text-amber-300" />
          ) : deviceStatusFeedback.type === "WIFI" ? (
            <Wifi className="w-3.5 h-3.5" />
          ) : deviceStatusFeedback.type === "FLIGHT" ? (
            <Plane className="w-3.5 h-3.5 text-amber-400" />
          ) : deviceStatusFeedback.type === "DATA" ? (
            <Radio className="w-3.5 h-3.5" />
          ) : (
            <Bluetooth className="w-3.5 h-3.5" />
          )}
        </div>
      );
    }

    if (isSpeakingResponse) {
      const mouthScaleY = 1 + speechVolume * 1.45;
      const mouthScaleX = 1 + speechVolume * 0.22;
      return (
        <div className="flex items-center gap-1">
          {/* Animated smiling face with volume-reactive mouth movement */}
          <div className="relative w-5 h-5 flex items-center justify-center">
            {/* Eyes */}
            <motion.div
              className="absolute top-1 left-0.5 w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_6px_#fff]"
              animate={{ scaleY: [1, 0.2, 1] }}
              transition={{ repeat: Infinity, duration: 2.2 }}
            />
            <motion.div
              className="absolute top-1 right-0.5 w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_6px_#fff]"
              animate={{ scaleY: [1, 0.2, 1] }}
              transition={{ repeat: Infinity, duration: 2.2 }}
            />
            {/* Volume-driven Talking Smile / Mouth */}
            <motion.div
              className="absolute bottom-0.5 w-3 h-2 border-b-2 border-white rounded-b-full"
              animate={{
                scaleY: mouthScaleY,
                scaleX: mouthScaleX,
              }}
              transition={{
                duration: 0.06,
                ease: "easeOut",
              }}
            />
          </div>
          {/* Acoustic Waveform mini bars beside smile driven by speechEngine output volume */}
          <div className="flex items-center gap-0.5 h-3.5 ml-1">
            {waveformBands.slice(2, 7).map((bandLevel, i) => {
              const barPx = Math.max(3, Math.round(bandLevel * 14));
              return (
                <motion.span
                  key={i}
                  className="w-0.5 bg-cyan-400 rounded-full shadow-[0_0_6px_rgba(34,211,238,0.65)]"
                  animate={{
                    height: `${barPx}px`,
                    opacity: 0.55 + bandLevel * 0.45,
                  }}
                  transition={{
                    duration: 0.06,
                    ease: "easeOut",
                  }}
                />
              );
            })}
          </div>
        </div>
      );
    }

    if (isListening || voiceState === "LISTENING") {
      return (
        <div className="flex items-center gap-1">
          {/* Attentive, listening happy face */}
          <div className="relative w-5 h-5 flex items-center justify-center">
            <motion.div
              className="absolute top-1 left-0.5 w-1.5 h-1.5 rounded-full bg-cyan-300 shadow-[0_0_8px_#22d3ee]"
              animate={{ scale: [1, 1.25, 1] }}
              transition={{ repeat: Infinity, duration: 1 }}
            />
            <motion.div
              className="absolute top-1 right-0.5 w-1.5 h-1.5 rounded-full bg-cyan-300 shadow-[0_0_8px_#22d3ee]"
              animate={{ scale: [1, 1.25, 1] }}
              transition={{ repeat: Infinity, duration: 1 }}
            />
            <motion.div
              className="absolute bottom-1 w-3.5 h-1.5 border-b-2 border-cyan-300 rounded-b-full"
              animate={{ scaleX: [1, 1.15, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            />
          </div>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping shadow-[0_0_6px_#34d399]" />
        </div>
      );
    }

    if (voiceState === "THINKING") {
      return (
        <div className="flex items-center gap-1">
          <div className="relative w-5 h-5 flex items-center justify-center">
            <motion.div
              className="absolute top-1 left-0.5 w-1.5 h-1.5 rounded-full bg-amber-300 shadow-[0_0_8px_#fde047]"
              animate={{ y: [-0.5, 0.5, -0.5] }}
              transition={{ repeat: Infinity, duration: 0.8 }}
            />
            <motion.div
              className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-amber-300 shadow-[0_0_8px_#fde047]"
              animate={{ y: [0.5, -0.5, 0.5] }}
              transition={{ repeat: Infinity, duration: 0.8 }}
            />
            <motion.div
              className="absolute bottom-1 w-2.5 h-1 border-b-2 border-amber-300 rounded-full"
              animate={{ rotate: [-6, 6, -6] }}
              transition={{ repeat: Infinity, duration: 1.2 }}
            />
          </div>
          <motion.span
            className="w-1.5 h-1.5 rounded-full bg-amber-400"
            animate={{ scale: [0.8, 1.3, 0.8] }}
            transition={{ repeat: Infinity, duration: 0.6 }}
          />
        </div>
      );
    }

    // Default: Online Idle Pleasant White Smiling Face
    return (
      <div className="flex items-center gap-1">
        <div className="relative w-4.5 h-4.5 flex items-center justify-center">
          <motion.div
            className="absolute top-1 left-0.5 w-1 h-1 rounded-full bg-white shadow-[0_0_4px_#fff]"
            animate={{ scaleY: [1, 1, 0.1, 1, 1] }}
            transition={{ repeat: Infinity, duration: 4, times: [0, 0.9, 0.93, 0.96, 1] }}
          />
          <motion.div
            className="absolute top-1 right-0.5 w-1 h-1 rounded-full bg-white shadow-[0_0_4px_#fff]"
            animate={{ scaleY: [1, 1, 0.1, 1, 1] }}
            transition={{ repeat: Infinity, duration: 4, times: [0, 0.9, 0.93, 0.96, 1] }}
          />
          <div className="absolute bottom-1 w-2.5 h-1 border-b-1.5 border-white rounded-b-full" />
        </div>
      </div>
    );
  };

  // Render Right-Side Indicator Icon
  const renderAppIcon = () => {
    if (isCallActive) {
      return (
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (onEndCall) onEndCall();
          }}
          className="w-6 h-6 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-[0_0_10px_rgba(239,68,68,0.7)] transition-all cursor-pointer"
          title="End Call"
        >
          <PhoneOff className="w-3.5 h-3.5" />
        </button>
      );
    }

    if (!activeAppIcon) {
      if (isSpeakingResponse) {
        return (
          <div
            className="flex items-center gap-1.5 px-1.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-400/25"
            title={`Speech Output Level: ${Math.round(speechVolume * 100)}%`}
          >
            <div className="flex items-center gap-[2px] h-3.5">
              {waveformBands.map((level, idx) => {
                const heightPx = Math.max(2, Math.round(level * 13));
                const isCenter = idx >= 3 && idx <= 5;
                return (
                  <motion.span
                    key={idx}
                    className={`w-[2px] rounded-full ${
                      isCenter
                        ? "bg-gradient-to-t from-cyan-400 via-teal-300 to-white shadow-[0_0_6px_rgba(34,211,238,0.8)]"
                        : "bg-cyan-400/75"
                    }`}
                    animate={{
                      height: `${heightPx}px`,
                      opacity: 0.45 + level * 0.55,
                    }}
                    transition={{
                      duration: 0.055,
                      ease: "easeOut",
                    }}
                  />
                );
              })}
            </div>
            <Volume2
              className="w-3 h-3 text-cyan-300 transition-transform duration-75"
              style={{
                transform: `scale(${1 + speechVolume * 0.18})`,
                filter: `drop-shadow(0 0 ${Math.round(2 + speechVolume * 6)}px rgba(34,211,238,0.85))`,
              }}
            />
          </div>
        );
      }
      if (isListening || voiceState === "LISTENING") {
        return <Mic className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />;
      }
      if (voiceState === "THINKING") {
        return <Zap className="w-3.5 h-3.5 text-amber-400 animate-spin" />;
      }
      return <Activity className="w-3.5 h-3.5 text-cyan-400 opacity-80" />;
    }

    const lower = activeAppIcon.toLowerCase();
    if (lower.includes("youtube")) {
      return (
        <div className="w-5 h-5 rounded-full bg-red-600/90 flex items-center justify-center shadow-[0_0_8px_rgba(239,68,68,0.7)]">
          <Youtube className="w-3 h-3 text-white fill-current" />
        </div>
      );
    }
    if (lower.includes("chrome") || lower.includes("google") || lower.includes("browser")) {
      return (
        <div className="w-5 h-5 rounded-full bg-blue-600/90 flex items-center justify-center shadow-[0_0_8px_rgba(37,99,235,0.7)]">
          <Globe className="w-3 h-3 text-white" />
        </div>
      );
    }
    if (lower.includes("chatgpt") || lower.includes("openai")) {
      return (
        <div className="w-5 h-5 rounded-full bg-emerald-600/90 flex items-center justify-center shadow-[0_0_8px_rgba(16,185,129,0.7)]">
          <Bot className="w-3 h-3 text-white" />
        </div>
      );
    }
    if (lower.includes("whatsapp")) {
      return (
        <div className="w-5 h-5 rounded-full bg-green-500/90 flex items-center justify-center shadow-[0_0_8px_rgba(34,197,94,0.7)]">
          <MessageCircle className="w-3 h-3 text-white fill-current" />
        </div>
      );
    }
    if (lower.includes("excel")) {
      return (
        <div className="w-5 h-5 rounded-full bg-emerald-700/90 flex items-center justify-center shadow-[0_0_8px_rgba(4,120,87,0.7)]">
          <FileSpreadsheet className="w-3 h-3 text-white" />
        </div>
      );
    }
    if (lower.includes("camera")) {
      return (
        <div className="w-5 h-5 rounded-full bg-slate-700/90 flex items-center justify-center shadow-[0_0_8px_rgba(100,116,139,0.7)]">
          <Camera className="w-3 h-3 text-white" />
        </div>
      );
    }

    return (
      <div className="w-5 h-5 rounded-full bg-cyan-600/90 flex items-center justify-center shadow-[0_0_8px_rgba(6,182,212,0.7)]">
        <Zap className="w-3 h-3 text-white" />
      </div>
    );
  };

  return (
    <div
      id="dravis-dynamic-island-notch-container"
      className="fixed top-1 left-1/2 -translate-x-1/2 z-50 flex items-center justify-center pointer-events-auto select-none"
    >
      <motion.div
        layout
        onClick={onTapNotch}
        initial={{ width: 150, height: 34, borderRadius: 18 }}
        animate={{
          width: isMultiNumberExpanded
            ? 360
            : isCallActive
            ? 340
            : isMusicActive
            ? 350
            : isDeviceStatusActive
            ? 310
            : isExpanded
            ? 290
            : 160,
          height: isMultiNumberExpanded
            ? "auto"
            : isCallActive
            ? 72
            : isMusicActive
            ? 74
            : isDeviceStatusActive
            ? 44
            : isExpanded
            ? 42
            : 34,
          borderRadius: isMultiNumberExpanded ? 24 : isCallActive || isMusicActive ? 24 : 20,
          boxShadow: isMultiNumberExpanded
            ? "0 20px 40px -10px rgba(0, 0, 0, 0.9), 0 0 25px rgba(34, 211, 238, 0.4), inset 0 0 1px 1px rgba(255, 255, 255, 0.2)"
            : isCallActive
            ? "0 15px 35px -5px rgba(0, 0, 0, 0.9), 0 0 20px rgba(16, 185, 129, 0.4), inset 0 0 1px 1px rgba(255, 255, 255, 0.15)"
            : isMusicActive
            ? "0 15px 35px -5px rgba(0, 0, 0, 0.9), 0 0 22px rgba(30, 215, 96, 0.45), inset 0 0 1px 1px rgba(255, 255, 255, 0.2)"
            : isDeviceStatusActive
            ? "0 10px 25px -5px rgba(0, 0, 0, 0.8), 0 0 18px rgba(34, 211, 238, 0.5), inset 0 0 1px 1px rgba(255, 255, 255, 0.2)"
            : isExpanded
            ? "0 10px 25px -5px rgba(0, 0, 0, 0.8), 0 0 15px rgba(34, 211, 238, 0.4), inset 0 0 1px 1px rgba(255, 255, 255, 0.15)"
            : "0 4px 12px rgba(0, 0, 0, 0.9), 0 0 8px rgba(0, 0, 0, 0.6), inset 0 0 1px 1px rgba(255, 255, 255, 0.1)",
        }}
        transition={{
          type: "spring",
          stiffness: 420,
          damping: 30,
        }}
        className="bg-black/95 text-white p-2.5 flex flex-col cursor-pointer border border-cyan-500/30 hover:border-cyan-400/60 transition-colors backdrop-blur-3xl overflow-hidden"
      >
        {/* TOP ROW: Face / Camera / Status / Icon */}
        <div className="w-full flex items-center justify-between gap-2">
          {/* Left: Animated Dravis Smiling Emoji, Calling Indicator, or Music Icon */}
          <div className="flex items-center gap-1.5 z-10 shrink-0">
            {renderDravisFace()}
          </div>

          {/* Center: The Physical Camera Lens / Hole Punch Sensor */}
          <div className="relative flex items-center justify-center z-20 shrink-0 mx-1">
            <div className="w-4 h-4 rounded-full bg-[#0a0a0f] border border-[#222] flex items-center justify-center shadow-inner">
              <div className="w-2.5 h-2.5 rounded-full bg-[#030712] relative flex items-center justify-center overflow-hidden">
                <span className="w-1 h-1 rounded-full bg-cyan-900/60" />
                <span className="absolute top-0.5 right-0.5 w-0.5 h-0.5 rounded-full bg-cyan-200/50" />
              </div>
            </div>
            {isListening && (
              <span className="absolute -inset-1 rounded-full bg-cyan-400/20 animate-ping pointer-events-none" />
            )}
          </div>

          {/* Middle Text: Dynamic Status / Call Details / Music / Hardware Status */}
          <div className="flex-1 flex flex-col justify-center px-1 overflow-hidden text-left">
            {isCallActive ? (
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[11px] font-mono font-bold text-white truncate">
                    {activeCall?.contactName || activeCall?.number}
                  </span>
                  <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {activeCall?.status}
                  </span>
                </div>
                <div className="text-[9px] font-mono text-cyan-300/80 flex items-center gap-2">
                  <span>{activeCall?.number}</span>
                  <span>•</span>
                  <span className="text-white font-bold">{formatDuration(activeCall?.durationSeconds || 0)}</span>
                </div>
              </div>
            ) : isMusicActive ? (
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1ed760] animate-pulse" />
                  <span className="text-[11px] font-mono font-bold text-white truncate">
                    {musicPlayback?.title || "Dravis Spotify Track"}
                  </span>
                  <span className="text-[8px] font-mono px-1 rounded bg-[#1ed760]/20 text-[#1ed760] border border-[#1ed760]/30 font-bold">
                    SPOTIFY
                  </span>
                </div>
                <span className="text-[9px] font-mono text-emerald-300/90 truncate block">
                  {musicPlayback?.artist || "The Weeknd • Synthwave"}
                </span>
              </div>
            ) : isDeviceStatusActive ? (
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                  <span className="text-[11px] font-mono font-bold text-white tracking-wide">
                    {deviceStatusFeedback?.label}
                  </span>
                </div>
                <span className="text-[9px] font-mono text-cyan-300/80">
                  {deviceStatusFeedback?.active ? "Active & Synchronized" : "Disabled"}
                </span>
              </div>
            ) : isMultiNumberExpanded ? (
              <div>
                <span className="text-[11px] font-mono font-bold text-cyan-300 truncate leading-none">
                  {contactPrompt?.contact.name}
                </span>
                <span className="text-[8px] font-mono text-slate-300/80 block mt-0.5">
                  Multiple numbers saved • Select to call
                </span>
              </div>
            ) : (
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 6 }}
                    transition={{ duration: 0.2 }}
                  >
                    <span className="text-[10px] font-mono font-bold text-white truncate leading-none block">
                      {activeAppTitle ||
                        (isSpeakingResponse
                          ? "Dravis Speaking"
                          : isListening
                          ? "Listening..."
                          : "Dravis ASI")}
                    </span>
                    {isSpeakingResponse ? (
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <svg
                          viewBox="0 0 96 10"
                          className="w-20 h-2.5 overflow-visible shrink-0"
                          aria-hidden="true"
                        >
                          <path
                            d={(() => {
                              const pts: string[] = [];
                              const steps = 16;
                              for (let i = 0; i <= steps; i++) {
                                const x = (i / steps) * 96;
                                const bandIdx = Math.min(
                                  waveformBands.length - 1,
                                  Math.floor((i / steps) * waveformBands.length)
                                );
                                const env = Math.sin((i / steps) * Math.PI);
                                const amp =
                                  (0.8 + speechVolume * 3.6) *
                                  (0.5 + (waveformBands[bandIdx] || 0.2) * 0.6) *
                                  env;
                                const y = 5 + Math.sin(wavePhase + i * 0.95) * amp;
                                pts.push(`${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(2)}`);
                              }
                              return pts.join(" ");
                            })()}
                            fill="none"
                            stroke="rgba(34, 211, 238, 0.85)"
                            strokeWidth="1.35"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <span className="text-[8px] font-mono text-cyan-300/75 truncate">
                          {Math.round(speechVolume * 100)}%
                        </span>
                      </div>
                    ) : (
                      <span className="text-[8px] font-mono text-cyan-300/80 truncate block mt-0.5">
                        {statusText || (isListening ? "Say 'Hey Dravis...'" : "Dynamic Island Active")}
                      </span>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </div>

          {/* Right: End Call, Music Controls, or App Icon */}
          <div className="flex items-center justify-end z-10 shrink-0 ml-1">
            {isMusicActive ? (
              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onTogglePlayMusic) onTogglePlayMusic();
                  }}
                  className="p-1.5 rounded-full bg-[#1ed760]/20 hover:bg-[#1ed760]/40 text-[#1ed760] border border-[#1ed760]/50 transition-colors"
                  title={musicPlayback?.isPlaying ? "Pause" : "Play"}
                >
                  {musicPlayback?.isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 fill-current" />}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onNextTrack) onNextTrack();
                  }}
                  className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
                  title="Next Track"
                >
                  <SkipForward className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onCloseMusic) onCloseMusic();
                  }}
                  className="p-1 rounded-full text-slate-400 hover:text-white transition-colors"
                  title="Close Player"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                {activeAppIcon && isSpeakingResponse && (
                  <div
                    className="flex items-center gap-[2px] h-3.5 px-1"
                    title={`Speech Output Level: ${Math.round(speechVolume * 100)}%`}
                  >
                    {waveformBands.slice(1, 8).map((level, idx) => (
                      <motion.span
                        key={idx}
                        className="w-[2px] rounded-full bg-cyan-400/80 shadow-[0_0_5px_rgba(34,211,238,0.65)]"
                        animate={{
                          height: `${Math.max(2, Math.round(level * 12))}px`,
                          opacity: 0.45 + level * 0.55,
                        }}
                        transition={{ duration: 0.055, ease: "easeOut" }}
                      />
                    ))}
                  </div>
                )}
                {renderAppIcon()}
              </div>
            )}
          </div>
        </div>

        {/* SPOTIFY MUSIC PROGRESS BAR ROW */}
        {isMusicActive && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full mt-2 pt-1.5 border-t border-emerald-500/20 flex flex-col gap-1 px-1"
          >
            <div className="w-full bg-slate-800/80 rounded-full h-1 overflow-hidden relative">
              <motion.div
                className="bg-gradient-to-r from-[#1ed760] to-cyan-400 h-full rounded-full shadow-[0_0_8px_#1ed760]"
                style={{
                  width: `${Math.min(
                    100,
                    ((musicPlayback?.currentTime || 0) / (musicPlayback?.duration || 225)) * 100
                  )}%`,
                }}
              />
            </div>
            <div className="flex items-center justify-between text-[8px] font-mono text-emerald-400/80">
              <span>{formatDuration(musicPlayback?.currentTime || 0)}</span>
              <span>{formatDuration(musicPlayback?.duration || 225)}</span>
            </div>
          </motion.div>
        )}

        {/* IN-CALL CONTROLS BAR (Appears when a call is actively connected or dialing) */}
        {isCallActive && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full mt-2 pt-2 border-t border-white/10 flex items-center justify-between px-1"
          >
            {/* Audio Waveform + Recording Indicator */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5 h-3">
                {[0.4, 0.8, 1, 0.6, 0.9, 0.3].map((h, i) => (
                  <motion.span
                    key={i}
                    className={`w-0.5 rounded-full ${
                      activeCall?.isRecording ? "bg-rose-400" : "bg-emerald-400"
                    }`}
                    animate={{ height: ["4px", "12px", "4px"] }}
                    transition={{
                      repeat: Infinity,
                      duration: 0.5 + i * 0.1,
                      ease: "easeInOut",
                    }}
                  />
                ))}
              </div>
              {activeCall?.isRecording && (
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[9px] font-mono font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                  <span>REC {formatDuration(activeCall.recordingDurationSeconds || 0)}</span>
                </div>
              )}
            </div>

            {/* In-Call Action Buttons */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onToggleRecording) onToggleRecording();
                }}
                className={`px-2 py-1 rounded-full border text-[9px] font-mono font-bold flex items-center gap-1 transition-all ${
                  activeCall?.isRecording
                    ? "bg-rose-500/25 text-rose-200 border-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.45)]"
                    : "bg-white/5 text-slate-300 border-white/10 hover:bg-white/10"
                }`}
                title={activeCall?.isRecording ? "Stop Call Recording & Save Audio" : "Start Call Recording"}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    activeCall?.isRecording ? "bg-rose-500 animate-pulse" : "bg-rose-400/70"
                  }`}
                />
                <span>{activeCall?.isRecording ? "STOP REC" : "REC"}</span>
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onToggleMute) onToggleMute();
                }}
                className={`p-1.5 rounded-full border transition-all ${
                  activeCall?.isMuted
                    ? "bg-amber-500/20 text-amber-300 border-amber-400"
                    : "bg-white/5 text-slate-300 border-white/10 hover:bg-white/10"
                }`}
                title={activeCall?.isMuted ? "Unmute" : "Mute"}
              >
                {activeCall?.isMuted ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onToggleSpeaker) onToggleSpeaker();
                }}
                className={`p-1.5 rounded-full border transition-all ${
                  activeCall?.isSpeakerOn
                    ? "bg-cyan-500/20 text-cyan-300 border-cyan-400"
                    : "bg-white/5 text-slate-300 border-white/10 hover:bg-white/10"
                }`}
                title={activeCall?.isSpeakerOn ? "Speaker On" : "Speaker Off"}
              >
                {activeCall?.isSpeakerOn ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onEndCall) onEndCall();
                }}
                className="px-2.5 py-1 rounded-full bg-red-600 hover:bg-red-500 text-white font-mono text-[10px] font-bold flex items-center gap-1 shadow-[0_0_10px_rgba(239,68,68,0.5)] transition-all"
              >
                <PhoneOff className="w-3 h-3" />
                <span>END</span>
              </button>
            </div>
          </motion.div>
        )}

        {/* MULTI-NUMBER EXPANDED LIST (When user says 'Call Rahul' and Rahul has 2-3 numbers) */}
        {isMultiNumberExpanded && contactPrompt && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="w-full mt-2 pt-2.5 border-t border-cyan-500/30 flex flex-col gap-1.5"
          >
            <div className="flex items-center justify-between pb-1 px-1">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-cyan-950 border border-cyan-400/40 flex items-center justify-center overflow-hidden">
                  {contactPrompt.contact.avatar ? (
                    <img
                      src={contactPrompt.contact.avatar}
                      alt={contactPrompt.contact.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-3.5 h-3.5 text-cyan-300" />
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-mono font-bold text-white">
                    {contactPrompt.contact.name}
                  </span>
                  <span className="text-[9px] font-mono text-cyan-400">
                    {contactPrompt.contact.numbers.length} Numbers Saved
                  </span>
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onCancelContactPrompt) onCancelContactPrompt();
                }}
                className="p-1 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                title="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* List of 2-3 Phone Numbers */}
            <div className="flex flex-col gap-1.5 mt-1">
              {contactPrompt.contact.numbers.map((phone) => (
                <button
                  key={phone.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onSelectPhoneNumber) {
                      onSelectPhoneNumber(phone.number, phone.label);
                    }
                  }}
                  className="w-full flex items-center justify-between p-2 rounded-xl bg-slate-900/90 hover:bg-cyan-950/70 border border-slate-700/60 hover:border-cyan-400/60 transition-all text-left group active:scale-[0.99]"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-black transition-colors">
                      <Phone className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider">
                          {phone.label}
                        </span>
                        {phone.isPrimary && (
                          <span className="text-[8px] font-mono px-1 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                            DEFAULT
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-mono font-bold text-white tracking-wide">
                        {phone.number}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-xs font-mono font-bold text-emerald-400 group-hover:text-emerald-300 bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20">
                    <span>CALL</span>
                    <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};
