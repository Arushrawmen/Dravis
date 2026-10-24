import React, { useState, useEffect, useRef } from "react";
import { MousePointer, Check, Copy, Terminal, Sparkles, X } from "lucide-react";

export interface VirtualCursorAction {
  id: string;
  type: "MOVE" | "CLICK" | "TYPE";
  targetX?: number; // percentage or px
  targetY?: number;
  label?: string;
  textToType?: string;
  durationMs?: number;
}

interface VirtualCursorOverlayProps {
  currentAction: VirtualCursorAction | null;
  onActionComplete?: (actionId: string) => void;
}

export const VirtualCursorOverlay: React.FC<VirtualCursorOverlayProps> = ({
  currentAction,
  onActionComplete,
}) => {
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number }>({ x: 50, y: 50 });
  const [isClicking, setIsClicking] = useState<boolean>(false);
  const [typedBuffer, setTypedBuffer] = useState<string>("");
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [copiedConfirmation, setCopiedConfirmation] = useState<string | null>(null);
  const [showAutoScriptModal, setShowAutoScriptModal] = useState<boolean>(false);

  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!currentAction) {
      setIsTyping(false);
      setTypedBuffer("");
      return;
    }

    const { id, type, targetX = 50, targetY = 50, textToType, durationMs = 1200 } = currentAction;

    // 1. Smooth human glide using easeInOutCubic
    const startX = cursorPos.x;
    const startY = cursorPos.y;
    const destX = targetX;
    const destY = targetY;
    const startTime = performance.now();

    const animateMovement = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      // easeInOutCubic with slight human bezier curve
      const eased = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      // Slight human micro-arc jitter
      const arcJitter = Math.sin(progress * Math.PI) * 1.5;

      const currentX = startX + (destX - startX) * eased;
      const currentY = startY + (destY - startY) * eased + arcJitter;

      setCursorPos({ x: currentX, y: currentY });

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animateMovement);
      } else {
        // Arrived at destination!
        if (type === "CLICK") {
          setIsClicking(true);
          setTimeout(() => {
            setIsClicking(false);
            onActionComplete?.(id);
          }, 450);
        } else if (type === "TYPE" && textToType) {
          // Autonomous human typing simulation
          setIsTyping(true);
          setTypedBuffer("");

          // Automatically copy to OS clipboard so user can press Ctrl+V anywhere on their desktop
          navigator.clipboard.writeText(textToType).catch(() => {});
          setCopiedConfirmation(textToType);

          let charIdx = 0;
          const typingInterval = setInterval(() => {
            if (charIdx < textToType.length) {
              setTypedBuffer((prev) => prev + textToType.charAt(charIdx));
              charIdx++;
            } else {
              clearInterval(typingInterval);
              setTimeout(() => {
                setIsTyping(false);
                onActionComplete?.(id);
              }, 800);
            }
          }, 35); // ~75 WPM human typing cadence
        } else {
          onActionComplete?.(id);
        }
      }
    };

    animationFrameRef.current = requestAnimationFrame(animateMovement);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [currentAction, onActionComplete]);

  // If no action is active and no typed text toast, hide overlay
  if (!currentAction && !copiedConfirmation) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
      {/* Human Virtual Cursor Pointer */}
      {currentAction && (
        <div
          className="absolute transition-transform duration-75 ease-out select-none"
          style={{
            left: `${cursorPos.x}%`,
            top: `${cursorPos.y}%`,
            transform: "translate(-2px, -2px)",
          }}
        >
          {/* Cursor Graphic */}
          <div className="relative">
            <svg
              className={`w-7 h-7 drop-shadow-[0_4px_12px_rgba(6,182,212,0.6)] ${
                isClicking ? "scale-90" : "scale-100"
              } transition-transform duration-100`}
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M3 3L10.07 19.97L12.58 13.58L18.97 11.07L3 3Z"
                fill="#06b6d4"
                stroke="#ffffff"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </svg>

            {/* Click Ripple Wave */}
            {isClicking && (
              <span className="absolute -top-3 -left-3 w-12 h-12 rounded-full border-2 border-cyan-400 bg-cyan-400/20 animate-ping" />
            )}

            {/* Action Label Badge */}
            {currentAction.label && (
              <div className="absolute top-6 left-5 px-2.5 py-1 rounded-lg bg-slate-950/90 border border-cyan-500/40 text-[11px] font-mono text-cyan-300 shadow-xl whitespace-nowrap flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-cyan-400 animate-pulse" />
                <span>{currentAction.label}</span>
              </div>
            )}
          </div>

          {/* Floating Typing Bubble while typing */}
          {isTyping && (
            <div className="absolute top-10 left-4 max-w-sm p-3 rounded-2xl bg-slate-900/95 border border-cyan-400/50 shadow-[0_10px_35px_rgba(0,0,0,0.8)] backdrop-blur-md">
              <div className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider mb-1 flex items-center gap-1">
                <span>Dravis Typing Cadence</span>
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
              </div>
              <p className="text-xs text-white font-mono leading-relaxed break-words">
                {typedBuffer}
                <span className="inline-block w-2 h-4 bg-cyan-400 ml-0.5 animate-pulse align-middle" />
              </p>
            </div>
          )}
        </div>
      )}

      {/* Autonomous Typed & Copied to Clipboard Notification Toast */}
      {copiedConfirmation && (
        <div className="pointer-events-auto fixed bottom-24 right-6 max-w-md w-full bg-slate-900/95 border border-cyan-500/50 rounded-2xl p-4 shadow-[0_15px_50px_rgba(0,0,0,0.85)] backdrop-blur-xl animate-in slide-in-from-bottom-5 duration-200">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                <Check className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Dravis Typed & Copied</h4>
                <p className="text-[11px] text-cyan-300 font-mono">Ready to paste anywhere (Ctrl + V)</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setCopiedConfirmation(null)}
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950/80 border border-white/5 text-xs text-slate-200 font-mono max-h-24 overflow-y-auto mb-3">
            {copiedConfirmation}
          </div>

          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(copiedConfirmation);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-medium transition-all"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Again</span>
            </button>
            <button
              type="button"
              onClick={() => setShowAutoScriptModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-all"
            >
              <Terminal className="w-3.5 h-3.5 text-cyan-400" />
              <span>OS Script</span>
            </button>
          </div>
        </div>
      )}

      {/* Standalone OS Automation Script Modal (for users wanting native PyAutoGUI / PowerShell execution) */}
      {showAutoScriptModal && copiedConfirmation && (
        <div className="pointer-events-auto fixed inset-0 z-[10000] bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-slate-900 border border-cyan-500/40 rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">Standalone OS Desktop Automation</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAutoScriptModal(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 mb-3 leading-relaxed">
              To allow Dravis to directly click and type outside the browser on Windows, macOS, or Linux, you can run this instant Python snippet:
            </p>

            <pre className="p-3 bg-slate-950 rounded-xl border border-white/10 text-cyan-300 font-mono text-xs overflow-x-auto mb-4 select-all">
{`# Run in terminal: pip install pyautogui
import pyautogui, time
time.sleep(2)
pyautogui.typewrite("""${copiedConfirmation.replace(/"/g, '\\"')}""", interval=0.03)`}
            </pre>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(`import pyautogui, time\ntime.sleep(2)\npyautogui.typewrite("""${copiedConfirmation}""", interval=0.03)`);
                  setShowAutoScriptModal(false);
                }}
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs transition-all"
              >
                Copy Python Script
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
