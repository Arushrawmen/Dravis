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
  kidsFriendlyMode?: boolean;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: () => void;
}

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

  constructor() {
    this.initRecognition();
  }

  public setVoicePersona(personaId: VoicePersonaId | string) {
    const valid = DRAVIS_VOICE_PROFILES.find(
      (v) => v.id.toLowerCase() === String(personaId || "Fenrir").toLowerCase()
    );
    this.currentVoicePersona = valid ? valid.id : (personaId as VoicePersonaId) || "Fenrir";
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

        if (this.isWakeWordActive) {
          setTimeout(() => {
            if (this.isWakeWordActive && !this.isListening) {
              try {
                this.recognition.start();
              } catch {}
            }
          }, 300);
        }
      };

      this.recognition.onresult = (event: any) => {
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

        const fullText = (finalTranscript || interimTranscript).trim();
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
          const callback = this.currentListenOptions.onResult;
          this.currentListenOptions = null;
          callback?.(finalTranscript.trim(), true);
        } else if (interimTranscript && this.currentListenOptions) {
          this.currentListenOptions.onResult?.(interimTranscript.trim(), false);
        }
      };

      this.recognition.onerror = (e: any) => {
        const errorType = e?.error || "unknown";
        if (errorType === "no-speech" || errorType === "aborted") {
          return;
        }
        if (errorType === "not-allowed" || errorType === "service-not-allowed") {
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
    this.currentListenOptions = null;
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
    if (this.recognition && !this.isListening) {
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
    });
  }

  public async speak(text: string, options?: SpeechOptions): Promise<void> {
    if (typeof window === "undefined" || !text) return;

    this.stopSpeech();
    options?.onStart?.();

    const cleanText = cleanSpokenText(text);
    if (!cleanText) {
      options?.onEnd?.();
      return;
    }

    const isKids = Boolean(options?.kidsFriendlyMode);
    const voiceName = isKids ? "Aoede" : (options?.voiceName || this.currentVoicePersona || "Fenrir");
    const persona = getVoicePersonaProfile(voiceName, isKids);

    const userRate = options?.rate && Math.abs(options.rate - 1.15) > 0.01 ? options.rate : 1.0;
    const userPitch = options?.pitch || 1.0;

    // Combine user speed/pitch preference with the voice persona's intrinsic cadence and pitch contour
    const effectiveSpeed = Math.max(0.75, Math.min(1.65, userRate * persona.baseRate));
    const effectivePitch = Math.max(0.75, Math.min(1.35, userPitch * persona.pitchRatio));
    const requestedLang = options?.lang || this.preferredLang || "AUTO_ADAPT";

    // If user explicitly chose "System" voice, use browser native Web Speech synthesis directly
    if (voiceName === "System") {
      return this.fallbackWebSpeech(cleanText, effectiveSpeed, effectivePitch, options);
    }

    // 1. Try Server-side Multi-Tier Human Neural TTS endpoint with Persona Acoustic Shaping
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: cleanText.slice(0, 520),
          voice: persona.id,
          accentTld: persona.accentTld,
          lang: requestedLang,
          kidsFriendlyMode: isKids,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.audioBase64) {
          const audioUrl = base64ToWavUrl(data.audioBase64, 24000, data.mimeType || "audio/mpeg");
          const audio = new Audio(audioUrl);
          audio.crossOrigin = "anonymous";

          // If the audio came from Google Neural Multilingual stream (which has a single base timbre per language),
          // apply subtle formant shifting (preservesPitch = false) + 3-band BiquadFilter EQ so each of the 6 voices
          // has a distinctly different vocal timbre, pitch register, and speaking flow!
          const isSingleTimbreStream = data.provider === "GOOGLE_NEURAL_MULTILINGUAL";
          if (isSingleTimbreStream && Math.abs(effectivePitch - 1.0) > 0.02) {
            if ("preservesPitch" in audio) (audio as any).preservesPitch = false;
            if ("mozPreservesPitch" in audio) (audio as any).mozPreservesPitch = false;
            if ("webkitPreservesPitch" in audio) (audio as any).webkitPreservesPitch = false;
            // Blend pitch ratio and speed so formant shifts naturally without sounding sped-up or slowed-down
            audio.playbackRate = Math.max(
              0.82,
              Math.min(1.24, effectivePitch * 0.65 + effectiveSpeed * 0.35)
            );
          } else {
            if ("preservesPitch" in audio) (audio as any).preservesPitch = true;
            if ("mozPreservesPitch" in audio) (audio as any).mozPreservesPitch = true;
            if ("webkitPreservesPitch" in audio) (audio as any).webkitPreservesPitch = true;
            audio.playbackRate = effectiveSpeed;
          }

          // Connect Web Audio Studio Formant EQ (Low-Shelf Warmth + Mid Presence + High Air)
          try {
            const ctx = this.getAudioContext();
            if (ctx) {
              const source = ctx.createMediaElementSource(audio);
              const lowShelf = ctx.createBiquadFilter();
              lowShelf.type = "lowshelf";
              lowShelf.frequency.value = 190;
              lowShelf.gain.value = persona.eqLowDb;

              const midPeak = ctx.createBiquadFilter();
              midPeak.type = "peaking";
              midPeak.frequency.value = 2100;
              midPeak.Q.value = 1.1;
              midPeak.gain.value = persona.eqMidDb;

              const highShelf = ctx.createBiquadFilter();
              highShelf.type = "highshelf";
              highShelf.frequency.value = 4200;
              highShelf.gain.value = persona.eqHighDb;

              source.connect(lowShelf);
              lowShelf.connect(midPeak);
              midPeak.connect(highShelf);
              highShelf.connect(ctx.destination);
            }
          } catch {
            // Direct audio output if AudioContext graph is unavailable
          }

          this.activeAudioElement = audio;

          return new Promise((resolve) => {
            let settled = false;
            const finish = () => {
              if (settled) return;
              settled = true;
              this.activeAudioElement = null;
              options?.onEnd?.();
              resolve();
            };

            audio.onended = finish;
            audio.onerror = () => {
              if (settled) return;
              settled = true;
              this.activeAudioElement = null;
              this.fallbackWebSpeech(cleanText, effectiveSpeed, effectivePitch, options).then(resolve);
            };

            audio.play().catch(() => {
              if (settled) return;
              settled = true;
              this.activeAudioElement = null;
              this.fallbackWebSpeech(cleanText, effectiveSpeed, effectivePitch, options).then(resolve);
            });
          });
        }
      }
    } catch {
      // Fall through to browser speech
    }

    // 2. Client Web Speech Synthesis fallback with Persona-Aware Voice Ranker
    return this.fallbackWebSpeech(cleanText, effectiveSpeed, effectivePitch, options);
  }

  private fallbackWebSpeech(
    text: string,
    speed: number,
    pitch: number,
    options?: SpeechOptions
  ): Promise<void> {
    return new Promise((resolve) => {
      if (typeof window === "undefined" || !window.speechSynthesis) {
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
      utterance.rate = isNonEnglish && Math.abs(speed - 1.0) < 0.05 ? 0.98 * persona.baseRate : speed;
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
        this.activeUtterance = null;
        options?.onEnd?.();
        resolve();
      };

      utterance.onend = finish;
      utterance.onerror = () => {
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
  }
}

export const speechEngine = new SpeechEngine();
export const speechService = speechEngine;
