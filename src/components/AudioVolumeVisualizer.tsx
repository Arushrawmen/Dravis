/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Real-Time Audio Volume Visualizer for Voice Input Area
 * Provides dynamic audio frequency bars when listening (live microphone stream)
 * or when Dravis is speaking (vocal harmonics synthesis).
 */

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Volume2, Mic } from "lucide-react";

interface AudioVolumeVisualizerProps {
  isListening: boolean;
  isSpeaking: boolean;
  className?: string;
}

export const AudioVolumeVisualizer: React.FC<AudioVolumeVisualizerProps> = ({
  isListening,
  isSpeaking,
  className = "",
}) => {
  const [volumeLevels, setVolumeLevels] = useState<number[]>([15, 25, 40, 25, 15]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // 1. Microphone Real-Time Audio Level Analyzer
  useEffect(() => {
    if (!isListening) {
      // Clean up audio stream when listening stops
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
        mediaStreamRef.current = null;
      }
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
      return;
    }

    let active = true;

    async function initMicStream() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });

        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        mediaStreamRef.current = stream;
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtx();
        audioContextRef.current = ctx;

        const analyser = ctx.createAnalyser();
        analyser.fftSize = 64;
        analyser.smoothingTimeConstant = 0.65;
        analyserRef.current = analyser;

        const source = ctx.createMediaStreamSource(stream);
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const updateLevels = () => {
          if (!active) return;
          analyser.getByteFrequencyData(dataArray);

          // Sample 5 frequency bins across low-mid-high voice spectrum
          const binIndices = [2, 5, 9, 14, 20];
          const newLevels = binIndices.map((idx) => {
            const raw = dataArray[idx] || 0;
            // Scale raw 0-255 to percentage height 10% - 100%
            const scaled = Math.min(100, Math.max(12, Math.round((raw / 255) * 100)));
            return scaled;
          });

          setVolumeLevels(newLevels);
          animationFrameRef.current = requestAnimationFrame(updateLevels);
        };

        updateLevels();
      } catch (err) {
        console.warn("[AudioVolumeVisualizer] Microphone access notice:", err);
      }
    }

    initMicStream();

    return () => {
      active = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, [isListening]);

  // 2. Speaking Harmonics Synthesizer
  useEffect(() => {
    if (!isSpeaking || isListening) return;

    let animId: number;
    let step = 0;

    const synthSpeakingWave = () => {
      step += 0.18;
      // Synthesize 5 reactive harmonic bars
      const l0 = Math.round(25 + Math.sin(step * 1.2) * 20 + Math.random() * 15);
      const l1 = Math.round(40 + Math.sin(step * 1.5 + 1) * 35 + Math.random() * 20);
      const l2 = Math.round(60 + Math.sin(step * 2.0 + 2) * 35 + Math.random() * 15);
      const l3 = Math.round(45 + Math.sin(step * 1.4 + 3) * 30 + Math.random() * 20);
      const l4 = Math.round(20 + Math.sin(step * 1.1 + 4) * 18 + Math.random() * 12);

      setVolumeLevels([
        Math.min(100, Math.max(15, l0)),
        Math.min(100, Math.max(20, l1)),
        Math.min(100, Math.max(30, l2)),
        Math.min(100, Math.max(20, l3)),
        Math.min(100, Math.max(15, l4)),
      ]);

      animId = requestAnimationFrame(synthSpeakingWave);
    };

    synthSpeakingWave();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isSpeaking, isListening]);

  const isActive = isListening || isSpeaking;

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, width: 0 }}
          animate={{ opacity: 1, scale: 1, width: "auto" }}
          exit={{ opacity: 0, scale: 0.9, width: 0 }}
          transition={{ duration: 0.2 }}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border backdrop-blur-md shrink-0 overflow-hidden ${
            isListening
              ? "bg-emerald-950/40 border-emerald-400/40 text-emerald-300 shadow-[0_0_15px_rgba(52,211,153,0.25)]"
              : "bg-purple-950/40 border-purple-400/40 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.25)]"
          } ${className}`}
        >
          {isListening ? (
            <Mic className="w-3.5 h-3.5 text-emerald-400 animate-pulse shrink-0" />
          ) : (
            <Volume2 className="w-3.5 h-3.5 text-purple-400 animate-pulse shrink-0" />
          )}

          <div className="flex items-center gap-0.5 h-4 w-14 justify-center">
            {volumeLevels.map((lvl, i) => (
              <span
                key={i}
                style={{ height: `${lvl}%` }}
                className={`w-1 rounded-full transition-all duration-75 ${
                  isListening
                    ? "bg-gradient-to-t from-emerald-500 to-cyan-300 shadow-[0_0_6px_rgba(52,211,153,0.6)]"
                    : "bg-gradient-to-t from-purple-500 to-cyan-300 shadow-[0_0_6px_rgba(168,85,247,0.6)]"
                }`}
              />
            ))}
          </div>

          <span className="text-[10px] font-mono font-bold tracking-wider uppercase shrink-0 hidden sm:inline">
            {isListening ? "Listening" : "Speaking"}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
