/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Gmail Intelligence Console for Dravis ASI (Desktop HUD & Android Liquid Glass)
 */

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Mail,
  Inbox,
  Send,
  Star,
  Trash2,
  FileText,
  Search,
  RefreshCw,
  Plus,
  ArrowLeft,
  Reply,
  Forward,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Sparkles,
  User,
  LogOut,
  Clock,
  ShieldCheck,
  X,
  Maximize2,
  Filter,
} from "lucide-react";
import {
  gmailApi,
  ParsedEmailMessage,
  GmailProfile,
} from "../../services/gmailApi";
import {
  initAuth,
  googleSignIn,
  logout,
  getAccessToken,
  getCachedUser,
} from "../../services/googleAuth";
import { soundEffects } from "../../utils/audioSynth";

interface GmailConsoleProps {
  onSpeak?: (text: string) => void;
  soundEffectsEnabled?: boolean;
  onClose?: () => void;
  isCompact?: boolean;
}

export const GmailConsole: React.FC<GmailConsoleProps> = ({
  onSpeak,
  soundEffectsEnabled = true,
  onClose,
  isCompact = false,
}) => {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<GmailProfile | null>(null);
  const [googleUser, setGoogleUser] = useState<any>(null);

  // Email state
  const [activeFolder, setActiveFolder] = useState<
    "INBOX" | "STARRED" | "SENT" | "DRAFT" | "TRASH" | "UNREAD"
  >("INBOX");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [messages, setMessages] = useState<ParsedEmailMessage[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState<boolean>(false);
  const [selectedMessage, setSelectedMessage] =
    useState<ParsedEmailMessage | null>(null);

  // Compose Modal State
  const [isComposeOpen, setIsComposeOpen] = useState<boolean>(false);
  const [composeTo, setComposeTo] = useState<string>("");
  const [composeSubject, setComposeSubject] = useState<string>("");
  const [composeBody, setComposeBody] = useState<string>("");
  const [composeCc, setComposeCc] = useState<string>("");
  const [showCc, setShowCc] = useState<boolean>(false);
  const [isAiDrafting, setIsAiDrafting] = useState<boolean>(false);
  const [aiDraftPrompt, setAiDraftPrompt] = useState<string>("");
  const [showAiDraftInput, setShowAiDraftInput] = useState<boolean>(false);

  // Confirmation Modal State (MANDATORY for Mutating / Destructive actions)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    actionLabel: string;
    isDestructive?: boolean;
    onConfirm: () => Promise<void>;
  }>({
    isOpen: false,
    title: "",
    description: "",
    actionLabel: "Confirm",
    onConfirm: async () => {},
  });
  const [isActionPending, setIsActionPending] = useState<boolean>(false);
  const [statusNotification, setStatusNotification] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);

  const notify = (text: string, type: "success" | "error" | "info" = "info") => {
    setStatusNotification({ type, text });
    setTimeout(() => setStatusNotification(null), 4000);
  };

  // Check auth state on mount
  useEffect(() => {
    const unsubscribe = initAuth(
      (user) => {
        setIsAuthenticated(true);
        setGoogleUser(user);
        loadProfileAndEmails();
      },
      () => {
        setIsAuthenticated(false);
        setUserProfile(null);
        setGoogleUser(null);
      }
    );

    // Initial check
    getAccessToken().then((token) => {
      if (token) {
        setIsAuthenticated(true);
        setGoogleUser(getCachedUser());
        loadProfileAndEmails();
      }
    });

    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, []);

  const handleGoogleSignInClick = async () => {
    setIsAuthenticating(true);
    setAuthError(null);
    if (soundEffectsEnabled) soundEffects.playActivatePulse();

    try {
      const res = await googleSignIn();
      if (res) {
        setIsAuthenticated(true);
        setGoogleUser(res.user);
        if (soundEffectsEnabled) soundEffects.playStartupChime();
        notify("Successfully authenticated with Google Workspace!", "success");
        onSpeak?.("Google Workspace authentication confirmed. Gmail access online.");
        await loadProfileAndEmails();
      }
    } catch (err: any) {
      console.error(err);
      setAuthError(err?.message || "Failed to sign in with Google.");
      if (soundEffectsEnabled) soundEffects.playAlert();
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleSignOutClick = async () => {
    await logout();
    setIsAuthenticated(false);
    setUserProfile(null);
    setMessages([]);
    setSelectedMessage(null);
    notify("Signed out from Google Workspace.", "info");
  };

  // Load Gmail Profile & Message List
  const loadProfileAndEmails = useCallback(async () => {
    setIsLoadingMessages(true);
    try {
      const profile = await gmailApi.getProfile();
      setUserProfile(profile);

      // Build query based on active folder
      let q = searchQuery.trim();
      let labelIds: string[] = [];

      if (!q) {
        if (activeFolder === "INBOX") {
          labelIds = ["INBOX"];
        } else if (activeFolder === "STARRED") {
          labelIds = ["STARRED"];
        } else if (activeFolder === "SENT") {
          labelIds = ["SENT"];
        } else if (activeFolder === "DRAFT") {
          labelIds = ["DRAFT"];
        } else if (activeFolder === "TRASH") {
          labelIds = ["TRASH"];
        } else if (activeFolder === "UNREAD") {
          labelIds = ["INBOX", "UNREAD"];
        }
      }

      const listRes = await gmailApi.listMessages({
        q: q || undefined,
        labelIds: labelIds.length > 0 ? labelIds : undefined,
        maxResults: 15,
      });

      if (listRes.messages && listRes.messages.length > 0) {
        const fullMessages = await gmailApi.fetchMessagesBatch(listRes.messages);
        setMessages(fullMessages);
      } else {
        setMessages([]);
      }
    } catch (err: any) {
      console.error("Failed to load Gmail messages:", err);
      // If 401 unauthenticated, mark auth required
      if (
        String(err?.message || "").includes("401") ||
        String(err?.message || "").includes("Authentication required")
      ) {
        setIsAuthenticated(false);
      }
    } finally {
      setIsLoadingMessages(false);
    }
  }, [activeFolder, searchQuery]);

  // Reload when active folder or search query changes
  useEffect(() => {
    if (isAuthenticated) {
      loadProfileAndEmails();
    }
  }, [activeFolder, isAuthenticated, loadProfileAndEmails]);

  // Toggle Star Status
  const handleToggleStar = async (msg: ParsedEmailMessage, e: React.MouseEvent) => {
    e.stopPropagation();
    if (soundEffectsEnabled) soundEffects.playChirp();

    const willBeStarred = !msg.isStarred;
    setMessages((prev) =>
      prev.map((m) => (m.id === msg.id ? { ...m, isStarred: willBeStarred } : m))
    );
    if (selectedMessage?.id === msg.id) {
      setSelectedMessage((prev) => (prev ? { ...prev, isStarred: willBeStarred } : null));
    }

    try {
      if (willBeStarred) {
        await gmailApi.modifyMessageLabels(msg.id, ["STARRED"], []);
      } else {
        await gmailApi.modifyMessageLabels(msg.id, [], ["STARRED"]);
      }
    } catch (err) {
      console.error(err);
      notify("Failed to update star label", "error");
    }
  };

  // Toggle Read / Unread Status
  const handleToggleRead = async (msg: ParsedEmailMessage, e: React.MouseEvent) => {
    e.stopPropagation();
    if (soundEffectsEnabled) soundEffects.playChirp();

    const willBeUnread = !msg.isUnread;
    setMessages((prev) =>
      prev.map((m) => (m.id === msg.id ? { ...m, isUnread: willBeUnread } : m))
    );

    try {
      if (willBeUnread) {
        await gmailApi.modifyMessageLabels(msg.id, ["UNREAD"], []);
      } else {
        await gmailApi.modifyMessageLabels(msg.id, [], ["UNREAD"]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Trash Message with REQUIRED Explicit Confirmation
  const handleRequestTrash = (msg: ParsedEmailMessage, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (soundEffectsEnabled) soundEffects.playAlert();

    setConfirmDialog({
      isOpen: true,
      title: "Move Email to Trash?",
      description: `Are you sure you want to move the email "${msg.subject}" from ${msg.fromName} to the Trash folder?`,
      actionLabel: "Move to Trash",
      isDestructive: true,
      onConfirm: async () => {
        setIsActionPending(true);
        try {
          await gmailApi.trashMessage(msg.id);
          setMessages((prev) => prev.filter((m) => m.id !== msg.id));
          if (selectedMessage?.id === msg.id) {
            setSelectedMessage(null);
          }
          notify("Email moved to Trash.", "info");
          if (soundEffectsEnabled) soundEffects.playAlert();
        } catch (err: any) {
          notify(err?.message || "Failed to move email to Trash.", "error");
        } finally {
          setIsActionPending(false);
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  // Send Email with REQUIRED Explicit Confirmation
  const handleRequestSendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeTo.trim()) {
      notify("Please provide a recipient email address.", "error");
      return;
    }
    if (!composeSubject.trim()) {
      notify("Please provide an email subject line.", "error");
      return;
    }

    if (soundEffectsEnabled) soundEffects.playChirp();

    setConfirmDialog({
      isOpen: true,
      title: "Confirm Sending Email",
      description: `Do you want to send this email to "${composeTo}" with subject "${composeSubject}"?`,
      actionLabel: "Send Email Now",
      isDestructive: false,
      onConfirm: async () => {
        setIsActionPending(true);
        try {
          await gmailApi.sendEmail({
            to: composeTo.trim(),
            subject: composeSubject.trim(),
            body: composeBody.trim() || "(No content)",
            cc: composeCc.trim() || undefined,
          });

          if (soundEffectsEnabled) soundEffects.playStartupChime();
          notify(`Email sent successfully to ${composeTo}!`, "success");
          onSpeak?.(`Email sent successfully to ${composeTo}.`);
          setIsComposeOpen(false);
          setComposeTo("");
          setComposeSubject("");
          setComposeBody("");
          setComposeCc("");
          setShowCc(false);
          // Reload Sent messages
          if (activeFolder === "SENT") {
            loadProfileAndEmails();
          }
        } catch (err: any) {
          notify(err?.message || "Failed to send email.", "error");
        } finally {
          setIsActionPending(false);
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  // Dravis AI Smart Email Drafter
  const handleGenerateAiEmailDraft = async () => {
    if (!aiDraftPrompt.trim()) return;
    setIsAiDrafting(true);
    if (soundEffectsEnabled) soundEffects.playActivatePulse();

    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `You are Dravis ASI, a master executive assistant. Draft a concise, highly professional, polite email based on the following instruction: "${aiDraftPrompt}".
Recipient: ${composeTo || "Recipient"}
Subject Context: ${composeSubject || "General"}

Output format: Return ONLY the ready-to-send email body text without preambles or greetings explanations.`,
        }),
      });

      const data = await res.json();
      if (data.text) {
        setComposeBody(data.text.trim());
        setShowAiDraftInput(false);
        setAiDraftPrompt("");
        notify("AI Draft inserted into email body!", "success");
      }
    } catch (err) {
      console.error(err);
      notify("Failed to generate AI draft.", "error");
    } finally {
      setIsAiDrafting(false);
    }
  };

  // Reply handler
  const handleInitiateReply = (msg: ParsedEmailMessage) => {
    setComposeTo(msg.fromEmail || msg.from);
    setComposeSubject(
      msg.subject.startsWith("Re:") ? msg.subject : `Re: ${msg.subject}`
    );
    setComposeBody(
      `\n\n--- On ${msg.date}, ${msg.from} wrote:\n> ${msg.snippet}`
    );
    setIsComposeOpen(true);
  };

  // Forward handler
  const handleInitiateForward = (msg: ParsedEmailMessage) => {
    setComposeTo("");
    setComposeSubject(
      msg.subject.startsWith("Fwd:") ? msg.subject : `Fwd: ${msg.subject}`
    );
    setComposeBody(
      `\n\n---------- Forwarded message ---------\nFrom: ${msg.from}\nDate: ${msg.date}\nSubject: ${msg.subject}\nTo: ${msg.to}\n\n${msg.bodyText || msg.snippet}`
    );
    setIsComposeOpen(true);
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-slate-950 text-slate-100 font-sans select-none overflow-hidden">
      {/* 1. TOP HEADER & TELEMETRY */}
      <div className="px-4 py-3 border-b border-cyan-500/20 bg-slate-900/60 backdrop-blur-md flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500/20 via-pink-500/20 to-amber-500/20 border border-red-500/40 flex items-center justify-center text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.25)]">
            <Mail className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-mono font-bold text-white tracking-wide truncate">
                Gmail Workspace Hub
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-red-500/20 text-red-300 border border-red-500/30">
                Official API
              </span>
            </div>
            <p className="text-[11px] font-mono text-slate-400 truncate">
              {isAuthenticated
                ? userProfile?.emailAddress || googleUser?.email || "Connected via Google Workspace"
                : "Secure Client-Side OAuth • Zero Stored Passwords"}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <>
              <button
                type="button"
                onClick={() => {
                  if (soundEffectsEnabled) soundEffects.playChirp();
                  setIsComposeOpen(true);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-red-500 hover:bg-red-400 text-white font-mono text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-[0_0_15px_rgba(239,68,68,0.35)] transition-all active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Compose</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (soundEffectsEnabled) soundEffects.playChirp();
                  loadProfileAndEmails();
                }}
                disabled={isLoadingMessages}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 cursor-pointer transition-all"
                title="Refresh mailbox"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${isLoadingMessages ? "animate-spin text-cyan-400" : ""}`}
                />
              </button>

              <button
                type="button"
                onClick={handleSignOutClick}
                className="p-2 rounded-xl bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-300 border border-white/10 cursor-pointer transition-all"
                title="Sign out of Google"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleGoogleSignInClick}
              disabled={isAuthenticating}
              className="px-4 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs font-mono flex items-center gap-2 cursor-pointer shadow-md transition-all active:scale-95"
            >
              {isAuthenticating ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <svg className="w-3.5 h-3.5" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
              )}
              <span>{isAuthenticating ? "Connecting..." : "Connect Gmail"}</span>
            </button>
          )}

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Notification Toast */}
      <AnimatePresence>
        {statusNotification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`absolute top-14 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-2xl border text-xs font-mono shadow-2xl flex items-center gap-2 ${
              statusNotification.type === "success"
                ? "bg-emerald-950/90 border-emerald-400/50 text-emerald-200"
                : statusNotification.type === "error"
                ? "bg-red-950/90 border-red-400/50 text-red-200"
                : "bg-slate-900/90 border-cyan-400/50 text-cyan-200"
            }`}
          >
            {statusNotification.type === "success" ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            ) : statusNotification.type === "error" ? (
              <AlertCircle className="w-3.5 h-3.5 text-red-400" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            )}
            <span>{statusNotification.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. MAIN BODY */}
      {!isAuthenticated ? (
        /* UNAUTHENTICATED STATE — OFFICIAL SIGN IN WITH GOOGLE HERO */
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center overflow-y-auto">
          <div className="w-16 h-16 rounded-3xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mb-4 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
            <Mail className="w-8 h-8" />
          </div>

          <h3 className="text-xl font-bold font-mono text-white mb-2">
            Connect Your Gmail Workspace
          </h3>
          <p className="text-xs text-slate-400 max-w-md leading-relaxed mb-6 font-mono">
            Authorize Dravis ASI to securely read, search, draft, and manage your emails.
            With your explicit permission, all tokens are kept in temporary volatile memory and never stored in cookies or disks.
          </p>

          {/* Official Google Sign-In Button as mandated by skill */}
          <button
            type="button"
            onClick={handleGoogleSignInClick}
            disabled={isAuthenticating}
            className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-white hover:bg-slate-100 text-slate-800 font-medium text-sm shadow-[0_4px_25px_rgba(255,255,255,0.15)] transition-all active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <div className="w-5 h-5 flex items-center justify-center">
              <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                <path fill="none" d="M0 0h48v48H0z" />
              </svg>
            </div>
            <span className="font-sans font-semibold tracking-wide">
              {isAuthenticating ? "Opening Google Sign In..." : "Sign in with Google"}
            </span>
          </button>

          {authError && (
            <div className="mt-4 p-3 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs font-mono max-w-md">
              {authError}
            </div>
          )}

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-lg text-left">
            <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5">
              <span className="text-[10px] font-mono font-bold text-red-300 block mb-1">
                📥 Live Mailbox Sync
              </span>
              <p className="text-[11px] text-slate-400">
                Browse inbox, sent, starred, and drafts with instant search.
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5">
              <span className="text-[10px] font-mono font-bold text-cyan-300 block mb-1">
                ✨ Dravis AI Drafter
              </span>
              <p className="text-[11px] text-slate-400">
                Generate polished, context-aware emails and fast replies.
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5">
              <span className="text-[10px] font-mono font-bold text-emerald-300 block mb-1">
                🛡️ Safe Execution
              </span>
              <p className="text-[11px] text-slate-400">
                Explicit confirmation dialogs before sending or deleting emails.
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* AUTHENTICATED STATE — FULL GMAIL CONSOLE */
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
          {/* FOLDERS SIDEBAR */}
          <div className="w-full md:w-56 p-3 border-b md:border-b-0 md:border-r border-white/10 bg-slate-950/80 flex md:flex-col gap-1.5 shrink-0 overflow-x-auto md:overflow-y-auto">
            {[
              { id: "INBOX" as const, label: "Inbox", icon: Inbox, count: userProfile?.messagesTotal },
              { id: "UNREAD" as const, label: "Unread", icon: Mail },
              { id: "STARRED" as const, label: "Starred", icon: Star },
              { id: "SENT" as const, label: "Sent", icon: Send },
              { id: "DRAFT" as const, label: "Drafts", icon: FileText },
              { id: "TRASH" as const, label: "Trash", icon: Trash2 },
            ].map((folder) => {
              const Icon = folder.icon;
              const isActive = activeFolder === folder.id;
              return (
                <button
                  key={folder.id}
                  onClick={() => {
                    if (soundEffectsEnabled) soundEffects.playChirp();
                    setActiveFolder(folder.id);
                    setSelectedMessage(null);
                  }}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? "bg-red-500/20 text-red-200 border border-red-500/40 shadow-sm"
                      : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{folder.label}</span>
                  </div>
                  {folder.id === "INBOX" && userProfile?.messagesTotal !== undefined && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-white/10 text-slate-300">
                      {userProfile.messagesTotal}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* MESSAGES LIST & READING PANE */}
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
            {/* List Column */}
            <div
              className={`w-full md:w-80 lg:w-96 border-b md:border-b-0 md:border-r border-white/10 flex flex-col min-h-0 overflow-hidden ${
                selectedMessage ? "hidden md:flex" : "flex"
              }`}
            >
              {/* Search Bar */}
              <div className="p-2.5 border-b border-white/10 bg-slate-900/40">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        loadProfileAndEmails();
                      }
                    }}
                    placeholder={`Search ${activeFolder.toLowerCase()} emails...`}
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-black/40 border border-white/10 focus:border-red-400/50 text-white text-xs font-mono outline-none"
                  />
                </div>
              </div>

              {/* Messages Scroll Area */}
              <div className="flex-1 overflow-y-auto divide-y divide-white/5">
                {isLoadingMessages ? (
                  <div className="p-8 text-center flex flex-col items-center justify-center gap-2 text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin text-red-400" />
                    <span className="text-xs font-mono">Syncing messages from Gmail...</span>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-xs font-mono">
                    No emails found in {activeFolder.toLowerCase()}.
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isSelected = selectedMessage?.id === msg.id;
                    return (
                      <div
                        key={msg.id}
                        onClick={() => {
                          if (soundEffectsEnabled) soundEffects.playChirp();
                          setSelectedMessage(msg);
                        }}
                        className={`p-3 cursor-pointer transition-all flex flex-col gap-1 border-l-2 ${
                          isSelected
                            ? "bg-red-500/10 border-l-red-400 text-white"
                            : msg.isUnread
                            ? "bg-white/[0.04] border-l-cyan-400 text-white font-semibold"
                            : "bg-transparent border-l-transparent text-slate-300 hover:bg-white/[0.02]"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            {msg.isUnread && (
                              <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0" />
                            )}
                            <span className="text-xs font-mono truncate">{msg.fromName}</span>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <span className="text-[10px] font-mono text-slate-400">
                              {new Date(msg.dateTimestamp).toLocaleDateString([], {
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => handleToggleStar(msg, e)}
                              className="p-1 hover:text-amber-400 text-slate-400 cursor-pointer"
                            >
                              <Star
                                className={`w-3.5 h-3.5 ${
                                  msg.isStarred ? "text-amber-400 fill-amber-400" : ""
                                }`}
                              />
                            </button>
                          </div>
                        </div>

                        <div className="text-xs truncate font-mono text-slate-200">
                          {msg.subject}
                        </div>

                        <div className="text-[11px] text-slate-400 line-clamp-1 font-sans">
                          {msg.snippet}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Reading Pane Column */}
            <div
              className={`flex-1 flex flex-col min-h-0 bg-slate-950/60 overflow-hidden ${
                !selectedMessage ? "hidden md:flex" : "flex"
              }`}
            >
              {selectedMessage ? (
                <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                  {/* Message Detail Toolbar */}
                  <div className="p-3 border-b border-white/10 bg-slate-900/40 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedMessage(null)}
                        className="md:hidden p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 cursor-pointer"
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleInitiateReply(selectedMessage)}
                        className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Reply className="w-3.5 h-3.5" />
                        <span>Reply</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleInitiateForward(selectedMessage)}
                        className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Forward className="w-3.5 h-3.5" />
                        <span>Forward</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => handleToggleStar(selectedMessage, e)}
                        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 cursor-pointer"
                        title={selectedMessage.isStarred ? "Unstar" : "Star"}
                      >
                        <Star
                          className={`w-4 h-4 ${
                            selectedMessage.isStarred ? "text-amber-400 fill-amber-400" : ""
                          }`}
                        />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleToggleRead(selectedMessage, e)}
                        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 cursor-pointer"
                        title={selectedMessage.isUnread ? "Mark as Read" : "Mark as Unread"}
                      >
                        <Mail className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleRequestTrash(selectedMessage, e)}
                        className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/30 cursor-pointer"
                        title="Move to Trash"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Message Detail Content */}
                  <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-4">
                    {/* Header info */}
                    <div className="flex flex-col gap-2 pb-4 border-b border-white/10">
                      <h1 className="text-base sm:text-lg font-bold text-white font-mono leading-tight">
                        {selectedMessage.subject}
                      </h1>

                      <div className="flex items-start justify-between gap-3 text-xs font-mono text-slate-400">
                        <div>
                          <div className="text-slate-200">
                            <strong>From:</strong> {selectedMessage.from}
                          </div>
                          {selectedMessage.to && (
                            <div>
                              <strong>To:</strong> {selectedMessage.to}
                            </div>
                          )}
                        </div>
                        <span className="shrink-0 text-slate-500">
                          {selectedMessage.date ||
                            new Date(selectedMessage.dateTimestamp).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Email Body */}
                    <div className="flex-1 text-slate-200 font-sans text-sm leading-relaxed overflow-x-auto">
                      {selectedMessage.bodyHtml ? (
                        <div
                          className="prose prose-invert max-w-none text-slate-200 leading-relaxed overflow-x-auto"
                          dangerouslySetInnerHTML={{
                            __html: selectedMessage.bodyHtml,
                          }}
                        />
                      ) : (
                        <pre className="whitespace-pre-wrap font-sans text-slate-200 leading-relaxed">
                          {selectedMessage.bodyText || selectedMessage.snippet}
                        </pre>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500 font-mono text-xs">
                  <Mail className="w-10 h-10 mb-2 opacity-30" />
                  <span>Select an email from the list to preview details</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. COMPOSE EMAIL MODAL */}
      <AnimatePresence>
        {isComposeOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-2xl bg-slate-950 border border-red-500/30 rounded-3xl p-5 shadow-[0_0_60px_rgba(239,68,68,0.25)] flex flex-col gap-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-red-500/20 text-red-300 border border-red-500/30 flex items-center justify-center">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-mono font-bold text-white">
                      Compose New Email
                    </h3>
                    <p className="text-[11px] font-mono text-slate-400">
                      Sending from: {userProfile?.emailAddress || "Google Workspace"}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsComposeOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleRequestSendEmail} className="flex flex-col gap-3 font-mono text-xs">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-300 font-bold">To *</label>
                    <button
                      type="button"
                      onClick={() => setShowCc(!showCc)}
                      className="text-[11px] text-cyan-400 hover:underline cursor-pointer"
                    >
                      {showCc ? "Hide Cc" : "+ Add Cc"}
                    </button>
                  </div>
                  <input
                    type="email"
                    value={composeTo}
                    onChange={(e) => setComposeTo(e.target.value)}
                    placeholder="recipient@example.com"
                    required
                    className="w-full bg-black/50 border border-white/15 focus:border-red-400 rounded-xl px-3 py-2 text-white outline-none"
                  />
                </div>

                {showCc && (
                  <div>
                    <label className="text-slate-300 font-bold block mb-1">Cc</label>
                    <input
                      type="text"
                      value={composeCc}
                      onChange={(e) => setComposeCc(e.target.value)}
                      placeholder="cc-recipient@example.com"
                      className="w-full bg-black/50 border border-white/15 focus:border-red-400 rounded-xl px-3 py-2 text-white outline-none"
                    />
                  </div>
                )}

                <div>
                  <label className="text-slate-300 font-bold block mb-1">Subject *</label>
                  <input
                    type="text"
                    value={composeSubject}
                    onChange={(e) => setComposeSubject(e.target.value)}
                    placeholder="Email subject..."
                    required
                    className="w-full bg-black/50 border border-white/15 focus:border-red-400 rounded-xl px-3 py-2 text-white outline-none"
                  />
                </div>

                {/* AI Assistant Drafter Helper */}
                <div className="p-2.5 rounded-2xl bg-cyan-950/20 border border-cyan-400/30 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono font-bold text-cyan-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Draft with Dravis ASI</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowAiDraftInput(!showAiDraftInput)}
                      className="text-[10px] text-cyan-400 hover:underline cursor-pointer"
                    >
                      {showAiDraftInput ? "Collapse" : "Auto-Draft Email"}
                    </button>
                  </div>

                  {showAiDraftInput && (
                    <div className="flex gap-2 mt-1">
                      <input
                        type="text"
                        value={aiDraftPrompt}
                        onChange={(e) => setAiDraftPrompt(e.target.value)}
                        placeholder="e.g. Write a polite project status update and request a review..."
                        className="flex-1 bg-black/60 border border-white/15 rounded-xl px-3 py-1.5 text-xs text-white outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleGenerateAiEmailDraft}
                        disabled={isAiDrafting || !aiDraftPrompt.trim()}
                        className="px-3 py-1.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        {isAiDrafting ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : (
                          <Sparkles className="w-3 h-3" />
                        )}
                        <span>Generate</span>
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">Message Body</label>
                  <textarea
                    rows={8}
                    value={composeBody}
                    onChange={(e) => setComposeBody(e.target.value)}
                    placeholder="Write your email here..."
                    className="w-full bg-black/50 border border-white/15 focus:border-red-400 rounded-xl p-3 text-white font-sans text-xs outline-none leading-relaxed"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsComposeOpen(false)}
                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 rounded-xl bg-red-500 hover:bg-red-400 text-white font-mono font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-[0_0_15px_rgba(239,68,68,0.4)]"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Email</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. EXPLICIT CONFIRMATION MODAL (MANDATORY GUIDELINE FOR WORKSPACE MUTATIONS) */}
      <AnimatePresence>
        {confirmDialog.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-slate-950 border border-white/20 rounded-3xl p-5 shadow-2xl flex flex-col gap-4 font-sans"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                    confirmDialog.isDestructive
                      ? "bg-red-500/20 text-red-400 border border-red-500/40"
                      : "bg-cyan-500/20 text-cyan-400 border border-cyan-400/40"
                  }`}
                >
                  {confirmDialog.isDestructive ? (
                    <AlertCircle className="w-5 h-5" />
                  ) : (
                    <ShieldCheck className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-mono font-bold text-white">
                    {confirmDialog.title}
                  </h4>
                  <span className="text-[10px] font-mono text-slate-400">
                    Explicit Workspace Permission Check
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed font-mono">
                {confirmDialog.description}
              </p>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
                  disabled={isActionPending}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-mono text-xs cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={confirmDialog.onConfirm}
                  disabled={isActionPending}
                  className={`px-5 py-2 rounded-xl font-mono text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-lg transition-all ${
                    confirmDialog.isDestructive
                      ? "bg-red-500 hover:bg-red-400 text-white shadow-red-500/30"
                      : "bg-cyan-400 hover:bg-cyan-300 text-slate-950 shadow-cyan-400/30"
                  }`}
                >
                  {isActionPending ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                  <span>{confirmDialog.actionLabel}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
