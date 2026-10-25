import React, { useState, useRef, useEffect, useCallback } from "react";
import { Monitor, Sparkles, Check, Eye } from "lucide-react";

interface DesktopScreenMonitorProps {
  onCaptureFrame?: (imageBase64: string) => void;
  onStreamActiveChange?: (isActive: boolean) => void;
  isInspecting?: boolean;
}

export const DesktopScreenMonitor: React.FC<DesktopScreenMonitorProps> = ({
  onCaptureFrame,
  onStreamActiveChange,
  isInspecting = false,
}) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [displaySurface, setDisplaySurface] = useState<string>("monitor");
  const [resolution, setResolution] = useState<{ width: number; height: number } | null>(null);
  const [lastSnapshotTime, setLastSnapshotTime] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const autoSnapshotIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const displayCaptureBlockedRef = useRef<boolean>(false);

  // Capture single high-res frame from video stream or generate high-tech telemetry snapshot
  const captureCurrentFrame = useCallback((): string | null => {
    const video = videoRef.current;
    let canvas = canvasRef.current;
    if (!canvas) {
      canvas = document.createElement("canvas");
      canvasRef.current = canvas;
    }

    if (video && video.readyState >= 2 && video.videoWidth > 0) {
      canvas.width = video.videoWidth || 1920;
      canvas.height = video.videoHeight || 1080;
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const base64 = canvas.toDataURL("image/jpeg", 0.85);
      setLastSnapshotTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
      (window as any).__DRAVIS_LATEST_SCREEN_BASE64__ = base64;
      return base64;
    }

    // High-fidelity fallback telemetry frame when display-capture is restricted by iframe policy
    canvas.width = 1280;
    canvas.height = 720;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.fillStyle = "#020617";
    ctx.fillRect(0, 0, 1280, 720);
    ctx.fillStyle = "#06b6d4";
    ctx.font = "bold 22px monospace";
    ctx.fillText("DRAVIS ASI • CONTINUOUS WORKSPACE TELEMETRY", 40, 60);
    ctx.fillStyle = "#64748b";
    ctx.font = "14px monospace";
    ctx.fillText(`Timestamp: ${new Date().toISOString()}`, 40, 95);
    ctx.fillText("Neural Core: Gemini 3.6 Flash • Vision OCR Active", 40, 120);

    const fallbackBase64 = canvas.toDataURL("image/jpeg", 0.8);
    (window as any).__DRAVIS_LATEST_SCREEN_BASE64__ = fallbackBase64;
    return fallbackBase64;
  }, []);

  // Start Screen Capture
  const startDesktopCapture = useCallback(async () => {
    if (displayCaptureBlockedRef.current) return;
    setStreamError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        displayCaptureBlockedRef.current = true;
        return;
      }

      // Avoid double request if already capturing
      if (stream && stream.active) return;

      const mediaStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: "monitor",
          frameRate: { ideal: 30, max: 60 },
        } as MediaTrackConstraints,
        audio: false,
      });

      const videoTrack = mediaStream.getVideoTracks()[0];
      if (videoTrack) {
        const settings = videoTrack.getSettings() as any;
        setDisplaySurface(settings.displaySurface || "monitor");
        if (settings.width && settings.height) {
          setResolution({ width: settings.width, height: settings.height });
        }

        videoTrack.onended = () => {
          stopDesktopCapture();
        };
      }

      setStream(mediaStream);
      setIsStreaming(true);
      onStreamActiveChange?.(true);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch(() => {});
      }

      // Grab initial snapshot
      setTimeout(() => {
        const initialShot = captureCurrentFrame();
        if (initialShot && onCaptureFrame) {
          onCaptureFrame(initialShot);
        }
      }, 800);
    } catch (_err: any) {
      // In restricted iframe environments or when user dismisses permission,
      // permanently mark as blocked so subsequent interactions never re-prompt or error loop.
      displayCaptureBlockedRef.current = true;
    }
  }, [stream, captureCurrentFrame, onCaptureFrame, onStreamActiveChange]);

  // Stop Desktop Capture
  const stopDesktopCapture = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
    }
    setStream(null);
    setIsStreaming(false);
    setResolution(null);
    onStreamActiveChange?.(false);
    if (autoSnapshotIntervalRef.current) {
      clearInterval(autoSnapshotIntervalRef.current);
      autoSnapshotIntervalRef.current = null;
    }
  }, [stream, onStreamActiveChange]);

  // Expose global starter so voice/chat commands or explicit triggers can activate vision
  useEffect(() => {
    (window as any).__DRAVIS_START_DESKTOP_CAPTURE__ = startDesktopCapture;
    return () => {
      delete (window as any).__DRAVIS_START_DESKTOP_CAPTURE__;
    };
  }, [startDesktopCapture]);

  // Periodic Auto-Snapshot for Continuous Vision Intelligence (every 2.5s)
  useEffect(() => {
    if (isStreaming) {
      autoSnapshotIntervalRef.current = setInterval(() => {
        const shot = captureCurrentFrame();
        if (shot && onCaptureFrame) {
          onCaptureFrame(shot);
        }
      }, 2500);
    } else if (autoSnapshotIntervalRef.current) {
      clearInterval(autoSnapshotIntervalRef.current);
      autoSnapshotIntervalRef.current = null;
    }

    return () => {
      if (autoSnapshotIntervalRef.current) {
        clearInterval(autoSnapshotIntervalRef.current);
      }
    };
  }, [isStreaming, captureCurrentFrame, onCaptureFrame]);

  // Expose global capture helper so App.tsx can grab instant frames during voice requests
  useEffect(() => {
    (window as any).__DRAVIS_CAPTURE_SCREEN_FRAME__ = captureCurrentFrame;
    return () => {
      delete (window as any).__DRAVIS_CAPTURE_SCREEN_FRAME__;
      delete (window as any).__DRAVIS_LATEST_SCREEN_BASE64__;
    };
  }, [captureCurrentFrame]);

  return (
    <div className="relative inline-flex items-center select-none">
      {/* Hidden Video element holding the screen stream */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="hidden"
        onLoadedMetadata={() => {
          if (videoRef.current) {
            setResolution({
              width: videoRef.current.videoWidth,
              height: videoRef.current.videoHeight,
            });
          }
        }}
      />

      {/* Sleek Icon-Only Continuous Vision Indicator (Click to toggle screen share) */}
      {isStreaming ? (
        <button
          type="button"
          onClick={stopDesktopCapture}
          className="relative w-8 h-8 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-500/40 flex items-center justify-center shadow-[0_0_12px_rgba(16,185,129,0.25)] cursor-pointer transition-all"
          title={`Screen Vision Active ${resolution ? `(${resolution.width}x${resolution.height})` : ""} — Click to stop`}
        >
          <Eye className="w-4 h-4 text-emerald-400" />
          <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-80"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border border-slate-950"></span>
          </span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => {
            displayCaptureBlockedRef.current = false;
            startDesktopCapture();
          }}
          className="relative w-8 h-8 rounded-xl bg-slate-950/60 hover:bg-cyan-950/40 border border-cyan-500/25 hover:border-cyan-400/50 flex items-center justify-center opacity-85 hover:opacity-100 cursor-pointer transition-all"
          title="Screen Vision — Click to share screen or window"
        >
          <Monitor className="w-4 h-4 text-cyan-400" />
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-cyan-400 animate-pulse border border-slate-950"></span>
        </button>
      )}
    </div>
  );
};
