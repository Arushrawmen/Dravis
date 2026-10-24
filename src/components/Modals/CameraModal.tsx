/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Live Moveable Camera & Screen Capture Modal with Scroll-Wheel Pan/Zoom
 * + Working Left-Click, Wheel/Cursor-Click, and Right-Click Controls
 */

import React, { useRef, useState, useEffect } from "react";
import {
  Camera,
  X,
  Sparkles,
  RefreshCw,
  Move,
  ZoomIn,
  ZoomOut,
  MousePointer,
  Crosshair,
} from "lucide-react";
import { soundEffects } from "../../utils/audioSynth";

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAnalyzeCapture: (base64: string) => Promise<void>;
  soundEffectsEnabled: boolean;
}

export const CameraModal: React.FC<CameraModalProps> = ({
  isOpen,
  onClose,
  onAnalyzeCapture,
  soundEffectsEnabled,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Interactive Camera Preview Movement (Scroll Wheel & Wheel-Button Pan/Tilt/Zoom)
  const [camTransform, setCamTransform] = useState<{
    panX: number;
    panY: number;
    zoom: number;
    rotX: number;
    rotY: number;
    mirrored: boolean;
  }>({
    panX: 0,
    panY: 0,
    zoom: 1.15,
    rotX: 0,
    rotY: 0,
    mirrored: false,
  });
  const [wheelMode, setWheelMode] = useState<"MOVE_AND_ZOOM" | "PURE_MOVE">("MOVE_AND_ZOOM");
  const isDraggingRef = useRef<boolean>(false);
  const dragBtnRef = useRef<number>(0);
  const lastMouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [reticlePos, setReticlePos] = useState<{ xPercent: number; yPercent: number }>({
    xPercent: 50,
    yPercent: 50,
  });

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
      setCapturedImage(null);
    }
    return () => stopCamera();
  }, [isOpen]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      setCameraError("Camera access denied or unavailable: " + err.message);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const captureFrame = (): string | null => {
    if (!videoRef.current) return null;
    if (soundEffectsEnabled) soundEffects.playActivatePulse();

    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/png");
      setCapturedImage(dataUrl);
      return dataUrl;
    }
    return null;
  };

  const handleSendToVision = async (overrideImage?: string) => {
    const imgToUse = overrideImage || capturedImage || captureFrame();
    if (!imgToUse) return;
    setIsProcessing(true);
    try {
      await onAnalyzeCapture(imgToUse);
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-black border border-cyan-400/40 rounded-2xl p-5 flex flex-col gap-3.5 shadow-[0_0_50px_rgba(0,0,0,0.95)]">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider">
                INTERACTIVE MOVEABLE CAMERA PREVIEW & VISION HUD
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                Scroll Wheel or Hold Wheel-Button & Drag to Move / Pan / Zoom Camera View
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 font-mono text-[11px]">
            <button
              type="button"
              onClick={() =>
                setWheelMode((prev) =>
                  prev === "MOVE_AND_ZOOM" ? "PURE_MOVE" : "MOVE_AND_ZOOM"
                )
              }
              className="px-2.5 py-1 rounded-lg bg-cyan-500/20 border border-cyan-400/50 text-cyan-200 font-bold cursor-pointer flex items-center gap-1"
            >
              <Move className="w-3.5 h-3.5" />
              <span>
                {wheelMode === "PURE_MOVE" ? "WHEEL: MOVE CAMERA" : "WHEEL: MOVE + ZOOM"}
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (soundEffectsEnabled) soundEffects.playChirp();
                onClose();
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Dedicated Left-Click, Wheel/Cursor-Click & Right-Click Working Buttons for Camera Preview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono text-[11px]">
          <button
            type="button"
            onClick={() => captureFrame()}
            className="py-2 px-3 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/50 text-cyan-200 font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all"
          >
            <MousePointer className="w-3.5 h-3.5 text-cyan-400" />
            <span>L-CLICK: Lock & Capture Frame</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (soundEffectsEnabled) soundEffects.playChirp();
              // Cycle camera pan across areas so clicking this button moves the camera preview around
              setCamTransform((prev) => {
                const nextPanX = prev.panX === 0 ? 90 : prev.panX > 0 ? -90 : 0;
                const nextPanY = prev.panY === 0 ? -55 : prev.panY < 0 ? 55 : 0;
                return {
                  ...prev,
                  panX: nextPanX,
                  panY: nextPanY,
                  zoom: Math.max(1.25, prev.zoom),
                };
              });
            }}
            className="py-2 px-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/50 text-emerald-200 font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all"
          >
            <Move className="w-3.5 h-3.5 text-emerald-400" />
            <span>WHEEL CLICK: Move Camera Area</span>
          </button>

          <button
            type="button"
            onClick={() => handleSendToVision()}
            className="py-2 px-3 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-400/50 text-purple-200 font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>R-CLICK: AI Vision Scan</span>
          </button>
        </div>

        {cameraError ? (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono flex items-center justify-between">
            <span>{cameraError}</span>
            <button
              type="button"
              onClick={startCamera}
              className="px-3 py-1 rounded-lg bg-rose-500/20 border border-rose-400 text-white cursor-pointer"
            >
              Retry Camera
            </button>
          </div>
        ) : (
          <div
            onMouseDown={(e) => {
              if (e.button === 1) e.preventDefault();
              isDraggingRef.current = true;
              dragBtnRef.current = e.button;
              lastMouseRef.current = { x: e.clientX, y: e.clientY };

              const rect = e.currentTarget.getBoundingClientRect();
              setReticlePos({
                xPercent: Math.round(((e.clientX - rect.left) / rect.width) * 100),
                yPercent: Math.round(((e.clientY - rect.top) / rect.height) * 100),
              });
            }}
            onMouseUp={() => {
              isDraggingRef.current = false;
            }}
            onMouseLeave={() => {
              isDraggingRef.current = false;
            }}
            onAuxClick={(e) => e.preventDefault()}
            onContextMenu={(e) => {
              e.preventDefault();
              // Right-click resets or flips mirror view
              setCamTransform((prev) => ({
                ...prev,
                mirrored: !prev.mirrored,
              }));
            }}
            onMouseMove={(e) => {
              if (!isDraggingRef.current) return;
              const dx = e.clientX - lastMouseRef.current.x;
              const dy = e.clientY - lastMouseRef.current.y;
              lastMouseRef.current = { x: e.clientX, y: e.clientY };

              setCamTransform((prev) => ({
                ...prev,
                panX: Math.max(-340, Math.min(340, prev.panX + dx * 1.35)),
                panY: Math.max(-220, Math.min(220, prev.panY + dy * 1.35)),
                rotY:
                  dragBtnRef.current === 2
                    ? Math.max(-25, Math.min(25, prev.rotY + dx * 0.2))
                    : prev.rotY,
                rotX:
                  dragBtnRef.current === 2
                    ? Math.max(-20, Math.min(20, prev.rotX - dy * 0.2))
                    : prev.rotX,
              }));
            }}
            onWheel={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const rect = e.currentTarget.getBoundingClientRect();
              const offsetX = e.clientX - (rect.left + rect.width / 2);
              const offsetY = e.clientY - (rect.top + rect.height / 2);

              setCamTransform((prev) => {
                if (wheelMode === "PURE_MOVE" || e.shiftKey) {
                  return {
                    ...prev,
                    panX: Math.max(
                      -340,
                      Math.min(340, prev.panX - (e.deltaX ? e.deltaX * 1.2 : offsetX * 0.28))
                    ),
                    panY: Math.max(-220, Math.min(220, prev.panY - e.deltaY * 0.65)),
                  };
                }
                const nextZoom = Math.max(
                  0.6,
                  Math.min(5.0, Number((prev.zoom + (e.deltaY < 0 ? 0.16 : -0.16)).toFixed(2)))
                );
                return {
                  ...prev,
                  zoom: nextZoom,
                  panX: Math.max(-340, Math.min(340, prev.panX - offsetX * 0.22)),
                  panY: Math.max(-220, Math.min(220, prev.panY - offsetY * 0.22)),
                };
              });
            }}
            className="relative rounded-xl overflow-hidden border border-cyan-400/35 bg-black aspect-video flex items-center justify-center cursor-move select-none"
          >
            <div
              style={{
                transform: `translate3d(${camTransform.panX}px, ${camTransform.panY}px, 0) scale(${
                  camTransform.mirrored ? -camTransform.zoom : camTransform.zoom
                }, ${camTransform.zoom}) rotateX(${camTransform.rotX}deg) rotateY(${camTransform.rotY}deg)`,
                transition: isDraggingRef.current ? "none" : "transform 120ms ease-out",
              }}
              className="w-full h-full flex items-center justify-center"
            >
              {capturedImage ? (
                <img
                  src={capturedImage}
                  alt="Captured Frame"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            {/* Interactive Target Reticle Overlay */}
            <div
              style={{
                left: `${reticlePos.xPercent}%`,
                top: `${reticlePos.yPercent}%`,
              }}
              className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center transition-all duration-150"
            >
              <div className="w-28 h-28 border border-dashed border-cyan-400/70 rounded-full animate-pulse" />
              <Crosshair className="w-5 h-5 text-cyan-300 absolute" />
            </div>

            {/* Camera Coordinates Telemetry Overlay */}
            <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between pointer-events-none font-mono text-[10px] text-cyan-300 bg-black/70 px-3 py-1 rounded-lg border border-white/10">
              <span>
                CAMERA POSITION: X={Math.round(camTransform.panX)} • Y={Math.round(camTransform.panY)}
              </span>
              <span>ZOOM: {Math.round(camTransform.zoom * 100)}%</span>
            </div>
          </div>
        )}

        {/* Camera Navigation & Capture Footer */}
        <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-xs">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() =>
                setCamTransform((p) => ({
                  ...p,
                  zoom: Math.min(5.0, Number((p.zoom + 0.25).toFixed(2))),
                }))
              }
              className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/15 text-cyan-200 flex items-center gap-1 cursor-pointer"
            >
              <ZoomIn className="w-3.5 h-3.5" />
              <span>Zoom In</span>
            </button>
            <button
              type="button"
              onClick={() =>
                setCamTransform((p) => ({
                  ...p,
                  zoom: Math.max(0.6, Number((p.zoom - 0.25).toFixed(2))),
                }))
              }
              className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/15 text-cyan-200 flex items-center gap-1 cursor-pointer"
            >
              <ZoomOut className="w-3.5 h-3.5" />
              <span>Zoom Out</span>
            </button>
            <button
              type="button"
              onClick={() =>
                setCamTransform({
                  panX: 0,
                  panY: 0,
                  zoom: 1.0,
                  rotX: 0,
                  rotY: 0,
                  mirrored: false,
                })
              }
              className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/15 text-slate-300 flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset View</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {capturedImage ? (
              <>
                <button
                  type="button"
                  onClick={() => setCapturedImage(null)}
                  className="px-4 py-2 rounded-xl bg-white/5 text-slate-300 hover:text-white border border-white/10 transition-all cursor-pointer"
                >
                  RETAKE FRAME
                </button>
                <button
                  type="button"
                  onClick={() => handleSendToVision()}
                  disabled={isProcessing}
                  className="px-5 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold transition-all shadow-[0_0_15px_rgba(34,211,238,0.3)] flex items-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isProcessing ? "ANALYZING..." : "SEND TO DRAVIS VISION"}</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => captureFrame()}
                className="px-5 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold transition-all shadow-[0_0_15px_rgba(34,211,238,0.3)] flex items-center justify-center gap-2 cursor-pointer"
              >
                <Camera className="w-4 h-4" />
                <span>CAPTURE FRAME BUFFER</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
