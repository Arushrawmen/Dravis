/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Image Generation Suite & Visual Artifact Folders with Border Controls
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles,
  Maximize2,
  Minimize2,
  Download,
  RotateCw,
  Copy,
  Trash2,
  Folder,
  FolderPlus,
  Image as ImageIcon,
  Check,
  Send,
  Layers,
  Wand2,
  ZoomIn,
  ZoomOut,
  X,
  Share2,
  SlidersHorizontal,
} from "lucide-react";
import { GeneratedImageItem, ImageFolder } from "../types";
import { soundEffects } from "../utils/audioSynth";

interface ImageGalleryViewProps {
  images: GeneratedImageItem[];
  folders: ImageFolder[];
  onGenerateImage: (prompt: string, style: any, aspectRatio: any, folder: string) => Promise<void>;
  onDeleteImage: (id: string) => void;
  onSendToChat?: (image: GeneratedImageItem) => void;
  isGenerating: boolean;
  soundEffectsEnabled: boolean;
}

export const ImageGalleryView: React.FC<ImageGalleryViewProps> = ({
  images,
  folders,
  onGenerateImage,
  onDeleteImage,
  onSendToChat,
  isGenerating,
  soundEffectsEnabled,
}) => {
  const [activeFolder, setActiveFolder] = useState<string>("ALL");
  const [promptInput, setPromptInput] = useState("");
  const [selectedStyle, setSelectedStyle] = useState<GeneratedImageItem["style"]>("CYBERPUNK");
  const [selectedRatio, setSelectedRatio] = useState<GeneratedImageItem["aspectRatio"]>("1:1");
  const [targetFolder, setTargetFolder] = useState<string>("Visual Artifacts");
  
  // Full-Screen and Minimize card states
  const [fullscreenImage, setFullscreenImage] = useState<GeneratedImageItem | null>(null);
  const [minimizedImageIds, setMinimizedImageIds] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  const styleOptions: { id: GeneratedImageItem["style"]; label: string }[] = [
    { id: "CYBERPUNK", label: "Cyberpunk Neon" },
    { id: "HOLOGRAPHIC", label: "Holographic Blueprint" },
    { id: "CINEMATIC", label: "Cinematic 8K" },
    { id: "PHOTOREALISTIC", label: "Photorealistic" },
    { id: "ANIME", label: "Anime Sci-Fi" },
    { id: "CONCEPT_ART", label: "Concept Art" },
  ];

  const ratioOptions: { id: GeneratedImageItem["aspectRatio"]; label: string }[] = [
    { id: "1:1", label: "1:1 Square" },
    { id: "16:9", label: "16:9 Landscape" },
    { id: "9:16", label: "9:16 Portrait" },
    { id: "4:3", label: "4:3 Standard" },
  ];

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptInput.trim() || isGenerating) return;
    if (soundEffectsEnabled) soundEffects.playActivatePulse();
    await onGenerateImage(promptInput.trim(), selectedStyle, selectedRatio, targetFolder);
    setPromptInput("");
  };

  const handleCopyPrompt = (img: GeneratedImageItem) => {
    navigator.clipboard.writeText(img.prompt);
    setCopiedId(img.id);
    if (soundEffectsEnabled) soundEffects.playChirp();
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownload = (img: GeneratedImageItem) => {
    if (soundEffectsEnabled) soundEffects.playChirp();
    const a = document.createElement("a");
    a.href = img.url;
    a.download = `DRAVIS-Render-${img.id}.png`;
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const toggleMinimize = (id: string) => {
    if (soundEffectsEnabled) soundEffects.playChirp();
    setMinimizedImageIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredImages = images.filter((img) => {
    if (activeFolder === "ALL") return true;
    return img.folder === activeFolder;
  });

  return (
    <div 
      id="dravis-image-gallery-view"
      className="flex-1 flex flex-col p-4 sm:p-6 gap-6 overflow-y-auto bg-slate-950/60 font-sans select-none"
    >
      {/* 1. Header & Generation Command Console */}
      <div className="flex flex-col gap-4 p-5 rounded-3xl bg-slate-900/80 border border-cyan-500/30 backdrop-blur-xl shadow-[0_0_30px_rgba(6,182,212,0.15)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-300">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide flex items-center gap-2">
                DRAVIS NEURAL IMAGE SYNTHESIZER
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono">
                  IMAGEN 3.0 / ASI VISION
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Direct neural visual rendering and small folder image bank
              </p>
            </div>
          </div>
        </div>

        {/* Prompt Input Form */}
        <form onSubmit={handleGenerate} className="flex flex-col gap-3">
          <div className="relative flex items-center">
            <input
              type="text"
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              placeholder="Describe what you want Dravis to imagine (e.g., Futuristic Stark Arc Reactor glowing in 8k...)"
              className="w-full px-4 py-3.5 pr-32 rounded-2xl bg-slate-950/90 border border-cyan-500/30 focus:border-cyan-400 focus:outline-none text-white text-sm placeholder:text-slate-500 transition-all shadow-inner"
              disabled={isGenerating}
            />
            <button
              type="submit"
              disabled={isGenerating || !promptInput.trim()}
              className="absolute right-2 px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs tracking-wider flex items-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Synthesizing...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>Imagine</span>
                </>
              )}
            </button>
          </div>

          {/* Style & Aspect Ratio Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
            {/* Style Pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-slate-400 flex items-center gap-1 mr-1">
                <SlidersHorizontal className="w-3 h-3 text-cyan-400" /> Style:
              </span>
              {styleOptions.map((s) => (
                <button
                  type="button"
                  key={s.id}
                  onClick={() => setSelectedStyle(s.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                    selectedStyle === s.id
                      ? "bg-cyan-500 text-slate-950 font-bold shadow-[0_0_8px_rgba(6,182,212,0.6)]"
                      : "bg-slate-800/80 text-slate-300 hover:bg-slate-700/80"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Ratio & Target Folder Selector */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1">
                {ratioOptions.map((r) => (
                  <button
                    type="button"
                    key={r.id}
                    onClick={() => setSelectedRatio(r.id)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-medium transition-all ${
                      selectedRatio === r.id
                        ? "bg-sky-500 text-slate-950 font-bold"
                        : "bg-slate-800/80 text-slate-400 hover:bg-slate-700/80"
                    }`}
                  >
                    {r.id}
                  </button>
                ))}
              </div>

              {/* Destination Folder Selector */}
              <div className="flex items-center gap-1 bg-slate-950/80 px-2.5 py-1 rounded-lg border border-slate-800">
                <Folder className="w-3 h-3 text-cyan-400" />
                <select
                  value={targetFolder}
                  onChange={(e) => setTargetFolder(e.target.value)}
                  className="bg-transparent text-slate-200 text-[11px] focus:outline-none cursor-pointer"
                >
                  {folders.map((f) => (
                    <option key={f.id} value={f.name} className="bg-slate-900 text-white">
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* 2. Folder Navigation Pills */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setActiveFolder("ALL")}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold flex items-center gap-2 transition-all ${
              activeFolder === "ALL"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-[0_0_12px_rgba(6,182,212,0.3)]"
                : "bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>All Visuals ({images.length})</span>
          </button>

          {folders.map((folder) => {
            const count = images.filter((img) => img.folder === folder.name).length;
            const isActive = activeFolder === folder.name;
            return (
              <button
                type="button"
                key={folder.id}
                onClick={() => setActiveFolder(folder.name)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold flex items-center gap-2 transition-all ${
                  isActive
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-[0_0_12px_rgba(6,182,212,0.3)]"
                    : "bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800"
                }`}
              >
                <Folder className="w-3.5 h-3.5 text-cyan-400" />
                <span>{folder.name} ({count})</span>
              </button>
            );
          })}
        </div>

        <span className="text-[11px] font-mono text-slate-400 shrink-0">
          Showing {filteredImages.length} Artifacts
        </span>
      </div>

      {/* 3. Image Grid with Border Control Options */}
      {filteredImages.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 rounded-3xl bg-slate-900/40 border border-dashed border-slate-800 text-center gap-3">
          <ImageIcon className="w-12 h-12 text-slate-600 animate-pulse" />
          <h3 className="text-sm font-bold text-slate-300 font-mono">No images in this folder</h3>
          <p className="text-xs text-slate-500 max-w-sm">
            Enter a prompt above or ask Dravis directly: "Create an image of..." to generate visuals.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredImages.map((img) => {
            const isMinimized = !!minimizedImageIds[img.id];

            return (
              <motion.div
                key={img.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="group relative rounded-3xl bg-slate-900/90 border border-cyan-500/30 hover:border-cyan-400/60 transition-all duration-300 backdrop-blur-xl flex flex-col overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.4)] hover:shadow-[0_0_25px_rgba(6,182,212,0.25)]"
              >
                {/* Top Border Header: Folder Badge + Options Toolbar */}
                <div className="flex items-center justify-between p-3 bg-slate-950/80 border-b border-cyan-500/20">
                  <div className="flex items-center gap-1.5">
                    <Folder className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="text-[10px] font-mono font-bold text-cyan-300 uppercase tracking-wider truncate max-w-[120px]">
                      {img.folder}
                    </span>
                  </div>

                  {/* Border Action Toolbar */}
                  <div className="flex items-center gap-1">
                    {/* Minimize / Expand Toggle Button */}
                    <button
                      type="button"
                      title={isMinimized ? "Expand Canvas" : "Minimize Thumbnail"}
                      onClick={() => toggleMinimize(img.id)}
                      className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-cyan-500/20 text-slate-400 hover:text-cyan-300 transition-colors"
                    >
                      {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
                    </button>

                    {/* Full Screen View Button */}
                    <button
                      type="button"
                      title="Full Screen View"
                      onClick={() => {
                        setFullscreenImage(img);
                        setZoomLevel(1);
                        if (soundEffectsEnabled) soundEffects.playChirp();
                      }}
                      className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-cyan-500/20 text-slate-400 hover:text-cyan-300 transition-colors"
                    >
                      <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
                    </button>

                    {/* Download Button */}
                    <button
                      type="button"
                      title="Download Image"
                      onClick={() => handleDownload(img)}
                      className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-emerald-500/20 text-slate-400 hover:text-emerald-300 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete Button */}
                    <button
                      type="button"
                      title="Delete from Bank"
                      onClick={() => {
                        if (soundEffectsEnabled) soundEffects.playChirp();
                        onDeleteImage(img.id);
                      }}
                      className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-red-500/20 text-slate-400 hover:text-red-300 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Main Visual Display (Expanded or Minimized) */}
                <div 
                  className={`relative overflow-hidden cursor-pointer bg-black/40 flex items-center justify-center transition-all duration-300 ${
                    isMinimized ? "h-20" : "aspect-square"
                  }`}
                  onClick={() => {
                    setFullscreenImage(img);
                    setZoomLevel(1);
                  }}
                >
                  <img
                    src={img.url}
                    alt={img.prompt}
                    referrerPolicy="no-referrer"
                    className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${
                      isMinimized ? "object-center" : ""
                    }`}
                  />

                  {/* Overlay Gradient on Hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4 pointer-events-none">
                    <span className="text-[11px] font-mono text-cyan-300 bg-slate-950/80 px-2 py-1 rounded-md border border-cyan-500/40">
                      Click for Full Screen
                    </span>
                  </div>
                </div>

                {/* Bottom Border Metadata & Actions */}
                <div className="p-3.5 flex flex-col gap-2 bg-slate-950/70">
                  <p className="text-xs text-slate-200 font-medium line-clamp-2 leading-relaxed">
                    "{img.prompt}"
                  </p>

                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-800/60">
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300">
                      {img.style}
                    </span>
                    <span>{img.dimensions}</span>
                    <span>{img.timestamp}</span>
                  </div>

                  {/* Secondary Quick Action Buttons */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleCopyPrompt(img)}
                      className="flex-1 py-1.5 px-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-[10px] font-mono flex items-center justify-center gap-1.5 transition-all"
                    >
                      {copiedId === img.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-cyan-400" />
                          <span>Copy Prompt</span>
                        </>
                      )}
                    </button>

                    {onSendToChat && (
                      <button
                        type="button"
                        onClick={() => {
                          if (soundEffectsEnabled) soundEffects.playActivatePulse();
                          onSendToChat(img);
                        }}
                        className="py-1.5 px-3 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-[10px] font-mono flex items-center gap-1 border border-cyan-500/30 transition-all"
                        title="Analyze image in DRAVIS Chat"
                      >
                        <Send className="w-3 h-3" />
                        <span>Chat</span>
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* 4. Full-Screen Visual Modal Inspector */}
      <AnimatePresence>
        {fullscreenImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl flex flex-col p-4 sm:p-6 overflow-hidden"
          >
            {/* Top Toolbar in Full Screen */}
            <div className="flex items-center justify-between pb-4 border-b border-cyan-500/30">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/40">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-wide">
                    FULL-SCREEN ARTIFACT INSPECTOR
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Folder: {fullscreenImage.folder} • Resolution: {fullscreenImage.dimensions} • Provider: {fullscreenImage.provider}
                  </p>
                </div>
              </div>

              {/* Full Screen Controls */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.max(0.5, z - 0.25))}
                  className="p-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-xs font-mono text-cyan-400 px-2">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.min(3, z + 0.25))}
                  className="p-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDownload(fullscreenImage)}
                  className="px-3 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                >
                  <Download className="w-4 h-4" />
                  <span>Download PNG</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFullscreenImage(null)}
                  className="p-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30"
                  title="Close Full Screen"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Central Canvas Pan & Zoom Display */}
            <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
              <motion.img
                src={fullscreenImage.url}
                alt={fullscreenImage.prompt}
                referrerPolicy="no-referrer"
                style={{ scale: zoomLevel }}
                className="max-w-full max-h-full object-contain rounded-2xl shadow-[0_0_50px_rgba(6,182,212,0.3)] border border-cyan-500/40 transition-transform duration-200"
              />
            </div>

            {/* Bottom Prompt Caption Bar */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-cyan-500/30 flex items-center justify-between gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider">
                  Direct Neural Prompt
                </span>
                <p className="text-xs text-slate-200 font-medium leading-relaxed">
                  "{fullscreenImage.prompt}"
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleCopyPrompt(fullscreenImage)}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono flex items-center gap-1.5"
                >
                  {copiedId === fullscreenImage.id ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-cyan-400" />}
                  <span>{copiedId === fullscreenImage.id ? "Copied" : "Copy Prompt"}</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
