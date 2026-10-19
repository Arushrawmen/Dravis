/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Live Camera & Screen Capture Modal with Gemini Vision OCR
 */

import React, { useRef, useState, useEffect } from "react";
import { Camera, X, Sparkles, RefreshCw, Eye } from "lucide-react";
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

  const captureFrame = () => {
    if (!videoRef.current) return;
    if (soundEffectsEnabled) soundEffects.playActivatePulse();

    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/png");
      setCapturedImage(dataUrl);
    }
  };

  const handleSendToVision = async () => {
    if (!capturedImage) return;
    setIsProcessing(true);
    try {
      await onAnalyzeCapture(capturedImage);
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-slate-950 border border-white/10 rounded-2xl p-5 flex flex-col gap-4 shadow-[0_0_40px_rgba(0,0,0,0.6)]">
        <div className="flex items-center justify-between pb-2 border-b border-white/5">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider">
              OPTICAL SENSOR & VISION HUD CAPTURE
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

        {cameraError ? (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono">
            {cameraError}
          </div>
        ) : (
          <div className="relative rounded-xl overflow-hidden border border-white/10 bg-black aspect-video flex items-center justify-center">
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

            {/* Sci-Fi Target Reticle Overlay */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-32 h-32 border border-dashed border-cyan-400/60 rounded-full animate-pulse" />
              <div className="absolute w-48 h-[1px] bg-cyan-400/40" />
              <div className="absolute h-48 w-[1px] bg-cyan-400/40" />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between gap-3 font-mono text-xs">
          {capturedImage ? (
            <>
              <button
                onClick={() => setCapturedImage(null)}
                className="px-4 py-2 rounded-xl bg-white/5 text-slate-300 hover:text-white border border-white/10 transition-all"
              >
                RETAKE FRAME
              </button>
              <button
                onClick={handleSendToVision}
                disabled={isProcessing}
                className="px-5 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold transition-all shadow-[0_0_15px_rgba(34,211,238,0.3)] flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isProcessing ? "ANALYZING WITH VISION..." : "SEND FRAME TO DRAVIS VISION"}</span>
              </button>
            </>
          ) : (
            <button
              onClick={captureFrame}
              className="w-full py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold transition-all shadow-[0_0_15px_rgba(34,211,238,0.3)] flex items-center justify-center gap-2"
            >
              <Camera className="w-4 h-4" />
              <span>CAPTURE FRAME BUFFER</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
