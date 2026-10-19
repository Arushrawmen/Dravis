/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * DRAVIS Brain Memory Bank, Active Projects Tracker, Searchable Timeline & Windows App Launcher / Auto-Installer
 */

import React, { useState } from "react";
import {
  Database,
  Search,
  Plus,
  Trash2,
  Brain,
  FolderGit2,
  History as HistoryIcon,
  Monitor,
  Play,
  Download,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  Terminal,
  Cpu,
  Layers,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Copy,
  Check,
} from "lucide-react";
import {
  MemoryEntry,
  MessageItem,
  ProjectItem,
  WindowsAppEntry,
  WindowsInstallRecommendation,
  TimelineActionLog,
} from "../types";
import { soundEffects } from "../utils/audioSynth";

interface HistoryViewProps {
  memories: MemoryEntry[];
  messages: MessageItem[];
  projects?: ProjectItem[];
  windowsApps?: WindowsAppEntry[];
  timelineLogs?: TimelineActionLog[];
  onAddMemory: (entry: Omit<MemoryEntry, "id" | "lastUpdated">) => void;
  onDeleteMemory: (id: string) => void;
  onAddOrUpdateProject?: (project: ProjectItem) => void;
  onDeleteProject?: (id: string) => void;
  onLaunchWindowsApp?: (app: WindowsAppEntry) => void;
  onAddWindowsApp?: (app: WindowsAppEntry) => void;
  onSearchAndInstallWindowsApp?: (appName: string) => Promise<WindowsInstallRecommendation | null>;
  onReplayCommand?: (cmd: string) => void;
  onAutoExtractFromText?: (text: string) => Promise<void>;
  latestInstallRecommendation?: WindowsInstallRecommendation | null;
  soundEffectsEnabled: boolean;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  memories,
  messages,
  projects = [],
  windowsApps = [],
  timelineLogs = [],
  onAddMemory,
  onDeleteMemory,
  onAddOrUpdateProject,
  onDeleteProject,
  onLaunchWindowsApp,
  onAddWindowsApp,
  onSearchAndInstallWindowsApp,
  onReplayCommand,
  onAutoExtractFromText,
  latestInstallRecommendation,
  soundEffectsEnabled,
}) => {
  const [activeTab, setActiveTab] = useState<
    "MEMORY" | "PROJECTS" | "TIMELINE" | "WINDOWS_APPS"
  >("MEMORY");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");

  // Quick Neural Teach Input
  const [teachInput, setTeachInput] = useState("");
  const [isTeaching, setIsTeaching] = useState(false);

  // Add Memory Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCategory, setNewCategory] = useState<MemoryEntry["category"]>("PREFERENCE");
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");

  // Add Project Modal
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [projName, setProjName] = useState("");
  const [projDesc, setProjDesc] = useState("");
  const [projTech, setProjTech] = useState("React, TypeScript, Windows PC");
  const [projGoal, setProjGoal] = useState("");

  // Windows App Search & Auto-Installer
  const [winSearchQuery, setWinSearchQuery] = useState("");
  const [isSearchingWinApp, setIsSearchingWinApp] = useState(false);
  const [localRecommendation, setLocalRecommendation] =
    useState<WindowsInstallRecommendation | null>(null);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  // Add Custom Windows App Modal
  const [showAddWinAppModal, setShowAddWinAppModal] = useState(false);
  const [customAppName, setCustomAppName] = useState("");
  const [customAppAliases, setCustomAppAliases] = useState("");
  const [customAppExe, setCustomAppExe] = useState("");
  const [customAppUri, setCustomAppUri] = useState("");
  const [customAppWinget, setCustomAppWinget] = useState("");

  const activeRec = localRecommendation || latestInstallRecommendation || null;

  const filteredMemories = memories.filter((m) => {
    const matchesCategory = categoryFilter === "ALL" || m.category === categoryFilter;
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      (m.key || "").toLowerCase().includes(q) ||
      (m.value || m.fact || "").toLowerCase().includes(q) ||
      (m.category || "").toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  const handleSaveMemory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey.trim() || !newValue.trim()) return;
    if (soundEffectsEnabled) soundEffects.playActivatePulse();
    onAddMemory({
      category: newCategory,
      key: newKey.trim(),
      value: newValue.trim(),
      confidence: 1.0,
      source: "MANUAL",
    });
    setNewKey("");
    setNewValue("");
    setShowAddModal(false);
  };

  const handleQuickTeachBrain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teachInput.trim() || isTeaching) return;
    if (soundEffectsEnabled) soundEffects.playActivatePulse();
    setIsTeaching(true);
    try {
      if (onAutoExtractFromText) {
        await onAutoExtractFromText(teachInput.trim());
      } else {
        onAddMemory({
          category: "FACT",
          key: "User Taught Fact",
          value: teachInput.trim(),
          confidence: 0.99,
          source: "VOICE_LEARNED",
        });
      }
      setTeachInput("");
    } finally {
      setIsTeaching(false);
    }
  };

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projName.trim()) return;
    if (soundEffectsEnabled) soundEffects.playActivatePulse();
    const newProj: ProjectItem = {
      id: "proj-" + Date.now(),
      name: projName.trim(),
      description: projDesc.trim() || `Active project managed in DRAVIS Brain Memory Bank.`,
      status: "IN_PROGRESS",
      techStack: projTech
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      goals: projGoal.trim() ? [projGoal.trim()] : ["Complete core milestone"],
      nextSteps: ["Execute next development task with DRAVIS"],
      linkedFiles: [],
      progressPercent: 25,
      lastUpdated: "Just now",
      source: "MANUAL",
    };
    onAddOrUpdateProject?.(newProj);
    onAddMemory({
      category: "PROJECT",
      key: `Active Project: ${newProj.name}`,
      value: `${newProj.description} (Tech: ${newProj.techStack.join(", ")})`,
      confidence: 1.0,
      source: "MANUAL",
    });
    setProjName("");
    setProjDesc("");
    setProjGoal("");
    setShowProjectModal(false);
  };

  const handleWinAppAgentSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!winSearchQuery.trim() || isSearchingWinApp) return;
    if (soundEffectsEnabled) soundEffects.playActivatePulse();
    setIsSearchingWinApp(true);
    try {
      if (onSearchAndInstallWindowsApp) {
        const rec = await onSearchAndInstallWindowsApp(winSearchQuery.trim());
        if (rec) setLocalRecommendation(rec);
      }
    } finally {
      setIsSearchingWinApp(false);
    }
  };

  const handleSaveCustomWinApp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customAppName.trim()) return;
    if (soundEffectsEnabled) soundEffects.playActivatePulse();
    const newApp: WindowsAppEntry = {
      id: "win-custom-" + Date.now(),
      name: customAppName.trim(),
      voiceAliases: customAppAliases
        ? customAppAliases
            .split(",")
            .map((a) => a.trim().toLowerCase())
            .filter(Boolean)
        : [customAppName.trim().toLowerCase()],
      category: "CUSTOM",
      uriProtocol: customAppUri.trim() || undefined,
      exePath:
        customAppExe.trim() ||
        `C:\\Program Files\\${customAppName.trim()}\\${customAppName
          .trim()
          .replace(/\s+/g, "")}.exe`,
      wingetId: customAppWinget.trim() || `Custom.${customAppName.trim().replace(/\s+/g, "")}`,
      officialDownloadUrl: `https://www.google.com/search?q=download+${encodeURIComponent(
        customAppName.trim()
      )}+windows`,
      publisher: "User Registered Windows App",
      isInstalled: true,
      lastLaunched: "Ready",
    };
    onAddWindowsApp?.(newApp);
    setCustomAppName("");
    setCustomAppAliases("");
    setCustomAppExe("");
    setCustomAppUri("");
    setCustomAppWinget("");
    setShowAddWinAppModal(false);
  };

  const handleDownloadWindowsBridge = () => {
    if (soundEffectsEnabled) soundEffects.playActivatePulse();
    const bridgeScript = `@echo off
title DRAVIS Full-Windows Desktop, Cursor & App Installer Bridge
echo ============================================================================
echo   DRAVIS FULL-SYSTEM WINDOWS BRIDGE (LOCAL PORT 47831)
echo   Enables Native Windows App Launching, Cursor Control & Winget Auto-Install
echo ============================================================================
echo.
python -c "import http.server, json, subprocess, os, webbrowser; \\
class H(http.server.BaseHTTPRequestHandler): \\
  def do_OPTIONS(self): \\
    self.send_response(200); self.send_header('Access-Control-Allow-Origin','*'); self.send_header('Access-Control-Allow-Headers','*'); self.end_headers() \\
  def do_POST(self): \\
    l=int(self.headers.get('Content-Length',0)); d=json.loads(self.rfile.read(l) or b'{}'); cmd=d.get('command',''); exe=d.get('exePath',''); \\
    print('[DRAVIS WINDOWS AGENT] Executing:', cmd or exe); \\
    subprocess.Popen(cmd or exe, shell=True); \\
    self.send_response(200); self.send_header('Access-Control-Allow-Origin','*'); self.send_header('Content-Type','application/json'); self.end_headers(); \\
    self.wfile.write(b'{\"success\":true}') \\
http.server.HTTPServer(('127.0.0.1', 47831), H).serve_forever()"
pause
`;
    const blob = new Blob([bridgeScript], { type: "application/bat" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "dravis_windows_bridge.bat";
    a.click();
  };

  return (
    <div
      id="dravis-history-view"
      className="flex-1 flex flex-col h-full bg-slate-950/35 p-3 sm:p-5 gap-4 overflow-y-auto custom-scrollbar"
    >
      {/* Top Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 px-4 py-3.5 rounded-2xl border border-cyan-500/25 bg-slate-950/50 backdrop-blur-2xl shadow-[0_0_25px_rgba(0,0,0,0.4)]">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/15 border border-cyan-400/40 text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.25)]">
            <Brain className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-white font-mono tracking-wider">
                DRAVIS BRAIN MEMORY BANK & WINDOWS OS CONTROL
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                AUTO-LEARNING ACTIVE
              </span>
            </div>
            <span className="text-xs text-slate-300 font-mono">
              Stores Everything Learned From You • Active Projects • Voice History • Native Windows App Launcher & Installer
            </span>
          </div>
        </div>

        {/* 4-Module Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 bg-black/45 p-1.5 rounded-xl border border-white/10">
          <button
            onClick={() => {
              if (soundEffectsEnabled) soundEffects.playChirp();
              setActiveTab("MEMORY");
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "MEMORY"
                ? "bg-cyan-500/25 text-cyan-200 border border-cyan-400/50 shadow-[0_0_12px_rgba(34,211,238,0.25)]"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>BRAIN VAULT ({memories.length})</span>
          </button>

          <button
            onClick={() => {
              if (soundEffectsEnabled) soundEffects.playChirp();
              setActiveTab("PROJECTS");
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "PROJECTS"
                ? "bg-violet-500/25 text-violet-200 border border-violet-400/50 shadow-[0_0_12px_rgba(167,139,250,0.25)]"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <FolderGit2 className="w-3.5 h-3.5" />
            <span>ACTIVE PROJECTS ({projects.length})</span>
          </button>

          <button
            onClick={() => {
              if (soundEffectsEnabled) soundEffects.playChirp();
              setActiveTab("TIMELINE");
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "TIMELINE"
                ? "bg-emerald-500/25 text-emerald-200 border border-emerald-400/50 shadow-[0_0_12px_rgba(52,211,153,0.25)]"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <HistoryIcon className="w-3.5 h-3.5" />
            <span>HISTORY TIMELINE ({messages.length + timelineLogs.length})</span>
          </button>

          <button
            onClick={() => {
              if (soundEffectsEnabled) soundEffects.playChirp();
              setActiveTab("WINDOWS_APPS");
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "WINDOWS_APPS"
                ? "bg-amber-500/25 text-amber-200 border border-amber-400/50 shadow-[0_0_12px_rgba(245,158,11,0.25)]"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>WINDOWS APPS ({windowsApps.length})</span>
          </button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* TAB 1: PERSONAL BRAIN VAULT                                           */}
      {/* ===================================================================== */}
      {activeTab === "MEMORY" && (
        <div className="flex flex-col gap-4">
          {/* Instant "Teach Dravis Brain" Bar */}
          <form
            onSubmit={handleQuickTeachBrain}
            className="p-3.5 rounded-2xl border border-cyan-500/30 bg-cyan-950/20 backdrop-blur-xl flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5"
          >
            <div className="flex items-center gap-2 text-cyan-300 font-mono text-xs font-bold shrink-0">
              <Sparkles className="w-4 h-4 animate-spin" />
              <span>TEACH BRAIN:</span>
            </div>
            <input
              type="text"
              value={teachInput}
              onChange={(e) => setTeachInput(e.target.value)}
              placeholder="Tell Dravis anything about you, your habits, or the project you are working on (auto-extracts into Brain)..."
              className="flex-1 bg-black/40 border border-white/15 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
            />
            <button
              type="submit"
              disabled={isTeaching}
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
            >
              {isTeaching ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>STORING...</span>
                </>
              ) : (
                <>
                  <Brain className="w-3.5 h-3.5" />
                  <span>STORE IN BRAIN</span>
                </>
              )}
            </button>
          </form>

          {/* Search & Category Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search personal facts, learned habits, rules, or project notes..."
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400/60 font-mono"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {(["ALL", "IDENTITY", "PREFERENCE", "PROJECT", "HABIT", "TASK", "FACT", "RULE"] as const).map(
                (cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer ${
                      categoryFilter === cat
                        ? "bg-cyan-500/25 text-cyan-200 border border-cyan-400/50"
                        : "bg-white/5 text-slate-400 hover:text-white border border-white/10"
                    }`}
                  >
                    {cat}
                  </button>
                )
              )}

              <button
                onClick={() => {
                  if (soundEffectsEnabled) soundEffects.playChirp();
                  setShowAddModal(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/20 border border-cyan-400/40 hover:bg-cyan-500/30 text-cyan-300 font-mono text-xs font-bold transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>ADD FACT</span>
              </button>
            </div>
          </div>

          {/* Memory Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredMemories.map((mem) => {
              const confPct =
                typeof mem.confidence === "number"
                  ? mem.confidence <= 1
                    ? Math.round(mem.confidence * 100)
                    : Math.round(mem.confidence)
                  : 98;
              return (
                <div
                  key={mem.id}
                  className="p-4 rounded-2xl border border-white/15 bg-slate-950/45 hover:border-cyan-400/40 transition-all flex flex-col justify-between gap-2.5 shadow-[0_0_20px_rgba(0,0,0,0.25)]"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded-md bg-cyan-500/15 border border-cyan-400/30 text-[10px] font-mono text-cyan-300 font-bold">
                        {mem.category}
                      </span>
                      <h4 className="text-xs font-bold text-white font-mono">{mem.key}</h4>
                    </div>

                    <button
                      onClick={() => {
                        if (soundEffectsEnabled) soundEffects.playAlert();
                        onDeleteMemory(mem.id);
                      }}
                      className="p-1 rounded text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                      title="Delete from Brain"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <p className="text-xs text-slate-200 font-sans leading-relaxed">
                    {mem.value || mem.fact}
                  </p>

                  <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span>
                      Confidence: <span className="text-emerald-400 font-bold">{confPct}%</span>
                    </span>
                    <span>
                      Source: <span className="text-cyan-300">{mem.source || "VOICE_LEARNED"}</span>
                    </span>
                    <span>{mem.lastUpdated || mem.timestamp || mem.createdAt || "Active"}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: ACTIVE PROJECTS TRACKER                                        */}
      {/* ===================================================================== */}
      {activeTab === "PROJECTS" && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border border-violet-500/30 bg-violet-950/20 backdrop-blur-xl">
            <div>
              <h4 className="text-xs sm:text-sm font-bold font-mono text-white flex items-center gap-2">
                <FolderGit2 className="w-4 h-4 text-violet-400" />
                <span>ACTIVE OPERATOR PROJECTS IN BRAIN MEMORY</span>
              </h4>
              <p className="text-xs text-slate-300 mt-0.5">
                Whatever project you are working on is stored here so Dravis can write code, open tools, and advance your work automatically.
              </p>
            </div>
            <button
              onClick={() => {
                if (soundEffectsEnabled) soundEffects.playChirp();
                setShowProjectModal(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-violet-500 hover:bg-violet-400 text-slate-950 font-mono text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>NEW PROJECT</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {projects.map((proj) => (
              <div
                key={proj.id}
                className="p-4 rounded-2xl border border-white/15 bg-slate-950/50 hover:border-violet-400/40 transition-all flex flex-col justify-between gap-3"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="px-2 py-0.5 rounded bg-violet-500/20 border border-violet-400/40 text-violet-300 font-mono text-[10px] font-bold">
                        {proj.status} • {proj.progressPercent}%
                      </span>
                      <h3 className="text-sm font-bold font-mono text-white mt-1.5">
                        {proj.name}
                      </h3>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <select
                        value={proj.status}
                        onChange={(e) => {
                          onAddOrUpdateProject?.({
                            ...proj,
                            status: e.target.value as ProjectItem["status"],
                            progressPercent:
                              e.target.value === "COMPLETED"
                                ? 100
                                : e.target.value === "TESTING"
                                ? 85
                                : proj.progressPercent,
                            lastUpdated: "Just now",
                          });
                        }}
                        className="bg-black/50 border border-white/15 rounded-lg px-2 py-1 text-[10px] font-mono text-cyan-300"
                      >
                        <option value="PLANNING">PLANNING</option>
                        <option value="IN_PROGRESS">IN_PROGRESS</option>
                        <option value="TESTING">TESTING</option>
                        <option value="COMPLETED">COMPLETED</option>
                      </select>

                      {onDeleteProject && (
                        <button
                          onClick={() => onDeleteProject(proj.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">{proj.description}</p>

                  {/* Progress Bar */}
                  <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-400 to-violet-400 transition-all duration-500"
                      style={{ width: `${proj.progressPercent}%` }}
                    />
                  </div>

                  {/* Tech Stack */}
                  <div className="flex flex-wrap gap-1.5">
                    {proj.techStack.map((t, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] font-mono text-cyan-200"
                      >
                        {t}
                      </span>
                    ))}
                  </div>

                  {/* Goals & Next Steps */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    <div className="p-2.5 rounded-xl bg-black/35 border border-white/10">
                      <span className="text-[10px] font-mono font-bold text-emerald-300 block mb-1">
                        PROJECT GOALS
                      </span>
                      <ul className="space-y-1 text-[11px] text-slate-300">
                        {proj.goals.map((g, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                            <span>{g}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-2.5 rounded-xl bg-black/35 border border-white/10">
                      <span className="text-[10px] font-mono font-bold text-amber-300 block mb-1">
                        AUTONOMOUS NEXT STEPS
                      </span>
                      <ul className="space-y-1 text-[11px] text-slate-300">
                        {proj.nextSteps.map((s, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <ArrowRight className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="pt-2.5 border-t border-white/10 flex items-center justify-between gap-2">
                  <span className="text-[10px] font-mono text-slate-400">
                    Updated: {proj.lastUpdated} • Source: {proj.source}
                  </span>
                  <button
                    onClick={() =>
                      onReplayCommand?.(
                        `Advance my project "${proj.name}" and execute the next step: ${
                          proj.nextSteps[0] || "optimize architecture"
                        }`
                      )
                    }
                    className="px-3 py-1.5 rounded-xl bg-violet-500/20 hover:bg-violet-500/35 border border-violet-400/40 text-violet-200 font-mono text-[11px] font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>WORK ON PROJECT NOW</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 3: SEARCHABLE VOICE, CHAT & ACTION TIMELINE                       */}
      {/* ===================================================================== */}
      {activeTab === "TIMELINE" && (
        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search voice commands, assistant responses, or Windows actions..."
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-400/60 font-mono"
            />
          </div>

          {/* System & Brain Action Timeline */}
          {timelineLogs.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-mono font-bold text-emerald-300 uppercase px-1">
                Autonomous Brain & Windows System Events ({timelineLogs.length})
              </h4>
              {timelineLogs
                .filter(
                  (l) =>
                    !search ||
                    l.title.toLowerCase().includes(search.toLowerCase()) ||
                    l.detail.toLowerCase().includes(search.toLowerCase())
                )
                .map((log) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-xl border border-emerald-500/25 bg-emerald-950/15 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold">
                          {log.type}
                        </span>
                        <span className="font-mono font-bold text-white">{log.title}</span>
                        <span className="text-[10px] font-mono text-slate-400">{log.timestamp}</span>
                      </div>
                      <p className="text-slate-300 text-xs">{log.detail}</p>
                    </div>
                    {log.commandToReplay && (
                      <button
                        onClick={() => onReplayCommand?.(log.commandToReplay!)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 text-emerald-200 font-mono text-[10px] font-bold flex items-center gap-1 shrink-0 cursor-pointer"
                      >
                        <Play className="w-3 h-3" />
                        <span>RE-RUN</span>
                      </button>
                    )}
                  </div>
                ))}
            </div>
          )}

          {/* Full Conversation & Voice Command History */}
          <div className="space-y-2 pt-2">
            <h4 className="text-xs font-mono font-bold text-cyan-300 uppercase px-1">
              Full Voice & Chat Conversation Transcripts ({messages.length})
            </h4>
            {messages
              .filter((m) => !search || (m.text || "").toLowerCase().includes(search.toLowerCase()))
              .slice()
              .reverse()
              .map((m) => (
                <div
                  key={m.id}
                  className="p-3.5 rounded-xl border border-white/10 bg-slate-950/45 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <span
                      className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] shrink-0 ${
                        m.role === "user"
                          ? "bg-cyan-500/20 text-cyan-200 border border-cyan-400/40"
                          : "bg-violet-500/20 text-violet-200 border border-violet-400/40"
                      }`}
                    >
                      {m.role === "user" ? "YOU (VOICE/TEXT)" : "DRAVIS ASI"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-sans leading-relaxed">{m.text}</p>
                      <span className="text-[10px] font-mono text-slate-400 mt-1 block">
                        {m.timestamp}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => {
                        if (soundEffectsEnabled) soundEffects.playActivatePulse();
                        onAddMemory({
                          category: m.role === "user" ? "PREFERENCE" : "FACT",
                          key: m.role === "user" ? "Saved User Statement" : "Saved Dravis Insight",
                          value: m.text.slice(0, 260),
                          confidence: 0.99,
                          source: "CONVERSATION",
                        });
                      }}
                      className="px-2.5 py-1 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/30 border border-cyan-400/30 text-cyan-200 font-mono text-[10px] font-bold cursor-pointer"
                    >
                      + Save to Brain
                    </button>
                    {m.role === "user" && (
                      <button
                        onClick={() => onReplayCommand?.(m.text)}
                        className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 text-white font-mono text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Play className="w-2.5 h-2.5" />
                        <span>Run Again</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 4: WINDOWS DESKTOP APP LAUNCHER, AUTO-INSTALLER & CURSOR BRIDGE   */}
      {/* ===================================================================== */}
      {activeTab === "WINDOWS_APPS" && (
        <div className="flex flex-col gap-4">
          {/* Top Banner: 1-Click Windows Native Bridge + Auto-Search & Install Bar */}
          <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-950/15 backdrop-blur-xl flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-xs sm:text-sm font-bold font-mono text-white flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-amber-400" />
                  <span>FULL WINDOWS SYSTEM, APP LAUNCHER & AUTO-INSTALLER</span>
                </h4>
                <p className="text-xs text-slate-300 mt-0.5">
                  Say &quot;Open Calculator&quot;, &quot;Open VS Code&quot;, or search any Windows app below to auto-find best sources, download, install, and launch on your PC.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleDownloadWindowsBridge}
                  className="px-3 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/50 text-emerald-200 font-mono text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>1-CLICK WINDOWS BRIDGE (.BAT)</span>
                </button>
                <button
                  onClick={() => setShowAddWinAppModal(true)}
                  className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>REGISTER APP</span>
                </button>
              </div>
            </div>

            {/* Auto-Search, Recommend Best Sources & Install Any Windows App */}
            <form
              onSubmit={handleWinAppAgentSearch}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2 border-t border-white/10"
            >
              <input
                type="text"
                value={winSearchQuery}
                onChange={(e) => setWinSearchQuery(e.target.value)}
                placeholder="Type any Windows app to auto-search, get verified official download sources & winget install (e.g. Blender, OBS, Steam, Python)..."
                className="flex-1 bg-black/45 border border-white/15 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-400"
              />
              <button
                type="submit"
                disabled={isSearchingWinApp}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-cyan-400 text-slate-950 font-mono text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
              >
                {isSearchingWinApp ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>SEARCHING SOURCES...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>AUTO-SEARCH & INSTALL</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Active Best-Source Recommendation & Auto-Installer Result Card */}
          {activeRec && (
            <div className="p-4 rounded-2xl border border-cyan-400/40 bg-cyan-950/25 backdrop-blur-2xl space-y-3 shadow-[0_0_25px_rgba(34,211,238,0.2)]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-mono text-[10px] font-bold flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      <span>OFFICIAL SOURCES VERIFIED</span>
                    </span>
                    <span className="text-[11px] font-mono text-cyan-300">
                      Publisher: {activeRec.publisher}
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-base font-bold font-mono text-white mt-1">
                    {activeRec.appName} — Windows Auto-Download & Installer
                  </h3>
                </div>

                <a
                  href={activeRec.officialUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-mono text-xs font-bold flex items-center gap-1.5 shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>DIRECT OFFICIAL DOWNLOAD</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <p className="text-xs text-slate-200">{activeRec.summary}</p>

              {/* Winget Command Bar */}
              <div className="p-3 rounded-xl bg-black/50 border border-white/15 flex flex-col sm:flex-row sm:items-center justify-between gap-2 font-mono text-xs">
                <div className="flex items-center gap-2 overflow-x-auto">
                  <Terminal className="w-4 h-4 text-emerald-400 shrink-0" />
                  <code className="text-emerald-300">{activeRec.wingetCommand}</code>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(activeRec.wingetCommand);
                      setCopiedCmd(activeRec.wingetCommand);
                      setTimeout(() => setCopiedCmd(null), 2000);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[10px] flex items-center gap-1 cursor-pointer"
                  >
                    {copiedCmd === activeRec.wingetCommand ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span>COPIED</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>COPY WINGET</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      fetch("http://127.0.0.1:47831/execute", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ command: activeRec.wingetCommand }),
                      }).catch(() => {});
                    }}
                    className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/35 border border-emerald-400/40 text-emerald-200 text-[10px] font-bold cursor-pointer"
                  >
                    RUN ON WINDOWS BRIDGE
                  </button>
                </div>
              </div>

              {/* Top 3 Recommended Sources */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                {activeRec.sources.map((src, i) => (
                  <a
                    key={i}
                    href={src.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-3 rounded-xl bg-black/40 border border-white/10 hover:border-cyan-400/50 transition-all flex flex-col justify-between gap-1.5"
                  >
                    <div>
                      <span className="px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 font-mono text-[9px] font-bold">
                        {src.badge}
                      </span>
                      <h5 className="text-xs font-bold text-white mt-1 flex items-center justify-between">
                        <span>{src.title}</span>
                        <ExternalLink className="w-3 h-3 text-cyan-400 shrink-0" />
                      </h5>
                    </div>
                    <p className="text-[11px] text-slate-300">{src.description}</p>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Windows App Registry Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {windowsApps.map((app) => (
              <div
                key={app.id}
                className="p-4 rounded-2xl border border-white/15 bg-slate-950/50 hover:border-amber-400/40 transition-all flex flex-col justify-between gap-3"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded bg-amber-500/15 border border-amber-400/30 text-amber-300 font-mono text-[10px] font-bold">
                      {app.category}
                    </span>
                    <span
                      className={`text-[10px] font-mono font-bold ${
                        app.isInstalled ? "text-emerald-400" : "text-amber-300"
                      }`}
                    >
                      {app.isInstalled ? "● READY ON PC" : "○ AUTO-INSTALL READY"}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold font-mono text-white">{app.name}</h4>
                  <p className="text-[11px] text-slate-400 font-mono truncate" title={app.exePath}>
                    Path: {app.exePath}
                  </p>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {app.voiceAliases.map((alias, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-mono text-cyan-200"
                      >
                        &quot;Open {alias}&quot;
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-2.5 border-t border-white/10 flex items-center justify-between gap-2">
                  <button
                    onClick={() => onLaunchWindowsApp?.(app)}
                    className="flex-1 py-1.5 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/35 border border-amber-400/50 text-amber-200 font-mono text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>OPEN ON WINDOWS</span>
                  </button>

                  <button
                    onClick={async () => {
                      if (onSearchAndInstallWindowsApp) {
                        const rec = await onSearchAndInstallWindowsApp(app.name);
                        if (rec) setLocalRecommendation(rec);
                      }
                    }}
                    className="py-1.5 px-2.5 rounded-xl bg-white/5 hover:bg-white/15 border border-white/15 text-slate-200 font-mono text-[10px] font-bold cursor-pointer"
                    title="Get Official Download & Winget Installer"
                  >
                    Sources
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal 1: Add Memory Fact */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-950 border border-white/15 rounded-2xl p-5 flex flex-col gap-4 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
            <h3 className="text-sm font-bold font-mono text-white">
              STORE NEW FACT IN BRAIN MEMORY BANK
            </h3>
            <form onSubmit={handleSaveMemory} className="flex flex-col gap-3 font-mono text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
                >
                  <option value="PREFERENCE" className="bg-slate-950">PREFERENCE</option>
                  <option value="IDENTITY" className="bg-slate-950">IDENTITY</option>
                  <option value="PROJECT" className="bg-slate-950">PROJECT</option>
                  <option value="HABIT" className="bg-slate-950">HABIT</option>
                  <option value="RULE" className="bg-slate-950">RULE</option>
                  <option value="TASK" className="bg-slate-950">TASK</option>
                  <option value="FACT" className="bg-slate-950">FACT</option>
                </select>
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Key / Topic</label>
                <input
                  type="text"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  placeholder="e.g. Current Project / Preferred IDE"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400 font-sans"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Learned Fact / Detail</label>
                <textarea
                  rows={3}
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  placeholder="e.g. Working on an AI voice assistant with full Windows control"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400 font-sans"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 text-slate-400 hover:text-white"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold"
                >
                  SAVE TO BRAIN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Add Active Project */}
      {showProjectModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-950 border border-white/15 rounded-2xl p-5 flex flex-col gap-4">
            <h3 className="text-sm font-bold font-mono text-white">
              ADD PROJECT TO BRAIN MEMORY BANK
            </h3>
            <form onSubmit={handleCreateProject} className="flex flex-col gap-3 font-mono text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Project Name</label>
                <input
                  type="text"
                  value={projName}
                  onChange={(e) => setProjName(e.target.value)}
                  placeholder="e.g. Next-Gen AI Game / Portfolio"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white font-sans"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Description</label>
                <textarea
                  rows={2}
                  value={projDesc}
                  onChange={(e) => setProjDesc(e.target.value)}
                  placeholder="What are you building?"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white font-sans"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Tech Stack (comma separated)</label>
                <input
                  type="text"
                  value={projTech}
                  onChange={(e) => setProjTech(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white font-sans"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Primary Goal</label>
                <input
                  type="text"
                  value={projGoal}
                  onChange={(e) => setProjGoal(e.target.value)}
                  placeholder="e.g. Complete prototype and deploy"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white font-sans"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowProjectModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 text-slate-400 hover:text-white"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-violet-500 text-slate-950 font-bold"
                >
                  SAVE PROJECT
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Register Custom Windows App */}
      {showAddWinAppModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-950 border border-white/15 rounded-2xl p-5 flex flex-col gap-4">
            <h3 className="text-sm font-bold font-mono text-white">
              REGISTER CUSTOM WINDOWS APPLICATION
            </h3>
            <form onSubmit={handleSaveCustomWinApp} className="flex flex-col gap-3 font-mono text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Application Name</label>
                <input
                  type="text"
                  value={customAppName}
                  onChange={(e) => setCustomAppName(e.target.value)}
                  placeholder="e.g. Android Studio / Valor / Photoshop"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white font-sans"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Voice Command Aliases (comma separated)</label>
                <input
                  type="text"
                  value={customAppAliases}
                  onChange={(e) => setCustomAppAliases(e.target.value)}
                  placeholder="e.g. android studio, studio"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white font-sans"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Windows .EXE Path</label>
                <input
                  type="text"
                  value={customAppExe}
                  onChange={(e) => setCustomAppExe(e.target.value)}
                  placeholder="C:\Program Files\Android\Android Studio\bin\studio64.exe"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white font-sans"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">URI Protocol (Optional)</label>
                <input
                  type="text"
                  value={customAppUri}
                  onChange={(e) => setCustomAppUri(e.target.value)}
                  placeholder="e.g. vscode:// or spotify:"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white font-sans"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddWinAppModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 text-slate-400 hover:text-white"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold"
                >
                  REGISTER APP
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
