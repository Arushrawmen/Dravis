/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Right Sidebar with AI News Feed, Reminders, Weather, and Media Player
 */

import React, { useState } from "react";
import { motion } from "motion/react";
import {
  CloudRain,
  Calendar,
  Newspaper,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Plus,
  ExternalLink,
  CheckCircle2,
  Disc,
} from "lucide-react";
import { NewsItem, ReminderItem, WeatherData } from "../types";
import { soundEffects } from "../utils/audioSynth";

interface RightSidebarProps {
  newsList: NewsItem[];
  reminders: ReminderItem[];
  weather: WeatherData;
  onAddReminderClick: () => void;
  onToggleReminder: (id: string) => void;
  soundEffectsEnabled: boolean;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({
  newsList,
  reminders,
  weather,
  onAddReminderClick,
  onToggleReminder,
  soundEffectsEnabled,
}) => {
  const [isPlayingMusic, setIsPlayingMusic] = useState<boolean>(true);
  const [selectedTrack, setSelectedTrack] = useState({
    title: "Blinding Lights",
    artist: "The Weeknd",
    duration: "3:20",
  });

  const toggleMusic = () => {
    if (soundEffectsEnabled) {
      soundEffects.playChirp();
    }
    setIsPlayingMusic(!isPlayingMusic);
  };

  return (
    <aside 
      id="dravis-right-sidebar"
      className="flex flex-col w-72 sm:w-80 h-full bg-slate-950/30 border-l border-white/15 backdrop-blur-xl p-3 select-none gap-3 overflow-y-auto"
    >
      {/* 1. Section 8: AI NEWS FEED CARD */}
      <div 
        id="hud-ai-news-card"
        className="rounded-2xl border border-white/10 bg-white/5 p-3.5 flex flex-col gap-2.5 backdrop-blur-md shadow-[0_0_15px_rgba(0,0,0,0.3)]"
      >
        <div className="flex items-center justify-between pb-1 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Newspaper className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[11px] font-mono font-bold text-cyan-400 uppercase tracking-widest">
              AI NEWS FEED
            </span>
          </div>
          <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.8)] animate-pulse" />
        </div>

        {/* News Bullet List */}
        <div className="flex flex-col gap-1.5">
          {newsList.slice(0, 4).map((item) => (
            <div 
              key={item.id}
              className="flex items-start gap-2 text-left group cursor-pointer hover:bg-white/5 p-2 rounded-xl border border-white/5 hover:border-white/10 transition-all"
              onClick={() => {
                if (soundEffectsEnabled) soundEffects.playChirp();
                if (item.url) window.open(item.url, "_blank");
              }}
              title={item.summary}
            >
              <span className="text-cyan-400 font-bold text-xs leading-tight mt-0.5">•</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-200 group-hover:text-cyan-300 transition-colors line-clamp-1 font-sans">
                  {item.title}
                </p>
                <span className="text-[9px] font-mono text-slate-400 group-hover:text-cyan-400">
                  {item.source} • {item.timestamp}
                </span>
              </div>
              <ExternalLink className="w-3 h-3 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          ))}
        </div>

        {/* View All Button */}
        <button
          onClick={() => soundEffectsEnabled && soundEffects.playChirp()}
          className="w-full py-1.5 mt-0.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-cyan-400 font-mono text-[10px] font-bold tracking-wider uppercase transition-all"
        >
          VIEW ALL
        </button>
      </div>

      {/* 2. Section 14: REMINDERS CARD */}
      <div 
        id="hud-reminders-card"
        className="rounded-2xl border border-white/10 bg-white/5 p-3.5 flex flex-col gap-2.5 backdrop-blur-md shadow-[0_0_15px_rgba(0,0,0,0.3)]"
      >
        <div className="flex items-center justify-between pb-1 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[11px] font-mono font-bold text-cyan-400 uppercase tracking-widest">
              REMINDERS
            </span>
          </div>
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            {reminders.filter(r => !r.completed).length} PENDING
          </span>
        </div>

        {/* Reminders List */}
        <div className="flex flex-col gap-1.5">
          {reminders.map((rem) => (
            <div
              key={rem.id}
              onClick={() => {
                if (soundEffectsEnabled) soundEffects.playChirp();
                onToggleReminder(rem.id);
              }}
              className={`flex items-center justify-between p-2 rounded-xl border transition-all cursor-pointer ${
                rem.completed 
                  ? "border-white/5 bg-white/[0.02] text-slate-500 opacity-60" 
                  : "border-white/5 bg-white/5 text-slate-200 hover:border-white/10"
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-cyan-400 font-bold text-xs">•</span>
                <span className={`text-xs truncate font-sans ${rem.completed ? "line-through" : ""}`}>
                  {rem.title}
                </span>
              </div>
              <span className="text-[9px] font-mono text-cyan-400 flex-shrink-0 ml-2 font-semibold">
                {rem.time}
              </span>
            </div>
          ))}
        </div>

        {/* Add Reminder Button */}
        <button
          onClick={() => {
            if (soundEffectsEnabled) soundEffects.playChirp();
            onAddReminderClick();
          }}
          className="w-full py-1.5 mt-0.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-cyan-400 font-mono text-[10px] font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5 text-cyan-400" />
          <span>ADD REMINDER</span>
        </button>
      </div>

      {/* 3. Section 15: WEATHER CARD */}
      <div 
        id="hud-weather-card"
        className="rounded-2xl border border-white/10 bg-white/5 p-3.5 flex flex-col gap-2 backdrop-blur-md shadow-[0_0_15px_rgba(0,0,0,0.3)]"
      >
        <span className="text-[11px] font-mono font-bold text-cyan-400 uppercase tracking-widest pb-1 border-b border-white/10">
          WEATHER
        </span>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Weather Hologram Icon */}
            <div className="relative p-2.5 rounded-xl bg-white/5 border border-white/10 shadow-[0_0_10px_rgba(34,211,238,0.2)]">
              <CloudRain className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-white font-mono">
                  {weather.temperature}°C
                </span>
              </div>
              <span className="text-xs text-slate-300 font-sans">
                {weather.condition}
              </span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs font-semibold text-cyan-400 block font-mono">
              {weather.location}
            </span>
          </div>
        </div>

        {/* Weather Metrics */}
        <div className="grid grid-cols-3 gap-1 pt-2 border-t border-white/5 font-mono text-[10px]">
          <div>
            <span className="text-slate-400 block text-[9px]">Humidity</span>
            <span className="text-white font-bold">{weather.humidity}%</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[9px]">Wind</span>
            <span className="text-white font-bold">{weather.windSpeed} km/h</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[9px]">Feels</span>
            <span className="text-cyan-400 font-bold">{weather.feelsLike}°C</span>
          </div>
        </div>
      </div>

      {/* 4. MEDIA / MUSIC PLAYER WIDGET */}
      <div 
        id="hud-media-player-card"
        className="rounded-2xl border border-white/10 bg-white/5 p-3 flex items-center gap-3 backdrop-blur-md shadow-[0_0_15px_rgba(0,0,0,0.3)] mt-auto"
      >
        {/* Animated Hologram Disc / Avatar */}
        <div className="relative w-10 h-10 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center flex-shrink-0 shadow-[0_0_10px_rgba(34,211,238,0.2)]">
          <motion.div
            className="absolute inset-0 rounded-xl border border-dashed border-cyan-400/60"
            animate={{ rotate: isPlayingMusic ? 360 : 0 }}
            transition={{ repeat: Infinity, duration: 6, ease: "linear" }}
          />
          <Disc className="w-5 h-5 text-cyan-400" />
        </div>

        {/* Track Title & Spectrum Wave */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white truncate font-sans">
              {selectedTrack.artist}
            </span>
            {/* Control buttons */}
            <div className="flex items-center gap-1.5 text-slate-300">
              <button 
                onClick={() => soundEffectsEnabled && soundEffects.playChirp()}
                className="hover:text-cyan-400 transition-colors"
              >
                <SkipBack className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={toggleMusic}
                className="p-1 rounded-full bg-cyan-400/20 hover:bg-cyan-400/40 text-cyan-300 transition-colors"
              >
                {isPlayingMusic ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              </button>
              <button 
                onClick={() => soundEffectsEnabled && soundEffects.playChirp()}
                className="hover:text-cyan-400 transition-colors"
              >
                <SkipForward className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          
          <span className="text-[11px] text-slate-400 truncate block font-sans">
            {selectedTrack.title}
          </span>

          {/* Animated Mini Audio Spectrum */}
          <div className="flex items-center gap-0.5 h-2.5 mt-1">
            {Array.from({ length: 16 }).map((_, i) => (
              <motion.div
                key={i}
                className={`w-0.5 rounded-full ${isPlayingMusic ? "bg-cyan-400" : "bg-slate-700"}`}
                animate={isPlayingMusic ? { height: [2, (i % 3) * 3 + 3, 2] } : { height: 2 }}
                transition={{
                  repeat: Infinity,
                  duration: 0.5,
                  delay: i * 0.04,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
};
