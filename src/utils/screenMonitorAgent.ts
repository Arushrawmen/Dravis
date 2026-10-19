/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Dravis Genuine Live Screen Monitor, DOM Button Locator,
 * Full Navigation Panel Controller & Hands-Free Voice Clicker (Desktop + Android)
 */

import { NavigationTab } from "../types";

export interface ScannedScreenElement {
  id: string;
  label: string;
  category: "NAVIGATION" | "HARDWARE" | "CALLING" | "APP_LAUNCH" | "WINDOW_CONTROL" | "ACTION";
  xPercent: number;
  yPercent: number;
  element: HTMLElement;
}

export interface NavigationMatchResult {
  matched: boolean;
  tab?: NavigationTab;
  spokenName?: string;
  xPercent?: number;
  yPercent?: number;
}

const NAVIGATION_ALIASES: Array<{
  tab: NavigationTab;
  spokenName: string;
  keywords: string[];
}> = [
  {
    tab: "HOME",
    spokenName: "Home Dashboard",
    keywords: ["home", "dashboard", "main screen", "central stage", "होम", "मेन स्क्रीन"],
  },
  {
    tab: "MICRO_DECISION",
    spokenName: "360° Micro-Decision Orbit",
    keywords: [
      "micro decision",
      "micro-decision",
      "orbit",
      "360",
      "decision tree",
      "माइक्रो डिसीजन",
      "ऑर्बिट",
    ],
  },
  {
    tab: "DRAVIS",
    spokenName: "Dravis AI Chat & Media Forge",
    keywords: ["dravis chat", "chat panel", "conversation", "media forge", "चैट", "ड्रेविस चैट"],
  },
  {
    tab: "GMAIL",
    spokenName: "Gmail Workspace Mailbox",
    keywords: ["gmail", "email", "emails", "mailbox", "inbox", "जीमेल", "ईमेल", "मेल", "mail"],
  },
  {
    tab: "FILES",
    spokenName: "Files & Real Folder Creator",
    keywords: ["files", "file manager", "folder panel", "repository", "फाइल्स", "फोल्डर पैनल"],
  },
  {
    tab: "HISTORY",
    spokenName: "Brain Memory & Windows App Hub",
    keywords: ["history", "memory bank", "brain memory", "windows apps", "हिस्ट्री", "मेमोरी"],
  },
  {
    tab: "SKILLS",
    spokenName: "40 Skills Matrix",
    keywords: ["skills", "skill matrix", "capabilities", "स्किल्स", "मॉड्यूल्स"],
  },
  {
    tab: "LEARNING",
    spokenName: "Self-Learning Neural Core",
    keywords: ["learning", "self learning", "neural learning", "लर्निंग"],
  },
  {
    tab: "AUTOMATION",
    spokenName: "Automation Workflows",
    keywords: ["automation", "workflows", "macros", "ऑटोमेशन"],
  },
  {
    tab: "PLUGINS",
    spokenName: "Plugins & Extensions",
    keywords: ["plugins", "extensions", "addons", "प्लगइन्स"],
  },
  {
    tab: "SUPERVISION",
    spokenName: "Family Supervision & Safety",
    keywords: ["supervision", "family supervision", "parental", "सुपरविजन"],
  },
  {
    tab: "SETTINGS",
    spokenName: "Universal Settings",
    keywords: ["settings", "configuration", "preferences", "सेटिंग्स", "सेटिंग"],
  },
  {
    tab: "PROFILE",
    spokenName: "User Profile & Persona",
    keywords: ["profile", "my profile", "operator profile", "प्रोफाइल"],
  },
  {
    tab: "SYSTEM",
    spokenName: "System Telemetry & Diagnostics",
    keywords: ["system panel", "telemetry", "diagnostics", "hardware status", "सिस्टम"],
  },
];

class ScreenMonitorAgent {
  /**
   * Scans the live DOM viewport to discover all visible buttons, links, navigation tabs,
   * and hardware controls with their exact screen coordinates.
   */
  public scanVisibleScreenElements(): ScannedScreenElement[] {
    if (typeof document === "undefined") return [];
    const candidates = Array.from(
      document.querySelectorAll<HTMLElement>(
        "button, a[href], [role='button'], input[type='submit']"
      )
    );

    const results: ScannedScreenElement[] = [];
    const seenLabels = new Set<string>();
    const vw = Math.max(1, window.innerWidth);
    const vh = Math.max(1, window.innerHeight);

    for (const el of candidates) {
      const rect = el.getBoundingClientRect();
      if (rect.width < 12 || rect.height < 12) continue;
      if (rect.bottom < 0 || rect.top > vh || rect.right < 0 || rect.left > vw) continue;

      const style = window.getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") {
        continue;
      }

      const rawText = (
        el.innerText ||
        el.getAttribute("title") ||
        el.getAttribute("aria-label") ||
        el.id ||
        ""
      )
        .replace(/\s+/g, " ")
        .trim();

      if (!rawText || rawText.length > 65) continue;
      const key = rawText.toLowerCase();
      if (seenLabels.has(key)) continue;
      seenLabels.add(key);

      const xPercent = Math.round(((rect.left + rect.width / 2) / vw) * 100);
      const yPercent = Math.round(((rect.top + rect.height / 2) / vh) * 100);

      let category: ScannedScreenElement["category"] = "ACTION";
      if (/wifi|wi-fi|data|flight|torch|flashlight|bluetooth/i.test(rawText)) {
        category = "HARDWARE";
      } else if (/call|dial|phone|contact|\+91/i.test(rawText)) {
        category = "CALLING";
      } else if (
        /home|micro|dravis|files|history|skills|learning|automation|plugins|supervision|settings|profile|system/i.test(
          rawText
        )
      ) {
        category = "NAVIGATION";
      } else if (/fullscreen|minimize|close|android|desktop/i.test(rawText)) {
        category = "WINDOW_CONTROL";
      } else if (/youtube|chrome|whatsapp|calculator|vs code|terminal|spotify|maps/i.test(rawText)) {
        category = "APP_LAUNCH";
      }

      results.push({
        id: el.id || `dom-el-${results.length}`,
        label: rawText,
        category,
        xPercent: Math.max(4, Math.min(96, xPercent)),
        yPercent: Math.max(4, Math.min(96, yPercent)),
        element: el,
      });
    }

    return results;
  }

  /**
   * Checks if the user is commanding the Navigation Panel (e.g. "Go to Files", "Open Micro Decision",
   * "Click on Settings", "Navigation panel mein Skills kholo").
   */
  public matchNavigationCommand(commandText: string): NavigationMatchResult {
    const lower = commandText.toLowerCase().trim();
    const isNavIntent =
      /\b(go\s+to|navigate\s+to|switch\s+to|open|show|click|tap|select|panel|tab|section|kholo|dikhao|par\s+jao|pe\s+click\s+karo|दबाओ|खोलो|दिखाओ)\b/i.test(
        lower
      );

    if (!isNavIntent) return { matched: false };

    for (const item of NAVIGATION_ALIASES) {
      for (const kw of item.keywords) {
        if (lower.includes(kw)) {
          // Try to find the actual button coordinates on screen for visual cursor movement
          const scanned = this.scanVisibleScreenElements();
          const domMatch = scanned.find((s) =>
            s.label.toLowerCase().includes(kw.split(" ")[0])
          );
          return {
            matched: true,
            tab: item.tab,
            spokenName: item.spokenName,
            xPercent: domMatch ? domMatch.xPercent : 8,
            yPercent: domMatch ? domMatch.yPercent : 42,
          };
        }
      }
    }

    return { matched: false };
  }

  /**
   * Locates any button or interactive option on the live screen by voice description,
   * highlights it with a laser target ring, and clicks it genuinely.
   */
  public locateAndClickByVoice(commandText: string): {
    found: boolean;
    targetLabel: string;
    xPercent: number;
    yPercent: number;
    spokenResponse: string;
  } | null {
    const lower = commandText.toLowerCase().trim();

    // Check if the user is asking to click / tap / press / locate a button on the screen
    const isClickIntent =
      /\b(click|tap|press|push|hit|locate|button|option|toggle|klikk|daba|dabao|click\s+karo|tap\s+karo|pe\s+click|par\s+click|क्लिक|टैप|दबाओ|बटन)\b/i.test(
        lower
      );

    if (!isClickIntent) return null;

    // Extract target name from the command
    const cleanedTarget = lower
      .replace(
        /^(?:hey\s+dravis|ok\s+dravis|dravis|please|can\s+you|screen\s+monitor\s+karke)?\s*/i,
        ""
      )
      .replace(
        /\b(?:click\s+on|click|tap\s+on|tap|press|locate|find|the|button|option|icon|in\s+navigation\s+panel|pe\s+click\s+karo|par\s+click\s+karo|ko\s+dabao|dabao|daba\s+do|karo|क्लिक\s+करो|पे\s+क्लिक\s+करो|दबाओ|बटन)\b/gi,
        " "
      )
      .replace(/\s+/g, " ")
      .trim();

    if (!cleanedTarget || cleanedTarget.length < 2) return null;

    const elements = this.scanVisibleScreenElements();
    const targetWords = cleanedTarget.split(" ").filter((w) => w.length >= 2);

    let bestMatch: ScannedScreenElement | null = null;
    let bestScore = 0;

    for (const item of elements) {
      const lbl = item.label.toLowerCase();
      let score = 0;
      if (lbl === cleanedTarget) score += 100;
      else if (lbl.includes(cleanedTarget)) score += 65;

      for (const w of targetWords) {
        if (lbl.includes(w)) score += 25;
      }

      if (score > bestScore) {
        bestScore = score;
        bestMatch = item;
      }
    }

    if (!bestMatch || bestScore < 25) {
      return null;
    }

    // Highlight the matched DOM element with a visible laser lock ring and click it!
    this.highlightAndClickElement(bestMatch.element);

    return {
      found: true,
      targetLabel: bestMatch.label,
      xPercent: bestMatch.xPercent,
      yPercent: bestMatch.yPercent,
      spokenResponse: `Screen Monitor located "${bestMatch.label}" at (${bestMatch.xPercent}%, ${bestMatch.yPercent}%) and clicked it for you, Sir.`,
    };
  }

  public highlightAndClickElement(el: HTMLElement): void {
    try {
      const prevOutline = el.style.outline;
      const prevBoxShadow = el.style.boxShadow;
      const prevTransition = el.style.transition;

      el.style.transition = "all 0.25s ease";
      el.style.outline = "2px solid #22d3ee";
      el.style.boxShadow = "0 0 28px rgba(34, 211, 238, 0.95)";

      setTimeout(() => {
        try {
          el.click();
        } catch {}
      }, 450);

      setTimeout(() => {
        try {
          el.style.outline = prevOutline;
          el.style.boxShadow = prevBoxShadow;
          el.style.transition = prevTransition;
        } catch {}
      }, 2200);
    } catch {}
  }
}

export const screenMonitorAgent = new ScreenMonitorAgent();
