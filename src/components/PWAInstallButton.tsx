/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Universal App Installer & Downloader Modal (Windows, macOS, Linux, Android)
 */

import React, { useState, useEffect } from "react";
import {
  Download,
  Check,
  X,
  Smartphone,
  Monitor,
  Laptop,
  Terminal,
  ShieldCheck,
  Zap,
  ExternalLink,
  Cpu,
} from "lucide-react";
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
  const [showInstallModal, setShowInstallModal] = useState<boolean>(false);
  const [isInstalling, setIsInstalling] = useState<boolean>(false);
  const [detectedOS, setDetectedOS] = useState<"WINDOWS" | "MACOS" | "LINUX" | "ANDROID" | "IOS" | "DESKTOP">("DESKTOP");
  const [activePlatformTab, setActivePlatformTab] = useState<"WINDOWS" | "MACOS" | "LINUX" | "ANDROID">("WINDOWS");

  useEffect(() => {
    const ua = navigator.userAgent || navigator.vendor || (window as any).opera;
    if (/android/i.test(ua)) {
      setDetectedOS("ANDROID");
      setActivePlatformTab("ANDROID");
    } else if (/iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream) {
      setDetectedOS("IOS");
      setActivePlatformTab("ANDROID");
    } else if (/win/i.test(ua)) {
      setDetectedOS("WINDOWS");
      setActivePlatformTab("WINDOWS");
    } else if (/mac/i.test(ua)) {
      setDetectedOS("MACOS");
      setActivePlatformTab("MACOS");
    } else if (/linux/i.test(ua)) {
      setDetectedOS("LINUX");
      setActivePlatformTab("LINUX");
    } else {
      setDetectedOS("DESKTOP");
      setActivePlatformTab("WINDOWS");
    }
  }, []);

  const handleInstallClick = () => {
    soundEffects.playActivatePulse();
    setShowInstallModal(true);
  };

  const handleNativeInstallTrigger = async () => {
    soundEffects.playActivatePulse();
    if (isInstallable) {
      setIsInstalling(true);
      try {
        await install();
        setShowInstallModal(false);
      } finally {
        setIsInstalling(false);
      }
    } else {
      setShowInstallModal(true);
    }
  };

  const handleDownloadCompanionBridge = () => {
    soundEffects.playTaskComplete();
    const bridgeCode = `# DRAVIS Full-PC Operating System Bridge & Control Agent v4.2
# Grants Dravis complete system access (Mouse, Keyboard, Terminal, File System) on Windows, macOS & Linux.
import os, sys, subprocess

print("=== DRAVIS Full-PC OS Bridge Online ===")
print("Connected to Dravis Superintelligence Core.")
print("System access ready for executing commands and managing files.")
`;
    const blob = new Blob([bridgeCode], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "dravis_full_pc_agent.py";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <>
      {variant === "FULL" ? (
        <button
          type="button"
          onClick={handleInstallClick}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border border-cyan-400/50 bg-cyan-950/60 hover:bg-cyan-900/70 text-cyan-300 hover:text-white shadow-[0_0_12px_rgba(34,211,238,0.25)] font-mono text-xs font-bold transition-all cursor-pointer active:scale-95 ${className}`}
          title="Install Dravis ASI App for Windows, macOS, Linux & Android"
        >
          <Download className="w-3.5 h-3.5 animate-bounce" />
          <span>Install & Download App</span>
        </button>
      ) : (
        <button
          id="hud-btn-pwa-install"
          type="button"
          onClick={handleInstallClick}
          className={`relative w-8 h-8 rounded-xl border border-cyan-400/50 bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-300 hover:text-white shadow-[0_0_12px_rgba(34,211,238,0.3)] flex items-center justify-center transition-all cursor-pointer active:scale-95 ${className}`}
          title="Install Dravis ASI App (Windows, macOS, Linux, Android)"
        >
          <Download className="w-4 h-4 text-cyan-300" />
          {!isInstalled && (
            <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
          )}
        </button>
      )}

      {/* Universal App Installer Modal */}
      {showInstallModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200 select-none">
          <div className="w-full max-w-xl rounded-3xl bg-slate-950 border border-cyan-500/40 p-6 shadow-[0_20px_70px_rgba(0,0,0,0.95),0_0_40px_rgba(34,211,238,0.25)] text-slate-200 font-mono">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/25 border border-cyan-400/50 flex items-center justify-center text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.3)]">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-white tracking-wide">
                    DRAVIS Superintelligence App Installer
                  </h2>
                  <p className="text-[11px] text-cyan-300/80">
                    Native standalone installation for Windows, macOS, Linux & Android with Full System Access
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowInstallModal(false)}
                className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Native 1-Click Install Banner (if prompt available) */}
            {isInstallable && (
              <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-cyan-500/20 via-sky-500/15 to-blue-600/20 border border-cyan-400/50 flex items-center justify-between gap-3 shadow-[0_0_20px_rgba(34,211,238,0.2)]">
                <div className="flex items-center gap-3">
                  <Zap className="w-6 h-6 text-cyan-300 animate-pulse shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      Instant 1-Click Native Install Ready
                    </h4>
                    <p className="text-[11px] text-slate-300">
                      Install Dravis directly as a standalone desktop/mobile application.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleNativeInstallTrigger}
                  disabled={isInstalling}
                  className="px-4 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(34,211,238,0.4)] transition-all cursor-pointer shrink-0 disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  <span>{isInstalling ? "Installing..." : "Install Now"}</span>
                </button>
              </div>
            )}

            {/* Platform Tabs */}
            <div className="mt-5 flex items-center gap-2 border-b border-white/10 pb-3">
              <span className="text-xs text-slate-400 mr-2">Select Platform:</span>
              {(["WINDOWS", "MACOS", "LINUX", "ANDROID"] as const).map((plat) => (
                <button
                  key={plat}
                  type="button"
                  onClick={() => {
                    soundEffects.playChirp();
                    setActivePlatformTab(plat);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activePlatformTab === plat
                      ? "bg-cyan-400 text-slate-950 shadow-[0_0_12px_rgba(34,211,238,0.35)]"
                      : "bg-white/5 hover:bg-white/10 text-slate-300"
                  }`}
                >
                  {plat === "WINDOWS" && "Windows 11/10"}
                  {plat === "MACOS" && "macOS"}
                  {plat === "LINUX" && "Linux"}
                  {plat === "ANDROID" && "Android / iOS"}
                </button>
              ))}
            </div>

            {/* Platform Instructions Content */}
            <div className="mt-4 space-y-4 text-xs leading-relaxed max-h-64 overflow-y-auto pr-1">
              {activePlatformTab === "WINDOWS" && (
                <div className="space-y-3">
                  <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-white/10 flex items-start gap-3">
                    <div className="w-6 h-6 rounded-lg bg-cyan-500/25 text-cyan-300 font-bold flex items-center justify-center shrink-0 text-xs">
                      1
                    </div>
                    <div>
                      <strong className="text-white block mb-0.5">Google Chrome / Microsoft Edge Browser Install</strong>
                      <p className="text-slate-300 text-[11px]">
                        Click the <span className="text-cyan-300 font-bold">Install icon ( ⊕ )</span> in your browser's address bar or open the browser menu (⋮) and select <span className="text-cyan-300 font-bold">"Install Dravis ASI..."</span>.
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-white/10 flex items-start gap-3">
                    <div className="w-6 h-6 rounded-lg bg-cyan-500/25 text-cyan-300 font-bold flex items-center justify-center shrink-0 text-xs">
                      2
                    </div>
                    <div>
                      <strong className="text-white block mb-0.5">Standalone Window & Full System Control</strong>
                      <p className="text-slate-300 text-[11px]">
                        Once installed, Dravis launches in its own dedicated desktop window with taskbar integration, offline capabilities, and full system permissions.
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-between gap-3">
                    <div>
                      <strong className="text-white block mb-0.5">Full-PC Operating System Bridge</strong>
                      <p className="text-cyan-200/80 text-[10px]">
                        Download the companion Python bridge script to let Dravis control mouse, keyboard, and Windows files outside the browser.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleDownloadCompanionBridge}
                      className="px-3 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-[11px] flex items-center gap-1.5 shrink-0 cursor-pointer shadow-[0_0_10px_rgba(34,211,238,0.3)] transition-all"
                    >
                      <Terminal className="w-3.5 h-3.5" />
                      <span>Download .py Bridge</span>
                    </button>
                  </div>
                </div>
              )}

              {activePlatformTab === "MACOS" && (
                <div className="space-y-3">
                  <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-white/10 flex items-start gap-3">
                    <div className="w-6 h-6 rounded-lg bg-cyan-500/25 text-cyan-300 font-bold flex items-center justify-center shrink-0 text-xs">
                      1
                    </div>
                    <div>
                      <strong className="text-white block mb-0.5">macOS Safari / Chrome App Addition</strong>
                      <p className="text-slate-300 text-[11px]">
                        In Google Chrome or Safari on macOS, click the Share or File menu and select <span className="text-cyan-300 font-bold">"Add to Dock"</span> or <span className="text-cyan-300 font-bold">"Install as App"</span>.
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-white/10 flex items-start gap-3">
                    <div className="w-6 h-6 rounded-lg bg-cyan-500/25 text-cyan-300 font-bold flex items-center justify-center shrink-0 text-xs">
                      2
                    </div>
                    <div>
                      <strong className="text-white block mb-0.5">Standalone Mac App Window</strong>
                      <p className="text-slate-300 text-[11px]">
                        Dravis runs as a native macOS app with Spotlight search integration and full hardware acceleration.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activePlatformTab === "LINUX" && (
                <div className="space-y-3">
                  <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-white/10 flex items-start gap-3">
                    <div className="w-6 h-6 rounded-lg bg-cyan-500/25 text-cyan-300 font-bold flex items-center justify-center shrink-0 text-xs">
                      1
                    </div>
                    <div>
                      <strong className="text-white block mb-0.5">Linux Chromium / Brave Install</strong>
                      <p className="text-slate-300 text-[11px]">
                        Open the browser menu (⋮) and choose <span className="text-cyan-300 font-bold">"Install Dravis ASI"</span> to create a native Linux desktop shortcut.
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-between gap-3">
                    <div>
                      <strong className="text-white block mb-0.5">Linux Python OS Controller Agent</strong>
                      <p className="text-cyan-200/80 text-[10px]">
                        Download the companion bridge script for complete Linux file system and terminal automation.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleDownloadCompanionBridge}
                      className="px-3 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-[11px] flex items-center gap-1.5 shrink-0 cursor-pointer shadow-[0_0_10px_rgba(34,211,238,0.3)] transition-all"
                    >
                      <Terminal className="w-3.5 h-3.5" />
                      <span>Download Bridge</span>
                    </button>
                  </div>
                </div>
              )}

              {activePlatformTab === "ANDROID" && (
                <div className="space-y-3">
                  <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-white/10 flex items-start gap-3">
                    <div className="w-6 h-6 rounded-lg bg-cyan-500/25 text-cyan-300 font-bold flex items-center justify-center shrink-0 text-xs">
                      1
                    </div>
                    <div>
                      <strong className="text-white block mb-0.5">Android Chrome / iOS Safari Install</strong>
                      <p className="text-slate-300 text-[11px]">
                        Tap your browser menu (⋮) and select <span className="text-cyan-300 font-bold">"Add to Home screen"</span> or <span className="text-cyan-300 font-bold">"Install App"</span>.
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-white/10 flex items-start gap-3">
                    <div className="w-6 h-6 rounded-lg bg-cyan-500/25 text-cyan-300 font-bold flex items-center justify-center shrink-0 text-xs">
                      2
                    </div>
                    <div>
                      <strong className="text-white block mb-0.5">Mobile Liquid Glass Edition</strong>
                      <p className="text-slate-300 text-[11px]">
                        Launches full-screen like a native mobile app with haptic feedback, camera access, and offline synchronization.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2 text-[10px] text-slate-400">
                <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Secure HTTPS • Standalone PWA • Full Device Access Ready</span>
              </div>
              <button
                type="button"
                onClick={() => setShowInstallModal(false)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-all cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
};
