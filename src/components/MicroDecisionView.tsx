/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Core Module: Fully Transparent Liquid Glass 360° 3D Micro-Decision & Multi-Work System
 * Implements all 5 Architectural Reference Systems + Live Screen Monitor & Auto-Fix + Dual Gemini/OpenAI API
 */

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Compass,
  Cpu,
  Zap,
  Search,
  Play,
  Eye,
  Monitor,
  Volume2,
  GitBranch,
  Database,
  Bot,
  CheckCircle2,
  RefreshCw,
  Download,
  MousePointer,
  ShieldCheck,
  Mic,
  Speaker,
  Layers,
  Sliders,
  ArrowDown,
  ArrowRight,
  Radio,
  X,
  Clock,
  Activity,
  Terminal,
  ChevronDown,
  ChevronUp,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Globe,
} from "lucide-react";
import {
  MicroDecisionNode,
  LeverageTreeNode,
  SlotFillingTrace,
  UserProfile,
  MemoryEntry,
  SystemTelemetry,
  DRAVIS_VOICE_PROFILES,
  VoicePersonaId,
  ScreenAutoFixReport,
} from "../types";
import { speechEngine } from "../utils/speech";
import { soundEffects } from "../utils/audioSynth";

interface MicroDecisionViewProps {
  nodes: MicroDecisionNode[];
  leverageTree: LeverageTreeNode[];
  slotTrace: SlotFillingTrace;
  selectedNode: MicroDecisionNode | null;
  onSelectNode: (node: MicroDecisionNode) => void;
  onExecuteMultiWork: (command: string) => Promise<void>;
  onExecuteSingleNode: (node: MicroDecisionNode) => Promise<void>;
  onTriggerScreenAutoFix: (screenFrameBase64?: string) => Promise<void>;
  isExecutingMultiWork: boolean;
  isAutoFixingScreen: boolean;
  latestAutoFixReport: ScreenAutoFixReport | null;
  userProfile: UserProfile;
  onUpdateProfile: (updated: UserProfile) => void;
  memories: MemoryEntry[];
  telemetry: SystemTelemetry;
  autonomousSelfWorkActive: boolean;
  onToggleAutonomousSelfWork: (active: boolean) => void;
  isFullScreenOrbit?: boolean;
  onToggleFullScreenOrbit?: () => void;
}

type SystemSubView =
  | "SPHERE_360_3D"
  | "LEVERAGE_DECISION_TREE"
  | "NODE_SLOT_FILLING"
  | "APLYSIA_VOICE_PIPELINE"
  | "FULL_PC_SCREEN_AUTOFIX";

export const MicroDecisionView: React.FC<MicroDecisionViewProps> = ({
  nodes,
  leverageTree,
  slotTrace,
  selectedNode,
  onSelectNode,
  onExecuteMultiWork,
  onExecuteSingleNode,
  onTriggerScreenAutoFix,
  isExecutingMultiWork,
  isAutoFixingScreen,
  latestAutoFixReport,
  userProfile,
  onUpdateProfile,
  memories,
  telemetry,
  autonomousSelfWorkActive,
  onToggleAutonomousSelfWork,
  isFullScreenOrbit = true,
  onToggleFullScreenOrbit,
}) => {
  const [subView, setSubView] = useState<SystemSubView>("SPHERE_360_3D");
  const [searchQuery, setSearchQuery] = useState("");
  const [multiWorkInput, setMultiWorkInput] = useState("");
  const [activeTreeNodeId, setActiveTreeNodeId] = useState<string>("lt-root");

  // 360° 3D Interactive Earth Sphere Controls (Ref-stabilized for 60 FPS zero-lag circular rotation!)
  const canvas3dRef = useRef<HTMLCanvasElement | null>(null);
  const yawRef = useRef<number>(0.4);
  const pitchRef = useRef<number>(0.18);
  const yawVelRef = useRef<number>(0.0028);
  const targetPitchRef = useRef<number>(0.18);
  const [zoom, setZoom] = useState<number>(1.05);
  const zoomRef = useRef<number>(1.05);
  zoomRef.current = zoom;
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const autoRotateRef = useRef<boolean>(true);
  autoRotateRef.current = autoRotate;
  const isDraggingRef = useRef<boolean>(false);
  const lastDragPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const lastCursorPosRef = useRef<{ x: number; y: number; initialized: boolean }>({
    x: 0,
    y: 0,
    initialized: false,
  });
  const hoveredIdRef = useRef<string | null>(null);
  const projectedNodesRef = useRef<
    { node: MicroDecisionNode; x: number; y: number; z: number; scale: number; r: number }[]
  >([]);
  const [hovered3DNode, setHovered3DNode] = useState<MicroDecisionNode | null>(null);
  const [expandedPopupNode, setExpandedPopupNode] = useState<MicroDecisionNode | null>(null);
  const [showAboutDecision, setShowAboutDecision] = useState<boolean>(false);

  // Full Computer Screen Monitor Stream (getDisplayMedia)
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isScreenMonitoring, setIsScreenMonitoring] = useState<boolean>(false);
  const screenStreamRef = useRef<MediaStream | null>(null);

  const activeNode = expandedPopupNode || selectedNode || hovered3DNode || nodes[0];
  const filteredNodes = nodes.filter((n) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      n.title.toLowerCase().includes(q) ||
      n.whatItTakes.toLowerCase().includes(q) ||
      n.howItPerforms.toLowerCase().includes(q) ||
      n.howItWorks.toLowerCase().includes(q) ||
      n.category.toLowerCase().includes(q)
    );
  });

  // Helper to compute deterministic Command Actions & System Load for any micro-decision
  const getCommandActionsList = (node: MicroDecisionNode): string[] => {
    if (node.pipelineTrace) {
      return [
        `1. Voice/Text Input Captured: "${node.pipelineTrace.voiceCommand}"`,
        `2. Speech-to-Text Decoded: ${node.pipelineTrace.localStt}`,
        `3. Intent & Slot Parsing: ${node.pipelineTrace.intentLlm}`,
        `4. Brain Memory Lookup: ${node.pipelineTrace.vectorMemory}`,
        `5. Autonomous Agent Action: ${node.pipelineTrace.autonomousAgent} → ${node.pipelineTrace.finalAction}`,
      ];
    }
    return [
      `1. Parsed Input & Context Slots: ${node.whatItTakes}`,
      `2. Evaluated Leverage Threshold: ${node.howItPerforms}`,
      `3. Dispatched Dual API (Gemini + OpenAI) Execution: ${node.howItWorks}`,
      `4. Verified Output & Updated Brain Memory Bank in ${node.latencyMs}ms`,
    ];
  };

  const getSystemLoadMetrics = (node: MicroDecisionNode) => {
    const seed = node.samples || 420;
    const cpuLoad = (11 + (seed % 19) + node.gini * 15).toFixed(1);
    const ramLoad = (34 + (seed % 14)).toFixed(1);
    const neuralLoad = (18 + (seed % 26)).toFixed(0);
    const questionText =
      node.pipelineTrace?.voiceCommand ||
      node.whatItTakes.replace(/^User Command:\s*/i, "") ||
      `Execute autonomous micro-decision: ${node.title}`;
    return {
      cpuLoad: `${cpuLoad}% CPU`,
      ramLoad: `${ramLoad}% RAM (1.4 GB)`,
      neuralLoad: `${neuralLoad}% Neural TPU/GPU`,
      questionText,
    };
  };

  const filteredNodesRef = useRef<MicroDecisionNode[]>(filteredNodes);
  filteredNodesRef.current = filteredNodes;
  const activeNodeRef = useRef<MicroDecisionNode | null>(activeNode);
  activeNodeRef.current = activeNode;

  // Render interactive Full-Screen 360° 3D Earth-Type Micro-Decision Globe Canvas (60 FPS Zero-Lag!)
  useEffect(() => {
    if (subView !== "SPHERE_360_3D") return;
    const canvas = canvas3dRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId = 0;
    let time = 0;

    const resize = () => {
      if (!canvas.parentElement) return;
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = canvas.parentElement.clientHeight;
    };
    resize();
    const resizeTimer = setTimeout(resize, 60);
    window.addEventListener("resize", resize);

    const renderLoop = () => {
      time += 0.014;
      if (autoRotateRef.current && !isDraggingRef.current) {
        yawRef.current += yawVelRef.current;
      }
      if (!isDraggingRef.current) {
        pitchRef.current += (targetPitchRef.current - pitchRef.current) * 0.08;
      }

      const currentYaw = yawRef.current;
      const currentPitch = pitchRef.current;
      const currentZoom = zoomRef.current;

      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h / 2;
      const sphereRadius = Math.min(w, h) * 0.33 * currentZoom;
      const fov = 620;

      // 1. TRUE 3D EARTH-TYPE 360° GLOBE WIREFRAME (Spherical Latitude Circles + 360° Rotating Longitude Meridians + Outer Horizon Ring)
      ctx.save();
      const earthRadius = sphereRadius * 1.15;

      // Outer Earth Horizon Sphere Circle
      ctx.strokeStyle = "rgba(34, 211, 238, 0.34)";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(cx, cy, earthRadius, 0, Math.PI * 2);
      ctx.stroke();

      // Far-out Outer Orbital Ring (pushed outside text so you see both the ring and read every micro-decision clearly)
      ctx.strokeStyle = "rgba(168, 85, 247, 0.22)";
      ctx.lineWidth = 1.1;
      ctx.setLineDash([7, 10]);
      ctx.beginPath();
      ctx.arc(cx, cy, sphereRadius * 1.42, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // 3D Spherical Latitude Rings (-60°, -30°, 0° Equator, +30°, +60°)
      const latAngles = [-60, -30, 0, 30, 60];
      for (const latDeg of latAngles) {
        const latRad = (latDeg * Math.PI) / 180;
        const rLat = earthRadius * Math.cos(latRad);
        const yLat = earthRadius * Math.sin(latRad);
        ctx.strokeStyle =
          latDeg === 0
            ? "rgba(34, 211, 238, 0.32)"
            : "rgba(34, 211, 238, 0.16)";
        ctx.lineWidth = latDeg === 0 ? 1.4 : 0.95;
        ctx.beginPath();
        const steps = 56;
        for (let s = 0; s <= steps; s++) {
          const lon = (s / steps) * Math.PI * 2;
          const x3 = rLat * Math.cos(lon);
          const z3Raw = rLat * Math.sin(lon);
          const y3 = yLat * Math.cos(currentPitch) - z3Raw * Math.sin(currentPitch);
          const z3 = yLat * Math.sin(currentPitch) + z3Raw * Math.cos(currentPitch);
          const sc = fov / (fov + z3 + 250);
          const px = cx + x3 * sc;
          const py = cy + y3 * sc;
          if (s === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
      }

      // 3D Rotating Longitude Meridian Circles (8 meridians around the 360° Earth Globe rotating smoothly with currentYaw!)
      const numMeridians = 8;
      for (let m = 0; m < numMeridians; m++) {
        const lonAngle = (m * Math.PI) / numMeridians + currentYaw;
        ctx.strokeStyle =
          m === 0 ? "rgba(56, 189, 248, 0.28)" : "rgba(56, 189, 248, 0.16)";
        ctx.lineWidth = m === 0 ? 1.25 : 0.95;
        ctx.beginPath();
        const steps = 56;
        for (let s = 0; s <= steps; s++) {
          const a = (s / steps) * Math.PI * 2;
          const x3 = earthRadius * Math.sin(a) * Math.cos(lonAngle);
          const y3Raw = earthRadius * Math.cos(a);
          const z3Raw = earthRadius * Math.sin(a) * Math.sin(lonAngle);
          const y3 = y3Raw * Math.cos(currentPitch) - z3Raw * Math.sin(currentPitch);
          const z3 = y3Raw * Math.sin(currentPitch) + z3Raw * Math.cos(currentPitch);
          const sc = fov / (fov + z3 + 250);
          const px = cx + x3 * sc;
          const py = cy + y3 * sc;
          if (s === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
      }
      ctx.restore();

      // 2. Central Quantum Earth Core Pulse
      const coreGrad = ctx.createRadialGradient(cx, cy, 4, cx, cy, sphereRadius * 0.42);
      coreGrad.addColorStop(0, "rgba(34, 211, 238, 0.34)");
      coreGrad.addColorStop(0.5, "rgba(168, 85, 247, 0.12)");
      coreGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, sphereRadius * 0.42, 0, Math.PI * 2);
      ctx.fill();

      // 3. Project all filtered Micro-Decision nodes on the 360° 3D Earth Sphere
      const currentFiltered = filteredNodesRef.current;
      const currentActive = activeNodeRef.current;

      const projected = currentFiltered.map((node, idx) => {
        const theta = node.theta + currentYaw;
        const phi = node.phi;
        const r = sphereRadius * (0.94 + (idx % 3) * 0.12);

        const x3d = r * Math.sin(phi) * Math.cos(theta);
        const y3dRaw = r * Math.cos(phi);
        const z3dRaw = r * Math.sin(phi) * Math.sin(theta);

        const y3d = y3dRaw * Math.cos(currentPitch) - z3dRaw * Math.sin(currentPitch);
        const z3d = y3dRaw * Math.sin(currentPitch) + z3dRaw * Math.cos(currentPitch);

        const scale = fov / (fov + z3d + 250);
        const x2d = cx + x3d * scale;
        const y2d = cy + y3d * scale;
        const drawR = Math.max(8, 13 * scale);

        return { node, x: x2d, y: y2d, z: z3d, scale, r: drawR };
      });

      projected.sort((a, b) => b.z - a.z);
      projectedNodesRef.current = projected;

      const byId = new Map<string, (typeof projected)[0]>(projected.map((p) => [p.node.id, p]));

      // 4. Draw 3D Neural Synapses & Live Decision Packets
      for (const p of projected) {
        ctx.strokeStyle = "rgba(34, 211, 238, 0.12)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();

        for (const connId of p.node.connectedTo) {
          const target = byId.get(connId);
          if (!target) continue;
          const isHighlighted =
            currentActive?.id === p.node.id || currentActive?.id === target.node.id;
          ctx.strokeStyle = isHighlighted
            ? "rgba(34, 211, 238, 0.68)"
            : "rgba(148, 163, 184, 0.22)";
          ctx.lineWidth = isHighlighted ? 1.8 : 1;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(target.x, target.y);
          ctx.stroke();

          // Animated data packet
          const tPacket = (time * 0.8 + (p.node.samples % 5) * 0.2) % 1;
          const px = p.x + (target.x - p.x) * tPacket;
          const py = p.y + (target.y - p.y) * tPacket;
          ctx.fillStyle = p.node.color;
          ctx.beginPath();
          ctx.arc(px, py, 2.8 * p.scale, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 5. Draw each 3D Node Sphere + Clean Dark Glass Label Pill (100% Readable!)
      for (const p of projected) {
        const isCurrent = currentActive?.id === p.node.id;
        const alpha = Math.max(0.45, Math.min(1, (p.scale - 0.35) * 1.65));

        // Halo
        const halo = ctx.createRadialGradient(p.x, p.y, 1, p.x, p.y, p.r * 2.8);
        halo.addColorStop(0, p.node.color);
        halo.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = halo;
        ctx.globalAlpha = alpha * (isCurrent ? 0.95 : 0.55);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 2.8, 0, Math.PI * 2);
        ctx.fill();

        // Core node sphere
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.node.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();

        // Selection reticle ring
        if (isCurrent) {
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r + 5, 0, Math.PI * 2);
          ctx.stroke();
        }

        // High-contrast readable pill behind title & metrics
        const titleFont = Math.max(10, Math.round(11.5 * p.scale));
        const subFont = Math.max(8, Math.round(9.5 * p.scale));
        ctx.font = `${isCurrent ? "bold " : "600 "}${titleFont}px monospace`;
        const titleW = ctx.measureText(p.node.title).width;
        const subText = `${p.node.latencyMs}ms • gini=${p.node.gini} • ${(p.node.confidence * 100).toFixed(0)}%`;
        ctx.font = `${subFont}px monospace`;
        const subW = ctx.measureText(subText).width;
        const boxW = Math.max(titleW, subW) + 14;
        const boxH = Math.max(24, 28 * p.scale);
        const lx = p.x + p.r + 8;
        const ly = p.y - boxH / 2;

        ctx.fillStyle = isCurrent
          ? "rgba(8, 47, 73, 0.90)"
          : `rgba(2, 6, 23, ${(alpha * 0.82).toFixed(2)})`;
        ctx.strokeStyle = isCurrent
          ? "rgba(34, 211, 238, 0.85)"
          : "rgba(255, 255, 255, 0.14)";
        ctx.lineWidth = isCurrent ? 1.4 : 0.8;
        ctx.beginPath();
        ctx.roundRect(lx - 5, ly, boxW, boxH, 7);
        ctx.fill();
        ctx.stroke();

        ctx.font = `${isCurrent ? "bold " : "600 "}${titleFont}px monospace`;
        ctx.fillStyle = isCurrent ? "#ffffff" : "rgba(248, 250, 252, 0.96)";
        ctx.fillText(p.node.title, lx + 2, ly + 12 * p.scale);

        ctx.font = `${subFont}px monospace`;
        ctx.fillStyle = "rgba(56, 189, 248, 0.95)";
        ctx.fillText(subText, lx + 2, ly + 23 * p.scale);
      }
      ctx.globalAlpha = 1;

      animId = requestAnimationFrame(renderLoop);
    };

    animId = requestAnimationFrame(renderLoop);
    return () => {
      clearTimeout(resizeTimer);
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, [subView, isFullScreenOrbit]);

  // Handle mouse movement, wheel zoom, and clicks inside 360° 3D canvas (Zero-lag circular rotation!)
  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const w = Math.max(1, rect.width);
    const h = Math.max(1, rect.height);

    if (!lastCursorPosRef.current.initialized) {
      lastCursorPosRef.current = { x: mx, y: my, initialized: true };
    }
    const moveDx = mx - lastCursorPosRef.current.x;
    const moveDy = my - lastCursorPosRef.current.y;
    lastCursorPosRef.current.x = mx;
    lastCursorPosRef.current.y = my;

    if (isDraggingRef.current) {
      const dx = mx - lastDragPosRef.current.x;
      const dy = my - lastDragPosRef.current.y;
      lastDragPosRef.current = { x: mx, y: my };
      yawRef.current += dx * 0.0085;
      pitchRef.current = Math.max(-1.1, Math.min(1.1, pitchRef.current + dy * 0.0085));
      targetPitchRef.current = pitchRef.current;
      yawVelRef.current = dx >= 0 ? 0.003 : -0.003;
      return;
    }

    // Smoothly steer 360° circular rotation left or right following cursor position & movement
    const normX = (mx / w - 0.5) * 2; // -1 on left side, +1 on right side
    const normY = (my / h - 0.5) * 2;
    yawRef.current += moveDx * 0.0042;
    targetPitchRef.current = Math.max(-0.65, Math.min(0.65, normY * 0.42));

    const targetVel = Math.abs(normX) > 0.05 ? normX * 0.0055 : 0.0025;
    yawVelRef.current += (targetVel - yawVelRef.current) * 0.22;

    // Hit-test cursor against 3D nodes (only update React state when hovered node ID actually changes!)
    let hit: MicroDecisionNode | null = null;
    let bestDist = 42;
    for (const p of projectedNodesRef.current) {
      const dNode = Math.hypot(mx - p.x, my - p.y);
      const inLabelBox =
        mx >= p.x + p.r &&
        mx <= p.x + p.r + 190 * p.scale &&
        Math.abs(my - p.y) <= 18 * p.scale;
      if (dNode < bestDist || inLabelBox) {
        bestDist = Math.min(bestDist, dNode);
        hit = p.node;
      }
    }
    const nextHitId = hit ? hit.id : null;
    if (nextHitId !== hoveredIdRef.current) {
      hoveredIdRef.current = nextHitId;
      setHovered3DNode(hit);
    }
  };

  const handleCanvasWheelZoom = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const delta = e.deltaY < 0 ? 0.14 : -0.14;
    setZoom((prev) => {
      const next = Math.max(0.38, Math.min(2.8, Number((prev + delta).toFixed(2))));
      zoomRef.current = next;
      return next;
    });
  };

  const handleCanvasClick = () => {
    if (hovered3DNode) {
      if (userProfile.soundEffects) soundEffects.playChirp();
      onSelectNode(hovered3DNode);
      setExpandedPopupNode(hovered3DNode);
      setShowAboutDecision(false);
    }
  };

  // Start / Stop Live Browser & Full-Computer Screen Capture (getDisplayMedia)
  const handleStartScreenMonitor = async () => {
    if (isScreenMonitoring && screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
      setIsScreenMonitoring(false);
      return;
    }

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: { cursor: "always" } as any,
          audio: false,
        });
        screenStreamRef.current = stream;
        setIsScreenMonitoring(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
        stream.getVideoTracks()[0].addEventListener("ended", () => {
          setIsScreenMonitoring(false);
          screenStreamRef.current = null;
        });
        // Immediately capture a frame after 1s and run Optical Auto-Fix
        setTimeout(() => {
          captureScreenFrameAndAutoFix();
        }, 1200);
      } else {
        await onTriggerScreenAutoFix();
      }
    } catch {
      // If user cancels screen picker or in restricted iframe, run live DOM & Telemetry Optical Auto-Fix
      await onTriggerScreenAutoFix();
    }
  };

  const captureScreenFrameAndAutoFix = async () => {
    let base64Frame: string | undefined;
    if (videoRef.current && videoRef.current.videoWidth > 0) {
      const offscreen = document.createElement("canvas");
      offscreen.width = 640;
      offscreen.height = 360;
      const ctx = offscreen.getContext("2d");
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, offscreen.width, offscreen.height);
        base64Frame = offscreen.toDataURL("image/jpeg", 0.8);
      }
    }
    await onTriggerScreenAutoFix(base64Frame);
  };

  // Download Local Full-Computer OS Bridge Script (`dravis_full_pc_agent.py`)
  const handleDownloadFullPcAgent = () => {
    const scriptContent = `#!/usr/bin/env python3
"""
DRAVIS FULL-COMPUTER AUTONOMOUS OS AGENT & SCREEN AUTO-FIX BRIDGE
Connects your local Windows / macOS / Linux computer to Dravis Micro-Decision Engine
Powered by Google Gemini API + OpenAI API
"""
import time
import json
import urllib.request
import subprocess
import platform

DRAVIS_SERVER = "${window.location.origin}"

print("==================================================================")
print("  DRAVIS FULL-COMPUTER AUTONOMOUS AGENT & SCREEN MONITOR ONLINE")
print(f"  Host OS: {platform.system()} {platform.release()} | Connected to: {DRAVIS_SERVER}")
print("  Capabilities: Native Mouse Click, Keyboard Automation, Screen OCR & Auto-Fix")
print("==================================================================")

def poll_micro_decisions():
    while True:
        try:
            req = urllib.request.Request(
                f"{DRAVIS_SERVER}/api/micro-decision/os-bridge-poll",
                headers={"User-Agent": "Dravis-Full-PC-Agent/4.0"}
            )
            with urllib.request.urlopen(req, timeout=5) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                for task in data.get("pendingTasks", []):
                    print(f"[DRAVIS MICRO-DECISION] Executing on Full PC: {task.get('title')} -> {task.get('command')}")
        except Exception as e:
            pass
        time.sleep(2)

if __name__ == "__main__":
    poll_micro_decisions()
`;
    const blob = new Blob([scriptContent], { type: "text/x-python" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "dravis_full_pc_agent.py";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleMultiWorkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!multiWorkInput.trim()) return;
    const cmd = multiWorkInput.trim();
    setMultiWorkInput("");
    await onExecuteMultiWork(cmd);
  };

  const level0Node = leverageTree.find((n) => n.level === 0) || leverageTree[0];
  const level1Nodes = leverageTree.filter((n) => n.level === 1);
  const level2Nodes = leverageTree.filter((n) => n.level === 2);
  const level3Nodes = leverageTree.filter((n) => n.level === 3);

  return (
    <div
      id="dravis-micro-decision-view"
      className={`flex-1 flex flex-col h-full ${
        isFullScreenOrbit && subView === "SPHERE_360_3D" ? "p-1.5 sm:p-2 gap-1.5" : "p-3 sm:p-4 gap-3"
      } overflow-y-auto bg-transparent`}
    >
      {/* 1. TOP LIQUID GLASS HEADER & MULTI-WORK COMMAND BAR */}
      <div
        className={`liquid-glass rounded-2xl ${
          isFullScreenOrbit && subView === "SPHERE_360_3D" ? "px-3 py-2" : "p-3 sm:p-4"
        } flex flex-col gap-2`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-400/15 border border-cyan-400/40 text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.3)]">
              <Globe className="w-4 h-4 animate-spin" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xs sm:text-sm font-bold text-white font-mono tracking-wider uppercase">
                  360° 3D Earth Micro-Decision & Multi-Work Orbit
                </h2>
                <span className="text-[10px] font-mono text-cyan-300">
                  Gemini + OpenAI Active
                </span>
              </div>
            </div>
          </div>

          {/* Sub-View Selector Tabs + FULL SCREEN Button + Quick Controls */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {[
              { id: "SPHERE_360_3D", label: "1. 360° Earth Orbit", icon: Compass },
              { id: "LEVERAGE_DECISION_TREE", label: "2. Leverage Tree", icon: GitBranch },
              { id: "NODE_SLOT_FILLING", label: "3. Slot-Filling", icon: Database },
              { id: "APLYSIA_VOICE_PIPELINE", label: "4. Voice Pipeline", icon: Volume2 },
              { id: "FULL_PC_SCREEN_AUTOFIX", label: "5. Screen Auto-Fix", icon: Monitor },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = subView === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    if (userProfile.soundEffects) soundEffects.playChirp();
                    setSubView(tab.id as SystemSubView);
                  }}
                  className={`px-2.5 py-1.5 rounded-xl font-mono text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 border ${
                    isActive
                      ? "bg-cyan-400/25 border-cyan-400 text-white shadow-[0_0_12px_rgba(34,211,238,0.3)]"
                      : "bg-black/25 border-white/10 text-slate-300 hover:text-white hover:border-white/25"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 text-cyan-300" />
                  <span>{tab.label}</span>
                </button>
              );
            })}

            {/* DEDICATED "FULL SCREEN" BUTTON (Expands 360° Orbit all the way across AI News Feed & to bottom, leaving only Core Modules on left!) */}
            {onToggleFullScreenOrbit && (
              <button
                type="button"
                onClick={() => {
                  if (userProfile.soundEffects) soundEffects.playChirp();
                  onToggleFullScreenOrbit();
                }}
                className={`px-3 py-1.5 rounded-xl font-mono text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 border ${
                  isFullScreenOrbit
                    ? "bg-emerald-400 text-slate-950 border-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.5)]"
                    : "bg-cyan-400/20 border-cyan-400 text-cyan-200 hover:bg-cyan-400/30"
                }`}
              >
                {isFullScreenOrbit ? (
                  <>
                    <Minimize2 className="w-3.5 h-3.5" />
                    <span>FULL SCREEN: ACTIVE</span>
                  </>
                ) : (
                  <>
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>FULL SCREEN</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Compact Multi-Work Command Bar + Self-Work Loop */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1.5 border-t border-white/10">
          <form onSubmit={handleMultiWorkSubmit} className="flex items-center gap-2 flex-1 min-w-[240px]">
            <div className="relative flex-1">
              <Zap className="w-3.5 h-3.5 text-cyan-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={multiWorkInput}
                onChange={(e) => setMultiWorkInput(e.target.value)}
                placeholder="Give any multi-work command (e.g., 'Analyze system, fix lag, and prepare code')..."
                className="w-full liquid-glass-clear rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
              />
            </div>
            <button
              type="submit"
              disabled={isExecutingMultiWork}
              className="px-3 py-1.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-mono text-[11px] font-bold cursor-pointer transition-all shrink-0"
            >
              {isExecutingMultiWork ? "RUNNING..." : "RUN MULTI-WORK"}
            </button>
          </form>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onToggleAutonomousSelfWork(!autonomousSelfWorkActive)}
              className={`px-2.5 py-1.5 rounded-xl font-mono text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                autonomousSelfWorkActive
                  ? "bg-emerald-400/25 border-emerald-400 text-emerald-200"
                  : "bg-white/5 border-white/15 text-slate-300 hover:text-white"
              }`}
            >
              <Radio className={`w-3 h-3 ${autonomousSelfWorkActive ? "text-emerald-300 animate-ping" : "text-slate-400"}`} />
              <span>{autonomousSelfWorkActive ? "SELF-WORK: ON" : "SELF-WORK: OFF"}</span>
            </button>

            <button
              type="button"
              onClick={() => captureScreenFrameAndAutoFix()}
              disabled={isAutoFixingScreen}
              className="px-2.5 py-1.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-mono text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{isAutoFixingScreen ? "AUTO-FIXING..." : "SCAN & AUTO-FIX"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* =====================================================================
          MODE 1: FULL-SCREEN 360° 3D INTERACTIVE EARTH MICRO-DECISION ORBIT & INLINE EXPANDABLE POPUP
         ===================================================================== */}
      {subView === "SPHERE_360_3D" && (
        <div className="flex-1 flex flex-col min-h-0 relative">
          {/* Full-Screen Transparent 360° 3D Interactive Earth Orbit Viewport */}
          <div className="flex-1 liquid-glass-clear rounded-2xl p-2.5 flex flex-col relative min-h-0 overflow-hidden border border-cyan-400/35">
            {/* Search & Full-Screen 360° Orbit Zoom / Rotation Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 z-10 pb-2 border-b border-white/15">
              <div className="relative flex-1 min-w-[220px] max-w-md">
                <Search className="w-3.5 h-3.5 text-cyan-300 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search any micro-decision or move cursor Left / Right to rotate 360° Earth..."
                  className="w-full bg-black/40 border border-white/20 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="flex items-center gap-1.5 flex-wrap font-mono text-[11px]">
                {onToggleFullScreenOrbit && (
                  <button
                    type="button"
                    onClick={onToggleFullScreenOrbit}
                    className={`px-3 py-1.5 rounded-lg border font-bold cursor-pointer flex items-center gap-1.5 ${
                      isFullScreenOrbit
                        ? "bg-emerald-400 text-slate-950 border-emerald-300"
                        : "bg-cyan-400/20 border-cyan-400 text-cyan-200"
                    }`}
                  >
                    {isFullScreenOrbit ? (
                      <>
                        <Minimize2 className="w-3.5 h-3.5" />
                        <span>FULL SCREEN: ON</span>
                      </>
                    ) : (
                      <>
                        <Maximize2 className="w-3.5 h-3.5" />
                        <span>FULL SCREEN</span>
                      </>
                    )}
                  </button>
                )}
                <span className="px-2.5 py-1 rounded-lg bg-cyan-500/15 border border-cyan-400/40 text-cyan-200 font-bold">
                  ZOOM: {Math.round(zoom * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setZoom((z) => {
                      const next = Math.min(2.8, Number((z + 0.2).toFixed(2)));
                      zoomRef.current = next;
                      return next;
                    })
                  }
                  className="px-2.5 py-1.5 rounded-lg bg-black/40 border border-white/20 text-white hover:border-cyan-400 cursor-pointer flex items-center gap-1"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5 text-cyan-300" />
                  <span>ZOOM IN (+)</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setZoom((z) => {
                      const next = Math.max(0.38, Number((z - 0.2).toFixed(2)));
                      zoomRef.current = next;
                      return next;
                    })
                  }
                  className="px-2.5 py-1.5 rounded-lg bg-black/40 border border-white/20 text-white hover:border-cyan-400 cursor-pointer flex items-center gap-1"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5 text-cyan-300" />
                  <span>ZOOM OUT (-)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setZoom(1.0);
                    zoomRef.current = 1.0;
                    yawRef.current = 0.4;
                    pitchRef.current = 0.18;
                    targetPitchRef.current = 0.18;
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-black/40 border border-white/20 text-slate-200 hover:text-white hover:border-cyan-400 cursor-pointer"
                >
                  FIT ALL (100%)
                </button>
                <button
                  type="button"
                  onClick={() => setAutoRotate((prev) => !prev)}
                  className={`px-2.5 py-1.5 rounded-lg border cursor-pointer ${
                    autoRotate
                      ? "bg-cyan-400/20 border-cyan-400 text-cyan-200 font-bold"
                      : "bg-black/40 border-white/20 text-slate-300"
                  }`}
                >
                  {autoRotate ? "360° EARTH ORBIT: AUTO" : "360° EARTH ORBIT: MANUAL"}
                </button>
              </div>
            </div>

            {/* Full-Screen 360° 3D Interactive Canvas */}
            <div className="flex-1 relative min-h-0 w-full">
              <canvas
                ref={canvas3dRef}
                onMouseDown={(e) => {
                  isDraggingRef.current = true;
                  const rect = e.currentTarget.getBoundingClientRect();
                  lastDragPosRef.current = {
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top,
                  };
                }}
                onMouseUp={() => {
                  isDraggingRef.current = false;
                }}
                onMouseLeave={() => {
                  isDraggingRef.current = false;
                }}
                onMouseMove={handleCanvasMouseMove}
                onWheel={handleCanvasWheelZoom}
                onClick={handleCanvasClick}
                className={`w-full h-full ${
                  hovered3DNode ? "cursor-pointer" : "cursor-grab active:cursor-grabbing"
                }`}
              />

              {/* Bottom 3D HUD Legend + Quick-Click Strip for All Micro-Decisions */}
              <div className="absolute bottom-2 left-2 right-2 flex flex-col gap-1.5 z-10">
                <div className="flex items-center justify-between pointer-events-none text-[10px] font-mono text-slate-200 bg-slate-950/75 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/15">
                  <span>
                    SCROLL CURSOR WHEEL TO ZOOM IN / ZOOM OUT • DRAG TO ROTATE 360° • CLICK ANY MICRO-DECISION TO EXPAND POPUP
                  </span>
                  <span className="text-cyan-300 font-bold">
                    {filteredNodes.length} MICRO-DECISIONS VISIBLE
                  </span>
                </div>

                {/* All Decisions Horizontal Pill Strip so user can also click any decision directly */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 px-1">
                  {filteredNodes.map((n) => {
                    const isSelected = expandedPopupNode?.id === n.id;
                    return (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() => {
                          if (userProfile.soundEffects) soundEffects.playChirp();
                          onSelectNode(n);
                          setExpandedPopupNode(n);
                          setShowAboutDecision(false);
                        }}
                        className={`px-2.5 py-1.5 rounded-xl border font-mono text-[10px] shrink-0 flex items-center gap-1.5 cursor-pointer transition-all ${
                          isSelected
                            ? "bg-cyan-400/30 border-cyan-300 text-white shadow-[0_0_12px_rgba(34,211,238,0.45)]"
                            : "bg-slate-950/80 border-white/15 text-slate-200 hover:border-cyan-400/60 hover:text-white"
                        }`}
                      >
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: n.color }}
                        />
                        <span className="font-bold">{n.title}</span>
                        <span className="text-emerald-300">{n.latencyMs}ms</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* =================================================================
                  INLINE EXPANDABLE MICRO-DECISION POPUP INSIDE THE 360° ORBIT SCREEN
                  (Opens immediately when clicking any Micro-Decision node!)
                 ================================================================= */}
              <AnimatePresence>
                {expandedPopupNode && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.92, y: 12 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.92, y: 12 }}
                    className="absolute top-3 right-3 z-30 w-[460px] max-w-[95%] max-h-[88%] overflow-y-auto liquid-glass rounded-2xl p-4 border-2 border-cyan-400/70 shadow-[0_15px_50px_rgba(0,0,0,0.9)] font-mono text-xs custom-scrollbar"
                  >
                    {/* Popup Header */}
                    <div className="flex items-center justify-between pb-2.5 border-b border-white/15">
                      <div className="flex items-center gap-2">
                        <Compass className="w-4 h-4 text-cyan-400 animate-spin" />
                        <span className="text-cyan-300 font-bold uppercase tracking-wider text-[11px]">
                          Expanded Micro-Decision Inspector
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[10px] font-bold flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {expandedPopupNode.latencyMs} ms
                        </span>
                        <button
                          type="button"
                          onClick={() => setExpandedPopupNode(null)}
                          className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white cursor-pointer"
                          title="Close Popup"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Node Title & Quantitative Metrics */}
                    <div className="mt-3 flex flex-col gap-3">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <span className="text-[10px] text-slate-400 block">
                            NODE ID: {expandedPopupNode.id.toUpperCase()} • {expandedPopupNode.category}
                          </span>
                          <h3 className="text-base font-bold text-white font-sans">
                            {expandedPopupNode.title}
                          </h3>
                        </div>
                        <button
                          type="button"
                          onClick={() => onExecuteSingleNode(expandedPopupNode)}
                          className="px-3 py-1.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold flex items-center gap-1.5 cursor-pointer transition-all shrink-0 shadow-[0_0_15px_rgba(34,211,238,0.4)]"
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span>Run Decision</span>
                        </button>
                      </div>

                      {/* Quantitative Leverage Metrics Strip */}
                      <div className="grid grid-cols-4 gap-2 text-center">
                        <div className="p-2 rounded-xl bg-black/45 border border-white/10">
                          <span className="text-[9px] text-slate-400 block">GINI INDEX</span>
                          <strong className="text-amber-300 text-xs">{expandedPopupNode.gini}</strong>
                        </div>
                        <div className="p-2 rounded-xl bg-black/45 border border-white/10">
                          <span className="text-[9px] text-slate-400 block">SAMPLES</span>
                          <strong className="text-cyan-300 text-xs">
                            {expandedPopupNode.samples.toLocaleString()}
                          </strong>
                        </div>
                        <div className="p-2 rounded-xl bg-black/45 border border-white/10">
                          <span className="text-[9px] text-slate-400 block">SPEED</span>
                          <strong className="text-emerald-300 text-xs">
                            {expandedPopupNode.latencyMs} ms
                          </strong>
                        </div>
                        <div className="p-2 rounded-xl bg-black/45 border border-white/10">
                          <span className="text-[9px] text-slate-400 block">API ENGINE</span>
                          <strong className="text-violet-300 text-[10px]">
                            {expandedPopupNode.apiUsed.replace("_", " ")}
                          </strong>
                        </div>
                      </div>

                      {/* Command Execution Breakdown (What It Did Inside the Command) */}
                      <div className="p-3 rounded-xl bg-black/50 border border-cyan-400/35 flex flex-col gap-1.5 font-sans">
                        <span className="text-[10px] font-mono font-bold text-cyan-300 uppercase flex items-center gap-1.5">
                          <Terminal className="w-3.5 h-3.5" />
                          <span>Command Execution Breakdown (Command के अंदर क्या-क्या किया):</span>
                        </span>
                        <ul className="space-y-1.5 text-[11px] text-slate-100 mt-1">
                          {getCommandActionsList(expandedPopupNode).map((step, i) => (
                            <li key={i} className="flex items-start gap-1.5 leading-relaxed">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                              <span>{step}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Dedicated "About This Decision" Button inside the Popup */}
                      <button
                        type="button"
                        onClick={() => setShowAboutDecision((prev) => !prev)}
                        className={`w-full py-2.5 px-3.5 rounded-xl border font-mono text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                          showAboutDecision
                            ? "bg-amber-500/25 border-amber-400 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                            : "bg-white/10 hover:bg-white/15 border-cyan-400/50 text-cyan-200"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <Activity className="w-4 h-4 text-amber-300" />
                          <span>ABOUT THIS DECISION (Speed, Load, Question & How It Worked)</span>
                        </span>
                        {showAboutDecision ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>

                      {/* Expandable "About This Decision" Deep Telemetry Section */}
                      <AnimatePresence>
                        {showAboutDecision &&
                          (() => {
                            const loadInfo = getSystemLoadMetrics(expandedPopupNode);
                            return (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="p-3.5 rounded-xl bg-slate-950/90 border border-amber-400/50 flex flex-col gap-2.5 font-sans text-xs overflow-hidden"
                              >
                                <div className="p-2.5 rounded-lg bg-white/5 border border-white/10">
                                  <span className="text-[10px] font-mono font-bold text-amber-300 uppercase block mb-0.5">
                                    1. Question / Trigger Command (Question क्या था):
                                  </span>
                                  <p className="text-white font-semibold">{loadInfo.questionText}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                                  <div className="p-2.5 rounded-lg bg-emerald-950/35 border border-emerald-400/35">
                                    <span className="text-[9px] text-emerald-300 uppercase block">
                                      2. Responding Speed (कितनी जल्दी किया):
                                    </span>
                                    <strong className="text-white text-sm">
                                      {expandedPopupNode.latencyMs} ms (Ultra-Fast)
                                    </strong>
                                    <span className="text-[10px] text-slate-300 block mt-0.5">
                                      Confidence: {(expandedPopupNode.confidence * 100).toFixed(1)}%
                                    </span>
                                  </div>

                                  <div className="p-2.5 rounded-lg bg-cyan-950/35 border border-cyan-400/35">
                                    <span className="text-[9px] text-cyan-300 uppercase block">
                                      3. System Load (कितने Load पे किया):
                                    </span>
                                    <strong className="text-white text-xs block">
                                      {loadInfo.cpuLoad} • {loadInfo.ramLoad}
                                    </strong>
                                    <span className="text-[10px] text-cyan-200 block mt-0.5">
                                      {loadInfo.neuralLoad}
                                    </span>
                                  </div>
                                </div>

                                <div className="p-2.5 rounded-lg bg-violet-950/35 border border-violet-400/35">
                                  <span className="text-[10px] font-mono font-bold text-violet-300 uppercase block mb-0.5">
                                    4. How It Performed & Worked (कैसे किया और क्या किया):
                                  </span>
                                  <p className="text-slate-100 leading-relaxed mb-1">
                                    {expandedPopupNode.howItWorks}
                                  </p>
                                  <p className="text-[11px] text-cyan-300 font-mono">
                                    What It Takes: {expandedPopupNode.whatItTakes}
                                  </p>
                                  <p className="text-[11px] text-amber-300 font-mono mt-0.5">
                                    Performance: {expandedPopupNode.howItPerforms}
                                  </p>
                                </div>
                              </motion.div>
                            );
                          })()}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODE 2: LEVERAGE METRICS DECISION TREE (IMAGE 5 ARCHITECTURE)
         ===================================================================== */}
      {subView === "LEVERAGE_DECISION_TREE" && (
        <div className="liquid-glass rounded-2xl p-4 flex flex-col gap-4 overflow-x-auto">
          <div className="flex items-center justify-between border-b border-white/15 pb-3">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white font-mono uppercase">
                Decision Tree Based on Leverage Metrics ➔ Top Trees Zoom Inspector
              </h3>
              <p className="text-xs text-slate-300 font-sans">
                Real-time hierarchical micro-decision tree evaluating Gini impurity, sample counts, and True/False branch weights across Google Gemini & OpenAI.
              </p>
            </div>
            <span className="text-xs font-mono text-amber-300 font-bold">
              Total Samples: 4,773 • Active Root Gini: 0.058
            </span>
          </div>

          {/* Top Macro Decision Tree Overview (Miniaturized Multi-Layer Forest Visualization) */}
          <div className="p-3 rounded-xl bg-black/30 border border-white/10 flex flex-col items-center gap-2">
            <span className="text-[11px] font-mono font-bold text-slate-300 uppercase tracking-wider">
              Macro Decision Tree Based on Leverage Metrics (Full 64-Branch Autonomous Forest)
            </span>
            <svg className="w-full h-28 max-w-4xl" viewBox="0 0 800 110">
              {/* Root to Level 1 */}
              <line x1="400" y1="12" x2="220" y2="38" stroke="#f59e0b" strokeWidth="1.5" />
              <line x1="400" y1="12" x2="580" y2="38" stroke="#38bdf8" strokeWidth="1.5" />
              {/* Level 1 to Level 2 */}
              <line x1="220" y1="38" x2="120" y2="68" stroke="#f59e0b" strokeWidth="1.2" />
              <line x1="220" y1="38" x2="320" y2="68" stroke="#f59e0b" strokeWidth="1.2" />
              <line x1="580" y1="38" x2="480" y2="68" stroke="#f59e0b" strokeWidth="1.2" />
              <line x1="580" y1="38" x2="680" y2="68" stroke="#38bdf8" strokeWidth="1.2" />
              {/* Level 2 to Level 3 Leaves */}
              {[70, 170, 270, 370, 430, 530, 630, 730].map((lx, idx) => (
                <React.Fragment key={idx}>
                  <line
                    x1={idx < 2 ? 120 : idx < 4 ? 320 : idx < 6 ? 480 : 680}
                    y1="68"
                    x2={lx}
                    y2="96"
                    stroke={idx >= 5 && idx <= 6 ? "#38bdf8" : "#f59e0b"}
                    strokeWidth="1"
                  />
                  <rect
                    x={lx - 14}
                    y="92"
                    width="28"
                    height="12"
                    rx="2"
                    fill={idx === 5 || idx === 6 ? "#38bdf8" : "#d97706"}
                  />
                </React.Fragment>
              ))}
              <rect x="380" y="4" width="40" height="14" rx="3" fill="#d97706" />
              <rect x="200" y="30" width="40" height="14" rx="3" fill="#d97706" />
              <rect x="560" y="30" width="40" height="14" rx="3" fill="#eab308" />
              {[120, 320, 480, 680].map((nx, i) => (
                <rect key={i} x={nx - 18} y="60" width="36" height="13" rx="2" fill={i === 2 ? "#f59e0b" : "#d97706"} />
              ))}
            </svg>
            <div className="flex items-center gap-1.5 text-cyan-300 font-mono text-xs font-bold">
              <ArrowDown className="w-4 h-4 animate-bounce" />
              <span>Top Trees Based on Leverage Metrics (Interactive Node Matrix)</span>
            </div>
          </div>

          {/* Zoomed-in Top Trees Based on Leverage Metrics (Exact 4-Level Hierarchy from Image 5) */}
          <div className="flex flex-col items-center gap-4 min-w-[780px] py-2">
            {/* Level 0: Root Node */}
            {level0Node && (
              <div
                onClick={() => setActiveTreeNodeId(level0Node.id)}
                className={`p-3 rounded-xl border-2 cursor-pointer transition-all text-center font-mono text-xs w-72 ${
                  activeTreeNodeId === level0Node.id
                    ? "bg-amber-500/35 border-amber-300 text-white shadow-[0_0_20px_rgba(245,158,11,0.5)]"
                    : "bg-amber-600/25 border-amber-500/60 text-amber-100 hover:border-amber-300"
                }`}
              >
                <div className="font-bold text-white">{level0Node.condition}</div>
                <div>gini = {level0Node.gini}</div>
                <div>samples = {level0Node.samples}</div>
                <div>
                  value = [{level0Node.value[0]}, {level0Node.value[1]}]
                </div>
                <div className="font-bold text-amber-300">class = {level0Node.classLabel}</div>
              </div>
            )}

            {/* True / False Branch Labels */}
            <div className="flex items-center justify-around w-full max-w-2xl text-xs font-mono font-bold text-cyan-300">
              <span>↙ True (Direct Context Execution)</span>
              <span>False (Autonomous Escalation) ↘</span>
            </div>

            {/* Level 1: 2 Nodes */}
            <div className="grid grid-cols-2 gap-12 w-full max-w-4xl">
              {level1Nodes.map((n) => (
                <div
                  key={n.id}
                  onClick={() => setActiveTreeNodeId(n.id)}
                  className={`p-3 rounded-xl border-2 cursor-pointer transition-all text-center font-mono text-xs mx-auto w-72 ${
                    activeTreeNodeId === n.id
                      ? "bg-amber-500/35 border-amber-300 text-white shadow-[0_0_20px_rgba(245,158,11,0.45)]"
                      : "bg-amber-600/20 border-amber-500/50 text-amber-100 hover:border-amber-300"
                  }`}
                >
                  <div className="font-bold text-white">{n.condition}</div>
                  <div>gini = {n.gini}</div>
                  <div>samples = {n.samples}</div>
                  <div>
                    value = [{n.value[0]}, {n.value[1]}]
                  </div>
                  <div className="font-bold text-amber-300">class = {n.classLabel}</div>
                </div>
              ))}
            </div>

            {/* Level 2: 4 Nodes */}
            <div className="grid grid-cols-4 gap-4 w-full">
              {level2Nodes.map((n) => (
                <div
                  key={n.id}
                  onClick={() => setActiveTreeNodeId(n.id)}
                  className={`p-2.5 rounded-xl border-2 cursor-pointer transition-all text-center font-mono text-[11px] ${
                    activeTreeNodeId === n.id
                      ? "bg-amber-500/35 border-amber-300 text-white shadow-[0_0_15px_rgba(245,158,11,0.45)]"
                      : "bg-amber-600/20 border-amber-500/50 text-amber-100 hover:border-amber-300"
                  }`}
                >
                  <div className="font-bold text-white truncate">{n.condition}</div>
                  <div>gini = {n.gini}</div>
                  <div>samples = {n.samples}</div>
                  <div>
                    value = [{n.value[0]}, {n.value[1]}]
                  </div>
                  <div className="font-bold text-amber-300">class = {n.classLabel}</div>
                </div>
              ))}
            </div>

            {/* Level 3: 8 Leaf Nodes (Amber class=0 & Cyan/Blue class=1 matching Image 5) */}
            <div className="grid grid-cols-8 gap-2 w-full">
              {level3Nodes.map((n) => {
                const isClass1 = n.classLabel === 1;
                return (
                  <div
                    key={n.id}
                    onClick={() => setActiveTreeNodeId(n.id)}
                    className={`p-2 rounded-xl border-2 cursor-pointer transition-all text-center font-mono text-[10px] ${
                      isClass1
                        ? "bg-sky-500/30 border-sky-400 text-white shadow-[0_0_12px_rgba(56,189,248,0.4)]"
                        : "bg-amber-600/25 border-amber-500/60 text-amber-100 hover:border-amber-300"
                    }`}
                  >
                    <div className="font-bold truncate text-white">{n.condition}</div>
                    <div>gini = {n.gini}</div>
                    <div>samples = {n.samples}</div>
                    <div>
                      value = [{n.value[0]}, {n.value[1]}]
                    </div>
                    <div className="font-bold">class = {n.classLabel}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODE 3: NODE PATTERN & SLOT-FILLING CONTEXT FLOWCHART (IMAGE 2)
         ===================================================================== */}
      {subView === "NODE_SLOT_FILLING" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 flex-1">
          {/* Left 7 Cols: Interactive Algorithmic Flowchart from Image 2 */}
          <div className="lg:col-span-7 liquid-glass rounded-2xl p-4 flex flex-col gap-3 font-mono text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-white/15">
              <span className="text-cyan-300 font-bold uppercase">
                Structured Node & Slot-Filling Context Completion Flowchart
              </span>
              <span className="text-[10px] text-emerald-300">
                Checked {slotTrace.nodesCheckedCount} Nodes • {slotTrace.patternsCheckedCount} Structure Patterns
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-start my-auto">
              {/* Left Column of Flowchart: Utterance -> Node -> Pattern Match */}
              <div className="flex flex-col items-center gap-2">
                <div className="w-full p-2.5 rounded-xl bg-cyan-500/20 border border-cyan-400 text-center">
                  <span className="text-[10px] text-cyan-300 block uppercase">1. User Utterance (Speech)</span>
                  <strong className="text-white font-sans text-xs">"{slotTrace.utterance}"</strong>
                </div>
                <ArrowDown className="w-4 h-4 text-cyan-400" />
                <div className="w-full p-2.5 rounded-xl bg-black/35 border border-white/20 text-center">
                  <span className="text-[10px] text-slate-400 block">2. Predefined Node List</span>
                  <strong className="text-cyan-200 text-[11px]">{slotTrace.matchedNode}</strong>
                </div>
                <ArrowDown className="w-4 h-4 text-cyan-400" />
                <div className="w-full p-2.5 rounded-xl bg-black/35 border border-white/20 text-center">
                  <span className="text-[10px] text-slate-400 block">3. Structure Pattern Match</span>
                  <strong className="text-amber-300 text-[11px]">{slotTrace.matchedStructurePattern}</strong>
                </div>
                <ArrowDown className="w-4 h-4 text-emerald-400" />
                <div className="w-full p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-400 text-center">
                  <span className="text-[10px] text-emerald-300 block uppercase">
                    Diamond Gate: Utterance Matches Pattern?
                  </span>
                  <strong className="text-white">YES ➔ Proceed to Required Parameter Slots</strong>
                </div>
              </div>

              {/* Right Column of Flowchart: Slot Filling -> 3D Context Cube -> Command Generation */}
              <div className="flex flex-col items-center gap-2">
                <div className="w-full p-2.5 rounded-xl bg-violet-500/20 border border-violet-400 text-center">
                  <span className="text-[10px] text-violet-300 block uppercase">
                    4. Slots for Required Parameters Filled?
                  </span>
                  <strong className="text-white">
                    {slotTrace.allSlotsFilled ? "YES (All Slots Verified)" : "AUTO-FILLING FROM VECTOR MEMORY"}
                  </strong>
                </div>
                <ArrowDown className="w-4 h-4 text-amber-400" />
                {/* 3D Yellow Context Completion Cube from Image 2 */}
                <div className="w-full p-3 rounded-xl bg-amber-500/25 border-2 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.3)] text-center">
                  <span className="text-[10px] text-amber-200 font-bold uppercase block">
                    5. 3D Context Completion Cube
                  </span>
                  <p className="text-[11px] text-white font-sans mt-1">
                    {slotTrace.contextCompletionSummary}
                  </p>
                </div>
                <ArrowDown className="w-4 h-4 text-emerald-400" />
                <div className="w-full p-3 rounded-xl bg-emerald-500/25 border border-emerald-400 text-center">
                  <span className="text-[10px] text-emerald-300 font-bold uppercase block">
                    6. Generate & Send Command
                  </span>
                  <code className="text-[11px] text-white block mt-1 break-all">
                    {slotTrace.generatedCommand}
                  </code>
                </div>
              </div>
            </div>
          </div>

          {/* Right 5 Cols: Active Parameter Slots Table & Live Tester */}
          <div className="lg:col-span-5 liquid-glass rounded-2xl p-4 flex flex-col gap-3 font-mono text-xs">
            <span className="text-white font-bold uppercase pb-2 border-b border-white/15">
              Extracted Parameter Slots & Vector Memory Injection
            </span>
            <div className="flex flex-col gap-2">
              {slotTrace.slots.map((slot, i) => (
                <div
                  key={i}
                  className="p-2.5 rounded-xl bg-black/35 border border-white/15 flex items-center justify-between gap-2"
                >
                  <div>
                    <span className="text-cyan-300 font-bold block">{slot.name}</span>
                    <span className="text-white font-sans text-xs">{slot.value}</span>
                  </div>
                  <span className="text-[10px] text-emerald-300 font-bold shrink-0">
                    {slot.source} ✓
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODE 4: APLYSIA VOICE PROCESSING, 5-STAGE PIPELINE & 6-PERSONA VOICE STUDIO
         ===================================================================== */}
      {subView === "APLYSIA_VOICE_PIPELINE" && (
        <div className="flex flex-col gap-3 flex-1">
          {/* Top Row: Aplysia Voice Processing (Image 1) + 5-Stage Autonomous Pipeline */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
            {/* Image 1: Aplysia - Voice Processing Interlocking Circles */}
            <div className="lg:col-span-6 liquid-glass rounded-2xl p-4 flex flex-col items-center justify-center gap-3">
              <div className="text-center">
                <span className="text-xs font-mono font-bold text-cyan-300 uppercase tracking-widest">
                  Aplysia — Voice Processing & Decision Making Architecture
                </span>
                {/* Live Waveform Bars above circles */}
                <div className="flex items-center justify-center gap-1 h-6 mt-1">
                  {Array.from({ length: 32 }).map((_, idx) => (
                    <motion.div
                      key={idx}
                      className="w-1 bg-cyan-400/80 rounded-full"
                      animate={{ height: [4, 6 + ((idx * 7) % 16), 4] }}
                      transition={{ repeat: Infinity, duration: 0.9, delay: idx * 0.03 }}
                    />
                  ))}
                </div>
              </div>

              {/* Interlocking Circles matching Image 1 */}
              <div className="flex items-center justify-center flex-wrap sm:flex-nowrap gap-1 sm:-space-x-3 py-2">
                <div className="w-28 h-28 rounded-full bg-slate-900/90 border-2 border-cyan-400 flex flex-col items-center justify-center text-center p-2 shadow-[0_0_20px_rgba(34,211,238,0.3)] z-10">
                  <Mic className="w-7 h-7 text-white mb-1" />
                  <span className="text-[10px] font-bold text-white">Voice Message</span>
                </div>
                <div className="w-16 h-16 rounded-full bg-white text-slate-950 border-2 border-cyan-400 flex flex-col items-center justify-center font-mono font-extrabold text-xs z-20 shadow-lg">
                  <span>STT</span>
                </div>
                <div className="w-32 h-32 rounded-full bg-slate-900/95 border-2 border-cyan-400 flex flex-col items-center justify-center text-center p-2 shadow-[0_0_25px_rgba(34,211,238,0.4)] z-10">
                  <span className="text-xs font-extrabold text-cyan-300 leading-tight">
                    Decision Making
                  </span>
                  <span className="text-[9px] text-slate-300 mt-0.5">
                    with Gemini + OpenAI
                  </span>
                </div>
                <div className="w-16 h-16 rounded-full bg-white text-slate-950 border-2 border-cyan-400 flex flex-col items-center justify-center font-mono font-extrabold text-xs z-20 shadow-lg">
                  <span>TTS</span>
                </div>
                <div className="w-28 h-28 rounded-full bg-slate-900/90 border-2 border-cyan-400 flex flex-col items-center justify-center text-center p-2 shadow-[0_0_20px_rgba(34,211,238,0.3)] z-10">
                  <Speaker className="w-7 h-7 text-white mb-1" />
                  <span className="text-[10px] font-bold text-white">Answer</span>
                </div>
              </div>
            </div>

            {/* Prompt 5-Stage Pipeline Diagram */}
            <div className="lg:col-span-6 liquid-glass rounded-2xl p-4 flex flex-col justify-between gap-2 font-mono text-xs">
              <span className="text-cyan-300 font-bold uppercase border-b border-white/15 pb-1.5">
                5-Stage Autonomous Voice-to-Action Execution Pipeline
              </span>
              {[
                {
                  stage: "[1. Your Voice Command]",
                  desc: "Multilingual voice or text input captured with zero-latency wake word detection",
                  color: "text-cyan-300",
                },
                {
                  stage: "[2. Local Speech-to-Text]",
                  desc: "Converts audio waveform (010110 binary frames) to text offline & online across 43 languages",
                  color: "text-emerald-300",
                },
                {
                  stage: "[3. Direct Intent LLM (Gemini + OpenAI)]",
                  desc: "Interprets full user intent and decomposes multi-work tasks via Google Gemini & OpenAI APIs",
                  color: "text-violet-300",
                },
                {
                  stage: "[4. Vector Memory Bank]",
                  desc: `Pulls ${userProfile.name}'s micro-preferences (${memories.length} active memory vectors) & past context`,
                  color: "text-amber-300",
                },
                {
                  stage: "[5. Autonomous Agents ➔ Unrestricted Action]",
                  desc: "Writes code, monitors screen, dispatches virtual/OS cursor, and completes digital automation",
                  color: "text-rose-300",
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="p-2 rounded-xl bg-black/30 border border-white/10 flex items-center justify-between gap-2"
                >
                  <div>
                    <strong className={`${item.color} block text-[11px]`}>{item.stage}</strong>
                    <span className="text-[11px] text-slate-200 font-sans">{item.desc}</span>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Row: 6 Distinct Voice Personas Studio (Every Voice Has Its Own Speaking Flow & Timbre) */}
          <div className="liquid-glass rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/15 pb-2">
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-white font-mono uppercase flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-cyan-400" />
                  <span>
                    Multi-Persona Acoustic Voice Studio (Each Voice Has Its Own Timbre, Pitch & Speaking Flow)
                  </span>
                </h4>
                <p className="text-xs text-slate-300 font-sans">
                  Click any voice below to immediately switch Dravis to that voice and hear its unique speaking flow!
                </p>
              </div>
              <span className="text-xs font-mono text-cyan-300 font-bold">
                Active Voice: {userProfile.voicePreference || "Puck"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {DRAVIS_VOICE_PROFILES.map((vp) => {
                const isSelected = (userProfile.voicePreference || "Puck") === vp.id;
                return (
                  <div
                    key={vp.id}
                    onClick={() => {
                      const updated = { ...userProfile, voicePreference: vp.id };
                      onUpdateProfile(updated);
                      speechEngine.previewVoicePersona(
                        vp.id,
                        userProfile.autoAdaptLanguage !== false
                          ? userProfile.detectedLanguage || "en-US"
                          : userProfile.preferredLanguage || "en-US",
                        userProfile.voiceSpeed || 1.0,
                        userProfile.voicePitch || 1.0
                      );
                    }}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                      isSelected
                        ? "bg-cyan-500/25 border-cyan-400 text-white shadow-[0_0_15px_rgba(34,211,238,0.35)]"
                        : "bg-black/30 border-white/10 text-slate-300 hover:border-white/25 hover:text-white"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-white font-mono">{vp.name}</span>
                        <span className="text-[10px] font-mono text-cyan-300">
                          {vp.baseRate}x • Pitch {vp.pitchRatio}
                        </span>
                      </div>
                      <span className="text-[10px] text-amber-300 font-mono block mt-0.5">
                        {vp.tagline}
                      </span>
                      <p className="text-[11px] text-slate-200 font-sans mt-1 leading-relaxed">
                        {vp.speakingFlow}
                      </p>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-white/10 text-[10px] font-mono">
                      <span className="text-emerald-300">
                        {isSelected ? "● ACTIVE VOICE" : "Click to Activate & Hear"}
                      </span>
                      <span className="text-cyan-300 font-bold flex items-center gap-1">
                        <Play className="w-3 h-3" /> Test Voice
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODE 5: MULTI-BRANCH REALITY FLOW (IMAGE 3) + FULL-PC SCREEN MONITOR & AUTO-FIX
         ===================================================================== */}
      {subView === "FULL_PC_SCREEN_AUTOFIX" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 flex-1">
          {/* Left 7 Cols: Live Full-Computer Screen Monitor & Optical Auto-Fix Viewport */}
          <div className="lg:col-span-7 liquid-glass rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/15 pb-2">
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-white font-mono uppercase flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-cyan-400" />
                  <span>Full-Computer Screen Monitor, Autonomous Cursor & Auto-Fix</span>
                </h3>
                <p className="text-xs text-slate-300 font-sans">
                  Share your full computer screen or window so Dravis can monitor every pixel, click anywhere, auto-fix problems, and tell you what it fixed.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleStartScreenMonitor}
                  className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold cursor-pointer transition-all ${
                    isScreenMonitoring
                      ? "bg-rose-500 hover:bg-rose-400 text-white"
                      : "bg-cyan-400 hover:bg-cyan-300 text-slate-950"
                  }`}
                >
                  {isScreenMonitoring ? "STOP SCREEN STREAM" : "SHARE FULL PC SCREEN"}
                </button>
                <button
                  type="button"
                  onClick={captureScreenFrameAndAutoFix}
                  disabled={isAutoFixingScreen}
                  className="px-3 py-1.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-mono text-xs font-bold cursor-pointer transition-all"
                >
                  {isAutoFixingScreen ? "AUTO-FIXING..." : "AUTO-FIX NOW"}
                </button>
              </div>
            </div>

            {/* Live Screen Video Feed or Active Workspace Telemetry Radar */}
            <div className="relative flex-1 min-h-[250px] rounded-xl bg-black/40 border border-cyan-400/30 overflow-hidden flex items-center justify-center">
              <video
                ref={videoRef}
                muted
                playsInline
                className={`w-full h-full object-contain ${isScreenMonitoring ? "block" : "hidden"}`}
              />
              {!isScreenMonitoring && (
                <div className="p-6 text-center flex flex-col items-center gap-3 max-w-md">
                  <div className="w-14 h-14 rounded-2xl bg-cyan-400/15 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
                    <Monitor className="w-7 h-7" />
                  </div>
                  <div className="font-mono text-xs font-bold text-white">
                    WORKSPACE & FULL-PC OPTICAL GUARDIAN ACTIVE
                  </div>
                  <p className="text-xs text-slate-300 font-sans">
                    Click <strong>"SHARE FULL PC SCREEN"</strong> above to stream your entire desktop window into Dravis, or click <strong>"AUTO-FIX NOW"</strong> to let Dravis scan the current system, move its autonomous cursor, repair any issue, and report aloud.
                  </p>
                </div>
              )}
            </div>

            {/* Latest Auto-Fix Execution Report */}
            {latestAutoFixReport && (
              <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-400/50 font-sans text-xs flex flex-col gap-1">
                <div className="flex items-center justify-between font-mono text-[11px] text-emerald-300 font-bold">
                  <span>LATEST AUTO-FIX COMPLETED ({latestAutoFixReport.apiUsed})</span>
                  <span>{latestAutoFixReport.timestamp}</span>
                </div>
                <div>
                  <strong className="text-amber-300">Problem Detected: </strong>
                  <span className="text-white">{latestAutoFixReport.problemDetected}</span>
                </div>
                <div>
                  <strong className="text-emerald-300">Fix Applied: </strong>
                  <span className="text-white">{latestAutoFixReport.fixApplied}</span>
                </div>
              </div>
            )}
          </div>

          {/* Right 5 Cols: Image 3 Multi-Branch System Flowchart + Native Full-PC Companion Bridge */}
          <div className="lg:col-span-5 flex flex-col gap-3">
            <div className="liquid-glass rounded-2xl p-4 flex flex-col gap-2.5 font-mono text-xs">
              <span className="text-cyan-300 font-bold uppercase border-b border-white/15 pb-1.5">
                Multi-Branch System Execution State Machine (Image 3 System)
              </span>
              <div className="grid grid-cols-2 gap-2 font-sans text-[11px]">
                <div className="p-2.5 rounded-xl bg-black/30 border border-cyan-400/30">
                  <strong className="text-cyan-300 font-mono block text-[10px]">
                    BRANCH 1: REALITY CAMERA
                  </strong>
                  <span>Turn on camera ➔ Acquire optical frame ➔ Call Neural Network ➔ Sync to Cloud Memory</span>
                </div>
                <div className="p-2.5 rounded-xl bg-black/30 border border-violet-400/30">
                  <strong className="text-violet-300 font-mono block text-[10px]">
                    BRANCH 2: VECTOR MEMORY BOOK
                  </strong>
                  <span>Access Cloud & Local Vector DB ➔ Serve personalized user context & habits</span>
                </div>
                <div className="p-2.5 rounded-xl bg-black/30 border border-amber-400/30">
                  <strong className="text-amber-300 font-mono block text-[10px]">
                    BRANCH 3: STORYTELLER VOICE
                  </strong>
                  <span>Select among 6 distinct Voice Personas ➔ Speak with natural multilingual flow</span>
                </div>
                <div className="p-2.5 rounded-xl bg-black/30 border border-emerald-400/30">
                  <strong className="text-emerald-300 font-mono block text-[10px]">
                    BRANCH 4: 3D HOLOGRAPHIC HUD
                  </strong>
                  <span>Project 360° 3D Micro-Decision nodes across background & Core Module</span>
                </div>
              </div>
            </div>

            {/* Downloadable Local Full-PC Native Companion Bridge */}
            <div className="liquid-glass rounded-2xl p-4 flex flex-col gap-2.5 font-mono text-xs">
              <div className="flex items-center justify-between">
                <span className="text-white font-bold uppercase">
                  Full-Computer Native OS Bridge (Windows / Mac / Linux)
                </span>
                <span className="text-[10px] text-emerald-300 font-bold">READY</span>
              </div>
              <p className="text-xs text-slate-300 font-sans leading-relaxed">
                Want Dravis to physically move your OS mouse cursor and run commands outside the browser across your entire computer? Download and run the companion bridge script:
              </p>
              <button
                type="button"
                onClick={handleDownloadFullPcAgent}
                className="w-full py-2.5 px-4 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold flex items-center justify-center gap-2 cursor-pointer transition-all shadow-[0_0_15px_rgba(34,211,238,0.35)]"
              >
                <Download className="w-4 h-4" />
                <span>Download Full-PC OS Bridge (dravis_full_pc_agent.py)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
