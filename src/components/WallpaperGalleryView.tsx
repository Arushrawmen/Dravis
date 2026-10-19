/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Liquid Glass Theme Engine & Wallpaper Gallery
 */

import React, { useState } from "react";
import { motion } from "motion/react";
import {
  Palette,
  Image as ImageIcon,
  Sparkles,
  Check,
  Plus,
  Layers,
  Wand2,
  Sliders,
  Eye,
  SlidersHorizontal,
  SunMedium,
  Monitor,
} from "lucide-react";
import { ThemeConfig, WallpaperItem } from "../types";
import { soundEffects } from "../utils/audioSynth";

interface WallpaperGalleryViewProps {
  currentTheme: ThemeConfig;
  themes: ThemeConfig[];
  currentWallpaper: WallpaperItem;
  wallpapers: WallpaperItem[];
  onSelectTheme: (theme: ThemeConfig) => void;
  onSelectWallpaper: (wallpaper: WallpaperItem) => void;
  onAddCustomWallpaper: (url: string, name: string) => void;
  soundEffectsEnabled: boolean;
}

export const WallpaperGalleryView: React.FC<WallpaperGalleryViewProps> = ({
  currentTheme,
  themes,
  currentWallpaper,
  wallpapers,
  onSelectTheme,
  onSelectWallpaper,
  onAddCustomWallpaper,
  soundEffectsEnabled,
}) => {
  const [activeTab, setActiveTab] = useState<"WALLPAPERS" | "THEMES">("WALLPAPERS");
  const [customUrl, setCustomUrl] = useState("");
  const [customName, setCustomName] = useState("");
  const [wallpaperFilter, setWallpaperFilter] = useState<string>("ALL");

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrl.trim()) return;
    if (soundEffectsEnabled) soundEffects.playChirp();
    onAddCustomWallpaper(
      customUrl.trim(),
      customName.trim() || "Custom User Wallpaper"
    );
    setCustomUrl("");
    setCustomName("");
  };

  const filteredWallpapers = wallpapers.filter((w) => {
    if (wallpaperFilter === "ALL") return true;
    return w.category === wallpaperFilter;
  });

  return (
    <div
      id="dravis-wallpaper-gallery-view"
      className="flex-1 flex flex-col p-4 sm:p-6 gap-6 overflow-y-auto bg-slate-950/60 font-sans select-none"
    >
      {/* 1. Header & Mode Switcher */}
      <div className="flex flex-col gap-4 p-5 rounded-3xl bg-slate-900/80 border border-cyan-500/30 backdrop-blur-xl shadow-[0_0_30px_rgba(6,182,212,0.15)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-300">
              <Palette className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide flex items-center gap-2">
                LIQUID-GLASS THEME ENGINE & WALLPAPERS
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono border border-cyan-500/30">
                  HUD v4.2
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Dynamic sci-fi holographic color schemes, ambient animations, and custom backgrounds
              </p>
            </div>
          </div>

          {/* Sub-Tab Navigation */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-950/80 border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setActiveTab("WALLPAPERS");
                if (soundEffectsEnabled) soundEffects.playChirp();
              }}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all ${
                activeTab === "WALLPAPERS"
                  ? "bg-cyan-500 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.5)]"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              <span>Wallpapers ({wallpapers.length})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("THEMES");
                if (soundEffectsEnabled) soundEffects.playChirp();
              }}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all ${
                activeTab === "THEMES"
                  ? "bg-cyan-500 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.5)]"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Color Themes ({themes.length})</span>
            </button>
          </div>
        </div>
      </div>

      {activeTab === "WALLPAPERS" ? (
        <>
          {/* 2. Wallpapers Filtering & Custom Import Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              {["ALL", "STATIC", "ANIMATED"].map((cat) => (
                <button
                  type="button"
                  key={cat}
                  onClick={() => setWallpaperFilter(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all ${
                    wallpaperFilter === cat
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-[0_0_10px_rgba(6,182,212,0.3)]"
                      : "bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800"
                  }`}
                >
                  {cat === "ALL" ? "All Wallpapers" : cat === "ANIMATED" ? "Animated Holograms" : "Static High-Res"}
                </button>
              ))}
            </div>

            <form onSubmit={handleAddCustom} className="flex items-center gap-2">
              <input
                type="url"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="Paste custom wallpaper image URL..."
                className="px-3.5 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-white focus:border-cyan-400 focus:outline-none w-64"
              />
              <button
                type="submit"
                disabled={!customUrl.trim()}
                className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs font-mono flex items-center gap-1 disabled:opacity-40"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </form>
          </div>

          {/* 3. Wallpapers Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredWallpapers.map((wall) => {
              const isSelected = currentWallpaper.id === wall.id;

              return (
                <motion.div
                  key={wall.id}
                  layout
                  className={`group relative rounded-3xl overflow-hidden border transition-all duration-300 flex flex-col bg-slate-900/80 cursor-pointer ${
                    isSelected
                      ? "border-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.35)] ring-2 ring-cyan-500/30"
                      : "border-slate-800 hover:border-cyan-500/50 hover:shadow-[0_0_20px_rgba(6,182,212,0.15)]"
                  }`}
                  onClick={() => {
                    if (soundEffectsEnabled) soundEffects.playActivatePulse();
                    onSelectWallpaper(wall);
                  }}
                >
                  {/* Wallpaper Thumbnail Preview */}
                  <div className="relative aspect-video w-full overflow-hidden bg-black/40">
                    <img
                      src={wall.previewUrl || wall.fullUrl}
                      alt={wall.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />

                    <div className="absolute top-3 left-3 px-2 py-0.5 rounded-md bg-slate-950/80 backdrop-blur-md text-[10px] font-mono font-bold text-cyan-300 border border-cyan-500/30">
                      {wall.category}
                    </div>

                    {isSelected && (
                      <div className="absolute top-3 right-3 p-1.5 rounded-xl bg-cyan-500 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.8)]">
                        <Check className="w-4 h-4 stroke-[3]" />
                      </div>
                    )}
                  </div>

                  {/* Info Footer */}
                  <div className="p-4 flex flex-col gap-1.5 bg-slate-950/80">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white font-mono">
                        {wall.name}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-1">
                      {wall.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </>
      ) : (
        /* THEMES CONFIGURATION SECTION */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {themes.map((theme) => {
            const isSelected = currentTheme.id === theme.id;

            return (
              <div
                key={theme.id}
                onClick={() => {
                  if (soundEffectsEnabled) soundEffects.playActivatePulse();
                  onSelectTheme(theme);
                }}
                className={`p-5 rounded-3xl border transition-all duration-300 cursor-pointer flex flex-col gap-4 ${
                  isSelected
                    ? "bg-slate-900/90 border-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.3)] ring-2 ring-cyan-500/40"
                    : "bg-slate-950/70 border-slate-800 hover:border-slate-700"
                }`}
                style={{
                  boxShadow: isSelected ? `0 0 30px ${theme.glowColor}` : undefined,
                }}
              >
                {/* Theme Header & Accent Color Swatches */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-5 h-5 rounded-full border border-white/20 shadow-md"
                      style={{ backgroundColor: theme.accentColor }}
                    />
                    <span className="text-xs font-bold text-white font-mono">
                      {theme.name}
                    </span>
                  </div>

                  {isSelected && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500 text-slate-950">
                      ACTIVE
                    </span>
                  )}
                </div>

                {/* Theme Preview Card Simulation */}
                <div
                  className="p-3.5 rounded-2xl border flex flex-col gap-2 transition-all"
                  style={{
                    backgroundColor: theme.panelBg,
                    borderColor: theme.borderColor,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className="text-[11px] font-mono font-bold tracking-wider"
                      style={{ color: theme.coreColor }}
                    >
                      HUD CORE SIMULATION
                    </span>
                    <div
                      className="w-2 h-2 rounded-full animate-ping"
                      style={{ backgroundColor: theme.accentColor }}
                    />
                  </div>

                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: "70%",
                        backgroundColor: theme.accentColor,
                        boxShadow: `0 0 10px ${theme.glowColor}`,
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span>Waveform: {theme.waveformStyle}</span>
                    <span>Blur: {theme.blurIntensity}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
