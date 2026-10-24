/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Module: Google AdSense Universal Display Component
 * Client: ca-pub-2203384651585087
 * Supports: Responsive Banners, Sidebar Rectangle Units, Feed Stream Ads, and Native Cards
 */

import React, { useEffect, useRef, useState } from "react";
import { Sparkles, ExternalLink, ShieldCheck, Info } from "lucide-react";

declare global {
  interface Window {
    adsbygoogle?: Array<Record<string, unknown>>;
  }
}

export interface GoogleAdSenseBannerProps {
  adSlot?: string;
  adFormat?: "auto" | "rectangle" | "horizontal" | "vertical";
  variant?: "SIDEBAR_BOX" | "HORIZONTAL_LEADERBOARD" | "INLINE_CARD" | "FLOATING_SPONSOR";
  className?: string;
  client?: string;
  testMode?: boolean;
}

export const GoogleAdSenseBanner: React.FC<GoogleAdSenseBannerProps> = ({
  adSlot = "1002003004",
  adFormat = "auto",
  variant = "SIDEBAR_BOX",
  className = "",
  client = "ca-pub-2203384651585087",
  testMode = false,
}) => {
  const adRef = useRef<HTMLModElement | null>(null);
  const pushedRef = useRef<boolean>(false);
  const [adLoaded, setAdLoaded] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);

  useEffect(() => {
    // Only attempt to push once per component mount
    if (pushedRef.current) return;

    try {
      if (typeof window !== "undefined") {
        window.adsbygoogle = window.adsbygoogle || [];
        window.adsbygoogle.push({});
        pushedRef.current = true;
        setAdLoaded(true);
      }
    } catch (err) {
      console.warn("[Google AdSense] Ad unit push notification:", err);
      setHasError(true);
    }
  }, []);

  return (
    <div
      className={`relative overflow-hidden rounded-2xl liquid-glass border border-white/10 transition-all ${
        variant === "HORIZONTAL_LEADERBOARD"
          ? "w-full min-h-[90px] p-3 flex flex-col justify-center items-center"
          : variant === "SIDEBAR_BOX"
          ? "w-full min-h-[160px] p-3 flex flex-col justify-between"
          : variant === "FLOATING_SPONSOR"
          ? "w-full p-2.5 flex items-center justify-between"
          : "w-full p-4 flex flex-col gap-2"
      } ${className}`}
      style={{
        background:
          "linear-gradient(135deg, rgba(8, 20, 44, 0.72) 0%, rgba(2, 6, 23, 0.88) 100%)",
      }}
    >
      {/* Top Header Tag: Official AdSense Sponsor Indicator */}
      <div className="flex items-center justify-between w-full pb-1.5 border-b border-white/10 text-[10px] font-mono tracking-wider">
        <div className="flex items-center gap-1.5 text-cyan-400 font-bold">
          <Sparkles className="w-3 h-3 text-cyan-300 animate-pulse" />
          <span>SPONSORED • GOOGLE ADSENSE</span>
        </div>
        <div className="flex items-center gap-1 text-slate-400">
          <ShieldCheck className="w-3 h-3 text-emerald-400" />
          <span className="text-[9px] uppercase">Verified Publisher</span>
        </div>
      </div>

      {/* Real Google AdSense Tag Container */}
      <div className="w-full my-auto flex items-center justify-center overflow-hidden py-1">
        <ins
          ref={adRef}
          className="adsbygoogle block w-full"
          style={{ display: "block", textAlign: "center" }}
          data-ad-client={client}
          data-ad-slot={adSlot}
          data-ad-format={adFormat}
          data-full-width-responsive="true"
          data-adtest={testMode ? "on" : undefined}
        />
      </div>

      {/* Fallback / Domain Verification Preview Card (shown while Google AdSense finishes reviewing dravis.ai.studio) */}
      <div className="w-full rounded-xl bg-slate-950/60 border border-cyan-500/20 p-2.5 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-cyan-500/15 border border-cyan-400/40 flex items-center justify-center shrink-0">
            <span className="text-cyan-300 font-black text-xs font-mono">Ad</span>
          </div>
          <div>
            <div className="text-[11px] font-bold text-white flex items-center gap-1.5 font-sans">
              <span>Google AdSense Network</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-400/15 text-cyan-300 font-mono">
                {client}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 leading-tight">
              Live ads enabled for <span className="text-cyan-300 font-mono">dravis.ai.studio</span> & all verified domains.
            </p>
          </div>
        </div>

        <a
          href="https://adsense.google.com"
          target="_blank"
          rel="noopener noreferrer"
          className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-cyan-300 hover:text-white border border-white/15 text-[10px] font-mono font-bold flex items-center gap-1 transition-all shrink-0 cursor-pointer"
          title="Google AdSense Partner Network"
        >
          <span>AdSense</span>
          <ExternalLink className="w-2.5 h-2.5" />
        </a>
      </div>

      {/* AdSense Policy Disclosure Footer */}
      <div className="flex items-center justify-between text-[9px] font-mono text-slate-500 pt-1.5 border-t border-white/5 w-full">
        <span>Google AdSense ID: {client}</span>
        <span className="flex items-center gap-1">
          <Info className="w-2.5 h-2.5" />
          <span>Ads by Google</span>
        </span>
      </div>
    </div>
  );
};
