/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Holographic Quantum Arc Reactor Core for Dravis HUD
 */

import React from "react";
import { motion } from "motion/react";
import { VoiceState } from "../types";

interface ArcReactorProps {
  voiceState: VoiceState;
  onClick?: () => void;
  statusText?: string;
}

export const ArcReactor: React.FC<ArcReactorProps> = ({
  voiceState,
  onClick,
  statusText = "ONLINE",
}) => {
  const isSpeaking = voiceState === "SPEAKING";
  const isListening = voiceState === "LISTENING";
  const isThinking = voiceState === "THINKING";

  return (
    <div 
      id="dravis-arc-reactor"
      onClick={onClick}
      className="relative flex items-center justify-center w-64 h-64 sm:w-72 sm:h-72 md:w-80 md:h-80 cursor-pointer select-none group"
      title="Click to engage DRAVIS Core"
    >
      {/* Outer ambient glow */}
      <div 
        className={`absolute inset-0 rounded-full transition-all duration-700 blur-2xl ${
          isThinking 
            ? "bg-purple-500/20 scale-110" 
            : isListening 
            ? "bg-emerald-500/25 scale-110" 
            : isSpeaking 
            ? "bg-cyan-400/35 scale-125" 
            : "bg-cyan-500/20 group-hover:bg-cyan-500/30"
        }`}
      />

      {/* Layer 1: Outermost Tech Tick Ring */}
      <svg className="absolute w-full h-full text-cyan-500/30" viewBox="0 0 300 300">
        <circle
          cx="150"
          cy="150"
          r="142"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeDasharray="4 8"
        />
        <circle
          cx="150"
          cy="150"
          r="134"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="2 16"
        />
      </svg>

      {/* Layer 2: Rotating Outer Ring Clockwise */}
      <motion.svg
        className="absolute w-[92%] h-[92%] text-cyan-400"
        viewBox="0 0 300 300"
        animate={{ rotate: 360 }}
        transition={{
          repeat: Infinity,
          duration: isSpeaking ? 8 : isThinking ? 4 : 20,
          ease: "linear",
        }}
      >
        <circle
          cx="150"
          cy="150"
          r="125"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeDasharray="40 15 20 15 80 20"
          className="opacity-70"
        />
        {/* Cardinal tech brackets */}
        <path d="M 150 20 L 150 30" stroke="currentColor" strokeWidth="3" />
        <path d="M 150 280 L 150 270" stroke="currentColor" strokeWidth="3" />
        <path d="M 20 150 L 30 150" stroke="currentColor" strokeWidth="3" />
        <path d="M 280 150 L 270 150" stroke="currentColor" strokeWidth="3" />
      </motion.svg>

      {/* Layer 3: Rotating Ring Counter-Clockwise */}
      <motion.svg
        className="absolute w-[80%] h-[80%] text-cyan-300"
        viewBox="0 0 300 300"
        animate={{ rotate: -360 }}
        transition={{
          repeat: Infinity,
          duration: isSpeaking ? 6 : isThinking ? 3 : 15,
          ease: "linear",
        }}
      >
        <circle
          cx="150"
          cy="150"
          r="105"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeDasharray="60 30 10 30"
          className="opacity-80"
        />
        {/* Orbital dots */}
        <circle cx="150" cy="45" r="4" fill="#00E5FF" />
        <circle cx="150" cy="255" r="4" fill="#00E5FF" />
        <circle cx="45" cy="150" r="4" fill="#00E5FF" />
        <circle cx="255" cy="150" r="4" fill="#00E5FF" />
      </motion.svg>

      {/* Layer 4: Segmented Arc Ring */}
      <motion.svg
        className="absolute w-[68%] h-[68%] text-cyan-200"
        viewBox="0 0 300 300"
        animate={{ rotate: 360 }}
        transition={{
          repeat: Infinity,
          duration: 25,
          ease: "linear",
        }}
      >
        <circle
          cx="150"
          cy="150"
          r="85"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeDasharray="12 12"
          className="opacity-90"
        />
      </motion.svg>

      {/* Layer 5: Glowing Inner Core with Dynamic Radial Pulse */}
      <motion.div
        className={`relative flex flex-col items-center justify-center w-36 h-36 sm:w-40 sm:h-40 rounded-full border border-cyan-400/50 backdrop-blur-md transition-colors duration-500 shadow-[0_0_35px_rgba(0,229,255,0.4)] ${
          isThinking 
            ? "bg-purple-950/80 border-purple-400" 
            : isListening 
            ? "bg-emerald-950/80 border-emerald-400" 
            : isSpeaking 
            ? "bg-cyan-950/90 border-cyan-300 shadow-[0_0_50px_rgba(0,229,255,0.7)]" 
            : "bg-slate-950/85 border-cyan-500/60"
        }`}
        animate={
          isSpeaking
            ? { scale: [1, 1.06, 0.98, 1.05, 1] }
            : isThinking
            ? { scale: [1, 1.04, 1] }
            : { scale: [1, 1.02, 1] }
        }
        transition={{
          repeat: Infinity,
          duration: isSpeaking ? 1.2 : 3,
          ease: "easeInOut",
        }}
      >
        {/* Core Center Glow Grid */}
        <div className="absolute inset-2 rounded-full border border-cyan-400/30 bg-[radial-gradient(circle,rgba(0,229,255,0.3)_0%,rgba(0,229,255,0.05)_70%,transparent_100%)] pointer-events-none" />

        {/* Central Core Branding */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center">
          <motion.span 
            className="text-xl sm:text-2xl font-black tracking-widest text-cyan-300 drop-shadow-[0_0_12px_rgba(0,229,255,0.9)] font-mono"
            animate={{ opacity: [0.85, 1, 0.85] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            DRAVIS
          </motion.span>
          
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className={`w-1.5 h-1.5 rounded-full ${
              isListening 
                ? "bg-emerald-400 animate-ping" 
                : isSpeaking 
                ? "bg-cyan-400 animate-pulse" 
                : isThinking 
                ? "bg-purple-400 animate-ping" 
                : "bg-emerald-400 shadow-[0_0_6px_#34d399]"
            }`} />
            <span className="text-[10px] sm:text-xs font-mono font-bold tracking-widest text-cyan-400 uppercase">
              {isListening ? "LISTENING" : isSpeaking ? "SPEAKING" : isThinking ? "THINKING" : statusText}
            </span>
          </div>
        </div>

        {/* Interactive touch ripple ring */}
        <div className="absolute inset-0 rounded-full border border-cyan-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      </motion.div>

      {/* Holographic scanning horizontal bar */}
      <motion.div
        className="absolute w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-400/80 to-transparent pointer-events-none"
        animate={{ y: [-110, 110, -110] }}
        transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
      />

      {/* Section 11: Holographic Floor Projection Grid beneath AI Core */}
      <div className="absolute -bottom-10 inset-x-[-20%] h-20 pointer-events-none flex items-center justify-center overflow-hidden [perspective:500px]">
        <div className="w-full h-full [transform:rotateX(65deg)] flex flex-col items-center justify-center">
          {/* Circular Perspective Rings */}
          <div className="absolute w-64 h-64 rounded-full border border-cyan-400/30 [box-shadow:0_0_20px_rgba(34,211,238,0.2)]" />
          <div className="absolute w-48 h-48 rounded-full border border-dashed border-cyan-400/40" />
          <div className="absolute w-32 h-32 rounded-full border border-cyan-400/50" />
          {/* Perspective grid lines */}
          <div className="w-full h-full bg-[linear-gradient(to_right,rgba(34,211,238,0.15)_1px,transparent_1px),linear-gradient(to_bottom,rgba(34,211,238,0.15)_1px,transparent_1px)] bg-[size:16px_16px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_80%)]" />
        </div>
      </div>
    </div>
  );
};
