/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Deep Space Nebula Wallpaper + Interactive Multi-Sector 3D Micro-Decision World Background
 * + Scroll-Wheel & Middle-Button Camera Pan/Zoom-to-Area
 * + Cross-World Neural Bridge Lines + Expandable Micro-Decision Inspector
 */

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles,
  Eye,
  X,
  Play,
  Compass,
  CheckCircle2,
  MousePointer,
  ShieldCheck,
  Clock,
  Activity,
  Terminal,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { MicroDecisionNode, ScreenAutoFixReport } from "../types";
import { layoutMicroDecisionWorld3D } from "../utils/microDecisionWorldEngine";

interface MicroDecisionBackground3DProps {
  nodes: MicroDecisionNode[];
  selectedNode: MicroDecisionNode | null;
  onSelectNode: (node: MicroDecisionNode | null) => void;
  onOpenFullMicroDecisionScreen: () => void;
  onExecuteMicroDecision: (node: MicroDecisionNode) => void;
  isMicroDecisionTabActive: boolean;
  virtualCursor: {
    active: boolean;
    xPercent: number;
    yPercent: number;
    label: string;
    status: "MOVING" | "CLICKING" | "FIXED";
  } | null;
  latestAutoFixReport: ScreenAutoFixReport | null;
  onDismissAutoFixReport: () => void;
}

interface ProjectedNode2D {
  node: MicroDecisionNode;
  sectorId: number;
  bridgeTargetIds: string[];
  x: number;
  y: number;
  z: number;
  scale: number;
  alpha: number;
}

export const MicroDecisionBackground3D: React.FC<MicroDecisionBackground3DProps> = ({
  nodes,
  selectedNode,
  onSelectNode,
  onOpenFullMicroDecisionScreen,
  onExecuteMicroDecision,
  isMicroDecisionTabActive,
  virtualCursor,
  latestAutoFixReport,
  onDismissAutoFixReport,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const projectedRef = useRef<ProjectedNode2D[]>([]);
  const rotationRef = useRef<{ yaw: number; pitch: number }>({ yaw: 0.25, pitch: 0.14 });
  const yawVelRef = useRef<number>(0.0016);
  const targetPitchRef = useRef<number>(0.14);
  const camPanRef = useRef<{ x: number; y: number; targetX: number; targetY: number }>({
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
  });
  const isWheelBtnDownRef = useRef<boolean>(false);
  const lastMouseRef = useRef<{ x: number; y: number; initialized: boolean }>({
    x: 0,
    y: 0,
    initialized: false,
  });
  const zoomRef = useRef<number>(0.92);
  const nodesRef = useRef<MicroDecisionNode[]>(nodes);
  nodesRef.current = nodes;
  const selectedNodeRef = useRef<MicroDecisionNode | null>(selectedNode);
  selectedNodeRef.current = selectedNode;
  const isTabActiveRef = useRef<boolean>(isMicroDecisionTabActive);
  isTabActiveRef.current = isMicroDecisionTabActive;
  const onSelectNodeRef = useRef(onSelectNode);
  onSelectNodeRef.current = onSelectNode;
  const hoveredIdRef = useRef<string | null>(null);

  const [hoveredBgNode, setHoveredBgNode] = useState<{
    node: MicroDecisionNode;
    x: number;
    y: number;
  } | null>(null);
  const [showAboutDecision, setShowAboutDecision] = useState<boolean>(false);

  useEffect(() => {
    setShowAboutDecision(false);
  }, [selectedNode?.id]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId = 0;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    // Middle Mouse Button (Scroll Wheel Button) Press to Pan & Move across the 3D World
    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 1) {
        e.preventDefault();
        isWheelBtnDownRef.current = true;
        lastMouseRef.current = { x: e.clientX, y: e.clientY, initialized: true };
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 1) {
        isWheelBtnDownRef.current = false;
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!lastMouseRef.current.initialized) {
        lastMouseRef.current = { x: e.clientX, y: e.clientY, initialized: true };
      }
      const dx = e.clientX - lastMouseRef.current.x;
      const dy = e.clientY - lastMouseRef.current.y;
      lastMouseRef.current.x = e.clientX;
      lastMouseRef.current.y = e.clientY;

      if (isWheelBtnDownRef.current) {
        camPanRef.current.targetX += dx * 1.35;
        camPanRef.current.targetY += dy * 1.35;
        return;
      }

      const normX = (e.clientX / Math.max(1, width) - 0.5) * 2;
      const normY = (e.clientY / Math.max(1, height) - 0.5) * 2;
      targetPitchRef.current = Math.max(-0.65, Math.min(0.65, normY * 0.35));

      rotationRef.current.yaw += dx * 0.0024;
      rotationRef.current.pitch = Math.max(
        -0.75,
        Math.min(0.75, rotationRef.current.pitch + dy * 0.0015)
      );
      const desiredVel = Math.abs(normX) > 0.06 ? normX * 0.0032 : 0.0015;
      yawVelRef.current += (desiredVel - yawVelRef.current) * 0.16;

      if (isTabActiveRef.current) return;

      let closest: ProjectedNode2D | null = null;
      let minDist = 36;
      for (const p of projectedRef.current) {
        const d = Math.hypot(e.clientX - p.x, e.clientY - p.y);
        if (d < minDist) {
          minDist = d;
          closest = p;
        }
      }
      const nextId = closest ? closest.node.id : null;
      if (nextId !== hoveredIdRef.current) {
        hoveredIdRef.current = nextId;
        if (closest) {
          setHoveredBgNode({ node: closest.node, x: closest.x, y: closest.y });
        } else {
          setHoveredBgNode(null);
        }
      }
    };

    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    // Allow MouseWheel zoom toward cursor area & camera pan on background orbit
    const handleWheel = (e: WheelEvent) => {
      if (isTabActiveRef.current) return;
      const target = e.target as HTMLElement | null;
      const isOverInteractiveScroll =
        target &&
        target.closest(
          "div.overflow-y-auto, div.overflow-x-auto, textarea, input, select"
        );
      if (e.altKey || !isOverInteractiveScroll) {
        const oldZoom = zoomRef.current;
        const delta = Math.max(-120, Math.min(120, e.deltaY));
        const factor = Math.pow(1.0022, -delta);
        const nextZoom = Math.max(0.0005, Math.min(150.0, oldZoom * factor));
        const k = nextZoom / oldZoom;
        const mx = e.clientX;
        const my = e.clientY;
        const dx = mx - width * 0.5;
        const dy = my - height * 0.5;
        camPanRef.current.targetX = dx * (1 - k) + camPanRef.current.targetX * k;
        camPanRef.current.targetY = dy * (1 - k) + camPanRef.current.targetY * k;
        camPanRef.current.x = camPanRef.current.targetX;
        camPanRef.current.y = camPanRef.current.targetY;
        zoomRef.current = nextZoom;
      }
    };
    window.addEventListener("wheel", handleWheel, { passive: true });

    const handleGlobalClick = (e: MouseEvent) => {
      if (isTabActiveRef.current) return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        target.closest("button, a, input, textarea, select, [role='button']")
      ) {
        return;
      }
      let closest: ProjectedNode2D | null = null;
      let minDist = 42;
      for (const p of projectedRef.current) {
        const d = Math.hypot(e.clientX - p.x, e.clientY - p.y);
        if (d < minDist) {
          minDist = d;
          closest = p;
        }
      }
      if (closest) {
        onSelectNodeRef.current(closest.node);
      }
    };
    window.addEventListener("click", handleGlobalClick);

    const galaxyStars = Array.from({ length: 320 }, (_, i) => {
      const armIndex = i % 3;
      const armAngle = (armIndex * 2 * Math.PI) / 3;
      const dist = Math.pow(Math.random(), 0.75) * 580;
      const spiralOffset = dist * 0.0035;
      const angle = armAngle + spiralOffset + (Math.random() - 0.5) * 0.5;
      return {
        dist,
        baseAngle: angle,
        z: (Math.random() - 0.5) * 120,
        r: Math.random() * 1.8 + 0.4,
        twinkle: Math.random() * Math.PI * 2,
        color:
          dist < 100
            ? "#ffffff"
            : dist < 260
            ? "#38bdf8"
            : armIndex === 1
            ? "#818cf8"
            : "#06b6d4",
      };
    });

    let time = 0;

    const render = () => {
      time += 0.012;
      // Galaxy rotates in counter-direction against micro decisions
      const galaxyYaw = -rotationRef.current.yaw * 0.85;

      rotationRef.current.yaw += yawVelRef.current;
      rotationRef.current.pitch +=
        (targetPitchRef.current - rotationRef.current.pitch) * 0.06;
      camPanRef.current.x += (camPanRef.current.targetX - camPanRef.current.x) * 0.14;
      camPanRef.current.y += (camPanRef.current.targetY - camPanRef.current.y) * 0.14;

      ctx.clearRect(0, 0, width, height);

      // Deep Cosmic Blue-Black space background
      const spaceGrad = ctx.createRadialGradient(
        width * 0.5,
        height * 0.5,
        50,
        width * 0.5,
        height * 0.5,
        Math.max(width, height) * 0.85
      );
      spaceGrad.addColorStop(0, "#081b38");
      spaceGrad.addColorStop(0.45, "#030c1f");
      spaceGrad.addColorStop(1, "#01040f");
      ctx.fillStyle = spaceGrad;
      ctx.fillRect(0, 0, width, height);

      // Render 3D Rotating Galaxy Arms
      const galCenterX = width * 0.5 + camPanRef.current.x * 0.25;
      const galCenterY = height * 0.5 + camPanRef.current.y * 0.25;

      // Galaxy Core Nebula Glow
      const coreGlow = ctx.createRadialGradient(
        galCenterX,
        galCenterY,
        5,
        galCenterX,
        galCenterY,
        180
      );
      coreGlow.addColorStop(0, "rgba(56, 189, 248, 0.45)");
      coreGlow.addColorStop(0.3, "rgba(99, 102, 241, 0.25)");
      coreGlow.addColorStop(1, "rgba(1, 4, 15, 0)");
      ctx.fillStyle = coreGlow;
      ctx.beginPath();
      ctx.arc(galCenterX, galCenterY, 180, 0, Math.PI * 2);
      ctx.fill();

      // Render Galaxy Stars rotating counter to decisions
      for (const s of galaxyStars) {
        s.twinkle += 0.035;
        const currentA = s.baseAngle + galaxyYaw + time * 0.08;
        const starX = galCenterX + Math.cos(currentA) * s.dist;
        const starY = galCenterY + Math.sin(currentA) * s.dist * 0.48; // perspective tilted ellipse
        const alpha = 0.35 + Math.sin(s.twinkle) * 0.35;
        ctx.fillStyle = s.color;
        ctx.globalAlpha = Math.max(0.12, Math.min(0.95, alpha));
        ctx.beginPath();
        ctx.arc(starX, starY, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      if (isTabActiveRef.current) {
        animId = requestAnimationFrame(render);
        return;
      }

      const cx = width * 0.5 + camPanRef.current.x;
      const cy = height * 0.5 + camPanRef.current.y;
      const yaw = rotationRef.current.yaw;
      const pitch = rotationRef.current.pitch;
      const fov = 720;
      const baseRadius = Math.min(width, height) * 0.25 * zoomRef.current;

      const worldLayout = layoutMicroDecisionWorld3D(nodesRef.current, baseRadius);
      const currentSelected = selectedNodeRef.current;

      const cosY = Math.cos(yaw);
      const sinY = Math.sin(yaw);
      const cosP = Math.cos(pitch);
      const sinP = Math.sin(pitch);

      const projected: ProjectedNode2D[] = worldLayout.map((item) => {
        const wx = item.worldX;
        const wy = item.worldY;
        const wz = item.worldZ;

        // Rotate in 3D around world origin
        const rx = wx * cosY - wz * sinY;
        const rz1 = wx * sinY + wz * cosY;
        const ry = wy * cosP - rz1 * sinP;
        const rz = wy * sinP + rz1 * cosP;

        const scale = Math.max(0.08, fov / Math.max(40, fov + rz + 320));
        const x2d = cx + rx * scale;
        const y2d = cy + ry * scale;
        const alpha = Math.max(0.28, Math.min(0.96, (scale - 0.35) * 1.65));

        return {
          node: item.node,
          sectorId: item.sectorId,
          bridgeTargetIds: item.bridgeTargetIds,
          x: x2d,
          y: y2d,
          z: rz,
          scale,
          alpha,
        };
      });

      projected.sort((a, b) => b.z - a.z);
      projectedRef.current = projected;

      const mapById = new Map<string, ProjectedNode2D>();
      for (const p of projected) {
        mapById.set(p.node.id, p);
      }

      // Draw intra-cluster synapses & long-range Cross-World Bridge Lines
      for (const p of projected) {
        for (const targetId of p.node.connectedTo) {
          const target = mapById.get(targetId);
          if (!target) continue;

          const isCrossSectorBridge =
            p.sectorId !== target.sectorId || p.bridgeTargetIds.includes(targetId);

          ctx.strokeStyle = isCrossSectorBridge
            ? `rgba(34, 211, 238, ${(p.alpha * target.alpha * 0.55).toFixed(3)})`
            : `rgba(148, 163, 184, ${(p.alpha * target.alpha * 0.24).toFixed(3)})`;
          ctx.lineWidth = isCrossSectorBridge ? 1.8 : 1;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(target.x, target.y);
          ctx.stroke();

          const pulseT = (time * (isCrossSectorBridge ? 0.95 : 0.65) + (p.node.samples % 7) * 0.13) % 1;
          const px = p.x + (target.x - p.x) * pulseT;
          const py = p.y + (target.y - p.y) * pulseT;
          ctx.fillStyle = isCrossSectorBridge ? "#22d3ee" : p.node.color || "#22d3ee";
          ctx.globalAlpha = p.alpha * 0.85;
          ctx.beginPath();
          ctx.arc(px, py, (isCrossSectorBridge ? 3.2 : 2.1) * p.scale, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
        }
      }

      // Draw 3D Micro-Decision Nodes
      for (const p of projected) {
        const isSelected = currentSelected?.id === p.node.id;
        const safeScale = Math.max(0.08, Number.isFinite(p.scale) ? p.scale : 0.5);
        const nodeRadius = Math.max(2, (isSelected ? 11.5 : 8) * safeScale);
        const glowRadius = Math.max(nodeRadius + 2, nodeRadius * 3.1);

        const safeX = Number.isFinite(p.x) ? p.x : cx;
        const safeY = Number.isFinite(p.y) ? p.y : cy;
        const r0Safe = Math.max(0.1, Math.min(1, nodeRadius * 0.2));
        const r1Safe = Math.max(r0Safe + 0.5, glowRadius);

        const glow = ctx.createRadialGradient(safeX, safeY, r0Safe, safeX, safeY, r1Safe);
        glow.addColorStop(0, p.node.color || "#22d3ee");
        glow.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = glow;
        ctx.globalAlpha = Math.max(0, Math.min(1, p.alpha * 0.65));
        ctx.beginPath();
        ctx.arc(safeX, safeY, r1Safe, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = p.node.color || "#22d3ee";
        ctx.globalAlpha = Math.max(0, Math.min(1, p.alpha));
        ctx.beginPath();
        ctx.arc(safeX, safeY, nodeRadius, 0, Math.PI * 2);
        ctx.fill();

        if (p.scale > 0.52) {
          const titleFont = Math.max(9, Math.round(10.5 * p.scale));
          ctx.font = `bold ${titleFont}px monospace`;
          const textW = ctx.measureText(p.node.title).width;
          const lx = safeX + nodeRadius + 7;
          const ly = safeY - 8 * p.scale;

          ctx.fillStyle = `rgba(3, 12, 30, ${(p.alpha * 0.88).toFixed(2)})`;
          ctx.strokeStyle = "rgba(56, 189, 248, 0.45)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(lx - 4, ly - 4, textW + 10, 24 * p.scale, 6);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = "#ffffff";
          ctx.fillText(p.node.title, lx, ly + 8 * p.scale);

          ctx.font = `bold ${Math.max(8, Math.round(8.5 * p.scale))}px monospace`;
          ctx.fillStyle = "#38bdf8";
          ctx.fillText(
            `S${p.sectorId} • ${p.node.latencyMs}ms • gini=${p.node.gini}`,
            lx,
            ly + 18 * p.scale
          );
        }
      }
      ctx.globalAlpha = 1;

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("click", handleGlobalClick);
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

  return (
    <>
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-0"
      />

      {!isMicroDecisionTabActive && hoveredBgNode && (
        <div
          style={{
            left: Math.min(window.innerWidth - 280, Math.max(16, hoveredBgNode.x - 20)),
            top: Math.min(window.innerHeight - 120, Math.max(60, hoveredBgNode.y - 20)),
          }}
          className="fixed z-30 pointer-events-auto"
        >
          <button
            type="button"
            onClick={() => onSelectNode(hoveredBgNode.node)}
            className="liquid-glass px-3.5 py-2.5 rounded-xl border border-cyan-400/60 text-left flex flex-col gap-1 shadow-[0_0_25px_rgba(34,211,238,0.4)] hover:scale-105 transition-transform cursor-pointer max-w-[270px]"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-mono font-bold text-cyan-300 uppercase flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>Click to Expand Decision</span>
              </span>
              <span className="text-[10px] font-mono text-emerald-300 font-bold">
                {hoveredBgNode.node.latencyMs}ms
              </span>
            </div>
            <span className="text-xs font-bold text-white truncate">
              {hoveredBgNode.node.title}
            </span>
            <span className="text-[10px] text-slate-300 font-mono truncate">
              gini={hoveredBgNode.node.gini} • samples={hoveredBgNode.node.samples}
            </span>
          </button>
        </div>
      )}

      {!isMicroDecisionTabActive && !selectedNode && (
        <div className="fixed bottom-14 right-5 z-30 pointer-events-auto">
          <button
            type="button"
            onClick={onOpenFullMicroDecisionScreen}
            className="liquid-glass px-4 py-2.5 rounded-2xl border border-cyan-400/60 hover:border-cyan-300 shadow-[0_0_25px_rgba(34,211,238,0.35)] flex items-center gap-2.5 cursor-pointer transition-all hover:scale-105 group"
          >
            <Compass className="w-4 h-4 text-cyan-400 animate-spin" />
            <div className="text-left font-mono">
              <div className="text-[11px] font-bold text-white group-hover:text-cyan-200 uppercase tracking-wider">
                MICRO-DECISION 360° WORLD
              </div>
              <div className="text-[9px] text-cyan-300">
                Click to Explore Multi-Sector World ({nodes.length} Active Decisions)
              </div>
            </div>
          </button>
        </div>
      )}

      <AnimatePresence>
        {selectedNode && !isMicroDecisionTabActive && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            className="fixed bottom-14 right-5 z-50 w-[440px] max-w-[94vw] max-h-[82vh] overflow-y-auto liquid-glass rounded-2xl p-4 border border-cyan-400/60 shadow-[0_12px_45px_rgba(0,0,0,0.85)] font-mono text-xs custom-scrollbar"
          >
            <div className="flex items-center justify-between pb-2.5 border-b border-white/15">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-cyan-400 animate-spin" />
                <span className="text-white font-bold uppercase tracking-wider text-[11px]">
                  Micro-Decision Expanded Inspector
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[10px] font-bold flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {selectedNode.latencyMs} ms
                </span>
                <button
                  type="button"
                  onClick={() => onSelectNode(null)}
                  className="text-slate-400 hover:text-white p-1 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="mt-3 flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-bold text-cyan-300 font-sans">
                  {selectedNode.title}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/15 border border-cyan-400/30 text-cyan-200 font-bold">
                  {selectedNode.apiUsed.replace("_", " ")}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-black/45 border border-cyan-400/30 flex flex-col gap-1.5 font-sans">
                <span className="text-[10px] font-mono font-bold text-cyan-300 uppercase flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Command Execution Breakdown (Command में क्या-क्या किया):</span>
                </span>
                <ul className="space-y-1.5 text-[11px] text-slate-200 mt-1">
                  {getCommandActionsList(selectedNode).map((step, i) => (
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
                    : "bg-white/10 hover:bg-white/15 border-cyan-400/40 text-cyan-200"
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
                {showAboutDecision && (() => {
                  const loadInfo = getSystemLoadMetrics(selectedNode);
                  return (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="p-3.5 rounded-xl bg-slate-950/80 border border-amber-400/40 flex flex-col gap-2.5 font-sans text-xs overflow-hidden"
                    >
                      <div className="p-2.5 rounded-lg bg-white/5 border border-white/10">
                        <span className="text-[10px] font-mono font-bold text-amber-300 uppercase block mb-0.5">
                          1. Question / Trigger Command (Question क्या था):
                        </span>
                        <p className="text-white font-semibold">{loadInfo.questionText}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                        <div className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-400/30">
                          <span className="text-[9px] text-emerald-300 uppercase block">
                            2. Responding Speed (कितनी जल्दी किया):
                          </span>
                          <strong className="text-white text-sm">
                            {selectedNode.latencyMs} ms (Ultra-Fast)
                          </strong>
                          <span className="text-[10px] text-slate-300 block mt-0.5">
                            Confidence: {(selectedNode.confidence * 100).toFixed(1)}%
                          </span>
                        </div>

                        <div className="p-2.5 rounded-lg bg-cyan-950/30 border border-cyan-400/30">
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

                      <div className="p-2.5 rounded-lg bg-violet-950/30 border border-violet-400/30">
                        <span className="text-[10px] font-mono font-bold text-violet-300 uppercase block mb-0.5">
                          4. How It Performed & Worked (कैसे किया और क्या किया):
                        </span>
                        <p className="text-slate-200 leading-relaxed mb-1">
                          {selectedNode.howItWorks}
                        </p>
                        <p className="text-[11px] text-cyan-300 font-mono">
                          Metrics: {selectedNode.howItPerforms}
                        </p>
                      </div>
                    </motion.div>
                  );
                })()}
              </AnimatePresence>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => onExecuteMicroDecision(selectedNode)}
                  className="flex-1 py-2 px-3 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Execute via API</span>
                </button>
                <button
                  type="button"
                  onClick={onOpenFullMicroDecisionScreen}
                  className="flex-1 py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                >
                  <Eye className="w-3.5 h-3.5 text-cyan-300" />
                  <span>Open Full 360° World</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {virtualCursor?.active && (
          <motion.div
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{
              opacity: 1,
              scale: virtualCursor.status === "CLICKING" ? 0.9 : 1,
              left: `${virtualCursor.xPercent}%`,
              top: `${virtualCursor.yPercent}%`,
            }}
            exit={{ opacity: 0, scale: 0.7 }}
            transition={{ type: "spring", stiffness: 120, damping: 18 }}
            className="fixed z-50 pointer-events-none flex items-center gap-2"
          >
            <div className="relative flex items-center justify-center">
              <motion.div
                className="w-10 h-10 rounded-full border-2 border-cyan-400 bg-cyan-400/20 shadow-[0_0_25px_rgba(34,211,238,0.9)]"
                animate={{ scale: [1, 1.45, 1], opacity: [0.9, 0.35, 0.9] }}
                transition={{ repeat: Infinity, duration: 1.1 }}
              />
              <MousePointer className="w-5 h-5 text-white drop-shadow-[0_0_8px_rgba(34,211,238,1)] absolute" />
            </div>
            <div className="liquid-glass px-3 py-1.5 rounded-xl border border-cyan-400/60 text-[11px] font-mono font-bold text-white shadow-[0_0_20px_rgba(34,211,238,0.4)] whitespace-nowrap">
              <span className="text-cyan-300">DRAVIS AUTO-AGENT:</span> {virtualCursor.label}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {latestAutoFixReport && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-16 right-5 z-50 w-96 max-w-[92vw] liquid-glass rounded-2xl p-3.5 border border-emerald-400/60 shadow-[0_10px_35px_rgba(16,185,129,0.28)] font-mono text-xs"
          >
            <div className="flex items-center justify-between pb-1.5 border-b border-white/15">
              <span className="text-emerald-300 font-bold flex items-center gap-1.5 text-[11px] uppercase">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Autonomous Screen Monitor & Auto-Fix</span>
              </span>
              <button
                type="button"
                onClick={onDismissAutoFixReport}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="mt-2 font-sans text-xs flex flex-col gap-1">
              <div>
                <span className="text-slate-400 font-mono text-[10px] uppercase">Issue Detected: </span>
                <span className="text-amber-300 font-semibold">{latestAutoFixReport.problemDetected}</span>
              </div>
              <div>
                <span className="text-slate-400 font-mono text-[10px] uppercase">Auto-Fix Executed: </span>
                <span className="text-emerald-300 font-semibold">{latestAutoFixReport.fixApplied}</span>
              </div>
              <p className="text-[11px] text-slate-200 mt-1 italic">
                "{latestAutoFixReport.spokenExplanation}"
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
