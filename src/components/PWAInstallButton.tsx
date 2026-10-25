/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * PWA Install Action Button & iOS Guided Install Modal
 * Compatible with Chromium, Android, and iOS Safari
 */

import React, { useState } from "react";
import { Download, Check, X, Smartphone, Share, PlusSquare } from "lucide-react";
import { usePWAInstall } from "../hooks/usePWAInstall";
import { soundEffects } from "../utils/audioSynth";

interface PWAInstallButtonProps {
  className?: string;
  variant?: "ICON" | "FULL";
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className = "",
  variant = "ICON",
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState<boolean>(false);
  const [isInstalling, setIsInstalling] = useState<boolean>(false);

  // If already running in standalone PWA mode, suppress the install prompt
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    soundEffects.playActivatePulse();
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }
    if (isInstallable) {
      setIsInstalling(true);
      try {
        await install();
      } finally {
        setIsInstalling(false);
      }
    } else {
      // Browser didn't fire beforeinstallprompt yet or standard desktop browser
      setShowIOSGuide(true);
    }
  };

  return (
    <>
      {variant === "FULL" ? (
        <button
          type="button"
          onClick={handleInstallClick}
          disabled={isInstalling}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border border-cyan-400/50 bg-cyan-950/60 hover:bg-cyan-900/70 text-cyan-300 hover:text-white shadow-[0_0_12px_rgba(34,211,238,0.25)] font-mono text-xs font-bold transition-all cursor-pointer active:scale-95 ${className}`}
          title="Install Dravis ASI Web App on your Device"
        >
          <Download className="w-3.5 h-3.5 animate-bounce" />
          <span>Install App</span>
        </button>
      ) : (
        <button
          id="hud-btn-pwa-install"
          type="button"
          onClick={handleInstallClick}
          disabled={isInstalling}
          className={`relative w-8 h-8 rounded-xl border border-cyan-400/50 bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-300 hover:text-white shadow-[0_0_12px_rgba(34,211,238,0.3)] flex items-center justify-center transition-all cursor-pointer active:scale-95 ${className}`}
          title="Install Dravis ASI as a Native Web App"
        >
          <Download className="w-4 h-4 text-cyan-300" />
          <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
          </span>
        </button>
      )}

      {/* Guided Mobile / Desktop Installation Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-2xl bg-slate-950 border border-cyan-500/40 p-5 shadow-[0_10px_40px_rgba(0,0,0,0.9),0_0_25px_rgba(34,211,238,0.2)] text-slate-200 font-mono">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-bold text-white tracking-wide">
                  Install Dravis Web App
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs leading-relaxed">
              <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/20 flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center shrink-0 text-[10px]">
                  1
                </span>
                <p>
                  In your browser toolbar (Chrome, Edge, or Safari), tap the{" "}
                  <strong className="text-cyan-300">Share</strong>{" "}
                  <Share className="w-3.5 h-3.5 inline mx-0.5 text-cyan-400" /> or{" "}
                  <strong className="text-cyan-300">Menu (⋮)</strong> icon.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/20 flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center shrink-0 text-[10px]">
                  2
                </span>
                <p>
                  Scroll down and choose{" "}
                  <strong className="text-cyan-300">Add to Home Screen</strong>{" "}
                  <PlusSquare className="w-3.5 h-3.5 inline mx-0.5 text-cyan-400" /> or{" "}
                  <strong className="text-cyan-300">Install App</strong>.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/20 flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center shrink-0 text-[10px]">
                  3
                </span>
                <p>
                  Launch directly from your home screen for immersive standalone fullscreen
                  performance with offline access.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIOSGuide(false)}
              className="mt-5 w-full py-2.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/50 text-cyan-300 font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5 text-cyan-400" />
              <span>Understood</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
};
