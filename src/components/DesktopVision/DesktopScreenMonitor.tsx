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

  // Capture single high-res frame from video stream
  const captureCurrentFrame = useCallback((): string | null => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) return null;

    let canvas = canvasRef.current;
    if (!canvas) {
      canvas = document.createElement("canvas");
      canvasRef.current = canvas;
    }

    canvas.width = video.videoWidth || 1920;
    canvas.height = video.videoHeight || 1080;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const base64 = canvas.toDataURL("image/jpeg", 0.85);
    setLastSnapshotTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    (window as any).__DRAVIS_LATEST_SCREEN_BASE64__ = base64;
    return base64;
  }, []);

  // Start Screen Capture
  const startDesktopCapture = useCallback(async () => {
    setStreamError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        console.warn("[DesktopScreenMonitor] Screen Capture API not supported in browser environment.");
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
    } catch (err: any) {
      console.warn("[DesktopScreenMonitor] Background capture awaiting user engagement:", err?.message || err);
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

  // Auto-initiate continuous desktop vision on first user gesture anywhere without requiring a dedicated button
  useEffect(() => {
    const handleFirstUserInteraction = () => {
      if (!isStreaming && !stream) {
        startDesktopCapture();
      }
    };

    window.addEventListener("click", handleFirstUserInteraction, { once: true });
    window.addEventListener("keydown", handleFirstUserInteraction, { once: true });

    // Expose global starter so voice/chat commands can immediately activate vision if not yet running
    (window as any).__DRAVIS_START_DESKTOP_CAPTURE__ = startDesktopCapture;

    return () => {
      window.removeEventListener("click", handleFirstUserInteraction);
      window.removeEventListener("keydown", handleFirstUserInteraction);
      delete (window as any).__DRAVIS_START_DESKTOP_CAPTURE__;
    };
  }, [isStreaming, stream, startDesktopCapture]);

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
    <div className="relative inline-flex items-center pointer-events-none select-none">
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

      {/* Sleek Icon-Only Continuous Vision Indicator */}
      {isStreaming ? (
        <div
          className="relative w-8 h-8 rounded-xl bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-center shadow-[0_0_12px_rgba(16,185,129,0.25)]"
          title={`Screen Vision Active ${resolution ? `(${resolution.width}x${resolution.height})` : ""} — Continuously monitoring your screen`}
        >
          <Eye className="w-4 h-4 text-emerald-400" />
          <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-80"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border border-slate-950"></span>
          </span>
        </div>
      ) : (
        <div
          className="relative w-8 h-8 rounded-xl bg-slate-950/60 border border-cyan-500/25 flex items-center justify-center opacity-75"
          title="Continuous Screen Vision Ready"
        >
          <Monitor className="w-4 h-4 text-cyan-400" />
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-cyan-400 animate-pulse border border-slate-950"></span>
        </div>
      )}
    </div>
  );
};
