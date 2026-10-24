/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Autonomous Subtle Spotlight Indicator Component
 * Renders an animated glowing cyber spotlight ring over targeted UI elements
 * when Dravis autonomously navigates to sections (e.g. Gmail, Drive, Contacts, Maps).
 */

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Compass } from "lucide-react";

interface SpotlightIndicatorProps {
  targetElementId: string | null;
  active: boolean;
  label?: string;
  onComplete?: () => void;
}

interface SpotlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export const SpotlightIndicator: React.FC<SpotlightIndicatorProps> = ({
  targetElementId,
  active,
  label,
  onComplete,
}) => {
  const [rect, setRect] = useState<SpotlightRect | null>(null);

  useEffect(() => {
    if (!active || !targetElementId) {
      setRect(null);
      return;
    }

    const updatePosition = () => {
      const el = document.getElementById(targetElementId);
      if (el) {
        const b = el.getBoundingClientRect();
        setRect({
          top: b.top,
          left: b.left,
          width: b.width,
          height: b.height,
        });
      }
    };

    updatePosition();
    const handleResize = () => updatePosition();
    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleResize, true);

    const timer = setTimeout(() => {
      onComplete?.();
    }, 1500);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleResize, true);
      clearTimeout(timer);
    };
  }, [active, targetElementId, onComplete]);

  if (!active || !rect) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 pointer-events-none z-50">
        {/* Subtle Ambient Radial Highlight */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.1 }}
          transition={{ duration: 0.25 }}
          style={{
            position: "absolute",
            top: rect.top - 12,
            left: rect.left - 12,
            width: rect.width + 24,
            height: rect.height + 24,
          }}
          className="rounded-2xl border-2 border-cyan-400 bg-cyan-400/10 shadow-[0_0_35px_rgba(34,211,238,0.7)] pointer-events-none"
        >
          {/* Corner target reticles */}
          <div className="absolute -top-1.5 -left-1.5 w-3 h-3 border-t-2 border-l-2 border-cyan-300" />
          <div className="absolute -top-1.5 -right-1.5 w-3 h-3 border-t-2 border-r-2 border-cyan-300" />
          <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 border-b-2 border-l-2 border-cyan-300" />
          <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 border-b-2 border-r-2 border-cyan-300" />

          {/* Minimal Target Label */}
          {label && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute -top-6 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-md bg-slate-950/90 border border-cyan-400/60 text-cyan-300 text-[10px] font-mono font-bold tracking-wider flex items-center gap-1 shadow-[0_0_12px_rgba(34,211,238,0.4)] whitespace-nowrap"
            >
              <Compass className="w-2.5 h-2.5 text-cyan-400 animate-spin" />
              <span>{label}</span>
            </motion.div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
