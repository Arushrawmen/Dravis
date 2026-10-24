/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Dravis World — Autonomous Virtual Computer & OS Visualizer
 * Features:
 * - Full interactive simulated Windows 11 Desktop with Start Menu, Taskbar, Chrome, YouTube & Terminal
 * - Autonomous Google Search Simulation (types letter-by-letter, clicks, and loads Google results)
 * - Autonomous YouTube video player with live streaming preview
 * - Autonomous Virtual Mouse Cursor moving smoothly across the desktop
 * - Inter-Agent Live Communication Network (Dravis communicating with specialized AI agents)
 * - User Direct Click & Command pointer interface
 */

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Globe,
  Youtube,
  Terminal,
  Monitor,
  Search,
  Play,
  Pause,
  Maximize2,
  Minimize2,
  X,
  Volume2,
  Wifi,
  Sparkles,
  Bot,
  Send,
  ExternalLink,
  RefreshCw,
  Folder,
  Code,
  Layers,
  CheckCircle2,
  Cpu,
  ArrowRight
} from "lucide-react";
import { GoogleAdSenseBanner } from "../AdSense/GoogleAdSenseBanner";

interface DravisWorldOSProps {
  initialTask?: string;
  userName?: string;
  soundEffectsEnabled?: boolean;
}

interface AgentChatMessage {
  id: string;
  sender: "DRAVIS" | "AGENT_WEBSCOUT" | "AGENT_VISION" | "AGENT_CODEFORGE" | "AGENT_EXEC";
  text: string;
  timestamp: string;
  color: string;
}

export const DravisWorldOS: React.FC<DravisWorldOSProps> = ({
  initialTask = "Search Google for cheese",
  userName = "User",
  soundEffectsEnabled = true,
}) => {
  // Desktop Window states
  const [activeWindow, setActiveWindow] = useState<"CHROME" | "YOUTUBE" | "TERMINAL" | "NONE">("CHROME");
  const [isStartMenuOpen, setIsStartMenuOpen] = useState<boolean>(false);
  const [isAgentMeshOpen, setIsAgentMeshOpen] = useState<boolean>(true);

  // Chrome Browser State
  const [browserUrl, setBrowserUrl] = useState<string>("https://www.google.com");
  const [searchQuery, setSearchQuery] = useState<string>("cheese");
  const [searchSubmitted, setSearchSubmitted] = useState<boolean>(true);
  const [isTypingSearch, setIsTypingSearch] = useState<boolean>(false);

  // YouTube State
  const [isYoutubePlaying, setIsYoutubePlaying] = useState<boolean>(true);
  const [youtubeVideoTitle, setYoutubeVideoTitle] = useState<string>("How Cheese is Made: World's Most Famous Artisan Fromageries");

  // Terminal State
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    "[DRAVIS-OS] Kernel 6.12-asi initialized successfully.",
    "[NETWORK] Inter-Agent WebSocket Mesh connected on port 8080.",
    "[AUTONOMOUS] Desktop Automation Virtual Display active: 1920x1080@60Hz.",
    "[CHROME] Headless Browser spawned with Chromium engine.",
  ]);

  // Autonomous Cursor State
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number; clicking: boolean; label: string }>({
    x: 48,
    y: 42,
    clicking: false,
    label: "Browsing Google...",
  });

  // Direct user command input in Dravis World
  const [userCommandInput, setUserCommandInput] = useState<string>("");

  // Live Inter-Agent Messages Feed
  const [agentMessages, setAgentMessages] = useState<AgentChatMessage[]>([
    {
      id: "msg-1",
      sender: "DRAVIS",
      text: "Synchronizing with Global Agent Network. Requesting live web scrape on cheese varieties.",
      timestamp: "11:15 AM",
      color: "#38bdf8",
    },
    {
      id: "msg-2",
      sender: "AGENT_WEBSCOUT",
      text: "Query dispatched: 'cheese'. Found 14,200,000 index entries. Extracting top gastronomy data.",
      timestamp: "11:15 AM",
      color: "#34d399",
    },
    {
      id: "msg-3",
      sender: "AGENT_CODEFORGE",
      text: "Building micro-decision tree for cheese taxonomy and milk processing metrics.",
      timestamp: "11:16 AM",
      color: "#818cf8",
    },
    {
      id: "msg-4",
      sender: "AGENT_VISION",
      text: "Screen OCR active. Reading visual layout and user cursor focus point.",
      timestamp: "11:16 AM",
      color: "#fbbf24",
    },
  ]);

  // Autonomous simulated typing for Google Search
  const simulateGoogleSearch = (queryText: string) => {
    setActiveWindow("CHROME");
    setBrowserUrl("https://www.google.com");
    setSearchSubmitted(false);
    setIsTypingSearch(true);

    // 1. Move cursor to Google search box
    setCursorPos({ x: 50, y: 38, clicking: false, label: `Navigating to Google Search: "${queryText}"` });

    setTimeout(() => {
      setCursorPos((prev) => ({ ...prev, clicking: true, label: "Clicking Search Bar..." }));
    }, 600);

    // 2. Type query letter by letter
    let currentLetters = "";
    const letters = queryText.split("");
    let charIdx = 0;

    const typeInterval = setInterval(() => {
      if (charIdx < letters.length) {
        currentLetters += letters[charIdx];
        setSearchQuery(currentLetters);
        charIdx++;
      } else {
        clearInterval(typeInterval);
        setIsTypingSearch(false);
        // 3. Move cursor to search button & hit search
        setCursorPos({ x: 50, y: 46, clicking: true, label: "Hitting Enter on Google..." });
        setTimeout(() => {
          setSearchSubmitted(true);
          setBrowserUrl(`https://www.google.com/search?q=${encodeURIComponent(queryText)}`);
          setCursorPos({ x: 55, y: 55, clicking: false, label: `Reviewing results for "${queryText}"` });

          // Add to agent chat
          setAgentMessages((prev) => [
            ...prev,
            {
              id: "msg-" + Date.now(),
              sender: "AGENT_WEBSCOUT",
              text: `Google search executed for "${queryText}". Live preview loaded on Dravis Desktop.`,
              timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              color: "#34d399",
            },
          ]);

          setTerminalLogs((prev) => [
            ...prev,
            `[SEARCH] Google query parsed: "${queryText}" -> 200 OK. Results rendered.`,
          ]);
        }, 500);
      }
    }, 90);
  };

  // Run initial task on mount
  useEffect(() => {
    if (initialTask.toLowerCase().includes("cheese") || initialTask.toLowerCase().includes("google")) {
      simulateGoogleSearch("cheese");
    }
  }, []);

  // Periodic autonomous cursor movements on Dravis's desktop
  useEffect(() => {
    const idleMoveInterval = setInterval(() => {
      if (!isTypingSearch) {
        const randomX = 30 + Math.random() * 45;
        const randomY = 25 + Math.random() * 50;
        setCursorPos((prev) => ({
          ...prev,
          x: Math.round(randomX),
          y: Math.round(randomY),
          clicking: Math.random() > 0.6,
        }));
      }
    }, 3800);
    return () => clearInterval(idleMoveInterval);
  }, [isTypingSearch]);

  const handleUserCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userCommandInput.trim()) return;
    const cmd = userCommandInput.trim();
    setUserCommandInput("");

    if (cmd.toLowerCase().includes("youtube") || cmd.toLowerCase().includes("video")) {
      setActiveWindow("YOUTUBE");
      setYoutubeVideoTitle(cmd.replace(/youtube|video|play/gi, "").trim() || "Dravis Autonomous Research Stream");
      setIsYoutubePlaying(true);
      setCursorPos({ x: 62, y: 48, clicking: true, label: `Playing YouTube: "${cmd}"` });
      setAgentMessages((prev) => [
        ...prev,
        {
          id: "msg-" + Date.now(),
          sender: "DRAVIS",
          text: `Switching to YouTube player to stream: "${cmd}"`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          color: "#38bdf8",
        },
      ]);
    } else if (cmd.toLowerCase().includes("terminal") || cmd.toLowerCase().includes("cmd") || cmd.toLowerCase().includes("code")) {
      setActiveWindow("TERMINAL");
      setTerminalLogs((prev) => [...prev, `[USER-DIRECTIVE] $ ${cmd}`, `[RUN] Executing directive in background container...`]);
      setCursorPos({ x: 45, y: 60, clicking: true, label: `Executing: ${cmd}` });
    } else {
      // Default to Google search
      const cleanQ = cmd.replace(/google|search|pe|for|karo|bhai/gi, "").trim() || cmd;
      simulateGoogleSearch(cleanQ);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#01040f] text-slate-100 overflow-hidden font-sans select-none relative">
      {/* 1. Top Dravis World Command Bar */}
      <div className="px-5 py-2.5 bg-slate-950/80 border-b border-cyan-500/25 flex flex-wrap items-center justify-between gap-3 shrink-0 backdrop-blur-xl">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.3)]">
            <Monitor className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                DRAVIS WORLD • AUTONOMOUS COMPUTER OS
              </span>
              <span className="text-[9px] font-mono font-bold text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/40 animate-pulse">
                LIVE INTER-AGENT ACTIVE
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Watch Dravis interact with his personal Windows desktop, Google, YouTube, and communicate with specialized AI agents in real time.
            </p>
          </div>
        </div>

        {/* User Interactive Direct Instruction Bar */}
        <form onSubmit={handleUserCommandSubmit} className="flex items-center gap-2 flex-1 max-w-lg min-w-[280px]">
          <div className="relative flex-1">
            <input
              type="text"
              value={userCommandInput}
              onChange={(e) => setUserCommandInput(e.target.value)}
              placeholder="Tell Dravis: e.g. 'Google pe cheese search karo', 'Play YouTube video'..."
              className="w-full bg-slate-900/90 border border-cyan-500/35 focus:border-cyan-400 rounded-xl px-3.5 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold font-mono transition-all cursor-pointer shadow-md flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            <span>DISPATCH</span>
          </button>
        </form>

        <div className="flex items-center gap-2">
          {/* Preset Quick Actions */}
          <button
            type="button"
            onClick={() => simulateGoogleSearch("cheese")}
            className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-cyan-500/20 border border-white/10 hover:border-cyan-400 text-[11px] font-mono text-cyan-200 cursor-pointer transition-all"
          >
            Google: "cheese"
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveWindow("YOUTUBE");
              setIsYoutubePlaying(true);
            }}
            className="px-2.5 py-1 rounded-lg bg-red-500/15 hover:bg-red-500/25 border border-red-500/40 text-[11px] font-mono text-red-200 cursor-pointer transition-all flex items-center gap-1"
          >
            <Youtube className="w-3 h-3 text-red-400" />
            <span>YouTube Stream</span>
          </button>
          <button
            type="button"
            onClick={() => setIsAgentMeshOpen((prev) => !prev)}
            className={`px-2.5 py-1 rounded-lg border text-[11px] font-mono cursor-pointer transition-all ${
              isAgentMeshOpen
                ? "bg-purple-500/25 border-purple-400 text-purple-200"
                : "bg-white/5 border-white/10 text-slate-300"
            }`}
          >
            {isAgentMeshOpen ? "Hide Agent Mesh" : "Agent Mesh (4 Agents)"}
          </button>
        </div>
      </div>

      {/* 2. Main Stage: Simulated Windows 11 Desktop + Agent Mesh Sidebar */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* The Windows Desktop Container */}
        <div className="flex-1 flex flex-col bg-gradient-to-br from-[#020b1f] via-[#051433] to-[#010816] relative overflow-hidden">
          {/* Desktop Wallpaper Texture & Watermark */}
          <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(ellipse_at_center,rgba(56,189,248,0.25)_0%,transparent_70%)]" />

          {/* Desktop Icons on left */}
          <div className="absolute top-4 left-4 flex flex-col gap-5 z-10">
            <button
              type="button"
              onClick={() => {
                setActiveWindow("CHROME");
                setBrowserUrl("https://www.google.com");
              }}
              className="flex flex-col items-center gap-1 w-16 p-2 rounded-xl hover:bg-white/10 transition-colors text-center cursor-pointer group"
            >
              <div className="w-11 h-11 rounded-2xl bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                <Globe className="w-6 h-6 text-cyan-300" />
              </div>
              <span className="text-[10px] text-slate-200 font-medium leading-tight drop-shadow">
                Chrome
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveWindow("YOUTUBE");
                setIsYoutubePlaying(true);
              }}
              className="flex flex-col items-center gap-1 w-16 p-2 rounded-xl hover:bg-white/10 transition-colors text-center cursor-pointer group"
            >
              <div className="w-11 h-11 rounded-2xl bg-red-500/20 border border-red-500/50 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                <Youtube className="w-6 h-6 text-red-400" />
              </div>
              <span className="text-[10px] text-slate-200 font-medium leading-tight drop-shadow">
                YouTube
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveWindow("TERMINAL")}
              className="flex flex-col items-center gap-1 w-16 p-2 rounded-xl hover:bg-white/10 transition-colors text-center cursor-pointer group"
            >
              <div className="w-11 h-11 rounded-2xl bg-purple-500/20 border border-purple-400/50 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                <Terminal className="w-6 h-6 text-purple-300" />
              </div>
              <span className="text-[10px] text-slate-200 font-medium leading-tight drop-shadow">
                Terminal
              </span>
            </button>
          </div>

          {/* ACTIVE WINDOW: GOOGLE CHROME */}
          {activeWindow === "CHROME" && (
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="absolute inset-8 bottom-14 rounded-2xl bg-slate-950/95 border border-cyan-500/40 shadow-2xl flex flex-col overflow-hidden backdrop-blur-2xl z-20"
            >
              {/* Chrome Titlebar & Tabs */}
              <div className="px-3 py-2 bg-slate-900 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 px-3 py-1 rounded-t-xl bg-slate-950 border border-b-0 border-white/10 text-xs font-medium text-white flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Google — Dravis Browser</span>
                    <X
                      className="w-3 h-3 text-slate-400 hover:text-white ml-2 cursor-pointer"
                      onClick={() => setActiveWindow("NONE")}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveWindow("NONE")}
                    className="p-1 text-slate-400 hover:text-white cursor-pointer"
                  >
                    <Minimize2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveWindow("NONE")}
                    className="p-1 text-slate-400 hover:text-rose-400 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Chrome Address Bar */}
              <div className="px-4 py-2 bg-slate-900/60 border-b border-white/5 flex items-center gap-3">
                <div className="flex items-center gap-1 text-slate-400">
                  <span className="text-xs hover:text-white cursor-pointer">←</span>
                  <span className="text-xs hover:text-white cursor-pointer">→</span>
                  <RefreshCw className="w-3 h-3 hover:text-white cursor-pointer ml-1" />
                </div>
                <div className="flex-1 px-3 py-1 rounded-xl bg-slate-950 border border-white/10 text-xs font-mono text-cyan-300 flex items-center justify-between">
                  <span>{browserUrl}</span>
                  <span className="text-[10px] text-emerald-400 font-bold">🔒 SECURE</span>
                </div>
              </div>

              {/* Web Page Viewport */}
              <div className="flex-1 bg-[#202124] text-slate-100 overflow-y-auto p-6 flex flex-col items-center">
                {!searchSubmitted ? (
                  // Google Home Search State
                  <div className="w-full max-w-xl flex flex-col items-center mt-12 gap-6">
                    <div className="flex items-center gap-1 text-4xl sm:text-5xl font-bold tracking-tight">
                      <span className="text-[#4285F4]">G</span>
                      <span className="text-[#EA4335]">o</span>
                      <span className="text-[#FBBC05]">o</span>
                      <span className="text-[#4285F4]">g</span>
                      <span className="text-[#34A853]">l</span>
                      <span className="text-[#EA4335]">e</span>
                    </div>

                    <div className="w-full relative">
                      <div className="w-full px-4 py-3 rounded-full bg-[#303134] border border-[#5f6368] hover:bg-[#3c4043] flex items-center gap-3 shadow-lg">
                        <Search className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-white font-sans flex-1">
                          {searchQuery}
                          {isTypingSearch && <span className="animate-pulse">|</span>}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 mt-2">
                      <button
                        type="button"
                        onClick={() => simulateGoogleSearch(searchQuery)}
                        className="px-4 py-2 rounded bg-[#303134] hover:bg-[#3c4043] text-xs text-slate-200"
                      >
                        Google Search
                      </button>
                      <button
                        type="button"
                        onClick={() => simulateGoogleSearch(searchQuery)}
                        className="px-4 py-2 rounded bg-[#303134] hover:bg-[#3c4043] text-xs text-slate-200"
                      >
                        I'm Feeling Lucky
                      </button>
                    </div>
                  </div>
                ) : (
                  // Google Search Results State for Cheese
                  <div className="w-full max-w-3xl flex flex-col gap-5 text-left">
                    <div className="text-xs text-slate-400 border-b border-[#3c4043] pb-3">
                      About 14,200,000 results (0.34 seconds) for "{searchQuery}"
                    </div>

                    {/* Result 1: Cheese Overview */}
                    <div className="flex flex-col gap-1 p-3 rounded-xl hover:bg-[#303134]/40 transition-colors">
                      <span className="text-xs text-slate-400">https://en.wikipedia.org › wiki › Cheese</span>
                      <h3 className="text-base font-medium text-[#8ab4f8] hover:underline cursor-pointer">
                        Cheese - Wikipedia, the free encyclopedia
                      </h3>
                      <p className="text-xs text-[#bdc1c6] leading-relaxed">
                        Cheese is a dairy product produced in wide ranges of flavors, textures, and forms by coagulation of the milk protein casein. Comprising proteins and fat from milk, usually the milk of cows, buffalo, goats, or sheep.
                      </p>
                    </div>

                    {/* Result 2: Top Varieties */}
                    <div className="flex flex-col gap-1 p-3 rounded-xl hover:bg-[#303134]/40 transition-colors">
                      <span className="text-xs text-slate-400">https://www.cheese.com › alphabetical</span>
                      <h3 className="text-base font-medium text-[#8ab4f8] hover:underline cursor-pointer">
                        All Cheese Types & Artisanal Guide (Over 1,800 Varieties)
                      </h3>
                      <p className="text-xs text-[#bdc1c6] leading-relaxed">
                        Explore Cheddar, Brie, Gouda, Mozzarella, Parmesan, Roquefort, and artisanal aged cheeses. Dravis Autonomous Scraper has indexed chemical composition, aging profiles, and culinary pairings.
                      </p>
                    </div>

                    {/* Google AdSense Sponsored Ad Placement */}
                    <div className="my-1">
                      <GoogleAdSenseBanner
                        client="ca-pub-2203384651585087"
                        variant="HORIZONTAL_LEADERBOARD"
                        className="border-cyan-500/20"
                      />
                    </div>

                    {/* Result 3: Live Video Card */}
                    <div className="p-4 rounded-2xl bg-[#303134] border border-[#5f6368] flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400">
                          <Youtube className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white">How 100-Year-Old Traditional Cheese is Crafted</div>
                          <div className="text-[11px] text-slate-400">YouTube • 4K Documentary • 4.8M Views</div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveWindow("YOUTUBE");
                          setIsYoutubePlaying(true);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-1 cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>Watch on YouTube</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ACTIVE WINDOW: YOUTUBE PLAYER */}
          {activeWindow === "YOUTUBE" && (
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="absolute inset-8 bottom-14 rounded-2xl bg-black border border-red-500/40 shadow-2xl flex flex-col overflow-hidden backdrop-blur-2xl z-20"
            >
              {/* YouTube Header */}
              <div className="px-4 py-2.5 bg-[#0f0f0f] border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-red-600 text-white font-bold text-xs">
                    <Youtube className="w-4 h-4" />
                    <span>YouTube Premium</span>
                  </div>
                  <span className="text-xs text-slate-300 font-medium truncate max-w-md">
                    {youtubeVideoTitle}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveWindow("NONE")}
                    className="p-1 text-slate-400 hover:text-white cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* YouTube Video Player Simulation */}
              <div className="flex-1 bg-black flex flex-col lg:flex-row overflow-hidden">
                <div className="flex-1 flex flex-col justify-between p-4 bg-[#050505] relative">
                  {/* Video Screen Area */}
                  <div className="w-full h-full rounded-2xl bg-gradient-to-tr from-[#0a1128] via-[#050505] to-[#1e0505] border border-white/10 flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(239,68,68,0.15)_0%,transparent_70%)] animate-pulse" />
                    <div className="w-16 h-16 rounded-full bg-red-600/90 hover:bg-red-500 text-white flex items-center justify-center shadow-2xl z-10 cursor-pointer">
                      {isYoutubePlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
                    </div>
                    <div className="mt-4 z-10">
                      <h2 className="text-base font-bold text-white max-w-lg">{youtubeVideoTitle}</h2>
                      <p className="text-xs text-slate-400 mt-1">Dravis Autonomous Video Player • 1080p 60fps Active Stream</p>
                    </div>

                    {/* Progress Bar & Controls at bottom */}
                    <div className="absolute bottom-3 inset-x-4 flex items-center gap-3 px-3 py-2 rounded-xl bg-black/80 backdrop-blur-md border border-white/10 text-xs">
                      <button
                        type="button"
                        onClick={() => setIsYoutubePlaying(!isYoutubePlaying)}
                        className="text-white hover:text-red-400"
                      >
                        {isYoutubePlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </button>
                      <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
                        <div className="h-full bg-red-600 rounded-full w-[42%] animate-pulse" />
                      </div>
                      <span className="text-[10px] text-slate-300 font-mono">14:20 / 32:45</span>
                      <Volume2 className="w-4 h-4 text-slate-300" />
                    </div>
                  </div>
                </div>

                {/* Right Side: Up Next Video List */}
                <div className="w-full lg:w-72 bg-[#0f0f0f] border-t lg:border-t-0 lg:border-l border-white/10 p-3 overflow-y-auto space-y-2">
                  <div className="text-xs font-bold text-white mb-2">Up Next for Dravis:</div>
                  {[
                    "Artisanal French Roquefort Vaults",
                    "How Parmesan Wheels are Inspected with Sound Hammers",
                    "Swiss Gruyère AOC Century Cave Secrets",
                    "AI Agents Navigating Web Browsers with Vision",
                  ].map((title, i) => (
                    <div
                      key={i}
                      onClick={() => setYoutubeVideoTitle(title)}
                      className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 cursor-pointer flex gap-2 items-center"
                    >
                      <div className="w-14 h-9 rounded-lg bg-red-950/60 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
                        <Play className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[11px] font-medium text-white truncate">{title}</div>
                        <div className="text-[9px] text-slate-400">1080p • Ready to Stream</div>
                      </div>
                    </div>
                  ))}

                  {/* Google AdSense Sponsored Unit */}
                  <div className="pt-2 border-t border-white/10">
                    <GoogleAdSenseBanner
                      client="ca-pub-2203384651585087"
                      variant="SIDEBAR_BOX"
                      className="border-red-500/20"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ACTIVE WINDOW: TERMINAL CONSOLE */}
          {activeWindow === "TERMINAL" && (
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="absolute inset-8 bottom-14 rounded-2xl bg-black/95 border border-purple-500/40 shadow-2xl flex flex-col overflow-hidden backdrop-blur-2xl z-20 font-mono"
            >
              <div className="px-4 py-2 bg-slate-900 border-b border-white/10 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-purple-300">
                  <Terminal className="w-4 h-4" />
                  <span>Dravis Terminal — Virtual Linux Subsystem</span>
                </div>
                <X className="w-4 h-4 text-slate-400 hover:text-white cursor-pointer" onClick={() => setActiveWindow("NONE")} />
              </div>
              <div className="flex-1 p-4 overflow-y-auto text-xs text-emerald-400 space-y-1">
                {terminalLogs.map((log, i) => (
                  <div key={i}>{log}</div>
                ))}
                <div className="flex items-center gap-1.5 text-white mt-2">
                  <span className="text-cyan-400">dravis@asi-core:~$</span>
                  <span className="w-2 h-4 bg-cyan-400 animate-pulse" />
                </div>
              </div>
            </motion.div>
          )}

          {/* AUTONOMOUS MOUSE CURSOR */}
          <motion.div
            animate={{
              left: `${cursorPos.x}%`,
              top: `${cursorPos.y}%`,
              scale: cursorPos.clicking ? 0.9 : 1,
            }}
            transition={{ type: "spring", stiffness: 140, damping: 20 }}
            className="absolute z-50 pointer-events-none flex items-center gap-2"
          >
            <div className="relative flex items-center justify-center">
              <div className="w-6 h-6 rounded-full bg-cyan-400/30 border border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.9)] animate-ping absolute" />
              <div className="w-3.5 h-3.5 rotate-[-45deg] border-t-2 border-l-2 border-white bg-cyan-400 shadow-md" />
            </div>
            <div className="px-2.5 py-1 rounded-lg bg-black/90 border border-cyan-400/60 text-[10px] font-mono text-cyan-200 shadow-xl whitespace-nowrap">
              <span className="text-white font-bold">DRAVIS CURSOR:</span> {cursorPos.label}
            </div>
          </motion.div>

          {/* SIMULATED WINDOWS 11 TASKBAR AT BOTTOM */}
          <div className="absolute bottom-0 inset-x-0 h-11 bg-slate-950/90 border-t border-white/10 backdrop-blur-2xl flex items-center justify-between px-3 z-30">
            {/* Center Pinned Apps */}
            <div className="flex items-center gap-1 mx-auto">
              {/* Windows Start Button */}
              <button
                type="button"
                onClick={() => setIsStartMenuOpen(!isStartMenuOpen)}
                className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer text-cyan-400"
                title="Windows Start"
              >
                <div className="grid grid-cols-2 gap-0.5 w-4 h-4">
                  <div className="bg-cyan-400 rounded-sm" />
                  <div className="bg-cyan-400 rounded-sm" />
                  <div className="bg-cyan-400 rounded-sm" />
                  <div className="bg-cyan-400 rounded-sm" />
                </div>
              </button>

              {/* Taskbar Chrome */}
              <button
                type="button"
                onClick={() => setActiveWindow("CHROME")}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                  activeWindow === "CHROME" ? "bg-cyan-500/20 text-cyan-300 border-b-2 border-cyan-400" : "hover:bg-white/10 text-slate-300"
                }`}
              >
                <Globe className="w-4 h-4" />
              </button>

              {/* Taskbar YouTube */}
              <button
                type="button"
                onClick={() => setActiveWindow("YOUTUBE")}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                  activeWindow === "YOUTUBE" ? "bg-red-500/20 text-red-400 border-b-2 border-red-500" : "hover:bg-white/10 text-slate-300"
                }`}
              >
                <Youtube className="w-4 h-4" />
              </button>

              {/* Taskbar Terminal */}
              <button
                type="button"
                onClick={() => setActiveWindow("TERMINAL")}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                  activeWindow === "TERMINAL" ? "bg-purple-500/20 text-purple-300 border-b-2 border-purple-500" : "hover:bg-white/10 text-slate-300"
                }`}
              >
                <Terminal className="w-4 h-4" />
              </button>
            </div>

            {/* Right System Tray */}
            <div className="flex items-center gap-2.5 text-[11px] font-mono text-slate-400 pr-2">
              <Wifi className="w-3.5 h-3.5 text-cyan-400" />
              <Volume2 className="w-3.5 h-3.5" />
              <span>{new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
            </div>
          </div>
        </div>

        {/* 3. Right: Inter-Agent Communication Mesh Panel */}
        <AnimatePresence>
          {isAgentMeshOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 340, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="bg-slate-950 border-l border-white/10 flex flex-col shrink-0 overflow-hidden font-mono text-xs z-30"
            >
              <div className="px-4 py-3 bg-slate-900 border-b border-white/10 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4 text-purple-400" />
                  <span className="font-bold text-white text-[11px]">Inter-Agent Mesh</span>
                </div>
                <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                  4 Connected
                </span>
              </div>

              {/* Live Agent Conversation Feed */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {agentMessages.map((msg) => (
                  <div key={msg.id} className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex flex-col gap-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-bold" style={{ color: msg.color }}>
                        {msg.sender}
                      </span>
                      <span className="text-slate-500">{msg.timestamp}</span>
                    </div>
                    <p className="text-[11px] text-slate-200 font-sans leading-relaxed">
                      {msg.text}
                    </p>
                  </div>
                ))}
              </div>

              {/* Connected Agents List */}
              <div className="p-3 border-t border-white/10 bg-slate-900/40 shrink-0 space-y-1.5 text-[10px]">
                <div className="text-slate-400 font-bold uppercase tracking-wider">Active Cognitive Mesh:</div>
                <div className="flex items-center justify-between text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    Dravis Core ASI
                  </span>
                  <span className="text-cyan-300">Supreme Lead</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Agent-WebScout
                  </span>
                  <span className="text-emerald-300">Live Browser</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    Agent-Vision
                  </span>
                  <span className="text-amber-300">OCR & Display</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                    Agent-CodeForge
                  </span>
                  <span className="text-purple-300">Synthesis Engine</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
