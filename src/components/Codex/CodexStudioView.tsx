import React, { useState, useEffect } from "react";
import {
  Code,
  FolderTree,
  FileCode,
  Download,
  Copy,
  Check,
  Play,
  Sparkles,
  Terminal,
  FileText,
  Plus,
  RefreshCw,
  Eye,
  Layers,
  ChevronRight,
  ChevronDown,
  ExternalLink
} from "lucide-react";
import JSZip from "jszip";
import type { CodexProject, CodexFile } from "../../types.ts";

import { DravisWorldOS } from "./DravisWorldOS.tsx";

interface CodexStudioViewProps {
  project?: CodexProject;
  onUpdateProject?: (project: CodexProject) => void;
  onExecuteCode?: (code: string, language: string) => void;
  onInspectScreenCode?: () => void;
  isDesktopScreenActive?: boolean;
}

export const DEFAULT_PROJECT: CodexProject = {
  id: "proj-dravis-core",
  title: "Full-Stack AI Companion App",
  description: "Production ready TypeScript and React architecture with autonomous agents and screen vision.",
  language: "TypeScript",
  framework: "React 19 + Tailwind v4",
  createdAt: "Just now",
  activeFileId: "file-app-tsx",
  files: [
    {
      id: "file-app-tsx",
      name: "App.tsx",
      path: "src/App.tsx",
      language: "typescript",
      content: `import React, { useState } from "react";
import { Terminal, Sparkles, Monitor } from "lucide-react";

export default function AutonomousApp() {
  const [status, setStatus] = useState("Dravis Neural Engine Active");

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 flex flex-col items-center justify-center font-sans">
      <div className="max-w-xl w-full p-6 bg-slate-900 border border-cyan-500/40 rounded-3xl shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-2xl bg-cyan-500/20 text-cyan-400">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Dravis Autonomous App</h1>
            <p className="text-xs text-cyan-400 font-mono">Status: {status}</p>
          </div>
        </div>
        <p className="text-sm text-slate-300 leading-relaxed mb-6">
          Full multi-language scaffolding powered by Dravis Codex. Multi-file architecture generated with complete working event handlers.
        </p>
        <button
          onClick={() => setStatus("Synthesizing New Workspaces...")}
          className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-sm transition-all shadow-md"
        >
          Execute Neural Process
        </button>
      </div>
    </div>
  );
}`,
    },
    {
      id: "file-api-ts",
      name: "neuralEngine.ts",
      path: "src/api/neuralEngine.ts",
      language: "typescript",
      content: `/**
 * Dravis Neural Processing Engine
 * Handles screen inspection and code generation across Python, JS, C++, Go, and Rust.
 */
export async function analyzeScreenContext(frameBase64: string): Promise<string> {
  const response = await fetch("/api/vision", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      imageBase64: frameBase64,
      prompt: "Analyze the developer environment, IDE code, and active desktop windows.",
    }),
  });
  const data = await response.json();
  return data.text || "Desktop context inspected.";
}`,
    },
    {
      id: "file-package-json",
      name: "package.json",
      path: "package.json",
      language: "json",
      content: `{
  "name": "dravis-generated-workspace",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "lucide-react": "^0.546.0"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "typescript": "^5.8.0",
    "vite": "^6.2.0"
  }
}`,
    },
    {
      id: "file-python-scraper",
      name: "automation_agent.py",
      path: "scripts/automation_agent.py",
      language: "python",
      content: `import sys
import time
import json

def autonomous_task(task_name):
    print(f"[DRAVIS AGENT] Initiating autonomous execution: {task_name}")
    for i in range(1, 4):
        time.sleep(0.5)
        print(f"  Step {i}/3: Neural weights calibrated...")
    print("[SUCCESS] All desktop operations completed without errors.")

if __name__ == "__main__":
    task = sys.argv[1] if len(sys.argv) > 1 else "Default Task"
    autonomous_task(task)
`,
    },
  ],
};

export const CodexStudioView: React.FC<CodexStudioViewProps> = ({
  project: externalProject,
  onUpdateProject,
  onInspectScreenCode,
  isDesktopScreenActive = false,
}) => {
  const [internalProject, setInternalProject] = useState<CodexProject>(DEFAULT_PROJECT);
  const project = externalProject || internalProject;
  const [activeFileId, setActiveFileId] = useState<string>("file-app-tsx");
  const [promptInput, setPromptInput] = useState<string>("");
  const [targetLang, setTargetLang] = useState<string>("TypeScript / React");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [copiedFileId, setCopiedFileId] = useState<string | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);
  const [activeViewMode, setActiveViewMode] = useState<"WORKSPACE" | "DRAVIS_WORLD">("WORKSPACE");

  // Sync activeFileId if project files change
  useEffect(() => {
    if (project.files.length > 0 && !project.files.some((f) => f.id === activeFileId)) {
      setActiveFileId(project.files[0].id);
    }
  }, [project.files, activeFileId]);

  const activeFile = project.files.find((f) => f.id === activeFileId) || project.files[0] || {
    id: "empty",
    name: "empty.txt",
    path: "empty.txt",
    language: "text",
    content: "// No files yet",
  };

  // Handle single file copy
  const handleCopyCode = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedFileId(id);
    setTimeout(() => setCopiedFileId(null), 2000);
  };

  // Download single file
  const handleDownloadSingleFile = (file: CodexFile) => {
    const blob = new Blob([file.content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 1-Click Download Entire Project as ZIP via JSZip
  const handleDownloadProjectZip = async () => {
    try {
      const zip = new JSZip();
      for (const file of project.files) {
        zip.file(file.path, file.content);
      }
      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${project.title.toLowerCase().replace(/[^a-z0-9]/g, "-")}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      console.error("[CodexStudio] Error generating ZIP:", err);
    }
  };

  // Generate complete multi-file project scaffolding via /api/codex
  const handleGenerateScaffolding = async (customPrompt?: string) => {
    const effectivePrompt = customPrompt || promptInput;
    if (!effectivePrompt.trim()) return;

    setIsGenerating(true);
    try {
      const res = await fetch("/api/codex/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: effectivePrompt,
          language: targetLang,
        }),
      });

      if (!res.ok) throw new Error("Failed to generate project");

      const data = await res.json();
      if (data.project && Array.isArray(data.project.files) && data.project.files.length > 0) {
        setInternalProject(data.project);
        onUpdateProject?.(data.project);
        setActiveFileId(data.project.files[0].id);
        setPromptInput("");
      }
    } catch (err) {
      console.warn("[DravisWorkspace] Error generating scaffolding:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 text-slate-100 overflow-hidden">
      {/* Dravis Workspace Top Action Bar with [Workspace] and [Dravis World] Switcher */}
      <div className="px-5 py-3.5 bg-slate-900/90 border-b border-white/10 flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
            <Code className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-tight">Dravis Workspace</h2>
              {/* PRIMARY VIEW MODE SWITCHER: WORKSPACE vs DRAVIS WORLD */}
              <div className="flex items-center p-0.5 rounded-xl bg-slate-950 border border-white/15">
                <button
                  type="button"
                  onClick={() => setActiveViewMode("WORKSPACE")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
                    activeViewMode === "WORKSPACE"
                      ? "bg-cyan-500 text-slate-950 shadow-md"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Workspace
                </button>
                <button
                  type="button"
                  onClick={() => setActiveViewMode("DRAVIS_WORLD")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeViewMode === "DRAVIS_WORLD"
                      ? "bg-gradient-to-r from-purple-500 to-cyan-500 text-white shadow-md shadow-purple-500/30"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Sparkles className="w-3 h-3 text-cyan-300" />
                  <span>Dravis World</span>
                </button>
              </div>
            </div>
            <p className="text-xs text-slate-400">
              {activeViewMode === "WORKSPACE"
                ? "Autonomous multi-language developer IDE, full project repository forge & live code sync across Python, TypeScript, React, and C++."
                : "Autonomous Windows virtual OS visualizer with Google search, YouTube playback, interactive cursor & multi-agent mesh."}
            </p>
          </div>
        </div>

        {activeViewMode === "WORKSPACE" && (
          <div className="flex items-center gap-2">
            {/* Inspect Screen Context Button */}
            {onInspectScreenCode && (
              <button
                type="button"
                onClick={onInspectScreenCode}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                  isDesktopScreenActive
                    ? "bg-cyan-500/20 border-cyan-400 text-cyan-300 hover:bg-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                    : "bg-slate-800 border-white/10 text-slate-400 hover:text-white hover:bg-slate-700"
                }`}
                title="Inspect code currently visible on your desktop screen"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Inspect Desktop Code</span>
              </button>
            )}

            {/* Download Entire Project as ZIP */}
            <button
              type="button"
              onClick={handleDownloadProjectZip}
              className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all shadow-md hover:shadow-cyan-500/25 cursor-pointer"
              title="Download full directory tree as .ZIP file"
            >
              {downloadSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Downloaded ZIP!</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Project (.ZIP)</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Conditionally Render: DRAVIS WORLD OS or WORKSPACE IDE */}
      {activeViewMode === "DRAVIS_WORLD" ? (
        <DravisWorldOS soundEffectsEnabled={true} />
      ) : (
        <>

      {/* Project Prompt & Generation Bar */}
      <div className="px-6 py-3 bg-slate-900/40 border-b border-white/5 flex items-center gap-3 shrink-0">
        <div className="relative flex-1">
          <input
            type="text"
            value={promptInput}
            onChange={(e) => setPromptInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleGenerateScaffolding()}
            placeholder="Ask Dravis to scaffold any app or folder (e.g. 'Full-stack React dashboard', 'Python FastAPI backend with SQLite', 'C++ game engine loop')..."
            className="w-full bg-slate-900/90 border border-white/10 focus:border-cyan-400 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
          />
        </div>

        <select
          value={targetLang}
          onChange={(e) => setTargetLang(e.target.value)}
          className="bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-cyan-400 focus:outline-none cursor-pointer"
        >
          <option value="TypeScript / React">TypeScript / React</option>
          <option value="Python / FastAPI">Python / FastAPI</option>
          <option value="Next.js App Router">Next.js App Router</option>
          <option value="C++20 / CMake">C++20 / CMake</option>
          <option value="Rust / Cargo">Rust / Cargo</option>
          <option value="Go / Gin">Go / Gin</option>
          <option value="Java / Spring Boot">Java / Spring Boot</option>
          <option value="HTML / Tailwind / Vanilla JS">HTML / CSS / JS</option>
        </select>

        <button
          type="button"
          onClick={() => handleGenerateScaffolding()}
          disabled={isGenerating || !promptInput.trim()}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-semibold transition-all cursor-pointer"
        >
          {isGenerating ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Generating...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              <span>Build Code</span>
            </>
          )}
        </button>
      </div>

      {/* Main IDE Workspace: File Tree Sidebar + Editor Panel */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Directory Tree Sidebar */}
        <div className="w-64 bg-slate-950 border-r border-white/10 flex flex-col shrink-0">
          <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-2">
              <FolderTree className="w-3.5 h-3.5 text-cyan-400" />
              Project Explorer
            </span>
            <span className="text-[10px] font-mono text-slate-500">{project.files.length} files</span>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {project.files.map((file) => {
              const isActive = file.id === activeFileId;
              return (
                <button
                  key={file.id}
                  type="button"
                  onClick={() => setActiveFileId(file.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all text-left ${
                    isActive
                      ? "bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30"
                      : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <FileCode className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-cyan-400" : "text-slate-500"}`} />
                    <span className="truncate">{file.path}</span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="p-3 border-t border-white/5 bg-slate-950/80">
            <div className="text-[11px] text-slate-400 truncate">
              <span className="font-semibold text-slate-300">Project:</span> {project.title}
            </div>
            <div className="text-[10px] text-cyan-400 font-mono mt-0.5">{project.framework || project.language}</div>
          </div>
        </div>

        {/* Right: Code Viewer & Editor */}
        <div className="flex-1 flex flex-col bg-slate-900/50 overflow-hidden">
          {/* Active File Header */}
          <div className="px-5 py-3 bg-slate-950/60 border-b border-white/5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-mono font-semibold text-white">{activeFile.path}</span>
              <span className="text-[10px] font-mono uppercase text-slate-400 bg-white/5 px-2 py-0.5 rounded">
                {activeFile.language}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleCopyCode(activeFile.content, activeFile.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs transition-all cursor-pointer"
                title="Copy code to clipboard"
              >
                {copiedFileId === activeFile.id ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-semibold">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy File</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleDownloadSingleFile(activeFile)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs transition-all cursor-pointer"
                title="Download this single file"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save</span>
              </button>
            </div>
          </div>

          {/* Syntax Highlighted Code Display */}
          <div className="flex-1 overflow-auto p-4 font-mono text-xs leading-relaxed bg-slate-950/90 text-slate-200">
            <pre className="select-text whitespace-pre">
              {activeFile.content.split("\n").map((line, idx) => (
                <div key={idx} className="table-row">
                  <span className="table-cell pr-4 text-right select-none text-slate-600 w-10 text-[11px]">
                    {idx + 1}
                  </span>
                  <span className="table-cell whitespace-pre">{line}</span>
                </div>
              ))}
            </pre>
          </div>
        </div>
      </div>
    </>
  )}
</div>
);
};
