/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 40-Module Human ASI / Dravis Architecture Matrix & Skill Tester
 */

import React, { useState } from "react";
import {
  Cpu,
  CheckCircle2,
  Play,
  Filter,
  Search,
  Sparkles,
  Film,
  Image as ImageIcon,
  Music,
  Mic,
  Bot,
  Globe,
  Wand2,
  Dna,
  FlaskConical,
  BookOpen,
} from "lucide-react";
import { SkillModule } from "../types";
import { soundEffects } from "../utils/audioSynth";

interface SkillsMatrixViewProps {
  skills: SkillModule[];
  onTestModule: (skill: SkillModule) => void;
  onLaunchSkillPrompt?: (prompt: string, skillAction?: SkillModule["skillAction"]) => void;
  soundEffectsEnabled: boolean;
}

export const SkillsMatrixView: React.FC<SkillsMatrixViewProps> = ({
  skills,
  onTestModule,
  onLaunchSkillPrompt,
  soundEffectsEnabled,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [testedModuleId, setTestedModuleId] = useState<number | null>(null);

  const categories = [
    "ALL",
    "CREATIVE_AI",
    "BIOSCIENCE",
    "VOICE_VISION",
    "INTELLIGENCE",
    "COGNITION",
    "AUTOMATION",
    "CORE",
    "MANAGEMENT",
  ];

  const flagshipQuickActions: Array<{
    label: string;
    sub: string;
    prompt: string;
    action: NonNullable<SkillModule["skillAction"]>;
    icon: React.ReactNode;
    badgeColor: string;
  }> = [
    {
      label: "1. Text-to-Video (Veo 3.1)",
      sub: "Direct prompt → 1080p MP4",
      prompt: "Generate a cinematic 1080p video of a futuristic quantum neural core glowing over Neo-Tokyo at night",
      action: "VEO_TEXT_TO_VIDEO",
      icon: <Film className="w-3.5 h-3.5" />,
      badgeColor: "border-purple-500/40 bg-purple-500/15 text-purple-300",
    },
    {
      label: "2. Image-to-Video",
      sub: "Animate any photo into video",
      prompt: "Animate image into a smooth cinematic camera pan with glowing atmospheric particles",
      action: "VEO_IMAGE_TO_VIDEO",
      icon: <Sparkles className="w-3.5 h-3.5" />,
      badgeColor: "border-pink-500/40 bg-pink-500/15 text-pink-300",
    },
    {
      label: "3. 60fps Animation",
      sub: "Motion & particle animation",
      prompt: "Create a 60fps 3D holographic orbital HUD animation with neon telemetry waves",
      action: "GENERATE_ANIMATION",
      icon: <Play className="w-3.5 h-3.5" />,
      badgeColor: "border-cyan-500/40 bg-cyan-500/15 text-cyan-300",
    },
    {
      label: "4. Audio Transcription",
      sub: "Gemini 3.5 ASR + Diarization",
      prompt: "Transcribe audio with speaker diarization and multilingual translation",
      action: "AUDIO_TRANSCRIBE",
      icon: <Mic className="w-3.5 h-3.5" />,
      badgeColor: "border-amber-500/40 bg-amber-500/15 text-amber-300",
    },
    {
      label: "5. Gemini 4 Argon Bot",
      sub: "Dedicated reasoning agent",
      prompt: "@GeminiBot Explain how quantum error correction stabilizes topological qubits with code examples",
      action: "GEMINI_BOT",
      icon: <Bot className="w-3.5 h-3.5" />,
      badgeColor: "border-blue-500/40 bg-blue-500/15 text-blue-300",
    },
    {
      label: "6. Google Search Data",
      sub: "Live web grounding & citations",
      prompt: "Search Google live for the latest breakthroughs in solid-state batteries and fusion energy in 2026",
      action: "GOOGLE_SEARCH_GROUNDING",
      icon: <Globe className="w-3.5 h-3.5" />,
      badgeColor: "border-emerald-500/40 bg-emerald-500/15 text-emerald-300",
    },
    {
      label: "7. Create & Edit Images",
      sub: "Nano Banana 2.1 Studio",
      prompt: "Create an ultra-detailed 8K cybernetic laboratory concept art and edit lighting to golden hour",
      action: "IMAGE_CREATE_EDIT",
      icon: <Wand2 className="w-3.5 h-3.5" />,
      badgeColor: "border-rose-500/40 bg-rose-500/15 text-rose-300",
    },
    {
      label: "8. Generate Music (Lyria 3)",
      sub: "Synthesize multi-track audio",
      prompt: "Generate music: Epic cinematic cyberpunk synthwave soundtrack with deep bass and arpeggios at 124 BPM",
      action: "LYRIA_MUSIC",
      icon: <Music className="w-3.5 h-3.5" />,
      badgeColor: "border-violet-500/40 bg-violet-500/15 text-violet-300",
    },
    {
      label: "9. BioScience: 3D Protein",
      sub: "AlphaFold + RCSB PDB 3Dmol.js",
      prompt: "Analyze 3D protein structure of TP53 and BRCA1 with AlphaFold pLDDT confidence and ClinVar variants",
      action: "BIOSCIENCE_3D_PROTEIN",
      icon: <Dna className="w-3.5 h-3.5" />,
      badgeColor: "border-teal-500/40 bg-teal-500/15 text-teal-300",
    },
    {
      label: "10. BioScience: Drug & Chem",
      sub: "PubChem SMILES + Lipinski Ro5",
      prompt: "Analyze drug structure and ADMET Lipinski Rule of 5 properties for Imatinib and Semaglutide with PubMed papers",
      action: "BIOSCIENCE_DRUG_CHEM",
      icon: <FlaskConical className="w-3.5 h-3.5" />,
      badgeColor: "border-lime-500/40 bg-lime-500/15 text-lime-300",
    },
  ];

  const filteredSkills = skills.filter((s) => {
    const matchesCat =
      selectedCategory === "ALL" || s.category === selectedCategory;
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleTest = (skill: SkillModule) => {
    if (soundEffectsEnabled) soundEffects.playActivatePulse();
    setTestedModuleId(skill.id);
    onTestModule(skill);
    setTimeout(() => {
      setTestedModuleId(null);
    }, 2000);
  };

  return (
    <div
      id="dravis-skills-view"
      className="flex-1 flex flex-col h-full bg-slate-950/40 p-3 sm:p-5 gap-4 overflow-y-auto"
    >
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_0_15px_rgba(0,0,0,0.3)]">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-cyan-400">
            <Cpu className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white font-mono tracking-wider">
              40-MODULE MULTIMODAL, CREATIVE & BIOSCIENCE MATRIX
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              Status: 40/40 Online • Veo 3.1 • Lyria 3 • Nano Banana 2.1 • Gemini 4 Argon • DeepMind BioScience
            </span>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search 40 skills..."
              className="bg-black/50 border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400/60 font-mono"
            />
          </div>
        </div>
      </div>

      {/* 10 Flagship Multimodal & BioScience Skills Quick-Launcher */}
      <div className="rounded-2xl border border-cyan-500/30 bg-slate-900/70 p-3.5">
        <div className="mb-2.5 flex items-center justify-between">
          <span className="font-mono text-xs font-bold tracking-wider text-cyan-300 uppercase">
            ⚡ 10 Flagship Multimodal & BioScience Capabilities (Click to Execute Live in Dravis)
          </span>
          <span className="font-mono text-[10px] text-emerald-400">
            All 10 Skills Active
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
          {flagshipQuickActions.map((item, idx) => (
            <button
              key={idx}
              onClick={() => {
                if (soundEffectsEnabled) soundEffects.playActivatePulse();
                if (onLaunchSkillPrompt) {
                  onLaunchSkillPrompt(item.prompt, item.action);
                }
              }}
              className={`flex flex-col justify-between gap-1 rounded-xl border p-2.5 text-left transition hover:scale-[1.01] hover:brightness-110 ${item.badgeColor}`}
            >
              <div className="flex items-center justify-between gap-1.5">
                <span className="text-[11px] font-bold">{item.label}</span>
                {item.icon}
              </div>
              <span className="font-mono text-[9px] opacity-80">{item.sub}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Category Filters */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-mono">
        <Filter className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => {
              if (soundEffectsEnabled) soundEffects.playChirp();
              setSelectedCategory(cat);
            }}
            className={`px-3 py-1 rounded-xl border transition-all whitespace-nowrap ${
              selectedCategory === cat
                ? "border-cyan-400/50 bg-white/10 text-white shadow-[0_0_10px_rgba(34,211,238,0.2)] font-bold"
                : "border-white/5 bg-white/5 text-slate-400 hover:text-slate-200"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 40 Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {filteredSkills.map((skill) => {
          const isTesting = testedModuleId === skill.id;

          return (
            <div
              key={skill.id}
              className="p-3.5 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all flex flex-col justify-between gap-2.5 shadow-[0_0_15px_rgba(0,0,0,0.2)] group"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center font-mono text-[10px] font-bold text-cyan-400">
                    {skill.id}
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-white font-mono tracking-wide group-hover:text-cyan-300 transition-colors">
                      {skill.name}
                    </h4>
                    <span className="text-[10px] font-mono text-slate-400">
                      v{skill.version} • {skill.category}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                  <span className="text-[10px] font-mono text-emerald-400 font-semibold">
                    {skill.status}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-300 font-sans leading-relaxed">
                {skill.description}
              </p>

              <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-2">
                <span className="text-[10px] font-mono text-slate-400">
                  Engine:{" "}
                  <span className="text-cyan-300">
                    {skill.skillAction || "ASI-Core"}
                  </span>
                </span>

                <div className="flex items-center gap-1.5">
                  {skill.skillAction && onLaunchSkillPrompt && (
                    <button
                      onClick={() => {
                        const match = flagshipQuickActions.find(
                          (f) => f.action === skill.skillAction
                        );
                        onLaunchSkillPrompt(
                          match?.prompt || `Execute skill: ${skill.name}`,
                          skill.skillAction
                        );
                      }}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-cyan-500/40 bg-cyan-500/15 hover:bg-cyan-500/25 font-mono text-[10px] font-bold text-cyan-200 transition-all"
                    >
                      <Sparkles className="w-3 h-3 text-cyan-300" />
                      <span>RUN SKILL</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleTest(skill)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-mono text-[10px] font-bold transition-all ${
                      isTesting
                        ? "bg-emerald-500/20 border-emerald-400 text-emerald-300 animate-pulse"
                        : "bg-white/5 border-white/10 hover:bg-white/10 text-cyan-400 hover:text-white"
                    }`}
                  >
                    {isTesting ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>DIAGNOSTIC OK</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3 h-3 text-cyan-400" />
                        <span>TEST</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

