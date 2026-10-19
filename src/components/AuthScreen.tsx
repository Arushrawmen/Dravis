/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Clean First-Interface Login & Multi-Account Screen for Dravis (Desktop & Android Versions)
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ShieldCheck,
  Lock,
  Mail,
  ArrowRight,
  Sparkles,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  UserPlus,
  LogIn,
  Smartphone,
  Monitor,
  ArrowLeftRight,
  UserCheck,
  History,
} from "lucide-react";
import { UserAccount } from "../types";
import { soundEffects } from "../utils/audioSynth";
import dravisSparkLogo from "../assets/images/dravis_spark_logo_1789562293560.jpg";

interface AuthScreenProps {
  onAuthenticate: (account: UserAccount, isNewAccount?: boolean) => void;
  currentUser?: UserAccount;
  savedAccounts?: UserAccount[];
  onSwitchToAccount?: (account: UserAccount) => void;
  isAndroidResolutionActive?: boolean;
  onToggleAndroidResolution?: () => void;
  accountHistoryCounts?: Record<string, { chats: number; memories: number; logs: number }>;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  onAuthenticate,
  currentUser,
  savedAccounts = [],
  onSwitchToAccount,
  isAndroidResolutionActive = false,
  onToggleAndroidResolution,
  accountHistoryCounts = {},
}) => {
  const [authMode, setAuthMode] = useState<"LOGIN" | "SIGNUP" | "RESET">("LOGIN");
  const [email, setEmail] = useState(currentUser?.email || "arushgamer783@gmail.com");
  const [password, setPassword] = useState("••••••••••••");
  const [showPassword, setShowPassword] = useState(false);
  const [displayName, setDisplayName] = useState(currentUser?.displayName || "Arush Sir");
  const [roleTitle, setRoleTitle] = useState(currentUser?.roleTitle || "Chief Architect & Master");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSelectSavedAccount = (acc: UserAccount) => {
    setErrorMsg(null);
    setIsLoading(true);
    soundEffects.playActivatePulse();
    setSuccessMsg(`Switching to ${acc.displayName} (${acc.email}) & loading account history...`);

    setTimeout(() => {
      setIsLoading(false);
      if (onSwitchToAccount) {
        onSwitchToAccount({ ...acc, isLoggedIn: true, lastLogin: "Active Now" });
      } else {
        onAuthenticate({ ...acc, isLoggedIn: true, lastLogin: "Active Now" }, false);
      }
    }, 450);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }

    setErrorMsg(null);
    setIsLoading(true);
    soundEffects.playActivatePulse();

    setTimeout(() => {
      setIsLoading(false);
      const trimmedEmail = email.trim().toLowerCase();
      const existing = savedAccounts.find((a) => a.email.toLowerCase() === trimmedEmail);

      if (existing && authMode === "LOGIN") {
        const updatedExisting: UserAccount = {
          ...existing,
          isLoggedIn: true,
          lastLogin: "Active Now",
        };
        setSuccessMsg(`Welcome back, ${existing.displayName}. Loading your personal history...`);
        setTimeout(() => {
          onAuthenticate(updatedExisting, false);
        }, 400);
        return;
      }

      const namePart =
        authMode === "SIGNUP"
          ? displayName.trim() || email.split("@")[0] || "User"
          : existing?.displayName || displayName.trim() || email.split("@")[0] || "Arush Sir";

      const authenticatedAccount: UserAccount = {
        id: existing?.id || "usr-" + Date.now(),
        email: email.trim(),
        displayName: namePart,
        roleTitle:
          authMode === "SIGNUP"
            ? roleTitle.trim() || "Authorized Operator"
            : existing?.roleTitle || "Chief Architect & Master",
        provider: "EMAIL",
        avatarUrl:
          existing?.avatarUrl ||
          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
        createdAt: existing?.createdAt || new Date().toISOString(),
        lastLogin: "Active Now",
        isLoggedIn: true,
        isSupervised: false,
        sessions: [
          {
            id: "sess-" + Date.now(),
            device: isAndroidResolutionActive
              ? "Android Liquid Glass OS"
              : "Desktop Workstation (Windows 11 / Pro)",
            ip: "192.168.1.104",
            location: "Local Device",
            lastActive: "Active Now",
            isCurrent: true,
          },
        ],
      };

      setSuccessMsg(
        authMode === "SIGNUP"
          ? `Account created for ${namePart}. Initializing clean history & workspace...`
          : `Authenticated as ${namePart}. Loading DRAVIS...`
      );
      setTimeout(() => {
        onAuthenticate(authenticatedAccount, authMode === "SIGNUP" || !existing);
      }, 450);
    }, 600);
  };

  const handleGoogleAuth = () => {
    setIsLoading(true);
    setErrorMsg(null);
    soundEffects.playActivatePulse();

    setTimeout(() => {
      setIsLoading(false);
      const existingGoogle = savedAccounts.find(
        (a) => a.email.toLowerCase() === "arushgamer783@gmail.com"
      );
      const googleAccount: UserAccount = existingGoogle
        ? {
            ...existingGoogle,
            isLoggedIn: true,
            lastLogin: "Just Now via Google OAuth",
          }
        : {
            id: "usr-arush-9942",
            email: "arushgamer783@gmail.com",
            displayName: "Arush Sir",
            roleTitle: "Chief Architect & Master",
            provider: "GOOGLE",
            avatarUrl:
              "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
            createdAt: new Date().toISOString(),
            lastLogin: "Just Now via Google OAuth",
            isLoggedIn: true,
            isSupervised: false,
            sessions: [
              {
                id: "sess-google-" + Date.now(),
                device: isAndroidResolutionActive
                  ? "Android Companion (Google Verified)"
                  : "Workstation (Google Verified)",
                ip: "192.168.1.104",
                location: "Google Secure Identity",
                lastActive: "Active Now",
                isCurrent: true,
              },
            ],
          };
      setSuccessMsg("Google account verified. Loading Arush Sir's workspace & history...");
      setTimeout(() => {
        onAuthenticate(googleAccount, false);
      }, 450);
    }, 550);
  };

  return (
    <div
      id="dravis-auth-screen"
      className="relative w-screen h-screen bg-[#020617] text-white flex flex-col items-center justify-center p-4 overflow-y-auto select-none font-sans"
    >
      {/* Subtle Clean Ambient Glow */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(34,211,238,0.14),transparent_65%)] pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_85%,rgba(251,191,36,0.08),transparent_60%)] pointer-events-none" />

      {/* Top Platform Mode Switcher (Desktop Login vs Android Login) */}
      <div className="relative z-20 mb-4 flex items-center gap-2 p-1.5 rounded-full bg-slate-900/90 border border-white/15 backdrop-blur-xl shadow-lg">
        <button
          type="button"
          onClick={() => {
            if (isAndroidResolutionActive && onToggleAndroidResolution) {
              soundEffects.playChirp();
              onToggleAndroidResolution();
            }
          }}
          className={`px-4 py-1.5 rounded-full text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
            !isAndroidResolutionActive
              ? "bg-cyan-400 text-slate-950 shadow-[0_0_15px_rgba(34,211,238,0.4)]"
              : "text-slate-300 hover:text-white"
          }`}
        >
          <Monitor className="w-3.5 h-3.5" />
          <span>Desktop Login</span>
        </button>
        <button
          type="button"
          onClick={() => {
            if (!isAndroidResolutionActive && onToggleAndroidResolution) {
              soundEffects.playChirp();
              onToggleAndroidResolution();
            }
          }}
          className={`px-4 py-1.5 rounded-full text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
            isAndroidResolutionActive
              ? "bg-cyan-400 text-slate-950 shadow-[0_0_15px_rgba(34,211,238,0.4)]"
              : "text-slate-300 hover:text-white"
          }`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Android Login</span>
        </button>
      </div>

      {/* =====================================================================
          ANDROID VERSION LOGIN INTERFACE vs DESKTOP VERSION LOGIN INTERFACE
         ===================================================================== */}
      <motion.div
        key={isAndroidResolutionActive ? "android-login" : "desktop-login"}
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className={`relative z-10 w-full ${
          isAndroidResolutionActive
            ? "max-w-[400px] rounded-[42px] bg-slate-950/85 border border-white/15 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.85),0_0_40px_rgba(34,211,238,0.18)]"
            : "max-w-[880px] rounded-3xl bg-slate-950/85 border border-cyan-500/25 p-6 sm:p-8 shadow-[0_24px_80px_rgba(0,0,0,0.85),0_0_50px_rgba(6,182,212,0.2)]"
        } backdrop-blur-2xl flex flex-col gap-5`}
      >
        {/* Android Status Notch Bar (Only in Android Version) */}
        {isAndroidResolutionActive && (
          <div className="flex items-center justify-between px-2 pb-1 text-[11px] font-mono text-slate-400">
            <span className="font-bold text-white">DRAVIS ANDROID OS</span>
            <div className="w-16 h-4 rounded-full bg-black border border-white/10" />
            <span className="text-cyan-300">5G • 100%</span>
          </div>
        )}

        <div
          className={
            isAndroidResolutionActive
              ? "flex flex-col gap-5"
              : "grid grid-cols-1 md:grid-cols-12 gap-6 items-start"
          }
        >
          {/* LEFT / TOP COLUMN: Brand Identity + Saved Accounts Quick Switcher */}
          <div
            className={
              isAndroidResolutionActive
                ? "flex flex-col gap-4"
                : "md:col-span-5 flex flex-col gap-5 md:border-r md:border-white/10 md:pr-6"
            }
          >
            {/* Glowing Cute Dravis Avatar & Header */}
            <div className="flex flex-col items-center text-center gap-2.5">
              <div className="relative w-20 h-20 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-cyan-400/35 via-sky-400/20 to-amber-400/35 blur-xl animate-pulse" />
                <img
                  src={dravisSparkLogo}
                  alt="Dravis"
                  className="relative w-16 h-16 rounded-full object-cover shadow-[0_0_25px_rgba(34,211,238,0.5)]"
                />
              </div>

              <div>
                <h1 className="text-2xl font-extrabold tracking-tight text-white">
                  Welcome to DRAVIS
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  {isAndroidResolutionActive
                    ? "Android Liquid Glass Edition • Sign in or switch account"
                    : "Desktop Workstation OS • Sign in or switch your account"}
                </p>
              </div>
            </div>

            {/* Saved Accounts List with Direct "Switch" Button Next to Account Name */}
            {savedAccounts.length > 0 && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[11px] font-mono font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Saved Accounts ({savedAccounts.length})</span>
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    1-Click Switch
                  </span>
                </div>

                <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-0.5">
                  {savedAccounts.map((acc) => {
                    const counts = accountHistoryCounts[acc.id] || {
                      chats: acc.id === "usr-arush-9942" ? 4 : 3,
                      memories: acc.id === "usr-arush-9942" ? 6 : 2,
                      logs: acc.id === "usr-arush-9942" ? 3 : 2,
                    };
                    return (
                      <div
                        key={acc.id}
                        className="p-2.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-cyan-400/40 transition-all flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500/30 to-blue-600/30 border border-cyan-400/40 flex items-center justify-center text-cyan-200 font-bold text-sm shrink-0 overflow-hidden">
                            {acc.avatarUrl ? (
                              <img
                                src={acc.avatarUrl}
                                alt={acc.displayName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              acc.displayName.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-white truncate">
                                {acc.displayName}
                              </span>
                            </div>
                            <span className="text-[10px] font-mono text-slate-400 block truncate">
                              {acc.email}
                            </span>
                            <span className="text-[9px] font-mono text-cyan-300/80 flex items-center gap-1 mt-0.5">
                              <History className="w-2.5 h-2.5" />
                              {counts.chats} chats · {counts.memories} memories
                            </span>
                          </div>
                        </div>

                        {/* Switch Button right next to the account name */}
                        <button
                          type="button"
                          onClick={() => handleSelectSavedAccount(acc)}
                          disabled={isLoading}
                          className="px-3 py-1.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-mono text-[11px] font-bold flex items-center gap-1 shrink-0 cursor-pointer shadow-[0_0_12px_rgba(34,211,238,0.35)] transition-all"
                        >
                          <ArrowLeftRight className="w-3 h-3" />
                          <span>Switch</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT / BOTTOM COLUMN: Clean Login / Add Account Form */}
          <div className={isAndroidResolutionActive ? "flex flex-col gap-4" : "md:col-span-7 flex flex-col gap-4"}>
            {/* Mode Switcher Tabs: Sign In vs Add Account */}
            <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-slate-900/90 border border-white/10">
              <button
                type="button"
                onClick={() => {
                  soundEffects.playChirp();
                  setAuthMode("LOGIN");
                  setErrorMsg(null);
                }}
                className={`py-2 px-3 rounded-xl font-mono text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  authMode === "LOGIN"
                    ? "bg-cyan-400 text-slate-950 shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  soundEffects.playChirp();
                  setAuthMode("SIGNUP");
                  setDisplayName("");
                  setEmail("");
                  setPassword("");
                  setErrorMsg(null);
                }}
                className={`py-2 px-3 rounded-xl font-mono text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  authMode === "SIGNUP"
                    ? "bg-cyan-400 text-slate-950 shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Add New Account</span>
              </button>
            </div>

            {/* Status Notification Alerts */}
            <AnimatePresence>
              {errorMsg && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-2 p-3 rounded-xl bg-red-500/15 border border-red-500/35 text-red-200 text-xs font-mono"
                >
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{errorMsg}</span>
                </motion.div>
              )}

              {successMsg && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/35 text-emerald-200 text-xs font-mono"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{successMsg}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Primary Login / Create Account Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
              {authMode === "SIGNUP" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-mono text-slate-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Account Name
                    </label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="e.g. Aryan Sharma"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 focus:border-cyan-400 focus:outline-none text-white text-sm"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-mono text-slate-300">
                      Role / Profile Title
                    </label>
                    <input
                      type="text"
                      value={roleTitle}
                      onChange={(e) => setRoleTitle(e.target.value)}
                      placeholder="e.g. Creator & Engineer"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 focus:border-cyan-400 focus:outline-none text-white text-sm"
                    />
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-mono text-slate-300 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-cyan-400" /> Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="arushgamer783@gmail.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 focus:border-cyan-400 focus:outline-none text-white text-sm pl-9"
                    required
                  />
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                </div>
              </div>

              {authMode !== "RESET" && (
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-mono text-slate-300 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-cyan-400" /> Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setAuthMode("RESET")}
                      className="text-[10px] text-cyan-400 hover:text-cyan-300 font-mono cursor-pointer"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 focus:border-cyan-400 focus:outline-none text-white text-sm pl-9 pr-9"
                      required
                    />
                    <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-slate-500 hover:text-slate-300 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Primary Action Buttons */}
              <div className="flex flex-col gap-2.5 mt-1">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-400 to-sky-500 hover:from-cyan-300 hover:to-sky-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.35)] transition-all cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>
                        {authMode === "LOGIN"
                          ? "Sign In to DRAVIS"
                          : authMode === "SIGNUP"
                          ? "Create & Switch to Account"
                          : "Send Reset Link"}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleGoogleAuth}
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-white font-medium text-xs flex items-center justify-center gap-2.5 transition-all cursor-pointer"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#EA4335"
                      d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12 0 14.5s.7 4.8 1.9 7.2l3.7-2.9z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 17C3.7 20.7 7.5 24 12 24z"
                    />
                  </svg>
                  <span>Continue with Google (arushgamer783@gmail.com)</span>
                </button>
              </div>
            </form>

            <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 font-mono text-center pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>Each account keeps its own private chat history, memories, files & profile.</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
