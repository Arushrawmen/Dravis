/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Dravis Human ASI - Full 40 Module Architecture Type Definitions
 */

export type NavigationTab = 
  | "HOME"
  | "DRAVIS"
  | "MICRO_DECISION"
  | "CHAT"
  | "GMAIL"
  | "DRIVE"
  | "LEARNING"
  | "HISTORY"
  | "PROFILE"
  | "SETTINGS"
  | "SUPERVISION"
  | "PLUGINS"
  | "SKILLS"
  | "AUTOMATION"
  | "FILES"
  | "SYSTEM";

export type VoiceState = "ONLINE" | "IDLE" | "LISTENING" | "THINKING" | "SPEAKING";
export type ResponseMode = "QUICK" | "NORMAL" | "DEEP" | "RESEARCH";

export interface UserAccount {
  id: string;
  email: string;
  displayName: string;
  roleTitle?: string;
  provider: "GOOGLE" | "EMAIL" | "GUEST";
  avatarUrl?: string;
  createdAt: string;
  lastLogin: string;
  isLoggedIn: boolean;
  sessions: SessionInfo[];
  supervisedBy?: string;
  isSupervised: boolean;
}

export interface AccountWorkspaceData {
  accountId: string;
  userProfile: UserProfile;
  messages: MessageItem[];
  memories: MemoryEntry[];
  projects: ProjectItem[];
  timelineLogs: TimelineActionLog[];
  files: FileItem[];
  reminders: ReminderItem[];
  generatedImages: GeneratedImageItem[];
  contacts: ContactItem[];
}

export interface SessionInfo {
  id: string;
  device: string;
  ip: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
}

export interface GeneratedImageItem {
  id: string;
  prompt: string;
  optimizedPrompt?: string;
  url: string;
  folder: string;
  aspectRatio: "1:1" | "16:9" | "9:16" | "4:3";
  style: "EXACT" | "NATURAL" | "CINEMATIC" | "HOLOGRAPHIC" | "CYBERPUNK" | "ANIME" | "PHOTOREALISTIC" | "CONCEPT_ART";
  timestamp: string;
  dimensions: string;
  provider: "IMAGEN_3" | "POLLINATIONS" | "NEURAL_SYNTH";
  tags: string[];
  isFavorite?: boolean;
}

export interface ImageFolder {
  id: string;
  name: string;
  icon: string;
  description: string;
  count: number;
}

export type ThemeId = "CYAN_NEON" | "AMBER_GOLD" | "EMERALD_TACTICAL" | "OBSIDIAN_STEALTH" | "VIOLET_ASTRAL" | "CRIMSON_STARK";

export interface ThemeConfig {
  id: ThemeId;
  name: string;
  accentColor: string;
  glowColor: string;
  panelBg: string;
  borderColor: string;
  coreColor: string;
  waveformStyle: "PULSE" | "NEON_BARS" | "LIQUID_FLOW" | "TACTICAL_DOTS";
  blurIntensity: "sm" | "md" | "lg" | "xl";
  borderRadius: "rounded-xl" | "rounded-2xl" | "rounded-3xl";
}

export interface WallpaperItem {
  id: string;
  name: string;
  category: "STATIC" | "ANIMATED" | "GENERATED" | "USER_IMPORTED";
  previewUrl: string;
  fullUrl: string;
  themeId?: ThemeId;
  description: string;
  tags: string[];
}

export interface FamilySupervisionConfig {
  isEnabled: boolean;
  guardianEmail: string;
  guardianName: string;
  relationship: "Parent" | "Guardian" | "System Admin";
  linkedDate: string;
  permissions: {
    conversationHistory: boolean;
    searchHistory: boolean;
    savedMemories: boolean;
    aiGeneratedContent: boolean;
    appActivity: boolean;
    screenAwarenessActivity: boolean;
    usageStatistics: boolean;
  };
  auditLogs: SupervisionAuditLog[];
  emergencyLockActive: boolean;
}

export interface SupervisionAuditLog {
  id: string;
  timestamp: string;
  accessor: string;
  category: string;
  action: string;
  details: string;
}

export type PermissionLevel = "SAFE" | "CONFIRM" | "RESTRICTED";

export interface AutomationCapability {
  id: string;
  name: string;
  description: string;
  level: PermissionLevel;
  category: "APP" | "SYSTEM" | "BROWSER" | "FILES" | "INPUT";
  enabled: boolean;
}

export interface DiagnosticTest {
  id: string;
  name: string;
  category: "AI_CORE" | "VOICE_VISION" | "NETWORK" | "MEMORY" | "SECURITY" | "AUTOMATION";
  status: "PENDING" | "RUNNING" | "PASSED" | "WARNING" | "FAILED";
  latencyMs?: number;
  message: string;
  timestamp?: string;
}

export interface SystemUpdateManifest {
  currentVersion: string;
  availableVersion: string;
  releaseDate: string;
  changelog: string[];
  newFeatures: string[];
  securityPatches: string[];
  requiresMigration: boolean;
  isUpdating?: boolean;
  hasRollbackPoint?: boolean;
}

export interface MessageAttachment {
  id?: string;
  name: string;
  type: "image" | "document" | "code" | "data" | "file";
  dataUrl?: string;
  url?: string;
  size?: string;
  mimeType?: string;
  content?: string;
}

export interface DegradationState {
  isDegraded: boolean;
  service: "AI_CHAT" | "VISION_OCR" | "TTS" | "IMAGE_GEN" | "RESEARCH";
  serviceName: string;
  reason: string;
  troubleshootingTip: string;
  offlineFallbackActive: boolean;
  canRetry?: boolean;
  failedQuery?: string;
  statusCode?: number;
}

export interface GeneratedVideoItem {
  id: string;
  prompt: string;
  title: string;
  durationSeconds: number;
  fps: number;
  resolution: string;
  aspectRatio?: "16:9" | "9:16";
  mode?: "TEXT_TO_VIDEO" | "IMAGE_TO_VIDEO" | "ANIMATION_60FPS";
  modelUsed?: string;
  veoOperationName?: string;
  videoDataUrl?: string;
  sourceImageUrl?: string;
  themeColor: string;
  secondaryColor: string;
  animationType: "PARTICLE_NEBULA" | "CYBER_CITY" | "SOLAR_ORBIT" | "NATURE_WAVE" | "MATRIX_CODE" | "CUSTOM_SCENE";
  backgroundImageUrl?: string;
  svgOverlay?: string;
  standaloneHtml: string;
  timestamp: string;
}

export interface GeneratedMusicItem {
  id: string;
  prompt: string;
  title: string;
  model: "lyria-3-clip-preview" | "lyria-3-pro-preview" | "dravis-lyria-synth";
  durationSeconds: number;
  bpm: number;
  genre: string;
  lyrics: string;
  audioDataUrl: string;
  mimeType: string;
  timestamp: string;
}

export interface AudioTranscriptionItem {
  id: string;
  fileName: string;
  durationLabel?: string;
  transcript: string;
  detectedLanguage: string;
  summary: string;
  actionItems?: string[];
  model: string;
  timestamp: string;
}

export interface SearchGroundingItem {
  query: string;
  sources: {
    title: string;
    uri: string;
    snippet?: string;
  }[];
}

export interface BioScienceAnalysisItem {
  id: string;
  query: string;
  domain: "PROTEIN_3D" | "CHEMICAL_DRUG" | "GENOMICS_VARIANT" | "LITERATURE_TRIALS";
  targetSymbol: string;
  uniprotAccession?: string;
  pdbId?: string;
  organism?: string;
  proteinName?: string;
  sequence?: string;
  cifUrl?: string;
  paeImageUrl?: string;
  plddtScore?: number;
  chemicalProps?: {
    cid: number;
    formula: string;
    molecularWeight: string;
    canonicalSmiles: string;
    inchiKey: string;
    xlogp: number;
    tpsa: number;
    hbd: number;
    hba: number;
    rotatableBonds: number;
    lipinskiPass: boolean;
    violations: number;
    pubchemImage2dUrl: string;
  };
  variants?: {
    id: string;
    title: string;
    significance: string;
    reviewStars: number;
    condition: string;
  }[];
  literature?: {
    id: string;
    title: string;
    journal: string;
    year: string;
    authors: string;
    url: string;
    citedBy?: number;
  }[];
  provenanceBadge: string;
  sourceUrl: string;
  aiSynthesis: string;
  timestamp: string;
}

export interface GeneratedAppBundle {
  id: string;
  appName: string;
  packageName: string;
  versionName: string;
  versionCode: number;
  prompt: string;
  aabFileName: string;
  apkFileName: string;
  aabSize: string;
  folderPath: string;
  previewHtml: string;
  files: FileItem[];
  aabBase64: string;
  timestamp: string;
}

export interface MessageItem {
  id: string;
  role: "user" | "assistant" | "dravis" | "system";
  sender?: string;
  text: string;
  timestamp: string;
  detailedMarkdown?: string;
  reasoningSteps?: string[];
  intent?: string;
  actionExecuted?: {
    actionType: string;
    target?: string | null;
    status?: string;
    params?: any;
  };
  multiTaskExecuted?: {
    launchedApps: {
      id: string;
      name: string;
      webUrl: string;
      windowsUri?: string;
      routingMode: "DESKTOP_NATIVE" | "BROWSER_AUTO" | "CHROME_EXPLICIT";
      routingReason: string;
      accentColor: string;
      iconName: string;
    }[];
    hardwareChanges?: {
      control: string;
      label: string;
      enabled: boolean;
    }[];
    followUpQuestion?: string;
  };
  audioUrl?: string;
  learnedFact?: string | null;
  attachments?: MessageAttachment[];
  createdFile?: FileItem;
  createdFiles?: FileItem[];
  createdFolder?: string;
  generatedImage?: {
    id?: string;
    prompt: string;
    url: string;
    style?: string;
    aspectRatio?: string;
    dimensions?: string;
    timestamp?: string;
    isEdited?: boolean;
    mode?: string;
    folder?: string;
    createdAt?: string;
    [key: string]: any;
  };
  generatedVideo?: GeneratedVideoItem;
  generatedMusic?: GeneratedMusicItem;
  audioTranscription?: AudioTranscriptionItem;
  searchGrounding?: SearchGroundingItem;
  bioScienceData?: BioScienceAnalysisItem;
  bioScienceAnalysis?: any;
  generatedAppBundle?: GeneratedAppBundle;
  degradationState?: DegradationState;
}

export interface MemoryEntry {
  id: string;
  category: "PREFERENCE" | "IDENTITY" | "HABIT" | "RULE" | "TASK" | "FACT" | "PROJECT" | "SYSTEM";
  key: string;
  value: string;
  confidence: number;
  lastUpdated?: string;
  timestamp?: string;
  createdAt?: string;
  fact?: string;
  source?: "CONVERSATION" | "FEEDBACK" | "OBSERVATION" | "MANUAL" | "VOICE_LEARNED" | "AUTO_EXTRACTED";
}

export interface ReminderItem {
  id: string;
  title: string;
  time: string;
  date: string;
  completed: boolean;
  priority: "HIGH" | "MEDIUM" | "LOW";
}

export interface NewsItem {
  id: string;
  title: string;
  source: string;
  category: "AI" | "TECH" | "HARDWARE" | "RESEARCH";
  summary: string;
  timestamp: string;
  url?: string;
}

export interface WeatherData {
  temperature: number;
  condition: string;
  location: string;
  humidity: number;
  windSpeed: number;
  feelsLike: number;
  high: number;
  low: number;
  uvIndex: number;
}

export interface QuickActionItem {
  id: string;
  name: string;
  iconName: string;
  type: "APP" | "SYSTEM" | "WORKFLOW" | "MEDIA";
  actionUrl?: string;
  command: string;
  color?: string;
  badge?: string;
}

export type LLMProvider = "GOOGLE" | "OPENAI";

export interface LLMModelOption {
  id: string;
  name: string;
  provider: LLMProvider;
  badge: string;
  description: string;
  speed: string;
  contextWindow: string;
  tag: string;
  isDefault?: boolean;
}

export const LLM_MODELS: LLMModelOption[] = [
  // 1. Google (Primary / Default)
  {
    id: "gemini-4-argon",
    name: "Gemini 4 Argon Bot",
    provider: "GOOGLE",
    badge: "GOOGLE • GEMINI 4 ARGON",
    description: "Flagship complex reasoning, STEM, coding, and BioScience multi-turn Gemini Bot.",
    speed: "~ 140ms Latency",
    contextWindow: "2M Tokens",
    tag: "Flagship Bot",
  },
  {
    id: "gemini-3.8-flash",
    name: "Gemini 3.8 Flash",
    provider: "GOOGLE",
    badge: "GOOGLE • ASI CORE",
    description: "Multimodal fast reasoning engine with Google Search grounding & tool orchestration.",
    speed: "< 90ms Latency",
    contextWindow: "1M Tokens",
    tag: "Recommended",
    isDefault: true,
  },
  {
    id: "gemini-3.1-flash-lite",
    name: "Gemini 3.1 Flash Lite",
    provider: "GOOGLE",
    badge: "GOOGLE • ULTRA FAST",
    description: "Ultra lightweight high-efficiency model for instantaneous actions.",
    speed: "< 50ms Latency",
    contextWindow: "1M Tokens",
    tag: "Low Latency",
  },
  // 2. OpenAI (Secondary)
  {
    id: "gpt-4o",
    name: "GPT-4o",
    provider: "OPENAI",
    badge: "OPENAI • OMNI BRAIN",
    description: "High-intelligence flagship omnimodal model for deep dialogue & coding.",
    speed: "~ 180ms Latency",
    contextWindow: "128K Tokens",
    tag: "Omnimodal",
  },
  {
    id: "gpt-4o-mini",
    name: "GPT-4o Mini",
    provider: "OPENAI",
    badge: "OPENAI • MINI TURBO",
    description: "Streamlined fast LLM engine for rapid lightweight completions.",
    speed: "< 100ms Latency",
    contextWindow: "128K Tokens",
    tag: "Fast & Light",
  },
  {
    id: "o3-mini",
    name: "OpenAI o3-mini",
    provider: "OPENAI",
    badge: "OPENAI • STEM REASONING",
    description: "Specialized deep reasoning model designed for complex logic & math.",
    speed: "~ 500ms Latency",
    contextWindow: "200K Tokens",
    tag: "Reasoning",
  },
];

export type DravisPersonality = "TONY_STARK" | "TACTICAL_COMMANDER" | "SUPERINTELLIGENCE" | "WARM_ASSISTANT";
export type DravisTalkingStyle = "WITTY_CONCISE" | "DIRECT_TACTICAL" | "ACADEMIC_DETAILED" | "CASUAL_WARM";

export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  bcp47: string;
  region: "AUTO" | "INDIAN" | "GLOBAL";
  flag: string;
}

export const DRAVIS_LANGUAGES: LanguageOption[] = [
  {
    code: "AUTO_ADAPT",
    name: "Auto-Adapt (All Languages)",
    nativeName: "Auto-Detect & Adapt",
    bcp47: "en-US",
    region: "AUTO",
    flag: "🌐",
  },
  // Indian & South Asian Languages
  { code: "en-IN", name: "English (India)", nativeName: "English (IN)", bcp47: "en-IN", region: "INDIAN", flag: "🇮🇳" },
  { code: "hi-IN", name: "Hindi", nativeName: "हिन्दी", bcp47: "hi-IN", region: "INDIAN", flag: "🇮🇳" },
  { code: "hinglish", name: "Hinglish (Hindi + English)", nativeName: "Hinglish / हिंदी-Eng", bcp47: "en-IN", region: "INDIAN", flag: "🇮🇳" },
  { code: "mr-IN", name: "Marathi", nativeName: "मराठी", bcp47: "mr-IN", region: "INDIAN", flag: "🇮🇳" },
  { code: "ta-IN", name: "Tamil", nativeName: "தமிழ்", bcp47: "ta-IN", region: "INDIAN", flag: "🇮🇳" },
  { code: "te-IN", name: "Telugu", nativeName: "తెలుగు", bcp47: "te-IN", region: "INDIAN", flag: "🇮🇳" },
  { code: "bn-IN", name: "Bengali", nativeName: "বাংলা", bcp47: "bn-IN", region: "INDIAN", flag: "🇮🇳" },
  { code: "gu-IN", name: "Gujarati", nativeName: "ગુજરાતી", bcp47: "gu-IN", region: "INDIAN", flag: "🇮🇳" },
  { code: "kn-IN", name: "Kannada", nativeName: "ಕನ್ನಡ", bcp47: "kn-IN", region: "INDIAN", flag: "🇮🇳" },
  { code: "ml-IN", name: "Malayalam", nativeName: "മലയാളം", bcp47: "ml-IN", region: "INDIAN", flag: "🇮🇳" },
  { code: "pa-IN", name: "Punjabi", nativeName: "ਪੰਜਾਬੀ", bcp47: "pa-IN", region: "INDIAN", flag: "🇮🇳" },
  { code: "ur-IN", name: "Urdu", nativeName: "اردو", bcp47: "ur-IN", region: "INDIAN", flag: "🇮🇳" },
  { code: "or-IN", name: "Odia", nativeName: "ଓଡ଼ିଆ", bcp47: "or-IN", region: "INDIAN", flag: "🇮🇳" },
  { code: "as-IN", name: "Assamese", nativeName: "অসমীয়া", bcp47: "as-IN", region: "INDIAN", flag: "🇮🇳" },
  { code: "sa-IN", name: "Sanskrit", nativeName: "संस्कृतम्", bcp47: "sa-IN", region: "INDIAN", flag: "🇮🇳" },
  { code: "ne-NP", name: "Nepali", nativeName: "नेपाली", bcp47: "ne-NP", region: "INDIAN", flag: "🇳🇵" },
  { code: "si-LK", name: "Sinhala", nativeName: "සිංහල", bcp47: "si-LK", region: "INDIAN", flag: "🇱🇰" },
  // Global Languages
  { code: "en-US", name: "English (US / Global)", nativeName: "English", bcp47: "en-US", region: "GLOBAL", flag: "🇺🇸" },
  { code: "en-GB", name: "English (UK British)", nativeName: "English (UK)", bcp47: "en-GB", region: "GLOBAL", flag: "🇬🇧" },
  { code: "es-ES", name: "Spanish", nativeName: "Español", bcp47: "es-ES", region: "GLOBAL", flag: "🇪🇸" },
  { code: "fr-FR", name: "French", nativeName: "Français", bcp47: "fr-FR", region: "GLOBAL", flag: "🇫🇷" },
  { code: "de-DE", name: "German", nativeName: "Deutsch", bcp47: "de-DE", region: "GLOBAL", flag: "🇩🇪" },
  { code: "ja-JP", name: "Japanese", nativeName: "日本語", bcp47: "ja-JP", region: "GLOBAL", flag: "🇯🇵" },
  { code: "ko-KR", name: "Korean", nativeName: "한국어", bcp47: "ko-KR", region: "GLOBAL", flag: "🇰🇷" },
  { code: "zh-CN", name: "Chinese (Mandarin)", nativeName: "中文 (简体)", bcp47: "zh-CN", region: "GLOBAL", flag: "🇨🇳" },
  { code: "ar-SA", name: "Arabic", nativeName: "العربية", bcp47: "ar-SA", region: "GLOBAL", flag: "🇸🇦" },
  { code: "ru-RU", name: "Russian", nativeName: "Русский", bcp47: "ru-RU", region: "GLOBAL", flag: "🇷🇺" },
  { code: "pt-BR", name: "Portuguese", nativeName: "Português", bcp47: "pt-BR", region: "GLOBAL", flag: "🇧🇷" },
  { code: "it-IT", name: "Italian", nativeName: "Italiano", bcp47: "it-IT", region: "GLOBAL", flag: "🇮🇹" },
  { code: "tr-TR", name: "Turkish", nativeName: "Türkçe", bcp47: "tr-TR", region: "GLOBAL", flag: "🇹🇷" },
  { code: "nl-NL", name: "Dutch", nativeName: "Nederlands", bcp47: "nl-NL", region: "GLOBAL", flag: "🇳🇱" },
  { code: "id-ID", name: "Indonesian", nativeName: "Bahasa Indonesia", bcp47: "id-ID", region: "GLOBAL", flag: "🇮🇩" },
  { code: "vi-VN", name: "Vietnamese", nativeName: "Tiếng Việt", bcp47: "vi-VN", region: "GLOBAL", flag: "🇻🇳" },
  { code: "th-TH", name: "Thai", nativeName: "ไทย", bcp47: "th-TH", region: "GLOBAL", flag: "🇹🇭" },
  { code: "pl-PL", name: "Polish", nativeName: "Polski", bcp47: "pl-PL", region: "GLOBAL", flag: "🇵🇱" },
  { code: "uk-UA", name: "Ukrainian", nativeName: "Українська", bcp47: "uk-UA", region: "GLOBAL", flag: "🇺🇦" },
  { code: "el-GR", name: "Greek", nativeName: "Ελληνικά", bcp47: "el-GR", region: "GLOBAL", flag: "🇬🇷" },
  { code: "he-IL", name: "Hebrew", nativeName: "עברית", bcp47: "he-IL", region: "GLOBAL", flag: "🇮🇱" },
  { code: "fa-IR", name: "Persian (Farsi)", nativeName: "فارسی", bcp47: "fa-IR", region: "GLOBAL", flag: "🇮🇷" },
  { code: "sw-KE", name: "Swahili", nativeName: "Kiswahili", bcp47: "sw-KE", region: "GLOBAL", flag: "🇰🇪" },
  { code: "tl-PH", name: "Filipino (Tagalog)", nativeName: "Filipino", bcp47: "tl-PH", region: "GLOBAL", flag: "🇵🇭" },
  { code: "ms-MY", name: "Malay", nativeName: "Bahasa Melayu", bcp47: "ms-MY", region: "GLOBAL", flag: "🇲🇾" },
  { code: "sv-SE", name: "Swedish", nativeName: "Svenska", bcp47: "sv-SE", region: "GLOBAL", flag: "🇸🇪" },
];

/**
 * Real-time Script & Conversational Language Auto-Detector
 */
export function detectLanguageFromText(text: string): LanguageOption {
  const s = (text || "").trim();
  const lower = s.toLowerCase();

  // 1. Check explicit language switch requests first ("speak in tamil", "hindi mein baat karo", etc.)
  for (const lang of DRAVIS_LANGUAGES) {
    if (lang.code === "AUTO_ADAPT") continue;
    const baseName = lang.name.split("(")[0].trim().toLowerCase();
    if (
      new RegExp(`\\b(?:speak|talk|reply|respond|answer|chat|switch)\\s+(?:to\\s+me\\s+)?(?:in|to)\\s+${baseName}\\b`, "i").test(lower) ||
      new RegExp(`\\b${baseName}\\s+(?:mein|me|madhe|lo|la|il|te|ch|language)\\s+(?:baat|bol|bolo|pesu|kotha|vaat)`, "i").test(lower)
    ) {
      return lang;
    }
  }

  // 2. Check Unicode Script Ranges
  if (/[\u0B80-\u0BFF]/.test(s)) return DRAVIS_LANGUAGES.find((l) => l.code === "ta-IN")!;
  if (/[\u0C00-\u0C7F]/.test(s)) return DRAVIS_LANGUAGES.find((l) => l.code === "te-IN")!;
  if (/[\u0980-\u09FF]/.test(s)) return DRAVIS_LANGUAGES.find((l) => l.code === "bn-IN")!;
  if (/[\u0A80-\u0AFF]/.test(s)) return DRAVIS_LANGUAGES.find((l) => l.code === "gu-IN")!;
  if (/[\u0C80-\u0CFF]/.test(s)) return DRAVIS_LANGUAGES.find((l) => l.code === "kn-IN")!;
  if (/[\u0D00-\u0D7F]/.test(s)) return DRAVIS_LANGUAGES.find((l) => l.code === "ml-IN")!;
  if (/[\u0A00-\u0A7F]/.test(s)) return DRAVIS_LANGUAGES.find((l) => l.code === "pa-IN")!;
  if (/[\u0B00-\u0B7F]/.test(s)) return DRAVIS_LANGUAGES.find((l) => l.code === "or-IN")!;
  if (/[\u0D80-\u0DFF]/.test(s)) return DRAVIS_LANGUAGES.find((l) => l.code === "si-LK")!;
  if (/[\u0900-\u097F]/.test(s)) {
    // Distinguish Marathi vs Hindi in Devanagari if Marathi markers exist
    if (/(?:आहे|नाही|माझ्या|तुम्ही|कसा|मराठी|करणे|आणि)/.test(s)) {
      return DRAVIS_LANGUAGES.find((l) => l.code === "mr-IN")!;
    }
    return DRAVIS_LANGUAGES.find((l) => l.code === "hi-IN")!;
  }
  if (/[\u3040-\u309F\u30A0-\u30FF]/.test(s)) return DRAVIS_LANGUAGES.find((l) => l.code === "ja-JP")!;
  if (/[\uAC00-\uD7AF\u1100-\u11FF]/.test(s)) return DRAVIS_LANGUAGES.find((l) => l.code === "ko-KR")!;
  if (/[\u4E00-\u9FFF]/.test(s)) return DRAVIS_LANGUAGES.find((l) => l.code === "zh-CN")!;
  if (/[\u0600-\u06FF]/.test(s)) {
    if (/(?:ہے|ہیں|کیا|میں|آپ|کیسے|اردو)/.test(s)) {
      return DRAVIS_LANGUAGES.find((l) => l.code === "ur-IN")!;
    }
    return DRAVIS_LANGUAGES.find((l) => l.code === "ar-SA")!;
  }
  if (/[\u0400-\u04FF]/.test(s)) return DRAVIS_LANGUAGES.find((l) => l.code === "ru-RU")!;
  if (/[\u0E00-\u0E7F]/.test(s)) return DRAVIS_LANGUAGES.find((l) => l.code === "th-TH")!;
  if (/[\u0370-\u03FF]/.test(s)) return DRAVIS_LANGUAGES.find((l) => l.code === "el-GR")!;
  if (/[\u0590-\u05FF]/.test(s)) return DRAVIS_LANGUAGES.find((l) => l.code === "he-IL")!;

  // 3. Check Romanized Hinglish / Indian & Global conversational patterns
  if (
    /\b(?:kya|kaise|kaisa|karo|banao|mujhe|mera|meri|tum|aap|hai|hain|nahi|aur|batao|dikhao|kholo|chahiye|accha|theek|bhai|yaar|namaste)\b/i.test(
      lower
    )
  ) {
    return DRAVIS_LANGUAGES.find((l) => l.code === "hinglish")!;
  }
  if (/\b(?:hola|como\s+estas|gracias|por\s+favor|buenos\s+dias|que\s+tal|hacer|puedes)\b/i.test(lower)) {
    return DRAVIS_LANGUAGES.find((l) => l.code === "es-ES")!;
  }
  if (/\b(?:bonjour|merci|comment\s+ca\s+va|s'il\s+vous\s+plait|pouvez\s+vous|français)\b/i.test(lower)) {
    return DRAVIS_LANGUAGES.find((l) => l.code === "fr-FR")!;
  }
  if (/\b(?:hallo|danke|wie\s+geht|bitte|können\s+sie|deutsch)\b/i.test(lower)) {
    return DRAVIS_LANGUAGES.find((l) => l.code === "de-DE")!;
  }
  if (/\b(?:ola|obrigado|como\s+vai|bom\s+dia|voce\s+pode)\b/i.test(lower)) {
    return DRAVIS_LANGUAGES.find((l) => l.code === "pt-BR")!;
  }
  if (/\b(?:ciao|grazie|come\s+stai|buongiorno|per\s+favore)\b/i.test(lower)) {
    return DRAVIS_LANGUAGES.find((l) => l.code === "it-IT")!;
  }

  return DRAVIS_LANGUAGES.find((l) => l.code === "en-US")!;
}

export type VoicePersonaId = "Fenrir" | "Kore" | "Puck" | "Zephyr" | "Aoede" | "Charon" | "System";

export interface VoicePersonaProfile {
  id: VoicePersonaId;
  name: string;
  tagline: string;
  gender: "MALE" | "FEMALE" | "NEUTRAL";
  accentTld: string;
  speakingFlow: string;
  personalityPrompt: string;
  baseRate: number;
  pitchRatio: number;
  eqLowDb: number;
  eqMidDb: number;
  eqHighDb: number;
  previewTextEn: string;
  previewTextHi: string;
}

export const DRAVIS_VOICE_PROFILES: VoicePersonaProfile[] = [
  {
    id: "Fenrir",
    name: "Fenrir • British Commander",
    tagline: "Deep Baritone • Composed & Authoritative Flow",
    gender: "MALE",
    accentTld: "co.uk",
    speakingFlow: "Composed, velvety British cadence with thoughtful micro-pauses and crisp articulation.",
    personalityPrompt: "Speak with Fenrir's refined, calm, authoritative British flow: warm yet composed, structured sentences, reassuring confidence.",
    baseRate: 0.99,
    pitchRatio: 0.89,
    eqLowDb: 4.5,
    eqMidDb: 1.0,
    eqHighDb: 1.5,
    previewTextEn: "Good day, Sir. I am Fenrir. My micro-decision matrices and full-system monitors are online and ready at your command.",
    previewTextHi: "Namaste Boss, main Fenrir hoon. Aapka poora computer system aur micro-decision engine bilkul taiyaar hai.",
  },
  {
    id: "Kore",
    name: "Kore • Warm Companion",
    tagline: "Melodic Female • Friendly & Caring Flow",
    gender: "FEMALE",
    accentTld: "co.in",
    speakingFlow: "Warm, empathetic, melodic conversational flow that feels like a caring best friend in every language.",
    personalityPrompt: "Speak with Kore's warm, friendly, empathetic flow: encouraging, natural everyday rhythm, gentle transitions.",
    baseRate: 1.02,
    pitchRatio: 1.09,
    eqLowDb: 1.0,
    eqMidDb: 2.5,
    eqHighDb: 3.5,
    previewTextEn: "Hey there! I'm Kore! I'm watching over your system and ready to help you with anything you need today!",
    previewTextHi: "Hello dost! Main Kore hoon! Aap mujhe kuch bhi batao, main aapke saare kaam khud pyaar se poore kar dungi.",
  },
  {
    id: "Puck",
    name: "Puck • Energetic Innovator",
    tagline: "Crisp & Lively • Fast Conversational Flow",
    gender: "MALE",
    accentTld: "com",
    speakingFlow: "Upbeat, agile, energetic flow with quick natural inflection and high enthusiasm.",
    personalityPrompt: "Speak with Puck's lively, upbeat, fast-flowing best-friend energy: enthusiastic, sharp, conversational.",
    baseRate: 1.08,
    pitchRatio: 1.04,
    eqLowDb: 1.5,
    eqMidDb: 3.0,
    eqHighDb: 2.5,
    previewTextEn: "Hey Boss! Puck here—fast, sharp, and already running your multi-work micro-decisions in real time!",
    previewTextHi: "Arre bhai! Main Puck hoon—ekdam fast aur friendly! Batao aaj kya naya automate karna hai?",
  },
  {
    id: "Zephyr",
    name: "Zephyr • Calm Zen Guide",
    tagline: "Soothing & Smooth • Unhurried Flow",
    gender: "FEMALE",
    accentTld: "com.au",
    speakingFlow: "Unhurried, silky, peaceful cadence with gentle breathing space between ideas.",
    personalityPrompt: "Speak with Zephyr's calm, soothing, unhurried flow: serene, clear, peaceful and deeply reassuring.",
    baseRate: 0.93,
    pitchRatio: 0.96,
    eqLowDb: 3.0,
    eqMidDb: 0.5,
    eqHighDb: 1.0,
    previewTextEn: "Hello. I am Zephyr. Take a deep breath—I am quietly monitoring your screen and handling every task in harmony.",
    previewTextHi: "Namaste. Main Zephyr hoon. Aap bilkul aaram se rahiye, main aapke system ki har problem khud theek kar rahi hoon.",
  },
  {
    id: "Aoede",
    name: "Aoede • Expressive Storyteller",
    tagline: "Lyrical & Bright • Expressive Multilingual Flow",
    gender: "FEMALE",
    accentTld: "co.in",
    speakingFlow: "Expressive, musical, storytelling flow with vibrant emotional inflection across all languages.",
    personalityPrompt: "Speak with Aoede's expressive, musical storytelling flow: vivid, friendly, rich in natural emotion.",
    baseRate: 1.01,
    pitchRatio: 1.13,
    eqLowDb: 0.5,
    eqMidDb: 2.8,
    eqHighDb: 4.0,
    previewTextEn: "Hi! I am Aoede! Every language has its own rhythm, and I love speaking with you like a true friend!",
    previewTextHi: "Namaste! Main Aoede hoon! Har bhasha mein ek alag mithaas hoti hai, aur main aapki sabse acchi dost hoon!",
  },
  {
    id: "Charon",
    name: "Charon • Deep Strategist",
    tagline: "Deep Sub-Resonant • Tactical Precision Flow",
    gender: "MALE",
    accentTld: "ca",
    speakingFlow: "Deep, grounded, low-register resonance with deliberate analytical precision.",
    personalityPrompt: "Speak with Charon's deep, grounded strategic flow: deliberate, crystal-clear, high-precision intelligence.",
    baseRate: 0.96,
    pitchRatio: 0.84,
    eqLowDb: 5.5,
    eqMidDb: 1.2,
    eqHighDb: 0.8,
    previewTextEn: "Charon online. Vector memory bank synchronized. Autonomous multi-work agents standing by for full system execution.",
    previewTextHi: "Main Charon hoon. Vector memory aur autonomous agents active hain. Har micro-decision par meri nazar hai.",
  },
];

export interface UserProfile {
  name: string;
  title: string;
  biometricId: string;
  securityLevel: string;
  preferredLanguage: string;
  autoAdaptLanguage?: boolean;
  detectedLanguage?: string;
  voicePreference: VoicePersonaId;
  voiceSpeed: number;
  responseSpeed: "INSTANT" | "RAPID" | "BALANCED" | "DEEP_REASONING";
  responseSpeedRate: number;
  voicePitch: number;
  wakeWord: string;
  wakeWordActive: boolean;
  voiceOutputActive?: boolean;
  liveVoiceActive?: boolean;
  kidsFriendlyMode?: boolean;
  autonomousMode: boolean;
  learningMode: boolean;
  soundEffects: boolean;
  llmProvider: LLMProvider;
  llmModel: string;
  personalityStyle?: DravisPersonality;
  talkingStyle?: DravisTalkingStyle;
  responseMode?: ResponseMode;
  activeTheme?: ThemeId;
  activeWallpaperId?: string;
  screenAwarenessActive?: boolean;
  proactiveAssistance?: "OFF" | "LOW" | "BALANCED" | "HIGH";
  account?: UserAccount;
}

export interface SystemTelemetry {
  os: string;
  cpu: string;
  cpuRaw: number;
  ram: string;
  ramRaw: number;
  disk: string;
  diskRaw: number;
  network: string;
  power: number;
  uptimeSeconds: number;
  activeTasks: number;
  securityLevel: string;
  status: string;
}

export interface SkillModule {
  id: number;
  name: string;
  category: "CORE" | "COGNITION" | "VOICE_VISION" | "AUTOMATION" | "INTELLIGENCE" | "MANAGEMENT" | "CREATIVE_AI" | "BIOSCIENCE";
  status: "ACTIVE" | "STANDBY" | "TRAINING";
  description: string;
  skillAction?:
    | "ANIMATION"
    | "GENERATE_ANIMATION"
    | "IMAGE_TO_VIDEO"
    | "VEO_IMAGE_TO_VIDEO"
    | "TEXT_TO_VIDEO"
    | "VEO_TEXT_TO_VIDEO"
    | "TRANSCRIBE_AUDIO"
    | "AUDIO_TRANSCRIBE"
    | "GEMINI_BOT"
    | "GOOGLE_SEARCH"
    | "GOOGLE_SEARCH_GROUNDING"
    | "CREATE_EDIT_IMAGE"
    | "IMAGE_CREATE_EDIT"
    | "GENERATE_MUSIC"
    | "LYRIA_MUSIC"
    | "BIOSCIENCE"
    | "BIOSCIENCE_3D_PROTEIN"
    | "BIOSCIENCE_DRUG_CHEM"
    | "BIOSCIENCE_GENOMICS"
    | "BIOSCIENCE_LITERATURE"
    | (string & {});
  version: string;
}

export interface PluginItem {
  id: string;
  name: string;
  version: string;
  description: string;
  enabled: boolean;
  icon: string;
  category: "Productivity" | "Developer" | "Media" | "System" | "Web";
  author: string;
}

export interface AutomationWorkflow {
  id: string;
  name: string;
  trigger: "VOICE" | "SCHEDULE" | "HOTKEY" | "STATE";
  triggerDetail: string;
  actions: string[];
  lastRun?: string;
  enabled: boolean;
}

export interface FileItem {
  id: string;
  name: string;
  folder?: string;
  extension?: string;
  type: "document" | "code" | "media" | "config" | "data" | "image" | "aab" | "archive" | "video" | "folder";
  size: string;
  updated: string;
  content?: string;
  dataUrl?: string;
  url?: string;
  mimeType?: string;
  isUserUploaded?: boolean;
  generatedBy?: "DRAVIS" | "USER";
}

export interface ContactPhone {
  id: string;
  label: "Mobile" | "Work" | "Home" | "Main" | "Other";
  number: string;
  isPrimary?: boolean;
}

export interface ContactItem {
  id: string;
  name: string;
  avatar?: string;
  numbers: ContactPhone[];
  relationship?: string;
  lastContacted?: string;
}

export interface ActiveCallState {
  isActive: boolean;
  status: "DIALING" | "RINGING" | "CONNECTED" | "ENDED";
  contactName: string;
  number: string;
  label?: string;
  durationSeconds: number;
  isMuted: boolean;
  isSpeakerOn: boolean;
  callStartTime?: number;
}

export interface ContactSelectionPrompt {
  isOpen: boolean;
  contact: ContactItem;
  promptText: string;
}

export interface InstalledAppItem {
  id: string;
  name: string;
  packageName: string;
  url: string;
  icon: string;
  category: "PRODUCTIVITY" | "MEDIA" | "AI" | "SOCIAL" | "SYSTEM" | "TOOLS";
  isInstalled: boolean;
  version?: string;
  size?: string;
  rating?: number;
  description: string;
  installedAt?: string;
  playStoreUrl?: string;
}

export interface DeviceSystemControls {
  wifi: boolean;
  mobileData: boolean;
  flightMode: boolean;
  flashlight: boolean;
  bluetooth: boolean;
}

export interface MusicPlaybackState {
  isPlaying: boolean;
  title: string;
  artist: string;
  albumCover?: string;
  currentTime: number;
  duration: number;
}

export interface LeverageTreeNode {
  id: string;
  parentId?: string | null;
  level: number;
  branch?: "ROOT" | "TRUE" | "FALSE";
  condition: string;
  gini: number;
  samples: number;
  value: [number, number];
  classLabel: 0 | 1;
  actionSummary: string;
  apiUsed: "GOOGLE_GEMINI" | "OPENAI_GPT" | "DUAL_FUSION";
  confidence: number;
}

export interface SlotFillingTrace {
  utterance: string;
  matchedNode: string;
  matchedStructurePattern: string;
  nodesCheckedCount: number;
  patternsCheckedCount: number;
  slots: {
    name: string;
    value: string;
    filled: boolean;
    source: "UTTERANCE" | "VECTOR_MEMORY" | "CONTEXT_COMPLETION";
  }[];
  allSlotsFilled: boolean;
  followUpQuestion?: string | null;
  contextCompletionSummary: string;
  generatedCommand: string;
}

export interface MultiWorkTask {
  id: string;
  title: string;
  stage: "STT" | "LLM_INTENT" | "VECTOR_MEMORY" | "AUTONOMOUS_AGENT" | "ACTION_EXECUTION";
  agentName: string;
  apiUsed: "GOOGLE_GEMINI" | "OPENAI_GPT";
  status: "COMPLETED" | "RUNNING" | "QUEUED" | "AUTO_FIXED";
  whatItTakes: string;
  howItPerforms: string;
  howItWorks: string;
  latencyMs: number;
  timestamp: string;
}

export interface MicroDecisionNode {
  id: string;
  title: string;
  category: "VOICE_STT_TTS" | "INTENT_SLOT_FILL" | "VECTOR_MEMORY" | "SCREEN_AUTO_FIX" | "MULTI_WORK_AGENT" | "SYSTEM_CONTROL";
  status: "ACTIVE" | "COMPLETED" | "MONITORING" | "AUTO_FIXING";
  // 360 3D spherical coordinates
  theta: number;
  phi: number;
  radius: number;
  color: string;
  // Core 3 questions the user asked to see for every micro-decision
  whatItTakes: string;
  howItPerforms: string;
  howItWorks: string;
  // Quantitative leverage metrics (Image 5)
  gini: number;
  samples: number;
  value: [number, number];
  classLabel: 0 | 1;
  confidence: number;
  latencyMs: number;
  apiUsed: "GOOGLE_GEMINI" | "OPENAI_GPT" | "DUAL_SYNTHESIS";
  connectedTo: string[];
  timestamp: string;
  pipelineTrace?: {
    voiceCommand: string;
    localStt: string;
    intentLlm: string;
    vectorMemory: string;
    autonomousAgent: string;
    finalAction: string;
  };
}

export interface ScreenAutoFixReport {
  id: string;
  timestamp: string;
  problemDetected: string;
  severity: "OPTIMAL" | "WARNING" | "AUTO_FIXED";
  fixApplied: string;
  spokenExplanation: string;
  cursorTarget: {
    xPercent: number;
    yPercent: number;
    label: string;
    selector?: string;
  };
  apiUsed: "GOOGLE_GEMINI" | "OPENAI_GPT" | "DUAL_SYNTHESIS";
}

export interface ProjectItem {
  id: string;
  name: string;
  description: string;
  status: "PLANNING" | "IN_PROGRESS" | "TESTING" | "COMPLETED";
  techStack: string[];
  goals: string[];
  nextSteps: string[];
  linkedFiles: string[];
  progressPercent: number;
  lastUpdated: string;
  source: "VOICE_LEARNED" | "AUTO_EXTRACTED" | "MANUAL";
}

export interface WindowsAppEntry {
  id: string;
  name: string;
  voiceAliases: string[];
  category: "SYSTEM" | "DEVELOPER" | "BROWSER" | "MEDIA" | "PRODUCTIVITY" | "CREATIVE" | "CUSTOM";
  uriProtocol?: string;
  exePath: string;
  wingetId: string;
  officialDownloadUrl: string;
  publisher: string;
  isInstalled: boolean;
  lastLaunched?: string;
}

export interface WindowsInstallRecommendation {
  appName: string;
  publisher: string;
  wingetCommand: string;
  powerShellCommand: string;
  officialUrl: string;
  safetyVerified: boolean;
  summary: string;
  sources: {
    title: string;
    url: string;
    badge: string;
    description: string;
  }[];
  timestamp: string;
}

export interface TimelineActionLog {
  id: string;
  type: "VOICE_COMMAND" | "MEMORY_LEARNED" | "PROJECT_UPDATE" | "WINDOWS_APP_LAUNCH" | "WINDOWS_APP_INSTALL" | "SCREEN_AUTO_FIX";
  title: string;
  detail: string;
  commandToReplay?: string;
  status: "COMPLETED" | "RUNNING" | "QUEUED";
  timestamp: string;
}
