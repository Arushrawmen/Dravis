/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Planetary 3D Micro-Decision Empire & Cosmic Neural Network Engine
 * - Organizes Micro-Decisions into 3D Spherical Planets (Planet 1: Earth-Prime, Planet 2: Chronos...)
 * - Features User ("U") Node connected directly to Dravis Core ASI, and Dravis branching to all Planets
 * - Shoots long-range interplanetary neural bridge lines between planets
 * - Supports live planet renaming and infinite 3D cosmic expansion
 */

import { MicroDecisionNode } from "../types";

export const NODES_PER_PLANET = 4;
export const NODES_PER_WORLD_SECTOR = 4;

export interface PlanetInfo {
  planetId: number;
  sectorId: number;
  name: string;
  sideLabel: string;
  customName?: string;
  centerX: number;
  centerY: number;
  centerZ: number;
  radius: number;
  accentColor: string;
  color: string;
  theme: "EARTH" | "CHRONOS" | "NEXUS" | "SOLARIS" | "HORIZON" | "AETHERIA" | "TITAN" | "COSMOS";
}

export const DEFAULT_PLANET_NAMES: Record<number, { name: string; theme: PlanetInfo["theme"] }> = {
  0: { name: "Planet 1 • Earth-Prime", theme: "EARTH" },
  1: { name: "Planet 2 • Chronos Orbit", theme: "CHRONOS" },
  2: { name: "Planet 3 • Nexus Core", theme: "NEXUS" },
  3: { name: "Planet 4 • Solaris Sphere", theme: "SOLARIS" },
  4: { name: "Planet 5 • Horizon Deep", theme: "HORIZON" },
  5: { name: "Planet 6 • Aetheria Wing", theme: "AETHERIA" },
  6: { name: "Planet 7 • Titan Colony", theme: "TITAN" },
  7: { name: "Planet 8 • Cosmos Frontier", theme: "COSMOS" },
};

const PLANET_COLORS = [
  "#38bdf8", // Sky Cyan (Earth-Prime)
  "#818cf8", // Indigo (Chronos)
  "#34d399", // Emerald (Nexus)
  "#fbbf24", // Amber (Solaris)
  "#f43f5e", // Rose (Horizon)
  "#a855f7", // Violet (Aetheria)
  "#2dd4bf", // Teal (Titan)
  "#60a5fa", // Electric Blue (Cosmos)
];

// Persistent user-defined planet names map
export const userPlanetNamesMap: Map<number, string> = (() => {
  const map = new Map<number, string>();
  try {
    const raw = typeof localStorage !== "undefined" ? localStorage.getItem("dravis_planet_names") : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        for (const [k, v] of parsed) {
          map.set(Number(k), String(v));
        }
      }
    }
  } catch {}
  return map;
})();

export function setPlanetCustomName(planetId: number, name: string) {
  if (name.trim()) {
    userPlanetNamesMap.set(planetId, name.trim());
    try {
      localStorage.setItem(
        "dravis_planet_names",
        JSON.stringify(Array.from(userPlanetNamesMap.entries()))
      );
    } catch {}
  }
}

export function getPlanetName(planetId: number): string {
  if (userPlanetNamesMap.has(planetId)) {
    return userPlanetNamesMap.get(planetId)!;
  }
  return (
    DEFAULT_PLANET_NAMES[planetId]?.name ||
    `Planet ${planetId + 1} • Colony World #${planetId + 1}`
  );
}

/**
 * Computes the 3D center and geometry for each Planet in the empire.
 * Arranges planets in a majestic 3D celestial orbit system.
 */
export function getPlanetCenter3D(planetId: number, baseRadius: number): PlanetInfo {
  const r = Math.max(2, baseRadius);
  const accentColor = PLANET_COLORS[Math.abs(planetId) % PLANET_COLORS.length];
  const name = getPlanetName(planetId);
  const theme = DEFAULT_PLANET_NAMES[planetId]?.theme || "COSMOS";
  const planetRadius = Math.max(2, r * 0.32);

  if (planetId <= 0) {
    return {
      planetId: 0,
      sectorId: 0,
      name,
      sideLabel: name,
      centerX: 0,
      centerY: 0,
      centerZ: 0,
      radius: planetRadius,
      accentColor,
      color: accentColor,
      theme,
    };
  }

  // Preset 3D orbital coordinates for first 6 planets, then spiral outward in space
  const presets: Array<{ x: number; y: number; z: number }> = [
    { x: 0, y: 0, z: 0 },
    { x: 1.85, y: -0.65, z: 0.35 },
    { x: -1.95, y: 0.72, z: -0.32 },
    { x: -1.75, y: -1.25, z: 0.42 },
    { x: 1.88, y: 1.28, z: -0.38 },
    { x: 3.42, y: -0.35, z: 0.48 },
    { x: -3.55, y: 0.32, z: -0.45 },
  ];

  if (planetId < presets.length) {
    const p = presets[planetId];
    return {
      planetId,
      sectorId: planetId,
      name,
      sideLabel: name,
      centerX: p.x * r,
      centerY: p.y * r,
      centerZ: p.z * r,
      radius: planetRadius,
      accentColor,
      color: accentColor,
      theme,
    };
  }

  // Infinite expansion: alternate opposite orbital shells in 3D
  const ring = Math.floor((planetId - 1) / 2);
  const sign = planetId % 2 === 1 ? 1 : -1;
  const angle = ring * 1.25 + (sign > 0 ? 0.3 : Math.PI + 0.3);
  const dist = 2.4 + ring * 0.9;

  return {
    planetId,
    sectorId: planetId,
    name,
    sideLabel: name,
    centerX: Math.cos(angle) * dist * r,
    centerY: Math.sin(angle) * (dist * 0.72) * r,
    centerZ: Math.sin(planetId * 1.5) * 0.6 * r,
    radius: planetRadius,
    accentColor,
    color: accentColor,
    theme,
  };
}

export const getSectorCenter3D = getPlanetCenter3D;

export interface ComputedWorldNode3D {
  node: MicroDecisionNode;
  sectorId: number; // planetId
  planetInfo: PlanetInfo;
  sectorInfo: PlanetInfo;
  localIndexInPlanet: number;
  worldX: number;
  worldY: number;
  worldZ: number;
  bridgeTargetIds: string[];
  isUserLeader?: boolean;
  isDravisCore?: boolean;
}

/**
 * Places User ("U") Node, Dravis Core ASI Node, and all Micro-Decision nodes
 * onto true 3D spherical planets that live-orbit in space.
 */
export function layoutMicroDecisionWorld3D(
  nodes: MicroDecisionNode[],
  baseRadius: number,
  userName = "You",
  time = 0
): ComputedWorldNode3D[] {
  const chronological = [...nodes].reverse();
  const totalPlanets = Math.max(1, Math.ceil(chronological.length / NODES_PER_PLANET));

  // 1. Build the User Node ("U") - Leader of the system
  const userNode: MicroDecisionNode = {
    id: "node-user-identity",
    title: `U • ${userName}`,
    category: "AUTONOMOUS_EXECUTIVE",
    status: "ACTIVE",
    theta: 0,
    phi: 0,
    radius: 1.2,
    sectorId: 0,
    color: "#38bdf8",
    whatItTakes: `Master Command Authority (${userName})`,
    howItWorks: "Supreme Director -> Neural Intention Stream -> Dravis ASI Core",
    howItPerforms: "Zero Latency Direct Thought Synthesis",
    gini: 0.001,
    samples: 100000,
    value: [100000, 100],
    classLabel: 1,
    confidence: 1.0,
    latencyMs: 1,
    apiUsed: "DUAL_SYNTHESIS",
    connectedTo: ["node-dravis-core"],
    timestamp: "Now",
  };

  // 2. Build the Dravis Core ASI Node
  const dravisCoreNode: MicroDecisionNode = {
    id: "node-dravis-core",
    title: "DRAVIS ASI CORE",
    category: "NEURAL_REASONING",
    status: "ACTIVE",
    theta: Math.PI,
    phi: 0,
    radius: 1.35,
    sectorId: 0,
    color: "#818cf8",
    whatItTakes: "Master Cognitive Core connected to User Directive",
    howItWorks: "Cognitive Nexus -> Inter-Planetary Empire Orchestration",
    howItPerforms: "Hyper-Dimensional Neural Thought Loop",
    gini: 0.002,
    samples: 50000,
    value: [50000, 50],
    classLabel: 1,
    confidence: 0.999,
    latencyMs: 4,
    apiUsed: "DUAL_SYNTHESIS",
    connectedTo: ["node-user-identity"],
    timestamp: "Now",
  };

  // Position User Node and Dravis Core in high orbital presence
  const userPlanet = getPlanetCenter3D(0, baseRadius);
  const userComputed: ComputedWorldNode3D = {
    node: userNode,
    sectorId: 0,
    planetInfo: userPlanet,
    sectorInfo: userPlanet,
    localIndexInPlanet: 0,
    worldX: -baseRadius * 0.95,
    worldY: -baseRadius * 0.35,
    worldZ: baseRadius * 0.45,
    bridgeTargetIds: ["node-dravis-core"],
    isUserLeader: true,
  };

  const dravisComputed: ComputedWorldNode3D = {
    node: dravisCoreNode,
    sectorId: 0,
    planetInfo: userPlanet,
    sectorInfo: userPlanet,
    localIndexInPlanet: 1,
    worldX: -baseRadius * 0.35,
    worldY: -baseRadius * 0.15,
    worldZ: baseRadius * 0.25,
    bridgeTargetIds: ["node-user-identity"],
    isDravisCore: true,
  };

  // 3. Compute 3D Planetary Spheres for all micro decision nodes
  const computedNodes: ComputedWorldNode3D[] = chronological.map((node, chronoIdx) => {
    const planetId =
      typeof node.sectorId === "number" && node.sectorId >= 0
        ? node.sectorId
        : Math.floor(chronoIdx / NODES_PER_PLANET);
    const localIdx = chronoIdx % NODES_PER_PLANET;
    const planetInfo = getPlanetCenter3D(planetId, baseRadius);

    // Dynamic spherical orbit on the planet surface
    const orbitSpeed = 0.22 + (planetId % 3) * 0.08;
    const localTheta = node.theta + localIdx * ((Math.PI * 2) / NODES_PER_PLANET) + time * orbitSpeed;
    const localPhi = 0.55 + ((localIdx * 0.65 + node.phi) % 2.1);
    const pr = planetInfo.radius * (0.85 + (localIdx % 2) * 0.18);

    // True spherical mathematics: x = r*sin(phi)*cos(theta), y = r*cos(phi), z = r*sin(phi)*sin(theta)
    const localX = pr * Math.sin(localPhi) * Math.cos(localTheta);
    const localY = pr * Math.cos(localPhi);
    const localZ = pr * Math.sin(localPhi) * Math.sin(localTheta);

    const worldX = planetInfo.centerX + localX;
    const worldY = planetInfo.centerY + localY;
    const worldZ = planetInfo.centerZ + localZ;

    return {
      node: {
        ...node,
        sectorId: planetId,
      },
      sectorId: planetId,
      planetInfo,
      sectorInfo: planetInfo,
      localIndexInPlanet: localIdx,
      worldX,
      worldY,
      worldZ,
      bridgeTargetIds: [],
    };
  });

  // 4. Wire connections:
  // - Dravis Core connects to seed node of every Planet!
  // - Nodes on each planet connect together in an orbital ring
  // - Overflow bridge lines shoot from planet to planet
  const byPlanet = new Map<number, ComputedWorldNode3D[]>();
  for (const item of computedNodes) {
    const list = byPlanet.get(item.sectorId) || [];
    list.push(item);
    byPlanet.set(item.sectorId, list);
  }

  const planetIds = Array.from(byPlanet.keys()).sort((a, b) => a - b);
  for (let i = 0; i < planetIds.length; i++) {
    const pId = planetIds[i];
    const planetNodes = byPlanet.get(pId) || [];

    // Connect Dravis Core to first node of this planet
    if (planetNodes.length > 0) {
      const seedNode = planetNodes[0];
      if (!dravisComputed.node.connectedTo.includes(seedNode.node.id)) {
        dravisComputed.node.connectedTo.push(seedNode.node.id);
        dravisComputed.bridgeTargetIds.push(seedNode.node.id);
      }
    }

    // Connect nodes on the same planet in a spherical orbital ring
    for (let j = 0; j < planetNodes.length; j++) {
      const curr = planetNodes[j];
      const next = planetNodes[(j + 1) % planetNodes.length];
      if (next && next.node.id !== curr.node.id) {
        if (!curr.node.connectedTo.includes(next.node.id)) {
          curr.node.connectedTo.push(next.node.id);
        }
      }
    }

    // Connect Planet boundary to next Planet
    if (i + 1 < planetIds.length) {
      const nextPId = planetIds[i + 1];
      const nextNodes = byPlanet.get(nextPId) || [];
      if (planetNodes.length > 0 && nextNodes.length > 0) {
        const source = planetNodes[planetNodes.length - 1];
        const target = nextNodes[0];
        if (!source.bridgeTargetIds.includes(target.node.id)) {
          source.bridgeTargetIds.push(target.node.id);
        }
        if (!source.node.connectedTo.includes(target.node.id)) {
          source.node.connectedTo.push(target.node.id);
        }
      }
    }
  }

  return [userComputed, dravisComputed, ...computedNodes];
}

const AUTONOMOUS_EXPANSION_TEMPLATES: Array<{
  title: string;
  category: MicroDecisionNode["category"];
  whatItTakes: string;
  howItWorks: string;
  howItPerforms: string;
}> = [
  {
    title: "Interplanetary Neural Bridge Router",
    category: "MULTI_WORK_AGENT",
    whatItTakes: "Planet saturation >= 4 nodes + new planetary horizon lock",
    howItWorks: "Shoots long-range quantum energy beam from saturated planet to new distant orbital body",
    howItPerforms: "12ms interplanetary hop • gini = 0.012 • 99.8% precision",
  },
  {
    title: "Autonomous Cosmic Memory Harmonizer",
    category: "AUTONOMOUS_EXECUTIVE",
    whatItTakes: "User intention query + Vector Memory Bank + Planetary Mesh",
    howItWorks: "Synchronizes knowledge across all planetary satellites in real time",
    howItPerforms: "8ms retrieval • zero divergence across planetary mesh",
  },
  {
    title: "Optical Vision & Screen Auto-Fix Satellite",
    category: "SCREEN_AUTO_FIX",
    whatItTakes: "Optical frame capture + Gemini Vision model + Target Cursor API",
    howItWorks: "Inspects screen -> Calculates fix coordinates -> Dispatches auto-fix action",
    howItPerforms: "18ms visual parse • 99.4% resolution success",
  },
  {
    title: "Cognitive Inter-Agent Protocol Bridge",
    category: "NEURAL_REASONING",
    whatItTakes: "Multi-agent intent dispatch + asynchronous websocket mesh",
    howItWorks: "Routes complex user commands to specialized AI sub-agents in parallel",
    howItPerforms: "24ms consensus latency across 5 autonomous agents",
  },
];

export function createAutonomousWorldNode(
  existingNodes: MicroDecisionNode[],
  options?: {
    title?: string;
    command?: string;
    category?: MicroDecisionNode["category"];
    howItPerforms?: string;
    forceNewSector?: boolean;
    customSectorId?: number;
    customWorldNorm?: { x: number; y: number; z: number };
  }
): MicroDecisionNode {
  const total = existingNodes.length;
  const highestPlanet = existingNodes.reduce(
    (max, n, idx) =>
      Math.max(
        max,
        typeof n.sectorId === "number" ? n.sectorId : Math.floor(idx / NODES_PER_PLANET)
      ),
    0
  );

  const countInHighest = existingNodes.filter(
    (n, idx) =>
      (typeof n.sectorId === "number" ? n.sectorId : Math.floor(idx / NODES_PER_PLANET)) ===
      highestPlanet
  ).length;

  const targetPlanetId =
    typeof options?.customSectorId === "number"
      ? options.customSectorId
      : options?.forceNewSector || countInHighest >= NODES_PER_PLANET
      ? highestPlanet + 1
      : highestPlanet;

  const template =
    AUTONOMOUS_EXPANSION_TEMPLATES[(total + targetPlanetId) % AUTONOMOUS_EXPANSION_TEMPLATES.length];

  const planetLabel = getPlanetName(targetPlanetId);
  const cleanTitle = (options?.title || `${template.title} [${planetLabel.split("•")[0].trim()}]`).slice(0, 56);
  const category = options?.category || template.category;
  const color = PLANET_COLORS[(total + targetPlanetId * 3) % PLANET_COLORS.length];

  const prevNode = existingNodes[0];
  const connectedTo = prevNode ? [prevNode.id] : [];

  const seed = Date.now() + total * 97;
  return {
    id: `md-world-${Date.now()}-${Math.floor(Math.random() * 9999)}`,
    title: cleanTitle,
    category,
    status: "ACTIVE",
    theta: ((seed * 37) % 360) * (Math.PI / 180),
    phi: (30 + ((seed * 23) % 120)) * (Math.PI / 180),
    radius: 0.9 + (total % 4) * 0.08,
    sectorId: targetPlanetId,
    worldX: options?.customWorldNorm?.x,
    worldY: options?.customWorldNorm?.y,
    worldZ: options?.customWorldNorm?.z,
    color,
    whatItTakes:
      options?.command
        ? `Directive "${options.command.slice(0, 65)}" on ${planetLabel}`
        : template.whatItTakes,
    howItWorks: template.howItWorks,
    howItPerforms: options?.howItPerforms || template.howItPerforms,
    gini: Number((0.011 + ((seed % 25) * 0.001)).toFixed(3)),
    samples: 350 + (total * 45) % 2500,
    value: [350 + (total * 40) % 2200, 15 + (total % 19)],
    classLabel: (targetPlanetId % 2) as 0 | 1,
    confidence: 0.985 + ((total % 14) * 0.001),
    latencyMs: 10 + (seed % 25),
    apiUsed: "DUAL_SYNTHESIS",
    connectedTo,
    timestamp: new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }),
  };
}

export const buildExpandingMicroDecisionNode = createAutonomousWorldNode;
