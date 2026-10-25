/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Multi-Persona Acoustic Formant TTS, Wake Word, and Offline/Local STT System
 */

import { DRAVIS_VOICE_PROFILES, VoicePersonaId, VoicePersonaProfile } from "../types";

export interface SpeechOptions {
  voiceName?: string;
  rate?: number;
  pitch?: number;
  lang?: string;
  emotion?: string;
  kidsFriendlyMode?: boolean;
  interrupt?: boolean;
  priority?: "HIGH" | "NORMAL";
  onStart?: () => void;
  onEnd?: () => void;
  onError?: () => void;
}

export interface QueuedSpeechItem {
  id: string;
  rawText: string;
  cleanText: string;
  options?: SpeechOptions;
  enqueuedAt: number;
  status: "PENDING" | "SPEAKING";
  prefetchedEntryPromise?: Promise<CachedTtsEntry | null>;
  resolve: () => void;
}

export interface CachedTtsEntry {
  cacheKey: string;
  audioBase64: string;
  mimeType: string;
  objectUrl: string;
  createdAt: number;
  lastAccessedAt: number;
  hitCount: number;
}

export interface TtsCacheStats {
  size: number;
  hits: number;
  misses: number;
  preloadedCount: number;
  queueLength: number;
}

export const DEFAULT_PRELOAD_PHRASES: string[] = [
  "I am online and monitoring your workspace.",
  "All active desktop windows have been snapped into a clean tiled grid layout.",
  "Call recording has started.",
  "Call recording stopped and saved locally to your device.",
  "Opening Google Chrome for you.",
  "Here is what I found for you.",
  "Main aapki screen dekh raha hoon, bataiye kya madad karun?",
  "Namaste! Main Dravis hoon, aapka personal AI dost.",
  "Aapka kaam ho gaya hai.",
  "Sure, let me take care of that right away.",
];

const TTS_SESSION_STORAGE_KEY = "dravis_tts_phrase_cache_v1";
const MAX_MEMORY_CACHE_ENTRIES = 120;
const MAX_STORAGE_CACHE_ENTRIES = 28;

export interface ListenOptions {
  lang?: string;
  onResult?: (transcript: string, isFinal: boolean) => void;
  onError?: (err: any) => void;
  onEnd?: () => void;
}

export interface WakeWordOptions {
  wakeWord?: string;
  onWakeWordDetected?: () => void;
}

export function getVoicePersonaProfile(voiceName?: string, isKids?: boolean): VoicePersonaProfile {
  if (isKids) {
    return DRAVIS_VOICE_PROFILES.find((v) => v.id === "Aoede") || DRAVIS_VOICE_PROFILES[0];
  }
  const found = DRAVIS_VOICE_PROFILES.find(
    (v) => v.id.toLowerCase() === (voiceName || "Puck").toLowerCase()
  );
  return found || DRAVIS_VOICE_PROFILES.find((v) => v.id === "Puck") || DRAVIS_VOICE_PROFILES[0];
}

export function cleanSpokenText(raw: string): string {
  if (!raw) return "";
  return raw
    .replace(/```[\s\S]*?```/g, "Code artifact generated.")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/https?:\/\/\S+/g, "link")
    .replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^[\s*-]+\s+/gm, "")
    .replace(/<[^>]+>/g, "")
    .replace(/[{}\[\]]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function base64ToWavUrl(base64: string, sampleRate = 24000, mimeType = "audio/wav"): string {
  try {
    const cleanBase64 = base64.replace(/^data:audio\/[\w+-]+;base64,/, "");
    const binary = atob(cleanBase64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    const isMp3Magic =
      (bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) ||
      (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0);
    if (mimeType.includes("mpeg") || mimeType.includes("mp3") || isMp3Magic) {
      const mp3Blob = new Blob([bytes], { type: "audio/mpeg" });
      return URL.createObjectURL(mp3Blob);
    }

    if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) {
      const blob = new Blob([bytes], { type: "audio/wav" });
      return URL.createObjectURL(blob);
    }

    const wavHeader = new ArrayBuffer(44);
    const view = new DataView(wavHeader);
    view.setUint32(0, 0x52494646, false); // "RIFF"
    view.setUint32(4, 36 + bytes.length, true);
    view.setUint32(8, 0x57415645, false); // "WAVE"
    view.setUint32(12, 0x666d7420, false); // "fmt "
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM format
    view.setUint16(22, 1, true); // 1 channel mono
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true); // 16 bits
    view.setUint32(36, 0x64617461, false); // "data"
    view.setUint32(40, bytes.length, true);

    const fullBlob = new Blob([wavHeader, bytes], { type: "audio/wav" });
    return URL.createObjectURL(fullBlob);
  } catch {
    return `data:${mimeType || "audio/mpeg"};base64,${base64}`;
  }
}

function selectBestHumanVoice(
  voices: SpeechSynthesisVoice[],
  targetLang: string,
  isKids: boolean,
  voiceName = "Puck"
): SpeechSynthesisVoice | undefined {
  if (!voices || voices.length === 0) return undefined;

  const persona = getVoicePersonaProfile(voiceName, isKids);
  const normalizedTarget = targetLang.toLowerCase();
  const langPrefix = normalizedTarget.split("-")[0];

  let candidates = voices.filter((v) => v.lang.toLowerCase().replace("_", "-") === normalizedTarget);
  if (candidates.length === 0) {
    candidates = voices.filter((v) => v.lang.toLowerCase().startsWith(langPrefix));
  }
  if (
    candidates.length === 0 &&
    ["mr", "ta", "te", "bn", "gu", "kn", "ml", "pa", "or", "ur", "ne"].includes(langPrefix)
  ) {
    candidates = voices.filter(
      (v) => v.lang.toLowerCase().startsWith("hi") || v.lang.toLowerCase() === "en-in"
    );
  }
  if (candidates.length === 0) {
    candidates = voices.filter((v) => v.lang.toLowerCase().startsWith("en"));
  }
  if (candidates.length === 0) return voices[0];

  const scoreVoice = (v: SpeechSynthesisVoice): number => {
    const name = v.name.toLowerCase();
    const vLang = v.lang.toLowerCase().replace("_", "-");
    let score = 0;

    if (vLang === normalizedTarget) score += 45;
    else if (vLang.startsWith(langPrefix)) score += 25;

    // Prioritize Neural / Online / Natural / Google human voices
    if (name.includes("natural")) score += 110;
    if (name.includes("online")) score += 85;
    if (name.includes("neural")) score += 95;
    if (name.includes("google")) score += 80;
    if (name.includes("wavenet") || name.includes("studio")) score += 90;
    if (name.includes("premium") || name.includes("enhanced")) score += 75;
    if (name.includes("siri")) score += 70;

    // Persona-specific voice differentiation so every selected voice sounds distinct!
    if (persona.id === "Fenrir") {
      if (vLang.includes("gb") || vLang.includes("uk") || name.includes("uk") || name.includes("british")) score += 95;
      if (/(daniel|ryan|george|oliver|arthur|male|guy|prabhat|madhur|hemant)/.test(name)) score += 85;
    } else if (persona.id === "Kore") {
      if (vLang.includes("in") || name.includes("india")) score += 75;
      if (/(swara|neerja|aria|samantha|sonia|kalpana|pallavi|shruti|veena|female)/.test(name)) score += 90;
    } else if (persona.id === "Puck") {
      if (/(guy|rishi|alex|andrew|brian|christopher|eric|roger|steffan|madhur|prabhat)/.test(name)) score += 85;
      if (vLang.includes("us") || vLang.includes("in")) score += 50;
    } else if (persona.id === "Zephyr") {
      if (vLang.includes("au") || vLang.includes("ie")) score += 75;
      if (/(karen|moira|natasha|catherine|ava|emma|jenny|sonia|serena|female)/.test(name)) score += 85;
    } else if (persona.id === "Aoede") {
      if (/(veena|lekha|swara|neerja|victoria|tessa|allison|samantha|aria|female)/.test(name)) score += 95;
    } else if (persona.id === "Charon") {
      if (/(fred|david|mark|richard|conrad|dmitry|thomas|hemant|valluvar|mohan|male)/.test(name)) score += 95;
    }

    if (persona.gender === "MALE" && /(male|guy|daniel|ryan|david|mark|rishi|madhur|prabhat|hemant)/.test(name)) {
      score += 55;
    } else if (persona.gender === "FEMALE" && /(female|aria|jenny|samantha|swara|neerja|veena|karen|moira|sonia)/.test(name)) {
      score += 55;
    }

    if (v.localService === false) score += 35;

    if (/(espeak|festival|compact|mbrola|klatt|speechd|robotic|basic)/.test(name)) {
      score -= 150;
    }

    return score;
  };

  const sorted = [...candidates].sort((a, b) => scoreVoice(b) - scoreVoice(a));
  // If multiple candidates tie at top, pick deterministic offset by persona index so they never collide
  if (sorted.length > 1 && Math.abs(scoreVoice(sorted[0]) - scoreVoice(sorted[1])) < 15) {
    const personaIdx = DRAVIS_VOICE_PROFILES.findIndex((p) => p.id === persona.id);
    return sorted[Math.max(0, personaIdx) % Math.min(sorted.length, 4)];
  }
  return sorted[0];
}

export class SpeechEngine {
  private recognition: any = null;
  private isListening: boolean = false;
  private wakeWord: string = "dravis";
  private isWakeWordActive: boolean = false;
  private activeAudioElement: HTMLAudioElement | null = null;
  private audioCtx: AudioContext | null = null;

  private currentListenOptions: ListenOptions | null = null;
  private currentWakeOptions: WakeWordOptions | null = null;
  private currentVoicePersona: VoicePersonaId = "Fenrir";
  private speechDebounceTimer: any = null;
  private accumulatedFinalTranscript: string = "";
  private isSpeakingNow: boolean = false;
  private lastSpokenText: string = "";
  private lastSpokenTimestamp: number = 0;
  private analyserNode: AnalyserNode | null = null;
  private freqDataBuffer: Uint8Array<ArrayBuffer> | null = null;
  private speechStartTimestamp: number = 0;
  private boundaryPulseTimestamp: number = 0;
  private currentBoundaryCharIndex: number = 0;
  private speakingStateListeners: Set<(speaking: boolean) => void> = new Set();
  private queueStateListeners: Set<(queueLength: number, speaking: boolean) => void> = new Set();

  // Asynchronous Speech Queue State
  private speechQueue: QueuedSpeechItem[] = [];
  private isProcessingQueue: boolean = false;
  private activeQueueItem: QueuedSpeechItem | null = null;
  private currentPlaybackAbort: (() => void) | null = null;

  // TTS Caching & Pre-loading Layer State
  private ttsAudioCache: Map<string, CachedTtsEntry> = new Map();
  private inFlightTtsRequests: Map<string, Promise<CachedTtsEntry | null>> = new Map();
  private cacheHits: number = 0;
  private cacheMisses: number = 0;
  private preloadedCount: number = 0;
  private hasTriggeredInitialWarmup: boolean = false;

  constructor() {
    this.initRecognition();
    this.hydrateCacheFromStorage();
    if (typeof window !== "undefined") {
      // Schedule non-blocking initial phrase pre-loading after app boot
      setTimeout(() => {
        this.warmUpCacheForPersona(this.currentVoicePersona, this.preferredLang, false);
      }, 2200);
    }
  }

  // ---------------------------------------------------------------------------
  // TTS CACHING & PRE-LOADING LAYER
  // ---------------------------------------------------------------------------

  private buildTtsCacheKey(
    cleanText: string,
    personaId: string,
    lang: string,
    isKids: boolean
  ): string {
    const normalizedText = cleanText.slice(0, 420).trim().toLowerCase();
    const normalizedLang = (lang || "AUTO_ADAPT").toLowerCase();
    return `${personaId.toLowerCase()}|${normalizedLang}|${isKids ? "kids" : "std"}|${normalizedText}`;
  }

  private hydrateCacheFromStorage() {
    if (typeof window === "undefined" || !window.sessionStorage) return;
    try {
      const raw = window.sessionStorage.getItem(TTS_SESSION_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Array<{
        cacheKey: string;
        audioBase64: string;
        mimeType: string;
        createdAt: number;
        hitCount: number;
      }>;
      if (!Array.isArray(parsed)) return;
      const now = Date.now();
      for (const item of parsed) {
        if (!item?.cacheKey || !item?.audioBase64) continue;
        const objectUrl = base64ToWavUrl(item.audioBase64, 24000, item.mimeType || "audio/mpeg");
        this.ttsAudioCache.set(item.cacheKey, {
          cacheKey: item.cacheKey,
          audioBase64: item.audioBase64,
          mimeType: item.mimeType || "audio/mpeg",
          objectUrl,
          createdAt: item.createdAt || now,
          lastAccessedAt: now,
          hitCount: item.hitCount || 0,
        });
      }
    } catch {}
  }

  private persistCacheToStorage() {
    if (typeof window === "undefined" || !window.sessionStorage) return;
    try {
      const entries = Array.from(this.ttsAudioCache.values())
        .sort((a, b) => b.hitCount - a.hitCount || b.lastAccessedAt - a.lastAccessedAt)
        .slice(0, MAX_STORAGE_CACHE_ENTRIES)
        .map((e) => ({
          cacheKey: e.cacheKey,
          audioBase64: e.audioBase64,
          mimeType: e.mimeType,
          createdAt: e.createdAt,
          hitCount: e.hitCount,
        }));
      window.sessionStorage.setItem(TTS_SESSION_STORAGE_KEY, JSON.stringify(entries));
    } catch {}
  }

  private storeInTtsCache(
    cacheKey: string,
    audioBase64: string,
    mimeType = "audio/mpeg",
    isPreload = false
  ): CachedTtsEntry {
    const existing = this.ttsAudioCache.get(cacheKey);
    if (existing) {
      existing.lastAccessedAt = Date.now();
      return existing;
    }

    // Evict least-recently-used entry when exceeding capacity
    if (this.ttsAudioCache.size >= MAX_MEMORY_CACHE_ENTRIES) {
      let oldestKey: string | null = null;
      let oldestTime = Infinity;
      this.ttsAudioCache.forEach((val, key) => {
        if (val.lastAccessedAt < oldestTime) {
          oldestTime = val.lastAccessedAt;
          oldestKey = key;
        }
      });
      if (oldestKey) {
        const evicted = this.ttsAudioCache.get(oldestKey);
        if (evicted?.objectUrl && evicted.objectUrl.startsWith("blob:")) {
          try {
            URL.revokeObjectURL(evicted.objectUrl);
          } catch {}
        }
        this.ttsAudioCache.delete(oldestKey);
      }
    }

    const now = Date.now();
    const objectUrl = base64ToWavUrl(audioBase64, 24000, mimeType);
    const entry: CachedTtsEntry = {
      cacheKey,
      audioBase64,
      mimeType,
      objectUrl,
      createdAt: now,
      lastAccessedAt: now,
      hitCount: 0,
    };
    this.ttsAudioCache.set(cacheKey, entry);
    if (isPreload) {
      this.preloadedCount += 1;
    }
    this.persistCacheToStorage();
    return entry;
  }

  /**
   * Retrieves a cached TTS entry or fetches it from `/api/tts` with in-flight deduplication.
   */
  private async getOrFetchTtsAudio(
    cleanText: string,
    persona: VoicePersonaProfile,
    requestedLang: string,
    isKids: boolean,
    timeoutMs = 1100,
    isPreload = false
  ): Promise<CachedTtsEntry | null> {
    if (typeof window === "undefined" || !cleanText || persona.id === ("System" as any)) {
      return null;
    }

    const cacheKey = this.buildTtsCacheKey(cleanText, persona.id, requestedLang, isKids);
    const cached = this.ttsAudioCache.get(cacheKey);
    if (cached) {
      cached.lastAccessedAt = Date.now();
      cached.hitCount += 1;
      if (!isPreload) {
        this.cacheHits += 1;
      }
      return cached;
    }

    if (!isPreload) {
      this.cacheMisses += 1;
    }

    const existingInFlight = this.inFlightTtsRequests.get(cacheKey);
    if (existingInFlight) {
      return existingInFlight;
    }

    const fetchPromise = (async (): Promise<CachedTtsEntry | null> => {
      try {
        const res = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal:
            typeof AbortSignal !== "undefined" && AbortSignal.timeout
              ? AbortSignal.timeout(timeoutMs)
              : undefined,
          body: JSON.stringify({
            text: cleanText.slice(0, 420),
            voice: persona.id,
            accentTld: persona.accentTld,
            lang: requestedLang,
            kidsFriendlyMode: isKids,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data?.audioBase64) {
            return this.storeInTtsCache(
              cacheKey,
              data.audioBase64,
              data.mimeType || "audio/mpeg",
              isPreload
            );
          }
        }
      } catch {
        // Network or timeout fallback handled by caller
      } finally {
        this.inFlightTtsRequests.delete(cacheKey);
      }
      return null;
    })();

    this.inFlightTtsRequests.set(cacheKey, fetchPromise);
    return fetchPromise;
  }

  /**
   * Pre-loads an array of frequently used phrases into the TTS cache in staggered background batches
   * so conversational responses play with near-zero latency.
   */
  public async preloadPhrases(
    phrases: string[] = DEFAULT_PRELOAD_PHRASES,
    options?: { voiceName?: string; lang?: string; kidsFriendlyMode?: boolean }
  ): Promise<void> {
    if (typeof window === "undefined" || !Array.isArray(phrases) || phrases.length === 0) return;

    const isKids = Boolean(options?.kidsFriendlyMode);
    const voiceName = isKids ? "Aoede" : options?.voiceName || this.currentVoicePersona || "Puck";
    if (voiceName === "System") return;

    const persona = getVoicePersonaProfile(voiceName, isKids);
    const requestedLang = options?.lang || this.preferredLang || "AUTO_ADAPT";

    for (const rawPhrase of phrases) {
      // Yield if active speech or queue processing is happening so preloading never contends with live responses
      if (this.isSpeakingNow || this.speechQueue.length > 0) {
        await new Promise((r) => setTimeout(r, 900));
      }
      const clean = cleanSpokenText(rawPhrase);
      if (!clean) continue;

      const cacheKey = this.buildTtsCacheKey(clean, persona.id, requestedLang, isKids);
      if (this.ttsAudioCache.has(cacheKey) || this.inFlightTtsRequests.has(cacheKey)) {
        continue;
      }

      await this.getOrFetchTtsAudio(clean, persona, requestedLang, isKids, 1800, true);
      // Small stagger between background preloads
      await new Promise((r) => setTimeout(r, 220));
    }
  }

  /**
   * Warms up the TTS cache for a given voice persona and language setting.
   */
  public warmUpCacheForPersona(
    voiceName?: string,
    lang?: string,
    kidsFriendlyMode?: boolean,
    extraPhrases?: string[]
  ): void {
    const combined = extraPhrases
      ? Array.from(new Set([...extraPhrases, ...DEFAULT_PRELOAD_PHRASES]))
      : DEFAULT_PRELOAD_PHRASES;
    this.hasTriggeredInitialWarmup = true;
    void this.preloadPhrases(combined.slice(0, 12), {
      voiceName: voiceName || this.currentVoicePersona,
      lang: lang || this.preferredLang,
      kidsFriendlyMode,
    });
  }

  public getCacheStats(): TtsCacheStats {
    return {
      size: this.ttsAudioCache.size,
      hits: this.cacheHits,
      misses: this.cacheMisses,
      preloadedCount: this.preloadedCount,
      queueLength: this.speechQueue.length + (this.activeQueueItem ? 1 : 0),
    };
  }

  // ---------------------------------------------------------------------------
  // SPEAKING & QUEUE STATE SUBSCRIPTIONS
  // ---------------------------------------------------------------------------

  public isSpeaking(): boolean {
    return this.isSpeakingNow;
  }

  public getQueueLength(): number {
    return this.speechQueue.length + (this.activeQueueItem ? 1 : 0);
  }

  public getQueueSnapshot(): Array<{ id: string; text: string; status: "PENDING" | "SPEAKING" }> {
    const list: Array<{ id: string; text: string; status: "PENDING" | "SPEAKING" }> = [];
    if (this.activeQueueItem) {
      list.push({
        id: this.activeQueueItem.id,
        text: this.activeQueueItem.cleanText,
        status: "SPEAKING",
      });
    }
    for (const item of this.speechQueue) {
      list.push({
        id: item.id,
        text: item.cleanText,
        status: item.status,
      });
    }
    return list;
  }

  public subscribeSpeakingState(listener: (speaking: boolean) => void): () => void {
    this.speakingStateListeners.add(listener);
    return () => {
      this.speakingStateListeners.delete(listener);
    };
  }

  public subscribeQueueState(
    listener: (queueLength: number, speaking: boolean) => void
  ): () => void {
    this.queueStateListeners.add(listener);
    return () => {
      this.queueStateListeners.delete(listener);
    };
  }

  private notifySpeakingState(speaking: boolean) {
    this.speakingStateListeners.forEach((cb) => {
      try {
        cb(speaking);
      } catch {}
    });
    this.notifyQueueState();
  }

  private notifyQueueState() {
    const totalLen = this.getQueueLength();
    this.queueStateListeners.forEach((cb) => {
      try {
        cb(totalLen, this.isSpeakingNow);
      } catch {}
    });
  }

  /**
   * Returns the current normalized speech output volume in [0, 1].
   * Uses the real Web Audio AnalyserNode when playing neural TTS audio,
   * or a syllable-cadence acoustic envelope during native Web Speech synthesis.
   */
  public getOutputVolume(): number {
    if (!this.isSpeakingNow) return 0;

    if (this.analyserNode && this.freqDataBuffer && this.activeAudioElement && !this.activeAudioElement.paused) {
      try {
        this.analyserNode.getByteFrequencyData(this.freqDataBuffer);
        let sum = 0;
        const len = this.freqDataBuffer.length;
        for (let i = 0; i < len; i++) {
          sum += this.freqDataBuffer[i];
        }
        const avg = sum / (len * 255);
        if (avg > 0.01) {
          return Math.min(1, avg * 2.35);
        }
      } catch {}
    }

    // Syllable-envelope fallback when using browser native SpeechSynthesisUtterance
    const now = performance.now();
    const elapsedSec = (now - this.speechStartTimestamp) / 1000;
    const sinceBoundaryMs = now - this.boundaryPulseTimestamp;
    const boundaryBoost = sinceBoundaryMs < 180 ? (1 - sinceBoundaryMs / 180) * 0.35 : 0;

    // Natural 4.5 Hz syllable cadence + 1.7 Hz prosody contour
    const syllableWave =
      0.42 +
      0.28 * Math.sin(elapsedSec * 28.0 + this.currentBoundaryCharIndex * 0.5) +
      0.18 * Math.sin(elapsedSec * 11.5) +
      0.12 * Math.cos(elapsedSec * 43.0) +
      boundaryBoost;

    return Math.max(0.08, Math.min(1, syllableWave));
  }

  /**
   * Returns an array of normalized bar heights in [0.12, 1.0] for waveform visualization
   * driven by the current speechEngine output volume and frequency distribution.
   */
  public getOutputWaveformBands(barCount = 9): number[] {
    if (!this.isSpeakingNow) {
      return Array.from({ length: barCount }, () => 0.12);
    }

    const volume = this.getOutputVolume();

    if (this.analyserNode && this.freqDataBuffer && this.activeAudioElement && !this.activeAudioElement.paused) {
      try {
        this.analyserNode.getByteFrequencyData(this.freqDataBuffer);
        const bands: number[] = [];
        const usableBins = Math.max(barCount, Math.floor(this.freqDataBuffer.length * 0.75));
        for (let i = 0; i < barCount; i++) {
          // Center-weighted symmetric vocal formant mapping
          const distFromCenter = Math.abs(i - (barCount - 1) / 2) / ((barCount - 1) / 2 || 1);
          const binIdx = Math.min(
            this.freqDataBuffer.length - 1,
            Math.floor(distFromCenter * (usableBins - 1))
          );
          const rawVal = this.freqDataBuffer[binIdx] / 255;
          const shaped = Math.max(0.14, Math.min(1, rawVal * 1.85 * (1 - distFromCenter * 0.28)));
          bands.push(shaped);
        }
        if (bands.some((b) => b > 0.16)) {
          return bands;
        }
      } catch {}
    }

    // Realistic vocal formant distribution modulated by real-time speech output volume
    const nowSec = performance.now() / 1000;
    return Array.from({ length: barCount }, (_, i) => {
      const centerWeight = 1 - Math.abs(i - (barCount - 1) / 2) / ((barCount - 1) / 2 + 0.8);
      const harmonic =
        0.5 +
        0.32 * Math.sin(nowSec * (22 + i * 3.7) + i * 1.1) +
        0.18 * Math.cos(nowSec * (13 + i * 2.3) - i * 0.7);
      return Math.max(0.14, Math.min(1, volume * (0.35 + centerWeight * 0.65) * (0.65 + harmonic * 0.55)));
    });
  }

  public setVoicePersona(personaId: VoicePersonaId | string) {
    const valid = DRAVIS_VOICE_PROFILES.find(
      (v) => v.id.toLowerCase() === String(personaId || "Fenrir").toLowerCase()
    );
    const nextPersona = valid ? valid.id : (personaId as VoicePersonaId) || "Fenrir";
    const changed = this.currentVoicePersona !== nextPersona;
    this.currentVoicePersona = nextPersona;
    if (changed && this.hasTriggeredInitialWarmup) {
      this.warmUpCacheForPersona(this.currentVoicePersona, this.preferredLang, false);
    }
  }

  public getVoicePersona(): VoicePersonaId {
    return this.currentVoicePersona;
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.audioCtx) {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      if (Ctx) {
        try {
          this.audioCtx = new Ctx();
        } catch {}
      }
    }
    if (this.audioCtx && this.audioCtx.state === "suspended") {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  private initRecognition() {
    if (typeof window === "undefined") return;
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = "en-US";

      this.recognition.onstart = () => {
        this.isListening = true;
      };

      this.recognition.onend = () => {
        this.isListening = false;
        this.currentListenOptions?.onEnd?.();

        if (this.isWakeWordActive && !this.isSpeakingNow) {
          setTimeout(() => {
            if (this.isWakeWordActive && !this.isListening && !this.isSpeakingNow) {
              try {
                this.recognition.start();
              } catch {}
            }
          }, 350);
        }
      };

      this.recognition.onresult = (event: any) => {
        // Ignore microphone input while Dravis is actively speaking to prevent voice loops
        if (this.isSpeakingNow) return;

        let interimTranscript = "";
        let finalTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        const fullText = (this.accumulatedFinalTranscript + " " + (finalTranscript || interimTranscript)).trim();
        const lowerText = fullText.toLowerCase();

        const wakeWordMatches = [
          "hey dravis",
          "ok dravis",
          "okay dravis",
          "hello dravis",
          "hi dravis",
          "dravis",
          this.wakeWord,
          "hey " + this.wakeWord,
        ];

        const matchedWord = wakeWordMatches.find((w) => lowerText.includes(w));

        if (this.isWakeWordActive && !this.currentListenOptions && matchedWord && finalTranscript) {
          this.currentWakeOptions?.onWakeWordDetected?.();
          return;
        }

        if (finalTranscript && this.currentListenOptions) {
          this.accumulatedFinalTranscript = (this.accumulatedFinalTranscript + " " + finalTranscript).trim();
          this.currentListenOptions.onResult?.(this.accumulatedFinalTranscript, false);

          if (this.speechDebounceTimer) {
            clearTimeout(this.speechDebounceTimer);
          }

          // Extended listening buffer (1400ms debounce): avoids cutting off sentences when speaking phone numbers or long phrases
          this.speechDebounceTimer = setTimeout(() => {
            if (this.accumulatedFinalTranscript && this.currentListenOptions) {
              const callback = this.currentListenOptions.onResult;
              const fullResult = this.accumulatedFinalTranscript.trim();
              this.accumulatedFinalTranscript = "";
              this.currentListenOptions = null;
              callback?.(fullResult, true);
            }
          }, 1400);
        } else if (interimTranscript && this.currentListenOptions) {
          if (this.speechDebounceTimer) {
            clearTimeout(this.speechDebounceTimer);
            this.speechDebounceTimer = null;
          }
          const liveText = (this.accumulatedFinalTranscript + " " + interimTranscript).trim();
          this.currentListenOptions.onResult?.(liveText, false);
        }
      };

      this.recognition.onerror = (e: any) => {
        const errorType = e?.error || "unknown";
        if (errorType === "no-speech" || errorType === "aborted") {
          return;
        }
        if (errorType === "not-allowed" || errorType === "service-not-allowed" || errorType === "audio-capture") {
          this.isWakeWordActive = false;
        }
        this.currentListenOptions?.onError?.({
          type: errorType,
          message: e?.message || `Speech recognition error: ${errorType}`,
        });
      };
    }
  }

  private preferredLang: string = "AUTO_ADAPT";

  public setLanguage(bcp47: string) {
    if (bcp47) {
      this.preferredLang = bcp47;
    }
    if (this.recognition && bcp47 && bcp47 !== "AUTO_ADAPT") {
      try {
        this.recognition.lang = bcp47 === "hinglish" ? "en-IN" : bcp47;
      } catch {}
    }
  }

  public startListening(options?: ListenOptions) {
    this.stopSpeech();
    this.accumulatedFinalTranscript = "";
    if (this.speechDebounceTimer) {
      clearTimeout(this.speechDebounceTimer);
      this.speechDebounceTimer = null;
    }
    this.currentListenOptions = options || null;
    if (options?.lang && options.lang !== "AUTO_ADAPT") {
      this.setLanguage(options.lang);
    }
    if (this.recognition && !this.isListening) {
      try {
        this.recognition.start();
      } catch {}
    }
  }

  public stopListening() {
    if (this.speechDebounceTimer) {
      clearTimeout(this.speechDebounceTimer);
      this.speechDebounceTimer = null;
    }
    if (this.accumulatedFinalTranscript && this.currentListenOptions) {
      const cb = this.currentListenOptions.onResult;
      const text = this.accumulatedFinalTranscript.trim();
      this.accumulatedFinalTranscript = "";
      this.currentListenOptions = null;
      cb?.(text, true);
    } else {
      this.currentListenOptions = null;
    }
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch {}
    }
  }

  public stop() {
    this.stopSpeech();
    this.stopListening();
  }

  public startWakeWordListener(options: WakeWordOptions) {
    this.wakeWord = (options.wakeWord || "dravis").toLowerCase();
    this.currentWakeOptions = options;
    this.isWakeWordActive = true;
    if (this.recognition && !this.isListening && !this.isSpeakingNow) {
      try {
        this.recognition.start();
      } catch {}
    }
  }

  public stopWakeWordListener() {
    this.isWakeWordActive = false;
    this.currentWakeOptions = null;
  }

  private activeUtterance: SpeechSynthesisUtterance | null = null;

  public async previewVoicePersona(
    voiceId: VoicePersonaId,
    langCode = "en-US",
    customSpeed = 1.0,
    customPitch = 1.0
  ): Promise<void> {
    const profile = getVoicePersonaProfile(voiceId, false);
    const isHindiOrHinglish =
      langCode === "hi-IN" || langCode === "hinglish" || langCode === "mr-IN";
    const sampleText = isHindiOrHinglish ? profile.previewTextHi : profile.previewTextEn;
    return this.speak(sampleText, {
      voiceName: voiceId,
      rate: customSpeed,
      pitch: customPitch,
      lang: langCode,
      emotion: "HAPPY",
      interrupt: true,
    });
  }

  private inferEmotionFromText(text: string, explicitEmotion?: string): string {
    if (explicitEmotion && explicitEmotion !== "CALM") return explicitEmotion.toUpperCase();
    const lower = text.toLowerCase();
    if (/\b(sorry|sad|dukh|udaas|unfortunately|maaf|afsos|miss|hurt|pain)\b/i.test(lower)) {
      return "SAD";
    }
    if (/\b(warning|alert|urgent|critical|error|danger|gussa|angry|stop)\b/i.test(lower)) {
      return "ANGRY";
    }
    if (/\b(love|care|pyaar|dost|friend|sweet|welcome|always here|apna khayal)\b/i.test(lower)) {
      return "AFFECTIONATE";
    }
    if (/\b(interesting|discover|wonder|question|kya|kaise|why|how|explore|curious)\b/i.test(lower)) {
      return "CURIOUS";
    }
    if (/\b(awesome|great|excited|ready|completed|badhai|shandar|wah|music|play|enjoy)\b/i.test(lower)) {
      return "EXCITED";
    }
    return "HAPPY";
  }

  // ---------------------------------------------------------------------------
  // ASYNCHRONOUS SPEECH QUEUING MECHANISM
  // ---------------------------------------------------------------------------

  /**
   * Enqueues a voice response into the asynchronous speech queue and processes
   * queued items sequentially so multiple responses never overlap or cut each other off.
   * Immediately initiates background TTS pre-fetching upon enqueueing to minimize latency.
   */
  public async speak(text: string, options?: SpeechOptions): Promise<void> {
    return this.enqueueSpeech(text, options);
  }

  public async enqueueSpeech(text: string, options?: SpeechOptions): Promise<void> {
    if (typeof window === "undefined" || !text) {
      options?.onEnd?.();
      return;
    }

    const cleanText = cleanSpokenText(text);
    if (!cleanText) {
      options?.onEnd?.();
      return;
    }

    const now = Date.now();
    // Deduplicate identical speech requests within 1800ms or already sitting in the queue
    const isDuplicateInQueue =
      (this.activeQueueItem && this.activeQueueItem.cleanText === cleanText) ||
      this.speechQueue.some((item) => item.cleanText === cleanText);

    if (
      !options?.interrupt &&
      (isDuplicateInQueue ||
        (this.lastSpokenText === cleanText && now - this.lastSpokenTimestamp < 1800))
    ) {
      options?.onEnd?.();
      return;
    }

    this.lastSpokenText = cleanText;
    this.lastSpokenTimestamp = now;

    // If caller requested immediate interruption (e.g., voice preview), flush current queue first
    if (options?.interrupt) {
      this.stopSpeech();
    }

    // Immediately kick off non-blocking TTS audio pre-fetch so audio is ready in cache
    // before the previous queued item finishes speaking
    const isKids = Boolean(options?.kidsFriendlyMode);
    const voiceName = isKids ? "Aoede" : options?.voiceName || this.currentVoicePersona || "Puck";
    const persona = getVoicePersonaProfile(voiceName, isKids);
    const requestedLang = options?.lang || this.preferredLang || "AUTO_ADAPT";

    const prefetchedEntryPromise =
      voiceName === "System"
        ? Promise.resolve(null)
        : this.getOrFetchTtsAudio(cleanText, persona, requestedLang, isKids, 1100, false);

    return new Promise<void>((resolve) => {
      const queueItem: QueuedSpeechItem = {
        id: `tts-${now}-${Math.random().toString(36).slice(2, 7)}`,
        rawText: text,
        cleanText,
        options,
        enqueuedAt: now,
        status: "PENDING",
        prefetchedEntryPromise,
        resolve,
      };

      if (options?.priority === "HIGH") {
        this.speechQueue.unshift(queueItem);
      } else {
        this.speechQueue.push(queueItem);
      }

      this.notifyQueueState();
      void this.processSpeechQueue();
    });
  }

  public clearQueue() {
    while (this.speechQueue.length > 0) {
      const item = this.speechQueue.shift();
      if (item) {
        try {
          item.options?.onEnd?.();
        } catch {}
        item.resolve();
      }
    }
    this.notifyQueueState();
  }

  private async processSpeechQueue(): Promise<void> {
    if (this.isProcessingQueue) return;
    this.isProcessingQueue = true;

    try {
      while (this.speechQueue.length > 0) {
        const nextItem = this.speechQueue.shift();
        if (!nextItem) continue;

        this.activeQueueItem = nextItem;
        nextItem.status = "SPEAKING";
        this.notifyQueueState();

        await this.executeSingleSpeechItem(nextItem);

        this.activeQueueItem = null;
        nextItem.resolve();
        this.notifyQueueState();
      }
    } finally {
      this.isProcessingQueue = false;
      this.activeQueueItem = null;
      if (this.speechQueue.length === 0 && !this.isSpeakingNow) {
        if (this.isWakeWordActive && this.recognition && !this.isListening) {
          setTimeout(() => {
            if (this.isWakeWordActive && !this.isListening && !this.isSpeakingNow) {
              try {
                this.recognition.start();
              } catch {}
            }
          }, 350);
        }
      }
      this.notifyQueueState();
    }
  }

  private async executeSingleSpeechItem(item: QueuedSpeechItem): Promise<void> {
    const { cleanText, options, prefetchedEntryPromise } = item;

    this.isSpeakingNow = true;
    this.speechStartTimestamp = typeof performance !== "undefined" ? performance.now() : Date.now();
    this.boundaryPulseTimestamp = this.speechStartTimestamp;
    this.currentBoundaryCharIndex = 0;
    this.notifySpeakingState(true);

    // Pause active speech recognition while Dravis is speaking so microphone never loops back
    if (this.recognition && this.isListening && !this.currentListenOptions) {
      try {
        this.recognition.stop();
      } catch {}
    }

    try {
      options?.onStart?.();
    } catch {}

    const isKids = Boolean(options?.kidsFriendlyMode);
    const voiceName = isKids ? "Aoede" : options?.voiceName || this.currentVoicePersona || "Puck";
    const persona = getVoicePersonaProfile(voiceName, isKids);
    const activeEmotion = this.inferEmotionFromText(cleanText, options?.emotion);

    // Friendly, expressive emotional prosody adjustments
    let emotionRateMult = 1.02;
    let emotionPitchMult = 1.03;
    let warmthLowBoost = 2.0;
    let presenceMidBoost = 1.5;

    if (activeEmotion === "HAPPY" || activeEmotion === "PLAYFUL") {
      emotionRateMult = 1.04;
      emotionPitchMult = 1.06;
      warmthLowBoost = 2.2;
      presenceMidBoost = 2.0;
    } else if (activeEmotion === "EXCITED") {
      emotionRateMult = 1.07;
      emotionPitchMult = 1.09;
      warmthLowBoost = 1.8;
      presenceMidBoost = 2.5;
    } else if (activeEmotion === "AFFECTIONATE" || activeEmotion === "COMFORTING") {
      emotionRateMult = 0.97;
      emotionPitchMult = 1.03;
      warmthLowBoost = 3.5;
      presenceMidBoost = 1.2;
    } else if (activeEmotion === "SAD" || activeEmotion === "EMPATHETIC") {
      emotionRateMult = 0.92;
      emotionPitchMult = 0.94;
      warmthLowBoost = 3.2;
      presenceMidBoost = 0.5;
    } else if (activeEmotion === "ANGRY" || activeEmotion === "PROTECTIVE") {
      emotionRateMult = 1.05;
      emotionPitchMult = 0.93;
      warmthLowBoost = 3.8;
      presenceMidBoost = 2.8;
    } else if (activeEmotion === "CURIOUS") {
      emotionRateMult = 1.02;
      emotionPitchMult = 1.05;
      warmthLowBoost = 2.0;
      presenceMidBoost = 1.8;
    }

    const userRate = options?.rate && Math.abs(options.rate - 1.15) > 0.01 ? options.rate : 1.0;
    const userPitch = options?.pitch || 1.0;

    const effectiveSpeed = Math.max(0.84, Math.min(1.35, userRate * persona.baseRate * emotionRateMult));
    const effectivePitch = Math.max(0.85, Math.min(1.25, userPitch * persona.pitchRatio * emotionPitchMult));
    const requestedLang = options?.lang || this.preferredLang || "AUTO_ADAPT";

    let finished = false;
    const finalizeItem = () => {
      if (finished) return;
      finished = true;
      this.currentPlaybackAbort = null;
      const hasMoreQueued = this.speechQueue.length > 0;
      if (!hasMoreQueued) {
        this.isSpeakingNow = false;
        this.notifySpeakingState(false);
      }
      try {
        options?.onEnd?.();
      } catch {}
    };

    const wrappedOptions: SpeechOptions = {
      ...options,
      onEnd: finalizeItem,
    };

    if (voiceName === "System") {
      await this.fallbackWebSpeech(cleanText, effectiveSpeed, effectivePitch, wrappedOptions);
      return;
    }

    // 1. Resolve pre-fetched or cached TTS entry (zero latency on cache hit or pre-fetched queue item!)
    try {
      const ttsEntry =
        (await (prefetchedEntryPromise ||
          this.getOrFetchTtsAudio(cleanText, persona, requestedLang, isKids, 1100, false))) ||
        null;

      // Check if speech was stopped while awaiting TTS
      if (!this.isSpeakingNow && this.activeQueueItem?.id !== item.id) {
        finalizeItem();
        return;
      }

      if (ttsEntry && ttsEntry.objectUrl) {
        const audio = new Audio(ttsEntry.objectUrl);
        audio.crossOrigin = "anonymous";

        if ("preservesPitch" in audio) (audio as any).preservesPitch = true;
        if ("mozPreservesPitch" in audio) (audio as any).mozPreservesPitch = true;
        if ("webkitPreservesPitch" in audio) (audio as any).webkitPreservesPitch = true;
        audio.playbackRate = Math.max(0.88, Math.min(1.22, effectiveSpeed));

        // Connect Warm Studio EQ (Low-Shelf Warmth + Friendly Mid Presence + Crisp Air)
        try {
          const ctx = this.getAudioContext();
          if (ctx) {
            const source = ctx.createMediaElementSource(audio);
            const lowShelf = ctx.createBiquadFilter();
            lowShelf.type = "lowshelf";
            lowShelf.frequency.value = 185;
            lowShelf.gain.value = warmthLowBoost;

            const midPeak = ctx.createBiquadFilter();
            midPeak.type = "peaking";
            midPeak.frequency.value = 2200;
            midPeak.Q.value = 1.0;
            midPeak.gain.value = presenceMidBoost;

            const highShelf = ctx.createBiquadFilter();
            highShelf.type = "highshelf";
            highShelf.frequency.value = 4500;
            highShelf.gain.value = 1.8;

            if (!this.analyserNode) {
              this.analyserNode = ctx.createAnalyser();
              this.analyserNode.fftSize = 64;
              this.analyserNode.smoothingTimeConstant = 0.72;
              this.freqDataBuffer = new Uint8Array(this.analyserNode.frequencyBinCount);
            }

            source.connect(lowShelf);
            lowShelf.connect(midPeak);
            midPeak.connect(highShelf);
            highShelf.connect(this.analyserNode);
            this.analyserNode.connect(ctx.destination);
          }
        } catch {
          // Direct audio output if AudioContext graph is unavailable
        }

        this.activeAudioElement = audio;

        await new Promise<void>((resolve) => {
          let settled = false;
          const finishAudio = () => {
            if (settled) return;
            settled = true;
            this.activeAudioElement = null;
            finalizeItem();
            resolve();
          };

          this.currentPlaybackAbort = finishAudio;

          audio.onended = finishAudio;
          audio.onerror = () => {
            if (settled) return;
            settled = true;
            this.activeAudioElement = null;
            this.fallbackWebSpeech(cleanText, effectiveSpeed, effectivePitch, wrappedOptions).then(resolve);
          };

          audio.play().catch(() => {
            if (settled) return;
            settled = true;
            this.activeAudioElement = null;
            this.fallbackWebSpeech(cleanText, effectiveSpeed, effectivePitch, wrappedOptions).then(resolve);
          });
        });
        return;
      }
    } catch {
      // Fall through to browser speech
    }

    // 2. Client Web Speech Synthesis fallback with Persona & Emotion-Aware Voice Ranker
    await this.fallbackWebSpeech(cleanText, effectiveSpeed, effectivePitch, wrappedOptions);
  }

  private fallbackWebSpeech(
    text: string,
    speed: number,
    pitch: number,
    options?: SpeechOptions
  ): Promise<void> {
    return new Promise((resolve) => {
      if (typeof window === "undefined" || !window.speechSynthesis) {
        this.isSpeakingNow = false;
        options?.onEnd?.();
        resolve();
        return;
      }

      try {
        window.speechSynthesis.cancel();
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
      } catch {}

      const utterance = new SpeechSynthesisUtterance(text);
      this.activeUtterance = utterance;

      const voices = window.speechSynthesis.getVoices();
      const persona = getVoicePersonaProfile(options?.voiceName, options?.kidsFriendlyMode);

      let targetLang =
        options?.lang && options.lang !== "AUTO_ADAPT"
          ? options.lang === "hinglish"
            ? "hi-IN"
            : options.lang
          : persona.id === "Fenrir"
          ? "en-GB"
          : persona.id === "Kore" || persona.id === "Aoede"
          ? "en-IN"
          : persona.id === "Zephyr"
          ? "en-AU"
          : "en-US";

      if (/[\u0B80-\u0BFF]/.test(text)) targetLang = "ta-IN";
      else if (/[\u0C00-\u0C7F]/.test(text)) targetLang = "te-IN";
      else if (/[\u0980-\u09FF]/.test(text)) targetLang = "bn-IN";
      else if (/[\u0A80-\u0AFF]/.test(text)) targetLang = "gu-IN";
      else if (/[\u0C80-\u0CFF]/.test(text)) targetLang = "kn-IN";
      else if (/[\u0D00-\u0D7F]/.test(text)) targetLang = "ml-IN";
      else if (/[\u0A00-\u0A7F]/.test(text)) targetLang = "pa-IN";
      else if (/[\u0B00-\u0B7F]/.test(text)) targetLang = "or-IN";
      else if (/[\u0900-\u097F]/.test(text)) {
        targetLang = /(?:आहे|नाही|माझ्या|तुम्ही|मराठी)/.test(text) ? "mr-IN" : "hi-IN";
      } else if (/[\u3040-\u309F\u30A0-\u30FF]/.test(text)) targetLang = "ja-JP";
      else if (/[\uAC00-\uD7AF\u1100-\u11FF]/.test(text)) targetLang = "ko-KR";
      else if (/[\u4E00-\u9FFF]/.test(text)) targetLang = "zh-CN";
      else if (/[\u0600-\u06FF]/.test(text)) {
        targetLang = /(?:ہے|ہیں|کیا|میں|آپ)/.test(text) ? "ur-IN" : "ar-SA";
      } else if (/[\u0400-\u04FF]/.test(text)) targetLang = "ru-RU";
      else if (/[\u0E00-\u0E7F]/.test(text)) targetLang = "th-TH";
      else if (/[\u0370-\u03FF]/.test(text)) targetLang = "el-GR";
      else if (/[\u0590-\u05FF]/.test(text)) targetLang = "he-IL";
      else if (
        /\b(kya|kaise|kaisa|kaisi|hai|hain|mein|main|mujhe|mujhko|tum|aap|aapka|mera|meri|hum|aur|nahi|nhi|haan|acha|accha|theek|thik|batao|banao|karo|krdo|kardo|chahiye|dekho|suno|yaar|bhai|dost|namaste|shukriya|dhanyawad|bahut|bohot|ekdam|bilkul|awaaz|awaz)\b/i.test(
          text
        )
      ) {
        targetLang = "hi-IN";
      }

      utterance.lang = targetLang;
      const isNonEnglish = !targetLang.toLowerCase().startsWith("en");
      utterance.rate = isNonEnglish && Math.abs(speed - 1.0) < 0.05 ? 1.0 * persona.baseRate : speed;
      utterance.pitch = pitch;

      const bestVoice = selectBestHumanVoice(
        voices,
        targetLang,
        Boolean(options?.kidsFriendlyMode),
        persona.id
      );
      if (bestVoice) {
        utterance.voice = bestVoice;
      }

      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        this.currentPlaybackAbort = null;
        if (this.speechQueue.length === 0) {
          this.isSpeakingNow = false;
          this.notifySpeakingState(false);
        }
        this.activeUtterance = null;
        options?.onEnd?.();
        resolve();
      };

      this.currentPlaybackAbort = () => {
        clearTimeout(safetyTimeout);
        finish();
      };

      utterance.onboundary = (ev: SpeechSynthesisEvent) => {
        this.boundaryPulseTimestamp = typeof performance !== "undefined" ? performance.now() : Date.now();
        this.currentBoundaryCharIndex = ev.charIndex || 0;
      };
      utterance.onend = () => {
        clearTimeout(safetyTimeout);
        finish();
      };
      utterance.onerror = () => {
        clearTimeout(safetyTimeout);
        finish();
      };

      const safetyTimeout = setTimeout(finish, Math.max(6000, text.length * 110));

      try {
        window.speechSynthesis.speak(utterance);
      } catch {
        clearTimeout(safetyTimeout);
        finish();
      }
    });
  }

  public stopSpeech() {
    this.clearQueue();
    const wasSpeaking = this.isSpeakingNow;
    this.isSpeakingNow = false;
    if (this.activeAudioElement) {
      try {
        this.activeAudioElement.pause();
      } catch {}
      this.activeAudioElement = null;
    }
    this.activeUtterance = null;
    if (typeof window !== "undefined" && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
    if (this.currentPlaybackAbort) {
      const abortFn = this.currentPlaybackAbort;
      this.currentPlaybackAbort = null;
      try {
        abortFn();
      } catch {}
    }
    if (wasSpeaking) {
      this.notifySpeakingState(false);
    }
  }
}

export const speechEngine = new SpeechEngine();
export const speechService = speechEngine;

