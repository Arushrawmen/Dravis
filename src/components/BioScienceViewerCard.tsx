import React, { useEffect, useRef, useState } from "react";
import {
  Dna,
  Atom,
  FlaskConical,
  BookOpen,
  ExternalLink,
  RotateCcw,
  Layers,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
  XCircle,
  Activity,
} from "lucide-react";
import { BioScienceAnalysisItem } from "../types";

interface BioScienceViewerCardProps {
  analysis: BioScienceAnalysisItem;
}

export const BioScienceViewerCard: React.FC<BioScienceViewerCardProps> = ({
  analysis,
}) => {
  const viewerContainerRef = useRef<HTMLDivElement>(null);
  const viewerInstanceRef = useRef<any>(null);
  const smilesCanvasRef = useRef<HTMLCanvasElement>(null);

  const [renderStyle, setRenderStyle] = useState<
    "cartoon" | "stick" | "sphere" | "surface"
  >("cartoon");
  const [colorMode, setColorMode] = useState<"plddt" | "spectrum" | "chain">(
    "plddt"
  );
  const [viewerStatus, setViewerStatus] = useState<
    "idle" | "loading" | "ready" | "error"
  >("idle");
  const [spinning, setSpinning] = useState<boolean>(false);

  // Initialize and render 3Dmol.js structure when PDB or AlphaFold URL is available
  useEffect(() => {
    let isMounted = true;
    const pdbId = analysis.pdbId || "1CRN";
    const structureUrl =
      analysis.alphafoldUrl || `https://files.rcsb.org/download/${pdbId}.pdb`;

    const init3DMol = async () => {
      if (!viewerContainerRef.current) return;
      setViewerStatus("loading");
      try {
        const $3Dmol = await import("3dmol");
        if (!isMounted || !viewerContainerRef.current) return;

        viewerContainerRef.current.innerHTML = "";
        const viewer = $3Dmol.createViewer(viewerContainerRef.current, {
          backgroundColor: "#050b14",
          antialias: true,
        });
        viewerInstanceRef.current = viewer;

        let res = await fetch(structureUrl);
        let format = structureUrl.endsWith(".cif") ? "cif" : "pdb";
        if (!res.ok && pdbId) {
          res = await fetch(`https://files.rcsb.org/download/${pdbId}.pdb`);
          format = "pdb";
        }
        if (!res.ok) {
          throw new Error("Structure fetch failed");
        }
        const structureText = await res.text();
        if (!isMounted) return;

        viewer.addModel(structureText, format);
        applyStyleToViewer(viewer, renderStyle, colorMode);
        viewer.zoomTo();
        viewer.render();
        setViewerStatus("ready");
      } catch (err) {
        console.warn("3Dmol load warning:", err);
        if (isMounted) setViewerStatus("error");
      }
    };

    init3DMol();
    return () => {
      isMounted = false;
      if (viewerInstanceRef.current) {
        try {
          viewerInstanceRef.current.spin(false);
        } catch {
          // ignore cleanup errors
        }
      }
    };
  }, [analysis.pdbId, analysis.alphafoldUrl]);

  const applyStyleToViewer = (
    viewer: any,
    style: "cartoon" | "stick" | "sphere" | "surface",
    color: "plddt" | "spectrum" | "chain"
  ) => {
    if (!viewer) return;
    viewer.removeAllSurfaces();
    viewer.setStyle({}, {});

    const colorSpec: any =
      color === "plddt"
        ? {
            colorfunc: (atom: any) => {
              const b = typeof atom.b === "number" ? atom.b : 85;
              // Official AlphaFold pLDDT confidence color scale
              if (b >= 90) return "#0053D6"; // Very high
              if (b >= 70) return "#65CBF3"; // Confident
              if (b >= 50) return "#FFDB13"; // Low
              return "#FF7D45"; // Very low
            },
          }
        : color === "spectrum"
          ? { color: "spectrum" }
          : { colorscheme: "chainHetatm" };

    if (style === "cartoon") {
      viewer.setStyle({}, { cartoon: colorSpec });
      viewer.setStyle({ hetflag: true }, { stick: { radius: 0.2, colorscheme: "Jmol" } });
    } else if (style === "stick") {
      viewer.setStyle({}, { stick: { radius: 0.18, ...colorSpec } });
    } else if (style === "sphere") {
      viewer.setStyle({}, { sphere: { scale: 0.45, ...colorSpec } });
    } else if (style === "surface") {
      viewer.setStyle({}, { cartoon: colorSpec });
      viewer.addSurface("VDW", { opacity: 0.65, color: "#22d3ee" }, {});
    }
    viewer.render();
  };

  useEffect(() => {
    if (viewerInstanceRef.current && viewerStatus === "ready") {
      applyStyleToViewer(viewerInstanceRef.current, renderStyle, colorMode);
    }
  }, [renderStyle, colorMode, viewerStatus]);

  const handleToggleSpin = () => {
    if (!viewerInstanceRef.current) return;
    const next = !spinning;
    setSpinning(next);
    viewerInstanceRef.current.spin(next ? "y" : false);
  };

  const handleResetCamera = () => {
    if (!viewerInstanceRef.current) return;
    viewerInstanceRef.current.zoomTo();
    viewerInstanceRef.current.render();
  };

  // Render 2D SMILES chemical structure via SmilesDrawer
  useEffect(() => {
    const smiles = analysis.chemicalProps?.smiles;
    if (!smiles || !smilesCanvasRef.current) return;
    let active = true;

    const renderSmiles = async () => {
      try {
        const SmilesDrawerModule = await import("smiles-drawer");
        const SmilesDrawer =
          (SmilesDrawerModule as any).default || SmilesDrawerModule;
        if (!active || !smilesCanvasRef.current) return;

        const drawer = new SmilesDrawer.Drawer({
          width: 240,
          height: 150,
          bondThickness: 1.4,
          CompactDrawing: false,
        });

        SmilesDrawer.parse(
          smiles,
          (tree: any) => {
            if (active && smilesCanvasRef.current) {
              drawer.draw(tree, smilesCanvasRef.current, "dark", false);
            }
          },
          (err: any) => {
            console.warn("SMILES parse error:", err);
          }
        );
      } catch (e) {
        console.warn("SmilesDrawer error:", e);
      }
    };

    renderSmiles();
    return () => {
      active = false;
    };
  }, [analysis.chemicalProps?.smiles]);

  return (
    <div className="mt-3 rounded-2xl border border-emerald-500/35 bg-slate-950/90 p-3.5 text-left shadow-xl">
      {/* Header Badge Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-emerald-500/40 bg-emerald-500/15 text-emerald-300">
            <Dna className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold tracking-wider text-emerald-300 uppercase">
                DeepMind BioScience Workbench
              </span>
              <span className="rounded-md border border-cyan-500/30 bg-cyan-500/15 px-1.5 py-0.5 font-mono text-[9px] text-cyan-300">
                {analysis.domain}
              </span>
            </div>
            <p className="text-xs font-semibold text-white">
              {analysis.title}{" "}
              <span className="font-mono text-[10px] text-slate-400">
                ({analysis.targetSymbol}
                {analysis.uniprotAccession
                  ? ` • UniProt ${analysis.uniprotAccession}`
                  : ""}
                {analysis.pdbId ? ` • PDB ${analysis.pdbId}` : ""})
              </span>
            </p>
          </div>
        </div>

        <span className="rounded-lg border border-emerald-500/30 bg-emerald-950/60 px-2 py-1 font-mono text-[9px] text-emerald-300">
          {analysis.provenanceBadge}
        </span>
      </div>

      {/* 3Dmol.js Interactive Protein & Molecular Viewer */}
      <div className="mt-3 overflow-hidden rounded-xl border border-cyan-500/30 bg-[#050b14]">
        <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-white/10 bg-slate-900/90 px-3 py-1.5">
          <div className="flex items-center gap-1.5">
            <Atom className="h-3.5 w-3.5 text-cyan-400" />
            <span className="font-mono text-[10px] font-semibold text-cyan-300">
              3Dmol.js Interactive Structure • PDB: {analysis.pdbId || "1CRN"}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1">
            {(["cartoon", "stick", "sphere", "surface"] as const).map((st) => (
              <button
                key={st}
                onClick={() => setRenderStyle(st)}
                className={`rounded-md px-2 py-0.5 font-mono text-[9px] uppercase transition ${
                  renderStyle === st
                    ? "bg-cyan-500/25 text-cyan-200 border border-cyan-400/50"
                    : "bg-white/5 text-slate-400 hover:text-white"
                }`}
              >
                {st}
              </button>
            ))}

            <button
              onClick={() =>
                setColorMode((prev) =>
                  prev === "plddt"
                    ? "spectrum"
                    : prev === "spectrum"
                      ? "chain"
                      : "plddt"
                )
              }
              className="flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-[9px] text-emerald-300 hover:bg-emerald-500/20"
              title="Toggle Color Scheme (pLDDT / Spectrum / Chain)"
            >
              <Layers className="h-2.5 w-2.5" />
              {colorMode.toUpperCase()}
            </button>

            <button
              onClick={handleToggleSpin}
              className={`rounded-md px-2 py-0.5 font-mono text-[9px] transition ${
                spinning
                  ? "bg-amber-500/25 text-amber-300 border border-amber-400/40"
                  : "bg-white/5 text-slate-400 hover:text-white"
              }`}
            >
              {spinning ? "Spin: ON" : "Spin"}
            </button>

            <button
              onClick={handleResetCamera}
              className="rounded-md bg-white/5 p-1 text-slate-300 hover:bg-white/10 hover:text-white"
              title="Reset 3D Camera"
            >
              <RotateCcw className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* 3D Canvas Container */}
        <div className="relative h-56 w-full">
          <div
            ref={viewerContainerRef}
            className="h-full w-full"
            style={{ position: "relative" }}
          />
          {viewerStatus === "loading" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 text-xs text-cyan-300">
              <Activity className="mb-1.5 h-5 w-5 animate-spin text-cyan-400" />
              Loading 3D Coordinates from RCSB PDB / AlphaFold DB...
            </div>
          )}
        </div>

        {/* AlphaFold pLDDT Legend */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 bg-slate-900/70 px-3 py-1.5 text-[9px] text-slate-300">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="font-mono font-bold text-slate-400 uppercase">
              AlphaFold pLDDT:
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-[#0053D6]" />
              Very High (&gt;90)
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-[#65CBF3]" />
              Confident (70–90)
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-[#FFDB13]" />
              Low (50–70)
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-[#FF7D45]" />
              Disordered (&lt;50)
            </span>
          </div>
          {analysis.plddtScore && (
            <span className="font-mono font-semibold text-emerald-300">
              Mean pLDDT: {analysis.plddtScore}
            </span>
          )}
        </div>
      </div>

      {/* Chemical / Drug Discovery Properties + 2D SMILES */}
      {analysis.chemicalProps && (
        <div className="mt-3 grid grid-cols-1 gap-2.5 rounded-xl border border-purple-500/30 bg-purple-950/15 p-3 sm:grid-cols-12">
          <div className="flex flex-col items-center justify-center rounded-lg border border-white/10 bg-slate-950/90 p-2 sm:col-span-5">
            <div className="mb-1 flex items-center gap-1 self-start font-mono text-[9px] text-purple-300">
              <FlaskConical className="h-3 w-3" />
              2D SMILES Structure ({analysis.chemicalProps.compoundName})
            </div>
            <canvas
              ref={smilesCanvasRef}
              width={240}
              height={150}
              className="max-w-full"
            />
            {analysis.chemicalProps.cid && (
              <span className="mt-1 font-mono text-[9px] text-slate-400">
                PubChem CID: {analysis.chemicalProps.cid} •{" "}
                {analysis.chemicalProps.formula}
              </span>
            )}
          </div>

          <div className="flex flex-col justify-between space-y-2 sm:col-span-7">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-purple-200">
                  ADMET & Drug-Likeness Metrics
                </span>
                <span
                  className={`flex items-center gap-1 rounded-md px-1.5 py-0.5 font-mono text-[9px] font-bold ${
                    analysis.chemicalProps.lipinskiPass
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                      : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                  }`}
                >
                  {analysis.chemicalProps.lipinskiPass ? (
                    <CheckCircle2 className="h-3 w-3" />
                  ) : (
                    <AlertTriangle className="h-3 w-3" />
                  )}
                  Lipinski Ro5:{" "}
                  {analysis.chemicalProps.lipinskiPass
                    ? "PASS"
                    : `${analysis.chemicalProps.lipinskiViolations} Violation`}
                </span>
              </div>

              <div className="mt-2 grid grid-cols-3 gap-1.5 font-mono text-[10px]">
                <div className="rounded-lg border border-white/10 bg-slate-900/80 p-1.5">
                  <div className="text-[8px] text-slate-400">MW (≤500 Da)</div>
                  <div className="font-bold text-white">
                    {analysis.chemicalProps.molecularWeight} Da
                  </div>
                </div>
                <div className="rounded-lg border border-white/10 bg-slate-900/80 p-1.5">
                  <div className="text-[8px] text-slate-400">XLogP (≤5)</div>
                  <div className="font-bold text-white">
                    {analysis.chemicalProps.xlogp}
                  </div>
                </div>
                <div className="rounded-lg border border-white/10 bg-slate-900/80 p-1.5">
                  <div className="text-[8px] text-slate-400">TPSA (≤140 Å²)</div>
                  <div className="font-bold text-white">
                    {analysis.chemicalProps.tpsa} Å²
                  </div>
                </div>
                <div className="rounded-lg border border-white/10 bg-slate-900/80 p-1.5">
                  <div className="text-[8px] text-slate-400">H-Bond Donors</div>
                  <div className="font-bold text-white">
                    {analysis.chemicalProps.hBondDonors} (≤5)
                  </div>
                </div>
                <div className="rounded-lg border border-white/10 bg-slate-900/80 p-1.5">
                  <div className="text-[8px] text-slate-400">H-Acceptors</div>
                  <div className="font-bold text-white">
                    {analysis.chemicalProps.hBondAcceptors} (≤10)
                  </div>
                </div>
                <div className="rounded-lg border border-white/10 bg-slate-900/80 p-1.5">
                  <div className="text-[8px] text-slate-400">Rot. Bonds</div>
                  <div className="font-bold text-white">
                    {analysis.chemicalProps.rotatableBonds} (≤10)
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-white/5 bg-black/40 px-2 py-1 font-mono text-[9px] text-slate-400 truncate">
              SMILES: {analysis.chemicalProps.smiles}
            </div>
          </div>
        </div>
      )}

      {/* ClinVar & gnomAD Genomic Variants */}
      {analysis.variants && analysis.variants.length > 0 && (
        <div className="mt-3 rounded-xl border border-amber-500/30 bg-amber-950/10 p-2.5">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-amber-300 uppercase">
              <ShieldCheck className="h-3.5 w-3.5" />
              ClinVar & gnomAD Variant Pathogenicity
            </span>
            <span className="font-mono text-[9px] text-slate-400">
              ACMG / AMP Reference
            </span>
          </div>
          <div className="space-y-1.5">
            {analysis.variants.map((v, idx) => (
              <div
                key={idx}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/10 bg-slate-900/80 px-2.5 py-1.5 text-[10px]"
              >
                <div>
                  <span className="font-mono font-bold text-cyan-300">
                    {v.rsid}
                  </span>{" "}
                  <span className="font-semibold text-white">({v.gene})</span> •{" "}
                  <span className="text-slate-300">{v.condition}</span>
                </div>
                <div className="flex items-center gap-2 font-mono text-[9px]">
                  <span className="rounded bg-red-500/20 px-1.5 py-0.5 text-red-300 border border-red-500/30">
                    {v.clinicalSignificance}
                  </span>
                  <span className="text-amber-300">{v.reviewStars}</span>
                  <span className="text-slate-400">AF: {v.alleleFrequency}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Peer-Reviewed Literature (Europe PMC / PubMed / OpenAlex) */}
      {analysis.papers && analysis.papers.length > 0 && (
        <div className="mt-3 rounded-xl border border-cyan-500/25 bg-cyan-950/10 p-2.5">
          <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-cyan-300 uppercase">
            <BookOpen className="h-3.5 w-3.5" />
            Verified Biomedical Literature (PMID / DOI Grounded)
          </div>
          <div className="space-y-1.5">
            {analysis.papers.map((p, idx) => (
              <a
                key={idx}
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start justify-between gap-2 rounded-lg border border-white/10 bg-slate-900/75 p-2 text-[10px] transition hover:border-cyan-400/40 hover:bg-slate-900"
              >
                <div>
                  <div className="font-semibold text-slate-100">{p.title}</div>
                  <div className="mt-0.5 font-mono text-[9px] text-slate-400">
                    {p.authors} • {p.journal} ({p.year})
                    {p.pmid ? ` • PMID: ${p.pmid}` : ""}
                    {p.citations ? ` • Cited by ${p.citations}` : ""}
                  </div>
                </div>
                <ExternalLink className="h-3.5 w-3.5 shrink-0 text-cyan-400" />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
