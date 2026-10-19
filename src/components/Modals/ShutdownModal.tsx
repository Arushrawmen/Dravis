/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Sci-Fi PC Shutdown Safety Confirmation Modal
 */

import React, { useState } from "react";
import { Power, AlertTriangle, X, ShieldAlert } from "lucide-react";
import { soundEffects } from "../../utils/audioSynth";

interface ShutdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmShutdown: () => void;
  soundEffectsEnabled: boolean;
}

export const ShutdownModal: React.FC<ShutdownModalProps> = ({
  isOpen,
  onClose,
  onConfirmShutdown,
  soundEffectsEnabled,
}) => {
  const [isShuttingDown, setIsShuttingDown] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (soundEffectsEnabled) soundEffects.playAlert();
    setIsShuttingDown(true);
    setTimeout(() => {
      onConfirmShutdown();
      setIsShuttingDown(false);
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-950 border border-white/10 rounded-2xl p-6 flex flex-col gap-4 shadow-[0_0_40px_rgba(0,0,0,0.6)]">
        <div className="flex items-center justify-between pb-2 border-b border-white/5">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-400 animate-pulse" />
            <h3 className="text-sm font-mono font-bold text-rose-300 uppercase tracking-wider">
              AUTHORITY SAFETY OVERRIDE
            </h3>
          </div>
          <button
            onClick={() => {
              if (soundEffectsEnabled) soundEffects.playChirp();
              onClose();
            }}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col items-center text-center gap-3 py-2">
          <div className="p-4 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.2)]">
            <Power className="w-8 h-8" />
          </div>
          <div>
            <h4 className="text-base font-bold text-white font-mono">
              Initiate System Shutdown Protocol?
            </h4>
            <p className="text-xs text-slate-300 font-sans mt-1 leading-relaxed">
              This action will park all 40 neural cognitive nodes, flush working buffers, and safely power down the simulation interface.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 font-mono text-xs pt-3 border-t border-white/5">
          <button
            onClick={() => {
              if (soundEffectsEnabled) soundEffects.playChirp();
              onClose();
            }}
            className="px-4 py-2.5 rounded-xl bg-white/5 text-slate-300 hover:text-white border border-white/10 transition-all"
          >
            ABORT
          </button>
          <button
            onClick={handleConfirm}
            disabled={isShuttingDown}
            className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold transition-all shadow-[0_0_15px_rgba(225,29,72,0.4)]"
          >
            {isShuttingDown ? "POWERING DOWN..." : "CONFIRM SHUTDOWN"}
          </button>
        </div>
      </div>
    </div>
  );
};
