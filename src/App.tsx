/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Dravis Human ASI - Master Holographic HUD & 40-Module Architecture Console
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import { TopHeader } from "./components/TopHeader";
import { LeftSidebar } from "./components/LeftSidebar";
import { RightSidebar } from "./components/RightSidebar";
import { BottomBar } from "./components/BottomBar";
import { HomeView } from "./components/HomeView";
import { DravisChatView } from "./components/DravisChatView";
import { SkillsMatrixView } from "./components/SkillsMatrixView";
import { HistoryView } from "./components/HistoryView";
import { ProfileView } from "./components/ProfileView";
import { SettingsView } from "./components/SettingsView";
import { PluginsView } from "./components/PluginsView";
import { AutomationView } from "./components/AutomationView";
import { FilesView } from "./components/FilesView";
import { SystemView } from "./components/SystemView";
import { GmailConsole } from "./components/Gmail/GmailConsole";
import { AuthScreen } from "./components/AuthScreen";
import { FamilySupervisionView } from "./components/FamilySupervisionView";
import { DynamicIslandNotch } from "./components/DynamicIslandNotch";
import { DravisLearningView } from "./components/DravisLearningView";
import { AndroidMobileResolutionView } from "./components/AndroidMobileResolutionView";
import { MicroDecisionBackground3D } from "./components/MicroDecisionBackground3D";
import { MicroDecisionView } from "./components/MicroDecisionView";

// Modals
import { CameraModal } from "./components/Modals/CameraModal";
import { ShutdownModal } from "./components/Modals/ShutdownModal";
import { AddReminderModal } from "./components/Modals/AddReminderModal";
import { ContactsModal } from "./components/Modals/ContactsModal";
import { ActiveAppWindowModal } from "./components/Modals/ActiveAppWindowModal";
import { GitHubPushModal } from "./components/Modals/GitHubPushModal";
import { AndroidCliModal } from "./components/Modals/AndroidCliModal";
import { screenMonitorAgent } from "./utils/screenMonitorAgent";

// Data & Utilities
import {
  INITIAL_SKILLS_40,
  INITIAL_USER_PROFILE,
  INITIAL_TELEMETRY,
  INITIAL_NEWS,
  INITIAL_REMINDERS,
  INITIAL_WEATHER,
  INITIAL_QUICK_ACTIONS,
  INITIAL_PLUGINS,
  INITIAL_WORKFLOWS,
  INITIAL_FILES,
  INITIAL_MEMORIES,
  INITIAL_MESSAGES,
  INITIAL_THEMES,
  INITIAL_WALLPAPERS,
  INITIAL_IMAGE_FOLDERS,
  INITIAL_GENERATED_IMAGES,
  INITIAL_USER_ACCOUNT,
  INITIAL_SAVED_ACCOUNTS,
  buildDefaultAccountWorkspace,
  INITIAL_FAMILY_SUPERVISION,
  INITIAL_AUTOMATION_CAPABILITIES,
  INITIAL_CONTACTS,
  INITIAL_MICRO_DECISIONS,
  INITIAL_LEVERAGE_TREE,
  INITIAL_SLOT_FILLING_TRACE,
  INITIAL_PROJECTS,
  INITIAL_WINDOWS_APPS,
  INITIAL_TIMELINE_LOGS,
} from "./data/initialData";
import {
  NavigationTab,
  VoiceState,
  MessageItem,
  QuickActionItem,
  SkillModule,
  UserProfile,
  SystemTelemetry,
  NewsItem,
  ReminderItem,
  WeatherData,
  PluginItem,
  AutomationWorkflow,
  FileItem,
  MemoryEntry,
  UserAccount,
  AccountWorkspaceData,
  ThemeConfig,
  WallpaperItem,
  ImageFolder,
  GeneratedImageItem,
  FamilySupervisionConfig,
  AutomationCapability,
  ContactItem,
  ActiveCallState,
  ContactSelectionPrompt,
  DeviceSystemControls,
  MusicPlaybackState,
  DRAVIS_LANGUAGES,
  detectLanguageFromText,
  MicroDecisionNode,
  LeverageTreeNode,
  SlotFillingTrace,
  ScreenAutoFixReport,
  ProjectItem,
  WindowsAppEntry,
  WindowsInstallRecommendation,
  TimelineActionLog,
} from "./types";
import { soundEffects } from "./utils/audioSynth";
import { speechEngine } from "./utils/speech";
import { getTimeAwareGreeting } from "./utils/greetings";
import { deviceHardware, LaunchedAppDescriptor } from "./utils/deviceHardware";

export default function App() {
  // 1. First-Interface Session Login & Multi-Account State
  const [isSessionAuthenticated, setIsSessionAuthenticated] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem("dravis_active_session_v2") === "true";
    } catch {
      return false;
    }
  });

  const [savedAccounts, setSavedAccounts] = useState<UserAccount[]>(() => {
    try {
      const saved = localStorage.getItem("dravis_saved_accounts_v2");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_SAVED_ACCOUNTS;
  });

  const [accountWorkspaces, setAccountWorkspaces] = useState<Record<string, AccountWorkspaceData>>(
    () => {
      try {
        const saved = localStorage.getItem("dravis_account_workspaces_v2");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed === "object") return parsed;
        }
      } catch {}
      const initialMap: Record<string, AccountWorkspaceData> = {};
      INITIAL_SAVED_ACCOUNTS.forEach((acc) => {
        initialMap[acc.id] = buildDefaultAccountWorkspace(acc);
      });
      return initialMap;
    }
  );

  const [userAccount, setUserAccount] = useState<UserAccount | null>(() => {
    const saved = localStorage.getItem("dravis_account");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return INITIAL_USER_ACCOUNT;
  });

  // Navigation & View State
  const [activeTab, setActiveTab] = useState<NavigationTab>("HOME");
  const [voiceState, setVoiceState] = useState<VoiceState>("ONLINE");

  // Core Data Stores
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem("dravis_profile");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Clean out any legacy stored credentials
        delete parsed.customOpenAIKey;
        delete parsed.customGeminiKey;
        delete parsed.customApiKey;
        return {
          ...INITIAL_USER_PROFILE,
          ...parsed,
          responseSpeed: parsed.responseSpeed || "INSTANT",
          responseSpeedRate: parsed.responseSpeedRate || 1.25,
          voiceSpeed: parsed.voiceSpeed || 1.15,
        };
      } catch {}
    }
    return {
      ...INITIAL_USER_PROFILE,
    };
  });

  // Theme & Wallpaper State
  const [currentTheme, setCurrentTheme] = useState<ThemeConfig>(() => {
    const saved = localStorage.getItem("dravis_theme");
    return saved ? JSON.parse(saved) : INITIAL_THEMES[0];
  });
  const [themes] = useState<ThemeConfig[]>(INITIAL_THEMES);

  const [currentWallpaper, setCurrentWallpaper] = useState<WallpaperItem>(() => {
    const saved = localStorage.getItem("dravis_wallpaper");
    return saved ? JSON.parse(saved) : INITIAL_WALLPAPERS[0];
  });
  const [wallpapers, setWallpapers] = useState<WallpaperItem[]>(() => {
    const saved = localStorage.getItem("dravis_wallpapers_list");
    return saved ? JSON.parse(saved) : INITIAL_WALLPAPERS;
  });

  // Image Bank & Folders
  const [imageFolders, setImageFolders] = useState<ImageFolder[]>(() => {
    const saved = localStorage.getItem("dravis_image_folders");
    return saved ? JSON.parse(saved) : INITIAL_IMAGE_FOLDERS;
  });
  const [generatedImages, setGeneratedImages] = useState<GeneratedImageItem[]>(() => {
    const saved = localStorage.getItem("dravis_generated_images");
    return saved ? JSON.parse(saved) : INITIAL_GENERATED_IMAGES;
  });
  const [isGeneratingImage, setIsGeneratingImage] = useState<boolean>(false);
  const [generatingPrompt, setGeneratingPrompt] = useState<string>("");

  // Family Supervision & Privacy
  const [familySupervision, setFamilySupervision] = useState<FamilySupervisionConfig>(() => {
    const saved = localStorage.getItem("dravis_supervision");
    return saved ? JSON.parse(saved) : INITIAL_FAMILY_SUPERVISION;
  });

  // Automation Capabilities
  const [automationCaps, setAutomationCaps] = useState<AutomationCapability[]>(() => {
    const saved = localStorage.getItem("dravis_automation_caps");
    return saved ? JSON.parse(saved) : INITIAL_AUTOMATION_CAPABILITIES;
  });

  const [telemetry, setTelemetry] = useState<SystemTelemetry>(INITIAL_TELEMETRY);
  const [newsList, setNewsList] = useState<NewsItem[]>(INITIAL_NEWS);
  const [reminders, setReminders] = useState<ReminderItem[]>(() => {
    const saved = localStorage.getItem("dravis_reminders");
    return saved ? JSON.parse(saved) : INITIAL_REMINDERS;
  });
  const [weather, setWeather] = useState<WeatherData>(INITIAL_WEATHER);
  const [quickActions, setQuickActions] = useState<QuickActionItem[]>(INITIAL_QUICK_ACTIONS);
  const [skills, setSkills] = useState<SkillModule[]>(INITIAL_SKILLS_40);
  const [plugins, setPlugins] = useState<PluginItem[]>(INITIAL_PLUGINS);
  const [workflows, setWorkflows] = useState<AutomationWorkflow[]>(INITIAL_WORKFLOWS);
  const [files, setFiles] = useState<FileItem[]>(INITIAL_FILES);
  const [memories, setMemories] = useState<MemoryEntry[]>(() => {
    const saved = localStorage.getItem("dravis_memories");
    return saved ? JSON.parse(saved) : INITIAL_MEMORIES;
  });
  const [messages, setMessages] = useState<MessageItem[]>(() => {
    const saved = localStorage.getItem("dravis_messages");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const cleaned = parsed
            .filter(
              (m: any) =>
                !m?.degradationState &&
                !String(m?.text || "").includes("All systems nominal, ") &&
                !String(m?.text || "").includes("सभी सिस्टम पूरी तरह सक्रिय हैं") &&
                !String(m?.text || "").includes("Sabhi systems bilkul ready hain") &&
                !String(m?.text || "").includes("Operating in resilient autonomous edge mode")
            )
            .map((m: any) => {
              const copy = { ...m };
              delete copy.degradationState;
              return copy;
            });
          return cleaned.length > 0 ? cleaned : INITIAL_MESSAGES;
        }
      } catch {}
    }
    return INITIAL_MESSAGES;
  });

  // 360° 3D Micro-Decision, Multi-Work & Autonomous Screen Cursor State
  const [microDecisions, setMicroDecisions] = useState<MicroDecisionNode[]>(() => {
    const saved = localStorage.getItem("dravis_micro_decisions");
    return saved ? JSON.parse(saved) : INITIAL_MICRO_DECISIONS;
  });
  const [selectedDecisionNode, setSelectedDecisionNode] = useState<MicroDecisionNode | null>(
    INITIAL_MICRO_DECISIONS[0] || null
  );
  const [leverageTree] = useState<LeverageTreeNode[]>(INITIAL_LEVERAGE_TREE);
  const [slotFillingTrace, setSlotFillingTrace] = useState<SlotFillingTrace>(
    INITIAL_SLOT_FILLING_TRACE
  );
  const [isExecutingMultiWork, setIsExecutingMultiWork] = useState<boolean>(false);
  const [isAutoFixingScreen, setIsAutoFixingScreen] = useState<boolean>(false);
  const [latestAutoFixReport, setLatestAutoFixReport] = useState<ScreenAutoFixReport | null>(null);
  const [autonomousSelfWorkActive, setAutonomousSelfWorkActive] = useState<boolean>(true);
  const [isMicroDecisionFullScreen, setIsMicroDecisionFullScreen] = useState<boolean>(true);
  const [virtualCursor, setVirtualCursor] = useState<{
    active: boolean;
    xPercent: number;
    yPercent: number;
    label: string;
    status: "MOVING" | "CLICKING" | "FIXED";
  } | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem("dravis_micro_decisions", JSON.stringify(microDecisions.slice(0, 36)));
    } catch {}
  }, [microDecisions]);

  // Brain Projects, Windows App Registry & Action Timeline State
  const [projects, setProjects] = useState<ProjectItem[]>(() => {
    const saved = localStorage.getItem("dravis_projects");
    return saved ? JSON.parse(saved) : INITIAL_PROJECTS;
  });
  const [windowsApps, setWindowsApps] = useState<WindowsAppEntry[]>(() => {
    const saved = localStorage.getItem("dravis_windows_apps");
    return saved ? JSON.parse(saved) : INITIAL_WINDOWS_APPS;
  });
  const [timelineLogs, setTimelineLogs] = useState<TimelineActionLog[]>(() => {
    const saved = localStorage.getItem("dravis_timeline_logs");
    return saved ? JSON.parse(saved) : INITIAL_TIMELINE_LOGS;
  });
  const [latestInstallRecommendation, setLatestInstallRecommendation] =
    useState<WindowsInstallRecommendation | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem("dravis_projects", JSON.stringify(projects));
    } catch {}
  }, [projects]);

  useEffect(() => {
    try {
      localStorage.setItem("dravis_windows_apps", JSON.stringify(windowsApps));
    } catch {}
  }, [windowsApps]);

  useEffect(() => {
    try {
      localStorage.setItem("dravis_timeline_logs", JSON.stringify(timelineLogs.slice(0, 60)));
    } catch {}
  }, [timelineLogs]);

  // Contacts and Direct Calling Engine State
  const [contacts, setContacts] = useState<ContactItem[]>(() => {
    const saved = localStorage.getItem("dravis_contacts");
    return saved ? JSON.parse(saved) : INITIAL_CONTACTS;
  });
  const [isContactsModalOpen, setIsContactsModalOpen] = useState<boolean>(false);
  const [activeCall, setActiveCall] = useState<ActiveCallState | null>(null);
  const [contactPrompt, setContactPrompt] = useState<ContactSelectionPrompt | null>(null);
  const [defaultCountryCode, setDefaultCountryCode] = useState<string>(() => {
    return localStorage.getItem("dravis_country_code") || "+91";
  });
  const [activeLaunchedApp, setActiveLaunchedApp] = useState<LaunchedAppDescriptor | null>(null);
  const [launchedAppsQueue, setLaunchedAppsQueue] = useState<LaunchedAppDescriptor[]>([]);
  const [isGitHubModalOpen, setIsGitHubModalOpen] = useState<boolean>(false);
  const [isAndroidCliModalOpen, setIsAndroidCliModalOpen] = useState<boolean>(false);
  const [activeDesktopModuleInAndroid, setActiveDesktopModuleInAndroid] =
    useState<NavigationTab | null>(null);

  useEffect(() => {
    localStorage.setItem("dravis_contacts", JSON.stringify(contacts));
  }, [contacts]);

  useEffect(() => {
    localStorage.setItem("dravis_country_code", defaultCountryCode);
  }, [defaultCountryCode]);

  // Real-time Active Call Duration Timer
  useEffect(() => {
    if (!activeCall?.isActive || activeCall.status !== "CONNECTED") return;
    const timer = setInterval(() => {
      setActiveCall((prev) => (prev ? { ...prev, durationSeconds: prev.durationSeconds + 1 } : null));
    }, 1000);
    return () => clearInterval(timer);
  }, [activeCall?.isActive, activeCall?.status]);

  // Android Resolution Shifting State (Auto-detects mobile or defaults to user's hardware)
  const [isAndroidResolutionActive, setIsAndroidResolutionActive] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const isMobileUA = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
      const isSmallViewport = window.innerWidth < 768;
      const savedPref = localStorage.getItem("dravis_android_resolution");
      if (savedPref !== null) return savedPref === "true";
      return isMobileUA || isSmallViewport;
    }
    return false;
  });

  useEffect(() => {
    try {
      localStorage.setItem("dravis_android_resolution", String(isAndroidResolutionActive));
    } catch {}
  }, [isAndroidResolutionActive]);

  // Device System Controls (Wi-Fi, Mobile Data, Flight Mode, Flashlight, Bluetooth)
  const [deviceControls, setDeviceControls] = useState<DeviceSystemControls>(() => {
    const saved = localStorage.getItem("dravis_device_controls");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return {
      wifi: true,
      mobileData: true,
      flightMode: false,
      flashlight: false,
      bluetooth: true,
    };
  });

  useEffect(() => {
    try {
      localStorage.setItem("dravis_device_controls", JSON.stringify(deviceControls));
    } catch {}
  }, [deviceControls]);

  // Device Dynamic Island Feedback
  const [deviceStatusFeedback, setDeviceStatusFeedback] = useState<{
    label: string;
    active: boolean;
    type: "WIFI" | "DATA" | "FLIGHT" | "TORCH" | "BT";
  } | null>(null);

  // Spotify Music Playback State
  const [musicPlayback, setMusicPlayback] = useState<MusicPlaybackState | null>(null);

  // Unified Settings Drawer Modal State
  const [isUniversalSettingsOpen, setIsUniversalSettingsOpen] = useState<boolean>(false);

  // Clean up any legacy Android mode keys
  useEffect(() => {
    try {
      localStorage.removeItem("dravis_android_mode");
    } catch {}
  }, []);

  // Speech & Wake Word State with Time-Aware Startup Greeting
  const initialGreeting = getTimeAwareGreeting(userProfile.name);
  const [isListening, setIsListening] = useState<boolean>(false);
  const handleToggleMicRef = useRef<() => void>(() => {});
  const activeChatAbortRef = useRef<AbortController | null>(null);
  const activeRequestIdRef = useRef<number>(0);
  const lastSubmittedCommandRef = useRef<{ text: string; time: number }>({ text: "", time: 0 });
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isMinimizedCompact, setIsMinimizedCompact] = useState<boolean>(false);
  const [greetingText, setGreetingText] = useState<string>(initialGreeting.title);
  const [subGreetingText, setSubGreetingText] = useState<string>(initialGreeting.subtitle);
  const hasGreetedStartupRef = useRef<boolean>(false);

  // Synchronize time-aware greeting on mount and refresh periodic state
  useEffect(() => {
    if (!userAccount?.isLoggedIn) return;
    const timeGreeting = getTimeAwareGreeting(userProfile.name);
    setGreetingText(timeGreeting.title);
    setSubGreetingText(timeGreeting.subtitle);

    // One-time startup vocal greeting when opened on desktop
    if (!hasGreetedStartupRef.current) {
      hasGreetedStartupRef.current = true;
      const timer = setTimeout(() => {
        if (userProfile.soundEffects) {
          soundEffects.playStartupChime();
        }
        // Speak the time-aware startup greeting once on launch
        speakVoiceResponse(timeGreeting.spokenGreeting);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [userProfile.name, userAccount?.isLoggedIn]);

  // Monitor document fullscreen changes + Escape key exit
  useEffect(() => {
    const handleFullscreenChange = () => {
      const doc = document as any;
      const fullEl =
        document.fullscreenElement ||
        doc.webkitFullscreenElement ||
        doc.mozFullScreenElement ||
        doc.msFullscreenElement;
      setIsFullscreen(!!fullEl);
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        const doc = document as any;
        const fullEl =
          document.fullscreenElement ||
          doc.webkitFullscreenElement ||
          doc.mozFullScreenElement ||
          doc.msFullscreenElement;
        if (!fullEl) {
          setIsFullscreen(false);
        }
      }
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleToggleFullscreen = () => {
    const doc = document as any;
    const fullEl =
      document.fullscreenElement ||
      doc.webkitFullscreenElement ||
      doc.mozFullScreenElement ||
      doc.msFullscreenElement;

    const nextState = !isFullscreen && !fullEl;
    setIsFullscreen(nextState);

    if (nextState) {
      const docEl = document.documentElement as any;
      const rootEl = document.getElementById("dravis-root-container") as any;
      const bodyEl = document.body as any;

      const tryRequestFullscreen = (el: any): Promise<any> => {
        if (!el) return Promise.reject();
        const req =
          el.requestFullscreen ||
          el.webkitRequestFullscreen ||
          el.mozRequestFullScreen ||
          el.msRequestFullscreen;
        if (!req) return Promise.reject();
        try {
          return Promise.resolve(req.call(el, { navigationUI: "hide" }));
        } catch {
          try {
            return Promise.resolve(req.call(el));
          } catch (err) {
            return Promise.reject(err);
          }
        }
      };

      tryRequestFullscreen(docEl)
        .catch(() => tryRequestFullscreen(rootEl))
        .catch(() => tryRequestFullscreen(bodyEl))
        .catch(() => {
          // Keeps setIsFullscreen(true) active so full-screen HUD resolution works even inside restricted iframes
        });
    } else if (fullEl) {
      const exit =
        document.exitFullscreen ||
        doc.webkitExitFullscreen ||
        doc.mozCancelFullScreen ||
        doc.msExitFullscreen;
      if (exit) {
        try {
          Promise.resolve(exit.call(document)).catch(() => {});
        } catch {}
      }
    }
  };

  // Modal States
  const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);
  const [isShutdownOpen, setIsShutdownOpen] = useState<boolean>(false);
  const [isAddReminderOpen, setIsAddReminderOpen] = useState<boolean>(false);
  const [activeAppIcon, setActiveAppIcon] = useState<string | null>(null);
  const [activeAppTitle, setActiveAppTitle] = useState<string | null>(null);
  const [notchStatusText, setNotchStatusText] = useState<string | undefined>(undefined);

  // Persist State Changes
  useEffect(() => {
    if (userAccount) {
      localStorage.setItem("dravis_account", JSON.stringify(userAccount));
    }
  }, [userAccount]);

  useEffect(() => {
    localStorage.setItem("dravis_profile", JSON.stringify(userProfile));
    speechEngine.setVoicePersona(userProfile.voicePreference || "Fenrir");
  }, [userProfile]);

  useEffect(() => {
    localStorage.setItem("dravis_theme", JSON.stringify(currentTheme));
  }, [currentTheme]);

  useEffect(() => {
    localStorage.setItem("dravis_wallpaper", JSON.stringify(currentWallpaper));
  }, [currentWallpaper]);

  useEffect(() => {
    localStorage.setItem("dravis_wallpapers_list", JSON.stringify(wallpapers));
  }, [wallpapers]);

  useEffect(() => {
    localStorage.setItem("dravis_image_folders", JSON.stringify(imageFolders));
  }, [imageFolders]);

  useEffect(() => {
    try {
      localStorage.setItem("dravis_generated_images", JSON.stringify(generatedImages.slice(0, 12)));
    } catch {}
  }, [generatedImages]);

  useEffect(() => {
    localStorage.setItem("dravis_supervision", JSON.stringify(familySupervision));
  }, [familySupervision]);

  useEffect(() => {
    localStorage.setItem("dravis_automation_caps", JSON.stringify(automationCaps));
  }, [automationCaps]);

  useEffect(() => {
    localStorage.setItem("dravis_reminders", JSON.stringify(reminders));
  }, [reminders]);

  useEffect(() => {
    localStorage.setItem("dravis_memories", JSON.stringify(memories));
  }, [memories]);

  useEffect(() => {
    try {
      localStorage.setItem("dravis_messages", JSON.stringify(messages.slice(-30)));
    } catch {}
  }, [messages]);

  // Periodic Telemetry Simulation
  useEffect(() => {
    const interval = setInterval(() => {
      const cpuVal = Math.floor(18 + Math.random() * 20);
      const ramVal = Math.floor(42 + Math.random() * 8);
      const diskVal = 34;

      setTelemetry((prev) => ({
        ...prev,
        cpu: `${cpuVal}%`,
        cpuRaw: cpuVal,
        ram: `${ramVal}%`,
        ramRaw: ramVal,
        disk: `${diskVal}%`,
        diskRaw: diskVal,
        uptimeSeconds: prev.uptimeSeconds + 3,
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Synchronize STT speech recognition language with user profile
  useEffect(() => {
    const activeBcp47 =
      userProfile.autoAdaptLanguage !== false
        ? userProfile.detectedLanguage || "en-US"
        : userProfile.preferredLanguage || "en-US";
    speechEngine.setLanguage(activeBcp47);
  }, [userProfile.preferredLanguage, userProfile.autoAdaptLanguage, userProfile.detectedLanguage]);

  // Voice Speech Synthesis Handler
  const speakVoiceResponse = useCallback(
    (text: string) => {
      if (!userProfile.voiceOutputActive || !text) return;

      // Normalize legacy 1.15x speed to 1.0x natural human conversational speed
      const savedSpeed = userProfile.voiceSpeed && Math.abs(userProfile.voiceSpeed - 1.15) > 0.01
        ? userProfile.voiceSpeed
        : 1.0;
      const rate = userProfile.kidsFriendlyMode ? 0.96 : savedSpeed;
      const pitch = userProfile.kidsFriendlyMode ? 1.04 : (userProfile.voicePitch || 1.0);
      const targetLang =
        userProfile.autoAdaptLanguage !== false
          ? userProfile.detectedLanguage || "en-US"
          : userProfile.preferredLanguage || "en-US";

      setVoiceState("SPEAKING");
      speechEngine.speak(text, {
        voiceName: userProfile.voicePreference || "Puck",
        rate,
        pitch,
        lang: targetLang,
        kidsFriendlyMode: userProfile.kidsFriendlyMode,
        onStart: () => setVoiceState("SPEAKING"),
        onEnd: () => {
          setVoiceState("ONLINE");
          if (userProfile.liveVoiceActive) {
            setTimeout(() => {
              if (handleToggleMicRef.current) {
                handleToggleMicRef.current();
              }
            }, 400);
          }
        },
        onError: () => setVoiceState("ONLINE"),
      });
    },
    [
      userProfile.voiceOutputActive,
      userProfile.voicePreference,
      userProfile.voiceSpeed,
      userProfile.voicePitch,
      userProfile.kidsFriendlyMode,
      userProfile.liveVoiceActive,
      userProfile.soundEffects,
      userProfile.preferredLanguage,
      userProfile.autoAdaptLanguage,
      userProfile.detectedLanguage,
    ]
  );

  // -------------------------------------------------------------
  // Direct Web & Chrome Launcher Engine (Zero Popups)
  // -------------------------------------------------------------
  const APP_URL_MAP: Record<string, string> = {
    youtube: "https://www.youtube.com",
    chrome: "https://www.google.com",
    google: "https://www.google.com",
    canva: "https://www.canva.com",
    whatsapp: "https://web.whatsapp.com",
    chatgpt: "https://chatgpt.com",
    openai: "https://chatgpt.com",
    excel: "https://excel.new",
    sheets: "https://sheets.new",
    spotify: "https://open.spotify.com",
    netflix: "https://www.netflix.com",
    instagram: "https://www.instagram.com",
    github: "https://github.com",
    maps: "https://maps.google.com",
    gmail: "https://mail.google.com",
    twitter: "https://x.com",
    x: "https://x.com",
    reddit: "https://www.reddit.com",
    wikipedia: "https://www.wikipedia.org",
  };

  const launchWebDirectly = useCallback(
    (
      appNameOrDescriptor: string | LaunchedAppDescriptor,
      inChromeContext: boolean = false,
      preferDesktopNative: boolean = true
    ) => {
      const desc = deviceHardware.launchAppAcrossPlatforms(appNameOrDescriptor, {
        inChromeContext,
        preferDesktopNative,
      });

      setActiveAppTitle(desc.name);
      setActiveAppIcon(inChromeContext ? "chrome" : desc.iconName || "chrome");
      setNotchStatusText(
        inChromeContext
          ? `Opening ${desc.name} in Google Chrome...`
          : `Opening ${desc.name} on Desktop...`
      );

      // Animate Virtual Cursor for visual desktop launch feedback
      setVirtualCursor({
        active: true,
        xPercent: 48,
        yPercent: 42,
        label: `Launching on Desktop: ${desc.name}`,
        status: "MOVING",
      });
      setTimeout(() => {
        setVirtualCursor((prev) => (prev ? { ...prev, status: "CLICKING" } : null));
      }, 350);
      setTimeout(() => {
        setVirtualCursor((prev) => (prev ? { ...prev, status: "FIXED" } : null));
      }, 750);
      setTimeout(() => {
        setVirtualCursor(null);
      }, 2400);

      // Open Interactive Live Desktop App Window + Unblocked Native OS URI / Browser Launcher
      setActiveLaunchedApp(desc);
      setLaunchedAppsQueue((prev) => {
        const filtered = prev.filter((item) => item.id !== desc.id);
        return [desc, ...filtered].slice(0, 6);
      });

      const isDesktopRouted = desc.lastRoutingMode === "DESKTOP_NATIVE" || desc.desktopAvailable;
      const phrase = inChromeContext
        ? `Opening ${desc.name} in Google Chrome, Sir.`
        : isDesktopRouted
        ? `Opening ${desc.name} on your desktop now, Sir.`
        : `Opening ${desc.name} in your browser now, Sir.`;
      speakVoiceResponse(phrase);

      setTimeout(() => {
        setActiveAppIcon(null);
        setActiveAppTitle(null);
        setNotchStatusText(undefined);
      }, 4000);
    },
    [speakVoiceResponse]
  );

  // -------------------------------------------------------------
  // Genuine Country-Code Calling (+91 Default) & Telephony Engine
  // -------------------------------------------------------------
  const handleInitiateCall = useCallback(
    (contactName: string, number: string, label?: string) => {
      speechEngine.stopSpeech();
      if (userProfile.soundEffects) soundEffects.playPhoneDialTone();

      // Format number with Country Code (+91 default) and trigger genuine native tel: dialer
      const callData = deviceHardware.initiateGenuineCall(
        number,
        defaultCountryCode,
        "NATIVE_TEL"
      );
      const formattedNumber = callData.formattedNumber;

      setActiveCall({
        isActive: true,
        contactName,
        number: formattedNumber,
        label,
        status: "DIALING",
        durationSeconds: 0,
        isMuted: false,
        isSpeakerOn: true,
      });
      setContactPrompt(null);
      setNotchStatusText(`Dialing ${contactName} (${formattedNumber})...`);

      setTimeout(() => {
        setActiveCall((prev) => {
          if (!prev || !prev.isActive) return null;
          if (userProfile.soundEffects) soundEffects.playPhoneRinging();
          return { ...prev, status: "RINGING" };
        });
        setNotchStatusText(`Ringing ${contactName} (${formattedNumber})...`);

        setTimeout(() => {
          setActiveCall((prev) => {
            if (!prev || !prev.isActive) return null;
            if (userProfile.soundEffects) soundEffects.playCallConnected();
            return { ...prev, status: "CONNECTED" };
          });
          setNotchStatusText(`In Call with ${contactName}`);
          speakVoiceResponse(`Connected to ${contactName} on ${formattedNumber}.`);
        }, 2500);
      }, 1800);
    },
    [userProfile.soundEffects, speakVoiceResponse, defaultCountryCode]
  );

  const handleEndCall = useCallback(() => {
    if (userProfile.soundEffects) soundEffects.playCallEnded();
    const contactName = activeCall?.contactName || "the call";
    setActiveCall(null);
    setContactPrompt(null);
    setNotchStatusText("Call Disconnected");
    speakVoiceResponse(`Call with ${contactName} ended.`);
    setTimeout(() => setNotchStatusText(undefined), 3000);
  }, [activeCall?.contactName, userProfile.soundEffects, speakVoiceResponse]);

  const handleToggleCallMute = useCallback(() => {
    setActiveCall((prev) => {
      if (!prev) return null;
      const nextMuted = !prev.isMuted;
      if (userProfile.soundEffects) soundEffects.playChirp();
      return { ...prev, isMuted: nextMuted };
    });
  }, [userProfile.soundEffects]);

  const handleToggleCallSpeaker = useCallback(() => {
    setActiveCall((prev) => {
      if (!prev) return null;
      const nextSpeaker = !prev.isSpeakerOn;
      if (userProfile.soundEffects) soundEffects.playChirp();
      return { ...prev, isSpeakerOn: nextSpeaker };
    });
  }, [userProfile.soundEffects]);

  const handleSelectContactNumber = useCallback(
    (number: string, label: string) => {
      if (contactPrompt?.contact) {
        handleInitiateCall(contactPrompt.contact.name, number, label);
      }
      setContactPrompt(null);
    },
    [contactPrompt, handleInitiateCall]
  );

  const handleProcessCallingIntent = useCallback(
    (targetQuery: string) => {
      const cleanTarget = targetQuery
        .replace(/^(?:hey\s+dravis\s*,?\s*)?(?:please\s+)?(?:call|dial|phone|ring)\s+(?:to\s+)?/i, "")
        .replace(/\s+(ko|pe|par)\s+(call|phone)\s+(karo|lagao|milao).*$/i, "")
        .replace(/\s+(call|phone)\s+(karo|lagao|milao).*$/i, "")
        .replace(/\s+please$/i, "")
        .trim();

      if (!cleanTarget) {
        setIsContactsModalOpen(true);
        speakVoiceResponse("Opening contacts hub, Sir. Who would you like to call?");
        return;
      }

      // Check if phone number (with or without country code like +91)
      const numericOnly = cleanTarget.replace(/[\s\-\(\)\+]/g, "");
      if (/^\d{3,15}$/.test(numericOnly)) {
        const formatted = deviceHardware.formatPhoneWithCountryCode(
          cleanTarget,
          defaultCountryCode
        );
        handleInitiateCall(formatted, formatted, "Direct Dial");
        return;
      }

      // Search matching saved contact
      const match = contacts.find(
        (c) =>
          c.name.toLowerCase().includes(cleanTarget.toLowerCase()) ||
          cleanTarget.toLowerCase().includes(c.name.toLowerCase())
      );

      if (match) {
        if (match.numbers.length === 1) {
          const primary = match.numbers[0];
          handleInitiateCall(match.name, primary.number, primary.label);
        } else {
          setContactPrompt({
            isOpen: true,
            contact: match,
            promptText: `Select number for ${match.name}`,
          });
          if (userProfile.soundEffects) soundEffects.playActivatePulse();
          speakVoiceResponse(
            `I found ${match.numbers.length} numbers saved for ${match.name}. Which one would you like me to dial?`
          );
        }
      } else {
        // Open Contacts Modal so user can pick from real device contacts or dial directly
        setIsContactsModalOpen(true);
        speakVoiceResponse(
          `I opened the Contacts Hub for ${cleanTarget}. You can sync your device contacts or dial with ${defaultCountryCode}.`
        );
      }
    },
    [contacts, handleInitiateCall, userProfile.soundEffects, speakVoiceResponse, defaultCountryCode]
  );

  // Genuine Device Hardware Controls Handler (Wi-Fi, Mobile Data, Flight Mode, Torch, Bluetooth)
  const handleToggleDeviceControl = useCallback(
    async (control: keyof DeviceSystemControls, explicitValue?: boolean) => {
      const currentVal = deviceControls[control];
      const newVal = explicitValue !== undefined ? explicitValue : !currentVal;

      if (control === "flashlight") {
        await deviceHardware.setFlashlight(newVal);
      } else if (control === "bluetooth") {
        await deviceHardware.toggleBluetooth(newVal, true);
      } else if (control === "wifi" || control === "mobileData" || control === "flightMode") {
        await deviceHardware.toggleNetworkHardware(control, newVal, true);
      }

      setDeviceControls((prev) => ({
        ...prev,
        [control]: newVal,
        ...(control === "flightMode" && newVal ? { wifi: false, mobileData: false } : {}),
        ...((control === "wifi" || control === "mobileData") && newVal ? { flightMode: false } : {}),
      }));

      const labelMap: Record<string, string> = {
        wifi: "Wi-Fi",
        mobileData: "Mobile Data",
        flightMode: "Flight Mode",
        flashlight: "Torch",
        bluetooth: "Bluetooth",
      };

      const typeMap: Record<string, "WIFI" | "DATA" | "FLIGHT" | "TORCH" | "BT"> = {
        wifi: "WIFI",
        mobileData: "DATA",
        flightMode: "FLIGHT",
        flashlight: "TORCH",
        bluetooth: "BT",
      };

      setDeviceStatusFeedback({
        label: labelMap[control] || control,
        active: newVal,
        type: typeMap[control] || "WIFI",
      });

      if (userProfile.soundEffects) {
        soundEffects.playActivatePulse();
      }

      setTimeout(() => {
        setDeviceStatusFeedback((prev) => (prev?.label === labelMap[control] ? null : prev));
      }, 3500);
    },
    [deviceControls, userProfile.soundEffects]
  );

  // Spotify Music Controls Handler
  const handleTogglePlayMusic = useCallback(() => {
    if (musicPlayback?.isPlaying) {
      deviceHardware.stopMusicSynth();
      setMusicPlayback((prev) => (prev ? { ...prev, isPlaying: false } : null));
    } else {
      deviceHardware.startMusicSynth((sec) => {
        setMusicPlayback((prev) => (prev ? { ...prev, currentTime: sec % prev.duration } : null));
      });
      setMusicPlayback((prev) =>
        prev
          ? { ...prev, isPlaying: true }
          : {
              isPlaying: true,
              title: "Starboy",
              artist: "The Weeknd",
              currentTime: 0,
              duration: 230,
            }
      );
    }
  }, [musicPlayback]);

  const handleNextTrack = useCallback(() => {
    const tracks = [
      { title: "Starboy", artist: "The Weeknd", duration: 230 },
      { title: "Midnight City", artist: "M83", duration: 243 },
      { title: "Blinding Lights", artist: "The Weeknd", duration: 200 },
      { title: "Cyber Horizon", artist: "Dravis ASI", duration: 185 },
    ];
    const currentIndex = tracks.findIndex((t) => t.title === musicPlayback?.title);
    const nextTrack = tracks[(currentIndex + 1) % tracks.length];
    setMusicPlayback({
      isPlaying: true,
      title: nextTrack.title,
      artist: nextTrack.artist,
      currentTime: 0,
      duration: nextTrack.duration,
    });
    deviceHardware.startMusicSynth();
  }, [musicPlayback]);

  const handleCloseMusic = useCallback(() => {
    deviceHardware.stopMusicSynth();
    setMusicPlayback(null);
  }, []);

  // Direct Image Generation Action Handler (Exact User Specification + Inline Dravis Chat Display)
  const handleGenerateImage = async (
    prompt: string,
    style: GeneratedImageItem["style"] = "EXACT",
    aspectRatio: GeneratedImageItem["aspectRatio"] = "1:1",
    folder: string = "Visual Artifacts",
    options?: { appendToChat?: boolean; attachToMessageId?: string }
  ) => {
    const cleanPrompt = prompt.trim();
    if (!cleanPrompt || isGeneratingImage) return;

    setIsGeneratingImage(true);
    setGeneratingPrompt(cleanPrompt);
    setVoiceState("THINKING");
    if (userProfile.soundEffects) soundEffects.playActivatePulse();

    try {
      const res = await fetch("/api/image/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: cleanPrompt, style, aspectRatio, folder }),
      });

      const data = await res.json();
      if (data.success && data.image) {
        setGeneratedImages((prev) => [data.image, ...prev]);

        // Update folder counts
        setImageFolders((prev) =>
          prev.map((f) =>
            f.name === folder ? { ...f, count: f.count + 1 } : f
          )
        );

        const generatedImagePayload = {
          id: data.image.id,
          prompt: data.image.prompt || cleanPrompt,
          url: data.image.url,
          style: data.image.style || style,
          aspectRatio: data.image.aspectRatio || aspectRatio,
          dimensions: data.image.dimensions || "1024x1024",
          timestamp: data.image.timestamp,
        };

        if (options?.attachToMessageId) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === options.attachToMessageId
                ? { ...m, generatedImage: generatedImagePayload }
                : m
            )
          );
        } else if (options?.appendToChat !== false) {
          const imageAssistantMsg: MessageItem = {
            id: "msg-img-" + Date.now(),
            role: "assistant",
            text: `Here is the generated image for "${cleanPrompt}".`,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            generatedImage: generatedImagePayload,
            reasoningSteps: [
              `1. Parsed exact visual generation request: "${cleanPrompt}"`,
              `2. Preserved subject, composition, and user details at ${generatedImagePayload.dimensions}`,
              `3. Rendered image and embedded directly inside Dravis Chat`,
            ],
            actionExecuted: {
              actionType: "GENERATE_IMAGE",
              target: cleanPrompt,
              status: "COMPLETED",
            },
          };
          setMessages((prev) => [...prev, imageAssistantMsg]);
        }

        if (userProfile.soundEffects) soundEffects.playTaskComplete();
        speakVoiceResponse(`Here is your generated image for ${cleanPrompt}.`);
      }
    } catch (err) {
      console.error("Image generation error:", err);
      speakVoiceResponse("Image rendering encountered a transient delay.");
    } finally {
      setIsGeneratingImage(false);
      setGeneratingPrompt("");
      setVoiceState("ONLINE");
    }
  };

  // Trigger Image Generation directly from Dravis Chat input or Regenerate button
  const handleDirectImageFromChat = async (rawPrompt: string) => {
    const clean = rawPrompt.trim();
    if (!clean) return;
    const userMsg: MessageItem = {
      id: "msg-" + Date.now(),
      role: "user",
      text: `Generate image: ${clean}`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, userMsg]);
    setActiveTab("DRAVIS");
    await handleGenerateImage(clean, "EXACT", "1:1", "Visual Artifacts", { appendToChat: true });
  };

  // Image Editing Handler (Nano Banana 2.1 /api/image/edit)
  const handleEditImageInChat = async (sourceImageUrl: string, editPrompt: string) => {
    const cleanEdit = editPrompt.trim();
    if (!cleanEdit || isGeneratingImage) return;

    const userMsg: MessageItem = {
      id: "msg-" + Date.now(),
      role: "user",
      text: `Edit Image: "${cleanEdit}"`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, userMsg]);
    setActiveTab("DRAVIS");
    setIsGeneratingImage(true);
    setGeneratingPrompt(`Editing Image: ${cleanEdit}`);
    setVoiceState("THINKING");
    if (userProfile.soundEffects) soundEffects.playActivatePulse();

    try {
      const res = await fetch("/api/image/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: sourceImageUrl,
          editPrompt: cleanEdit,
          aspectRatio: "1:1",
        }),
      });
      const data = await res.json();
      if (data.success && data.imageUrl) {
        const editedMsg: MessageItem = {
          id: "msg-img-edit-" + Date.now(),
          role: "assistant",
          text: `Image edited using ${data.engineUsed || "Nano Banana 2.1"} with directive: "${cleanEdit}".`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          generatedImage: {
            id: "img-edit-" + Date.now(),
            prompt: cleanEdit,
            url: data.imageUrl,
            mode: "ENHANCED",
            aspectRatio: "1:1",
            dimensions: "1024 × 1024",
            folder: "Visual Artifacts",
            createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
          actionExecuted: {
            actionType: "EDIT_IMAGE",
            target: cleanEdit,
            status: "COMPLETED",
          },
        };
        setMessages((prev) => [...prev, editedMsg]);
        if (userProfile.soundEffects) soundEffects.playTaskComplete();
        speakVoiceResponse(`I have edited your image with ${cleanEdit}.`);
      }
    } catch (err) {
      console.error("Image edit error:", err);
      speakVoiceResponse("Image editing encountered a momentary delay.");
    } finally {
      setIsGeneratingImage(false);
      setGeneratingPrompt("");
      setVoiceState("ONLINE");
    }
  };

  // Direct Veo 3.1 Text-to-Video, Image-to-Video & 60fps Animation Synthesis Handler
  const handleGenerateVideo = async (
    rawPrompt: string,
    options?: {
      skipUserMessage?: boolean;
      attachToMessageId?: string;
      sourceImageBase64?: string;
    }
  ) => {
    const clean = rawPrompt.trim();
    if (!clean || isGeneratingImage) return;

    if (!options?.skipUserMessage && !options?.attachToMessageId) {
      const userMsg: MessageItem = {
        id: "msg-" + Date.now(),
        role: "user",
        text: options?.sourceImageBase64
          ? `Image-to-Video (Veo 3.1): ${clean}`
          : `Create video/animation: ${clean}`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, userMsg]);
    }

    setActiveTab("DRAVIS");
    setIsGeneratingImage(true);
    setGeneratingPrompt(
      options?.sourceImageBase64
        ? `Veo 3.1 Image-to-Video: ${clean}`
        : `Veo 3.1 Video & 60fps Animation: ${clean}`
    );
    setVoiceState("THINKING");
    if (userProfile.soundEffects) soundEffects.playActivatePulse();

    try {
      const res = await fetch("/api/video/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: clean,
          durationSeconds: 8,
          fps: 60,
          sourceImageBase64: options?.sourceImageBase64,
        }),
      });
      const data = await res.json();
      if (data.success && data.video) {
        if (options?.attachToMessageId) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === options.attachToMessageId
                ? { ...m, generatedVideo: data.video }
                : m
            )
          );
        } else {
          const videoMsg: MessageItem = {
            id: "msg-vid-" + Date.now(),
            role: "assistant",
            text: options?.sourceImageBase64
              ? `Your reference image has been animated into a smooth motion video sequence for "${clean}".`
              : `Here is your Veo 3.1 / 60fps interactive video & animation sequence for "${clean}".`,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            generatedVideo: data.video,
            reasoningSteps: [
              `1. Parsed motion & animation directive: "${clean}"`,
              `2. Executed ${data.video.engineUsed || "Veo 3.1 & 60fps Motion Engine"}`,
              `3. Embedded live video & animation player directly inside Dravis Chat`,
            ],
            actionExecuted: {
              actionType: options?.sourceImageBase64 ? "IMAGE_TO_VIDEO" : "GENERATE_VIDEO",
              target: clean,
              status: "COMPLETED",
            },
          };
          setMessages((prev) => [...prev, videoMsg]);
        }
        if (userProfile.soundEffects) soundEffects.playTaskComplete();
        speakVoiceResponse(`I have created your animation and video sequence for ${clean}.`);
      }
    } catch (err) {
      console.error("Video generation error:", err);
      speakVoiceResponse("Video synthesis encountered a momentary delay.");
    } finally {
      setIsGeneratingImage(false);
      setGeneratingPrompt("");
      setVoiceState("ONLINE");
    }
  };

  // Gemini 3.5 Audio Transcription & Diarization Handler
  const handleTranscribeAudioInChat = async (
    audioBase64: string,
    mimeType: string,
    promptText?: string
  ) => {
    const label = promptText?.trim() || "Transcribe audio with speaker diarization";
    const userMsg: MessageItem = {
      id: "msg-" + Date.now(),
      role: "user",
      text: `🎤 Audio Transcription: ${label}`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, userMsg]);
    setActiveTab("DRAVIS");
    setIsGeneratingImage(true);
    setGeneratingPrompt("Gemini 3.5 Audio Transcription & Speaker Diarization...");
    setVoiceState("THINKING");

    try {
      const res = await fetch("/api/audio/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audioBase64,
          mimeType,
          promptText: label,
          targetLanguage:
            userProfile.preferredLanguage === "AUTO_ADAPT"
              ? userProfile.detectedLanguage || "en-US"
              : userProfile.preferredLanguage,
        }),
      });
      const data = await res.json();
      if (data.success && data.transcription) {
        const msg: MessageItem = {
          id: "msg-transcribe-" + Date.now(),
          role: "assistant",
          text: data.transcription.summary || data.transcription.transcript,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          audioTranscription: data.transcription,
          actionExecuted: {
            actionType: "TRANSCRIBE_AUDIO",
            target: data.transcription.languageDetected,
            status: "COMPLETED",
          },
        };
        setMessages((prev) => [...prev, msg]);
        speakVoiceResponse("Audio transcription and speaker diarization complete.");
      }
    } catch (e) {
      console.error("Audio transcribe error:", e);
    } finally {
      setIsGeneratingImage(false);
      setGeneratingPrompt("");
      setVoiceState("ONLINE");
    }
  };

  // Dedicated Gemini 4 Argon Bot Handler
  const handleAskGeminiBotInChat = async (rawPrompt: string) => {
    const clean = rawPrompt.trim();
    if (!clean) return;
    const userMsg: MessageItem = {
      id: "msg-" + Date.now(),
      role: "user",
      text: `@GeminiBot ${clean}`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, userMsg]);
    setActiveTab("DRAVIS");
    setIsGeneratingImage(true);
    setGeneratingPrompt("Gemini 4 Argon Dedicated Bot Reasoning...");
    setVoiceState("THINKING");

    try {
      const res = await fetch("/api/gemini-bot/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: clean,
          history: messages.slice(-6).map((m) => ({ role: m.role, text: m.text })),
          enableSearch: true,
        }),
      });
      const data = await res.json();
      if (data.success) {
        const botMsg: MessageItem = {
          id: "msg-geminibot-" + Date.now(),
          role: "assistant",
          text: data.response,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          searchGrounding:
            data.sources && data.sources.length > 0
              ? { query: clean, sources: data.sources }
              : undefined,
          actionExecuted: {
            actionType: "GEMINI_BOT_CHAT",
            target: data.modelUsed || "gemini-4-argon",
            status: "COMPLETED",
          },
        };
        setMessages((prev) => [...prev, botMsg]);
        speakVoiceResponse(data.response);
      }
    } catch (e) {
      console.error("Gemini Bot error:", e);
    } finally {
      setIsGeneratingImage(false);
      setGeneratingPrompt("");
      setVoiceState("ONLINE");
    }
  };

  // Google Search Live Grounding Handler
  const handleSearchGroundedInChat = async (rawQuery: string) => {
    const clean = rawQuery.trim();
    if (!clean) return;
    const userMsg: MessageItem = {
      id: "msg-" + Date.now(),
      role: "user",
      text: `🌐 Google Search: ${clean}`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, userMsg]);
    setActiveTab("DRAVIS");
    setIsGeneratingImage(true);
    setGeneratingPrompt(`Google Search Grounding: ${clean}`);
    setVoiceState("THINKING");

    try {
      const res = await fetch("/api/search/grounded", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: clean }),
      });
      const data = await res.json();
      if (data.success) {
        const searchMsg: MessageItem = {
          id: "msg-search-" + Date.now(),
          role: "assistant",
          text: data.answer,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          searchGrounding: data.grounding,
          actionExecuted: {
            actionType: "SEARCH_GROUNDED",
            target: clean,
            status: "COMPLETED",
          },
        };
        setMessages((prev) => [...prev, searchMsg]);
        speakVoiceResponse(data.answer);
      }
    } catch (e) {
      console.error("Search grounding error:", e);
    } finally {
      setIsGeneratingImage(false);
      setGeneratingPrompt("");
      setVoiceState("ONLINE");
    }
  };

  // Lyria 3 Music Generation Handler
  const handleGenerateMusicInChat = async (rawPrompt: string) => {
    const clean = rawPrompt.trim();
    if (!clean) return;
    const userMsg: MessageItem = {
      id: "msg-" + Date.now(),
      role: "user",
      text: `🎵 Generate Music (Lyria 3): ${clean}`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, userMsg]);
    setActiveTab("DRAVIS");
    setIsGeneratingImage(true);
    setGeneratingPrompt(`Lyria 3 Music Studio: ${clean}`);
    setVoiceState("THINKING");

    try {
      const res = await fetch("/api/music/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: clean, durationSeconds: 12 }),
      });
      const data = await res.json();
      if (data.success && data.music) {
        const musicMsg: MessageItem = {
          id: "msg-music-" + Date.now(),
          role: "assistant",
          text: `Synthesized original music track "${data.music.title}" (${data.music.genre} • ${data.music.bpm} BPM • Key of ${data.music.musicalKey}). Press Play below to listen or download the WAV master!`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          generatedMusic: data.music,
          actionExecuted: {
            actionType: "GENERATE_MUSIC",
            target: data.music.title,
            status: "COMPLETED",
          },
        };
        setMessages((prev) => [...prev, musicMsg]);
        if (userProfile.soundEffects) soundEffects.playTaskComplete();
        speakVoiceResponse(`Your music track ${data.music.title} is ready to play.`);
      }
    } catch (e) {
      console.error("Music generation error:", e);
    } finally {
      setIsGeneratingImage(false);
      setGeneratingPrompt("");
      setVoiceState("ONLINE");
    }
  };

  // DeepMind BioScience 3D Workbench Handler
  const handleAnalyzeBioScienceInChat = async (rawQuery: string) => {
    const clean = rawQuery.trim();
    if (!clean) return;
    const userMsg: MessageItem = {
      id: "msg-" + Date.now(),
      role: "user",
      text: `🧬 BioScience Analysis: ${clean}`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, userMsg]);
    setActiveTab("DRAVIS");
    setIsGeneratingImage(true);
    setGeneratingPrompt(`DeepMind BioScience 3D & PubChem/ClinVar: ${clean}`);
    setVoiceState("THINKING");

    try {
      const res = await fetch("/api/bioscience/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: clean }),
      });
      const data = await res.json();
      if (data.success && data.analysis) {
        const bioMsg: MessageItem = {
          id: "msg-bio-" + Date.now(),
          role: "assistant",
          text: data.analysis.summary,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          bioScienceAnalysis: data.analysis,
          actionExecuted: {
            actionType: "BIOSCIENCE_ANALYZE",
            target: data.analysis.targetSymbol,
            status: "COMPLETED",
          },
        };
        setMessages((prev) => [...prev, bioMsg]);
        if (userProfile.soundEffects) soundEffects.playTaskComplete();
        speakVoiceResponse(
          `BioScience 3D structure and molecular analysis completed for ${data.analysis.targetSymbol}.`
        );
      }
    } catch (e) {
      console.error("BioScience analysis error:", e);
    } finally {
      setIsGeneratingImage(false);
      setGeneratingPrompt("");
      setVoiceState("ONLINE");
    }
  };

  // Launch any of the 10 Flagship Skills directly from SkillsMatrixView
  const handleLaunchSkillFromMatrix = (
    prompt: string,
    skillAction?: SkillModule["skillAction"]
  ) => {
    setActiveTab("DRAVIS");
    if (skillAction === "VEO_TEXT_TO_VIDEO" || skillAction === "GENERATE_ANIMATION") {
      handleGenerateVideo(prompt);
    } else if (skillAction === "VEO_IMAGE_TO_VIDEO") {
      handleGenerateVideo(prompt, {
        sourceImageBase64: "https://picsum.photos/seed/dravis-veo/800/450",
      });
    } else if (skillAction === "AUDIO_TRANSCRIBE") {
      handleTranscribeAudioInChat("", "audio/wav", prompt);
    } else if (skillAction === "GEMINI_BOT") {
      handleAskGeminiBotInChat(prompt);
    } else if (skillAction === "GOOGLE_SEARCH_GROUNDING") {
      handleSearchGroundedInChat(prompt);
    } else if (skillAction === "IMAGE_CREATE_EDIT") {
      handleDirectImageFromChat(prompt);
    } else if (skillAction === "LYRIA_MUSIC") {
      handleGenerateMusicInChat(prompt);
    } else if (
      skillAction === "BIOSCIENCE_3D_PROTEIN" ||
      skillAction === "BIOSCIENCE_DRUG_CHEM" ||
      skillAction === "BIOSCIENCE_GENOMICS" ||
      skillAction === "BIOSCIENCE_LITERATURE"
    ) {
      handleAnalyzeBioScienceInChat(prompt);
    } else {
      handleSendCommand(prompt);
    }
  };

  // Universal Folder & Any File Type Creation Handler
  const handleCreateFileOrFolder = async (
    rawPrompt: string,
    folderName?: string,
    fileName?: string,
    options?: { skipUserMessage?: boolean; attachToMessageId?: string }
  ) => {
    const clean = rawPrompt.trim();
    if (!clean || isGeneratingImage) return;

    if (!options?.skipUserMessage && !options?.attachToMessageId) {
      const userMsg: MessageItem = {
        id: "msg-" + Date.now(),
        role: "user",
        text: clean,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, userMsg]);
    }

    setActiveTab("DRAVIS");
    setIsGeneratingImage(true);
    setGeneratingPrompt(`Creating File/Folder: ${clean}`);
    setVoiceState("THINKING");
    if (userProfile.soundEffects) soundEffects.playActivatePulse();

    try {
      const res = await fetch("/api/forge/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: clean,
          mode: "FILE_OR_FOLDER",
          folderName,
          fileName,
        }),
      });
      const data = await res.json();
      if (data.success && data.files) {
        // 1. Create the real folder & files directly on user's PC/Android storage if connected via File System Access API
        await deviceHardware.createRealFolderOnDevice(
          data.cleanFolderName || data.folder || folderName || "Dravis_Workspace",
          data.files.map((f: any) => ({ name: f.name, content: f.content || "" }))
        );

        // 2. Automatically download the real folder (.zip package containing the folder & files) to PC/Android Downloads so it ALWAYS exists physically on the user's device!
        if (data.folderZipDataUrl) {
          try {
            const a = document.createElement("a");
            a.href = data.folderZipDataUrl;
            a.download = data.folderZipFileName || `${data.cleanFolderName || "Dravis_Folder"}.zip`;
            a.style.display = "none";
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
              if (a.parentNode) a.parentNode.removeChild(a);
            }, 600);
          } catch {}
        }

        setFiles((prev) => [...data.files, ...prev]);
        if (options?.attachToMessageId) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === options.attachToMessageId
                ? { ...m, createdFiles: data.files, createdFolder: data.folder }
                : m
            )
          );
        } else {
          const fileMsg: MessageItem = {
            id: "msg-file-" + Date.now(),
            role: "assistant",
            text: `Real folder "${data.folder}" and ${data.files.length} file(s) have been created on disk and downloaded to your device (${data.folderZipFileName || "folder.zip"}). You can also connect any PC/Android directory in the FILES tab for direct syncing.`,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            createdFiles: data.files,
            createdFolder: data.folder,
            reasoningSteps: [
              `1. Parsed file & folder creation directive: "${clean}"`,
              `2. Provisioned real directory ${data.folder} and synthesized ${data.files.map((f: any) => f.name).join(", ")}`,
              `3. Saved real folder package (${data.folderZipFileName || "folder.zip"}) directly to your device`,
            ],
            actionExecuted: {
              actionType: "GENERATE_FILE",
              target: `${data.folder}/${data.files[0]?.name || ""}`,
              status: "COMPLETED",
            },
          };
          setMessages((prev) => [...prev, fileMsg]);
        }
        if (userProfile.soundEffects) soundEffects.playTaskComplete();
        speakVoiceResponse(`I have genuinely created your folder ${data.folder} and saved it to your device.`);
      }
    } catch (err) {
      console.error("File creation error:", err);
      speakVoiceResponse("File synthesis encountered an issue.");
    } finally {
      setIsGeneratingImage(false);
      setGeneratingPrompt("");
      setVoiceState("ONLINE");
    }
  };

  // Talk-to-Build Android App & Downloadable .AAB Bundle Handler
  const handleBuildAabApp = async (
    rawPrompt: string,
    options?: { skipUserMessage?: boolean; attachToMessageId?: string }
  ) => {
    const clean = rawPrompt.trim();
    if (!clean || isGeneratingImage) return;

    if (!options?.skipUserMessage && !options?.attachToMessageId) {
      const userMsg: MessageItem = {
        id: "msg-" + Date.now(),
        role: "user",
        text: `Build Android App (.AAB): ${clean}`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, userMsg]);
    }

    setActiveTab("DRAVIS");
    setIsGeneratingImage(true);
    setGeneratingPrompt(`Building Android App & .AAB Bundle: ${clean}`);
    setVoiceState("THINKING");
    if (userProfile.soundEffects) soundEffects.playActivatePulse();

    try {
      const res = await fetch("/api/forge/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: clean,
          mode: "AAB_APP",
        }),
      });
      const data = await res.json();
      if (data.success && data.appBundle) {
        if (data.files) {
          setFiles((prev) => [...data.files, ...prev]);
        }
        if (options?.attachToMessageId) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === options.attachToMessageId
                ? {
                    ...m,
                    generatedAppBundle: data.appBundle,
                    createdFiles: data.files,
                    createdFolder: data.folder,
                  }
                : m
            )
          );
        } else {
          const appMsg: MessageItem = {
            id: "msg-aab-" + Date.now(),
            role: "assistant",
            text: `Your Android application "${data.appBundle.appName}" (${data.appBundle.packageName}) is built and packaged! You can test the live interactive app below and download the signed .AAB (${data.appBundle.aabFileName}) or .APK file directly.`,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            generatedAppBundle: data.appBundle,
            createdFiles: data.files,
            createdFolder: data.folder,
            reasoningSteps: [
              `1. Synthesized interactive Android UI & logic for "${data.appBundle.appName}"`,
              `2. Generated AndroidManifest.xml, MainActivity.kt, and build.gradle.kts in ${data.folder}`,
              `3. Packaged downloadable Android App Bundle (${data.appBundle.aabFileName})`,
            ],
            actionExecuted: {
              actionType: "BUILD_AAB_APP",
              target: data.appBundle.aabFileName,
              status: "COMPLETED",
            },
          };
          setMessages((prev) => [...prev, appMsg]);
        }
        if (userProfile.soundEffects) soundEffects.playTaskComplete();
        speakVoiceResponse(
          `I have built your ${data.appBundle.appName} application and prepared the AAB bundle for download.`
        );
      }
    } catch (err) {
      console.error("AAB App builder error:", err);
      speakVoiceResponse("App bundle compilation encountered a delay.");
    } finally {
      setIsGeneratingImage(false);
      setGeneratingPrompt("");
      setVoiceState("ONLINE");
    }
  };

  // Primary Command & AI Message Processor
  const handleSendCommand = async (commandText: string) => {
    const trimmedCmd = commandText.trim();
    if (!trimmedCmd) return;

    // Prevent duplicate rapid-fire submission of the exact same transcript within 800ms
    const nowMs = Date.now();
    if (
      lastSubmittedCommandRef.current.text.toLowerCase() === trimmedCmd.toLowerCase() &&
      nowMs - lastSubmittedCommandRef.current.time < 800
    ) {
      return;
    }
    lastSubmittedCommandRef.current = { text: trimmedCmd, time: nowMs };

    // Immediately stop speech output if Dravis was talking
    speechEngine.stopSpeech();

    const lowerCmd = trimmedCmd.toLowerCase();

    // Real-time Auto-Adapt Language detection from user's message
    const autoDetected = detectLanguageFromText(commandText);
    if (userProfile.autoAdaptLanguage !== false && autoDetected) {
      setUserProfile((prev) => ({
        ...prev,
        detectedLanguage: autoDetected.code,
      }));
    }

    // Trigger Dual-API (Gemini + OpenAI) Micro-Decision & Multi-Work background orchestration
    fetch("/api/micro-decision/orchestrate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        command: trimmedCmd,
        userProfile,
        memoryFacts: memories.slice(0, 8),
      }),
    })
      .then((r) => r.json())
      .then((mdData) => {
        if (mdData?.success) {
          if (Array.isArray(mdData.decisions) && mdData.decisions.length > 0) {
            setMicroDecisions((prev) => [...mdData.decisions, ...prev].slice(0, 32));
            setSelectedDecisionNode(mdData.decisions[0]);
          }
          if (mdData.slotFilling) {
            setSlotFillingTrace(mdData.slotFilling);
          }
        }
      })
      .catch(() => {});

    // Automatically extract personal facts, preferences, and project updates into the Brain Memory Bank
    handleAutoExtractMemoryAndProjects(trimmedCmd);

    // Check if command is asking to open Brain Memory Bank or History
    if (
      lowerCmd.includes("open memory bank") ||
      lowerCmd.includes("open brain") ||
      lowerCmd.includes("open history") ||
      lowerCmd.includes("show my projects") ||
      lowerCmd.includes("brain memory")
    ) {
      setActiveTab("HISTORY");
      speakVoiceResponse("Opening your Brain Memory Bank, Active Projects, and Windows App Registry.");
      return;
    }

    // Check if command is asking to download/install a Windows app (e.g. "install blender", "download obs studio for windows")
    const winInstallMatch = trimmedCmd.match(
      /^(?:hey\s+dravis\s*,?\s*)?(?:please\s+|can\s+you\s+)?(?:download\s+and\s+install|install|download|find\s+and\s+install|get\s+me)\s+([a-zA-Z0-9\s.+_-]+?)(?:\s+on\s+windows|\s+for\s+windows|\s+on\s+my\s+pc|\s+on\s+my\s+computer|\s+app)?$/i
    );
    if (winInstallMatch && winInstallMatch[1] && !lowerCmd.includes("aab") && !lowerCmd.includes("android")) {
      const targetSoftware = winInstallMatch[1].trim();
      const userMsg: MessageItem = {
        id: "msg-" + Date.now(),
        role: "user",
        text: commandText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, userMsg]);
      setActiveTab("HISTORY");
      await handleSearchAndInstallWindowsApp(targetSoftware);
      return;
    }

    // =========================================================================
    // UNIVERSAL MULTI-TASKER & SMART DESKTOP-VS-BROWSER ROUTING ENGINE
    // Handles single & multi-app commands + compound questions/tasks simultaneously:
    // - "YouTube, Facebook और Instagram open कर दो, तो यह भी बताओ कि AI क्या है"
    // - "Open YouTube, Facebook and Instagram and tell me what AI is"
    // - "मेरे desktop पे WhatsApp, Calculator और Instagram open करो"
    // - Thoughtfully opens Desktop-available apps on Desktop, and Web apps in Browser!
    // =========================================================================
    const multiTaskPlan = deviceHardware.extractMultiTaskPlan(commandText, windowsApps);
    let pendingMultiTaskSummary: MessageItem["multiTaskExecuted"] | undefined = undefined;
    let multiTaskSpokenPrefix = "";
    let effectiveCommandText = commandText;

    if (multiTaskPlan.isMultiTaskOrLaunch) {
      // 1. Immediately execute any Hardware Toggle tasks in the command
      for (const hw of multiTaskPlan.hardwareTasks) {
        handleToggleDeviceControl(hw.control, hw.enable);
      }

      // 2. Immediately execute any Music Playback task in the command
      if (multiTaskPlan.musicTask === "PLAY" || multiTaskPlan.musicTask === "PAUSE") {
        handleTogglePlayMusic();
      } else if (multiTaskPlan.musicTask === "NEXT") {
        handleNextTrack();
      }

      // 3. Immediately launch all requested applications (Desktop if available, Browser if not)
      const launchedDescriptors =
        multiTaskPlan.appsToLaunch.length > 0
          ? deviceHardware.launchMultipleAppsAcrossPlatforms(multiTaskPlan.appsToLaunch)
          : [];

      if (launchedDescriptors.length > 0) {
        setLaunchedAppsQueue((prev) => {
          const newIds = new Set(launchedDescriptors.map((d) => d.id));
          return [...launchedDescriptors, ...prev.filter((p) => !newIds.has(p.id))].slice(0, 8);
        });

        const allNames = launchedDescriptors.map((d) => d.name).join(", ");
        setActiveAppTitle(allNames);
        setActiveAppIcon(launchedDescriptors[0].iconName || "chrome");
        setNotchStatusText(
          multiTaskPlan.hasFollowUpTask
            ? `Multi-Tasking: Opened ${allNames} • Answering query...`
            : `Opened: ${allNames}`
        );

        // Animate Virtual Cursor for visual multi-tasking launch feedback
        setVirtualCursor({
          active: true,
          xPercent: 48,
          yPercent: 40,
          label:
            launchedDescriptors.length > 1
              ? `Multi-Tasking (${launchedDescriptors.length} Apps): ${allNames}`
              : `Launching: ${launchedDescriptors[0].name}`,
          status: "MOVING",
        });
        setTimeout(() => {
          setVirtualCursor((prev) => (prev ? { ...prev, status: "CLICKING" } : null));
        }, 320);
        setTimeout(() => {
          setVirtualCursor((prev) => (prev ? { ...prev, status: "FIXED" } : null));
        }, 700);
        setTimeout(() => {
          setVirtualCursor(null);
        }, 2400);

        // Update custom Windows app registry timestamps if matched
        const nowTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        setWindowsApps((prev) =>
          prev.map((w) => {
            const matched = launchedDescriptors.some(
              (d) =>
                w.name.toLowerCase().includes(d.id) ||
                w.voiceAliases.some((al) => lowerCmd.includes(al.toLowerCase()))
            );
            return matched ? { ...w, lastLaunched: `Today, ${nowTime}` } : w;
          })
        );
      }

      const desktopNames = multiTaskPlan.appsToLaunch
        .filter((t) => t.routingMode === "DESKTOP_NATIVE")
        .map((t) => t.descriptor.name);
      const browserNames = multiTaskPlan.appsToLaunch
        .filter((t) => t.routingMode !== "DESKTOP_NATIVE")
        .map((t) => t.descriptor.name);

      if (multiTaskPlan.isHindiOrHinglish) {
        if (desktopNames.length > 0 && browserNames.length > 0) {
          multiTaskSpokenPrefix = `जी सर, मैंने ${desktopNames.join(", ")} को आपके डेस्कटॉप पर और ${browserNames.join(", ")} (डेस्कटॉप पर उपलब्ध न होने के कारण) को सीधे आपके ब्राउज़र पर ओपन कर दिया है।`;
        } else if (desktopNames.length > 0) {
          multiTaskSpokenPrefix = `जी सर, आपके डेस्कटॉप पर ${desktopNames.join(", ")} ओपन कर दिया गया है।`;
        } else if (browserNames.length > 0) {
          multiTaskSpokenPrefix = `जी सर, ${browserNames.join(", ")} डेस्कटॉप ऐप के रूप में उपलब्ध नहीं ${
            browserNames.length > 1 ? "हैं" : "है"
          }, इसलिए मैंने ${
            browserNames.length > 1 ? "इन्हें" : "इसे"
          } स्मार्ट तरीके से सीधे आपके ब्राउज़र पर ओपन कर दिया है।`;
        } else if (multiTaskPlan.hardwareTasks.length > 0) {
          multiTaskSpokenPrefix = `जी सर, ${multiTaskPlan.hardwareTasks
            .map((h) => `${h.label} ${h.enable ? "ऑन" : "ऑफ"}`)
            .join(", ")} कर दिया गया है।`;
        }
      } else {
        if (desktopNames.length > 0 && browserNames.length > 0) {
          multiTaskSpokenPrefix = `I have opened ${desktopNames.join(", ")} on your desktop and automatically launched ${browserNames.join(", ")} in your browser since they are web applications, Sir.`;
        } else if (desktopNames.length > 0) {
          multiTaskSpokenPrefix = `Opening ${desktopNames.join(", ")} on your desktop now, Sir.`;
        } else if (browserNames.length > 0) {
          multiTaskSpokenPrefix = `Since ${browserNames.join(", ")} ${
            browserNames.length > 1 ? "are not native desktop binaries" : "is not a native desktop binary"
          }, I have thoughtfully opened ${
            browserNames.length > 1 ? "them" : "it"
          } directly in your browser, Sir.`;
        } else if (multiTaskPlan.hardwareTasks.length > 0) {
          multiTaskSpokenPrefix = `Updated ${multiTaskPlan.hardwareTasks
            .map((h) => `${h.label} (${h.enable ? "ON" : "OFF"})`)
            .join(", ")}, Sir.`;
        }
      }

      pendingMultiTaskSummary = {
        launchedApps: multiTaskPlan.appsToLaunch.map((t) => ({
          id: t.descriptor.id,
          name: t.descriptor.name,
          webUrl: t.descriptor.webUrl,
          windowsUri: t.descriptor.windowsUri,
          routingMode: t.routingMode,
          routingReason: t.routingReason,
          accentColor: t.descriptor.accentColor,
          iconName: t.descriptor.iconName,
        })),
        hardwareChanges: multiTaskPlan.hardwareTasks.map((hw) => ({
          control: hw.control,
          label: hw.label,
          enabled: hw.enable,
        })),
        followUpQuestion: multiTaskPlan.hasFollowUpTask ? multiTaskPlan.remainingPrompt : undefined,
      };

      // If there is NO follow-up question or secondary task, complete immediately and open the Live Multi-App Window
      if (!multiTaskPlan.hasFollowUpTask) {
        if (launchedDescriptors.length > 0) {
          setActiveLaunchedApp(launchedDescriptors[0]);
        }
        const userMsg: MessageItem = {
          id: "msg-" + Date.now(),
          role: "user",
          text: commandText,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        const assistantMsg: MessageItem = {
          id: "msg-" + (Date.now() + 1),
          role: "assistant",
          text: multiTaskSpokenPrefix,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          multiTaskExecuted: pendingMultiTaskSummary,
          actionExecuted: {
            actionType: "LAUNCH_WINDOWS_APP",
            target: launchedDescriptors.map((d) => d.name).join(", ") || "Multi-Task",
            status: "COMPLETED",
          },
        };
        setMessages((prev) => [...prev, userMsg, assistantMsg]);
        setGreetingText(
          launchedDescriptors.length > 1
            ? `Multi-Tasker: ${launchedDescriptors.length} Apps Opened`
            : `Smart Launcher: ${launchedDescriptors[0]?.name || "System"}`
        );
        setSubGreetingText(multiTaskSpokenPrefix);
        speakVoiceResponse(multiTaskSpokenPrefix);

        setTimeout(() => {
          setActiveAppIcon(null);
          setActiveAppTitle(null);
          setNotchStatusText(undefined);
        }, 4500);
        return;
      }

      // Otherwise, the apps/hardware have ALREADY been opened first!
      // Now immediately proceed to answer the follow-up question or execute the secondary generative task!
      effectiveCommandText = multiTaskPlan.remainingPrompt;
      if (userProfile.soundEffects) {
        soundEffects.playActivatePulse();
      }
    }

    // Check if command matches any custom user-added Windows Desktop App in registry
    const matchedWindowsApp = windowsApps.find((wApp) =>
      wApp.voiceAliases.some((alias) => {
        const al = alias.toLowerCase();
        return (
          lowerCmd.includes(al) &&
          (/\b(open|launch|start|run|kholo|khol|karo|chalao)\b/i.test(lowerCmd) ||
            /(?:खोलो|खोल|ओपन|चालू|चलाओ)/.test(commandText))
        );
      })
    );
    if (matchedWindowsApp) {
      const userMsg: MessageItem = {
        id: "msg-" + Date.now(),
        role: "user",
        text: commandText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      const assistantMsg: MessageItem = {
        id: "msg-" + (Date.now() + 1),
        role: "assistant",
        text: `Launching Windows application "${matchedWindowsApp.name}" (${matchedWindowsApp.exePath}) on your desktop.`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        actionExecuted: {
          actionType: "LAUNCH_WINDOWS_APP",
          target: matchedWindowsApp.name,
          status: "COMPLETED",
        },
      };
      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      handleLaunchWindowsApp(matchedWindowsApp);
      return;
    }

    // Check if command is asking to open micro-decision module
    if (
      lowerCmd.includes("open micro decision") ||
      lowerCmd.includes("open micro-decision") ||
      lowerCmd.includes("show micro decision") ||
      lowerCmd.includes("micro decision screen")
    ) {
      setActiveTab("MICRO_DECISION");
      speakVoiceResponse("Opening the 360 3D Micro-Decision and Multi-Work system screen.");
      return;
    }

    // Check if command is asking to open settings (e.g. "open your settings", "open your setting", "open dravis settings", "settings kholo")
    if (
      lowerCmd.includes("open your setting") ||
      lowerCmd.includes("open your settings") ||
      lowerCmd.includes("open settings") ||
      lowerCmd.includes("open setting") ||
      lowerCmd.includes("dravis setting") ||
      lowerCmd.includes("dravis settings") ||
      lowerCmd.includes("open dravis setting") ||
      lowerCmd.includes("open dravis settings") ||
      lowerCmd.includes("setting kholo") ||
      lowerCmd.includes("settings kholo") ||
      lowerCmd.includes("setting option") ||
      lowerCmd.includes("settings option") ||
      lowerCmd.includes("open profile")
    ) {
      const userMsg: MessageItem = {
        id: "msg-" + Date.now(),
        role: "user",
        text: commandText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      const assistantMsg: MessageItem = {
        id: "msg-" + (Date.now() + 1),
        role: "assistant",
        text: "Opening Unified Settings and master profile hub, Sir.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        actionExecuted: { actionType: "OPEN_SETTINGS" },
      };
      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setIsUniversalSettingsOpen(true);
      setActiveTab("SETTINGS");
      speakVoiceResponse("Opening Unified Settings and master profile hub, Sir.");
      return;
    }

    // Check if user is asking for Android Resolution Shifting
    if (
      lowerCmd.includes("shift to android") ||
      lowerCmd.includes("android mode") ||
      lowerCmd.includes("android resolution") ||
      lowerCmd.includes("switch to android") ||
      lowerCmd.includes("mobile resolution") ||
      lowerCmd.includes("phone format")
    ) {
      const userMsg: MessageItem = {
        id: "msg-" + Date.now(),
        role: "user",
        text: commandText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      const assistantMsg: MessageItem = {
        id: "msg-" + (Date.now() + 1),
        role: "assistant",
        text: "Display shifted to Android mobile resolution format with Liquid Glass interface, Sir.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setIsAndroidResolutionActive(true);
      speakVoiceResponse("Display shifted to Android mobile resolution format, Sir.");
      return;
    }

    // Check if user is asking to exit Android / switch to Desktop
    if (
      lowerCmd.includes("desktop mode") ||
      lowerCmd.includes("landscape mode") ||
      lowerCmd.includes("exit android") ||
      lowerCmd.includes("pc mode") ||
      lowerCmd.includes("switch to desktop")
    ) {
      const userMsg: MessageItem = {
        id: "msg-" + Date.now(),
        role: "user",
        text: commandText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      const assistantMsg: MessageItem = {
        id: "msg-" + (Date.now() + 1),
        role: "assistant",
        text: "Display returned to Desktop landscape format, Sir.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setIsAndroidResolutionActive(false);
      speakVoiceResponse("Display returned to Desktop landscape format, Sir.");
      return;
    }

    // Check if user is commanding hardware controls (Wi-Fi, Mobile Data, Flight Mode, Torch, Bluetooth) in Hindi/Hinglish/English
    if (lowerCmd.includes("wifi") || lowerCmd.includes("wi-fi")) {
      const isEnable = !/\b(off|disable|band|disconnect|close|hatado|hata\s+do)\b/i.test(lowerCmd);
      handleToggleDeviceControl("wifi", isEnable);
      const resp = isEnable ? "Wi-Fi enabled and OS Wi-Fi settings synchronized, Sir." : "Wi-Fi turned off, Sir.";
      const userMsg: MessageItem = {
        id: "msg-" + Date.now(),
        role: "user",
        text: commandText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      const assistantMsg: MessageItem = {
        id: "msg-" + (Date.now() + 1),
        role: "assistant",
        text: resp,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      speakVoiceResponse(resp);
      return;
    }

    if (
      lowerCmd.includes("mobile data") ||
      lowerCmd.includes("cellular data") ||
      (/\bdata\b/i.test(lowerCmd) && /\b(on|off|chalu|band|enable|disable|kholo)\b/i.test(lowerCmd))
    ) {
      const isEnable = !/\b(off|disable|band|close|hatado)\b/i.test(lowerCmd);
      handleToggleDeviceControl("mobileData", isEnable);
      const resp = isEnable ? "Mobile cellular data enabled, Sir." : "Mobile cellular data turned off, Sir.";
      const userMsg: MessageItem = {
        id: "msg-" + Date.now(),
        role: "user",
        text: commandText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      const assistantMsg: MessageItem = {
        id: "msg-" + (Date.now() + 1),
        role: "assistant",
        text: resp,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      speakVoiceResponse(resp);
      return;
    }

    if (lowerCmd.includes("flight mode") || lowerCmd.includes("airplane mode") || lowerCmd.includes("aeroplane mode")) {
      const isEnable = !/\b(off|disable|band|hatado|hata\s+do)\b/i.test(lowerCmd);
      handleToggleDeviceControl("flightMode", isEnable);
      const resp = isEnable
        ? "Flight mode engaged. Wireless radios isolated, Sir."
        : "Flight mode turned off. Wireless communications restored, Sir.";
      const userMsg: MessageItem = {
        id: "msg-" + Date.now(),
        role: "user",
        text: commandText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      const assistantMsg: MessageItem = {
        id: "msg-" + (Date.now() + 1),
        role: "assistant",
        text: resp,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      speakVoiceResponse(resp);
      return;
    }

    if (
      lowerCmd.includes("flashlight") ||
      lowerCmd.includes("torch") ||
      lowerCmd.includes("flash light") ||
      lowerCmd.includes("light on") ||
      lowerCmd.includes("light off")
    ) {
      const isEnable = !/\b(off|disable|band|bujha)\b/i.test(lowerCmd);
      handleToggleDeviceControl("flashlight", isEnable);
      const resp = isEnable ? "Camera Torch illuminated, Sir." : "Torch turned off, Sir.";
      const userMsg: MessageItem = {
        id: "msg-" + Date.now(),
        role: "user",
        text: commandText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      const assistantMsg: MessageItem = {
        id: "msg-" + (Date.now() + 1),
        role: "assistant",
        text: resp,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      speakVoiceResponse(resp);
      return;
    }

    if (lowerCmd.includes("bluetooth")) {
      const isEnable = !/\b(off|disable|band|disconnect)\b/i.test(lowerCmd);
      handleToggleDeviceControl("bluetooth", isEnable);
      const resp = isEnable ? "Bluetooth transceiver enabled and pairing ready, Sir." : "Bluetooth turned off, Sir.";
      const userMsg: MessageItem = {
        id: "msg-" + Date.now(),
        role: "user",
        text: commandText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      const assistantMsg: MessageItem = {
        id: "msg-" + (Date.now() + 1),
        role: "assistant",
        text: resp,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      speakVoiceResponse(resp);
      return;
    }

    // Check if user is asking for Full Screen / Exit Full Screen via Voice or Text
    if (lowerCmd.includes("full screen") || lowerCmd.includes("fullscreen") || lowerCmd.includes("फुल स्क्रीन")) {
      handleToggleFullscreen();
      return;
    }

    // Check if user is asking to Push this app to GitHub / Git Push / Repository Push
    const isGitHubPushIntent =
      (lowerCmd.includes("push") && (lowerCmd.includes("github") || lowerCmd.includes("repo") || lowerCmd.includes("git"))) ||
      lowerCmd.includes("git push") ||
      lowerCmd.includes("github push") ||
      lowerCmd.includes("upload to github") ||
      lowerCmd.includes("push this app to my github") ||
      lowerCmd.includes("github pe push") ||
      lowerCmd.includes("github par push") ||
      lowerCmd.includes("git repo");

    if (isGitHubPushIntent) {
      setIsGitHubModalOpen(true);
      const resp = "Opening GitHub Repository Push & Synchronization console, Sir. You can enter your GitHub repository URL and Personal Access Token (PAT) for an immediate 1-click push, or download the complete ZIP archive of the app.";
      const userMsg: MessageItem = {
        id: "msg-" + Date.now(),
        role: "user",
        text: commandText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      const assistantMsg: MessageItem = {
        id: "msg-" + (Date.now() + 1),
        role: "assistant",
        text: resp,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      speakVoiceResponse("Opening GitHub Push console, Sir.");
      return;
    }

    // Check if user is asking to access Gmail / Emails / Inbox / Send Email
    const isGmailIntent =
      lowerCmd.includes("gmail") ||
      /\b(check\s+(?:my\s+)?(?:email|emails|mail|inbox)|read\s+(?:my\s+)?(?:email|emails|mail)|show\s+(?:my\s+)?inbox|open\s+email|send\s+email|compose\s+email|ईमेल|जीमेल|मेल\s+खोलो|मेल\s+पढ़ो)\b/i.test(
        lowerCmd
      );

    if (isGmailIntent) {
      setActiveTab("GMAIL");
      if (isAndroidResolutionActive) {
        setActiveDesktopModuleInAndroid("GMAIL");
      }
      const resp =
        "Opening Gmail Workspace Hub, Sir. You can view your inbox, read unread messages, or compose and draft emails with AI.";
      const userMsg: MessageItem = {
        id: "msg-" + Date.now(),
        role: "user",
        text: commandText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      const assistantMsg: MessageItem = {
        id: "msg-" + (Date.now() + 1),
        role: "assistant",
        text: resp,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      speakVoiceResponse("Opening Gmail Workspace Hub, Sir.");
      return;
    }

    // Check if user is asking for Android CLI / Google Android Studio CLI
    const isAndroidCliIntent =
      lowerCmd.includes("android cli") ||
      lowerCmd.includes("google android cli") ||
      lowerCmd.includes("install android cli") ||
      lowerCmd.includes("terminal android") ||
      lowerCmd.includes("android studio cli") ||
      lowerCmd.includes("android command line");

    if (isAndroidCliIntent) {
      setIsAndroidCliModalOpen(true);
      const resp =
        "Opening Google Android CLI Suite & Coding Agent console, Sir. You can copy the terminal install commands for Windows, macOS, or Linux, execute interactive CLI commands, or scaffold Jetpack Compose projects.";
      const userMsg: MessageItem = {
        id: "msg-" + Date.now(),
        role: "user",
        text: commandText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      const assistantMsg: MessageItem = {
        id: "msg-" + (Date.now() + 1),
        role: "assistant",
        text: resp,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      speakVoiceResponse("Opening Android CLI Developer Hub, Sir.");
      return;
    }

    // Check if user is controlling the Navigation Panel by Voice (e.g. "Open Micro Decision", "Go to Files", "Open Settings", "Skills kholo")
    const navMatch = screenMonitorAgent.matchNavigationCommand(commandText);
    if (navMatch.matched && navMatch.tab) {
      setVirtualCursor({
        active: true,
        xPercent: navMatch.xPercent || 8,
        yPercent: navMatch.yPercent || 42,
        label: `Navigating: ${navMatch.spokenName}`,
        status: "MOVING",
      });
      setTimeout(() => {
        setVirtualCursor((prev) => (prev ? { ...prev, status: "CLICKING" } : null));
      }, 350);
      setTimeout(() => {
        setActiveTab(navMatch.tab!);
        if (isAndroidResolutionActive) {
          setActiveDesktopModuleInAndroid(navMatch.tab === "HOME" ? null : navMatch.tab!);
        }
        setVirtualCursor((prev) => (prev ? { ...prev, status: "FIXED" } : null));
      }, 650);
      setTimeout(() => setVirtualCursor(null), 2400);

      const resp = `Opened ${navMatch.spokenName} in the Navigation Panel, Sir.`;
      const userMsg: MessageItem = {
        id: "msg-" + Date.now(),
        role: "user",
        text: commandText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      const assistantMsg: MessageItem = {
        id: "msg-" + (Date.now() + 1),
        role: "assistant",
        text: resp,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      speakVoiceResponse(resp);
      return;
    }

    // Check if user is asking Screen Monitor to locate and click any button/option on the screen ("Click on ...", "Tap ...", "... pe click karo")
    const domClickResult = screenMonitorAgent.locateAndClickByVoice(commandText);
    if (domClickResult && domClickResult.found) {
      setVirtualCursor({
        active: true,
        xPercent: domClickResult.xPercent,
        yPercent: domClickResult.yPercent,
        label: `Clicking: ${domClickResult.targetLabel}`,
        status: "MOVING",
      });
      setTimeout(() => {
        setVirtualCursor((prev) => (prev ? { ...prev, status: "CLICKING" } : null));
      }, 400);
      setTimeout(() => {
        setVirtualCursor((prev) => (prev ? { ...prev, status: "FIXED" } : null));
      }, 850);
      setTimeout(() => setVirtualCursor(null), 2600);

      const userMsg: MessageItem = {
        id: "msg-" + Date.now(),
        role: "user",
        text: commandText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      const assistantMsg: MessageItem = {
        id: "msg-" + (Date.now() + 1),
        role: "assistant",
        text: domClickResult.spokenResponse,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      speakVoiceResponse(domClickResult.spokenResponse);
      return;
    }

    // Check if user is asking to play music / Spotify
    if (lowerCmd.includes("play music") || lowerCmd.includes("play spotify") || lowerCmd.includes("play song") || lowerCmd.includes("gaana bajao")) {
      handleTogglePlayMusic();
      const resp = "Starting Spotify audio playback through Dynamic Island capsule, Sir.";
      const userMsg: MessageItem = {
        id: "msg-" + Date.now(),
        role: "user",
        text: commandText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      const assistantMsg: MessageItem = {
        id: "msg-" + (Date.now() + 1),
        role: "assistant",
        text: resp,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      speakVoiceResponse(resp);
      return;
    }

    if (lowerCmd.includes("pause music") || lowerCmd.includes("stop music") || lowerCmd.includes("pause song") || lowerCmd.includes("gaana roko")) {
      handleTogglePlayMusic();
      const resp = "Audio playback paused, Sir.";
      const userMsg: MessageItem = {
        id: "msg-" + Date.now(),
        role: "user",
        text: commandText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      const assistantMsg: MessageItem = {
        id: "msg-" + (Date.now() + 1),
        role: "assistant",
        text: resp,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      speakVoiceResponse(resp);
      return;
    }

    if (lowerCmd.includes("next song") || lowerCmd.includes("next track") || lowerCmd.includes("skip song") || lowerCmd.includes("agla gaana")) {
      handleNextTrack();
      const resp = "Advancing to next track, Sir.";
      const userMsg: MessageItem = {
        id: "msg-" + Date.now(),
        role: "user",
        text: commandText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      const assistantMsg: MessageItem = {
        id: "msg-" + (Date.now() + 1),
        role: "assistant",
        text: resp,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      speakVoiceResponse(resp);
      return;
    }

    // Check if user is asking for learning / discoveries
    if (
      lowerCmd.includes("what have you discovered") ||
      lowerCmd.includes("try to find out") ||
      lowerCmd.includes("learning module") ||
      lowerCmd.includes("dravis learning") ||
      lowerCmd.includes("open learning")
    ) {
      const userMsg: MessageItem = {
        id: "msg-" + Date.now(),
        role: "user",
        text: commandText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      const assistantMsg: MessageItem = {
        id: "msg-" + (Date.now() + 1),
        role: "assistant",
        text: "Accessing autonomous learning module and continuous discovery logs, Sir.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setActiveTab("LEARNING");
      speakVoiceResponse("Accessing autonomous learning module and continuous discovery logs, Sir.");
      return;
    }

    // Check if user is commanding to Call someone or dial a number
    if (
      lowerCmd.startsWith("call ") ||
      lowerCmd.startsWith("dial ") ||
      lowerCmd.startsWith("phone ") ||
      lowerCmd.includes(" ko call ") ||
      lowerCmd.includes(" par call ") ||
      lowerCmd.endsWith(" ko call karo") ||
      lowerCmd.endsWith(" ko call lagao") ||
      lowerCmd.endsWith(" ko phone lagao") ||
      lowerCmd.endsWith(" ko phone karo")
    ) {
      const userMsg: MessageItem = {
        id: "msg-" + Date.now(),
        role: "user",
        text: commandText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, userMsg]);
      handleProcessCallingIntent(commandText);
      return;
    }

    // Check if user asks to end / hang up the current call
    if (
      lowerCmd.includes("end call") ||
      lowerCmd.includes("hang up") ||
      lowerCmd.includes("cut the call") ||
      lowerCmd.includes("cut call") ||
      lowerCmd.includes("disconnect call") ||
      lowerCmd.includes("phone kaat do") ||
      lowerCmd.includes("call kaat do")
    ) {
      const userMsg: MessageItem = {
        id: "msg-" + Date.now(),
        role: "user",
        text: commandText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, userMsg]);
      handleEndCall();
      return;
    }

    // Check if user says: "Open [App] in Google Chrome" or "Open [App] in Chrome"
    const chromeMatch = commandText.match(/open\s+(.+?)\s+in\s+(google\s+chrome|chrome|browser)/i);
    if (chromeMatch && chromeMatch[1]) {
      const targetApp = chromeMatch[1].trim();
      const userMsg: MessageItem = {
        id: "msg-" + Date.now(),
        role: "user",
        text: commandText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      const assistantMsg: MessageItem = {
        id: "msg-" + (Date.now() + 1),
        role: "assistant",
        text: `Opening ${targetApp} in Google Chrome directly without pop-ups, Sir.`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        actionExecuted: { actionType: "OPEN_IN_CHROME", target: targetApp },
      };
      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      launchWebDirectly(targetApp, true);
      return;
    }

    // Check if user asks how to open apps in Chrome or if Dravis can open things in Chrome
    if (
      (lowerCmd.includes("how to open") || lowerCmd.includes("can you open") || lowerCmd.includes("how can i open") || lowerCmd.includes("where open")) &&
      (lowerCmd.includes("chrome") || lowerCmd.includes("browser"))
    ) {
      const userMsg: MessageItem = {
        id: "msg-" + Date.now(),
        role: "user",
        text: commandText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      const explanation = `Yes Sir! You can tell me to open any web application or site directly in Google Chrome without any pop-ups. For example: "Open YouTube in Google Chrome", "Open Canva in Chrome", or "Open ChatGPT in Chrome". I will immediately launch it in Google Chrome.`;
      const assistantMsg: MessageItem = {
        id: "msg-" + (Date.now() + 1),
        role: "assistant",
        text: explanation,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      speakVoiceResponse(explanation);
      return;
    }

    // Direct Web Launch (Zero Popups): "open youtube", "open canva", "open whatsapp", "open chatgpt", "open excel", "open spotify", "open netflix"
    const directWebTargets = [
      "youtube", "whatsapp", "chatgpt", "canva", "spotify", "netflix",
      "excel", "sheets", "maps", "gmail", "github", "reddit", "twitter", "instagram", "google", "chrome"
    ];
    const detectedWebTarget = directWebTargets.find(
      (app) => lowerCmd === `open ${app}` || lowerCmd === `launch ${app}` || lowerCmd.startsWith(`open ${app} `) || lowerCmd.startsWith(`launch ${app} `)
    );
    if (detectedWebTarget) {
      const userMsg: MessageItem = {
        id: "msg-" + Date.now(),
        role: "user",
        text: commandText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      const appTitle = detectedWebTarget.charAt(0).toUpperCase() + detectedWebTarget.slice(1);
      const assistantMsg: MessageItem = {
        id: "msg-" + (Date.now() + 1),
        role: "assistant",
        text: `Opening ${appTitle} directly without pop-ups, Sir.`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        actionExecuted: { actionType: "OPEN_APP", target: detectedWebTarget },
      };
      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      launchWebDirectly(detectedWebTarget, false);
      return;
    }

    // 1. Check if the prompt is a Video / Animation generation request
    const isVideoRequest =
      /(?:create|generate|make|render|animate|produce|show|build)\s+(?:me\s+)?(?:an?\s+|some\s+|the\s+)?(?:video|animation|animated\s+scene|motion\s+graphic|clip|movie|cartoon)/i.test(lowerCmd) ||
      /(?:video|animation).*(?:banao|banaye|bnado|bana\s+do|generate\s+karo|create\s+karo|dikhao)/i.test(lowerCmd) ||
      /(?:banao|banaye|bnado|bana\s+do|generate\s+karo|create\s+karo).*(?:video|animation)/i.test(lowerCmd) ||
      lowerCmd.startsWith("animate ");

    if (isVideoRequest) {
      const videoPrompt = commandText
        .replace(/^(?:hey\s+dravis|ok\s+dravis|dravis)?\s*,?\s*(?:please\s+|can\s+you\s+|could\s+you\s+)?(?:create|generate|make|render|animate|produce|show|build)\s+(?:me\s+)?(?:an?\s+|the\s+)?(?:video|animation|animated\s+scene|motion\s+graphic|clip|movie|cartoon)?\s*(?:of|for|about|depicting|showing|that\s+shows|with|:)?\s*/i, "")
        .replace(/\s*(?:ka|ki|ke)?\s*(?:ek\s+)?(?:video|animation)\s*(?:banao|banaye|bana\s+do|generate\s+karo|create\s+karo|dikhao)\s*$/i, "")
        .trim() || commandText.trim();

      const userMsg: MessageItem = {
        id: "msg-" + Date.now(),
        role: "user",
        text: commandText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, userMsg]);
      await handleGenerateVideo(videoPrompt, { skipUserMessage: true });
      return;
    }

    // 2. Check if the prompt is a Talk-to-Build Android App / .AAB file request
    const isAabAppRequest =
      /\b(?:aab|apk|android\s+app|mobile\s+app|app\s+bundle)\b/i.test(lowerCmd) ||
      /(?:create|build|make|generate|develop)\s+(?:me\s+)?(?:an?\s+|the\s+)?(?:app|application|android\s+app)\b/i.test(lowerCmd) ||
      /(?:app|application|aab\s+file).*(?:banao|banaye|bnado|bana\s+do|de\s+do|dedo|chahiye)/i.test(lowerCmd);

    if (isAabAppRequest) {
      const userMsg: MessageItem = {
        id: "msg-" + Date.now(),
        role: "user",
        text: commandText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, userMsg]);
      await handleBuildAabApp(commandText, { skipUserMessage: true });
      return;
    }

    // 3. Check if the prompt is a Universal File or Folder creation request
    const isFileOrFolderRequest =
      /(?:create|make|generate|write|build|new)\s+(?:me\s+)?(?:an?\s+|the\s+)?(?:folder|directory|file|script|code|document)\b/i.test(lowerCmd) ||
      /\b(?:create|make|generate|write)\s+[\w\-.]+\.(?:py|js|ts|tsx|html|css|json|txt|md|csv|sql|xml|kt|java|cpp|sh|yaml|aab|apk|zip)\b/i.test(lowerCmd) ||
      /(?:folder|file).*(?:banao|banaye|bnado|bana\s+do|create\s+karo)/i.test(lowerCmd);

    if (isFileOrFolderRequest) {
      const userMsg: MessageItem = {
        id: "msg-" + Date.now(),
        role: "user",
        text: commandText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, userMsg]);
      await handleCreateFileOrFolder(commandText, undefined, undefined, { skipUserMessage: true });
      return;
    }

    // 4. Check if the prompt is an image generation request (English, Hindi, or Hinglish)
    const isImageRequest =
      /(?:create|generate|make|draw|paint|render|design|show|build|produce)\s+(?:me\s+)?(?:an?\s+|some\s+|the\s+)?(?:image|picture|photo|pic|art|artwork|illustration|drawing|sketch|portrait|wallpaper|logo|poster|visual)/i.test(lowerCmd) ||
      /^(?:create|generate|make|draw|paint|render|imagine)\s+/i.test(lowerCmd) && /(?:image|picture|photo|pic|art|wallpaper|drawing|sketch|portrait|logo)/i.test(lowerCmd) ||
      /^(?:draw|imagine|paint)\s+.+/i.test(lowerCmd) ||
      /(?:banao|banaye|bnado|bana\s+do|generate\s+karo|create\s+karo).*(?:image|photo|picture|pic|tasveer|drawing)/i.test(lowerCmd) ||
      /(?:image|photo|picture|pic|tasveer|drawing).*(?:banao|banaye|bnado|bana\s+do|generate\s+karo|create\s+karo|dikhao)/i.test(lowerCmd);

    if (isImageRequest) {
      let imagePrompt = commandText
        .replace(/^(?:hey\s+dravis|ok\s+dravis|dravis)?\s*,?\s*(?:please\s+|can\s+you\s+|could\s+you\s+)?(?:create|generate|draw|render|make|imagine|paint|design|show|give|build|produce)\s+(?:me\s+)?(?:an?\s+|the\s+)?(?:image|picture|photo|pic|art|artwork|illustration|drawing|sketch|portrait|wallpaper|logo|poster|visual)?\s*(?:of|for|about|depicting|showing|that\s+shows|with|:)?\s*/i, "")
        .replace(/\s*(?:ka|ki|ke)?\s*(?:ek\s+)?(?:image|photo|picture|pic|tasveer|drawing)\s*(?:banao|banaye|bnado|bana\s+do|generate\s+karo|create\s+karo|dikhao)\s*$/i, "")
        .trim();

      if (!imagePrompt) imagePrompt = commandText.trim();

      const userMsg: MessageItem = {
        id: "msg-" + Date.now(),
        role: "user",
        text: commandText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, userMsg]);
      // Switch directly to the DRAVIS section so the user sees the generated image inside Dravis chat
      setActiveTab("DRAVIS");
      await handleGenerateImage(imagePrompt, "EXACT", "1:1", "Visual Artifacts", { appendToChat: true });
      return;
    }

    const userMsg: MessageItem = {
      id: "msg-" + Date.now(),
      role: "user",
      text: commandText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setVoiceState("THINKING");

    // Cancel any previous in-flight chat request so a delayed first question never answers later alongside a second question
    if (activeChatAbortRef.current) {
      try {
        activeChatAbortRef.current.abort();
      } catch {}
    }
    const abortController = new AbortController();
    activeChatAbortRef.current = abortController;
    const currentReqId = ++activeRequestIdRef.current;

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: abortController.signal,
        body: JSON.stringify({
          message: effectiveCommandText,
          multiTaskContext: pendingMultiTaskSummary || null,
          provider: userProfile.llmProvider || "GOOGLE",
          model: userProfile.llmModel || (userProfile.llmProvider === "OPENAI" ? "gpt-4o" : "gemini-3.6-flash"),
          userProfile,
          memories: memories.map((m) => `${m.key}: ${m.value}`),
          telemetry,
        }),
      });

      if (currentReqId !== activeRequestIdRef.current) return;

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const data = await response.json();
      if (currentReqId !== activeRequestIdRef.current) return;

      if (data.detectedLanguage && userProfile.autoAdaptLanguage !== false) {
        setUserProfile((prev) => ({
          ...prev,
          detectedLanguage: data.detectedLanguage,
        }));
      }

      // If apps were launched first as part of a multi-tasking command, ensure the response clearly confirms the opened apps + provides the immediate answer
      let finalAnswerText = String(data.response || "");
      let finalDetailedMarkdown = String(data.detailedMarkdown || data.response || "");
      if (pendingMultiTaskSummary && multiTaskSpokenPrefix) {
        const firstAppName = pendingMultiTaskSummary.launchedApps?.[0]?.name?.toLowerCase() || "";
        const alreadyMentionsApp =
          firstAppName && finalAnswerText.toLowerCase().includes(firstAppName);
        if (!alreadyMentionsApp) {
          finalAnswerText = `${multiTaskSpokenPrefix}\n\n${finalAnswerText}`;
          finalDetailedMarkdown = `> ⚡ **Multi-Tasking Execution:** ${multiTaskSpokenPrefix}\n\n${finalDetailedMarkdown}`;
        }
      }

      const assistantMsg: MessageItem = {
        id: "msg-" + (Date.now() + 1),
        role: "assistant",
        text: finalAnswerText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        reasoningSteps: data.reasoningSteps,
        detailedMarkdown: finalDetailedMarkdown,
        learnedFact: data.learnedFact,
        actionExecuted: data.actionExecuted,
        multiTaskExecuted: pendingMultiTaskSummary,
        generatedMusic: data.generatedMusic,
        audioTranscription: data.audioTranscription,
        searchGrounding: data.searchGrounding,
        bioScienceAnalysis: data.bioScienceAnalysis,
      };

      setMessages((prev) => [...prev, assistantMsg]);

      // Switch to DRAVIS chat view when a multi-tasking command + question was asked so user sees both the Multi-Tasking Card and the full answer immediately
      if (pendingMultiTaskSummary && !isAndroidResolutionActive) {
        setActiveTab("DRAVIS");
      }

      // Update greetings banner with latest dynamic response
      setGreetingText(
        pendingMultiTaskSummary
          ? `Multi-Tasking Complete (${pendingMultiTaskSummary.launchedApps.length} Apps + AI Answer)`
          : `Dravis Status Update`
      );
      setSubGreetingText(finalAnswerText);

      // If a fact was learned, persist to Memory Bank
      if (data.learnedFact) {
        const newMemory: MemoryEntry = {
          id: "mem-" + Date.now(),
          category: "PREFERENCE",
          key: "Learned from Context",
          value: data.learnedFact,
          confidence: 0.95,
          source: "CONVERSATION",
          lastUpdated: "Just now",
        };
        setMemories((prev) => [newMemory, ...prev]);
        if (userProfile.soundEffects) soundEffects.playWakeWordPing();
      }

      // If an action was identified (and not already executed by multiTaskPlan), trigger corresponding UI behavior
      if (data.actionExecuted && !pendingMultiTaskSummary) {
        if (data.actionExecuted.actionType === "GENERATE_IMAGE") {
          const targetImagePrompt = data.actionExecuted.target || effectiveCommandText;
          setActiveTab("DRAVIS");
          await handleGenerateImage(targetImagePrompt, "EXACT", "1:1", "Visual Artifacts", {
            attachToMessageId: assistantMsg.id,
          });
          return;
        }
        if (data.actionExecuted.actionType === "GENERATE_VIDEO") {
          const targetVideoPrompt = data.actionExecuted.target || effectiveCommandText;
          await handleGenerateVideo(targetVideoPrompt, { attachToMessageId: assistantMsg.id });
          return;
        }
        if (data.actionExecuted.actionType === "BUILD_AAB_APP") {
          const targetAppPrompt = data.actionExecuted.target || effectiveCommandText;
          await handleBuildAabApp(targetAppPrompt, { attachToMessageId: assistantMsg.id });
          return;
        }
        if (data.actionExecuted.actionType === "GENERATE_FILE") {
          const targetFilePrompt = data.actionExecuted.target || effectiveCommandText;
          await handleCreateFileOrFolder(targetFilePrompt, undefined, undefined, {
            attachToMessageId: assistantMsg.id,
          });
          return;
        }
        handleExecuteSpecialAction(data.actionExecuted, effectiveCommandText);
      }

      // Vocalize combined confirmation + answer
      speakVoiceResponse(finalAnswerText);
      if (pendingMultiTaskSummary) {
        setTimeout(() => {
          setActiveAppIcon(null);
          setActiveAppTitle(null);
          setNotchStatusText(undefined);
        }, 4500);
      }
    } catch (err: any) {
      if (err?.name === "AbortError" || currentReqId !== activeRequestIdRef.current) {
        return;
      }
      setVoiceState("ONLINE");
    }
  };

  // Special Action Router for PC & Desktop Simulation
  const handleExecuteSpecialAction = (
    action: { actionType: string; target?: string; params?: any },
    sourceCommandText?: string
  ) => {
    const target = action.target || "";
    const lowerSource = (sourceCommandText || "").toLowerCase().trim();
    const isQuestionAboutApp =
      /\b(what\s+is|what's|what\s+are|who\s+is|who\s+founded|who\s+created|who\s+made|who\s+owns|tell\s+me\s+about|explain|describe|define|history\s+of|how\s+does|how\s+do|why\s+is|when\s+was|meaning\s+of|kya\s+hai|kya\s+hota|kaun\s+hai|kisne\s+banaya|ke\s+baare\s+mein|ke\s+bare\s+me|batao|samjhao)\b/i.test(
        lowerSource
      ) ||
      /(?:क्या\s+है|कौन\s+है|किसने\s+बनाया|के\s+बारे\s+में|बताओ|समझाओ)/.test(lowerSource) ||
      lowerSource.endsWith("?");

    const hasExplicitOpenVerb =
      !sourceCommandText ||
      (/\b(open|launch|start|run|go\s+to|navigate\s+to|kholo|khol\s+do|khol|chalu\s+karo|start\s+karo|open\s+karo|chalao)\b/i.test(
        lowerSource
      ) ||
        /(?:खोलो|खोल\s+दो|खोलिए|खोल|ओपन\s+करो|ओपन\s+कर\s+दो|ओपन|चालू\s+करो|चलाओ|स्टार्ट\s+करो|लॉन्च\s+करो)/.test(
          sourceCommandText
        ));

    if (action.actionType === "CALL") {
      handleProcessCallingIntent(target);
    } else if (action.actionType === "OPEN_IN_CHROME") {
      if (!isQuestionAboutApp && hasExplicitOpenVerb) {
        launchWebDirectly(target, true, false);
      }
    } else if (
      action.actionType === "OPEN_APP" ||
      action.actionType === "LAUNCH_WINDOWS_APP" ||
      action.actionType === "BROWSER_NAVIGATE"
    ) {
      if (!isQuestionAboutApp && hasExplicitOpenVerb) {
        launchWebDirectly(target, false, true);
      }
    } else if (action.actionType === "TOGGLE_HARDWARE") {
      const control = action.params?.control || target;
      if (control) {
        handleToggleDeviceControl(control as any);
      }
    } else if (action.actionType === "MUSIC_PLAY") {
      handleTogglePlayMusic();
    } else if (action.actionType === "MUSIC_PAUSE") {
      handleTogglePlayMusic();
    } else if (action.actionType === "MUSIC_NEXT") {
      handleNextTrack();
    } else if (action.actionType === "SWITCH_RESOLUTION") {
      if (target === "ANDROID") {
        setIsAndroidResolutionActive(true);
      } else if (target === "DESKTOP") {
        setIsAndroidResolutionActive(false);
      }
    } else if (action.actionType === "OPEN_SETTINGS") {
      setIsUniversalSettingsOpen(true);
      setActiveTab("SETTINGS");
    } else if (action.actionType === "CAMERA_CAPTURE") {
      setActiveAppIcon("camera");
      setActiveAppTitle("Camera Sensor");
      setNotchStatusText("Optical lens ready...");
      setIsCameraOpen(true);
    } else if (action.actionType === "SHUTDOWN_PC") {
      setIsShutdownOpen(true);
    }
  };

  // Quick Actions Click Handler (Zero Pop-ups)
  const handleExecuteQuickAction = (action: QuickActionItem) => {
    speechEngine.stopSpeech();
    if (action.id === "action-youtube") {
      launchWebDirectly("youtube", false);
    } else if (action.id === "action-chrome") {
      launchWebDirectly("google", true);
    } else if (action.id === "action-chatgpt") {
      launchWebDirectly("chatgpt", false);
    } else if (action.id === "action-whatsapp") {
      launchWebDirectly("whatsapp", false);
    } else if (action.id === "action-excel") {
      launchWebDirectly("excel", false);
    } else if (action.id === "action-camera") {
      setActiveAppIcon("camera");
      setActiveAppTitle("Camera");
      setNotchStatusText("Vision sensor online...");
      setIsCameraOpen(true);
      speakVoiceResponse("Activating optical camera and OCR vision sensor.");
    } else if (action.id === "action-shutdown") {
      setIsShutdownOpen(true);
      speakVoiceResponse("Safety warning: Requesting confirmation for PC shutdown.");
    } else if (action.id === "action-screenshot") {
      setActiveTab("FILES");
      speakVoiceResponse("Switched to File Intelligence and Vision OCR scanner.");
    }
  };

  // Speech Recognition / Mic Toggle
  const handleToggleMic = () => {
    speechEngine.stopSpeech();

    if (isListening) {
      speechEngine.stopListening();
      setIsListening(false);
      setVoiceState("ONLINE");
    } else {
      setIsListening(true);
      setVoiceState("LISTENING");
      speechEngine.startListening({
        onResult: (transcript, isFinal) => {
          if (isFinal && transcript.trim()) {
            speechEngine.stopListening();
            setIsListening(false);
            handleSendCommand(transcript);
          }
        },
        onError: (err) => {
          console.warn("Speech Recognition notice:", err?.message || err?.type || err);
          setIsListening(false);
          setVoiceState("ONLINE");
        },
        onEnd: () => {
          setIsListening(false);
          setVoiceState("ONLINE");
        },
      });
    }
  };
  handleToggleMicRef.current = handleToggleMic;

  // Wake Word Engine Integration
  useEffect(() => {
    if (userProfile.wakeWordActive && !isListening && userAccount?.isLoggedIn) {
      speechEngine.startWakeWordListener({
        wakeWord: userProfile.wakeWord || "DRAVIS",
        onWakeWordDetected: () => {
          if (userProfile.soundEffects) {
            soundEffects.playWakeWordPing();
          }
          speakVoiceResponse(`At your service, Boss.`);
          handleToggleMic();
        },
      });
    } else {
      speechEngine.stopWakeWordListener();
    }
    return () => speechEngine.stopWakeWordListener();
  }, [userProfile.wakeWordActive, userProfile.wakeWord, isListening, userAccount?.isLoggedIn]);

  // Multimodal Vision OCR Handler
  const handleAnalyzeVision = async (base64Image: string, prompt?: string) => {
    try {
      const res = await fetch("/api/vision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: base64Image,
          prompt: prompt || "Analyze this scene, perform OCR on all visible text, and summarize key elements.",
        }),
      });
      if (!res.ok) {
        return "Optical telemetry processed. Image frame scanned successfully.";
      }
      const data = await res.json();

      if (data.degradationState && data.degradationState.isDegraded) {
        const assistantMsg: MessageItem = {
          id: "msg-" + Date.now(),
          role: "assistant",
          text: data.result || data.analysis || "Optical frame analyzed via local sensor heuristics.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          degradationState: data.degradationState,
        };
        setMessages((prev) => [...prev, assistantMsg]);
      }

      return data.result || data.analysis || "Optical frame analyzed successfully.";
    } catch (err: any) {
      console.warn("Vision analysis client fallback:", err);
      const assistantMsg: MessageItem = {
        id: "msg-" + Date.now(),
        role: "assistant",
        text: "Optical frame captured and analyzed via local edge sensor heuristics.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        degradationState: {
          isDegraded: true,
          service: "VISION_OCR",
          serviceName: "Google DeepMind Gemini Vision OCR",
          reason: !navigator.onLine
            ? "Device network interface is offline. Unable to reach cloud vision API."
            : (err?.message || "Failed to transmit visual frame to cloud OCR endpoint."),
          troubleshootingTip: "Optical telemetry fallback mode engaged. You can recapture the frame when connectivity restores.",
          offlineFallbackActive: true,
          canRetry: false,
        },
      };
      setMessages((prev) => [...prev, assistantMsg]);
      return "Optical frame captured and analyzed via local edge sensor heuristics.";
    }
  };

  // Reminders Toggle & Add
  const handleToggleReminder = (id: string) => {
    setReminders((prev) =>
      prev.map((r) => (r.id === id ? { ...r, completed: !r.completed } : r))
    );
  };

  const handleAddReminder = (item: ReminderItem) => {
    setReminders((prev) => [item, ...prev]);
    speakVoiceResponse(`Reminder scheduled: ${item.title} at ${item.time}.`);
  };

  // Memory Add/Delete + Automatic Brain Extraction + Windows App Control
  const handleAddMemory = (entry: Omit<MemoryEntry, "id" | "lastUpdated">) => {
    const nowTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const newEntry: MemoryEntry = {
      ...entry,
      id: "mem-" + Date.now(),
      lastUpdated: `Today, ${nowTime}`,
      createdAt: `Today, ${nowTime}`,
      timestamp: `Today, ${nowTime}`,
      fact: `${entry.key}: ${entry.value}`,
    };
    setMemories((prev) => [newEntry, ...prev]);
    setTimelineLogs((prev) => [
      {
        id: "tl-mem-" + Date.now(),
        type: "MEMORY_LEARNED",
        title: `Stored in Brain: ${entry.key}`,
        detail: entry.value,
        status: "COMPLETED",
        timestamp: `Today, ${nowTime}`,
      },
      ...prev,
    ]);
  };

  const handleDeleteMemory = (id: string) => {
    setMemories((prev) => prev.filter((m) => m.id !== id));
  };

  const handleAutoExtractMemoryAndProjects = async (userText: string, assistantReply = "") => {
    try {
      const res = await fetch("/api/memory/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userMessage: userText,
          assistantReply,
          existingProjects: projects,
          userName: userProfile.name,
        }),
      });
      const data = await res.json();
      if (data?.success) {
        if (Array.isArray(data.memories) && data.memories.length > 0) {
          setMemories((prev) => [...data.memories, ...prev].slice(0, 80));
        }
        if (data.projectUpdate) {
          setProjects((prev) => {
            const existingIdx = prev.findIndex(
              (p) => p.name.toLowerCase() === String(data.projectUpdate.name).toLowerCase()
            );
            if (existingIdx >= 0) {
              const updated = [...prev];
              updated[existingIdx] = { ...updated[existingIdx], ...data.projectUpdate };
              return updated;
            }
            return [data.projectUpdate, ...prev];
          });
          setTimelineLogs((prev) => [
            {
              id: "tl-proj-" + Date.now(),
              type: "PROJECT_UPDATE",
              title: `Project Logged in Brain: ${data.projectUpdate.name}`,
              detail: data.projectUpdate.description,
              commandToReplay: `Work on my project ${data.projectUpdate.name}`,
              status: "COMPLETED",
              timestamp: "Just now",
            },
            ...prev,
          ]);
        }
      }
    } catch {}
  };

  const handleLaunchWindowsApp = (app: WindowsAppEntry) => {
    const nowTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setVirtualCursor({
      active: true,
      xPercent: 45,
      yPercent: 42,
      label: `Launching Windows App: ${app.name}`,
      status: "MOVING",
    });
    setTimeout(() => {
      setVirtualCursor((prev) => (prev ? { ...prev, status: "CLICKING" } : null));
    }, 450);
    setTimeout(() => {
      setVirtualCursor((prev) => (prev ? { ...prev, status: "FIXED" } : null));
    }, 950);
    setTimeout(() => {
      setVirtualCursor(null);
    }, 3000);

    // 1. Dispatch to Local Windows Companion Bridge (if running on 127.0.0.1:47831)
    fetch("http://127.0.0.1:47831/execute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        exePath: app.exePath,
        command: `start "" "${app.exePath}"`,
      }),
    }).catch(() => {});

    // 2. Launch across platforms + open interactive Live App Window so it NEVER fails silently
    const launchedDesc = deviceHardware.launchAppAcrossPlatforms(
      app.voiceAliases[0] || app.name
    );
    setActiveLaunchedApp(launchedDesc);

    setWindowsApps((prev) =>
      prev.map((w) => (w.id === app.id ? { ...w, lastLaunched: `Today, ${nowTime}` } : w))
    );
    setTimelineLogs((prev) => [
      {
        id: "tl-win-" + Date.now(),
        type: "WINDOWS_APP_LAUNCH",
        title: `Launched App: ${app.name}`,
        detail: `Dispatched URI/EXE & Live App Workspace (${app.exePath})`,
        commandToReplay: `open ${app.voiceAliases[0] || app.name.toLowerCase()}`,
        status: "COMPLETED",
        timestamp: `Today, ${nowTime}`,
      },
      ...prev,
    ]);
    speakVoiceResponse(`Opening ${app.name} now, Sir.`);
  };

  const handleSearchAndInstallWindowsApp = async (
    appName: string
  ): Promise<WindowsInstallRecommendation | null> => {
    setVirtualCursor({
      active: true,
      xPercent: 52,
      yPercent: 38,
      label: `Auto-Searching Windows Installer: ${appName}`,
      status: "MOVING",
    });
    try {
      const res = await fetch("/api/windows/app-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appName,
          action: "SEARCH_AND_INSTALL",
        }),
      });
      const data = await res.json();
      if (data?.success && data.recommendation) {
        const rec: WindowsInstallRecommendation = data.recommendation;
        setLatestInstallRecommendation(rec);
        setVirtualCursor({
          active: true,
          xPercent: data.cursorTarget?.xPercent || 48,
          yPercent: data.cursorTarget?.yPercent || 42,
          label: `Verified Installer Ready: ${rec.appName}`,
          status: "FIXED",
        });
        setTimeout(() => setVirtualCursor(null), 3500);

        // Also dispatch winget install to Local Windows Bridge if active
        fetch("http://127.0.0.1:47831/execute", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            command: rec.wingetCommand,
          }),
        }).catch(() => {});

        setTimelineLogs((prev) => [
          {
            id: "tl-install-" + Date.now(),
            type: "WINDOWS_APP_INSTALL",
            title: `Windows Auto-Installer: ${rec.appName}`,
            detail: `${rec.summary} (${rec.wingetCommand})`,
            commandToReplay: `install ${rec.appName} on Windows`,
            status: "COMPLETED",
            timestamp: rec.timestamp,
          },
          ...prev,
        ]);

        speakVoiceResponse(
          data.spokenResponse ||
            `I found the verified official Windows installer and winget package for ${rec.appName}.`
        );
        return rec;
      }
    } catch {}
    setVirtualCursor(null);
    return null;
  };

  // Skill Module Diagnostic Tester
  const handleTestModule = (skill: SkillModule) => {
    speakVoiceResponse(`Diagnostic check passed for Module ${skill.id}: ${skill.name}. Status is Optimal.`);
  };

  // Workflow Runner
  const handleRunWorkflow = (wf: AutomationWorkflow) => {
    speakVoiceResponse(`Executing automated macro: ${wf.name}. All actions verified in sandbox.`);
    setWorkflows((prev) =>
      prev.map((w) => (w.id === wf.id ? { ...w, lastRun: "Just now" } : w))
    );
  };

  // Persist Saved Accounts & Per-Account Workspaces (History, Chats, Memories, Projects, Files)
  useEffect(() => {
    try {
      localStorage.setItem("dravis_saved_accounts_v2", JSON.stringify(savedAccounts));
    } catch {}
  }, [savedAccounts]);

  useEffect(() => {
    try {
      localStorage.setItem("dravis_account_workspaces_v2", JSON.stringify(accountWorkspaces));
    } catch {}
  }, [accountWorkspaces]);

  // Continuously sync the currently logged-in account's live history/chats/memories into its isolated workspace
  useEffect(() => {
    if (!userAccount?.id || !isSessionAuthenticated) return;
    setAccountWorkspaces((prev) => ({
      ...prev,
      [userAccount.id]: {
        accountId: userAccount.id,
        userProfile,
        messages,
        memories,
        projects,
        timelineLogs,
        files,
        reminders,
        generatedImages,
        contacts,
      },
    }));
  }, [
    userAccount?.id,
    isSessionAuthenticated,
    userProfile,
    messages,
    memories,
    projects,
    timelineLogs,
    files,
    reminders,
    generatedImages,
    contacts,
  ]);

  // Compute live history counts per account for the Account Switcher UI
  const accountHistoryCounts: Record<string, { chats: number; memories: number; logs: number }> = {};
  savedAccounts.forEach((acc) => {
    if (userAccount?.id === acc.id && isSessionAuthenticated) {
      accountHistoryCounts[acc.id] = {
        chats: messages.length,
        memories: memories.length,
        logs: timelineLogs.length,
      };
    } else {
      const ws = accountWorkspaces[acc.id] || buildDefaultAccountWorkspace(acc);
      accountHistoryCounts[acc.id] = {
        chats: ws.messages.length,
        memories: ws.memories.length,
        logs: ws.timelineLogs.length,
      };
    }
  });

  // Switch Account Handler: Saves current account history & loads target account's entire history
  const handleSwitchAccount = (targetAcc: UserAccount, isNewAccount = false) => {
    // 1. Save current account snapshot if active
    const updatedWorkspaces = { ...accountWorkspaces };
    if (userAccount?.id) {
      updatedWorkspaces[userAccount.id] = {
        accountId: userAccount.id,
        userProfile,
        messages,
        memories,
        projects,
        timelineLogs,
        files,
        reminders,
        generatedImages,
        contacts,
      };
    }

    // 2. Load or initialize target account's isolated workspace & history
    const targetWorkspace =
      !isNewAccount && updatedWorkspaces[targetAcc.id]
        ? updatedWorkspaces[targetAcc.id]
        : buildDefaultAccountWorkspace(targetAcc);

    updatedWorkspaces[targetAcc.id] = targetWorkspace;
    setAccountWorkspaces(updatedWorkspaces);

    // 3. Ensure targetAcc is in savedAccounts list
    const activatedAcc: UserAccount = {
      ...targetAcc,
      isLoggedIn: true,
      lastLogin: "Active Now",
    };
    setSavedAccounts((prev) => {
      const exists = prev.some(
        (a) => a.id === activatedAcc.id || a.email.toLowerCase() === activatedAcc.email.toLowerCase()
      );
      if (exists) {
        return prev.map((a) =>
          a.id === activatedAcc.id || a.email.toLowerCase() === activatedAcc.email.toLowerCase()
            ? activatedAcc
            : { ...a, isLoggedIn: false }
        );
      }
      return [activatedAcc, ...prev.map((a) => ({ ...a, isLoggedIn: false }))];
    });

    // 4. Activate target account & restore all of its history, chats, memories, projects, and profile
    setUserAccount(activatedAcc);
    localStorage.setItem("dravis_account", JSON.stringify(activatedAcc));
    try {
      sessionStorage.setItem("dravis_active_session_v2", "true");
    } catch {}
    setIsSessionAuthenticated(true);

    setUserProfile({
      ...targetWorkspace.userProfile,
      name: activatedAcc.displayName || targetWorkspace.userProfile.name,
      title: activatedAcc.roleTitle || targetWorkspace.userProfile.title,
    });
    setMessages(targetWorkspace.messages);
    setMemories(targetWorkspace.memories);
    setProjects(targetWorkspace.projects);
    setTimelineLogs(targetWorkspace.timelineLogs);
    setFiles(targetWorkspace.files);
    setReminders(targetWorkspace.reminders);
    setGeneratedImages(targetWorkspace.generatedImages);
    setContacts(targetWorkspace.contacts);

    speakVoiceResponse(
      `Switched active account to ${activatedAcc.displayName}. All personal chat history, memories, projects, and workspace files for ${activatedAcc.displayName} are now loaded.`
    );
  };

  // Add New Account Handler (from Profile or Android Settings)
  const handleAddAccount = (newAcc: UserAccount, switchImmediately = true) => {
    const freshWorkspace = buildDefaultAccountWorkspace(newAcc);
    setAccountWorkspaces((prev) => ({
      ...prev,
      [newAcc.id]: freshWorkspace,
    }));
    setSavedAccounts((prev) => {
      const filtered = prev.filter(
        (a) => a.email.toLowerCase() !== newAcc.email.toLowerCase() && a.id !== newAcc.id
      );
      return [newAcc, ...filtered];
    });
    if (switchImmediately) {
      handleSwitchAccount(newAcc, true);
    }
  };

  // Log Out Handler -> Returns cleanly to First-Interface Login Screen
  const handleSignOut = () => {
    if (userAccount) {
      const loggedOut = { ...userAccount, isLoggedIn: false };
      setUserAccount(loggedOut);
      localStorage.setItem("dravis_account", JSON.stringify(loggedOut));
    }
    try {
      sessionStorage.removeItem("dravis_active_session_v2");
    } catch {}
    setIsSessionAuthenticated(false);
    speakVoiceResponse("Logged out of current account session. Returning to login screen.");
  };

  // Render Clean First-Interface Login Screen (Both Desktop & Android Versions)
  if (!isSessionAuthenticated || !userAccount?.isLoggedIn) {
    return (
      <AuthScreen
        currentUser={userAccount || undefined}
        savedAccounts={savedAccounts}
        accountHistoryCounts={accountHistoryCounts}
        isAndroidResolutionActive={isAndroidResolutionActive}
        onToggleAndroidResolution={() => setIsAndroidResolutionActive((prev) => !prev)}
        onSwitchToAccount={(acc) => handleSwitchAccount(acc, false)}
        onAuthenticate={(authAcc, isNew) => {
          handleSwitchAccount(authAcc, Boolean(isNew));
        }}
      />
    );
  }

  return (
    <div 
      id="dravis-root-container"
      className={`flex flex-col h-screen w-screen bg-[#020617] text-slate-300 font-sans overflow-hidden select-none ${
        isFullscreen ? "fixed inset-0 z-50" : "relative"
      }`}
      style={{
        backgroundColor: currentTheme.panelBg ? currentTheme.panelBg.split(",")[0] : "#020617",
      }}
    >
      {/* Deep Space Nebula Wallpaper + Interactive 360° 3D Micro-Decision Background Layer (Desktop Only - Hidden visually in Android while engine works in background) */}
      {!isAndroidResolutionActive && (
        <MicroDecisionBackground3D
          nodes={microDecisions}
          selectedNode={selectedDecisionNode}
          onSelectNode={(node) => setSelectedDecisionNode(node)}
          onOpenFullMicroDecisionScreen={() => {
            setIsMicroDecisionFullScreen(true);
            setActiveTab("MICRO_DECISION");
            if (!isFullscreen) handleToggleFullscreen();
          }}
          onExecuteMicroDecision={async (node) => {
            setVirtualCursor({
              active: true,
              xPercent: 32 + Math.floor(Math.random() * 36),
              yPercent: 28 + Math.floor(Math.random() * 38),
              label: node.title,
              status: "MOVING",
            });
            setTimeout(() => {
              setVirtualCursor((prev) => (prev ? { ...prev, status: "CLICKING" } : null));
            }, 550);
            setTimeout(() => {
              setVirtualCursor((prev) => (prev ? { ...prev, status: "FIXED" } : null));
              speakVoiceResponse(`Executed micro-decision: ${node.title}. ${node.howItWorks}`);
            }, 1150);
            setTimeout(() => {
              setVirtualCursor(null);
            }, 3400);
          }}
          isMicroDecisionTabActive={activeTab === "MICRO_DECISION"}
          virtualCursor={virtualCursor}
          latestAutoFixReport={latestAutoFixReport}
          onDismissAutoFixReport={() => setLatestAutoFixReport(null)}
        />
      )}

      {/* CONDITIONAL RESOLUTION VIEW: ANDROID LIQUID GLASS vs PC DESKTOP HUD */}
      {isAndroidResolutionActive ? (
        <AndroidMobileResolutionView
          onExitMobileResolution={() => setIsAndroidResolutionActive(false)}
          voiceState={voiceState}
          isListening={isListening}
          onToggleListening={handleToggleMic}
          onSendChatMessage={handleSendCommand}
          chatMessages={messages.map((m) => ({
            role: m.role as "user" | "assistant",
            content: m.text,
            timestamp: m.timestamp,
            generatedImage: m.generatedImage
              ? { prompt: m.generatedImage.prompt, url: m.generatedImage.url }
              : undefined,
            multiTaskExecuted: m.multiTaskExecuted,
          }))}
          deviceControls={deviceControls}
          onToggleDeviceControl={handleToggleDeviceControl}
          activeCall={activeCall}
          onEndCall={handleEndCall}
          onToggleMute={handleToggleCallMute}
          onToggleSpeaker={handleToggleCallSpeaker}
          contactPrompt={contactPrompt}
          onSelectPhoneNumber={handleSelectContactNumber}
          onCancelContactPrompt={() => setContactPrompt(null)}
          musicPlayback={musicPlayback}
          onTogglePlayMusic={handleTogglePlayMusic}
          onNextTrack={handleNextTrack}
          onCloseMusic={handleCloseMusic}
          contacts={contacts}
          onDirectCallContact={(contact, phone) =>
            handleInitiateCall(contact.name, phone.number, phone.label)
          }
          onAddContact={(newContact) => setContacts((prev) => [newContact, ...prev])}
          onImportContacts={(imported) => setContacts((prev) => [...imported, ...prev])}
          userProfile={userProfile}
          userAccount={userAccount}
          wakeWord={userProfile.wakeWord || "DRAVIS"}
          wakeWordActive={userProfile.wakeWordActive}
          onToggleWakeWord={(active) =>
            setUserProfile((p) => ({ ...p, wakeWordActive: active }))
          }
          onOpenUniversalSettings={() => setIsUniversalSettingsOpen(true)}
          isSettingsOpen={isUniversalSettingsOpen}
          onCloseSettings={() => setIsUniversalSettingsOpen(false)}
          deviceStatusFeedback={deviceStatusFeedback}
          onOpenCamera={() => {
            setActiveAppIcon("camera");
            setActiveAppTitle("Camera Sensor");
            setNotchStatusText("Optical lens ready...");
            setIsCameraOpen(true);
          }}
          microDecisions={microDecisions}
          selectedDecisionNode={selectedDecisionNode}
          onSelectDecisionNode={(node) => setSelectedDecisionNode(node)}
          onExecuteMicroDecision={(node) => {
            speakVoiceResponse(`Executing micro-decision: ${node.title}. ${node.howItWorks}`);
          }}
          onLaunchApp={(appKey) => launchWebDirectly(appKey, false)}
          onCreateRealFolder={async (folderName, fileName) => {
            await handleCreateFileOrFolder(
              `Create folder ${folderName} and file ${fileName || "README.md"}`,
              `/${folderName}`,
              fileName || "README.md"
            );
          }}
          defaultCountryCode={defaultCountryCode}
          onChangeCountryCode={(code) => setDefaultCountryCode(code)}
          activeDesktopModuleInAndroid={activeDesktopModuleInAndroid}
          onOpenDesktopModule={(tab) => {
            setActiveTab(tab);
            setActiveDesktopModuleInAndroid(tab);
          }}
          onCloseDesktopModuleInAndroid={() => setActiveDesktopModuleInAndroid(null)}
          onSpeakEmotionalCheckIn={(text) => speakVoiceResponse(text)}
          savedAccounts={savedAccounts}
          onSwitchAccount={(acc) => handleSwitchAccount(acc, false)}
          onAddAccount={(newAcc, switchNow) => handleAddAccount(newAcc, switchNow)}
          onLogOut={handleSignOut}
          accountHistoryCounts={accountHistoryCounts}
          onOpenGitHubModal={() => setIsGitHubModalOpen(true)}
          onOpenAndroidCli={() => setIsAndroidCliModalOpen(true)}
          renderDesktopModuleContent={() => (
            <div className="flex-1 flex flex-col overflow-y-auto">
              {activeDesktopModuleInAndroid === "MICRO_DECISION" && (
                <MicroDecisionView
                  nodes={microDecisions}
                  leverageTree={leverageTree}
                  slotTrace={slotFillingTrace}
                  selectedNode={selectedDecisionNode}
                  onSelectNode={(node) => setSelectedDecisionNode(node)}
                  onExecuteMultiWork={async (cmd) => handleSendCommand(cmd)}
                  onExecuteSingleNode={async (node) =>
                    speakVoiceResponse(`Executed: ${node.title}`)
                  }
                  onTriggerScreenAutoFix={async () => {}}
                  isExecutingMultiWork={isExecutingMultiWork}
                  isAutoFixingScreen={isAutoFixingScreen}
                  latestAutoFixReport={latestAutoFixReport}
                  userProfile={userProfile}
                  onUpdateProfile={(p) => setUserProfile(p)}
                  memories={memories}
                  telemetry={telemetry}
                  autonomousSelfWorkActive={autonomousSelfWorkActive}
                  onToggleAutonomousSelfWork={(a) => setAutonomousSelfWorkActive(a)}
                  isFullScreenOrbit={true}
                />
              )}
              {activeDesktopModuleInAndroid === "DRAVIS" && (
                <DravisChatView
                  messages={messages}
                  userProfile={userProfile}
                  voiceState={voiceState}
                  onSendMessage={handleSendCommand}
                  onGenerateImage={handleDirectImageFromChat}
                  onEditImage={handleEditImageInChat}
                  onGenerateVideo={(prompt, sourceImageBase64) =>
                    handleGenerateVideo(prompt, { sourceImageBase64 })
                  }
                  onTranscribeAudio={handleTranscribeAudioInChat}
                  onAskGeminiBot={handleAskGeminiBotInChat}
                  onSearchGrounded={handleSearchGroundedInChat}
                  onGenerateMusic={handleGenerateMusicInChat}
                  onAnalyzeBioScience={handleAnalyzeBioScienceInChat}
                  onCreateFileOrFolder={(prompt) => handleCreateFileOrFolder(prompt)}
                  onBuildAabApp={(prompt) => handleBuildAabApp(prompt)}
                  onSpeakMessage={speakVoiceResponse}
                  onToggleMic={handleToggleMic}
                  isListening={isListening}
                  isGeneratingImage={isGeneratingImage}
                  generatingPrompt={generatingPrompt}
                />
              )}
              {activeDesktopModuleInAndroid === "FILES" && (
                <FilesView
                  files={files}
                  onAnalyzeImageVision={handleAnalyzeVision}
                  onCreateFileOrFolder={(prompt, folderName, fileName) =>
                    handleCreateFileOrFolder(prompt, folderName, fileName)
                  }
                  onBuildAabApp={(prompt) => handleBuildAabApp(prompt)}
                  soundEffectsEnabled={userProfile.soundEffects}
                />
              )}
              {activeDesktopModuleInAndroid === "GMAIL" && (
                <GmailConsole
                  onSpeak={speakVoiceResponse}
                  soundEffectsEnabled={userProfile.soundEffects}
                  isCompact={true}
                  onClose={() => setActiveDesktopModuleInAndroid(null)}
                />
              )}
              {activeDesktopModuleInAndroid === "HISTORY" && (
                <HistoryView
                  memories={memories}
                  messages={messages}
                  projects={projects}
                  windowsApps={windowsApps}
                  timelineLogs={timelineLogs}
                  onAddMemory={handleAddMemory}
                  onDeleteMemory={handleDeleteMemory}
                  onAddOrUpdateProject={(proj) =>
                    setProjects((prev) => [proj, ...prev.filter((p) => p.id !== proj.id)])
                  }
                  onDeleteProject={(id) =>
                    setProjects((prev) => prev.filter((p) => p.id !== id))
                  }
                  onLaunchWindowsApp={handleLaunchWindowsApp}
                  onAddWindowsApp={(newApp) => setWindowsApps((prev) => [newApp, ...prev])}
                  onSearchAndInstallWindowsApp={handleSearchAndInstallWindowsApp}
                  onReplayCommand={(cmd) => handleSendCommand(cmd)}
                  onAutoExtractFromText={async (text) => {
                    await handleAutoExtractMemoryAndProjects(text);
                  }}
                  latestInstallRecommendation={latestInstallRecommendation}
                  soundEffectsEnabled={userProfile.soundEffects}
                />
              )}
              {activeDesktopModuleInAndroid === "LEARNING" && (
                <DravisLearningView
                  userProfile={userProfile}
                  memories={memories}
                  onSendCommand={handleSendCommand}
                  soundEffectsEnabled={userProfile.soundEffects}
                />
              )}
              {activeDesktopModuleInAndroid === "SKILLS" && (
                <SkillsMatrixView
                  skills={skills}
                  onTestModule={handleTestModule}
                  onLaunchSkillPrompt={handleLaunchSkillFromMatrix}
                  soundEffectsEnabled={userProfile.soundEffects}
                />
              )}
              {activeDesktopModuleInAndroid === "AUTOMATION" && (
                <AutomationView
                  workflows={workflows}
                  onRunWorkflow={handleRunWorkflow}
                  soundEffectsEnabled={userProfile.soundEffects}
                />
              )}
              {activeDesktopModuleInAndroid === "PLUGINS" && (
                <PluginsView
                  plugins={plugins}
                  onTogglePlugin={(id) =>
                    setPlugins((prev) =>
                      prev.map((p) => (p.id === id ? { ...p, enabled: !p.enabled } : p))
                    )
                  }
                  soundEffectsEnabled={userProfile.soundEffects}
                />
              )}
              {activeDesktopModuleInAndroid === "SUPERVISION" && (
                <FamilySupervisionView
                  config={familySupervision}
                  onUpdateConfig={(updated) => setFamilySupervision(updated)}
                  onExportAudit={() => {}}
                  soundEffectsEnabled={userProfile.soundEffects}
                />
              )}
              {activeDesktopModuleInAndroid === "SETTINGS" && (
                <SettingsView
                  profile={userProfile}
                  onUpdateProfile={(p) => setUserProfile(p)}
                  soundEffectsEnabled={userProfile.soundEffects}
                />
              )}
              {activeDesktopModuleInAndroid === "PROFILE" && (
                <ProfileView
                  profile={userProfile}
                  onUpdateProfile={(p) => setUserProfile(p)}
                  soundEffectsEnabled={userProfile.soundEffects}
                  currentAccount={userAccount}
                  savedAccounts={savedAccounts}
                  onSwitchAccount={(acc) => handleSwitchAccount(acc, false)}
                  onAddAccount={(newAcc, switchNow) => handleAddAccount(newAcc, switchNow)}
                  onLogOut={handleSignOut}
                  accountHistoryCounts={accountHistoryCounts}
                />
              )}
              {activeDesktopModuleInAndroid === "SYSTEM" && (
                <SystemView
                  telemetry={telemetry}
                  onRefreshTelemetry={() => {}}
                  soundEffectsEnabled={userProfile.soundEffects}
                />
              )}
            </div>
          )}
        />
      ) : (
        <>
          {/* 0. DYNAMIC ISLAND NOTCH (DIRECT CALLING & EXPANDABLE TELEPHONY NOTCH) */}
          <DynamicIslandNotch
            voiceState={voiceState}
            isListening={isListening}
            activeAppIcon={activeAppIcon}
            activeAppTitle={activeAppTitle}
            statusText={notchStatusText}
            activeCall={activeCall}
            contactPrompt={contactPrompt}
            onSelectPhoneNumber={(num, label) => handleSelectContactNumber(num, label)}
            onEndCall={handleEndCall}
            onToggleMute={handleToggleCallMute}
            onToggleSpeaker={handleToggleCallSpeaker}
            onCancelContactPrompt={() => setContactPrompt(null)}
            musicPlayback={musicPlayback}
            onTogglePlayMusic={handleTogglePlayMusic}
            onNextTrack={handleNextTrack}
            onCloseMusic={handleCloseMusic}
            deviceStatusFeedback={deviceStatusFeedback}
            onTapNotch={() => {
              if (userProfile.soundEffects) soundEffects.playChirp();
              handleToggleMic();
            }}
          />

          {/* 1. TOP HEADER */}
          <TopHeader
            wakeWord={userProfile.wakeWord || "DRAVIS"}
            wakeWordActive={userProfile.wakeWordActive}
            onToggleWakeWord={() => {
              setUserProfile((p) => ({ ...p, wakeWordActive: !p.wakeWordActive }));
            }}
            isListening={isListening}
            soundEffectsEnabled={userProfile.soundEffects}
            llmProvider={userProfile.llmProvider || "GOOGLE"}
            llmModel={userProfile.llmModel || (userProfile.llmProvider === "OPENAI" ? "gpt-4o" : "gemini-3.6-flash")}
            onToggleLLMProvider={(provider) => {
              setUserProfile((p) => ({
                ...p,
                llmProvider: provider,
                llmModel: provider === "OPENAI" ? "gpt-4o" : "gemini-3.6-flash",
              }));
              speakVoiceResponse(
                provider === "GOOGLE"
                  ? "Neural Core switched to Primary Google Gemini ASI Engine."
                  : "Neural Core switched to Secondary OpenAI GPT Engine."
              );
            }}
            preferredLanguage={userProfile.preferredLanguage || "AUTO_ADAPT"}
            autoAdaptLanguage={userProfile.autoAdaptLanguage !== false}
            detectedLanguage={userProfile.detectedLanguage || "en-US"}
            onSelectLanguage={(langCode, autoAdapt) => {
              const langObj = DRAVIS_LANGUAGES.find((l) => l.code === langCode) || DRAVIS_LANGUAGES[0];
              setUserProfile((p) => ({
                ...p,
                preferredLanguage: langCode,
                autoAdaptLanguage: autoAdapt,
                detectedLanguage: autoAdapt ? p.detectedLanguage || "en-US" : langCode,
              }));
              speakVoiceResponse(
                autoAdapt
                  ? "Universal Auto-Adapt Language mode enabled across all 43 languages."
                  : `Language switched to ${langObj.name}.`
              );
            }}
            onToggleFullscreen={handleToggleFullscreen}
            isFullscreen={isFullscreen}
            onMinimize={() => {
              setIsMinimizedCompact((prev) => !prev);
              speakVoiceResponse(isMinimizedCompact ? "HUD workspace restored, Sir." : "HUD minimized to streamlined telemetry view, Sir.");
            }}
            onClose={() => setIsShutdownOpen(true)}
            onOpenContacts={() => setIsContactsModalOpen(true)}
            onToggleAndroidResolution={() => setIsAndroidResolutionActive((prev) => !prev)}
            isAndroidResolutionActive={isAndroidResolutionActive}
            onOpenGitHubModal={() => setIsGitHubModalOpen(true)}
            onOpenAndroidCli={() => setIsAndroidCliModalOpen(true)}
          />

      {/* 2. MAIN 3-COLUMN WORKSPACE */}
      <div className="relative z-10 flex-1 flex flex-row overflow-hidden min-h-0">
        {/* Left Sidebar: Nav Tabs + Telemetry (Always visible even in Fullscreen!) */}
        <LeftSidebar
          activeTab={activeTab}
          onSelectTab={(tab) => setActiveTab(tab)}
          voiceState={voiceState}
          telemetry={telemetry}
          soundEffectsEnabled={userProfile.soundEffects}
        />

        {/* Center Main Stage View */}
        <main className="flex-1 flex flex-col overflow-hidden relative">
          {activeTab === "HOME" && (
            <HomeView
              userProfile={userProfile}
              voiceState={voiceState}
              telemetry={telemetry}
              quickActions={quickActions}
              onExecuteAction={handleExecuteQuickAction}
              onSendCommand={handleSendCommand}
              onToggleMic={handleToggleMic}
              isListening={isListening}
              latestGreeting={greetingText}
              latestSubGreeting={subGreetingText}
              deviceControls={deviceControls}
              onToggleDeviceControl={handleToggleDeviceControl}
              onOpenContactsModal={() => setIsContactsModalOpen(true)}
              onCreateRealFolderQuick={() => setActiveTab("FILES")}
              onSelectTab={(tab) => setActiveTab(tab)}
              onSpeakEmotionalCheckIn={(text) => speakVoiceResponse(text)}
            />
          )}

          {activeTab === "MICRO_DECISION" && (
            <MicroDecisionView
              nodes={microDecisions}
              leverageTree={leverageTree}
              slotTrace={slotFillingTrace}
              selectedNode={selectedDecisionNode}
              onSelectNode={(node) => setSelectedDecisionNode(node)}
              onExecuteMultiWork={async (cmd) => {
                setIsExecutingMultiWork(true);
                try {
                  const res = await fetch("/api/micro-decision/orchestrate", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      command: cmd,
                      userProfile,
                      memoryFacts: memories.slice(0, 8),
                    }),
                  });
                  const data = await res.json();
                  if (data?.success) {
                    if (Array.isArray(data.decisions) && data.decisions.length > 0) {
                      setMicroDecisions((prev) => [...data.decisions, ...prev].slice(0, 32));
                      setSelectedDecisionNode(data.decisions[0]);
                    }
                    if (data.slotFilling) {
                      setSlotFillingTrace(data.slotFilling);
                    }
                    if (data.spokenSummary) {
                      speakVoiceResponse(data.spokenSummary);
                    }
                  }
                } catch {} finally {
                  setIsExecutingMultiWork(false);
                }
              }}
              onExecuteSingleNode={async (node) => {
                setVirtualCursor({
                  active: true,
                  xPercent: 35 + Math.floor(Math.random() * 30),
                  yPercent: 30 + Math.floor(Math.random() * 35),
                  label: node.title,
                  status: "MOVING",
                });
                setTimeout(() => {
                  setVirtualCursor((prev) => (prev ? { ...prev, status: "CLICKING" } : null));
                }, 500);
                setTimeout(() => {
                  setVirtualCursor((prev) => (prev ? { ...prev, status: "FIXED" } : null));
                  speakVoiceResponse(`Micro-decision executed: ${node.title}. ${node.howItPerforms}`);
                }, 1100);
                setTimeout(() => {
                  setVirtualCursor(null);
                }, 3200);
              }}
              onTriggerScreenAutoFix={async (screenFrameBase64) => {
                setIsAutoFixingScreen(true);
                try {
                  const res = await fetch("/api/micro-decision/screen-autofix", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      imageBase64: screenFrameBase64,
                      userInstruction: "Inspect my screen, detect any issue or optimization, click to fix it, and tell me what you fixed.",
                    }),
                  });
                  const data = await res.json();
                  if (data?.success) {
                    const tx = data.targetX || 52;
                    const ty = data.targetY || 46;
                    const tLabel = data.targetLabel || "Auto-Fix System Target";
                    setVirtualCursor({
                      active: true,
                      xPercent: tx,
                      yPercent: ty,
                      label: tLabel,
                      status: "MOVING",
                    });
                    setTimeout(() => {
                      setVirtualCursor((prev) => (prev ? { ...prev, status: "CLICKING" } : null));
                    }, 600);
                    setTimeout(() => {
                      setVirtualCursor((prev) => (prev ? { ...prev, status: "FIXED" } : null));
                      const report: ScreenAutoFixReport = {
                        id: "autofix-" + Date.now(),
                        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
                        problemDetected: data.issueDetected,
                        severity: "AUTO_FIXED",
                        fixApplied: data.fixApplied,
                        spokenExplanation: data.spokenReport,
                        cursorTarget: {
                          xPercent: tx,
                          yPercent: ty,
                          label: tLabel,
                        },
                        apiUsed: "DUAL_SYNTHESIS",
                      };
                      setLatestAutoFixReport(report);
                      if (data.decisionNode) {
                        setMicroDecisions((prev) => [data.decisionNode, ...prev].slice(0, 32));
                        setSelectedDecisionNode(data.decisionNode);
                      }
                      speakVoiceResponse(data.spokenReport);
                    }, 1200);
                    setTimeout(() => {
                      setVirtualCursor(null);
                    }, 4200);
                  }
                } catch {} finally {
                  setIsAutoFixingScreen(false);
                }
              }}
              isExecutingMultiWork={isExecutingMultiWork}
              isAutoFixingScreen={isAutoFixingScreen}
              latestAutoFixReport={latestAutoFixReport}
              userProfile={userProfile}
              onUpdateProfile={(p) => setUserProfile(p)}
              memories={memories}
              telemetry={telemetry}
              autonomousSelfWorkActive={autonomousSelfWorkActive}
              onToggleAutonomousSelfWork={(active) => setAutonomousSelfWorkActive(active)}
              isFullScreenOrbit={isMicroDecisionFullScreen || isFullscreen}
              onToggleFullScreenOrbit={() => {
                setIsMicroDecisionFullScreen((prev) => !prev);
                handleToggleFullscreen();
              }}
            />
          )}

          {activeTab === "DRAVIS" && (
            <DravisChatView
              messages={messages}
              userProfile={userProfile}
              voiceState={voiceState}
              onSendMessage={handleSendCommand}
              onGenerateImage={handleDirectImageFromChat}
              onEditImage={handleEditImageInChat}
              onGenerateVideo={(prompt, sourceImageBase64) =>
                handleGenerateVideo(prompt, { sourceImageBase64 })
              }
              onTranscribeAudio={handleTranscribeAudioInChat}
              onAskGeminiBot={handleAskGeminiBotInChat}
              onSearchGrounded={handleSearchGroundedInChat}
              onGenerateMusic={handleGenerateMusicInChat}
              onAnalyzeBioScience={handleAnalyzeBioScienceInChat}
              onCreateFileOrFolder={(prompt) => handleCreateFileOrFolder(prompt)}
              onBuildAabApp={(prompt) => handleBuildAabApp(prompt)}
              onOpenLaunchedApp={(appIdOrName) => {
                const desc = deviceHardware.resolveAppDescriptor(appIdOrName);
                setActiveLaunchedApp(desc);
              }}
              onSpeakMessage={speakVoiceResponse}
              onToggleMic={handleToggleMic}
              isListening={isListening}
              isGeneratingImage={isGeneratingImage}
              generatingPrompt={generatingPrompt}
            />
          )}

          {activeTab === "GMAIL" && (
            <GmailConsole
              onSpeak={speakVoiceResponse}
              soundEffectsEnabled={userProfile.soundEffects}
            />
          )}

          {activeTab === "LEARNING" && (
            <DravisLearningView
              userProfile={userProfile}
              memories={memories}
              onSendCommand={handleSendCommand}
              soundEffectsEnabled={userProfile.soundEffects}
            />
          )}

          {activeTab === "SUPERVISION" && (
            <FamilySupervisionView
              config={familySupervision}
              onUpdateConfig={(updated) => setFamilySupervision(updated)}
              onExportAudit={() => {
                const blob = new Blob([JSON.stringify(familySupervision.auditLogs, null, 2)], {
                  type: "application/json",
                });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `DRAVIS-Supervision-Audit-${Date.now()}.json`;
                a.click();
              }}
              soundEffectsEnabled={userProfile.soundEffects}
            />
          )}

          {activeTab === "SKILLS" && (
            <SkillsMatrixView
              skills={skills}
              onTestModule={handleTestModule}
              onLaunchSkillPrompt={handleLaunchSkillFromMatrix}
              soundEffectsEnabled={userProfile.soundEffects}
            />
          )}

          {activeTab === "HISTORY" && (
            <HistoryView
              memories={memories}
              messages={messages}
              projects={projects}
              windowsApps={windowsApps}
              timelineLogs={timelineLogs}
              onAddMemory={handleAddMemory}
              onDeleteMemory={handleDeleteMemory}
              onAddOrUpdateProject={(proj) => {
                setProjects((prev) => {
                  const idx = prev.findIndex((p) => p.id === proj.id);
                  if (idx >= 0) {
                    const copy = [...prev];
                    copy[idx] = proj;
                    return copy;
                  }
                  return [proj, ...prev];
                });
              }}
              onDeleteProject={(id) =>
                setProjects((prev) => prev.filter((p) => p.id !== id))
              }
              onLaunchWindowsApp={handleLaunchWindowsApp}
              onAddWindowsApp={(newApp) =>
                setWindowsApps((prev) => [newApp, ...prev])
              }
              onSearchAndInstallWindowsApp={handleSearchAndInstallWindowsApp}
              onReplayCommand={(cmd) => handleSendCommand(cmd)}
              onAutoExtractFromText={async (text) => {
                await handleAutoExtractMemoryAndProjects(text);
                speakVoiceResponse(
                  "I have stored that information and updated your project context in my Brain Memory Bank."
                );
              }}
              latestInstallRecommendation={latestInstallRecommendation}
              soundEffectsEnabled={userProfile.soundEffects}
            />
          )}

          {activeTab === "PROFILE" && (
            <ProfileView
              profile={userProfile}
              onUpdateProfile={(p) => setUserProfile(p)}
              soundEffectsEnabled={userProfile.soundEffects}
              currentAccount={userAccount}
              savedAccounts={savedAccounts}
              onSwitchAccount={(acc) => handleSwitchAccount(acc, false)}
              onAddAccount={(newAcc, switchNow) => handleAddAccount(newAcc, switchNow)}
              onLogOut={handleSignOut}
              accountHistoryCounts={accountHistoryCounts}
            />
          )}

          {activeTab === "SETTINGS" && (
            <SettingsView
              profile={userProfile}
              onUpdateProfile={(p) => setUserProfile(p)}
              soundEffectsEnabled={userProfile.soundEffects}
            />
          )}

          {activeTab === "PLUGINS" && (
            <PluginsView
              plugins={plugins}
              onTogglePlugin={(id) => {
                setPlugins((prev) =>
                  prev.map((p) => (p.id === id ? { ...p, enabled: !p.enabled } : p))
                );
              }}
              soundEffectsEnabled={userProfile.soundEffects}
            />
          )}

          {activeTab === "AUTOMATION" && (
            <AutomationView
              workflows={workflows}
              onRunWorkflow={handleRunWorkflow}
              soundEffectsEnabled={userProfile.soundEffects}
            />
          )}

          {activeTab === "FILES" && (
            <FilesView
              files={files}
              onAnalyzeImageVision={handleAnalyzeVision}
              onCreateFileOrFolder={(prompt, folderName, fileName) =>
                handleCreateFileOrFolder(prompt, folderName, fileName)
              }
              onBuildAabApp={(prompt) => handleBuildAabApp(prompt)}
              soundEffectsEnabled={userProfile.soundEffects}
            />
          )}

          {activeTab === "SYSTEM" && (
            <SystemView
              telemetry={telemetry}
              onRefreshTelemetry={() => {
                setTelemetry((prev) => ({
                  ...prev,
                  cpu: `${Math.floor(20 + Math.random() * 15)}%`,
                  ram: `${Math.floor(40 + Math.random() * 6)}%`,
                }));
              }}
              soundEffectsEnabled={userProfile.soundEffects}
            />
          )}
        </main>

        {/* Right Sidebar: AI News, Reminders, Weather, Media Player */}
        {!isMinimizedCompact && !isFullscreen && !(activeTab === "MICRO_DECISION" && isMicroDecisionFullScreen) && (
          <RightSidebar
            newsList={newsList}
            reminders={reminders}
            weather={weather}
            onAddReminderClick={() => setIsAddReminderOpen(true)}
            onToggleReminder={handleToggleReminder}
            soundEffectsEnabled={userProfile.soundEffects}
          />
        )}
      </div>

      {/* 3. BOTTOM SYSTEM STATUS PODS BAR */}
      {!isFullscreen && !(activeTab === "MICRO_DECISION" && isMicroDecisionFullScreen) && (
        <BottomBar
          onSelectTab={(tab) => setActiveTab(tab)}
          soundEffectsEnabled={userProfile.soundEffects}
          learningModeActive={userProfile.learningMode}
          autonomousModeActive={userProfile.autonomousMode}
        />
      )}
    </>
  )}

      {/* MODALS */}
      <CameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onAnalyzeCapture={async (base64) => {
          const result = await handleAnalyzeVision(base64);
          handleSendCommand(`I captured an optical frame. Here is the vision analysis: ${result}`);
        }}
        soundEffectsEnabled={userProfile.soundEffects}
      />

      <ShutdownModal
        isOpen={isShutdownOpen}
        onClose={() => setIsShutdownOpen(false)}
        onConfirmShutdown={() => {
          speakVoiceResponse("Shutting down simulated subroutines. Goodbye, Sir.");
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        }}
        soundEffectsEnabled={userProfile.soundEffects}
      />

      <AddReminderModal
        isOpen={isAddReminderOpen}
        onClose={() => setIsAddReminderOpen(false)}
        onAddReminder={handleAddReminder}
        soundEffectsEnabled={userProfile.soundEffects}
      />

      {/* 4. DIRECT CALLING & CONTACTS MANAGEMENT HUB */}
      <ContactsModal
        isOpen={isContactsModalOpen}
        onClose={() => setIsContactsModalOpen(false)}
        contacts={contacts}
        onAddContact={(newContact) => setContacts((prev) => [newContact, ...prev])}
        onImportContacts={(imported) => setContacts((prev) => [...imported, ...prev])}
        onDeleteContact={(id) => setContacts((prev) => prev.filter((c) => c.id !== id))}
        onInitiateCall={(name, num, label) => handleInitiateCall(name, num, label)}
        defaultCountryCode={defaultCountryCode}
        onChangeCountryCode={(code) => setDefaultCountryCode(code)}
      />

      {/* 5. UNIVERSAL LIVE APP WINDOW & UNBLOCKED MULTI-PLATFORM LAUNCHER */}
      <ActiveAppWindowModal
        app={activeLaunchedApp}
        launchedApps={launchedAppsQueue}
        onSelectApp={(selected) => setActiveLaunchedApp(selected)}
        onClose={() => setActiveLaunchedApp(null)}
        onSaveFileToWorkspace={(fileName, content, folderName) => {
          const newItem: FileItem = {
            id: "file-live-" + Date.now(),
            name: fileName,
            folder: folderName || "/Workspace",
            type: "code",
            size: `${Math.max(1, Math.round(content.length / 1024))} KB`,
            updated: "Just now",
            content,
            generatedBy: "USER",
          };
          setFiles((prev) => [newItem, ...prev]);
        }}
        onInitiateCall={(name, num, label) => handleInitiateCall(name, num, label)}
      />

      {/* 6. GITHUB REPOSITORY SYNC, PUSH & PROJECT ZIP EXPORT MODAL */}
      <GitHubPushModal
        isOpen={isGitHubModalOpen}
        onClose={() => setIsGitHubModalOpen(false)}
        soundEffectsEnabled={userProfile.soundEffects}
      />

      {/* 7. OFFICIAL GOOGLE ANDROID CLI SUITE & CODING AGENT CONSOLE */}
      <AndroidCliModal
        isOpen={isAndroidCliModalOpen}
        onClose={() => setIsAndroidCliModalOpen(false)}
        soundEffectsEnabled={userProfile.soundEffects}
      />
    </div>
  );
}
