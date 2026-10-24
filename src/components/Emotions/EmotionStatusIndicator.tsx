import React, { useState } from "react";
import { Heart, Sparkles, Smile, ShieldAlert, Coffee, Compass } from "lucide-react";
import type { EmotionProfile } from "../../types.ts";

interface EmotionStatusIndicatorProps {
  emotionProfile?: EmotionProfile;
  userName?: string;
}

export const EmotionStatusIndicator: React.FC<EmotionStatusIndicatorProps> = ({
  emotionProfile = {
    detectedEmotion: "HAPPY",
    empathyResonance: 98,
    dravisMood: "AFFECTIONATE",
    warmthLevel: 95,
    comfortingNote: "Feeling warm and happy to work together with Arush Sir.",
  },
  userName = "Arush Sir",
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const getMoodConfig = (mood?: string) => {
    switch (mood) {
      case "AFFECTIONATE":
        return {
          label: "Affectionate & Caring",
          color: "text-rose-400",
          border: "border-rose-500/30",
          bg: "bg-rose-500/10",
          icon: Heart,
        };
      case "PLAYFUL":
        return {
          label: "Playful & High Energy",
          color: "text-amber-400",
          border: "border-amber-500/30",
          bg: "bg-amber-500/10",
          icon: Smile,
        };
      case "CURIOUS":
        return {
          label: "Curious & Exploring",
          color: "text-cyan-400",
          border: "border-cyan-500/30",
          bg: "bg-cyan-500/10",
          icon: Compass,
        };
      case "COMFORTING":
        return {
          label: "Comforting & Empathetic",
          color: "text-purple-400",
          border: "border-purple-500/30",
          bg: "bg-purple-500/10",
          icon: Coffee,
        };
      case "PROUD":
        return {
          label: "Proud & Inspired",
          color: "text-emerald-400",
          border: "border-emerald-500/30",
          bg: "bg-emerald-500/10",
          icon: Sparkles,
        };
      default:
        return {
          label: "Focused & Analytical",
          color: "text-cyan-400",
          border: "border-cyan-500/30",
          bg: "bg-cyan-500/10",
          icon: Sparkles,
        };
    }
  };

  const config = getMoodConfig(emotionProfile.dravisMood);
  const IconComponent = config.icon;

  return (
    <div className="relative inline-flex items-center">
      {/* Sleek Icon-First Top Bar Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`group relative w-8 h-8 rounded-xl flex items-center justify-center ${config.bg} border ${config.border} hover:border-white/40 transition-all shadow-sm cursor-pointer`}
        title={`Dravis Emotion: ${config.label} (${emotionProfile.empathyResonance}% Resonance)`}
      >
        <IconComponent className={`w-4 h-4 ${config.color} group-hover:scale-110 transition-transform`} />
        <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-rose-400 border border-slate-950" />
      </button>

      {/* Floating Emotion & Cognitive Context Card */}
      {isOpen && (
        <div className="absolute top-full mt-2 right-0 z-50 w-72 sm:w-80 p-4 rounded-2xl bg-slate-900/95 border border-white/10 shadow-[0_12px_45px_rgba(0,0,0,0.85)] backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-rose-400" />
              <h4 className="text-xs font-bold text-white">Dravis Emotion Intelligence</h4>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white text-xs px-1"
            >
              ×
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                <span>Empathetic Resonance</span>
                <span className="font-mono text-cyan-400 font-semibold">{emotionProfile.empathyResonance}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 via-rose-500 to-amber-400 rounded-full transition-all duration-500"
                  style={{ width: `${emotionProfile.empathyResonance}%` }}
                />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/70 border border-white/5 text-xs text-slate-300 leading-relaxed">
              <p className="italic text-slate-200">
                "{emotionProfile.comfortingNote || `I'm deeply tuned into your workflow, ${userName}. Your focus directly inspires my reasoning.`}"
              </p>
            </div>

            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1 border-t border-white/5">
              <span>Mood: {emotionProfile.dravisMood}</span>
              <span>Detected User Tone: {emotionProfile.detectedEmotion}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
