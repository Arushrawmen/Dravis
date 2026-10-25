/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Offline State & Connectivity Indicator
 */

import React, { useEffect, useState } from "react";
import { WifiOff, AlertTriangle } from "lucide-react";

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== "undefined" ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed bottom-14 left-4 z-[9990] flex items-center gap-2.5 rounded-xl bg-amber-950/90 border border-amber-500/50 px-3.5 py-2 text-xs font-mono text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.35)] backdrop-blur-md animate-in slide-in-from-bottom duration-300">
      <WifiOff className="w-4 h-4 text-amber-400 animate-pulse" />
      <div>
        <span className="font-bold block">Offline Mode</span>
        <span className="text-[10px] text-amber-200/80">Cached workspace data is active.</span>
      </div>
    </div>
  );
};
