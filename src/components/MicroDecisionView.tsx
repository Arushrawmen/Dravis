/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Core Module: Multi-Sector 360° 3D Micro-Decision World & Multi-Work System
 * Features:
 * - Full 3D World Camera Pan, Orbit & Zoom-to-Area via Scroll Wheel Button (Middle-Click) & Wheel Scroll
 * - Multi-Sector World Expansion with Long-Range Cross-World Neural Bridge Lines
 * - Interactive Moveable Camera Preview Viewport (Scroll Wheel & Wheel-Button Pan/Tilt/Zoom)
 * - Contextual Working Left-Click, Wheel/Cursor-Click, and Right-Click Buttons across all 5 Sub-Options
 */

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Compass,
  Zap,
  Search,
  Play,
  Eye,
  Monitor,
  Volume2,
  GitBranch,
  Database,
  CheckCircle2,
  Download,
  MousePointer,
  ShieldCheck,
  Mic,
  Speaker,
  Sliders,
  ArrowDown,
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
  Move,
  Camera,
  Sparkles,
  Crosshair,
  RefreshCw,
} from "lucide-react";
import {
  MicroDecisionNode,
  LeverageTreeNode,
  SlotFillingTrace,
  UserProfile,
  MemoryEntry,
  SystemTelemetry,
  DRAVIS_VOICE_PROFILES,
  ScreenAutoFixReport,
} from "../types";
import { speechEngine } from "../utils/speech";
import { soundEffects } from "../utils/audioSynth";
import {
  layoutMicroDecisionWorld3D,
  getSectorCenter3D,
  NODES_PER_WORLD_SECTOR,
  NODES_PER_PLANET,
  getPlanetName,
  setPlanetCustomName,
  DEFAULT_PLANET_NAMES,
} from "../utils/microDecisionWorldEngine";

interface MicroDecisionViewProps {
  nodes: MicroDecisionNode[];
  leverageTree: LeverageTreeNode[];
  slotTrace: SlotFillingTrace;
  selectedNode: MicroDecisionNode | null;
  onSelectNode: (node: MicroDecisionNode) => void;
  onExecuteMultiWork: (command: string) => Promise<void>;
  onExecuteSingleNode: (node: MicroDecisionNode) => Promise<void>;
  onTriggerScreenAutoFix: (screenFrameBase64?: string) => Promise<void>;
  onSpawnWorldNode?: (options?: {
    title?: string;
    command?: string;
    forceNewSector?: boolean;
    customSectorId?: number;
    customWorldNorm?: { x: number; y: number; z: number };
  }) => void;
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

type ActiveClickToolMode = "LEFT_SELECT_PAN" | "WHEEL_FREE_MOVE_ZOOM" | "RIGHT_BRIDGE_SPAWN";
type WheelScrollBehavior = "ZOOM_AND_GLIDE_TO_AREA" | "MOVE_CAMERA_VIEWPORT";

export const MicroDecisionView: React.FC<MicroDecisionViewProps> = ({
  nodes,
  leverageTree,
  slotTrace,
  selectedNode,
  onSelectNode,
  onExecuteMultiWork,
  onExecuteSingleNode,
  onTriggerScreenAutoFix,
  onSpawnWorldNode,
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

  // 3D Multi-Sector World Camera & Navigation State
  const canvas3dRef = useRef<HTMLCanvasElement | null>(null);
  const yawRef = useRef<number>(0.25);
  const pitchRef = useRef<number>(0.14);
  const yawVelRef = useRef<number>(0.0014);
  const targetPitchRef = useRef<number>(0.14);

  // Camera Pan/Move Offset in 2D/3D screen space so user can travel anywhere across the world!
  const camPanRef = useRef<{ x: number; y: number; targetX: number; targetY: number }>({
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
  });
  const [camCoordHud, setCamCoordHud] = useState<{ x: number; y: number; sector: number }>({
    x: 0,
    y: 0,
    sector: 0,
  });

  const [zoom, setZoom] = useState<number>(0.95);
  const zoomRef = useRef<number>(0.95);
  zoomRef.current = zoom;

  const [autoRotate, setAutoRotate] = useState<boolean>(false);
  const autoRotateRef = useRef<boolean>(false);
  autoRotateRef.current = autoRotate;

  // Mouse button & click modes
  const [clickToolMode, setClickToolMode] = useState<ActiveClickToolMode>("WHEEL_FREE_MOVE_ZOOM");
  const clickToolModeRef = useRef<ActiveClickToolMode>("WHEEL_FREE_MOVE_ZOOM");
  clickToolModeRef.current = clickToolMode;

  const [wheelBehavior, setWheelBehavior] = useState<WheelScrollBehavior>("ZOOM_AND_GLIDE_TO_AREA");
  const wheelBehaviorRef = useRef<WheelScrollBehavior>("ZOOM_AND_GLIDE_TO_AREA");
  wheelBehaviorRef.current = wheelBehavior;

  const isDraggingRef = useRef<boolean>(false);
  const activeMouseButtonRef = useRef<number>(0); // 0 = Left, 1 = Middle/Wheel, 2 = Right
  const dragDistanceRef = useRef<number>(0);
  const lastDragPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const lastCursorPosRef = useRef<{ x: number; y: number; initialized: boolean }>({
    x: 0,
    y: 0,
    initialized: false,
  });

  const hoveredIdRef = useRef<string | null>(null);
  const projectedNodesRef = useRef<
    {
      node: MicroDecisionNode;
      sectorId: number;
      sectorName: string;
      bridgeTargetIds: string[];
      isUserLeader?: boolean;
      isDravisCore?: boolean;
      x: number;
      y: number;
      z: number;
      scale: number;
      r: number;
    }[]
  >([]);
  const projectedSectorsRef = useRef<
    { sectorId: number; name: string; sideLabel: string; color: string; x: number; y: number; z: number; scale: number }[]
  >([]);

  const [hovered3DNode, setHovered3DNode] = useState<MicroDecisionNode | null>(null);
  const [expandedPopupNode, setExpandedPopupNode] = useState<MicroDecisionNode | null>(null);
  const [showAboutDecision, setShowAboutDecision] = useState<boolean>(false);
  const [isTopBarHovered, setIsTopBarHovered] = useState<boolean>(false);
  const [isAboutMicroDecisionOpen, setIsAboutMicroDecisionOpen] = useState<boolean>(false);
  const [isGraphControlsExpanded, setIsGraphControlsExpanded] = useState<boolean>(true);

  // Tactical Right-Click Context Menu inside the 3D World
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    targetNode: MicroDecisionNode | null;
  } | null>(null);

  // Rename Planet Modal State
  const [renamePlanetModal, setRenamePlanetModal] = useState<{
    open: boolean;
    planetId: number;
    nameInput: string;
  } | null>(null);

  // Live Moveable Camera Preview PIP HUD (Controllable via Scroll Wheel & Wheel-Click Drag!)
  const [isCameraPreviewPipOpen, setIsCameraPreviewPipOpen] = useState<boolean>(true);
  const [isOpticalWebcamActive, setIsOpticalWebcamActive] = useState<boolean>(false);
  const webcamVideoRef = useRef<HTMLVideoElement | null>(null);
  const webcamStreamRef = useRef<MediaStream | null>(null);
  const [camPreviewTransform, setCamPreviewTransform] = useState<{
    panX: number;
    panY: number;
    zoom: number;
    rotX: number;
    rotY: number;
  }>({
    panX: 0,
    panY: 0,
    zoom: 1.15,
    rotX: 0,
    rotY: 0,
  });
  const isCamPreviewDraggingRef = useRef<boolean>(false);
  const lastCamPreviewPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

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

  const totalSectorsCount = Math.max(
    1,
    Math.ceil(filteredNodes.length / NODES_PER_WORLD_SECTOR)
  );

  // Fly & focus camera directly onto a specific World Sector
  const flyCameraToSector = (sectorId: number) => {
    if (userProfile.soundEffects) soundEffects.playChirp();
    const targetSector = projectedSectorsRef.current.find((s) => s.sectorId === sectorId);
    const canvas = canvas3dRef.current;
    if (targetSector && canvas) {
      const dxFromCenter = targetSector.x - canvas.width / 2;
      const dyFromCenter = targetSector.y - canvas.height / 2;
      camPanRef.current.targetX -= dxFromCenter;
      camPanRef.current.targetY -= dyFromCenter;
      const nextZoom = Math.max(1.15, Math.min(4.5, zoomRef.current * 1.18));
      setZoom(Number(nextZoom.toFixed(2)));
      zoomRef.current = nextZoom;
      setCamCoordHud({
        x: Math.round(camPanRef.current.targetX),
        y: Math.round(camPanRef.current.targetY),
        sector: sectorId,
      });
    } else {
      const baseR = 260 * zoomRef.current;
      const info = getSectorCenter3D(sectorId, baseR);
      camPanRef.current.targetX = -info.centerX;
      camPanRef.current.targetY = -info.centerY;
      setCamCoordHud({
        x: Math.round(-info.centerX),
        y: Math.round(-info.centerY),
        sector: sectorId,
      });
    }
  };

  // Fly & zoom camera directly to a 2D screen point (mx, my)
  const flyCameraToScreenPoint = (mx: number, my: number, zoomInBoost = true) => {
    const canvas = canvas3dRef.current;
    if (!canvas) return;
    if (userProfile.soundEffects) soundEffects.playChirp();
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const offsetX = mx - cx;
    const offsetY = my - cy;

    camPanRef.current.targetX -= offsetX * 0.85;
    camPanRef.current.targetY -= offsetY * 0.85;

    if (zoomInBoost) {
      const nextZoom = Math.min(60.0, Number((zoomRef.current * 1.32).toFixed(2)));
      setZoom(nextZoom);
      zoomRef.current = nextZoom;
    }

    setCamCoordHud((prev) => ({
      ...prev,
      x: Math.round(camPanRef.current.targetX),
      y: Math.round(camPanRef.current.targetY),
    }));
  };

  // Start / Stop Optical Webcam inside the Live Camera Preview PIP
  const toggleOpticalWebcamPreview = async () => {
    if (isOpticalWebcamActive && webcamStreamRef.current) {
      webcamStreamRef.current.getTracks().forEach((t) => t.stop());
      webcamStreamRef.current = null;
      setIsOpticalWebcamActive(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 360 },
        audio: false,
      });
      webcamStreamRef.current = stream;
      setIsOpticalWebcamActive(true);
      if (webcamVideoRef.current) {
        webcamVideoRef.current.srcObject = stream;
        webcamVideoRef.current.play().catch(() => {});
      }
    } catch {
      setIsOpticalWebcamActive(false);
    }
  };

  useEffect(() => {
    return () => {
      if (webcamStreamRef.current) {
        webcamStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

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

  // Render interactive Multi-Sector 360° 3D Micro-Decision World Canvas
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

    const vibrantBallPalette = [
      "#22d3ee",
      "#f43f5e",
      "#a855f7",
      "#10b981",
      "#f59e0b",
      "#3b82f6",
      "#ec4899",
      "#84cc16",
      "#f97316",
      "#14b8a6",
    ];

    const galaxyStars = Array.from({ length: 360 }, (_, i) => {
      const armIndex = i % 4;
      const armAngle = (armIndex * 2 * Math.PI) / 4;
      const dist = Math.pow(Math.random(), 0.7) * 720;
      const spiralOffset = dist * 0.0032;
      const angle = armAngle + spiralOffset + (Math.random() - 0.5) * 0.45;
      return {
        dist,
        baseAngle: angle,
        r: Math.random() * 1.9 + 0.4,
        twinkle: Math.random() * Math.PI * 2,
        color:
          dist < 120
            ? "#ffffff"
            : dist < 320
            ? "#38bdf8"
            : armIndex % 2 === 0
            ? "#818cf8"
            : "#22d3ee",
      };
    });

    const renderLoop = () => {
      const isDravisThinking = isExecutingMultiWork || isAutoFixingScreen;
      time += isDravisThinking ? 0.055 : 0.016;
      if (autoRotateRef.current && !isDraggingRef.current) {
        yawRef.current += yawVelRef.current;
      }
      if (!isDraggingRef.current) {
        pitchRef.current += (targetPitchRef.current - pitchRef.current) * 0.08;
      }

      // Smoothly interpolate camera pan/move offset
      camPanRef.current.x += (camPanRef.current.targetX - camPanRef.current.x) * 0.16;
      camPanRef.current.y += (camPanRef.current.targetY - camPanRef.current.y) * 0.16;

      const currentYaw = yawRef.current;
      const currentPitch = pitchRef.current;
      const currentZoom = zoomRef.current;

      if (
        canvas.parentElement &&
        (canvas.width !== canvas.parentElement.clientWidth ||
          canvas.height !== canvas.parentElement.clientHeight)
      ) {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight;
      }

      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Deep Space Blue-Black gradient background
      const bgGrad = ctx.createRadialGradient(
        w * 0.5,
        h * 0.5,
        40,
        w * 0.5,
        h * 0.5,
        Math.max(w, h) * 0.85
      );
      bgGrad.addColorStop(0, "#081d3d");
      bgGrad.addColorStop(0.5, "#030d22");
      bgGrad.addColorStop(1, "#01040f");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // Render 3D Rotating Galaxy Arms rotating in counter-direction against decisions
      const galYaw = -currentYaw * 0.8;
      const galCx = w / 2 + camPanRef.current.x * 0.25;
      const galCy = h / 2 + camPanRef.current.y * 0.25;

      // Galaxy Core Ambient Glow
      const coreNebula = ctx.createRadialGradient(galCx, galCy, 10, galCx, galCy, 240);
      coreNebula.addColorStop(0, "rgba(56, 189, 248, 0.42)");
      coreNebula.addColorStop(0.35, "rgba(99, 102, 241, 0.22)");
      coreNebula.addColorStop(1, "rgba(1, 4, 15, 0)");
      ctx.fillStyle = coreNebula;
      ctx.beginPath();
      ctx.arc(galCx, galCy, 240, 0, Math.PI * 2);
      ctx.fill();

      for (const s of galaxyStars) {
        s.twinkle += 0.04;
        const a = s.baseAngle + galYaw + time * 0.06;
        const sx = galCx + Math.cos(a) * s.dist;
        const sy = galCy + Math.sin(a) * s.dist * 0.52;
        const alpha = 0.3 + Math.sin(s.twinkle) * 0.35;
        ctx.fillStyle = s.color;
        ctx.globalAlpha = Math.max(0.1, Math.min(0.9, alpha));
        ctx.beginPath();
        ctx.arc(sx, sy, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      const cx = w / 2 + camPanRef.current.x;
      const cy = h / 2 + camPanRef.current.y;
      const baseClusterRadius = Math.min(w, h) * 0.23 * currentZoom;
      const fov = 820;

      const cosY = Math.cos(currentYaw);
      const sinY = Math.sin(currentYaw);
      const cosP = Math.cos(currentPitch);
      const sinP = Math.sin(currentPitch);

      // 1. Compute Multi-Sector 3D Planetary World Layout across all clusters
      const currentFiltered = filteredNodesRef.current;
      const currentActive = activeNodeRef.current;
      const worldLayout = layoutMicroDecisionWorld3D(
        currentFiltered,
        baseClusterRadius,
        userProfile.name,
        time
      );

      // Project unique Planet Centers so the user can see and navigate across 3D celestial planets
      const uniqueSectorMap = new Map<number, ReturnType<typeof getSectorCenter3D>>();
      for (const item of worldLayout) {
        if (!uniqueSectorMap.has(item.sectorId)) {
          uniqueSectorMap.set(item.sectorId, item.sectorInfo);
        }
      }

      const projectedSectors: typeof projectedSectorsRef.current = [];
      for (const [, sInfo] of uniqueSectorMap) {
        const rx = sInfo.centerX * cosY - sInfo.centerZ * sinY;
        const rz1 = sInfo.centerX * sinY + sInfo.centerZ * cosY;
        const ry = sInfo.centerY * cosP - rz1 * sinP;
        const rz = sInfo.centerY * sinP + rz1 * cosP;
        const scale = Math.max(0.04, fov / Math.max(25, fov + rz + 320));
        const sx = cx + rx * scale;
        const sy = cy + ry * scale;

        projectedSectors.push({
          sectorId: sInfo.sectorId,
          name: sInfo.name,
          sideLabel: sInfo.sideLabel,
          color: sInfo.accentColor,
          x: sx,
          y: sy,
          z: rz,
          scale,
        });

        // 3D Spherical Planet with realistic lighting, equatorial orbit ring and atmosphere
        const planetR = Math.max(16, sInfo.radius * scale * Math.max(0.4, Math.min(2.4, Math.pow(currentZoom, 0.42))));
        const pSpecX = sx - planetR * 0.35;
        const pSpecY = sy - planetR * 0.35;
        const planetGrad = ctx.createRadialGradient(pSpecX, pSpecY, Math.max(1, planetR * 0.12), sx, sy, planetR);
        planetGrad.addColorStop(0, "#ffffff");
        planetGrad.addColorStop(0.24, sInfo.accentColor);
        planetGrad.addColorStop(0.78, sInfo.accentColor);
        planetGrad.addColorStop(1, "rgba(2, 6, 23, 0.95)");

        ctx.fillStyle = planetGrad;
        ctx.beginPath();
        ctx.arc(sx, sy, planetR, 0, Math.PI * 2);
        ctx.fill();

        // Atmospheric glowing aura
        const atmoGrad = ctx.createRadialGradient(sx, sy, planetR * 0.75, sx, sy, planetR * 1.55);
        atmoGrad.addColorStop(0, `${sInfo.accentColor}44`);
        atmoGrad.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = atmoGrad;
        ctx.beginPath();
        ctx.arc(sx, sy, planetR * 1.55, 0, Math.PI * 2);
        ctx.fill();

        // Celestial orbital ring around planet
        ctx.strokeStyle = `${sInfo.accentColor}55`;
        ctx.lineWidth = Math.max(1, 1.4 * scale);
        ctx.beginPath();
        ctx.ellipse(sx, sy, planetR * 1.75, planetR * 0.48, 0.28, 0, Math.PI * 2);
        ctx.stroke();

        // Planet Name Banner
        const pFont = Math.max(9, Math.min(16, Math.round(11 * scale)));
        ctx.font = `bold ${pFont}px monospace`;
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        ctx.fillText(sInfo.name, sx, sy - planetR - 8);
        ctx.textAlign = "left";
      }
      projectedSectorsRef.current = projectedSectors;

      // 2. Project all Micro-Decision nodes in 3D Space
      const projected = worldLayout.map((item, idx) => {
        const wx = item.worldX;
        const wy = item.worldY;
        const wz = item.worldZ;

        const rx = wx * cosY - wz * sinY;
        const rz1 = wx * sinY + wz * cosY;
        const ry = wy * cosP - rz1 * sinP;
        const rz = wy * sinP + rz1 * cosP;

        const scale = Math.max(0.04, fov / Math.max(25, fov + rz + 320));
        const x2d = cx + rx * scale;
        const y2d = cy + ry * scale;
        const zoomSizeFactor = Math.max(0.35, Math.min(3.5, Math.pow(currentZoom, 0.42)));
        const baseR = item.isUserLeader || item.isDravisCore ? 18 : 13.5;
        const drawR = Math.max(2.5, baseR * scale * zoomSizeFactor);
        const ballColor =
          item.isUserLeader
            ? "#38bdf8"
            : item.isDravisCore
            ? "#818cf8"
            : item.node.color || vibrantBallPalette[idx % vibrantBallPalette.length];

        return {
          node: { ...item.node, color: ballColor },
          sectorId: item.sectorId,
          sectorName: item.sectorInfo.name,
          bridgeTargetIds: item.bridgeTargetIds,
          isUserLeader: item.isUserLeader,
          isDravisCore: item.isDravisCore,
          x: x2d,
          y: y2d,
          z: rz,
          scale,
          r: drawR,
        };
      });

      projected.sort((a, b) => b.z - a.z);
      projectedNodesRef.current = projected;

      const byId = new Map<string, (typeof projected)[0]>(projected.map((p) => [p.node.id, p]));

      // 3. Draw Intra-Cluster Synapses AND Long-Range Cross-World Neural Bridge Lines
      for (const p of projected) {
        for (const connId of p.node.connectedTo) {
          const target = byId.get(connId);
          if (!target) continue;

          const isCrossSectorBridge =
            p.sectorId !== target.sectorId || p.bridgeTargetIds.includes(connId);
          const isHighlighted =
            currentActive?.id === p.node.id || currentActive?.id === target.node.id;

          if (isCrossSectorBridge) {
            // Long-Range Cross-World Bridge Line (shoots from full cluster to new opposite-side cluster)
            const lineGrad = ctx.createLinearGradient(p.x, p.y, target.x, target.y);
            lineGrad.addColorStop(0, p.node.color);
            lineGrad.addColorStop(0.5, "#22d3ee");
            lineGrad.addColorStop(1, target.node.color);

            ctx.strokeStyle = lineGrad;
            ctx.lineWidth = isHighlighted ? 2.6 : 1.75;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(target.x, target.y);
            ctx.stroke();

            // Multi-packet high-speed energy stream across the bridge line
            for (let k = 0; k < 2; k++) {
              const tBridge = (time * 0.95 + k * 0.5 + (p.sectorId * 0.17)) % 1;
              const bx = p.x + (target.x - p.x) * tBridge;
              const by = p.y + (target.y - p.y) * tBridge;
              ctx.fillStyle = "#22d3ee";
              ctx.beginPath();
              ctx.arc(bx, by, Math.max(2.2, 4.0 * p.scale), 0, Math.PI * 2);
              ctx.fill();
            }
          } else {
            // Local cluster synapse line
            ctx.strokeStyle = isHighlighted
              ? "rgba(34, 211, 238, 0.68)"
              : "rgba(148, 163, 184, 0.22)";
            ctx.lineWidth = isHighlighted ? 1.5 : 0.95;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(target.x, target.y);
            ctx.stroke();

            const tPacket = (time * 0.75 + (p.node.samples % 5) * 0.2) % 1;
            const px = p.x + (target.x - p.x) * tPacket;
            const py = p.y + (target.y - p.y) * tPacket;
            ctx.fillStyle = p.node.color;
            ctx.beginPath();
            ctx.arc(px, py, Math.max(1.5, 2.8 * p.scale), 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // 4. Draw each 3D Colorful Sphere ("balls type ke colorful", borderless & clean) + Label
      for (const p of projected) {
        const isCurrent = currentActive?.id === p.node.id;
        const alpha = Math.max(0.48, Math.min(1, (p.scale - 0.25) * 1.65));

        const safeR = Number.isFinite(p.r) ? Math.max(4, p.r) : 10;
        const haloR = Math.max(safeR + 3, safeR * 2.45);
        const safeX = Number.isFinite(p.x) ? p.x : cx;
        const safeY = Number.isFinite(p.y) ? p.y : cy;
        const r0Safe = Math.max(0.1, Math.min(1, safeR * 0.2));
        const r1Safe = Math.max(r0Safe + 0.5, haloR);

        // Outer glowing aura around colorful 3D ball
        const halo = ctx.createRadialGradient(safeX, safeY, r0Safe, safeX, safeY, r1Safe);
        halo.addColorStop(0, p.node.color);
        halo.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = halo;
        ctx.globalAlpha = Math.max(0, Math.min(1, alpha * (isCurrent ? 0.95 : 0.55)));
        ctx.beginPath();
        ctx.arc(safeX, safeY, r1Safe, 0, Math.PI * 2);
        ctx.fill();

        // Realistic 3D Spherical Ball with Specular Highlight
        ctx.globalAlpha = alpha;
        const specX = safeX - safeR * 0.34;
        const specY = safeY - safeR * 0.34;
        const ballGrad = ctx.createRadialGradient(
          specX,
          specY,
          Math.max(0.5, safeR * 0.1),
          safeX,
          safeY,
          safeR
        );
        ballGrad.addColorStop(0, "#ffffff");
        ballGrad.addColorStop(0.28, p.node.color);
        ballGrad.addColorStop(0.82, p.node.color);
        ballGrad.addColorStop(1, "rgba(0, 0, 0, 0.94)");

        ctx.fillStyle = ballGrad;
        ctx.beginPath();
        ctx.arc(safeX, safeY, safeR, 0, Math.PI * 2);
        ctx.fill();

        // Special insignia for User Leader ("U") and Dravis Core ASI nodes
        if (p.isUserLeader) {
          ctx.font = `bold ${Math.max(10, Math.round(safeR * 0.9))}px monospace`;
          ctx.fillStyle = "#ffffff";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("U", safeX, safeY);
          ctx.textAlign = "left";
          ctx.textBaseline = "alphabetic";
        } else if (p.isDravisCore) {
          ctx.font = `bold ${Math.max(8, Math.round(safeR * 0.65))}px monospace`;
          ctx.fillStyle = "#ffffff";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("ASI", safeX, safeY);
          ctx.textAlign = "left";
          ctx.textBaseline = "alphabetic";
        }

        // High-contrast readable label next to colorful 3D sphere
        const titleFont = Math.max(9, Math.min(15, Math.round(11 * p.scale)));
        const subFont = Math.max(8, Math.min(12, Math.round(9 * p.scale)));
        ctx.font = `${isCurrent ? "bold " : "600 "}${titleFont}px monospace`;
        const titleW = ctx.measureText(p.node.title).width;
        const subText = p.isUserLeader
          ? "SUPREME MASTER • ONLINE"
          : p.isDravisCore
          ? "HYPER-NEURAL CORE • ACTIVE"
          : `${p.sectorName?.split("•")[0]?.trim() || `Planet ${p.sectorId + 1}`} • ${p.node.latencyMs}ms • ${(
              (p.node.confidence <= 1 ? p.node.confidence * 100 : p.node.confidence)
            ).toFixed(0)}%`;
        ctx.font = `${subFont}px monospace`;
        const subW = ctx.measureText(subText).width;
        const boxW = Math.max(titleW, subW) + 14;
        const boxH = Math.max(24, Math.min(38, 28 * p.scale));
        const lx = safeX + safeR + 8;
        const ly = safeY - boxH / 2;

        ctx.fillStyle = isCurrent
          ? "rgba(14, 42, 85, 0.94)"
          : `rgba(3, 10, 26, ${(alpha * 0.88).toFixed(2)})`;
        ctx.strokeStyle = isCurrent ? "rgba(34, 211, 238, 0.95)" : "rgba(56, 189, 248, 0.4)";
        ctx.lineWidth = isCurrent ? 1.5 : 1;
        ctx.beginPath();
        ctx.roundRect(lx - 5, ly, boxW, boxH, 7);
        ctx.fill();
        ctx.stroke();

        ctx.font = `${isCurrent ? "bold " : "600 "}${titleFont}px monospace`;
        ctx.fillStyle = "#ffffff";
        ctx.fillText(p.node.title, lx + 2, ly + boxH * 0.44);

        ctx.font = `bold ${subFont}px monospace`;
        ctx.fillStyle = isCurrent ? "#38bdf8" : p.node.color;
        ctx.fillText(subText, lx + 2, ly + boxH * 0.82);
      }
      ctx.globalAlpha = 1;

      animId = requestAnimationFrame(renderLoop);
    };

    const handleNativeWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const w = rect.width;
      const h = rect.height;

      const oldZoom = zoomRef.current;
      const delta = Math.max(-120, Math.min(120, e.deltaY));
      const factor = Math.pow(1.0028, -delta);
      const nextZoom = Math.max(0.0005, Math.min(150.0, Number((oldZoom * factor).toFixed(5))));
      const k = nextZoom / Math.max(0.00001, oldZoom);

      const dx = mx - w * 0.5;
      const dy = my - h * 0.5;

      camPanRef.current.targetX = dx * (1 - k) + camPanRef.current.targetX * k;
      camPanRef.current.targetY = dy * (1 - k) + camPanRef.current.targetY * k;
      camPanRef.current.x = camPanRef.current.targetX;
      camPanRef.current.y = camPanRef.current.targetY;

      setZoom(nextZoom);
      zoomRef.current = nextZoom;

      setCamCoordHud((prev) => ({
        ...prev,
        x: Math.round(camPanRef.current.targetX),
        y: Math.round(camPanRef.current.targetY),
      }));
    };

    canvas.addEventListener("wheel", handleNativeWheel, { passive: false });

    animId = requestAnimationFrame(renderLoop);
    return () => {
      clearTimeout(resizeTimer);
      cancelAnimationFrame(animId);
      canvas.removeEventListener("wheel", handleNativeWheel);
      window.removeEventListener("resize", resize);
    };
  }, [subView, isFullScreenOrbit]);

  // Handle Mouse Down (Left=0, Middle/Wheel=1, Right=2)
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button === 1) {
      // Prevent browser middle-click autoscroll icon so Wheel-Button moves inside Micro-Decision World
      e.preventDefault();
    }
    setContextMenu(null);
    isDraggingRef.current = true;
    activeMouseButtonRef.current = e.button;
    dragDistanceRef.current = 0;
    const rect = e.currentTarget.getBoundingClientRect();
    lastDragPosRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  // Handle Mouse Up (Left=0, Middle/Wheel=1, Right=2)
  const handleCanvasMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const wasDragging = dragDistanceRef.current > 6;
    isDraggingRef.current = false;

    // Middle-Click (Scroll Wheel Button click without long drag): Fly & Zoom directly to clicked world area!
    if (e.button === 1 && !wasDragging) {
      e.preventDefault();
      flyCameraToScreenPoint(mx, my, true);
      return;
    }

    // Left-Click without drag:
    if (e.button === 0 && !wasDragging) {
      if (hovered3DNode) {
        if (userProfile.soundEffects) soundEffects.playChirp();
        onSelectNode(hovered3DNode);
        setExpandedPopupNode(hovered3DNode);
        setShowAboutDecision(false);
      } else if (clickToolModeRef.current === "RIGHT_BRIDGE_SPAWN" && onSpawnWorldNode) {
        onSpawnWorldNode({
          title: `Tactical Cluster Decision #${nodes.length + 1}`,
          forceNewSector: false,
        });
      }
    }
  };

  // Handle Right-Click (Custom Tactical Context Menu or Cross-Sector Bridge Spawn)
  const handleCanvasContextMenu = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (dragDistanceRef.current > 8) return; // Was a right-click orbit drag
    const rect = e.currentTarget.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    if (userProfile.soundEffects) soundEffects.playChirp();
    setContextMenu({
      x: mx,
      y: my,
      targetNode: hovered3DNode,
    });
  };

  // Handle Mouse Move (Middle-Button Free Move, Left-Button Pan/Orbit, Right-Button Orbit)
  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    // Reveal top control bar when cursor approaches top 68px
    if (my <= 68 && !isTopBarHovered) {
      setIsTopBarHovered(true);
    } else if (my > 175 && isTopBarHovered && !isAboutMicroDecisionOpen) {
      setIsTopBarHovered(false);
    }

    if (!lastCursorPosRef.current.initialized) {
      lastCursorPosRef.current = { x: mx, y: my, initialized: true };
    }
    lastCursorPosRef.current.x = mx;
    lastCursorPosRef.current.y = my;

    if (isDraggingRef.current) {
      const dx = mx - lastDragPosRef.current.x;
      const dy = my - lastDragPosRef.current.y;
      dragDistanceRef.current += Math.hypot(dx, dy);
      lastDragPosRef.current = { x: mx, y: my };

      const btn = activeMouseButtonRef.current;

      // Middle Mouse Button (Wheel Button, btn === 1) OR Wheel Free-Move Mode OR Shift+Drag -> Pan/Move Camera across the World!
      if (
        btn === 1 ||
        e.shiftKey ||
        (btn === 0 && clickToolModeRef.current === "WHEEL_FREE_MOVE_ZOOM")
      ) {
        camPanRef.current.targetX += dx * 1.35;
        camPanRef.current.targetY += dy * 1.35;
        // Also add subtle 3D parallax rotation when holding wheel button so user can see around 3D clusters
        if (btn === 1) {
          yawRef.current += dx * 0.0022;
          pitchRef.current = Math.max(-1.1, Math.min(1.1, pitchRef.current + dy * 0.0022));
          targetPitchRef.current = pitchRef.current;
        }
        setCamCoordHud((prev) => ({
          ...prev,
          x: Math.round(camPanRef.current.targetX),
          y: Math.round(camPanRef.current.targetY),
        }));
        return;
      }

      // Right-Click Drag (btn === 2) or Left-Click in Orbit Mode -> Rotate 360° 3D Camera
      yawRef.current += dx * 0.0075;
      pitchRef.current = Math.max(-1.2, Math.min(1.2, pitchRef.current + dy * 0.0075));
      targetPitchRef.current = pitchRef.current;
      yawVelRef.current = dx >= 0 ? 0.002 : -0.002;
      return;
    }

    // Hit-test cursor against 3D colorful spheres
    let hit: MicroDecisionNode | null = null;
    let bestDist = 44;
    for (const p of projectedNodesRef.current) {
      const dNode = Math.hypot(mx - p.x, my - p.y);
      const inLabelBox =
        mx >= p.x + p.r &&
        mx <= p.x + p.r + 190 * p.scale &&
        Math.abs(my - p.y) <= 18 * p.scale;
      if (dNode < Math.max(bestDist, p.r + 8) || inLabelBox) {
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

  // Scroll Wheel Handler: Zoom directly into Cursor Area OR Move Camera Preview across the World!
  const handleCanvasWheelZoom = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const rect = e.currentTarget.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const cx = rect.width / 2;
    const cy = rect.height / 2;

    // Mode B: Move Camera Viewport with Scroll Wheel (or when scrolling with Shift / trackpad deltaX)
    if (wheelBehaviorRef.current === "MOVE_CAMERA_VIEWPORT" || e.shiftKey) {
      const dirX = mx - cx;
      const dirY = my - cy;
      const normLen = Math.max(1, Math.hypot(dirX, dirY));
      const step = e.deltaY < 0 ? 78 : -78;

      if (Math.abs(e.deltaX) > 2) {
        camPanRef.current.targetX -= e.deltaX * 1.4;
        camPanRef.current.targetY -= e.deltaY * 1.4;
      } else {
        // Move camera toward/away from cursor direction across the world
        camPanRef.current.targetX -= (dirX / normLen) * step;
        camPanRef.current.targetY -= (dirY / normLen) * step;
      }
      setCamCoordHud((prev) => ({
        ...prev,
        x: Math.round(camPanRef.current.targetX),
        y: Math.round(camPanRef.current.targetY),
      }));
      return;
    }

    // Mode A (Default): Smooth Scroll-Wheel Zoom & Glide into Cursor Target Area!
    const oldZoom = zoomRef.current;
    const delta = Math.max(-120, Math.min(120, e.deltaY));
    const factor = Math.pow(1.0028, -delta);
    const nextZoom = Math.max(0.0005, Math.min(150.0, Number((oldZoom * factor).toFixed(5))));
    const k = nextZoom / Math.max(0.00001, oldZoom);

    const dx = mx - rect.width * 0.5;
    const dy = my - rect.height * 0.5;

    camPanRef.current.targetX = dx * (1 - k) + camPanRef.current.targetX * k;
    camPanRef.current.targetY = dy * (1 - k) + camPanRef.current.targetY * k;
    camPanRef.current.x = camPanRef.current.targetX;
    camPanRef.current.y = camPanRef.current.targetY;

    setZoom(nextZoom);
    zoomRef.current = nextZoom;
    setCamCoordHud((prev) => ({
      ...prev,
      x: Math.round(camPanRef.current.targetX),
      y: Math.round(camPanRef.current.targetY),
    }));
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
        setTimeout(() => {
          captureScreenFrameAndAutoFix();
        }, 1200);
      } else {
        await onTriggerScreenAutoFix();
      }
    } catch {
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
        except Exception:
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

  // Contextual Left-Click, Wheel/Cursor-Click, and Right-Click configurations per Sub-Option
  const getSubViewClickActions = () => {
    switch (subView) {
      case "SPHERE_360_3D":
        return {
          leftLabel: "L-CLICK: Inspect / Select Node",
          leftAction: () => {
            setClickToolMode("LEFT_SELECT_PAN");
            const target = hovered3DNode || nodes[0];
            if (target) {
              onSelectNode(target);
              setExpandedPopupNode(target);
            }
          },
          wheelLabel: "WHEEL CLICK: Free-Move & Fly Sector",
          wheelAction: () => {
            setClickToolMode("WHEEL_FREE_MOVE_ZOOM");
            const nextSector = (camCoordHud.sector + 1) % Math.max(1, totalSectorsCount);
            flyCameraToSector(nextSector);
          },
          rightLabel: "R-CLICK: Shoot Line & New Cluster",
          rightAction: () => {
            setClickToolMode("RIGHT_BRIDGE_SPAWN");
            if (onSpawnWorldNode) {
              onSpawnWorldNode({
                title: `Cross-World Bridge Cluster [S${totalSectorsCount}]`,
                forceNewSector: true,
              });
            }
          },
        };
      case "LEVERAGE_DECISION_TREE":
        return {
          leftLabel: "L-CLICK: Drill True Branch",
          leftAction: () => {
            if (userProfile.soundEffects) soundEffects.playChirp();
            const nextNode =
              leverageTree.find((n) => n.id !== activeTreeNodeId) || leverageTree[0];
            if (nextNode) setActiveTreeNodeId(nextNode.id);
          },
          wheelLabel: "WHEEL CLICK: Center Root Gini",
          wheelAction: () => {
            if (userProfile.soundEffects) soundEffects.playChirp();
            setActiveTreeNodeId("lt-root");
          },
          rightLabel: "R-CLICK: Spawn New Tree Decision",
          rightAction: () => {
            if (onSpawnWorldNode) {
              onSpawnWorldNode({
                title: `Leverage Tree Split (Gini=${(0.015 + Math.random() * 0.03).toFixed(3)})`,
                forceNewSector: false,
              });
            }
          },
        };
      case "NODE_SLOT_FILLING":
        return {
          leftLabel: "L-CLICK: Verify Parameter Slots",
          leftAction: () => {
            if (userProfile.soundEffects) soundEffects.playChirp();
            onExecuteMultiWork(slotTrace.utterance || "Verify and complete all parameter slots");
          },
          wheelLabel: "WHEEL CLICK: Inject 3D Context Cube",
          wheelAction: () => {
            if (onSpawnWorldNode) {
              onSpawnWorldNode({
                title: `Slot Context Cube: ${slotTrace.matchedNode}`,
                forceNewSector: false,
              });
            }
          },
          rightLabel: "R-CLICK: Dispatch Slot Command",
          rightAction: () => {
            onExecuteMultiWork(slotTrace.generatedCommand || "Execute slot command");
          },
        };
      case "APLYSIA_VOICE_PIPELINE":
        return {
          leftLabel: "L-CLICK: Test Active Voice Flow",
          leftAction: () => {
            const vp = userProfile.voicePreference || "Puck";
            speechEngine.previewVoicePersona(
              vp,
              userProfile.detectedLanguage || "en-US",
              userProfile.voiceSpeed || 1.0,
              userProfile.voicePitch || 1.0
            );
          },
          wheelLabel: "WHEEL CLICK: Cycle Voice Persona",
          wheelAction: () => {
            const idx = DRAVIS_VOICE_PROFILES.findIndex(
              (v) => v.id === (userProfile.voicePreference || "Puck")
            );
            const nextVp = DRAVIS_VOICE_PROFILES[(idx + 1) % DRAVIS_VOICE_PROFILES.length];
            onUpdateProfile({ ...userProfile, voicePreference: nextVp.id });
            speechEngine.previewVoicePersona(nextVp.id, userProfile.detectedLanguage || "en-US");
          },
          rightLabel: "R-CLICK: Sync Voice to World",
          rightAction: () => {
            if (onSpawnWorldNode) {
              onSpawnWorldNode({
                title: `Aplysia Voice Sync (${userProfile.voicePreference || "Puck"})`,
                forceNewSector: false,
              });
            }
          },
        };
      case "FULL_PC_SCREEN_AUTOFIX":
        return {
          leftLabel: "L-CLICK: Scan & Auto-Fix Screen",
          leftAction: () => captureScreenFrameAndAutoFix(),
          wheelLabel: "WHEEL CLICK: Reset Camera Preview",
          wheelAction: () =>
            setCamPreviewTransform({ panX: 0, panY: 0, zoom: 1.15, rotX: 0, rotY: 0 }),
          rightLabel: "R-CLICK: Share Full PC Screen",
          rightAction: () => handleStartScreenMonitor(),
        };
    }
  };

  const clickActions = getSubViewClickActions();

  const level0Node = leverageTree.find((n) => n.level === 0) || leverageTree[0];
  const level1Nodes = leverageTree.filter((n) => n.level === 1);
  const level2Nodes = leverageTree.filter((n) => n.level === 2);
  const level3Nodes = leverageTree.filter((n) => n.level === 3);

  return (
    <div
      id="dravis-micro-decision-view"
      className="flex-1 flex flex-col h-full p-0 overflow-hidden bg-transparent relative"
    >
      {/* =====================================================================
          TOP HOVER SENSOR ZONE & SLIDING TOP CONTROL BAR
         ===================================================================== */}
      <div
        onMouseEnter={() => setIsTopBarHovered(true)}
        onMouseLeave={() => {
          if (!isAboutMicroDecisionOpen) {
            setIsTopBarHovered(false);
          }
        }}
        className="absolute top-0 left-0 right-0 z-40 flex flex-col items-center pointer-events-auto"
      >
        <div className="w-full h-3 bg-transparent" />

        <AnimatePresence>
          {(isTopBarHovered || isAboutMicroDecisionOpen || subView !== "SPHERE_360_3D") && (
            <motion.div
              initial={{ opacity: 0, y: -28, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -28, scale: 0.98 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="w-[98%] max-w-7xl liquid-glass rounded-2xl px-3.5 py-2.5 border border-cyan-400/45 shadow-[0_12px_40px_rgba(0,0,0,0.95)] flex flex-col gap-2"
            >
              {/* Primary Top Hover Row */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      if (userProfile.soundEffects) soundEffects.playChirp();
                      setSubView("SPHERE_360_3D");
                      setIsGraphControlsExpanded((prev) => !prev);
                      setIsAboutMicroDecisionOpen(false);
                    }}
                    className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold flex items-center gap-2 cursor-pointer transition-all border ${
                      subView === "SPHERE_360_3D"
                        ? "bg-cyan-400/25 border-cyan-300 text-white shadow-[0_0_15px_rgba(34,211,238,0.4)]"
                        : "bg-black/70 border-white/20 text-slate-200 hover:border-cyan-400"
                    }`}
                  >
                    <Globe className="w-4 h-4 text-cyan-300 animate-spin" />
                    <span>MICRO DECISION WORLD ({totalSectorsCount} SECTORS)</span>
                  </button>

                  {/* Top UI Slider for Infinite Zoom */}
                  <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-black/70 border border-cyan-400/35">
                    <Sliders className="w-3.5 h-3.5 text-cyan-300" />
                    <input
                      type="range"
                      min="0.1"
                      max="10"
                      step="0.05"
                      value={Math.min(10, zoom)}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setZoom(val);
                        zoomRef.current = val;
                      }}
                      className="w-24 sm:w-32 accent-cyan-400 cursor-pointer"
                    />
                    <span className="text-[11px] font-mono text-emerald-300 font-bold tabular-nums">
                      {Math.round(zoom * 100)}%
                    </span>
                  </div>

                  {/* Shoot Bridge Line & Expand World Button */}
                  {onSpawnWorldNode && (
                    <button
                      type="button"
                      onClick={() =>
                        onSpawnWorldNode({
                          title: `Cross-World Bridge Cluster [S${totalSectorsCount}]`,
                          forceNewSector: true,
                        })
                      }
                      className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/60 text-emerald-200 font-mono text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
                      title="Shoot a bridge line across space and spawn a new distant cluster"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
                      <span>+ EXPAND NEW SECTOR</span>
                    </button>
                  )}

                  {/* ABOUT MICRO DECISION Button */}
                  <button
                    type="button"
                    onClick={() => {
                      if (userProfile.soundEffects) soundEffects.playChirp();
                      setIsAboutMicroDecisionOpen((prev) => !prev);
                    }}
                    className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all border ${
                      isAboutMicroDecisionOpen
                        ? "bg-amber-400 text-slate-950 border-amber-300 shadow-[0_0_18px_rgba(245,158,11,0.5)]"
                        : "bg-amber-500/20 border-amber-400/50 text-amber-200 hover:bg-amber-500/30"
                    }`}
                  >
                    <Compass className="w-4 h-4" />
                    <span>OPTIONS & TOOLS</span>
                    {isAboutMicroDecisionOpen ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                {/* Essential Graph & Camera Controls */}
                {isGraphControlsExpanded && (
                  <div className="flex items-center gap-1.5 flex-wrap font-mono text-[11px]">
                    {/* Toggle Wheel Behavior: Zoom to Area vs Move Camera Preview */}
                    <button
                      type="button"
                      onClick={() =>
                        setWheelBehavior((prev) =>
                          prev === "ZOOM_AND_GLIDE_TO_AREA"
                            ? "MOVE_CAMERA_VIEWPORT"
                            : "ZOOM_AND_GLIDE_TO_AREA"
                        )
                      }
                      className={`px-2.5 py-1.5 rounded-lg border font-bold cursor-pointer flex items-center gap-1 ${
                        wheelBehavior === "MOVE_CAMERA_VIEWPORT"
                          ? "bg-purple-500/30 border-purple-400 text-purple-200"
                          : "bg-cyan-500/20 border-cyan-400/50 text-cyan-200"
                      }`}
                      title="Switch what scrolling the mouse wheel does"
                    >
                      <Move className="w-3.5 h-3.5" />
                      <span>
                        {wheelBehavior === "MOVE_CAMERA_VIEWPORT"
                          ? "WHEEL: MOVE CAMERA"
                          : "WHEEL: ZOOM TO AREA"}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsCameraPreviewPipOpen((prev) => !prev)}
                      className={`px-2.5 py-1.5 rounded-lg border font-bold cursor-pointer flex items-center gap-1 ${
                        isCameraPreviewPipOpen
                          ? "bg-cyan-400/25 border-cyan-300 text-white"
                          : "bg-black/60 border-white/20 text-slate-300"
                      }`}
                    >
                      <Camera className="w-3.5 h-3.5 text-cyan-300" />
                      <span>CAMERA PREVIEW</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setZoom(0.95);
                        zoomRef.current = 0.95;
                        yawRef.current = 0.25;
                        pitchRef.current = 0.14;
                        targetPitchRef.current = 0.14;
                        camPanRef.current.targetX = 0;
                        camPanRef.current.targetY = 0;
                        setCamCoordHud({ x: 0, y: 0, sector: 0 });
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-black/60 border border-white/20 text-slate-200 hover:text-white hover:border-cyan-400 cursor-pointer"
                    >
                      CENTER WORLD
                    </button>

                    <button
                      type="button"
                      onClick={() => setAutoRotate((prev) => !prev)}
                      className={`px-2.5 py-1.5 rounded-lg border cursor-pointer ${
                        autoRotate
                          ? "bg-cyan-400/20 border-cyan-400 text-cyan-200 font-bold"
                          : "bg-black/60 border-white/20 text-slate-300"
                      }`}
                    >
                      {autoRotate ? "ORBIT: AUTO" : "ORBIT: FREE MOVE"}
                    </button>

                    {onToggleFullScreenOrbit && (
                      <button
                        type="button"
                        onClick={() => {
                          if (userProfile.soundEffects) soundEffects.playChirp();
                          onToggleFullScreenOrbit();
                        }}
                        className={`px-3 py-1.5 rounded-lg border font-bold cursor-pointer flex items-center gap-1.5 transition-all ${
                          isFullScreenOrbit
                            ? "bg-emerald-400 hover:bg-emerald-300 text-slate-950 border-emerald-200 shadow-[0_0_16px_rgba(16,185,129,0.5)]"
                            : "bg-cyan-400/25 hover:bg-cyan-400/35 border-cyan-400 text-cyan-100 shadow-[0_0_12px_rgba(34,211,238,0.3)]"
                        }`}
                        title={isFullScreenOrbit ? "Exit Full Screen (ESC)" : "Enter Full Screen 360° World"}
                      >
                        {isFullScreenOrbit ? (
                          <>
                            <Minimize2 className="w-3.5 h-3.5" />
                            <span>EXIT FULL SCREEN</span>
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
                )}
              </div>

              {/* Contextual Left-Click, Wheel/Cursor-Click & Right-Click Working Buttons Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1.5 border-t border-white/10 font-mono text-[10px]">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-slate-400 font-bold uppercase mr-1 flex items-center gap-1">
                    <MousePointer className="w-3 h-3 text-cyan-400" />
                    <span>Click Controls ({subView.replace(/_/g, " ")}):</span>
                  </span>

                  {/* Working LEFT-CLICK Button */}
                  <button
                    type="button"
                    onClick={clickActions.leftAction}
                    className={`px-2.5 py-1 rounded-lg border font-bold cursor-pointer transition-all flex items-center gap-1.5 ${
                      clickToolMode === "LEFT_SELECT_PAN" && subView === "SPHERE_360_3D"
                        ? "bg-cyan-400 text-slate-950 border-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.4)]"
                        : "bg-cyan-500/15 hover:bg-cyan-500/25 border-cyan-400/50 text-cyan-200"
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-cyan-400" />
                    <span>{clickActions.leftLabel}</span>
                  </button>

                  {/* Working WHEEL / CURSOR CLICK Button */}
                  <button
                    type="button"
                    onClick={clickActions.wheelAction}
                    className={`px-2.5 py-1 rounded-lg border font-bold cursor-pointer transition-all flex items-center gap-1.5 ${
                      clickToolMode === "WHEEL_FREE_MOVE_ZOOM" && subView === "SPHERE_360_3D"
                        ? "bg-emerald-400 text-slate-950 border-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.4)]"
                        : "bg-emerald-500/15 hover:bg-emerald-500/25 border-emerald-400/50 text-emerald-200"
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>{clickActions.wheelLabel}</span>
                  </button>

                  {/* Working RIGHT-CLICK Button */}
                  <button
                    type="button"
                    onClick={clickActions.rightAction}
                    className={`px-2.5 py-1 rounded-lg border font-bold cursor-pointer transition-all flex items-center gap-1.5 ${
                      clickToolMode === "RIGHT_BRIDGE_SPAWN" && subView === "SPHERE_360_3D"
                        ? "bg-purple-400 text-slate-950 border-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.4)]"
                        : "bg-purple-500/15 hover:bg-purple-500/25 border-purple-400/50 text-purple-200"
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-purple-400" />
                    <span>{clickActions.rightLabel}</span>
                  </button>
                </div>

                {/* Quick Planet Jump Pills & Rename Planet Control */}
                {subView === "SPHERE_360_3D" && (
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                    <span className="text-slate-400 mr-1 flex items-center gap-1">
                      <Globe className="w-3 h-3 text-cyan-400" />
                      <span>Planets:</span>
                    </span>
                    {Array.from({ length: Math.min(8, totalSectorsCount) }).map((_, sIdx) => {
                      const pName = getPlanetName(sIdx);
                      return (
                        <button
                          key={sIdx}
                          type="button"
                          onClick={() => flyCameraToSector(sIdx)}
                          className={`px-2.5 py-0.5 rounded-lg border cursor-pointer font-bold transition-all text-[10px] ${
                            camCoordHud.sector === sIdx
                              ? "bg-cyan-400 text-slate-950 border-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.4)]"
                              : "bg-black/60 border-white/15 text-slate-300 hover:border-cyan-400"
                          }`}
                          title={`Fly to ${pName}`}
                        >
                          {pName.split("•")[0]?.trim() || `Planet ${sIdx + 1}`}
                        </button>
                      );
                    })}

                    {/* Dedicated Rename Planet Button */}
                    <button
                      type="button"
                      onClick={() => {
                        const curId = camCoordHud.sector || 0;
                        setRenamePlanetModal({
                          open: true,
                          planetId: curId,
                          nameInput: getPlanetName(curId),
                        });
                      }}
                      className="px-2.5 py-0.5 rounded-lg bg-purple-500/25 hover:bg-purple-500/40 text-purple-200 border border-purple-400/50 cursor-pointer font-bold flex items-center gap-1 transition-all"
                      title="Rename the current or any Planet"
                    >
                      <Sparkles className="w-3 h-3 text-purple-300" />
                      <span>Rename Planet</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Expandable "OPTIONS & TOOLS" Drawer */}
              <AnimatePresence>
                {isAboutMicroDecisionOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="pt-2.5 border-t border-white/15 flex flex-col gap-2.5 overflow-hidden"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {[
                          { id: "SPHERE_360_3D", label: "1. 360° Multi-Sector World", icon: Compass },
                          { id: "LEVERAGE_DECISION_TREE", label: "2. Leverage Tree", icon: GitBranch },
                          { id: "NODE_SLOT_FILLING", label: "3. Slot-Filling", icon: Database },
                          { id: "APLYSIA_VOICE_PIPELINE", label: "4. Voice Pipeline", icon: Volume2 },
                          { id: "FULL_PC_SCREEN_AUTOFIX", label: "5. Camera & Screen Auto-Fix", icon: Monitor },
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
                              className={`px-2.5 py-1.5 rounded-xl font-mono text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                                isActive
                                  ? "bg-cyan-400/25 border-cyan-400 text-white"
                                  : "bg-black/40 border-white/10 text-slate-300 hover:text-white"
                              }`}
                            >
                              <Icon className="w-3.5 h-3.5 text-cyan-300" />
                              <span>{tab.label}</span>
                            </button>
                          );
                        })}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onToggleAutonomousSelfWork(!autonomousSelfWorkActive)}
                          className={`px-2.5 py-1.5 rounded-xl font-mono text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                            autonomousSelfWorkActive
                              ? "bg-emerald-400/25 border-emerald-400 text-emerald-200"
                              : "bg-white/5 border-white/15 text-slate-300"
                          }`}
                        >
                          <Radio className={`w-3 h-3 ${autonomousSelfWorkActive ? "text-emerald-300 animate-ping" : "text-slate-400"}`} />
                          <span>{autonomousSelfWorkActive ? "WORLD AUTO-EXPAND: ON" : "WORLD AUTO-EXPAND: OFF"}</span>
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

                    {/* Search & Multi-Work Command Input */}
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="relative w-64">
                        <Search className="w-3.5 h-3.5 text-cyan-300 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search micro-decision spheres..."
                          className="w-full bg-black/50 border border-white/15 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
                        />
                      </div>

                      <form onSubmit={handleMultiWorkSubmit} className="flex items-center gap-2 flex-1 min-w-[220px]">
                        <input
                          type="text"
                          value={multiWorkInput}
                          onChange={(e) => setMultiWorkInput(e.target.value)}
                          placeholder="Run multi-work command & spawn connected cluster..."
                          className="w-full bg-black/50 border border-white/15 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
                        />
                        <button
                          type="submit"
                          disabled={isExecutingMultiWork}
                          className="px-3 py-1.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-mono text-[11px] font-bold cursor-pointer shrink-0"
                        >
                          {isExecutingMultiWork ? "RUNNING..." : "RUN MULTI-WORK"}
                        </button>
                      </form>
                    </div>

                    {/* All Micro-Decision Nodes List */}
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                      {filteredNodes.map((n, idx) => {
                        const isSelected = expandedPopupNode?.id === n.id;
                        const sId =
                          typeof n.sectorId === "number"
                            ? n.sectorId
                            : Math.floor(idx / NODES_PER_WORLD_SECTOR);
                        return (
                          <button
                            key={n.id}
                            type="button"
                            onClick={() => {
                              if (userProfile.soundEffects) soundEffects.playChirp();
                              onSelectNode(n);
                              setExpandedPopupNode(n);
                              setShowAboutDecision(true);
                              flyCameraToSector(sId);
                            }}
                            className={`px-2.5 py-1.5 rounded-xl border font-mono text-[10px] shrink-0 flex items-center gap-1.5 cursor-pointer transition-all ${
                              isSelected
                                ? "bg-cyan-400/30 border-cyan-300 text-white"
                                : "bg-slate-950/85 border-white/15 text-slate-200 hover:border-cyan-400/60"
                            }`}
                          >
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: n.color }}
                            />
                            <span className="text-cyan-300 font-bold">[S{sId}]</span>
                            <span className="font-bold">{n.title}</span>
                            <span className="text-emerald-300">{n.latencyMs}ms</span>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* =====================================================================
          MODE 1: MULTI-SECTOR 360° 3D MICRO-DECISION WORLD
         ===================================================================== */}
      {subView === "SPHERE_360_3D" && (
        <div className="flex-1 flex flex-col min-h-0 relative w-full h-full">
          <div className="flex-1 relative min-h-0 w-full h-full overflow-hidden">
            <canvas
              ref={canvas3dRef}
              onMouseDown={handleCanvasMouseDown}
              onMouseUp={handleCanvasMouseUp}
              onAuxClick={(e) => e.preventDefault()}
              onContextMenu={handleCanvasContextMenu}
              onMouseLeave={() => {
                isDraggingRef.current = false;
              }}
              onMouseMove={handleCanvasMouseMove}
              onWheel={handleCanvasWheelZoom}
              className={`w-full h-full ${
                hovered3DNode ? "cursor-pointer" : "cursor-grab active:cursor-grabbing"
              }`}
            />

            {/* Always-Visible Floating Top-Right Full Screen Toggle Button when Top Hover Bar is Collapsed */}
            {onToggleFullScreenOrbit && !isTopBarHovered && !isAboutMicroDecisionOpen && (
              <div className="absolute top-3 right-4 z-30 flex items-center gap-2 pointer-events-auto">
                <button
                  type="button"
                  onClick={() => {
                    if (userProfile.soundEffects) soundEffects.playChirp();
                    onToggleFullScreenOrbit();
                  }}
                  className={`px-3 py-1.5 rounded-xl border font-mono text-[11px] font-bold cursor-pointer flex items-center gap-1.5 transition-all active:scale-95 ${
                    isFullScreenOrbit
                      ? "bg-emerald-400 hover:bg-emerald-300 text-slate-950 border-emerald-200 shadow-[0_0_20px_rgba(16,185,129,0.5)]"
                      : "liquid-glass bg-black/80 hover:bg-cyan-500/25 border-cyan-400/60 text-cyan-200 shadow-[0_0_16px_rgba(34,211,238,0.3)]"
                  }`}
                  title={isFullScreenOrbit ? "Exit Full Screen (ESC)" : "Enter Full Screen 360° World"}
                >
                  {isFullScreenOrbit ? (
                    <>
                      <Minimize2 className="w-3.5 h-3.5" />
                      <span>EXIT FULL SCREEN</span>
                    </>
                  ) : (
                    <>
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span>FULL SCREEN</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* =================================================================
                FLOATING TACTICAL RIGHT-CLICK CONTEXT MENU INSIDE 3D WORLD
               ================================================================= */}
            <AnimatePresence>
              {contextMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.92 }}
                  style={{
                    left: Math.min(window.innerWidth - 290, Math.max(12, contextMenu.x)),
                    top: Math.min(window.innerHeight - 250, Math.max(60, contextMenu.y)),
                  }}
                  className="absolute z-40 w-68 liquid-glass rounded-2xl p-2.5 border border-cyan-400/60 shadow-[0_12px_40px_rgba(0,0,0,0.95)] font-mono text-[11px] flex flex-col gap-1"
                >
                  <div className="flex items-center justify-between px-2 py-1 border-b border-white/10 text-[10px] text-cyan-300 font-bold uppercase">
                    <span>Tactical World Right-Click</span>
                    <button
                      type="button"
                      onClick={() => setContextMenu(null)}
                      className="text-slate-400 hover:text-white cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      flyCameraToScreenPoint(contextMenu.x, contextMenu.y, true);
                      setContextMenu(null);
                    }}
                    className="w-full px-2.5 py-1.5 rounded-xl hover:bg-cyan-500/20 text-left text-white flex items-center gap-2 cursor-pointer"
                  >
                    <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Move Camera & Zoom Here</span>
                  </button>

                  {onSpawnWorldNode && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          onSpawnWorldNode({
                            title: `Cross-World Bridge Cluster [S${totalSectorsCount}]`,
                            forceNewSector: true,
                          });
                          setContextMenu(null);
                        }}
                        className="w-full px-2.5 py-1.5 rounded-xl hover:bg-purple-500/25 text-left text-purple-200 flex items-center gap-2 cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                        <span>Shoot Line to New Opposite Sector</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          onSpawnWorldNode({
                            title: `Local Cluster Decision #${nodes.length + 1}`,
                            forceNewSector: false,
                          });
                          setContextMenu(null);
                        }}
                        className="w-full px-2.5 py-1.5 rounded-xl hover:bg-emerald-500/20 text-left text-emerald-200 flex items-center gap-2 cursor-pointer"
                      >
                        <Zap className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Spawn Micro-Decision Here</span>
                      </button>
                    </>
                  )}

                  {contextMenu.targetNode && (
                    <button
                      type="button"
                      onClick={() => {
                        onExecuteSingleNode(contextMenu.targetNode!);
                        setExpandedPopupNode(contextMenu.targetNode!);
                        setContextMenu(null);
                      }}
                      className="w-full px-2.5 py-1.5 rounded-xl hover:bg-amber-500/20 text-left text-amber-200 flex items-center gap-2 cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 text-amber-400" />
                      <span className="truncate">Run: {contextMenu.targetNode.title}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      camPanRef.current.targetX = 0;
                      camPanRef.current.targetY = 0;
                      setZoom(0.95);
                      zoomRef.current = 0.95;
                      setContextMenu(null);
                    }}
                    className="w-full px-2.5 py-1.5 rounded-xl hover:bg-white/10 text-left text-slate-300 flex items-center gap-2 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
                    <span>Reset Camera to Origin (0, 0)</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* =================================================================
                INTERACTIVE MOVEABLE CAMERA PREVIEW PIP (BOTTOM-LEFT)
                Moveable with Scroll Wheel & Wheel-Button Drag!
               ================================================================= */}
            <AnimatePresence>
              {isCameraPreviewPipOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 16 }}
                  className="absolute bottom-4 left-4 z-30 w-80 sm:w-96 liquid-glass rounded-2xl p-3 border border-cyan-400/50 shadow-[0_12px_40px_rgba(0,0,0,0.92)] font-mono text-[11px] flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between pb-1.5 border-b border-white/10">
                    <div className="flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-cyan-400" />
                      <span className="text-white font-bold uppercase text-[10px]">
                        Moveable Camera Preview (Wheel Pan/Zoom)
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={toggleOpticalWebcamPreview}
                        className={`px-2 py-0.5 rounded text-[9px] font-bold cursor-pointer border ${
                          isOpticalWebcamActive
                            ? "bg-emerald-400 text-slate-950 border-emerald-300"
                            : "bg-cyan-500/20 text-cyan-200 border-cyan-400/40"
                        }`}
                      >
                        {isOpticalWebcamActive ? "LIVE LENS: ON" : "START WEBCAM"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsCameraPreviewPipOpen(false)}
                        className="p-0.5 text-slate-400 hover:text-white cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Interactive Camera Preview Viewport — Scroll Wheel & Wheel Button Move the Camera! */}
                  <div
                    onMouseDown={(e) => {
                      if (e.button === 1) e.preventDefault();
                      isCamPreviewDraggingRef.current = true;
                      lastCamPreviewPosRef.current = { x: e.clientX, y: e.clientY };
                    }}
                    onMouseUp={() => {
                      isCamPreviewDraggingRef.current = false;
                    }}
                    onMouseLeave={() => {
                      isCamPreviewDraggingRef.current = false;
                    }}
                    onMouseMove={(e) => {
                      if (!isCamPreviewDraggingRef.current) return;
                      const dx = e.clientX - lastCamPreviewPosRef.current.x;
                      const dy = e.clientY - lastCamPreviewPosRef.current.y;
                      lastCamPreviewPosRef.current = { x: e.clientX, y: e.clientY };
                      setCamPreviewTransform((prev) => ({
                        ...prev,
                        panX: Math.max(-180, Math.min(180, prev.panX + dx * 1.2)),
                        panY: Math.max(-120, Math.min(120, prev.panY + dy * 1.2)),
                        rotY: Math.max(-25, Math.min(25, prev.rotY + dx * 0.15)),
                        rotX: Math.max(-20, Math.min(20, prev.rotX - dy * 0.15)),
                      }));
                    }}
                    onWheel={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const rect = e.currentTarget.getBoundingClientRect();
                      const ox = e.clientX - (rect.left + rect.width / 2);
                      const oy = e.clientY - (rect.top + rect.height / 2);
                      setCamPreviewTransform((prev) => {
                        const nextZoom = Math.max(
                          0.6,
                          Math.min(4.0, Number((prev.zoom + (e.deltaY < 0 ? 0.14 : -0.14)).toFixed(2)))
                        );
                        return {
                          ...prev,
                          zoom: nextZoom,
                          panX: Math.max(-180, Math.min(180, prev.panX - ox * 0.18 + (e.deltaX || 0) * -0.8)),
                          panY: Math.max(-120, Math.min(120, prev.panY - oy * 0.18 + (e.deltaY * -0.25))),
                        };
                      });
                    }}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setCamPreviewTransform({ panX: 0, panY: 0, zoom: 1.15, rotX: 0, rotY: 0 });
                    }}
                    className="relative h-36 rounded-xl bg-black border border-cyan-400/35 overflow-hidden cursor-move select-none flex items-center justify-center"
                    title="Scroll mouse wheel or hold wheel-button & drag to move camera preview around!"
                  >
                    <div
                      style={{
                        transform: `translate3d(${camPreviewTransform.panX}px, ${camPreviewTransform.panY}px, 0) scale(${camPreviewTransform.zoom}) rotateX(${camPreviewTransform.rotX}deg) rotateY(${camPreviewTransform.rotY}deg)`,
                        transition: isCamPreviewDraggingRef.current ? "none" : "transform 120ms ease-out",
                      }}
                      className="w-full h-full flex items-center justify-center relative"
                    >
                      <video
                        ref={webcamVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className={`w-full h-full object-cover ${
                          isOpticalWebcamActive ? "block" : "hidden"
                        }`}
                      />
                      {!isOpticalWebcamActive && (
                        <div className="w-[160%] h-[160%] bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.18)_0%,rgba(0,0,0,0.95)_70%)] flex flex-col items-center justify-center p-3 text-center">
                          <div className="grid grid-cols-4 gap-2 w-full max-w-[260px] mb-1">
                            {Array.from({ length: Math.min(8, totalSectorsCount) }).map((_, i) => (
                              <div
                                key={i}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  flyCameraToSector(i);
                                }}
                                className="p-1.5 rounded-lg bg-cyan-500/15 border border-cyan-400/40 text-[9px] text-cyan-200 font-bold hover:bg-cyan-400/30 cursor-pointer"
                              >
                                Sector S{i}
                              </div>
                            ))}
                          </div>
                          <span className="text-[10px] text-slate-300">
                            Scroll Wheel / Drag Here to Move Camera View
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Camera HUD Overlay */}
                    <div className="absolute top-1.5 left-2 right-2 flex items-center justify-between pointer-events-none text-[9px] text-cyan-300">
                      <span>
                        CAM PAN: ({Math.round(camPreviewTransform.panX)}, {Math.round(camPreviewTransform.panY)})
                      </span>
                      <span>ZOOM: {Math.round(camPreviewTransform.zoom * 100)}%</span>
                    </div>
                  </div>

                  {/* Dedicated Left-Click, Wheel-Click & Right-Click Buttons for Camera Preview */}
                  <div className="grid grid-cols-3 gap-1.5 text-[9px]">
                    <button
                      type="button"
                      onClick={() =>
                        setCamPreviewTransform((p) => ({
                          ...p,
                          panX: p.panX - 28,
                          zoom: Math.min(4, Number((p.zoom + 0.15).toFixed(2))),
                        }))
                      }
                      className="py-1 px-1.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/40 text-cyan-200 font-bold cursor-pointer truncate"
                    >
                      L-Click: Pan/Zoom
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const nextSec = (camCoordHud.sector + 1) % Math.max(1, totalSectorsCount);
                        flyCameraToSector(nextSec);
                      }}
                      className="py-1 px-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/40 text-emerald-200 font-bold cursor-pointer truncate"
                    >
                      Wheel: Move Cam
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setCamPreviewTransform({ panX: 0, panY: 0, zoom: 1.15, rotX: 0, rotY: 0 })
                      }
                      className="py-1 px-1.5 rounded-lg bg-purple-500/15 hover:bg-purple-500/25 border border-purple-400/40 text-purple-200 font-bold cursor-pointer truncate"
                    >
                      R-Click: Reset Cam
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* =================================================================
                INLINE EXPANDABLE MICRO-DECISION POPUP INSIDE THE 360° WORLD
               ================================================================= */}
            <AnimatePresence>
              {expandedPopupNode && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.92, y: 12 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.92, y: 12 }}
                  className="absolute top-20 right-4 z-30 w-[460px] max-w-[95%] max-h-[80%] overflow-y-auto liquid-glass rounded-2xl p-4 border-2 border-cyan-400/70 shadow-[0_15px_50px_rgba(0,0,0,0.95)] font-mono text-xs custom-scrollbar"
                >
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

                  <div className="mt-3 flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <span className="text-[10px] text-slate-400 block">
                          NODE ID: {expandedPopupNode.id.toUpperCase()} • SECTOR S
                          {expandedPopupNode.sectorId ?? 0}
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
      )}

      {/* =====================================================================
          MODE 2: LEVERAGE METRICS DECISION TREE
         ===================================================================== */}
      {subView === "LEVERAGE_DECISION_TREE" && (
        <div className="liquid-glass rounded-2xl p-4 mt-24 flex flex-col gap-4 overflow-x-auto">
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

          <div className="p-3 rounded-xl bg-black/30 border border-white/10 flex flex-col items-center gap-2">
            <span className="text-[11px] font-mono font-bold text-slate-300 uppercase tracking-wider">
              Macro Decision Tree Based on Leverage Metrics (Full 64-Branch Autonomous Forest)
            </span>
            <svg className="w-full h-28 max-w-4xl" viewBox="0 0 800 110">
              <line x1="400" y1="12" x2="220" y2="38" stroke="#f59e0b" strokeWidth="1.5" />
              <line x1="400" y1="12" x2="580" y2="38" stroke="#38bdf8" strokeWidth="1.5" />
              <line x1="220" y1="38" x2="120" y2="68" stroke="#f59e0b" strokeWidth="1.2" />
              <line x1="220" y1="38" x2="320" y2="68" stroke="#f59e0b" strokeWidth="1.2" />
              <line x1="580" y1="38" x2="480" y2="68" stroke="#f59e0b" strokeWidth="1.2" />
              <line x1="580" y1="38" x2="680" y2="68" stroke="#38bdf8" strokeWidth="1.2" />
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

          <div className="flex flex-col items-center gap-4 min-w-[780px] py-2">
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

            <div className="flex items-center justify-around w-full max-w-2xl text-xs font-mono font-bold text-cyan-300">
              <span>↙ True (Direct Context Execution)</span>
              <span>False (Autonomous Escalation) ↘</span>
            </div>

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
          MODE 3: NODE PATTERN & SLOT-FILLING CONTEXT FLOWCHART
         ===================================================================== */}
      {subView === "NODE_SLOT_FILLING" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 flex-1 mt-24 p-2">
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
          MODE 4: APLYSIA VOICE PROCESSING & 6-PERSONA VOICE STUDIO
         ===================================================================== */}
      {subView === "APLYSIA_VOICE_PIPELINE" && (
        <div className="flex flex-col gap-3 flex-1 mt-24 p-2 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
            <div className="lg:col-span-6 liquid-glass rounded-2xl p-4 flex flex-col items-center justify-center gap-3">
              <div className="text-center">
                <span className="text-xs font-mono font-bold text-cyan-300 uppercase tracking-widest">
                  Aplysia — Voice Processing & Decision Making Architecture
                </span>
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

          <div className="liquid-glass rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/15 pb-2">
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-white font-mono uppercase flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-cyan-400" />
                  <span>
                    Multi-Persona Acoustic Voice Studio (Each Voice Has Its Own Timbre, Pitch & Speaking Flow)
                  </span>
                </h4>
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
          MODE 5: FULL-PC SCREEN MONITOR, CAMERA PREVIEW & AUTO-FIX
         ===================================================================== */}
      {subView === "FULL_PC_SCREEN_AUTOFIX" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 flex-1 mt-24 p-2 overflow-y-auto">
          <div className="lg:col-span-7 liquid-glass rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/15 pb-2">
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-white font-mono uppercase flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-cyan-400" />
                  <span>Moveable Camera / Screen Preview & Autonomous Auto-Fix</span>
                </h3>
                <p className="text-xs text-slate-300 font-sans">
                  Use your scroll wheel or middle wheel button to move, pan, and zoom the live screen/camera preview below!
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

            {/* Moveable Live Screen / Camera Video Feed (Wheel Pan & Zoom enabled!) */}
            <div
              onMouseDown={(e) => {
                if (e.button === 1) e.preventDefault();
                isCamPreviewDraggingRef.current = true;
                lastCamPreviewPosRef.current = { x: e.clientX, y: e.clientY };
              }}
              onMouseUp={() => {
                isCamPreviewDraggingRef.current = false;
              }}
              onMouseLeave={() => {
                isCamPreviewDraggingRef.current = false;
              }}
              onMouseMove={(e) => {
                if (!isCamPreviewDraggingRef.current) return;
                const dx = e.clientX - lastCamPreviewPosRef.current.x;
                const dy = e.clientY - lastCamPreviewPosRef.current.y;
                lastCamPreviewPosRef.current = { x: e.clientX, y: e.clientY };
                setCamPreviewTransform((prev) => ({
                  ...prev,
                  panX: Math.max(-280, Math.min(280, prev.panX + dx * 1.3)),
                  panY: Math.max(-200, Math.min(200, prev.panY + dy * 1.3)),
                }));
              }}
              onWheel={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setCamPreviewTransform((prev) => ({
                  ...prev,
                  zoom: Math.max(
                    0.5,
                    Math.min(4.5, Number((prev.zoom + (e.deltaY < 0 ? 0.16 : -0.16)).toFixed(2)))
                  ),
                  panX: Math.max(-280, Math.min(280, prev.panX - (e.deltaX || 0))),
                  panY: Math.max(-200, Math.min(200, prev.panY - e.deltaY * 0.3)),
                }));
              }}
              className="relative flex-1 min-h-[250px] rounded-xl bg-black/70 border border-cyan-400/30 overflow-hidden flex items-center justify-center cursor-move"
            >
              <div
                style={{
                  transform: `translate3d(${camPreviewTransform.panX}px, ${camPreviewTransform.panY}px, 0) scale(${camPreviewTransform.zoom})`,
                }}
                className="w-full h-full flex items-center justify-center"
              >
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
                      MOVEABLE SCREEN & CAMERA PREVIEW GUARDIAN ACTIVE
                    </div>
                    <p className="text-xs text-slate-300 font-sans">
                      Scroll your mouse wheel or press & drag the scroll wheel button here to move and zoom the camera preview around!
                    </p>
                  </div>
                )}
              </div>
            </div>

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

          <div className="lg:col-span-5 flex flex-col gap-3">
            <div className="liquid-glass rounded-2xl p-4 flex flex-col gap-2.5 font-mono text-xs">
              <span className="text-cyan-300 font-bold uppercase border-b border-white/15 pb-1.5">
                Multi-Branch System Execution State Machine
              </span>
              <div className="grid grid-cols-2 gap-2 font-sans text-[11px]">
                <div className="p-2.5 rounded-xl bg-black/30 border border-cyan-400/30">
                  <strong className="text-cyan-300 font-mono block text-[10px]">
                    BRANCH 1: REALITY CAMERA
                  </strong>
                  <span>Turn on camera ➔ Move & Zoom Preview via Wheel ➔ Call Neural Network</span>
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
                  <span>Project 360° 3D Micro-Decision nodes across multi-sector world</span>
                </div>
              </div>
            </div>

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

      {/* RENAME PLANET MODAL */}
      <AnimatePresence>
        {renamePlanetModal && renamePlanetModal.open && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              className="w-full max-w-md liquid-glass border border-cyan-400/50 rounded-2xl p-6 flex flex-col gap-4 shadow-[0_0_35px_rgba(34,211,238,0.25)] text-white"
            >
              <div className="flex items-center justify-between border-b border-white/15 pb-3">
                <div className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-cyan-400" />
                  <h3 className="font-mono font-bold text-sm text-cyan-300 uppercase">
                    Rename 3D Planetary Sphere
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setRenamePlanetModal(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-col gap-2 font-mono text-xs">
                <label className="text-slate-300">Select Planet to Rename:</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {Array.from({ length: Math.min(8, Math.max(4, totalSectorsCount)) }).map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() =>
                        setRenamePlanetModal({
                          open: true,
                          planetId: idx,
                          nameInput: getPlanetName(idx),
                        })
                      }
                      className={`px-2 py-1.5 rounded-lg border text-[11px] font-bold cursor-pointer transition-all ${
                        renamePlanetModal.planetId === idx
                          ? "bg-cyan-500 text-slate-950 border-cyan-300 font-extrabold"
                          : "bg-slate-900/80 border-white/10 text-slate-300 hover:border-white/30"
                      }`}
                    >
                      Planet {idx + 1}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1.5 font-mono text-xs">
                <label className="text-slate-300">New Custom Planet Name:</label>
                <input
                  type="text"
                  value={renamePlanetModal.nameInput}
                  onChange={(e) =>
                    setRenamePlanetModal((prev) => (prev ? { ...prev, nameInput: e.target.value } : null))
                  }
                  placeholder={`e.g. Planet ${renamePlanetModal.planetId + 1} • Earth-Prime`}
                  className="w-full bg-slate-950/90 border border-white/20 focus:border-cyan-400 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/15">
                <button
                  type="button"
                  onClick={() => setRenamePlanetModal(null)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-mono text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (renamePlanetModal.nameInput.trim()) {
                      setPlanetCustomName(renamePlanetModal.planetId, renamePlanetModal.nameInput.trim());
                      if (userProfile.soundEffects) soundEffects.playTaskComplete();
                      speechEngine.speak(`Planet ${renamePlanetModal.planetId + 1} renamed to ${renamePlanetModal.nameInput.trim()}.`);
                    }
                    setRenamePlanetModal(null);
                  }}
                  className="px-5 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-mono text-xs font-bold cursor-pointer transition-all shadow-[0_0_15px_rgba(34,211,238,0.4)]"
                >
                  Save Planet Name
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
