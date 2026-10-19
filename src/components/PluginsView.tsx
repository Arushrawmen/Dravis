/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Plugin & Skills Marketplace View
 */

import React, { useState } from "react";
import { Puzzle, CheckCircle, Search, Power, ExternalLink, Zap } from "lucide-react";
import { PluginItem } from "../types";
import { soundEffects } from "../utils/audioSynth";

interface PluginsViewProps {
  plugins: PluginItem[];
  onTogglePlugin: (id: string) => void;
  soundEffectsEnabled: boolean;
}

export const PluginsView: React.FC<PluginsViewProps> = ({
  plugins,
  onTogglePlugin,
  soundEffectsEnabled,
}) => {
  const [search, setSearch] = useState("");

  const filtered = plugins.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div 
      id="dravis-plugins-view"
      className="flex-1 flex flex-col h-full bg-slate-950/40 p-3 sm:p-5 gap-4 overflow-y-auto"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_0_15px_rgba(0,0,0,0.3)]">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-cyan-400">
            <Puzzle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white font-mono tracking-wider">
              PLUGIN & EXTENSION REGISTRY
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              Modular Integrations • Google Search • Vision • PC Control
            </span>
          </div>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search installed plugins..."
            className="bg-black/50 border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400/60 font-mono"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((plugin) => (
          <div
            key={plugin.id}
            className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 shadow-[0_0_15px_rgba(0,0,0,0.2)] ${
              plugin.enabled
                ? "border-white/15 bg-white/5 hover:border-white/25"
                : "border-white/5 bg-black/20 opacity-60"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-white/5 border border-white/10 text-cyan-400">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white font-mono">{plugin.name}</h4>
                  <span className="text-[10px] font-mono text-slate-400">
                    v{plugin.version} • {plugin.category}
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  if (soundEffectsEnabled) soundEffects.playChirp();
                  onTogglePlugin(plugin.id);
                }}
                className={`px-2.5 py-1 rounded-full font-mono text-[10px] font-bold border transition-all ${
                  plugin.enabled
                    ? "bg-cyan-500/20 border-cyan-400/60 text-cyan-300 shadow-[0_0_8px_rgba(34,211,238,0.2)]"
                    : "bg-white/5 border-white/10 text-slate-500"
                }`}
              >
                {plugin.enabled ? "ACTIVE" : "OFF"}
              </button>
            </div>

            <p className="text-xs text-slate-300 font-sans leading-relaxed">
              {plugin.description}
            </p>

            <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-slate-400">
              <span>Author: <span className="text-slate-200">{plugin.author}</span></span>
              <span className="text-emerald-400">Verified Sandbox</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
