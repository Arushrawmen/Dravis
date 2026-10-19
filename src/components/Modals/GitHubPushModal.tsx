/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * GitHub Sync & Repository Push Modal for Dravis ASI (Desktop & Android)
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Download,
  KeyRound,
  GitBranch,
  GitCommit,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  FolderArchive,
  Terminal,
} from "lucide-react";
import { soundEffects } from "../../utils/audioSynth";

interface GitHubPushModalProps {
  isOpen: boolean;
  onClose: () => void;
  soundEffectsEnabled?: boolean;
}

interface GitStatusData {
  success: boolean;
  initialized: boolean;
  branch: string;
  latestCommit: string | null;
  totalCommits?: number;
  remotes?: string[];
  uncommittedCount?: number;
}

export const GitHubPushModal: React.FC<GitHubPushModalProps> = ({
  isOpen,
  onClose,
  soundEffectsEnabled = true,
}) => {
  const [gitStatus, setGitStatus] = useState<GitStatusData | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);

  const [repoUrl, setRepoUrl] = useState(() => {
    return localStorage.getItem("dravis_github_repo_url") || "";
  });
  const [token, setToken] = useState(() => {
    return localStorage.getItem("dravis_github_pat") || "";
  });
  const [branch, setBranch] = useState("main");
  const [commitMessage, setCommitMessage] = useState(
    "Push Dravis ASI & Android Liquid Glass OS to GitHub"
  );
  const [forcePush, setForcePush] = useState(false);

  const [isPushing, setIsPushing] = useState(false);
  const [pushResult, setPushResult] = useState<{
    success: boolean;
    message: string;
    output?: string;
    hint?: string;
  } | null>(null);

  const [copiedCli, setCopiedCli] = useState(false);

  const fetchStatus = async () => {
    setIsLoadingStatus(true);
    try {
      const res = await fetch("/api/github/status");
      const data = await res.json();
      setGitStatus(data);
      if (data?.branch) {
        setBranch(data.branch);
      }
    } catch {
      // Ignore
    } finally {
      setIsLoadingStatus(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
      setPushResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePushSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoUrl.trim()) {
      setPushResult({
        success: false,
        message: "Please enter your GitHub repository URL.",
      });
      return;
    }

    // Save repo url and token in localStorage for user convenience
    try {
      localStorage.setItem("dravis_github_repo_url", repoUrl.trim());
      if (token.trim()) {
        localStorage.setItem("dravis_github_pat", token.trim());
      }
    } catch {}

    setIsPushing(true);
    setPushResult(null);
    if (soundEffectsEnabled) soundEffects.playActivatePulse();

    try {
      const res = await fetch("/api/github/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repoUrl: repoUrl.trim(),
          token: token.trim(),
          branch: branch.trim() || "main",
          force: forcePush,
          commitMessage: commitMessage.trim(),
          userEmail: "arushgamer783@gmail.com",
          userName: "Arush Sir",
        }),
      });

      const data = await res.json();

      if (data.success) {
        if (soundEffectsEnabled) soundEffects.playStartupChime();
        setPushResult({
          success: true,
          message: data.message || `Successfully pushed to ${repoUrl}!`,
          output: data.output,
        });
        fetchStatus();
      } else {
        if (soundEffectsEnabled) soundEffects.playAlert();
        setPushResult({
          success: false,
          message: data.error || "Failed to push to GitHub.",
          hint: data.hint,
        });
      }
    } catch (err: any) {
      if (soundEffectsEnabled) soundEffects.playAlert();
      setPushResult({
        success: false,
        message: err?.message || "Network error while connecting to server.",
      });
    } finally {
      setIsPushing(false);
    }
  };

  const cleanRepoDisplay = repoUrl.trim() || "https://github.com/<YOUR_USERNAME>/<YOUR_REPO>.git";
  const cliSnippet = `# 1. Add your GitHub repository remote
git remote add origin ${cleanRepoDisplay}

# 2. Set default branch to main
git branch -M main

# 3. Push all code to GitHub
git push -u origin main`;

  const copyCliToClipboard = () => {
    navigator.clipboard.writeText(cliSnippet);
    setCopiedCli(true);
    if (soundEffectsEnabled) soundEffects.playChirp();
    setTimeout(() => setCopiedCli(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md select-none font-sans">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-2xl bg-slate-950 border border-cyan-500/30 rounded-3xl p-5 sm:p-7 shadow-[0_0_60px_rgba(6,182,212,0.25)] flex flex-col gap-5 max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white shadow-md">
              <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white font-mono flex items-center gap-2">
                <span>Push App to GitHub</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/40">
                  Ready
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Push clean commit history to your GitHub repository or download complete source code.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              if (soundEffectsEnabled) soundEffects.playChirp();
              onClose();
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Local Git Status Pill */}
        <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-cyan-300">
              <GitBranch className="w-4 h-4" />
              <span>Branch: <strong>{gitStatus?.branch || "main"}</strong></span>
            </div>
            <span className="text-slate-600">|</span>
            <div className="flex items-center gap-1.5 text-slate-300 truncate max-w-[280px]">
              <GitCommit className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="truncate">{gitStatus?.latestCommit || "Latest code committed"}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={fetchStatus}
            disabled={isLoadingStatus}
            className="self-start sm:self-center px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-[11px] flex items-center gap-1 cursor-pointer transition-all"
          >
            <RefreshCw className={`w-3 h-3 ${isLoadingStatus ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Feedback Alert */}
        <AnimatePresence>
          {pushResult && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className={`p-3.5 rounded-2xl border text-xs font-mono flex flex-col gap-1.5 ${
                pushResult.success
                  ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-200"
                  : "bg-red-500/15 border-red-500/40 text-red-200"
              }`}
            >
              <div className="flex items-center gap-2 font-bold">
                {pushResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                )}
                <span>{pushResult.message}</span>
              </div>
              {pushResult.hint && (
                <p className="text-[11px] text-slate-300 font-sans pl-6">
                  {pushResult.hint}
                </p>
              )}
              {pushResult.output && (
                <pre className="text-[10px] p-2 rounded bg-black/40 overflow-x-auto text-slate-300 mt-1">
                  {pushResult.output}
                </pre>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Push Form */}
        <form onSubmit={handlePushSubmit} className="flex flex-col gap-4 font-mono text-xs">
          <div>
            <label className="text-slate-300 font-bold block mb-1">
              1. Your GitHub Repository URL *
            </label>
            <input
              type="text"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/your-username/your-repo-name.git"
              required
              className="w-full bg-black/50 border border-white/15 focus:border-cyan-400 rounded-xl px-3.5 py-2.5 text-white font-mono text-xs outline-none"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              Create a new repo on{" "}
              <a
                href="https://github.com/new"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 hover:underline inline-flex items-center gap-0.5"
              >
                github.com/new <ExternalLink className="w-2.5 h-2.5" />
              </a>{" "}
              (without checking "Add README" if you want to push this codebase directly).
            </span>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-slate-300 font-bold flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
                <span>2. GitHub Personal Access Token (PAT)</span>
              </label>
              <a
                href="https://github.com/settings/tokens/new?scopes=repo&description=Dravis+ASI+Deploy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-cyan-400 hover:underline flex items-center gap-1"
              >
                <span>Generate Token on GitHub</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              className="w-full bg-black/50 border border-white/15 focus:border-cyan-400 rounded-xl px-3.5 py-2.5 text-white font-mono text-xs outline-none"
            />
            <span className="text-[10px] text-slate-400 mt-1 block font-sans">
              GitHub requires a personal token with <strong className="text-cyan-300">repo</strong> permission to authenticate HTTPS pushes. Never committed or stored publicly.
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-slate-300 font-bold block mb-1">Target Branch</label>
              <input
                type="text"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                placeholder="main"
                className="w-full bg-black/50 border border-white/15 focus:border-cyan-400 rounded-xl px-3 py-2 text-white font-mono text-xs outline-none"
              />
            </div>
            <div>
              <label className="text-slate-300 font-bold block mb-1">Commit Message</label>
              <input
                type="text"
                value={commitMessage}
                onChange={(e) => setCommitMessage(e.target.value)}
                placeholder="Push Dravis ASI to GitHub"
                className="w-full bg-black/50 border border-white/15 focus:border-cyan-400 rounded-xl px-3 py-2 text-white font-mono text-xs outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="forcePushCheck"
              checked={forcePush}
              onChange={(e) => setForcePush(e.target.checked)}
              className="accent-cyan-400 cursor-pointer"
            />
            <label htmlFor="forcePushCheck" className="text-slate-300 text-xs cursor-pointer">
              Force push (<code className="text-cyan-300">--force</code>) to overwrite remote repository history if necessary
            </label>
          </div>

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-white/10">
            {/* Download Full Clean ZIP Button */}
            <a
              href="/api/github/download-zip"
              download="dravis-asi-source-code.zip"
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-mono text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <FolderArchive className="w-4 h-4 text-amber-400" />
              <span>Download Clean ZIP</span>
            </a>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs cursor-pointer transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPushing}
                className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-mono text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(34,211,238,0.4)] transition-all disabled:opacity-50"
              >
                {isPushing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Pushing to GitHub...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-4 h-4" />
                    <span>Push to GitHub</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Alternative: Copy CLI Commands */}
        <div className="p-3.5 rounded-2xl bg-black/60 border border-white/10 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold text-slate-300 flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-cyan-400" />
              <span>Or Push via your Local Terminal (CLI)</span>
            </span>
            <button
              type="button"
              onClick={copyCliToClipboard}
              className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-cyan-300 text-[10px] font-mono flex items-center gap-1 cursor-pointer transition-all"
            >
              {copiedCli ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy CLI Commands</span>
                </>
              )}
            </button>
          </div>
          <pre className="text-[11px] font-mono text-cyan-200/90 bg-black/50 p-2.5 rounded-xl overflow-x-auto whitespace-pre leading-relaxed border border-white/5">
            {cliSnippet}
          </pre>
        </div>

        {/* Security badge */}
        <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 font-mono text-center">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>Local isolated container push. Your token is used only during push and wiped from remote config immediately.</span>
        </div>
      </motion.div>
    </div>
  );
};
