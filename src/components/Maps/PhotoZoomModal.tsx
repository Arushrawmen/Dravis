/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * High-Resolution Photo Zoom Modal for Google Maps Places
 * Allows users to inspect place photos in ultra-high resolution with
 * interactive cursor wheel zoom in/out, pan-dragging, and on-screen zoom controls.
 */

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Minimize2,
  MapPin,
  Download,
  Info,
} from "lucide-react";

export interface PlacePhotoItem {
  id: string;
  url: string;
  title: string;
  caption?: string;
  author?: string;
  dimensions?: string;
}

interface PhotoZoomModalProps {
  photo: PlacePhotoItem | null;
  onClose: () => void;
}

export const PhotoZoomModal: React.FC<PhotoZoomModalProps> = ({ photo, onClose }) => {
  const [scale, setScale] = useState<number>(1);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Reset state when photo changes
  useEffect(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, [photo]);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "+" || e.key === "=") handleZoomIn();
      else if (e.key === "-" || e.key === "_") handleZoomOut();
      else if (e.key === "0") handleReset();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleZoomIn = () => {
    setScale((prev) => Math.min(5, Math.round((prev + 0.35) * 100) / 100));
  };

  const handleZoomOut = () => {
    setScale((prev) => {
      const next = Math.max(0.5, Math.round((prev - 0.35) * 100) / 100);
      if (next <= 1) setPosition({ x: 0, y: 0 });
      return next;
    });
  };

  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  // Cursor wheel zoom handler
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.25 : -0.25;
    setScale((prev) => {
      const next = Math.min(5, Math.max(0.5, Math.round((prev + delta) * 100) / 100));
      if (next <= 1) setPosition({ x: 0, y: 0 });
      return next;
    });
  };

  // Mouse drag-to-pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || scale <= 1) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  if (!photo) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-2xl flex flex-col select-none overflow-hidden"
      >
        {/* Top Floating Control Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-white/10 bg-slate-900/80 backdrop-blur-xl z-20">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-1.5 rounded-lg bg-cyan-500/20 border border-cyan-400/30 text-cyan-400">
              <MapPin className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-mono font-bold text-white truncate">{photo.title}</h3>
              {photo.caption && (
                <p className="text-[11px] text-slate-400 font-sans truncate">{photo.caption}</p>
              )}
            </div>
          </div>

          {/* Interactive Zoom Controls */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center bg-black/40 border border-white/10 rounded-xl p-1 gap-1">
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={scale <= 0.5}
                title="Zoom Out (-)"
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 disabled:opacity-30 transition-all cursor-pointer"
              >
                <ZoomOut className="w-4 h-4" />
              </button>

              <span className="px-2 py-0.5 text-xs font-mono font-bold text-cyan-300 min-w-14 text-center">
                {Math.round(scale * 100)}%
              </span>

              <button
                type="button"
                onClick={handleZoomIn}
                disabled={scale >= 5}
                title="Zoom In (+)"
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 disabled:opacity-30 transition-all cursor-pointer"
              >
                <ZoomIn className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleReset}
                title="Reset to 100% (0)"
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            <a
              href={photo.url}
              target="_blank"
              rel="noopener noreferrer"
              download
              title="Download image"
              className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-cyan-300 hover:bg-white/10 transition-all"
            >
              <Download className="w-4 h-4" />
            </a>

            <button
              type="button"
              onClick={onClose}
              title="Close modal (Esc)"
              className="p-2 rounded-xl bg-white/10 hover:bg-rose-500/20 border border-white/15 hover:border-rose-400 text-slate-300 hover:text-rose-300 transition-all cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Viewport Canvas with Wheel Zoom and Drag to Pan */}
        <div
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className={`flex-1 relative overflow-hidden flex items-center justify-center p-4 ${
            scale > 1 ? (isDragging ? "cursor-grabbing" : "cursor-grab") : "cursor-zoom-in"
          }`}
          onClick={(e) => {
            if (scale === 1 && e.target === e.currentTarget) {
              handleZoomIn();
            }
          }}
        >
          <div
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
              transition: isDragging ? "none" : "transform 0.15s ease-out",
            }}
            className="relative max-w-full max-h-full flex items-center justify-center pointer-events-auto"
          >
            <img
              src={photo.url}
              alt={photo.title}
              draggable={false}
              className="max-w-[90vw] max-h-[82vh] object-contain rounded-xl shadow-[0_0_60px_rgba(0,0,0,0.8)] border border-white/10 select-none"
            />
          </div>

          {/* Bottom HUD Hint */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-white/10 text-[11px] font-mono text-slate-400 backdrop-blur-md flex items-center gap-2 pointer-events-none">
            <Info className="w-3.5 h-3.5 text-cyan-400" />
            <span>Scroll mouse wheel to zoom in / out • Click & drag to pan</span>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
