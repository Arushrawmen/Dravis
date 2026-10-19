/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * File Intelligence, Real Device Folder Creator (File System Access API),
 * Android .AAB Builder & Vision OCR Document Analyzer View
 */

import React, { useState } from "react";
import {
  FolderKanban,
  FileText,
  Code,
  Database,
  Eye,
  Upload,
  Sparkles,
  FolderPlus,
  FilePlus,
  Download,
  Smartphone,
  Folder,
  HardDrive,
  CheckCircle2,
} from "lucide-react";
import { FileItem } from "../types";
import { soundEffects } from "../utils/audioSynth";
import { deviceHardware, RealDeviceFolderStatus } from "../utils/deviceHardware";

interface FilesViewProps {
  files: FileItem[];
  onAnalyzeImageVision: (base64: string, prompt: string) => Promise<string>;
  onCreateFileOrFolder?: (prompt: string, folderName?: string, fileName?: string) => Promise<void>;
  onBuildAabApp?: (prompt: string) => Promise<void>;
  soundEffectsEnabled: boolean;
}

export const FilesView: React.FC<FilesViewProps> = ({
  files,
  onAnalyzeImageVision,
  onCreateFileOrFolder,
  onBuildAabApp,
  soundEffectsEnabled,
}) => {
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(files[0] || null);
  const [selectedFolderFilter, setSelectedFolderFilter] = useState<string>("ALL");
  const [newFolderName, setNewFolderName] = useState("/Workspace");
  const [newFileName, setNewFileName] = useState("");
  const [newFilePrompt, setNewFilePrompt] = useState("");
  const [aabAppPrompt, setAabAppPrompt] = useState("");
  const [isCreatingArtifact, setIsCreatingArtifact] = useState(false);

  // Genuine Device Folder (File System Access API) State
  const [realDiskFolderInput, setRealDiskFolderInput] = useState("Dravis_Project");
  const [realDiskStatus, setRealDiskStatus] = useState<RealDeviceFolderStatus>(() =>
    deviceHardware.getRealFolderStatus()
  );
  const [realDiskMessage, setRealDiskMessage] = useState<string | null>(null);

  const [visionImage, setVisionImage] = useState<string | null>(null);
  const [visionPrompt, setVisionPrompt] = useState(
    "Analyze this document, extract all text via OCR, and identify key takeaways."
  );
  const [visionResult, setVisionResult] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const folders = Array.from(
    new Set([
      "ALL",
      "/Workspace",
      "/AndroidApps",
      ...realDiskStatus.createdSubfolders.map((s) => `/${s}`),
      ...files.map((f) => f.folder || "/Workspace"),
    ])
  );

  const filteredFiles =
    selectedFolderFilter === "ALL"
      ? files
      : files.filter((f) => (f.folder || "/Workspace") === selectedFolderFilter);

  const handleConnectRealDisk = async () => {
    if (soundEffectsEnabled) soundEffects.playChirp();
    try {
      const status = await deviceHardware.connectDeviceDirectory();
      setRealDiskStatus(status);
      setRealDiskMessage(
        `Connected to real device directory: "${status.folderName}". Folders & files will now be created directly on your device!`
      );
    } catch (err: any) {
      setRealDiskMessage(err?.message || "Direct disk folder picker requires top-level browser tab.");
    }
    setTimeout(() => setRealDiskMessage(null), 6000);
  };

  const handleCreateRealDiskFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetFolder = realDiskFolderInput.trim() || "Dravis_New_Folder";
    if (soundEffectsEnabled) soundEffects.playActivatePulse();
    const res = await deviceHardware.createRealFolderOnDevice(targetFolder, [
      {
        name: "README.md",
        content: `# ${targetFolder}\nCreated directly by DRAVIS OS via File System Access API.`,
      },
    ]);
    setRealDiskStatus(deviceHardware.getRealFolderStatus());
    setRealDiskMessage(res.detail);
    if (onCreateFileOrFolder) {
      await onCreateFileOrFolder(
        `Create folder ${targetFolder} and README.md`,
        `/${targetFolder}`,
        "README.md"
      );
    }
    setTimeout(() => setRealDiskMessage(null), 6000);
  };

  const handleDownloadFile = (file: FileItem) => {
    if (soundEffectsEnabled) soundEffects.playChirp();
    const link = document.createElement("a");
    if (file.dataUrl) {
      link.href = file.dataUrl;
    } else {
      const blob = new Blob([file.content || ""], {
        type: file.mimeType || "text/plain;charset=utf-8",
      });
      link.href = URL.createObjectURL(blob);
    }
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCreateCustomFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newFileName.trim() && !newFilePrompt.trim()) || !onCreateFileOrFolder) return;
    setIsCreatingArtifact(true);
    try {
      const folderClean = newFolderName.trim() || "/Workspace";
      const fileClean = newFileName.trim() || "main.py";
      await deviceHardware.createRealFolderOnDevice(folderClean, [
        { name: fileClean, content: newFilePrompt.trim() || `# ${fileClean}` },
      ]);
      setRealDiskStatus(deviceHardware.getRealFolderStatus());
      const directive =
        newFilePrompt.trim() || `Create file ${fileClean} in folder ${folderClean}`;
      await onCreateFileOrFolder(directive, folderClean, newFileName.trim() || undefined);
      setNewFileName("");
      setNewFilePrompt("");
    } finally {
      setIsCreatingArtifact(false);
    }
  };

  const handleCreateAabSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aabAppPrompt.trim() || !onBuildAabApp) return;
    setIsCreatingArtifact(true);
    try {
      await onBuildAabApp(aabAppPrompt.trim());
      setAabAppPrompt("");
    } finally {
      setIsCreatingArtifact(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setVisionImage(base64);
      if (soundEffectsEnabled) soundEffects.playChirp();
    };
    reader.readAsDataURL(file);
  };

  const handleRunVisionAnalysis = async () => {
    if (!visionImage) return;
    if (soundEffectsEnabled) soundEffects.playActivatePulse();
    setIsAnalyzing(true);
    setVisionResult(null);

    try {
      const res = await onAnalyzeImageVision(visionImage, visionPrompt);
      setVisionResult(res);
    } catch (err: any) {
      setVisionResult("Vision analysis encountered an issue: " + (err.message || "Unknown error"));
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div
      id="dravis-files-view"
      className="flex-1 flex flex-col h-full bg-slate-950/40 p-3 sm:p-5 gap-4 overflow-y-auto"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_0_15px_rgba(0,0,0,0.3)]">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-cyan-400">
            <FolderKanban className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white font-mono tracking-wider">
              GENUINE DEVICE FOLDER CREATOR • FILE FORGE • ANDROID .AAB BUILDER
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              Real PC/Phone Disk Folder Creation (File System Access API) • Multimodal Vision OCR
            </span>
          </div>
        </div>
        <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 font-bold">
          {files.length} Files Stored
        </span>
      </div>

      {/* GENUINE PC / ANDROID DISK FOLDER BRIDGE (File System Access API) */}
      <div className="p-4 rounded-2xl border border-cyan-400/35 bg-cyan-950/20 backdrop-blur-2xl flex flex-col gap-3 shadow-[0_0_20px_rgba(6,182,212,0.12)]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-mono font-bold text-white uppercase">
              Genuine PC / Android Device Folder Creator (File System Access API)
            </span>
            <span
              className={`text-[9px] font-mono px-2 py-0.5 rounded-full border ${
                realDiskStatus.isConnected
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/40"
                  : "bg-amber-500/20 text-amber-300 border-amber-400/40"
              }`}
            >
              {realDiskStatus.isConnected
                ? `CONNECTED: ${realDiskStatus.folderName}`
                : "READY TO CONNECT"}
            </span>
          </div>

          <button
            type="button"
            onClick={handleConnectRealDisk}
            className="px-3 py-1.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-mono text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-[0_0_12px_rgba(34,211,238,0.3)]"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span>
              {realDiskStatus.isConnected
                ? `Change Device Folder (${realDiskStatus.folderName})`
                : "1-Click Connect Real PC / Phone Folder"}
            </span>
          </button>
        </div>

        <form onSubmit={handleCreateRealDiskFolder} className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={realDiskFolderInput}
            onChange={(e) => setRealDiskFolderInput(e.target.value)}
            placeholder="Enter real folder name to create on your PC or Phone (e.g. My_AI_Project)..."
            className="flex-1 bg-black/60 border border-white/15 rounded-xl px-3.5 py-2 text-xs font-mono text-white outline-none focus:border-cyan-400"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-mono text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
          >
            <FolderPlus className="w-4 h-4" />
            <span>Create Real Folder on Device Now</span>
          </button>
        </form>

        {realDiskMessage && (
          <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-400/40 text-emerald-300 text-xs font-mono flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{realDiskMessage}</span>
          </div>
        )}
      </div>

      {/* Top Quick Creation Cards: 1. Folder & Any File Generator | 2. Android App (.AAB) Builder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <form
          onSubmit={handleCreateCustomFile}
          className="p-4 rounded-2xl border border-amber-400/30 bg-white/5 flex flex-col gap-2.5 shadow-[0_0_15px_rgba(0,0,0,0.2)]"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-amber-300 uppercase flex items-center gap-1.5">
              <FolderPlus className="w-4 h-4 text-amber-400" />
              <span>AI Synthesis: Folder & Any Type of File</span>
            </span>
            <span className="text-[10px] font-mono text-slate-400">All Extensions Supported</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Folder (e.g. /MyProject)"
              className="bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-400/60"
            />
            <input
              type="text"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              placeholder="File name (e.g. app.py, index.html, data.json)"
              className="bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-400/60"
            />
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newFilePrompt}
              onChange={(e) => setNewFilePrompt(e.target.value)}
              placeholder="What should Dravis write inside this file/folder?"
              className="flex-1 bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs font-sans text-white focus:outline-none focus:border-amber-400/60"
            />
            <button
              type="submit"
              disabled={isCreatingArtifact || (!newFileName.trim() && !newFilePrompt.trim())}
              className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-slate-950 font-mono text-xs font-bold flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <FilePlus className="w-3.5 h-3.5" />
              <span>Create File</span>
            </button>
          </div>
        </form>

        <form
          onSubmit={handleCreateAabSubmit}
          className="p-4 rounded-2xl border border-emerald-400/30 bg-white/5 flex flex-col justify-between gap-2.5 shadow-[0_0_15px_rgba(0,0,0,0.2)]"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-emerald-300 uppercase flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-emerald-400" />
              <span>Talk-to-Build Android App & .AAB Package</span>
            </span>
            <span className="text-[10px] font-mono text-emerald-400">.AAB + .APK + Source</span>
          </div>
          <p className="text-[11px] text-slate-300 font-sans">
            Describe any Android app you want to create. Dravis will generate the playable app, Kotlin & Manifest project folder, and downloadable <strong>.aab</strong> bundle.
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={aabAppPrompt}
              onChange={(e) => setAabAppPrompt(e.target.value)}
              placeholder="e.g., Build a Fitness Tracker Android app and give me the AAB file..."
              className="flex-1 bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs font-sans text-white focus:outline-none focus:border-emerald-400/60"
            />
            <button
              type="submit"
              disabled={isCreatingArtifact || !aabAppPrompt.trim()}
              className="px-4 py-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 disabled:opacity-40 text-slate-950 font-mono text-xs font-bold flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Build .AAB</span>
            </button>
          </div>
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1">
        {/* Left: File & Folder Repository */}
        <div className="lg:col-span-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-mono font-bold text-white uppercase">
              Folders & File Repository
            </h4>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {folders.map((folder) => (
              <button
                key={folder}
                type="button"
                onClick={() => setSelectedFolderFilter(folder)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold border transition-all cursor-pointer shrink-0 ${
                  selectedFolderFilter === folder
                    ? "bg-cyan-400/20 border-cyan-400 text-cyan-300"
                    : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
                }`}
              >
                <Folder className="w-3 h-3" />
                <span>{folder}</span>
              </button>
            ))}
          </div>

          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {filteredFiles.map((f) => (
              <div
                key={f.id}
                onClick={() => {
                  if (soundEffectsEnabled) soundEffects.playChirp();
                  setSelectedFile(f);
                }}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                  selectedFile?.id === f.id
                    ? "border-cyan-400/60 bg-white/10 text-white shadow-[0_0_12px_rgba(34,211,238,0.2)]"
                    : "border-white/5 bg-white/5 text-slate-300 hover:border-white/20"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {f.type === "aab" ? (
                    <Smartphone className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : f.type === "code" ? (
                    <Code className="w-4 h-4 text-cyan-400 shrink-0" />
                  ) : f.type === "data" ? (
                    <Database className="w-4 h-4 text-amber-400 shrink-0" />
                  ) : (
                    <FileText className="w-4 h-4 text-cyan-400 shrink-0" />
                  )}
                  <div className="truncate">
                    <span className="text-xs font-mono font-bold block truncate">{f.name}</span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {f.folder || "/Workspace"} • {f.size} • {f.updated}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownloadFile(f);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-400/40 text-[10px] font-mono font-bold flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  <Download className="w-3 h-3" />
                  <span>Save</span>
                </button>
              </div>
            ))}
          </div>

          {selectedFile && (
            <div className="p-3 rounded-xl border border-white/10 bg-white/5 flex flex-col gap-2 shadow-[0_0_15px_rgba(0,0,0,0.2)]">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase">
                  Content Preview: {selectedFile.folder || "/Workspace"}/{selectedFile.name}
                </span>
                <button
                  type="button"
                  onClick={() => handleDownloadFile(selectedFile)}
                  className="text-[10px] font-mono text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3 h-3" />
                  <span>Download {selectedFile.name}</span>
                </button>
              </div>
              <pre className="p-2.5 rounded-lg bg-black/50 text-[11px] font-mono text-slate-200 overflow-x-auto whitespace-pre-wrap max-h-48 border border-white/5">
                {selectedFile.content}
              </pre>
            </div>
          )}
        </div>

        {/* Right: Optical OCR & Gemini Vision Engine */}
        <div className="lg:col-span-7 flex flex-col gap-3 p-4 rounded-2xl border border-white/10 bg-white/5 shadow-[0_0_15px_rgba(0,0,0,0.2)]">
          <div className="flex items-center justify-between pb-2 border-b border-white/5">
            <h4 className="text-xs font-mono font-bold text-white uppercase flex items-center gap-2">
              <Eye className="w-4 h-4 text-cyan-400" />
              <span>Multimodal Vision & OCR Scanner</span>
            </h4>
            <span className="text-[10px] font-mono text-emerald-400">Gemini Vision Online</span>
          </div>

          <div className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed border-white/10 bg-black/30 text-center gap-2">
            {visionImage ? (
              <div className="flex flex-col items-center gap-2">
                <img
                  src={visionImage}
                  alt="Visual Scan Buffer"
                  referrerPolicy="no-referrer"
                  className="max-h-44 rounded-lg border border-white/15 shadow-[0_0_15px_rgba(0,0,0,0.4)] object-contain"
                />
                <button
                  onClick={() => setVisionImage(null)}
                  className="text-xs font-mono text-rose-400 hover:text-rose-300 cursor-pointer"
                >
                  Remove & Rescan
                </button>
              </div>
            ) : (
              <label className="cursor-pointer flex flex-col items-center gap-2 py-4">
                <div className="p-3 rounded-full bg-white/5 border border-white/10 text-cyan-400">
                  <Upload className="w-5 h-5" />
                </div>
                <span className="text-xs font-mono font-bold text-white">
                  Upload Screenshot, Diagram, or Document for OCR Analysis
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  PNG, JPG, WebP supported
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {visionImage && (
            <div className="flex flex-col gap-2 font-mono text-xs">
              <input
                type="text"
                value={visionPrompt}
                onChange={(e) => setVisionPrompt(e.target.value)}
                placeholder="Vision OCR instruction..."
                className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-white font-sans focus:outline-none focus:border-cyan-400/60"
              />
              <button
                onClick={handleRunVisionAnalysis}
                disabled={isAnalyzing}
                className="w-full py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold transition-all shadow-[0_0_15px_rgba(34,211,238,0.3)] flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>
                  {isAnalyzing
                    ? "PERFORMING OPTICAL OCR ANALYSIS..."
                    : "ANALYZE SCENE WITH GEMINI VISION"}
                </span>
              </button>
            </div>
          )}

          {visionResult && (
            <div className="p-3.5 rounded-xl border border-white/10 bg-black/60 text-xs font-sans text-slate-100 whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto">
              <span className="text-[10px] font-mono text-cyan-400 font-bold block mb-1">
                VISION OCR SYNTHESIS REPORT:
              </span>
              {visionResult}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
