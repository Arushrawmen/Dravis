/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Dravis Android OS — Ultra-Clean Liquid Glass Edition
 * - Main Screen ("Dravis"): Pure, borderless, glowing cute Dravis Flame-Spirit animation
 *   floating, swaying, dancing, and lip-syncing in real time (zero borders, zero typing bar, zero clutter).
 * - Bottom Liquid Glass Bar with 3 clean options:
 *   1. Dravis (Main borderless character screen)
 *   2. Chats (With Direct Calling Hub at the top + Full AI Chat & Media)
 *   3. Settings (All Device & Hardware Controls, Real Folders/Files, Apps, Screen Monitor & Customizations)
 * - Micro-Decision Engine runs silently in the background (3D 360° screen hidden in Android mode).
 */

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Wifi,
  WifiOff,
  Signal,
  Plane,
  Flashlight,
  Bluetooth,
  Phone,
  PhoneOff,
  Mail,
  HardDrive,
  Calendar,
  Users,
  MapPin,
  Mic,
  MicOff,
  X,
  Send,
  MessageSquare,
  Sliders,
  BatteryCharging,
  Sparkles,
  User,
  Monitor,
  Search,
  Camera,
  Maximize2,
  Minimize2,
  FolderPlus,
  Smartphone,
  CheckCircle2,
  MessageCircle,
  Brain,
  FolderKanban,
  Layers,
  Heart,
  Activity,
  Settings,
  Cpu,
  History,
  ShieldCheck,
  Puzzle,
  Workflow,
  LogOut,
  UserPlus,
  ArrowLeftRight,
  Globe,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  VoiceState,
  DeviceSystemControls,
  ActiveCallState,
  ContactSelectionPrompt,
  MusicPlaybackState,
  ContactItem,
  ContactPhone,
  UserProfile,
  UserAccount,
  MicroDecisionNode,
  NavigationTab,
  DRAVIS_LANGUAGES,
} from "../types";
import { soundEffects } from "../utils/audioSynth";
import { ScreenMonitorControlStrip } from "./ScreenMonitorControlStrip";
import { GoogleAdSenseBanner } from "./AdSense/GoogleAdSenseBanner";
import {
  COUNTRY_CODE_OPTIONS,
  deviceHardware,
} from "../utils/deviceHardware";
import dravisSparkLogo from "../assets/images/dravis_spark_logo_1789562293560.jpg";

interface AndroidMobileResolutionViewProps {
  onExitMobileResolution: () => void;
  voiceState: VoiceState;
  isListening: boolean;
  onToggleListening: () => void;
  onSendChatMessage: (text: string) => void;
  chatMessages: Array<{
    id?: string;
    role: "user" | "assistant";
    content: string;
    timestamp: string;
    generatedImage?: {
      prompt: string;
      url: string;
    };
    multiTaskExecuted?: {
      launchedApps: {
        id: string;
        name: string;
        webUrl: string;
        windowsUri?: string;
        androidUri?: string;
        routingMode: "DESKTOP_NATIVE" | "BROWSER_AUTO" | "CHROME_EXPLICIT";
        routingReason: string;
        accentColor: string;
      }[];
      hardwareChanges?: string[];
      answeredQuestion?: string;
    };
  }>;
  deviceControls: DeviceSystemControls;
  onToggleDeviceControl: (control: keyof DeviceSystemControls) => void;
  activeCall: ActiveCallState | null;
  onEndCall: () => void;
  onToggleMute: () => void;
  onToggleSpeaker: () => void;
  onToggleRecording?: () => void;
  contactPrompt: ContactSelectionPrompt | null;
  onSelectPhoneNumber: (number: string, label: string) => void;
  onCancelContactPrompt: () => void;
  musicPlayback: MusicPlaybackState | null;
  onTogglePlayMusic: () => void;
  onNextTrack: () => void;
  onCloseMusic: () => void;
  contacts: ContactItem[];
  onDirectCallContact: (contact: ContactItem, phone: ContactPhone) => void;
  onAddContact?: (contact: ContactItem) => void;
  onImportContacts?: (contacts: ContactItem[]) => void;
  userProfile: UserProfile;
  userAccount: UserAccount;
  wakeWord: string;
  wakeWordActive: boolean;
  onToggleWakeWord: (active: boolean) => void;
  onOpenUniversalSettings: () => void;
  isSettingsOpen: boolean;
  onCloseSettings: () => void;
  deviceStatusFeedback: {
    label: string;
    active: boolean;
    type: "WIFI" | "DATA" | "FLIGHT" | "TORCH" | "BT";
  } | null;
  onOpenCamera?: () => void;
  // Background Micro-Decision & 1:1 Desktop Parity Props
  microDecisions?: MicroDecisionNode[];
  selectedDecisionNode?: MicroDecisionNode | null;
  onSelectDecisionNode?: (node: MicroDecisionNode) => void;
  onExecuteMicroDecision?: (node: MicroDecisionNode) => void;
  onLaunchApp?: (appKeyOrName: string) => void;
  onCreateRealFolder?: (
    folderName: string,
    fileName?: string,
    fileContent?: string
  ) => Promise<void>;
  onOpenDesktopModule?: (tab: NavigationTab) => void;
  defaultCountryCode?: string;
  onChangeCountryCode?: (code: string) => void;
  renderDesktopModuleContent?: () => React.ReactNode;
  activeDesktopModuleInAndroid?: NavigationTab | null;
  onCloseDesktopModuleInAndroid?: () => void;
  onSpeakEmotionalCheckIn?: (spokenText: string) => void;
  savedAccounts?: UserAccount[];
  onSwitchAccount?: (account: UserAccount) => void;
  onAddAccount?: (newAccount: UserAccount, switchImmediately: boolean) => void;
  onLogOut?: () => void;
  accountHistoryCounts?: Record<string, { chats: number; memories: number; logs: number }>;
  onOpenGitHubModal?: () => void;
  onOpenAndroidCli?: () => void;
  onUpdateUserProfile?: (updated: UserProfile) => void;
}

export const AndroidMobileResolutionView: React.FC<AndroidMobileResolutionViewProps> = ({
  onExitMobileResolution,
  voiceState,
  isListening,
  onToggleListening,
  onSendChatMessage,
  chatMessages,
  deviceControls,
  onToggleDeviceControl,
  activeCall,
  onEndCall,
  onToggleMute,
  onToggleRecording,
  contacts,
  onDirectCallContact,
  onAddContact,
  onImportContacts,
  userProfile,
  userAccount,
  wakeWord,
  wakeWordActive,
  onToggleWakeWord,
  deviceStatusFeedback,
  onOpenCamera,
  microDecisions = [],
  selectedDecisionNode,
  onExecuteMicroDecision,
  onLaunchApp,
  onCreateRealFolder,
  onOpenDesktopModule,
  defaultCountryCode = "+91",
  onChangeCountryCode,
  renderDesktopModuleContent,
  activeDesktopModuleInAndroid,
  onCloseDesktopModuleInAndroid,
  onSpeakEmotionalCheckIn,
  savedAccounts = [],
  onSwitchAccount,
  onAddAccount,
  onLogOut,
  accountHistoryCounts = {},
  onOpenGitHubModal,
  onOpenAndroidCli,
  onUpdateUserProfile,
}) => {
  // Bottom Liquid Glass Bar has ONLY the 3 requested tabs: "DRAVIS" | "CHATS" | "SETTINGS"
  const [activeTab, setActiveTab] = useState<"DRAVIS" | "CHATS" | "SETTINGS">("DRAVIS");
  const [isFullViewportMobile, setIsFullViewportMobile] = useState<boolean>(() =>
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );

  // Inside Chats: Expandable Call Contacts Drawer at the top
  const [isCallContactsExpanded, setIsCallContactsExpanded] = useState<boolean>(false);

  // Inside Settings: Clean section filter so nothing looks congested
  const [settingsSubSection, setSettingsSubSection] = useState<
    "ALL" | "PROFILE" | "HARDWARE" | "FILES" | "MODULES"
  >("ALL");
  const [isLanguageListOpen, setIsLanguageListOpen] = useState<boolean>(false);

  // Android Add Account Drawer State inside Profile & Accounts
  const [isAddingAccountAndroid, setIsAddingAccountAndroid] = useState(false);
  const [newAccNameAndroid, setNewAccNameAndroid] = useState("");
  const [newAccEmailAndroid, setNewAccEmailAndroid] = useState("");
  const [newAccRoleAndroid, setNewAccRoleAndroid] = useState("Authorized Operator");
  const [accountActionFeedback, setAccountActionFeedback] = useState<string | null>(null);

  const [inputText, setInputText] = useState("");
  const [currentTime, setCurrentTime] = useState("");
  const [contactSearchQuery, setContactSearchQuery] = useState("");
  const [selectedCountryCode, setSelectedCountryCode] = useState(defaultCountryCode);
  const [directDialInput, setDirectDialInput] = useState("");
  const [contactSyncMessage, setContactSyncMessage] = useState<string | null>(null);
  const vcfInputRef = useRef<HTMLInputElement | null>(null);

  // Real Folder Creator State inside Settings
  const [androidFolderName, setAndroidFolderName] = useState("Dravis_Mobile_Workspace");
  const [androidFileName, setAndroidFileName] = useState("notes.md");
  const [folderStatusMsg, setFolderStatusMsg] = useState<string | null>(null);

  // Borderless Main Screen Dravis Character Animation & Lip-Sync State
  const [mouthOpen, setMouthOpen] = useState<number>(0.18);
  const [isBlinking, setIsBlinking] = useState<boolean>(false);
  const [stepPhase, setStepPhase] = useState<number>(0);
  const [eyeOffset, setEyeOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [floatingHearts, setFloatingHearts] = useState<number[]>([]);
  const mainStageRef = useRef<HTMLDivElement | null>(null);
  const ambientCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);

  const isSpeaking = voiceState === "SPEAKING";
  const isThinking = voiceState === "THINKING";
  const activeListening = isListening || voiceState === "LISTENING";

  // Keep Micro-Decision system silently working in background whenever commands run
  const latestMicroDecision = selectedDecisionNode || microDecisions[0] || null;
  useEffect(() => {
    if (chatMessages.length > 0 && latestMicroDecision && onExecuteMicroDecision) {
      // Micro-decision system stays active in background without showing the 3D 360 screen
    }
  }, [chatMessages.length]);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })
      );
    };
    updateClock();
    const timer = setInterval(updateClock, 10000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (activeTab === "CHATS") {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, activeTab]);

  // Natural Eye Blinking Loop for Main Screen Dravis
  useEffect(() => {
    const blinkTimer = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 140);
    }, 3100);
    return () => clearInterval(blinkTimer);
  }, []);

  // Real-Time Lip-Sync & Dancing Step Loop for Main Screen Dravis
  useEffect(() => {
    const interval = setInterval(() => {
      setStepPhase((prev) => (prev + 1) % 4);
      if (isSpeaking) {
        // Active lip-sync syllabus articulation while Dravis speaks
        setMouthOpen(0.32 + Math.random() * 0.68);
      } else if (activeListening) {
        // Attentive happy expression while listening to user
        setMouthOpen(0.22 + Math.random() * 0.25);
      } else if (isThinking) {
        setMouthOpen(0.2 + Math.sin(Date.now() * 0.012) * 0.12);
      } else {
        setMouthOpen(0.14 + Math.sin(Date.now() * 0.004) * 0.05);
      }
    }, 85);
    return () => clearInterval(interval);
  }, [isSpeaking, activeListening, isThinking]);

  // Borderless Ambient Fireflies & Soft Glow Particles on Main Screen
  useEffect(() => {
    if (activeTab !== "DRAVIS") return;
    const canvas = ambientCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId = 0;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 420);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 680);

    const handleResize = () => {
      if (!canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };
    window.addEventListener("resize", handleResize);

    const sparkles = Array.from({ length: 34 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.7,
      vy: -0.25 - Math.random() * 0.55,
      r: 1.2 + Math.random() * 2.4,
      phase: Math.random() * Math.PI * 2,
      isGold: Math.random() > 0.45,
    }));

    let t = 0;
    const render = () => {
      t += 0.025;
      ctx.clearRect(0, 0, width, height);

      for (const s of sparkles) {
        s.x += s.vx + Math.sin(t + s.phase) * 0.3;
        s.y += s.vy * (isSpeaking ? 1.6 : 1);
        if (s.y < -10) s.y = height + 10;
        if (s.x < -10) s.x = width + 10;
        if (s.x > width + 10) s.x = -10;

        const alpha = 0.4 + 0.5 * Math.sin(t * 2.4 + s.phase);
        const grad = ctx.createRadialGradient(s.x, s.y, 0.2, s.x, s.y, s.r * 4);
        grad.addColorStop(
          0,
          s.isGold
            ? `rgba(251, 191, 36, ${alpha})`
            : `rgba(34, 211, 238, ${alpha})`
        );
        grad.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r * 4, 0, Math.PI * 2);
        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
    };
  }, [activeTab, isSpeaking]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    soundEffects.playChirp();
    onSendChatMessage(inputText.trim());
    setInputText("");
  };

  const formatCallTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const rem = sec % 60;
    return `${String(mins).padStart(2, "0")}:${String(rem).padStart(2, "0")}`;
  };

  const filteredContacts = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(contactSearchQuery.toLowerCase()) ||
      c.numbers.some((n) => n.number.includes(contactSearchQuery))
  );

  const handleDirectDialCall = () => {
    if (!directDialInput.trim()) return;
    soundEffects.playChirp();
    const formatted = deviceHardware.formatPhoneWithCountryCode(
      directDialInput.trim(),
      selectedCountryCode
    );
    const existing = contacts.find((c) =>
      c.numbers.some(
        (n) =>
          n.number.replace(/[^\d]/g, "").slice(-10) ===
          formatted.replace(/[^\d]/g, "").slice(-10)
      )
    );
    onDirectCallContact(
      existing || {
        id: "dial-" + Date.now(),
        name: existing ? existing.name : `Number (${formatted})`,
        numbers: [{ label: "Mobile", number: formatted }],
      },
      { label: "Mobile", number: formatted }
    );
    setDirectDialInput("");
  };

  const handleSyncAndroidContacts = async () => {
    soundEffects.playChirp();
    if (deviceHardware.isNativeContactPickerSupported()) {
      const picked = await deviceHardware.pickDeviceContacts(selectedCountryCode);
      if (picked.length > 0) {
        if (onImportContacts) {
          onImportContacts(picked);
        } else if (onAddContact) {
          picked.forEach((c) => onAddContact(c));
        }
        setContactSyncMessage(`Synced ${picked.length} contact(s)!`);
        setTimeout(() => setContactSyncMessage(null), 3500);
        return;
      }
    }
    vcfInputRef.current?.click();
  };

  const handleVcfFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const parsed = deviceHardware.parseVCardContacts(
        String(ev.target?.result || ""),
        selectedCountryCode
      );
      if (parsed.length > 0) {
        if (onImportContacts) {
          onImportContacts(parsed);
        } else if (onAddContact) {
          parsed.forEach((c) => onAddContact(c));
        }
        setContactSyncMessage(`Imported ${parsed.length} contact(s) from ${file.name}!`);
      }
      setTimeout(() => setContactSyncMessage(null), 4000);
    };
    reader.readAsText(file);
  };

  const handleCreateRealFolderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await deviceHardware.createRealFolderOnDevice(androidFolderName, [
      {
        name: androidFileName || "README.md",
        content: `# ${androidFolderName}\nCreated via DRAVIS Android OS.`,
      },
    ]);
    setFolderStatusMsg(res.detail);
    if (onCreateRealFolder) {
      await onCreateRealFolder(androidFolderName, androidFileName);
    }
    setTimeout(() => setFolderStatusMsg(null), 5000);
  };

  const handlePointerMoveOnMain = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!mainStageRef.current) return;
    const rect = mainStageRef.current.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / Math.max(1, rect.width) - 0.5) * 2;
    const ny = ((e.clientY - rect.top) / Math.max(1, rect.height) - 0.5) * 2;
    setEyeOffset({
      x: Math.max(-5, Math.min(5, nx * 5)),
      y: Math.max(-3.8, Math.min(3.8, ny * 3.8)),
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#020614]/95 backdrop-blur-3xl flex flex-col items-center justify-center p-0 sm:p-3 overflow-hidden select-none">
      {/* Top Bar when viewing on Desktop screen: Switch back to Desktop or Toggle Full-Screen Android */}
      <div className="hidden sm:flex items-center justify-between w-full max-w-[430px] mb-2 px-2">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              soundEffects.playChirp();
              onExitMobileResolution();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full liquid-glass text-cyan-200 font-mono text-xs hover:border-cyan-400/60 transition-all cursor-pointer"
          >
            <Monitor className="w-3.5 h-3.5 text-cyan-400" />
            <span>Desktop Mode</span>
          </button>

          {onOpenGitHubModal && (
            <button
              onClick={() => {
                soundEffects.playChirp();
                onOpenGitHubModal();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full liquid-glass text-white hover:text-cyan-300 font-mono text-xs transition-all cursor-pointer"
              title="Push App to GitHub"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              <span>GitHub</span>
            </button>
          )}
        </div>

        <button
          onClick={() => {
            const nextVal = !isFullViewportMobile;
            setIsFullViewportMobile(nextVal);
            if (nextVal && !document.fullscreenElement) {
              document.documentElement.requestFullscreen?.().catch(() => {});
            } else if (!nextVal && document.fullscreenElement) {
              document.exitFullscreen?.().catch(() => {});
            }
          }}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full liquid-glass text-slate-200 font-mono text-xs transition-all cursor-pointer"
        >
          {isFullViewportMobile ? (
            <>
              <Minimize2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Phone Frame</span>
            </>
          ) : (
            <>
              <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Full Screen</span>
            </>
          )}
        </button>
      </div>

      {/* ANDROID LIQUID GLASS CONTAINER */}
      <div
        id="android-mobile-resolution-frame"
        className={`relative bg-gradient-to-b from-[#030917] via-[#051026] to-[#020612] flex flex-col overflow-hidden transition-all ${
          isFullViewportMobile
            ? "w-full h-full rounded-none border-0"
            : "w-full sm:w-[420px] h-full sm:h-[88vh] sm:max-h-[850px] sm:rounded-[48px] border-0 sm:border-[5px] border-white/10 shadow-[0_0_80px_rgba(6,182,212,0.22)]"
        }`}
      >
        {/* Soft Liquid Glass Ambient Backlights */}
        <div className="pointer-events-none absolute -top-24 -left-24 w-72 h-72 rounded-full bg-cyan-500/12 blur-3xl" />
        <div className="pointer-events-none absolute bottom-12 -right-24 w-72 h-72 rounded-full bg-amber-500/10 blur-3xl" />

        {/* 1. MINIMAL CLEAN ANDROID STATUS BAR */}
        <div className="relative z-30 flex items-center justify-between px-5 pt-3 pb-2 text-xs font-mono text-slate-200">
          <div className="flex items-center gap-2">
            <span className="font-bold tracking-wider text-white tabular-nums">
              {currentTime || "12:00"}
            </span>
            <button
              onClick={onExitMobileResolution}
              className="sm:hidden px-2 py-0.5 rounded-full bg-white/10 border border-white/15 text-[9px] text-cyan-300 font-bold"
            >
              PC
            </button>
          </div>

          {/* Sleek Dynamic Island Pill */}
          <motion.div
            layout
            onClick={() => {
              soundEffects.playChirp();
              onToggleListening();
            }}
            className="px-3.5 py-1 rounded-full bg-black/75 backdrop-blur-xl border border-white/10 flex items-center gap-2 cursor-pointer"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                activeListening
                  ? "bg-emerald-400 animate-ping"
                  : isSpeaking
                  ? "bg-cyan-400 animate-pulse"
                  : activeCall?.isActive
                  ? "bg-emerald-400 animate-pulse"
                  : "bg-cyan-400/80"
              }`}
            />
            <span className="text-[10px] font-mono font-bold text-cyan-200 truncate max-w-[140px]">
              {activeCall?.isActive
                ? `${activeCall.contactName} • ${formatCallTime(activeCall.durationSeconds)}`
                : deviceStatusFeedback
                ? `${deviceStatusFeedback.label}: ${deviceStatusFeedback.active ? "ON" : "OFF"}`
                : isSpeaking
                ? "Dravis Speaking..."
                : activeListening
                ? "Listening..."
                : "Dravis AI"}
            </span>
          </motion.div>

          {/* Right Status Icons */}
          <div className="flex items-center gap-1.5">
            {deviceControls.flightMode ? (
              <Plane className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <>
                {deviceControls.wifi ? (
                  <Wifi className="w-3.5 h-3.5 text-cyan-400" />
                ) : (
                  <WifiOff className="w-3.5 h-3.5 text-slate-600" />
                )}
                <Signal
                  className={`w-3.5 h-3.5 ${
                    deviceControls.mobileData ? "text-emerald-400" : "text-slate-600"
                  }`}
                />
              </>
            )}
            <BatteryCharging className="w-4 h-4 text-emerald-400" />
          </div>
        </div>

        {/* ACTIVE CALL OVERLAY BANNER (When a phone call is active) */}
        <AnimatePresence>
          {activeCall?.isActive && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mx-4 mt-1 p-3 rounded-3xl liquid-glass border border-emerald-400/50 z-30 flex items-center justify-between shadow-xl"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-emerald-300">
                  <Phone className="w-4 h-4 animate-bounce" />
                </div>
                <div>
                  <span className="text-xs font-mono font-bold text-white block">
                    {activeCall.contactName}
                  </span>
                  <span className="text-[10px] font-mono text-emerald-300 tabular-nums">
                    {activeCall.number} •{" "}
                    {activeCall.status === "CONNECTED"
                      ? formatCallTime(activeCall.durationSeconds)
                      : activeCall.status}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {onToggleRecording && (
                  <button
                    onClick={onToggleRecording}
                    className={`px-2.5 py-1.5 rounded-xl border font-mono text-[10px] font-bold flex items-center gap-1 ${
                      activeCall.isRecording
                        ? "bg-rose-500/30 border-rose-400 text-rose-200"
                        : "bg-white/10 border-white/15 text-slate-200"
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        activeCall.isRecording ? "bg-rose-400 animate-ping" : "bg-rose-400"
                      }`}
                    />
                    <span>
                      {activeCall.isRecording
                        ? `REC ${formatCallTime(activeCall.recordingDurationSeconds || 0)}`
                        : "REC"}
                    </span>
                  </button>
                )}
                <a
                  href={`tel:${activeCall.number}`}
                  target="_top"
                  className="px-2.5 py-1.5 rounded-xl bg-emerald-400 text-slate-950 font-mono text-[10px] font-bold"
                >
                  Dialer
                </a>
                <button
                  onClick={onToggleMute}
                  className={`p-2 rounded-xl border ${
                    activeCall.isMuted
                      ? "bg-amber-500/30 border-amber-400 text-amber-200"
                      : "bg-white/10 border-white/10 text-white"
                  }`}
                >
                  {activeCall.isMuted ? (
                    <MicOff className="w-3.5 h-3.5" />
                  ) : (
                    <Mic className="w-3.5 h-3.5" />
                  )}
                </button>
                <button
                  onClick={onEndCall}
                  className="p-2 rounded-xl bg-red-600 text-white shadow-lg"
                >
                  <PhoneOff className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* DESKTOP MODULE OVERLAY (When opened from Settings -> Modules, excluding 3D Micro-Decision) */}
        {activeDesktopModuleInAndroid &&
        activeDesktopModuleInAndroid !== "MICRO_DECISION" &&
        renderDesktopModuleContent ? (
          <div className="flex-1 flex flex-col overflow-hidden relative z-20 pb-20">
            <div className="flex items-center justify-between px-4 py-2.5 liquid-glass border-b border-white/10">
              <span className="text-xs font-mono font-bold text-cyan-300">
                {activeDesktopModuleInAndroid}
              </span>
              <button
                onClick={onCloseDesktopModuleInAndroid}
                className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-xs font-mono text-white flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Back to Settings</span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto flex flex-col">
              {renderDesktopModuleContent()}
            </div>
          </div>
        ) : (
          /* =================================================================
             2. MAIN ANDROID SCREEN AREA (3 CLEAN MODES: DRAVIS, CHATS, SETTINGS)
             ================================================================= */
          <div className="flex-1 overflow-y-auto flex flex-col z-10 pb-24">
            {/* ===============================================================
                TAB 1: DRAVIS (MAIN SCREEN)
                Pure, borderless, glowing cute Dravis Flame-Spirit animation!
                Roams, sways, dances, and lip-syncs when speaking.
                NO borders, NO boxes, NO typing input, ZERO congestion!
               =============================================================== */}
            {activeTab === "DRAVIS" && (
              <div
                ref={mainStageRef}
                onPointerMove={handlePointerMoveOnMain}
                onPointerLeave={() => setEyeOffset({ x: 0, y: 0 })}
                className="relative flex-1 flex flex-col items-center justify-center px-6 overflow-hidden"
              >
                {/* Borderless Ambient Sparkles & Fireflies Canvas */}
                <canvas
                  ref={ambientCanvasRef}
                  className="pointer-events-none absolute inset-0 w-full h-full"
                />

                {/* Soft Borderless Radial Aura Behind Dravis */}
                <motion.div
                  className="pointer-events-none absolute w-72 h-72 rounded-full bg-gradient-to-tr from-cyan-400/20 via-amber-300/15 to-transparent blur-3xl"
                  animate={{
                    scale: isSpeaking ? [1, 1.28, 1] : activeListening ? [1, 1.18, 1] : [1, 1.08, 1],
                    opacity: isSpeaking ? [0.65, 0.95, 0.65] : [0.45, 0.7, 0.45],
                  }}
                  transition={{ repeat: Infinity, duration: isSpeaking ? 1.1 : 3.2 }}
                />

                {/* BORDERLESS, FREE-FLOATING, SWAYING & DANCING CUTE DRAVIS CHARACTER */}
                <motion.div
                  onClick={() => {
                    soundEffects.playWakeWordPing();
                    setFloatingHearts([Date.now(), Date.now() + 1, Date.now() + 2]);
                    onToggleListening();
                  }}
                  animate={{
                    x: isSpeaking
                      ? [0, -10, 10, -6, 6, 0]
                      : [-22, 24, -16, 20, -22],
                    y: isSpeaking
                      ? [0, -14, 0, -10, 0]
                      : [-14, 10, -18, 8, -14],
                    rotate: isSpeaking
                      ? [0, -6, 6, -4, 4, 0]
                      : [-5, 6, -4, 5, -5],
                    scale: isSpeaking ? [1, 1.07, 1] : [1, 1.03, 1],
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: isSpeaking ? 2.2 : 8.5,
                    ease: "easeInOut",
                  }}
                  whileTap={{ scale: 0.93 }}
                  className="relative z-10 w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center cursor-pointer select-none"
                  title="Tap Dravis to Talk"
                >
                  {/* Softly Feathered Borderless Original Flame Aura (Masked to Circle with Zero Edges!) */}
                  <motion.img
                    src={dravisSparkLogo}
                    alt=""
                    className="pointer-events-none absolute w-52 h-52 rounded-full object-cover opacity-40 blur-md mix-blend-screen [mask-image:radial-gradient(circle,black_35%,transparent_72%)]"
                    animate={{
                      scale: isSpeaking ? [1, 1.18, 1] : [0.96, 1.06, 0.96],
                    }}
                    transition={{ repeat: Infinity, duration: isSpeaking ? 0.9 : 2.8 }}
                  />

                  {/* Floating Hearts on Touch */}
                  <AnimatePresence>
                    {floatingHearts.map((id, i) => (
                      <motion.div
                        key={id}
                        initial={{ opacity: 1, y: 0, x: (i - 1) * 24, scale: 0.7 }}
                        animate={{ opacity: 0, y: -70, scale: 1.4 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1.3 }}
                        className="pointer-events-none absolute top-6 z-30 text-pink-400"
                      >
                        <Heart className="w-5 h-5 fill-pink-400 drop-shadow-[0_0_10px_rgba(244,114,182,0.8)]" />
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {/* LARGE BORDERLESS CUTE CYAN-AND-GOLD FLAME-SPIRIT SVG WITH REAL-TIME LIP-SYNC */}
                  <svg
                    viewBox="0 0 120 120"
                    className="w-full h-full overflow-visible drop-shadow-[0_0_32px_rgba(34,211,238,0.75)]"
                  >
                    <defs>
                      <radialGradient id="androidDravisBodyGrad" cx="38%" cy="38%" r="65%">
                        <stop offset="0%" stopColor="#e0f2fe" stopOpacity="0.99" />
                        <stop offset="45%" stopColor="#38bdf8" stopOpacity="0.96" />
                        <stop offset="78%" stopColor="#fbbf24" stopOpacity="0.94" />
                        <stop offset="100%" stopColor="#f97316" stopOpacity="0.92" />
                      </radialGradient>
                      <linearGradient id="androidDravisTopFlame" x1="0" y1="1" x2="0.4" y2="0">
                        <stop offset="0%" stopColor="#22d3ee" />
                        <stop offset="55%" stopColor="#fbbf24" />
                        <stop offset="100%" stopColor="#f97316" />
                      </linearGradient>
                    </defs>

                    {/* Top Swirling Cyan & Golden Flame Wisps */}
                    <motion.path
                      d="M 34 34 Q 44 6 58 22 Q 72 2 82 26 Q 94 10 88 38"
                      fill="url(#androidDravisTopFlame)"
                      opacity={0.95}
                      animate={{
                        d: [
                          "M 34 34 Q 44 6 58 22 Q 72 2 82 26 Q 94 10 88 38",
                          "M 34 34 Q 40 12 56 18 Q 76 6 84 22 Q 98 16 88 38",
                          "M 34 34 Q 44 6 58 22 Q 72 2 82 26 Q 94 10 88 38",
                        ],
                      }}
                      transition={{ repeat: Infinity, duration: 0.6 }}
                    />

                    {/* Cute Waving Left & Right Flame Arms */}
                    <motion.ellipse
                      cx="21"
                      cy={isSpeaking || activeListening ? "54" : "62"}
                      rx="9.5"
                      ry="6.2"
                      fill="#38bdf8"
                      animate={{
                        rotate: isSpeaking || activeListening ? [-28, 28, -28] : [-12, 16, -12],
                      }}
                      transition={{ repeat: Infinity, duration: isSpeaking ? 0.45 : 0.85 }}
                    />
                    <motion.ellipse
                      cx="99"
                      cy={isSpeaking || activeListening ? "54" : "62"}
                      rx="9.5"
                      ry="6.2"
                      fill="#fbbf24"
                      animate={{
                        rotate: isSpeaking || activeListening ? [28, -28, 28] : [12, -16, 12],
                      }}
                      transition={{ repeat: Infinity, duration: isSpeaking ? 0.45 : 0.85 }}
                    />

                    {/* Cute Dancing Little Flame Feet */}
                    <ellipse
                      cx={stepPhase % 2 === 0 ? "45" : "48"}
                      cy={stepPhase % 2 === 0 ? "99" : "94"}
                      rx="8.5"
                      ry="6.5"
                      fill="#38bdf8"
                    />
                    <ellipse
                      cx={stepPhase % 2 === 0 ? "75" : "72"}
                      cy={stepPhase % 2 === 0 ? "94" : "99"}
                      rx="8.5"
                      ry="6.5"
                      fill="#fbbf24"
                    />

                    {/* Main Cute Round Cyan-and-Gold Flame-Spirit Body (Zero hard border!) */}
                    <path
                      d="M 25 62 C 23 36, 44 22, 62 22 C 82 22, 97 38, 95 62 C 94 84, 80 96, 60 96 C 40 96, 26 84, 25 62 Z"
                      fill="url(#androidDravisBodyGrad)"
                    />

                    {/* Starry Eyes + Blush Marks `///` + Real-Time Lip-Syncing Mouth */}
                    <g transform={`translate(${eyeOffset.x}, ${eyeOffset.y})`}>
                      {isBlinking ? (
                        <>
                          <path
                            d="M 38 56 Q 45 62 52 56"
                            fill="none"
                            stroke="#0f172a"
                            strokeWidth="3.2"
                            strokeLinecap="round"
                          />
                          <path
                            d="M 68 56 Q 75 62 82 56"
                            fill="none"
                            stroke="#0f172a"
                            strokeWidth="3.2"
                            strokeLinecap="round"
                          />
                        </>
                      ) : (
                        <>
                          {/* Left Starry Eye */}
                          <circle cx="45" cy="56" r="7.8" fill="#0f172a" />
                          <circle cx="45" cy="56" r="6.4" fill="#1e293b" />
                          <circle cx="42.8" cy="53.2" r="3" fill="#ffffff" />
                          <circle cx="47.6" cy="58.6" r="1.4" fill="#38bdf8" />

                          {/* Right Starry Eye */}
                          <circle cx="75" cy="56" r="7.8" fill="#0f172a" />
                          <circle cx="75" cy="56" r="6.4" fill="#1e293b" />
                          <circle cx="72.8" cy="53.2" r="3" fill="#ffffff" />
                          <circle cx="77.6" cy="58.6" r="1.4" fill="#38bdf8" />
                        </>
                      )}

                      {/* Signature Glowing Orange Cheek Blush `///` */}
                      <g stroke="#fb923c" strokeWidth="2.1" strokeLinecap="round" opacity="0.9">
                        <line x1="35" y1="66" x2="33" y2="69.5" />
                        <line x1="39" y1="66" x2="37" y2="69.5" />
                        <line x1="43" y1="66" x2="41" y2="69.5" />

                        <line x1="77" y1="66" x2="75" y2="69.5" />
                        <line x1="81" y1="66" x2="79" y2="69.5" />
                        <line x1="85" y1="66" x2="83" y2="69.5" />
                      </g>

                      {/* Real-Time Lip-Syncing Mouth */}
                      {isSpeaking || activeListening ? (
                        <g>
                          <ellipse
                            cx="60"
                            cy="68"
                            rx={4.8 + mouthOpen * 2.5}
                            ry={2.2 + mouthOpen * 6.8}
                            fill="#0f172a"
                            stroke="#ffffff"
                            strokeWidth="1.8"
                          />
                          {/* Cute little tongue highlight inside open talking mouth */}
                          <ellipse
                            cx="60"
                            cy={69.5 + mouthOpen * 2.2}
                            rx={3 + mouthOpen * 1.2}
                            ry={1.2 + mouthOpen * 2.2}
                            fill="#fb7185"
                          />
                        </g>
                      ) : (
                        <path
                          d="M 53.5 65 Q 60 72.5 66.5 65"
                          fill="none"
                          stroke="#ffffff"
                          strokeWidth="3.2"
                          strokeLinecap="round"
                        />
                      )}
                    </g>
                  </svg>
                </motion.div>

                {/* Minimal Borderless Voice Status & Touch Hint (No boxes, no typing input!) */}
                <div className="relative z-10 mt-6 flex flex-col items-center text-center pointer-events-none">
                  <motion.p
                    animate={{ opacity: [0.7, 1, 0.7] }}
                    transition={{ repeat: Infinity, duration: 2.6 }}
                    className="text-sm font-sans font-medium text-cyan-100/90 max-w-[300px] leading-relaxed drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]"
                  >
                    {isSpeaking && chatMessages.length > 0
                      ? chatMessages[chatMessages.length - 1].content.slice(0, 110)
                      : activeListening
                      ? "Listening to your voice..."
                      : `Hi ${userProfile.name || "Boss"}! Tap me anytime to talk`}
                  </motion.p>
                </div>
              </div>
            )}

            {/* ===============================================================
                TAB 2: CHATS (WITH CALL OPTION AT THE TOP + FULL AI CHAT)
               =============================================================== */}
            {activeTab === "CHATS" && (
              <div className="flex-1 flex flex-col px-4 pt-2 gap-3 overflow-hidden">
                {/* 1. TOP CALL BAR INSIDE CHATS (Call वाला option chats के अंदर ऊपर दिखेगा) */}
                <div className="liquid-glass rounded-3xl p-3 flex flex-col gap-2.5 shrink-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.25)]">
                        <Phone className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-mono font-bold text-white block leading-tight">
                          Direct Call Hub
                        </span>
                        <span className="text-[10px] font-mono text-emerald-300/90">
                          Dial any number or contact ({selectedCountryCode})
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <input
                        ref={vcfInputRef}
                        type="file"
                        accept=".vcf,text/vcard"
                        onChange={handleVcfFileImport}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          soundEffects.playChirp();
                          setIsCallContactsExpanded((prev) => !prev);
                        }}
                        className={`px-3 py-1.5 rounded-2xl font-mono text-[10px] font-bold border transition-all cursor-pointer ${
                          isCallContactsExpanded
                            ? "bg-emerald-400 text-slate-950 border-emerald-300"
                            : "bg-white/10 text-emerald-300 border-emerald-400/30 hover:bg-white/15"
                        }`}
                      >
                        {isCallContactsExpanded ? "Hide Contacts" : `Contacts (${contacts.length})`}
                      </button>
                    </div>
                  </div>

                  {/* Direct Country Code + Number Dial Input Row */}
                  <div className="flex items-center gap-1.5">
                    <select
                      value={selectedCountryCode}
                      onChange={(e) => {
                        setSelectedCountryCode(e.target.value);
                        onChangeCountryCode?.(e.target.value);
                      }}
                      className="bg-black/50 border border-white/15 rounded-2xl px-2.5 py-2 text-xs font-mono text-cyan-300 outline-none"
                    >
                      {COUNTRY_CODE_OPTIONS.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.flag} {c.code}
                        </option>
                      ))}
                    </select>
                    <input
                      type="tel"
                      value={directDialInput}
                      onChange={(e) => setDirectDialInput(e.target.value)}
                      placeholder={`Enter phone number...`}
                      className="flex-1 bg-black/50 border border-white/15 rounded-2xl px-3 py-2 text-xs font-mono tabular-nums text-white placeholder-slate-400 outline-none focus:border-emerald-400"
                    />
                    <button
                      type="button"
                      onClick={handleDirectDialCall}
                      className="px-3.5 py-2 rounded-2xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-mono text-xs font-bold flex items-center gap-1 cursor-pointer shrink-0 shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Call</span>
                    </button>
                  </div>

                  {/* Expandable Contacts List inside Top Call Bar */}
                  <AnimatePresence>
                    {isCallContactsExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex flex-col gap-2 pt-2 border-t border-white/10 overflow-hidden"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="relative flex-1 flex items-center rounded-xl bg-black/45 border border-white/10 px-2.5 py-1.5">
                            <Search className="w-3.5 h-3.5 text-slate-400 mr-1.5" />
                            <input
                              type="text"
                              value={contactSearchQuery}
                              onChange={(e) => setContactSearchQuery(e.target.value)}
                              placeholder="Search contacts..."
                              className="w-full bg-transparent text-xs font-mono text-white placeholder-slate-500 focus:outline-none"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={handleSyncAndroidContacts}
                            className="px-2.5 py-1.5 rounded-xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 font-mono text-[10px] font-bold flex items-center gap-1 cursor-pointer shrink-0"
                          >
                            <Smartphone className="w-3 h-3" />
                            <span>Sync Phone</span>
                          </button>
                        </div>

                        {contactSyncMessage && (
                          <div className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[10px] font-mono flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                            <span>{contactSyncMessage}</span>
                          </div>
                        )}

                        <div className="max-h-40 overflow-y-auto flex flex-col gap-1.5 pr-1">
                          {filteredContacts.map((contact) => {
                            const primaryPhone = contact.numbers[0];
                            const formattedNum = deviceHardware.formatPhoneWithCountryCode(
                              primaryPhone?.number || "",
                              selectedCountryCode
                            );
                            const waDigits = formattedNum.replace(/[^\d]/g, "");
                            return (
                              <div
                                key={contact.id}
                                className="p-2 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-between"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center justify-center font-mono font-bold text-xs shrink-0">
                                    {contact.name.charAt(0)}
                                  </div>
                                  <div className="truncate">
                                    <span className="text-xs font-mono font-bold text-white block truncate">
                                      {contact.name}
                                    </span>
                                    <span className="text-[10px] font-mono tabular-nums text-emerald-300">
                                      {formattedNum}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <a
                                    href={`tel:${formattedNum}`}
                                    target="_top"
                                    onClick={() => {
                                      soundEffects.playChirp();
                                      onDirectCallContact(contact, {
                                        ...primaryPhone,
                                        number: formattedNum,
                                      });
                                    }}
                                    className="p-2 rounded-xl bg-emerald-500/25 text-emerald-300 hover:bg-emerald-400 hover:text-slate-950 border border-emerald-500/40 transition-all cursor-pointer"
                                  >
                                    <Phone className="w-3.5 h-3.5" />
                                  </a>
                                  <a
                                    href={`https://wa.me/${waDigits}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                                  >
                                    <MessageCircle className="w-3.5 h-3.5" />
                                  </a>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* 2. CONVERSATION MESSAGES STREAM */}
                <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                  {chatMessages.map((msg, i) => (
                    <div
                      key={msg.id || `msg-${i}`}
                      className={`p-3 rounded-3xl text-xs leading-relaxed ${
                        msg.role === "user"
                          ? "bg-cyan-500/20 border border-cyan-400/40 text-cyan-50 ml-8"
                          : "liquid-glass text-slate-100 mr-6"
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                      {msg.multiTaskExecuted && msg.multiTaskExecuted.launchedApps.length > 0 && (
                        <div className="mt-2.5 p-2.5 rounded-2xl bg-black/45 border border-cyan-400/35 flex flex-col gap-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-mono font-bold text-cyan-300 uppercase tracking-wider">
                              ⚡ Multi-Task Executed ({msg.multiTaskExecuted.launchedApps.length} Apps)
                            </span>
                            {msg.multiTaskExecuted.answeredQuestion && (
                              <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                + Answered
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {msg.multiTaskExecuted.launchedApps.map((app) => (
                              <button
                                key={app.id}
                                type="button"
                                onClick={() => onLaunchApp?.(app.id)}
                                className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 flex items-center gap-1.5 text-left cursor-pointer"
                              >
                                <span className="text-[10px] font-mono font-bold text-white">
                                  {app.name}
                                </span>
                                <span
                                  className={`text-[8px] font-mono px-1.5 py-0.5 rounded ${
                                    app.routingMode === "DESKTOP_NATIVE"
                                      ? "bg-emerald-500/25 text-emerald-300"
                                      : "bg-cyan-500/25 text-cyan-300"
                                  }`}
                                >
                                  {app.routingMode === "DESKTOP_NATIVE" ? "Desktop" : "Browser"}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      {msg.generatedImage && (
                        <div className="mt-2 rounded-2xl overflow-hidden border border-cyan-400/40">
                          <img
                            src={msg.generatedImage.url}
                            alt={msg.generatedImage.prompt}
                            className="w-full h-auto object-cover max-h-56"
                          />
                        </div>
                      )}
                      <span className="text-[9px] font-mono text-slate-400 block mt-1 text-right">
                        {msg.timestamp}
                      </span>
                    </div>
                  ))}

                  {/* GOOGLE ADSENSE SPONSORED BANNER (ca-pub-2203384651585087) */}
                  <GoogleAdSenseBanner
                    client="ca-pub-2203384651585087"
                    adSlot="1002003004"
                    variant="SIDEBAR_BOX"
                    className="my-2"
                  />
                  <div ref={chatEndRef} />
                </div>

                {/* 3. CHAT INPUT BAR + VOICE MIC (Inside Chats Tab Only) */}
                <form
                  onSubmit={handleSend}
                  className="liquid-glass rounded-full p-1.5 flex items-center gap-2 shrink-0"
                >
                  <button
                    type="button"
                    onClick={() => {
                      soundEffects.playChirp();
                      onToggleListening();
                    }}
                    className={`p-2.5 rounded-full transition-all cursor-pointer shrink-0 ${
                      activeListening
                        ? "bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.6)]"
                        : "bg-white/10 text-cyan-300 hover:bg-white/20"
                    }`}
                    title="Voice Input"
                  >
                    <Mic className="w-4 h-4" />
                  </button>
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Message Dravis or ask to generate photo/video..."
                    className="flex-1 bg-transparent px-2 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="p-2.5 rounded-full bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold cursor-pointer shrink-0 shadow-[0_0_12px_rgba(34,211,238,0.4)]"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}

            {/* ===============================================================
                TAB 3: SETTINGS (ALL CONTROLS, FILES, APPS, CUSTOMIZATION & MODULES)
                Neat & Clean Liquid Glass Organization
               =============================================================== */}
            {activeTab === "SETTINGS" && (
              <div className="flex-1 flex flex-col px-4 pt-2 gap-3.5">
                {/* Clean Category Filter Pills inside Settings */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                  {[
                    { id: "ALL", label: "All Settings" },
                    { id: "PROFILE", label: "Profile & Language" },
                    { id: "HARDWARE", label: "Hardware" },
                    { id: "FILES", label: "Files & Folders" },
                    { id: "MODULES", label: "Core Modules" },
                  ].map((pill) => (
                    <button
                      key={pill.id}
                      type="button"
                      onClick={() => {
                        soundEffects.playChirp();
                        setSettingsSubSection(pill.id as any);
                      }}
                      className={`px-3 py-1.5 rounded-full font-mono text-[10px] font-bold shrink-0 transition-all cursor-pointer border ${
                        settingsSubSection === pill.id
                          ? "bg-cyan-400 text-slate-950 border-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.35)]"
                          : "liquid-glass text-slate-300 hover:text-white"
                      }`}
                    >
                      {pill.label}
                    </button>
                  ))}
                </div>

                {/* SINGLE-ROW LANGUAGE BAR (Default: Auto-Select; Click to Expand All 43 Languages) */}
                {(settingsSubSection === "ALL" || settingsSubSection === "PROFILE") && (
                  <div className="liquid-glass rounded-2xl p-3 flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        soundEffects.playChirp();
                        setIsLanguageListOpen((prev) => !prev);
                      }}
                      className="w-full flex items-center justify-between gap-3 px-2 py-1.5 rounded-xl bg-black/40 hover:bg-white/10 border border-white/10 transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="p-2 rounded-xl bg-cyan-500/15 text-cyan-300 border border-cyan-400/30 shrink-0">
                          <Globe className="w-4 h-4" />
                        </div>
                        <div className="text-left min-w-0">
                          <span className="text-xs font-mono font-bold text-white block">
                            Language
                          </span>
                          <span className="text-[10px] font-mono text-cyan-300 truncate block">
                            {userProfile.autoAdaptLanguage !== false ||
                            userProfile.preferredLanguage === "AUTO_ADAPT"
                              ? "Auto-Select (All 43 Languages)"
                              : (() => {
                                  const found = DRAVIS_LANGUAGES.find(
                                    (l) => l.code === userProfile.preferredLanguage
                                  );
                                  return found ? `${found.name} (${found.nativeName})` : userProfile.preferredLanguage;
                                })()}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="px-2 py-0.5 rounded-md bg-cyan-500/20 border border-cyan-400/30 text-[9px] font-mono font-bold text-cyan-200">
                          {userProfile.autoAdaptLanguage !== false ||
                          userProfile.preferredLanguage === "AUTO_ADAPT"
                            ? "AUTO"
                            : userProfile.preferredLanguage}
                        </span>
                        {isLanguageListOpen ? (
                          <ChevronUp className="w-4 h-4 text-cyan-300" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                    </button>

                    {isLanguageListOpen && (
                      <div className="max-h-56 overflow-y-auto flex flex-col gap-1.5 pt-1 pr-1 border-t border-white/10">
                        {DRAVIS_LANGUAGES.map((lang) => {
                          const isAuto = lang.code === "AUTO_ADAPT";
                          const isSelected = isAuto
                            ? userProfile.autoAdaptLanguage !== false ||
                              userProfile.preferredLanguage === "AUTO_ADAPT"
                            : userProfile.autoAdaptLanguage === false &&
                              userProfile.preferredLanguage === lang.code;
                          return (
                            <button
                              key={lang.code}
                              type="button"
                              onClick={() => {
                                soundEffects.playActivatePulse();
                                if (onUpdateUserProfile) {
                                  onUpdateUserProfile({
                                    ...userProfile,
                                    preferredLanguage: isAuto ? "AUTO_ADAPT" : lang.code,
                                    autoAdaptLanguage: isAuto,
                                    detectedLanguage: isAuto
                                      ? userProfile.detectedLanguage || "en-US"
                                      : lang.code,
                                  });
                                }
                                setIsLanguageListOpen(false);
                              }}
                              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl border text-left transition-all cursor-pointer ${
                                isSelected
                                  ? "bg-cyan-500/25 border-cyan-400 text-white shadow-[0_0_12px_rgba(34,211,238,0.25)]"
                                  : "bg-black/40 hover:bg-white/10 border-white/10 text-slate-300"
                              }`}
                            >
                              <div className="flex flex-col min-w-0">
                                <span className="text-xs font-mono font-bold truncate">
                                  {isAuto ? "Auto-Select (Auto-Adapt All 43 Languages)" : lang.name}
                                </span>
                                <span className="text-[10px] font-mono text-cyan-300/80 truncate">
                                  {lang.nativeName} · {lang.region}
                                </span>
                              </div>
                              <span
                                className={`px-2 py-0.5 rounded-md font-mono text-[9px] font-bold shrink-0 ${
                                  isSelected
                                    ? "bg-cyan-400 text-slate-950"
                                    : "bg-white/10 text-slate-400"
                                }`}
                              >
                                {isSelected ? "ACTIVE" : "SELECT"}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* 0. PROFILE & ACCOUNTS: SWITCH ACCOUNT, ADD ACCOUNT & LOG OUT */}
                {(settingsSubSection === "ALL" || settingsSubSection === "PROFILE") && (
                  <div className="liquid-glass rounded-3xl p-4 flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 font-bold text-xs shrink-0">
                          <User className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-mono font-bold text-white block truncate">
                            Profile & Account Switcher
                          </span>
                          <span className="text-[10px] font-mono text-cyan-300 truncate block">
                            Active: {userAccount?.displayName || userProfile.name}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            soundEffects.playChirp();
                            setIsAddingAccountAndroid((prev) => !prev);
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-mono text-[10px] font-bold flex items-center gap-1 cursor-pointer shadow-[0_0_10px_rgba(34,211,238,0.35)]"
                        >
                          <UserPlus className="w-3 h-3" />
                          <span>Add Account</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            soundEffects.playAlert();
                            onLogOut?.();
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-200 font-mono text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <LogOut className="w-3 h-3" />
                          <span>Log Out</span>
                        </button>
                      </div>
                    </div>

                    {accountActionFeedback && (
                      <div className="p-2.5 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-[10px] font-mono flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{accountActionFeedback}</span>
                      </div>
                    )}

                    {/* Inline Add Account Form in Android */}
                    {isAddingAccountAndroid && (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (!newAccNameAndroid.trim() || !newAccEmailAndroid.trim()) return;
                          soundEffects.playActivatePulse();
                          const createdAcc: UserAccount = {
                            id: "usr-" + Date.now(),
                            displayName: newAccNameAndroid.trim(),
                            email: newAccEmailAndroid.trim(),
                            roleTitle: newAccRoleAndroid.trim() || "Authorized Operator",
                            provider: "EMAIL",
                            avatarUrl: `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${encodeURIComponent(
                              newAccNameAndroid.trim()
                            )}`,
                            createdAt: new Date().toISOString(),
                            lastLogin: "Active Now",
                            isLoggedIn: true,
                            isSupervised: false,
                            sessions: [
                              {
                                id: "sess-" + Date.now(),
                                device: "DRAVIS Android Liquid Glass",
                                ip: "192.168.1.112",
                                location: "Android Device",
                                lastActive: "Active Now",
                                isCurrent: true,
                              },
                            ],
                          };
                          onAddAccount?.(createdAcc, true);
                          setNewAccNameAndroid("");
                          setNewAccEmailAndroid("");
                          setIsAddingAccountAndroid(false);
                          setAccountActionFeedback(
                            `Switched to new account "${createdAcc.displayName}" with fresh history!`
                          );
                          setTimeout(() => setAccountActionFeedback(null), 4000);
                        }}
                        className="p-3 rounded-2xl bg-black/55 border border-cyan-400/40 flex flex-col gap-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-mono font-bold text-cyan-300">
                            Create & Add New Account
                          </span>
                          <button
                            type="button"
                            onClick={() => setIsAddingAccountAndroid(false)}
                            className="text-slate-400 hover:text-white cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <input
                          type="text"
                          value={newAccNameAndroid}
                          onChange={(e) => setNewAccNameAndroid(e.target.value)}
                          placeholder="Account Name (e.g. Aryan)"
                          required
                          className="bg-black/60 border border-white/15 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-cyan-400"
                        />
                        <input
                          type="email"
                          value={newAccEmailAndroid}
                          onChange={(e) => setNewAccEmailAndroid(e.target.value)}
                          placeholder="Email Address (e.g. aryan@gmail.com)"
                          required
                          className="bg-black/60 border border-white/15 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-cyan-400"
                        />
                        <button
                          type="submit"
                          className="w-full py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-mono text-xs font-bold cursor-pointer"
                        >
                          Add & Switch to Account
                        </button>
                      </form>
                    )}

                    {/* Saved Accounts List — Switch Button Next to Every Account Name */}
                    <div className="flex flex-col gap-2">
                      {savedAccounts.map((acc) => {
                        const isCurrent =
                          userAccount?.id === acc.id || userAccount?.email === acc.email;
                        const counts = accountHistoryCounts[acc.id] || {
                          chats: 1,
                          memories: 1,
                          logs: 1,
                        };
                        return (
                          <div
                            key={acc.id}
                            className={`p-2.5 rounded-2xl border flex items-center justify-between gap-2 transition-all ${
                              isCurrent
                                ? "bg-cyan-500/15 border-cyan-400/60"
                                : "bg-black/40 border-white/10"
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-200 font-bold text-xs shrink-0 overflow-hidden">
                                {acc.avatarUrl ? (
                                  <img
                                    src={acc.avatarUrl}
                                    alt={acc.displayName}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  acc.displayName.charAt(0).toUpperCase()
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-mono font-bold text-white truncate">
                                    {acc.displayName}
                                  </span>
                                  {isCurrent && (
                                    <span className="text-[9px] font-mono text-emerald-300">
                                      · Active
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] font-mono text-slate-400 block truncate">
                                  {acc.email}
                                </span>
                                <span className="text-[9px] font-mono text-cyan-300/80 block">
                                  {counts.chats} chats · {counts.memories} memories · {counts.logs} logs
                                </span>
                              </div>
                            </div>

                            {/* Switch Button right next to account name */}
                            {isCurrent ? (
                              <button
                                type="button"
                                onClick={() => {
                                  soundEffects.playChirp();
                                  onOpenDesktopModule?.("PROFILE");
                                }}
                                className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-cyan-200 font-mono text-[10px] font-bold shrink-0 cursor-pointer"
                              >
                                Full Profile
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  soundEffects.playActivatePulse();
                                  onSwitchAccount?.(acc);
                                  setAccountActionFeedback(
                                    `Switched to ${acc.displayName}! Loaded all chats & history.`
                                  );
                                  setTimeout(() => setAccountActionFeedback(null), 3500);
                                }}
                                className="px-3 py-1.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-mono text-[10px] font-bold flex items-center gap-1 shrink-0 cursor-pointer shadow-[0_0_12px_rgba(34,211,238,0.35)]"
                              >
                                <ArrowLeftRight className="w-3 h-3" />
                                <span>Switch</span>
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 1. GENUINE DEVICE & HARDWARE CONTROLS (SINGLE-ROW BARS) */}
                {(settingsSubSection === "ALL" || settingsSubSection === "HARDWARE") && (
                  <div className="liquid-glass rounded-3xl p-4 flex flex-col gap-2">
                    <div className="flex items-center justify-between pb-1">
                      <span className="text-xs font-mono font-bold text-cyan-300 uppercase tracking-wider">
                        Device & Hardware Controls
                      </span>
                      <span className="text-[9px] font-mono text-emerald-400">
                        Single-Row Bars
                      </span>
                    </div>

                    <div className="flex flex-col gap-2">
                      {[
                        {
                          key: "wifi" as keyof DeviceSystemControls,
                          label: "Wi-Fi Network",
                          sub: "802.11ax Wireless Transceiver",
                          active: deviceControls.wifi,
                          icon: Wifi,
                          activeClass: "bg-cyan-500/20 border-cyan-400/60 text-cyan-200",
                          badgeClass: "bg-cyan-400 text-slate-950",
                        },
                        {
                          key: "mobileData" as keyof DeviceSystemControls,
                          label: "Mobile Cellular Data",
                          sub: "5G Carrier Telemetry",
                          active: deviceControls.mobileData,
                          icon: Signal,
                          activeClass: "bg-emerald-500/20 border-emerald-400/60 text-emerald-200",
                          badgeClass: "bg-emerald-400 text-slate-950",
                        },
                        {
                          key: "flightMode" as keyof DeviceSystemControls,
                          label: "Flight Mode",
                          sub: "Isolate All Wireless Transmitters",
                          active: deviceControls.flightMode,
                          icon: Plane,
                          activeClass: "bg-amber-500/20 border-amber-400/60 text-amber-200",
                          badgeClass: "bg-amber-400 text-slate-950",
                        },
                        {
                          key: "flashlight" as keyof DeviceSystemControls,
                          label: "Camera Flashlight / Torch",
                          sub: "Rear Optical LED Array",
                          active: deviceControls.flashlight,
                          icon: Flashlight,
                          activeClass: "bg-yellow-400/20 border-yellow-300/60 text-yellow-200",
                          badgeClass: "bg-yellow-400 text-slate-950",
                        },
                        {
                          key: "bluetooth" as keyof DeviceSystemControls,
                          label: "Bluetooth 5.3",
                          sub: "Low-Energy Peripheral Pairing",
                          active: deviceControls.bluetooth,
                          icon: Bluetooth,
                          activeClass: "bg-blue-500/20 border-blue-400/60 text-blue-200",
                          badgeClass: "bg-blue-400 text-slate-950",
                        },
                      ].map((hw) => {
                        const Icon = hw.icon;
                        return (
                          <button
                            key={hw.key}
                            type="button"
                            onClick={() => {
                              soundEffects.playChirp();
                              onToggleDeviceControl(hw.key);
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl border transition-all cursor-pointer ${
                              hw.active
                                ? hw.activeClass
                                : "bg-black/40 border-white/10 text-slate-300 hover:bg-white/5"
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="p-2 rounded-xl bg-white/10 shrink-0">
                                <Icon className="w-4 h-4" />
                              </div>
                              <div className="text-left min-w-0">
                                <span className="text-xs font-mono font-bold text-white block truncate">
                                  {hw.label}
                                </span>
                                <span className="text-[10px] font-mono opacity-75 block truncate">
                                  {hw.sub}
                                </span>
                              </div>
                            </div>
                            <span
                              className={`px-3 py-1 rounded-full font-mono text-[10px] font-bold shrink-0 ${
                                hw.active ? hw.badgeClass : "bg-white/10 text-slate-400"
                              }`}
                            >
                              {hw.active ? "ON" : "OFF"}
                            </span>
                          </button>
                        );
                      })}

                      {/* Wake Word Single-Row Bar */}
                      <button
                        type="button"
                        onClick={() => {
                          soundEffects.playChirp();
                          onToggleWakeWord(!wakeWordActive);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl border transition-all cursor-pointer ${
                          wakeWordActive
                            ? "bg-emerald-500/20 border-emerald-400/60 text-emerald-200"
                            : "bg-black/40 border-white/10 text-slate-300 hover:bg-white/5"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="p-2 rounded-xl bg-white/10 shrink-0">
                            <Mic className="w-4 h-4" />
                          </div>
                          <div className="text-left min-w-0">
                            <span className="text-xs font-mono font-bold text-white block truncate">
                              Wake Word: "{wakeWord}"
                            </span>
                            <span className="text-[10px] font-mono opacity-75 block truncate">
                              Hands-free voice activation & lip-sync
                            </span>
                          </div>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full font-mono text-[10px] font-bold shrink-0 ${
                            wakeWordActive
                              ? "bg-emerald-400 text-slate-950"
                              : "bg-white/10 text-slate-400"
                          }`}
                        >
                          {wakeWordActive ? "ACTIVE" : "OFF"}
                        </span>
                      </button>

                      {/* Camera Sensor Single-Row Bar */}
                      {onOpenCamera && (
                        <button
                          type="button"
                          onClick={onOpenCamera}
                          className="w-full flex items-center justify-between px-3 py-2.5 rounded-2xl bg-black/40 hover:bg-white/10 border border-white/10 text-slate-200 transition-all cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-400/30 shrink-0">
                              <Camera className="w-4 h-4" />
                            </div>
                            <div className="text-left min-w-0">
                              <span className="text-xs font-mono font-bold text-white block truncate">
                                Optical Camera Sensor
                              </span>
                              <span className="text-[10px] font-mono text-slate-400 block truncate">
                                Live vision frame capture & analysis
                              </span>
                            </div>
                          </div>
                          <span className="px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/40 text-purple-200 font-mono text-[10px] font-bold shrink-0">
                            OPEN
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* 2. SCREEN MONITOR & HANDS-FREE VOICE CLICKER */}
                {(settingsSubSection === "ALL" || settingsSubSection === "HARDWARE") && (
                  <ScreenMonitorControlStrip
                    onSendCommand={onSendChatMessage}
                    onSelectTab={(tab) => {
                      if (tab === "HOME") {
                        setActiveTab("DRAVIS");
                      } else if (tab !== "MICRO_DECISION" && onOpenDesktopModule) {
                        onOpenDesktopModule(tab);
                      }
                    }}
                    compact={true}
                  />
                )}

                {/* 3. REAL FOLDER & FILE CREATOR */}
                {(settingsSubSection === "ALL" || settingsSubSection === "FILES") && (
                  <div className="liquid-glass rounded-3xl p-4 flex flex-col gap-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-cyan-300 flex items-center gap-1.5">
                        <FolderPlus className="w-4 h-4 text-cyan-400" />
                        <span>Real Folder & File Creator</span>
                      </span>
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            const st = await deviceHardware.connectDeviceDirectory();
                            setFolderStatusMsg(`Connected to folder: ${st.folderName}`);
                          } catch (e: any) {
                            setFolderStatusMsg(e?.message || "Using DRAVIS Workspace storage");
                          }
                        }}
                        className="px-2.5 py-1 rounded-xl bg-cyan-400 text-slate-950 font-mono text-[10px] font-bold cursor-pointer"
                      >
                        Connect Storage
                      </button>
                    </div>

                    <form onSubmit={handleCreateRealFolderSubmit} className="flex flex-col gap-2">
                      <div className="flex flex-col gap-2">
                        <input
                          type="text"
                          value={androidFolderName}
                          onChange={(e) => setAndroidFolderName(e.target.value)}
                          placeholder="Folder Name..."
                          className="w-full bg-black/50 border border-white/15 rounded-2xl px-3 py-2 text-xs font-mono text-white outline-none"
                        />
                        <input
                          type="text"
                          value={androidFileName}
                          onChange={(e) => setAndroidFileName(e.target.value)}
                          placeholder="File Name (e.g. notes.md)"
                          className="w-full bg-black/50 border border-white/15 rounded-2xl px-3 py-2 text-xs font-mono text-white outline-none"
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full py-2 rounded-2xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-mono text-xs font-bold cursor-pointer"
                      >
                        Create Real Folder & File
                      </button>
                    </form>

                    {folderStatusMsg && (
                      <div className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[10px] font-mono">
                        {folderStatusMsg}
                      </div>
                    )}
                  </div>
                )}

                {/* 4. CUSTOMIZATION, FILES & SYSTEM MODULES (SINGLE-ROW BARS) */}
                {(settingsSubSection === "ALL" ||
                  settingsSubSection === "MODULES" ||
                  settingsSubSection === "FILES") && (
                  <div className="liquid-glass rounded-3xl p-4 flex flex-col gap-2.5">
                    <div className="flex items-center justify-between pb-1">
                      <span className="text-xs font-mono font-bold text-white">
                        Customization, Files & Core Modules
                      </span>
                      <span className="text-[9px] font-mono text-emerald-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Single-Row View
                      </span>
                    </div>

                    <div className="flex flex-col gap-2">
                      {[
                        { tab: "GMAIL" as NavigationTab, label: "Gmail Mailbox", icon: Mail },
                        { tab: "DRIVE" as NavigationTab, label: "Google Drive", icon: HardDrive },
                        { tab: "CALENDAR" as NavigationTab, label: "Google Calendar", icon: Calendar },
                        { tab: "CONTACTS" as NavigationTab, label: "Google Contacts", icon: Users },
                        { tab: "MAPS" as NavigationTab, label: "Google Maps", icon: MapPin },
                        { tab: "SETTINGS" as NavigationTab, label: "AI & Voice Settings", icon: Settings },
                        { tab: "PROFILE" as NavigationTab, label: "User Profile", icon: User },
                        { tab: "FILES" as NavigationTab, label: "Files & AAB Builder", icon: FolderKanban },
                        { tab: "HISTORY" as NavigationTab, label: "Memory & History", icon: History },
                        { tab: "LEARNING" as NavigationTab, label: "Self-Learning", icon: Brain },
                        { tab: "SKILLS" as NavigationTab, label: "40 Skills Matrix", icon: Cpu },
                        { tab: "AUTOMATION" as NavigationTab, label: "Automations", icon: Workflow },
                        { tab: "PLUGINS" as NavigationTab, label: "Plugins", icon: Puzzle },
                        { tab: "SUPERVISION" as NavigationTab, label: "Supervision", icon: ShieldCheck },
                        { tab: "SYSTEM" as NavigationTab, label: "System Telemetry", icon: Activity },
                      ].map((mod) => {
                        const Icon = mod.icon;
                        return (
                          <button
                            key={mod.tab}
                            onClick={() => {
                              soundEffects.playChirp();
                              onOpenDesktopModule?.(mod.tab);
                            }}
                            className="w-full px-3 py-2.5 rounded-2xl bg-black/40 hover:bg-white/10 border border-white/10 hover:border-cyan-400/40 flex items-center justify-between gap-2.5 text-left transition-all cursor-pointer"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="p-2 rounded-xl bg-cyan-500/15 text-cyan-300 border border-cyan-400/30 shrink-0">
                                <Icon className="w-4 h-4" />
                              </div>
                              <span className="text-xs font-mono font-bold text-white truncate">
                                {mod.label}
                              </span>
                            </div>
                            <span className="px-2.5 py-1 rounded-full bg-white/10 text-[9px] font-mono font-bold text-cyan-300 shrink-0">
                              OPEN
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* GitHub Sync & Export Action in Android Settings */}
                    {onOpenGitHubModal && (
                      <div className="mt-1 p-3 rounded-2xl bg-gradient-to-r from-slate-900/90 to-cyan-950/40 border border-cyan-400/30 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-white shrink-0">
                            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                            </svg>
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-mono font-bold text-white block truncate">
                              Push App to GitHub
                            </span>
                            <span className="text-[9px] font-mono text-cyan-300">
                              Git Repo Ready • 1-Click Push & ZIP
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            soundEffects.playActivatePulse();
                            onOpenGitHubModal();
                          }}
                          className="px-3 py-1.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-mono text-xs font-bold shrink-0 cursor-pointer shadow-[0_0_12px_rgba(34,211,238,0.35)]"
                        >
                          Open Git Push
                        </button>
                      </div>
                    )}

                    {/* Official Google Android CLI Suite Card */}
                    {onOpenAndroidCli && (
                      <div className="mt-1 p-3 rounded-2xl bg-gradient-to-r from-emerald-950/60 to-slate-900/90 border border-emerald-500/30 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 flex items-center justify-center shrink-0">
                            <Smartphone className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-mono font-bold text-white block truncate">
                              Google Android CLI
                            </span>
                            <span className="text-[9px] font-mono text-emerald-300">
                              Terminal & Agent • Compose Studio
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            soundEffects.playActivatePulse();
                            onOpenAndroidCli();
                          }}
                          className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono text-xs font-bold shrink-0 cursor-pointer shadow-[0_0_12px_rgba(16,185,129,0.35)]"
                        >
                          Open CLI
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* =================================================================
            3. BOTTOM LIQUID GLASS BAR (ONLY 3 OPTIONS: Dravis, Chats, Settings)
           ================================================================= */}
        <div className="absolute bottom-3.5 left-5 right-5 z-40">
          <div className="liquid-glass flex items-center justify-around p-1.5 rounded-full shadow-[0_12px_35px_rgba(0,0,0,0.85)]">
            {[
              { id: "DRAVIS", label: "Dravis", icon: Sparkles },
              { id: "CHATS", label: "Chats", icon: MessageSquare },
              { id: "SETTINGS", label: "Settings", icon: Sliders },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = !activeDesktopModuleInAndroid && activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    soundEffects.playChirp();
                    onCloseDesktopModuleInAndroid?.();
                    setActiveTab(tab.id as "DRAVIS" | "CHATS" | "SETTINGS");
                  }}
                  className={`relative flex-1 min-h-[46px] flex items-center justify-center gap-2 px-4 py-2 rounded-full text-xs font-mono font-bold transition-all cursor-pointer ${
                    isActive ? "text-cyan-200" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="android-liquid-glass-pill"
                      className="absolute inset-0 rounded-full bg-cyan-400/20 border border-cyan-300/50 shadow-[0_0_20px_rgba(34,211,238,0.3)] -z-10"
                      transition={{ type: "spring", stiffness: 420, damping: 30 }}
                    />
                  )}
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
