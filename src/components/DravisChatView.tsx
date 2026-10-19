/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Deep Cognitive Chat, Reasoning Engine & Inline Image Generation View for DRAVIS
 */

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Send,
  Mic,
  MicOff,
  Bot,
  User,
  Volume2,
  ChevronDown,
  ChevronUp,
  Cpu,
  Brain,
  Database,
  Sparkles,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  Image as ImageIcon,
  Download,
  Maximize2,
  X,
  Loader2,
  Film,
  FolderPlus,
  Smartphone,
  FileCode,
  Folder,
  Play,
  Eye,
  Music,
  Globe,
  Wand2,
  Dna,
  Upload,
  ExternalLink,
  FileAudio,
} from "lucide-react";
import { MessageItem, VoiceState, UserProfile, FileItem } from "../types";
import { soundEffects } from "../utils/audioSynth";
import { BioScienceViewerCard } from "./BioScienceViewerCard";

export type CreationMode =
  | "NONE"
  | "IMAGE"
  | "VIDEO"
  | "IMAGE_TO_VIDEO"
  | "AUDIO_TRANSCRIBE"
  | "GEMINI_BOT"
  | "GOOGLE_SEARCH"
  | "MUSIC"
  | "BIOSCIENCE"
  | "FILE_FOLDER"
  | "AAB_APP";

interface DravisChatViewProps {
  messages: MessageItem[];
  userProfile: UserProfile;
  voiceState: VoiceState;
  onSendMessage: (text: string) => void;
  onGenerateImage?: (prompt: string) => void;
  onEditImage?: (sourceImageUrl: string, editPrompt: string) => void;
  onGenerateVideo?: (prompt: string, sourceImageBase64?: string) => void;
  onTranscribeAudio?: (audioBase64: string, mimeType: string, promptText?: string) => void;
  onAskGeminiBot?: (prompt: string) => void;
  onSearchGrounded?: (query: string) => void;
  onGenerateMusic?: (prompt: string) => void;
  onAnalyzeBioScience?: (query: string) => void;
  onCreateFileOrFolder?: (prompt: string) => void;
  onBuildAabApp?: (prompt: string) => void;
  onOpenLaunchedApp?: (appIdOrName: string) => void;
  onSpeakMessage: (text: string) => void;
  onToggleMic: () => void;
  isListening: boolean;
  isGeneratingImage?: boolean;
  generatingPrompt?: string;
}

export const DravisChatView: React.FC<DravisChatViewProps> = ({
  messages,
  userProfile,
  voiceState,
  onSendMessage,
  onGenerateImage,
  onEditImage,
  onGenerateVideo,
  onTranscribeAudio,
  onAskGeminiBot,
  onSearchGrounded,
  onGenerateMusic,
  onAnalyzeBioScience,
  onCreateFileOrFolder,
  onBuildAabApp,
  onOpenLaunchedApp,
  onSpeakMessage,
  onToggleMic,
  isListening,
  isGeneratingImage = false,
  generatingPrompt = "",
}) => {
  const [input, setInput] = useState("");
  const [creationMode, setCreationMode] = useState<CreationMode>("NONE");
  const [expandedReasoning, setExpandedReasoning] = useState<Record<string, boolean>>({});
  const [expandedAppSource, setExpandedAppSource] = useState<Record<string, boolean>>({});
  const [editingImageMsgId, setEditingImageMsgId] = useState<string | null>(null);
  const [imageEditInstruction, setImageEditInstruction] = useState<string>("");
  const [uploadedImageForVideo, setUploadedImageForVideo] = useState<string | null>(null);
  const [isRecordingAudioClip, setIsRecordingAudioClip] = useState<boolean>(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const imageForVideoInputRef = useRef<HTMLInputElement>(null);
  const audioUploadInputRef = useRef<HTMLInputElement>(null);

  const [fullscreenImage, setFullscreenImage] = useState<{
    url: string;
    prompt: string;
    dimensions?: string;
  } | null>(null);
  const [fullscreenHtmlPreview, setFullscreenHtmlPreview] = useState<{
    title: string;
    html: string;
  } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isGeneratingImage]);

  const handleImageForVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setUploadedImageForVideo(reader.result);
        setCreationMode("IMAGE_TO_VIDEO");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAudioFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onTranscribeAudio) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        onTranscribeAudio(
          reader.result,
          file.type || "audio/wav",
          input.trim() || `Transcribe uploaded audio file: ${file.name}`
        );
        setInput("");
        setCreationMode("NONE");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleToggleAudioClipRecorder = async () => {
    if (isRecordingAudioClip && mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecordingAudioClip(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recorder.ondataavailable = (ev) => {
        if (ev.data.size > 0) audioChunksRef.current.push(ev.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === "string" && onTranscribeAudio) {
            onTranscribeAudio(
              reader.result,
              "audio/webm",
              input.trim() || "Transcribe recorded voice memo with speaker diarization"
            );
            setInput("");
            setCreationMode("NONE");
          }
        };
        reader.readAsDataURL(blob);
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecordingAudioClip(true);
    } catch {
      if (onTranscribeAudio) {
        onTranscribeAudio(
          "",
          "audio/webm",
          input.trim() || "Transcribe audio sample with speaker diarization and timestamps"
        );
        setInput("");
        setCreationMode("NONE");
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    if (userProfile.soundEffects) soundEffects.playActivatePulse();
    const trimmed = input.trim();
    setInput("");

    if (creationMode === "IMAGE" && onGenerateImage) {
      onGenerateImage(trimmed);
      setCreationMode("NONE");
    } else if (creationMode === "VIDEO" && onGenerateVideo) {
      onGenerateVideo(trimmed);
      setCreationMode("NONE");
    } else if (creationMode === "IMAGE_TO_VIDEO" && onGenerateVideo) {
      onGenerateVideo(trimmed, uploadedImageForVideo || undefined);
      setUploadedImageForVideo(null);
      setCreationMode("NONE");
    } else if (creationMode === "AUDIO_TRANSCRIBE" && onTranscribeAudio) {
      onTranscribeAudio("", "audio/wav", trimmed);
      setCreationMode("NONE");
    } else if (creationMode === "GEMINI_BOT" && onAskGeminiBot) {
      onAskGeminiBot(trimmed);
      setCreationMode("NONE");
    } else if (creationMode === "GOOGLE_SEARCH" && onSearchGrounded) {
      onSearchGrounded(trimmed);
      setCreationMode("NONE");
    } else if (creationMode === "MUSIC" && onGenerateMusic) {
      onGenerateMusic(trimmed);
      setCreationMode("NONE");
    } else if (creationMode === "BIOSCIENCE" && onAnalyzeBioScience) {
      onAnalyzeBioScience(trimmed);
      setCreationMode("NONE");
    } else if (creationMode === "FILE_FOLDER" && onCreateFileOrFolder) {
      onCreateFileOrFolder(trimmed);
      setCreationMode("NONE");
    } else if (creationMode === "AAB_APP" && onBuildAabApp) {
      onBuildAabApp(trimmed);
      setCreationMode("NONE");
    } else {
      onSendMessage(trimmed);
    }
  };

  const toggleReasoning = (msgId: string) => {
    if (userProfile.soundEffects) soundEffects.playChirp();
    setExpandedReasoning((prev) => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  const handleDownloadImage = (url: string, promptText: string) => {
    if (userProfile.soundEffects) soundEffects.playChirp();
    const link = document.createElement("a");
    link.href = url;
    const safeName = promptText
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40) || "dravis-generated";
    link.download = `${safeName}-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadFileItem = (file: FileItem) => {
    if (userProfile.soundEffects) soundEffects.playChirp();
    const link = document.createElement("a");
    if (file.dataUrl) {
      link.href = file.dataUrl;
    } else {
      const blob = new Blob([file.content || ""], { type: file.mimeType || "text/plain;charset=utf-8" });
      link.href = URL.createObjectURL(blob);
    }
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadBase64Binary = (base64: string, fileName: string) => {
    if (userProfile.soundEffects) soundEffects.playTaskComplete();
    const link = document.createElement("a");
    link.href = `data:application/octet-stream;base64,${base64}`;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadHtmlAnimation = (htmlContent: string, promptText: string) => {
    if (userProfile.soundEffects) soundEffects.playChirp();
    const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const safeName = promptText
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 35) || "dravis-animation";
    link.href = url;
    link.download = `${safeName}-60fps-animation.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      id="dravis-chat-view"
      className="flex-1 flex flex-col h-full bg-slate-950/40 p-3 sm:p-5 gap-3 overflow-hidden relative"
    >
      {/* Header Banner */}
      <div className="flex items-center justify-between px-4 py-3 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_0_15px_rgba(0,0,0,0.3)]">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-white/5 border border-white/10 text-cyan-400">
            <Brain className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white font-mono tracking-wider">
              Dravis Universal Forge: Chat • Images • 60fps Video • Files • Android .AAB Builder
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              {userProfile.llmProvider === "GOOGLE"
                ? `1. Google DeepMind (${userProfile.llmModel || "Gemini 3.7 Flash"}) • Full Multimedia & AAB Synthesis Active`
                : `2. OpenAI (${userProfile.llmModel || "GPT-4o"}) • Full Multimedia & AAB Synthesis Active`}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isGeneratingImage && (
            <span className="text-[10px] font-mono px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 font-bold flex items-center gap-1.5 animate-pulse">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>SYNTHESIZING ARTIFACT...</span>
            </span>
          )}
          <span className="text-[10px] font-mono px-3 py-1 rounded-full bg-white/5 border border-white/10 text-cyan-400 font-bold">
            {voiceState === "THINKING"
              ? "REASONING..."
              : voiceState === "SPEAKING"
              ? "VOCALIZING..."
              : "STANDBY"}
          </span>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto space-y-4 px-2 py-3">
        {messages.map((msg) => {
          const isUser = msg.role === "user";
          const hasReasoning = msg.reasoningSteps && msg.reasoningSteps.length > 0;
          const isExpanded = expandedReasoning[msg.id] ?? false;
          const allCreatedFiles = msg.createdFiles || (msg.createdFile ? [msg.createdFile] : []);

          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 max-w-3xl ${
                isUser ? "ml-auto flex-row-reverse" : "mr-auto"
              }`}
            >
              {/* Avatar Icon */}
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border ${
                  isUser
                    ? "bg-white/10 border-white/20 text-white"
                    : "bg-white/5 border-white/10 text-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.2)]"
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Bubble Container */}
              <div className="flex flex-col gap-1.5 min-w-0 flex-1">
                {/* Author & Timestamp */}
                <div
                  className={`flex items-center gap-2 text-[10px] font-mono ${
                    isUser ? "justify-end text-slate-300" : "text-cyan-400"
                  }`}
                >
                  <span className="font-bold uppercase">
                    {isUser ? userProfile.name : "DRAVIS"}
                  </span>
                  <span className="text-slate-500">{msg.timestamp}</span>
                </div>

                <div
                  className={`p-3.5 rounded-2xl border text-sm leading-relaxed ${
                    isUser
                      ? "bg-white/10 border-white/15 text-white"
                      : "bg-white/5 border-white/10 text-slate-200 shadow-[0_0_15px_rgba(0,0,0,0.2)]"
                  }`}
                >
                  {/* 0. MULTI-TASKING EXECUTION SUMMARY CARD (Apps Launched First + Hardware Toggled + Answer Below) */}
                  {msg.multiTaskExecuted &&
                    ((msg.multiTaskExecuted.launchedApps &&
                      msg.multiTaskExecuted.launchedApps.length > 0) ||
                      (msg.multiTaskExecuted.hardwareChanges &&
                        msg.multiTaskExecuted.hardwareChanges.length > 0)) && (
                      <div className="mb-3 rounded-2xl border border-cyan-400/40 bg-slate-950/90 p-3 shadow-[0_0_25px_rgba(34,211,238,0.18)] space-y-2.5">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2">
                          <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-cyan-300">
                            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                            <span>
                              MULTI-TASKING ENGINE •{" "}
                              {(msg.multiTaskExecuted.launchedApps?.length || 0) +
                                (msg.multiTaskExecuted.hardwareChanges?.length || 0)}{" "}
                              TASKS EXECUTED FIRST
                            </span>
                          </div>
                          <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                            SMART DESKTOP / BROWSER ROUTER
                          </span>
                        </div>

                        {msg.multiTaskExecuted.launchedApps &&
                          msg.multiTaskExecuted.launchedApps.length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {msg.multiTaskExecuted.launchedApps.map((appItem, idx) => {
                                const isDesktop = appItem.routingMode === "DESKTOP_NATIVE";
                                return (
                                  <div
                                    key={`${appItem.id}-${idx}`}
                                    className="p-2.5 rounded-xl bg-slate-900/90 border border-white/10 flex flex-col justify-between gap-2"
                                  >
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="min-w-0">
                                        <div className="flex items-center gap-1.5">
                                          <span
                                            className="w-2.5 h-2.5 rounded-full shrink-0"
                                            style={{
                                              backgroundColor: appItem.accentColor || "#22d3ee",
                                            }}
                                          />
                                          <span className="text-xs font-mono font-bold text-white truncate">
                                            {appItem.name}
                                          </span>
                                        </div>
                                        <p className="text-[10px] font-mono text-slate-400 mt-0.5 leading-snug">
                                          {appItem.routingReason}
                                        </p>
                                      </div>
                                      <span
                                        className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded shrink-0 ${
                                          isDesktop
                                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30"
                                            : "bg-cyan-500/20 text-cyan-300 border border-cyan-400/30"
                                        }`}
                                      >
                                        {isDesktop ? "🖥️ DESKTOP" : "🌐 BROWSER"}
                                      </span>
                                    </div>

                                    <div className="flex items-center gap-1.5 pt-1">
                                      <a
                                        href={
                                          isDesktop && appItem.windowsUri
                                            ? appItem.windowsUri
                                            : appItem.webUrl
                                        }
                                        target={
                                          isDesktop && appItem.windowsUri ? "_top" : "_blank"
                                        }
                                        rel="noopener noreferrer"
                                        className="flex-1 px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-200 font-mono text-[10px] font-bold flex items-center justify-center gap-1 transition-all"
                                      >
                                        <ExternalLink className="w-3 h-3" />
                                        <span>
                                          {isDesktop
                                            ? `Open ${appItem.name} Desktop`
                                            : `Open ${appItem.name} Browser`}
                                        </span>
                                      </a>
                                      {onOpenLaunchedApp && (
                                        <button
                                          type="button"
                                          onClick={() => onOpenLaunchedApp(appItem.id)}
                                          className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-slate-200 font-mono text-[10px] cursor-pointer"
                                          title="Open in Live Workspace Window"
                                        >
                                          Live View
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                        {msg.multiTaskExecuted.hardwareChanges &&
                          msg.multiTaskExecuted.hardwareChanges.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {msg.multiTaskExecuted.hardwareChanges.map((hw, i) => (
                                <span
                                  key={i}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 font-mono text-[10px] font-bold flex items-center gap-1"
                                >
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>
                                    {hw.label}: {hw.enabled ? "ON" : "OFF"}
                                  </span>
                                </span>
                              ))}
                            </div>
                          )}
                      </div>
                    )}

                  <p className="whitespace-pre-wrap font-sans">{msg.text}</p>

                  {/* 1. INLINE GENERATED IMAGE DISPLAY INSIDE DRAVIS CHAT */}
                  {msg.generatedImage && msg.generatedImage.url && (
                    <div className="mt-3 rounded-2xl overflow-hidden border border-cyan-400/30 bg-slate-950/90 shadow-[0_0_30px_rgba(34,211,238,0.18)]">
                      <div className="flex items-center justify-between px-3 py-2 bg-slate-900/90 border-b border-white/10">
                        <div className="flex items-center gap-2 min-w-0">
                          <ImageIcon className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                          <span className="text-[11px] font-mono font-bold text-cyan-300 truncate">
                            Dravis Visual Render
                          </span>
                          {msg.generatedImage.dimensions && (
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-400/30 shrink-0">
                              {msg.generatedImage.dimensions}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {onGenerateImage && (
                            <button
                              type="button"
                              onClick={() => onGenerateImage(msg.generatedImage!.prompt)}
                              className="p-1.5 rounded-lg bg-white/5 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300 border border-white/10 hover:border-cyan-400/40 transition-all cursor-pointer"
                              title="Regenerate Image"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() =>
                              setFullscreenImage({
                                url: msg.generatedImage!.url,
                                prompt: msg.generatedImage!.prompt,
                                dimensions: msg.generatedImage!.dimensions,
                              })
                            }
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300 border border-white/10 hover:border-cyan-400/40 transition-all cursor-pointer"
                            title="View Full Screen"
                          >
                            <Maximize2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleDownloadImage(
                                msg.generatedImage!.url,
                                msg.generatedImage!.prompt
                              )
                            }
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-400/40 text-[10px] font-mono font-bold transition-all cursor-pointer"
                            title="Download Image"
                          >
                            <Download className="w-3 h-3" />
                            <span>Save</span>
                          </button>
                        </div>
                      </div>

                      <div
                        onClick={() =>
                          setFullscreenImage({
                            url: msg.generatedImage!.url,
                            prompt: msg.generatedImage!.prompt,
                            dimensions: msg.generatedImage!.dimensions,
                          })
                        }
                        className="relative group cursor-zoom-in bg-slate-950 flex items-center justify-center min-h-[240px] max-h-[520px] overflow-hidden"
                      >
                        <img
                          src={msg.generatedImage.url}
                          alt={msg.generatedImage.prompt}
                          referrerPolicy="no-referrer"
                          className="w-full h-auto max-h-[500px] object-contain transition-transform duration-300 group-hover:scale-[1.01]"
                        />
                      </div>

                      <div className="px-3.5 py-2.5 bg-slate-900/80 border-t border-white/10 flex flex-col gap-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-xs font-mono text-slate-300 truncate">
                            <span className="text-cyan-400 font-bold">Prompt: </span>
                            "{msg.generatedImage.prompt}"
                          </p>
                          <div className="flex items-center gap-1.5">
                            {onEditImage && (
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingImageMsgId(
                                    editingImageMsgId === msg.id ? null : msg.id
                                  );
                                  setImageEditInstruction("");
                                }}
                                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-400/40 text-[10px] font-mono font-bold transition-all cursor-pointer"
                              >
                                <Wand2 className="w-3 h-3" />
                                <span>Edit Image</span>
                              </button>
                            )}
                            {onGenerateVideo && (
                              <button
                                type="button"
                                onClick={() =>
                                  onGenerateVideo(
                                    `Animate this image into a smooth cinematic video: ${msg.generatedImage!.prompt}`,
                                    msg.generatedImage!.url
                                  )
                                }
                                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-400/40 text-[10px] font-mono font-bold transition-all cursor-pointer"
                              >
                                <Film className="w-3 h-3" />
                                <span>Image → Video (Veo)</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {editingImageMsgId === msg.id && onEditImage && (
                          <div className="flex items-center gap-2 pt-1">
                            <input
                              type="text"
                              value={imageEditInstruction}
                              onChange={(e) => setImageEditInstruction(e.target.value)}
                              placeholder="Describe image edit (e.g. 'Add golden sunset lighting and neon rain')..."
                              className="flex-1 bg-black/60 border border-rose-400/40 rounded-lg px-2.5 py-1 text-xs text-white placeholder-slate-400 focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                if (!imageEditInstruction.trim()) return;
                                onEditImage(
                                  msg.generatedImage!.url,
                                  imageEditInstruction.trim()
                                );
                                setEditingImageMsgId(null);
                                setImageEditInstruction("");
                              }}
                              className="px-2.5 py-1 rounded-lg bg-rose-500 text-slate-950 font-mono text-[10px] font-bold hover:bg-rose-400 cursor-pointer"
                            >
                              Apply Edit
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 2. INLINE VEO 3.1 VIDEO & 60FPS ANIMATION PLAYER INSIDE DRAVIS CHAT */}
                  {msg.generatedVideo && (
                    <div className="mt-3 rounded-2xl overflow-hidden border border-purple-400/40 bg-slate-950/95 shadow-[0_0_30px_rgba(168,85,247,0.2)]">
                      <div className="flex items-center justify-between px-3 py-2 bg-slate-900/90 border-b border-white/10">
                        <div className="flex items-center gap-2 min-w-0">
                          <Film className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                          <span className="text-[11px] font-mono font-bold text-purple-300 truncate">
                            {msg.generatedVideo.sourceImageUrl
                              ? "Veo 3.1 Image-to-Video Animation"
                              : "Veo 3.1 Video & 60fps Motion Synthesis"}
                          </span>
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-400/30 shrink-0">
                            {msg.generatedVideo.fps} FPS • {msg.generatedVideo.resolution}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() =>
                              setFullscreenHtmlPreview({
                                title: `Animation: ${msg.generatedVideo!.prompt}`,
                                html: msg.generatedVideo!.standaloneHtml,
                              })
                            }
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-purple-500/20 text-slate-300 hover:text-purple-300 border border-white/10 transition-all cursor-pointer"
                            title="Fullscreen Animation Player"
                          >
                            <Maximize2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleDownloadHtmlAnimation(
                                msg.generatedVideo!.standaloneHtml,
                                msg.generatedVideo!.prompt
                              )
                            }
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-400/40 text-[10px] font-mono font-bold transition-all cursor-pointer"
                          >
                            <Download className="w-3 h-3" />
                            <span>Save Video</span>
                          </button>
                        </div>
                      </div>

                      <div className="relative w-full h-72 sm:h-80 bg-black overflow-hidden">
                        {msg.generatedVideo.videoUrl ? (
                          <video
                            src={msg.generatedVideo.videoUrl}
                            controls
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="w-full h-full object-contain bg-black"
                          />
                        ) : (
                          <iframe
                            title={`video-${msg.generatedVideo.id}`}
                            srcDoc={msg.generatedVideo.standaloneHtml}
                            className="w-full h-full border-0 pointer-events-none"
                            sandbox="allow-scripts"
                          />
                        )}
                      </div>

                      <div className="px-3.5 py-2 bg-slate-900/80 border-t border-white/10 flex items-center justify-between text-xs font-mono text-slate-300">
                        <span className="truncate">
                          <strong className="text-purple-400">Motion Scene:</strong> "{msg.generatedVideo.prompt}"
                        </span>
                        <span className="text-[10px] text-emerald-400 shrink-0">
                          ● {msg.generatedVideo.engineUsed || "LIVE 60FPS"}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* 2B. INLINE LYRIA 3 MUSIC GENERATOR PLAYER */}
                  {msg.generatedMusic && (
                    <div className="mt-3 rounded-2xl overflow-hidden border border-violet-400/40 bg-slate-950/95 p-3.5 shadow-[0_0_25px_rgba(139,92,246,0.2)]">
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-white/10">
                        <div className="flex items-center gap-2">
                          <div className="p-2 rounded-xl bg-violet-500/20 border border-violet-400/40 text-violet-300">
                            <Music className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-xs font-mono font-bold text-violet-200">
                              {msg.generatedMusic.title}
                            </div>
                            <div className="text-[10px] font-mono text-slate-400">
                              {msg.generatedMusic.genre} • {msg.generatedMusic.bpm} BPM • Key of {msg.generatedMusic.musicalKey} • {msg.generatedMusic.engineUsed}
                            </div>
                          </div>
                        </div>
                        <a
                          href={msg.generatedMusic.audioDataUrl}
                          download={`${msg.generatedMusic.title.replace(/\s+/g, "-").toLowerCase()}.wav`}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-violet-500/20 hover:bg-violet-500/30 text-violet-200 border border-violet-400/40 text-[10px] font-mono font-bold"
                        >
                          <Download className="w-3 h-3" />
                          <span>Download WAV</span>
                        </a>
                      </div>
                      <div className="mt-3">
                        <audio
                          controls
                          src={msg.generatedMusic.audioDataUrl}
                          className="w-full h-9"
                        />
                      </div>
                    </div>
                  )}

                  {/* 2C. INLINE GEMINI 3.5 AUDIO TRANSCRIPTION CARD */}
                  {msg.audioTranscription && (
                    <div className="mt-3 rounded-2xl border border-amber-400/40 bg-slate-950/90 p-3.5 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2">
                        <div className="flex items-center gap-2">
                          <FileAudio className="w-4 h-4 text-amber-400" />
                          <span className="text-xs font-mono font-bold text-amber-300">
                            Gemini 3.5 Audio Transcription & Speaker Diarization
                          </span>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-200 border border-amber-400/30">
                          {msg.audioTranscription.languageDetected} • {Math.round(msg.audioTranscription.confidence * 100)}% Confidence
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-black/50 border border-white/10 text-xs font-mono text-slate-200">
                        {msg.audioTranscription.transcript}
                      </div>
                      {msg.audioTranscription.speakerSegments &&
                        msg.audioTranscription.speakerSegments.length > 0 && (
                          <div className="space-y-1 pt-1">
                            {msg.audioTranscription.speakerSegments.map((seg, i) => (
                              <div
                                key={i}
                                className="flex items-start gap-2 text-[11px] font-mono text-slate-300"
                              >
                                <span className="text-amber-300 font-bold shrink-0">
                                  [{seg.timestamp}] {seg.speaker}:
                                </span>
                                <span>{seg.text}</span>
                              </div>
                            ))}
                          </div>
                        )}
                    </div>
                  )}

                  {/* 2D. INLINE GOOGLE SEARCH GROUNDING SOURCES */}
                  {msg.searchGrounding && (
                    <div className="mt-3 rounded-2xl border border-emerald-400/35 bg-emerald-950/15 p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-300">
                          <Globe className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Google Search Live Grounded Sources</span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400">
                          Verified Web Citations
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.searchGrounding.sources.map((src, idx) => (
                          <a
                            key={idx}
                            href={src.uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-emerald-500/30 text-[10px] font-mono text-emerald-200 transition"
                          >
                            <span className="truncate max-w-[220px]">{src.title}</span>
                            <ExternalLink className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 2E. INLINE DEEPMIND BIOSCIENCE 3D WORKBENCH CARD */}
                  {msg.bioScienceAnalysis && (
                    <BioScienceViewerCard analysis={msg.bioScienceAnalysis} />
                  )}

                  {/* 3. INLINE TALK-TO-BUILD ANDROID APP & .AAB BUNDLE CARD */}
                  {msg.generatedAppBundle && (
                    <div className="mt-3 rounded-2xl overflow-hidden border border-emerald-400/40 bg-slate-950/95 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                      <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 bg-slate-900/95 border-b border-white/10">
                        <div className="flex items-center gap-2 min-w-0">
                          <Smartphone className="w-4 h-4 text-emerald-400 shrink-0" />
                          <div>
                            <div className="text-xs font-mono font-bold text-white flex items-center gap-2">
                              <span>{msg.generatedAppBundle.appName}</span>
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                                v{msg.generatedAppBundle.versionName} • AAB READY
                              </span>
                            </div>
                            <div className="text-[10px] font-mono text-slate-400">
                              Package: {msg.generatedAppBundle.packageName} • Folder: {msg.generatedAppBundle.folderPath}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() =>
                              handleDownloadBase64Binary(
                                msg.generatedAppBundle!.aabBase64,
                                msg.generatedAppBundle!.aabFileName
                              )
                            }
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono text-xs font-extrabold shadow-[0_0_15px_rgba(16,185,129,0.4)] transition-all cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download .AAB ({msg.generatedAppBundle.aabSize})</span>
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleDownloadBase64Binary(
                                msg.generatedAppBundle!.aabBase64,
                                msg.generatedAppBundle!.apkFileName
                              )
                            }
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-emerald-300 border border-emerald-400/30 font-mono text-[11px] font-bold transition-all cursor-pointer"
                          >
                            <Download className="w-3 h-3" />
                            <span>.APK</span>
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setFullscreenHtmlPreview({
                                title: `${msg.generatedAppBundle!.appName} (${msg.generatedAppBundle!.packageName})`,
                                html: msg.generatedAppBundle!.previewHtml,
                              })
                            }
                            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition-all cursor-pointer"
                            title="Launch Fullscreen App Simulator"
                          >
                            <Maximize2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Embedded Live Interactive Android App Preview */}
                      <div className="w-full h-80 bg-slate-950 border-b border-white/10">
                        <iframe
                          title={`app-preview-${msg.generatedAppBundle.id}`}
                          srcDoc={msg.generatedAppBundle.previewHtml}
                          className="w-full h-full border-0"
                          sandbox="allow-scripts"
                        />
                      </div>

                      {/* Project Files Bar */}
                      <div className="p-3 bg-slate-900/90 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-mono text-emerald-300 font-bold flex items-center gap-1.5">
                            <Folder className="w-3.5 h-3.5" />
                            <span>Generated Project Folder: {msg.generatedAppBundle.folderPath} ({msg.generatedAppBundle.files.length} files)</span>
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedAppSource((prev) => ({
                                ...prev,
                                [msg.id]: !prev[msg.id],
                              }))
                            }
                            className="text-[11px] font-mono text-cyan-400 hover:underline cursor-pointer"
                          >
                            {expandedAppSource[msg.id] ? "Hide Source Files" : "View Source & Manifest Files"}
                          </button>
                        </div>

                        {expandedAppSource[msg.id] && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                            {msg.generatedAppBundle.files.map((f) => (
                              <div
                                key={f.id}
                                className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-black/50 border border-white/10 text-xs font-mono"
                              >
                                <span className="text-slate-200 truncate">{f.name}</span>
                                <button
                                  type="button"
                                  onClick={() => handleDownloadFileItem(f)}
                                  className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 text-[10px] font-bold shrink-0 cursor-pointer"
                                >
                                  <Download className="w-3 h-3" />
                                  <span>Download</span>
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 4. INLINE CREATED FOLDERS & ANY FILE TYPE ARTIFACTS */}
                  {!msg.generatedAppBundle && allCreatedFiles.length > 0 && (
                    <div className="mt-3 rounded-2xl overflow-hidden border border-cyan-400/30 bg-slate-950/90 p-3 space-y-2.5">
                      <div className="flex items-center justify-between border-b border-white/10 pb-2">
                        <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-300">
                          <Folder className="w-4 h-4 text-cyan-400" />
                          <span>
                            Folder: {msg.createdFolder || allCreatedFiles[0]?.folder || "/Workspace"}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-emerald-400">
                          {allCreatedFiles.length} {allCreatedFiles.length === 1 ? "File" : "Files"} Created
                        </span>
                      </div>

                      <div className="space-y-2">
                        {allCreatedFiles.map((file) => (
                          <div
                            key={file.id}
                            className="rounded-xl border border-white/10 bg-slate-900/80 p-2.5 flex flex-col gap-2"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <FileCode className="w-4 h-4 text-cyan-400 shrink-0" />
                                <span className="text-xs font-mono font-bold text-white truncate">
                                  {file.name}
                                </span>
                                <span className="text-[10px] font-mono text-slate-400 shrink-0">
                                  ({file.size})
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleDownloadFileItem(file)}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-400/40 text-[10px] font-mono font-bold transition-all cursor-pointer shrink-0"
                              >
                                <Download className="w-3 h-3" />
                                <span>Download {file.name}</span>
                              </button>
                            </div>
                            {file.content && (
                              <pre className="p-2 rounded-lg bg-black/60 border border-white/5 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-48 whitespace-pre-wrap">
                                {file.content}
                              </pre>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* If Detailed Markdown exists */}
                  {msg.detailedMarkdown && msg.detailedMarkdown !== msg.text && (
                    <div className="mt-2.5 pt-2.5 border-t border-white/10 text-xs text-slate-300 font-mono">
                      <p className="whitespace-pre-wrap">{msg.detailedMarkdown}</p>
                    </div>
                  )}

                  {/* Learned Fact Badge */}
                  {msg.learnedFact && (
                    <div className="mt-2.5 flex items-center gap-2 p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-mono text-emerald-300">
                      <Database className="w-3.5 h-3.5 flex-shrink-0 text-emerald-400" />
                      <span>Learned & Saved to Memory Bank: "{msg.learnedFact}"</span>
                    </div>
                  )}

                  {/* Action Executed Badge */}
                  {msg.actionExecuted && msg.actionExecuted.actionType !== "NONE" && (
                    <div className="mt-2 flex items-center gap-2 p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-[11px] font-mono text-cyan-300">
                      <Sparkles className="w-3.5 h-3.5 flex-shrink-0 text-cyan-400" />
                      <span>
                        Action: {msg.actionExecuted.actionType}{" "}
                        {msg.actionExecuted.target ? `(${msg.actionExecuted.target})` : ""}{" "}
                        {msg.actionExecuted.status ? `- ${msg.actionExecuted.status}` : ""}
                      </span>
                    </div>
                  )}

                  {/* Graceful Degradation State Banner */}
                  {msg.degradationState && (
                    <div className="mt-3 p-3 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-cyan-500/5 border border-amber-500/30 backdrop-blur-xl space-y-2.5 shadow-[0_4px_20px_rgba(245,158,11,0.15)]">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-xl bg-amber-500/20 border border-amber-400/30 text-amber-400">
                            <AlertTriangle className="w-4 h-4 animate-pulse" />
                          </div>
                          <div>
                            <div className="text-[11px] font-mono font-bold text-amber-300 tracking-wide uppercase flex items-center gap-1.5">
                              <span>Service Degraded</span>
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30">
                                {msg.degradationState.service}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono">
                              Target: {msg.degradationState.serviceName}
                            </span>
                          </div>
                        </div>

                        {msg.degradationState.offlineFallbackActive && (
                          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-400/30 text-[10px] font-mono text-cyan-300">
                            <CheckCircle2 className="w-3 h-3 text-cyan-400" />
                            <span>Safe-Mode Active</span>
                          </div>
                        )}
                      </div>

                      <div className="text-xs text-amber-200/90 font-mono bg-black/40 p-2.5 rounded-xl border border-amber-500/20 leading-relaxed">
                        <span className="text-amber-400 font-bold block mb-0.5 text-[10px] uppercase tracking-wider">
                          Diagnostic Telemetry:
                        </span>
                        {msg.degradationState.reason}
                      </div>

                      {msg.degradationState.troubleshootingTip && (
                        <div className="flex items-start gap-2 text-[11px] text-slate-300 font-sans">
                          <span className="text-cyan-400 font-bold text-xs mt-0.5">💡</span>
                          <span className="leading-snug">
                            {msg.degradationState.troubleshootingTip}
                          </span>
                        </div>
                      )}

                      {msg.degradationState.canRetry && (
                        <div className="pt-1 flex items-center justify-end">
                          <button
                            onClick={() => {
                              if (userProfile.soundEffects) soundEffects.playActivatePulse();
                              onSendMessage(msg.degradationState?.failedQuery || "Retry query");
                            }}
                            className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-300 text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>Retry with Cloud ASI</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Reasoning Steps Accordion (for DRAVIS messages) */}
                {!isUser && hasReasoning && (
                  <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden font-mono text-xs">
                    <button
                      onClick={() => toggleReasoning(msg.id)}
                      className="w-full px-3 py-1.5 flex items-center justify-between text-cyan-400 hover:text-cyan-300 transition-colors text-[11px]"
                    >
                      <div className="flex items-center gap-1.5">
                        <Cpu className="w-3 h-3" />
                        <span>Reasoning Trace ({msg.reasoningSteps?.length} steps)</span>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="px-3 py-2 border-t border-white/10 bg-black/30 space-y-1 text-[11px] text-slate-300"
                        >
                          {msg.reasoningSteps?.map((step, idx) => (
                            <div key={idx} className="flex items-start gap-2">
                              <span className="text-cyan-400 font-bold">•</span>
                              <span>{step}</span>
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* Speech Replay Button */}
                {!isUser && (
                  <div className="flex items-center gap-2 mt-0.5">
                    <button
                      onClick={() => onSpeakMessage(msg.text)}
                      className="flex items-center gap-1 text-[10px] font-mono text-slate-400 hover:text-cyan-400 transition-colors px-2 py-0.5 rounded-md hover:bg-white/5"
                    >
                      <Volume2 className="w-3 h-3" />
                      <span>Replay Voice</span>
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}

        {/* Live Synthesis Progress Bubble in Chat */}
        {isGeneratingImage && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3 max-w-2xl mr-auto"
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border bg-white/5 border-cyan-400/40 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.3)]">
              <Bot className="w-4 h-4 animate-pulse" />
            </div>
            <div className="p-4 rounded-2xl border border-cyan-400/30 bg-slate-900/80 backdrop-blur-xl text-slate-200 flex items-center gap-3 shadow-[0_0_25px_rgba(34,211,238,0.15)]">
              <Loader2 className="w-5 h-5 text-cyan-400 animate-spin shrink-0" />
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-mono font-bold text-cyan-300">
                  Dravis Universal Forge Synthesizing in Chat...
                </span>
                {generatingPrompt && (
                  <span className="text-[11px] font-mono text-slate-400">
                    Directive: "{generatingPrompt}"
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Hidden File Inputs for Image-to-Video & Audio Transcription */}
      <input
        ref={imageForVideoInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageForVideoSelect}
        className="hidden"
      />
      <input
        ref={audioUploadInputRef}
        type="file"
        accept="audio/*"
        onChange={handleAudioFileSelect}
        className="hidden"
      />

      {/* Input Bar with Universal 10-Skill Creation Mode Toggles */}
      <div className="flex flex-col gap-1.5">
        {creationMode !== "NONE" && (
          <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-1.5 rounded-xl bg-cyan-500/15 border border-cyan-400/40 text-xs font-mono text-cyan-300">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span>
                {creationMode === "IMAGE" && (
                  <><strong>Create & Edit Image Mode (Nano Banana 2.1):</strong> Describe any image to synthesize or click "Edit Image" on any render.</>
                )}
                {creationMode === "VIDEO" && (
                  <><strong>Veo 3.1 Text-to-Video & 60fps Animation Mode:</strong> Describe any video or animation scene to generate directly from text.</>
                )}
                {creationMode === "IMAGE_TO_VIDEO" && (
                  <>
                    <strong>Veo 3.1 Image-to-Video Mode:</strong>{" "}
                    {uploadedImageForVideo
                      ? "Reference frame loaded! Describe the camera motion or animation."
                      : "Upload a reference image or describe how to animate an image into video."}
                  </>
                )}
                {creationMode === "AUDIO_TRANSCRIBE" && (
                  <><strong>Gemini 3.5 Audio Transcriber:</strong> Record live voice, upload an audio file, or enter an audio transcription directive.</>
                )}
                {creationMode === "GEMINI_BOT" && (
                  <><strong>Gemini 4 Argon Dedicated Bot (@GeminiBot):</strong> Direct high-depth analytical & coding conversation.</>
                )}
                {creationMode === "GOOGLE_SEARCH" && (
                  <><strong>Google Search Live Grounding:</strong> Queries live Google web results with verified source citations.</>
                )}
                {creationMode === "MUSIC" && (
                  <><strong>Lyria 3 Music Studio:</strong> Describe the genre, instruments, mood, and BPM to synthesize a multi-track WAV song.</>
                )}
                {creationMode === "BIOSCIENCE" && (
                  <><strong>DeepMind BioScience Workbench:</strong> Enter any protein/gene (TP53, BRCA1, EGFR), drug (Imatinib, Aspirin), or rsID variant.</>
                )}
                {creationMode === "FILE_FOLDER" && (
                  <><strong>Universal File & Folder Mode:</strong> Name any folder or file type (.py, .js, .html, .json, .sql, .kt, etc.) to create it.</>
                )}
                {creationMode === "AAB_APP" && (
                  <><strong>Talk-to-Build Android .AAB Mode:</strong> Describe any app you want and Dravis will build it and give you the downloadable .AAB & .APK file!</>
                )}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {creationMode === "IMAGE_TO_VIDEO" && (
                <button
                  type="button"
                  onClick={() => imageForVideoInputRef.current?.click()}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-pink-500/20 border border-pink-400/40 text-pink-200 text-[10px] font-mono font-bold cursor-pointer"
                >
                  <Upload className="w-3 h-3" />
                  <span>{uploadedImageForVideo ? "Change Image" : "Upload Photo"}</span>
                </button>
              )}
              {creationMode === "AUDIO_TRANSCRIBE" && (
                <>
                  <button
                    type="button"
                    onClick={handleToggleAudioClipRecorder}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[10px] font-mono font-bold cursor-pointer ${
                      isRecordingAudioClip
                        ? "bg-red-500/30 border-red-400 text-red-200 animate-pulse"
                        : "bg-amber-500/20 border-amber-400/40 text-amber-200"
                    }`}
                  >
                    <Mic className="w-3 h-3" />
                    <span>{isRecordingAudioClip ? "Stop & Transcribe" : "Record Audio"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => audioUploadInputRef.current?.click()}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500/20 border border-amber-400/40 text-amber-200 text-[10px] font-mono font-bold cursor-pointer"
                  >
                    <Upload className="w-3 h-3" />
                    <span>Upload Audio</span>
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={() => setCreationMode("NONE")}
                className="text-slate-400 hover:text-white p-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Quick 10-Skill Creation Mode Selector Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
          <button
            type="button"
            onClick={() => {
              if (userProfile.soundEffects) soundEffects.playChirp();
              setCreationMode((prev) => (prev === "VIDEO" ? "NONE" : "VIDEO"));
            }}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-xl border text-[10px] font-mono font-bold transition-all cursor-pointer shrink-0 ${
              creationMode === "VIDEO"
                ? "bg-purple-400 text-slate-950 border-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.5)]"
                : "bg-white/5 border-white/10 text-purple-300 hover:bg-purple-500/15"
            }`}
          >
            <Film className="w-3 h-3" />
            <span>Text → Video / Animation</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (userProfile.soundEffects) soundEffects.playChirp();
              setCreationMode((prev) =>
                prev === "IMAGE_TO_VIDEO" ? "NONE" : "IMAGE_TO_VIDEO"
              );
            }}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-xl border text-[10px] font-mono font-bold transition-all cursor-pointer shrink-0 ${
              creationMode === "IMAGE_TO_VIDEO"
                ? "bg-pink-400 text-slate-950 border-pink-300 shadow-[0_0_12px_rgba(236,72,153,0.5)]"
                : "bg-white/5 border-white/10 text-pink-300 hover:bg-pink-500/15"
            }`}
          >
            <Sparkles className="w-3 h-3" />
            <span>Image → Video</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (userProfile.soundEffects) soundEffects.playChirp();
              setCreationMode((prev) => (prev === "IMAGE" ? "NONE" : "IMAGE"));
            }}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-xl border text-[10px] font-mono font-bold transition-all cursor-pointer shrink-0 ${
              creationMode === "IMAGE"
                ? "bg-cyan-400 text-slate-950 border-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.5)]"
                : "bg-white/5 border-white/10 text-cyan-300 hover:bg-cyan-500/15"
            }`}
          >
            <Wand2 className="w-3 h-3" />
            <span>Create / Edit Image</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (userProfile.soundEffects) soundEffects.playChirp();
              setCreationMode((prev) => (prev === "MUSIC" ? "NONE" : "MUSIC"));
            }}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-xl border text-[10px] font-mono font-bold transition-all cursor-pointer shrink-0 ${
              creationMode === "MUSIC"
                ? "bg-violet-400 text-slate-950 border-violet-300 shadow-[0_0_12px_rgba(139,92,246,0.5)]"
                : "bg-white/5 border-white/10 text-violet-300 hover:bg-violet-500/15"
            }`}
          >
            <Music className="w-3 h-3" />
            <span>Generate Music</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (userProfile.soundEffects) soundEffects.playChirp();
              setCreationMode((prev) =>
                prev === "AUDIO_TRANSCRIBE" ? "NONE" : "AUDIO_TRANSCRIBE"
              );
            }}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-xl border text-[10px] font-mono font-bold transition-all cursor-pointer shrink-0 ${
              creationMode === "AUDIO_TRANSCRIBE"
                ? "bg-amber-400 text-slate-950 border-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.5)]"
                : "bg-white/5 border-white/10 text-amber-300 hover:bg-amber-500/15"
            }`}
          >
            <FileAudio className="w-3 h-3" />
            <span>Transcribe Audio</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (userProfile.soundEffects) soundEffects.playChirp();
              setCreationMode((prev) =>
                prev === "GEMINI_BOT" ? "NONE" : "GEMINI_BOT"
              );
            }}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-xl border text-[10px] font-mono font-bold transition-all cursor-pointer shrink-0 ${
              creationMode === "GEMINI_BOT"
                ? "bg-blue-400 text-slate-950 border-blue-300 shadow-[0_0_12px_rgba(59,130,246,0.5)]"
                : "bg-white/5 border-white/10 text-blue-300 hover:bg-blue-500/15"
            }`}
          >
            <Bot className="w-3 h-3" />
            <span>Gemini Bot</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (userProfile.soundEffects) soundEffects.playChirp();
              setCreationMode((prev) =>
                prev === "GOOGLE_SEARCH" ? "NONE" : "GOOGLE_SEARCH"
              );
            }}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-xl border text-[10px] font-mono font-bold transition-all cursor-pointer shrink-0 ${
              creationMode === "GOOGLE_SEARCH"
                ? "bg-emerald-400 text-slate-950 border-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.5)]"
                : "bg-white/5 border-white/10 text-emerald-300 hover:bg-emerald-500/15"
            }`}
          >
            <Globe className="w-3 h-3" />
            <span>Google Search</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (userProfile.soundEffects) soundEffects.playChirp();
              setCreationMode((prev) =>
                prev === "BIOSCIENCE" ? "NONE" : "BIOSCIENCE"
              );
            }}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-xl border text-[10px] font-mono font-bold transition-all cursor-pointer shrink-0 ${
              creationMode === "BIOSCIENCE"
                ? "bg-teal-400 text-slate-950 border-teal-300 shadow-[0_0_12px_rgba(20,184,166,0.5)]"
                : "bg-white/5 border-white/10 text-teal-300 hover:bg-teal-500/15"
            }`}
          >
            <Dna className="w-3 h-3" />
            <span>BioScience 3D</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (userProfile.soundEffects) soundEffects.playChirp();
              setCreationMode((prev) =>
                prev === "FILE_FOLDER" ? "NONE" : "FILE_FOLDER"
              );
            }}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-xl border text-[10px] font-mono font-bold transition-all cursor-pointer shrink-0 ${
              creationMode === "FILE_FOLDER"
                ? "bg-orange-400 text-slate-950 border-orange-300"
                : "bg-white/5 border-white/10 text-orange-300 hover:bg-orange-500/15"
            }`}
          >
            <FolderPlus className="w-3 h-3" />
            <span>File / Folder</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (userProfile.soundEffects) soundEffects.playChirp();
              setCreationMode((prev) => (prev === "AAB_APP" ? "NONE" : "AAB_APP"));
            }}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-xl border text-[10px] font-mono font-bold transition-all cursor-pointer shrink-0 ${
              creationMode === "AAB_APP"
                ? "bg-lime-400 text-slate-950 border-lime-300"
                : "bg-white/5 border-white/10 text-lime-300 hover:bg-lime-500/15"
            }`}
          >
            <Smartphone className="w-3 h-3" />
            <span>Build .AAB</span>
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className={`flex items-center gap-2 p-2 rounded-2xl border backdrop-blur-xl shadow-[0_0_20px_rgba(0,0,0,0.3)] transition-all ${
            creationMode !== "NONE"
              ? "border-cyan-400/60 bg-cyan-950/20 shadow-[0_0_25px_rgba(34,211,238,0.2)]"
              : "border-white/10 bg-white/5"
          }`}
        >
          <button
            type="button"
            onClick={onToggleMic}
            title="Voice Input"
            className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
              isListening
                ? "bg-emerald-500/20 border-emerald-400 text-emerald-300 animate-pulse shadow-[0_0_15px_rgba(52,211,153,0.5)]"
                : "bg-white/5 border-white/10 text-cyan-400 hover:bg-white/10"
            }`}
          >
            {isListening ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
          </button>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              creationMode === "IMAGE"
                ? "Describe the exact image you want Dravis to generate..."
                : creationMode === "VIDEO"
                ? "Describe the animation or video scene you want Dravis to create..."
                : creationMode === "FILE_FOLDER"
                ? "e.g., 'Create folder MyProject with main.py' or 'Create index.html'..."
                : creationMode === "AAB_APP"
                ? "Describe the Android app you want to build and export as an .AAB file..."
                : "Ask Dravis to chat, create images, animations/videos, folders/files, or build an Android .AAB app..."
            }
            className="flex-1 bg-transparent px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none font-sans"
          />

          <button
            type="submit"
            disabled={!input.trim() || isGeneratingImage}
            className="p-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 disabled:opacity-40 text-slate-950 font-bold transition-all shadow-[0_0_12px_rgba(34,211,238,0.4)] cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Fullscreen Lightbox Modal for Generated Images */}
      <AnimatePresence>
        {fullscreenImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setFullscreenImage(null)}
            className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-2xl flex flex-col items-center justify-center p-4 sm:p-8"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-4xl w-full bg-slate-900/90 border border-cyan-400/40 rounded-3xl overflow-hidden shadow-[0_0_60px_rgba(34,211,238,0.25)] flex flex-col"
            >
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-slate-950/80">
                <div className="flex items-center gap-2 min-w-0">
                  <ImageIcon className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span className="text-xs sm:text-sm font-mono font-bold text-white truncate">
                    {fullscreenImage.prompt}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() =>
                      handleDownloadImage(fullscreenImage.url, fullscreenImage.prompt)
                    }
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-300 text-xs font-mono font-bold transition-all cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFullscreenImage(null)}
                    className="p-1.5 rounded-xl bg-white/5 hover:bg-red-500/20 text-slate-300 hover:text-red-300 border border-white/10 transition-all cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="p-4 flex items-center justify-center bg-black/60 max-h-[75vh] overflow-auto">
                <img
                  src={fullscreenImage.url}
                  alt={fullscreenImage.prompt}
                  referrerPolicy="no-referrer"
                  className="max-w-full max-h-[70vh] object-contain rounded-xl"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fullscreen Modal for Interactive Animation / App Simulator */}
      <AnimatePresence>
        {fullscreenHtmlPreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setFullscreenHtmlPreview(null)}
            className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-2xl flex flex-col items-center justify-center p-4 sm:p-8"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-5xl w-full h-[82vh] bg-slate-900/95 border border-cyan-400/40 rounded-3xl overflow-hidden shadow-[0_0_60px_rgba(34,211,238,0.25)] flex flex-col"
            >
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-slate-950/80">
                <span className="text-xs sm:text-sm font-mono font-bold text-cyan-300 truncate">
                  {fullscreenHtmlPreview.title}
                </span>
                <button
                  type="button"
                  onClick={() => setFullscreenHtmlPreview(null)}
                  className="p-1.5 rounded-xl bg-white/5 hover:bg-red-500/20 text-slate-300 hover:text-red-300 border border-white/10 transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 bg-black">
                <iframe
                  title="fullscreen-preview"
                  srcDoc={fullscreenHtmlPreview.html}
                  className="w-full h-full border-0"
                  sandbox="allow-scripts"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

