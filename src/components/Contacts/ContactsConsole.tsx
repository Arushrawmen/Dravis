/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Google Contacts Workspace Console for Dravis ASI (Desktop HUD & Android Liquid Glass)
 */

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Users,
  Search,
  Plus,
  RefreshCw,
  Phone,
  Mail,
  Building,
  MapPin,
  Trash2,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  LogOut,
  X,
  PhoneCall,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Clock,
  Download,
  Mic,
  UserPlus,
  Globe,
} from "lucide-react";
import {
  googleContactsApi,
  GoogleContact,
} from "../../services/googleContactsApi";
import {
  initAuth,
  googleSignIn,
  logout,
  getAccessToken,
  getCachedUser,
} from "../../services/googleAuth";
import { CallHistoryItem, ContactItem } from "../../types";
import { soundEffects } from "../../utils/audioSynth";

interface ContactsConsoleProps {
  onSpeak?: (text: string) => void;
  soundEffectsEnabled?: boolean;
  onClose?: () => void;
  isCompact?: boolean;
  onInitiateCall?: (contactName: string, number: string, label?: string) => void;
  callHistory?: CallHistoryItem[];
  localContacts?: ContactItem[];
  onClearCallHistory?: () => void;
  onDeleteCallHistoryItem?: (id: string) => void;
  onLogSampleCall?: (type: "INCOMING" | "MISSED") => void;
  onAnalyzeCallSummary?: (item: CallHistoryItem) => Promise<void>;
}

export const ContactsConsole: React.FC<ContactsConsoleProps> = ({
  onSpeak,
  soundEffectsEnabled = true,
  onClose,
  isCompact = false,
  onInitiateCall,
  callHistory = [],
  localContacts = [],
  onClearCallHistory,
  onDeleteCallHistoryItem,
  onLogSampleCall,
  onAnalyzeCallSummary,
}) => {
  // Sub-section tab: "DIRECTORY" | "CALL_HISTORY"
  const [activeSubView, setActiveSubView] = useState<"DIRECTORY" | "CALL_HISTORY">("DIRECTORY");
  const [historyFilter, setHistoryFilter] = useState<
    "ALL" | "INCOMING" | "OUTGOING" | "MISSED" | "RECORDED"
  >("ALL");
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);

  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [googleUser, setGoogleUser] = useState<any>(null);

  // Contacts state
  const [contacts, setContacts] = useState<GoogleContact[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedContact, setSelectedContact] = useState<GoogleContact | null>(null);

  // Notification Toast
  const [notification, setNotification] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);

  const notify = (text: string, type: "success" | "error" | "info" = "info") => {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 4000);
  };

  // Create Contact Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [givenName, setGivenName] = useState<string>("");
  const [familyName, setFamilyName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [organization, setOrganization] = useState<string>("");
  const [jobTitle, setJobTitle] = useState<string>("");
  const [address, setAddress] = useState<string>("");

  // Confirmation Modal
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    actionLabel: string;
    isDestructive: boolean;
    onConfirm: () => Promise<void>;
  }>({
    isOpen: false,
    title: "",
    description: "",
    actionLabel: "Confirm",
    isDestructive: false,
    onConfirm: async () => {},
  });
  const [isActionPending, setIsActionPending] = useState<boolean>(false);

  // Load Contacts
  const loadContacts = useCallback(async () => {
    setIsLoading(true);
    try {
      if (searchQuery.trim()) {
        const results = await googleContactsApi.searchContacts(searchQuery.trim());
        setContacts(results);
      } else {
        const res = await googleContactsApi.listContacts({ pageSize: 150 });
        setContacts(res.contacts);
      }
    } catch (err: any) {
      console.error(err);
      if (
        String(err?.message || "").includes("401") ||
        String(err?.message || "").includes("Authentication required")
      ) {
        setIsAuthenticated(false);
      }
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery]);

  // Auth Initialization
  useEffect(() => {
    const unsubscribe = initAuth(
      (user) => {
        setIsAuthenticated(true);
        setGoogleUser(user);
      },
      () => {
        setIsAuthenticated(false);
        setGoogleUser(null);
        setContacts([]);
      }
    );

    getAccessToken().then((token) => {
      if (token) {
        setIsAuthenticated(true);
        setGoogleUser(getCachedUser());
      }
    });

    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadContacts();
    }
  }, [isAuthenticated, loadContacts]);

  const handleSignIn = async () => {
    setIsAuthenticating(true);
    setAuthError(null);
    if (soundEffectsEnabled) soundEffects.playActivatePulse();

    try {
      const res = await googleSignIn();
      if (res) {
        setIsAuthenticated(true);
        setGoogleUser(res.user);
        if (soundEffectsEnabled) soundEffects.playStartupChime();
        notify("Authenticated with Google Contacts!", "success");
        onSpeak?.("Google Contacts synchronized, Sir. Address directory ready.");
        await loadContacts();
      }
    } catch (err: any) {
      console.error(err);
      setAuthError(err?.message || "Failed to sign in with Google.");
      if (soundEffectsEnabled) soundEffects.playAlert();
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleSignOut = async () => {
    await logout();
    setIsAuthenticated(false);
    setContacts([]);
    setSelectedContact(null);
    notify("Signed out from Google Workspace.", "info");
  };

  // Add Contact Handler with explicit confirmation dialog
  const handleRequestCreateContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!givenName.trim()) {
      notify("Please provide at least a first name.", "error");
      return;
    }

    if (soundEffectsEnabled) soundEffects.playChirp();

    const fullName = `${givenName.trim()} ${familyName.trim()}`.trim();

    setConfirmDialog({
      isOpen: true,
      title: "Add to Google Contacts?",
      description: `Create new contact "${fullName}" with phone ${phone || "None"} and email ${email || "None"} in your Google Account?`,
      actionLabel: "Create Contact",
      isDestructive: false,
      onConfirm: async () => {
        setIsActionPending(true);
        try {
          const created = await googleContactsApi.createContact({
            givenName: givenName.trim(),
            familyName: familyName.trim() || undefined,
            email: email.trim() || undefined,
            phone: phone.trim() || undefined,
            organization: organization.trim() || undefined,
            jobTitle: jobTitle.trim() || undefined,
            address: address.trim() || undefined,
          });

          setContacts((prev) => [created, ...prev]);
          notify(`"${created.displayName}" added to Google Contacts!`, "success");
          onSpeak?.(`Contact ${created.displayName} has been created in your Google Contacts.`);
          setIsCreateModalOpen(false);
          setGivenName("");
          setFamilyName("");
          setEmail("");
          setPhone("");
          setOrganization("");
          setJobTitle("");
          setAddress("");
          if (soundEffectsEnabled) soundEffects.playChirp();
        } catch (err: any) {
          notify(err?.message || "Failed to create contact.", "error");
        } finally {
          setIsActionPending(false);
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  // Delete Contact with explicit confirmation
  const handleRequestDeleteContact = (contact: GoogleContact) => {
    if (soundEffectsEnabled) soundEffects.playAlert();

    setConfirmDialog({
      isOpen: true,
      title: "Delete Google Contact?",
      description: `Are you sure you want to permanently delete "${contact.displayName}" from your Google Account? This action cannot be undone.`,
      actionLabel: "Delete Contact",
      isDestructive: true,
      onConfirm: async () => {
        setIsActionPending(true);
        try {
          await googleContactsApi.deleteContact(contact.resourceName);
          setContacts((prev) => prev.filter((c) => c.resourceName !== contact.resourceName));
          if (selectedContact?.resourceName === contact.resourceName) {
            setSelectedContact(null);
          }
          notify(`"${contact.displayName}" deleted.`, "info");
          if (soundEffectsEnabled) soundEffects.playAlert();
        } catch (err: any) {
          notify(err?.message || "Failed to delete contact.", "error");
        } finally {
          setIsActionPending(false);
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  // Filtered contacts
  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim()) return contacts;
    const q = searchQuery.toLowerCase();
    return contacts.filter(
      (c) =>
        c.displayName.toLowerCase().includes(q) ||
        c.emails.some((e) => e.value.toLowerCase().includes(q)) ||
        c.phones.some((p) => p.value.toLowerCase().includes(q)) ||
        c.organizations.some((o) => o.name?.toLowerCase().includes(q) || o.title?.toLowerCase().includes(q))
    );
  }, [contacts, searchQuery]);

  const filteredCallHistory = useMemo(() => {
    return callHistory.filter((item) => {
      if (historyFilter === "ALL") return true;
      if (historyFilter === "RECORDED") return Boolean(item.recordingUrl);
      return item.type === historyFilter;
    });
  }, [callHistory, historyFilter]);

  const formatCallDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-slate-950 text-slate-100 font-sans select-none overflow-hidden">
      {/* 1. TOP HEADER & TELEMETRY */}
      <div className="px-4 py-3 border-b border-cyan-500/20 bg-slate-900/60 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500/20 via-teal-500/20 to-cyan-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.25)]">
            <Users className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-mono font-bold text-white tracking-wide truncate">
                Google Contacts Hub
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                People API v1
              </span>
            </div>
            <p className="text-[11px] font-mono text-slate-400 truncate">
              {isAuthenticated
                ? googleUser?.email || "Google Contacts Connected"
                : "Real-time Google Phone Directory • Zero Stored Passwords"}
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
                  setIsCreateModalOpen(true);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.35)] transition-all active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Add Contact</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (soundEffectsEnabled) soundEffects.playChirp();
                  loadContacts();
                }}
                disabled={isLoading}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 cursor-pointer"
                title="Refresh Contacts"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-cyan-400" : ""}`}
                />
              </button>

              <button
                type="button"
                onClick={handleSignOut}
                className="p-2 rounded-xl bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-300 border border-white/10 cursor-pointer transition-all"
                title="Sign out of Google"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleSignIn}
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
              <span>{isAuthenticating ? "Connecting..." : "Connect Google Contacts"}</span>
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
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`absolute top-14 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-2xl border text-xs font-mono shadow-2xl flex items-center gap-2 ${
              notification.type === "success"
                ? "bg-emerald-950/90 border-emerald-400/50 text-emerald-200"
                : notification.type === "error"
                ? "bg-red-950/90 border-red-400/50 text-red-200"
                : "bg-slate-900/90 border-cyan-400/50 text-cyan-200"
            }`}
          >
            {notification.type === "success" ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            ) : notification.type === "error" ? (
              <AlertCircle className="w-3.5 h-3.5 text-red-400" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            )}
            <span>{notification.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1.5 SUB-NAVIGATION & CALL HISTORY SWITCHER */}
      <div className="px-4 py-2.5 border-b border-white/10 bg-slate-900/80 flex flex-wrap items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (soundEffectsEnabled) soundEffects.playChirp();
              setActiveSubView("DIRECTORY");
            }}
            className={`px-3.5 py-1.5 rounded-xl font-mono text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeSubView === "DIRECTORY"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/50 shadow-[0_0_12px_rgba(16,185,129,0.2)]"
                : "bg-white/5 text-slate-400 hover:text-white border border-white/10"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Contacts Directory</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (soundEffectsEnabled) soundEffects.playChirp();
              setActiveSubView("CALL_HISTORY");
            }}
            className={`px-3.5 py-1.5 rounded-xl font-mono text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeSubView === "CALL_HISTORY"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-[0_0_12px_rgba(34,211,238,0.2)]"
                : "bg-white/5 text-slate-400 hover:text-white border border-white/10"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Call History</span>
            <span className="px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px]">
              {callHistory.length}
            </span>
          </button>
        </div>

        {/* Summary pills */}
        <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
          <span className="px-2 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
            Incoming: {callHistory.filter((c) => c.type === "INCOMING").length}
          </span>
          <span className="px-2 py-0.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-300">
            Outgoing: {callHistory.filter((c) => c.type === "OUTGOING").length}
          </span>
          <span className="px-2 py-0.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300">
            Missed: {callHistory.filter((c) => c.type === "MISSED").length}
          </span>
        </div>
      </div>

      {/* 2. MAIN BODY */}
      {activeSubView === "CALL_HISTORY" ? (
        /* DEDICATED CALL HISTORY & LOCAL RECORDINGS VIEW */
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="p-3 border-b border-white/10 bg-slate-900/40 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              {(["ALL", "INCOMING", "OUTGOING", "MISSED", "RECORDED"] as const).map((filterKey) => (
                <button
                  key={filterKey}
                  type="button"
                  onClick={() => setHistoryFilter(filterKey)}
                  className={`px-2.5 py-1 rounded-xl text-[10px] font-mono font-bold transition-all cursor-pointer border ${
                    historyFilter === filterKey
                      ? "bg-cyan-500/20 text-cyan-200 border-cyan-400/50"
                      : "bg-white/5 text-slate-400 border-white/10 hover:text-white"
                  }`}
                >
                  {filterKey === "RECORDED" ? "RECORDINGS" : filterKey}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              {onLogSampleCall && (
                <>
                  <button
                    type="button"
                    onClick={() => onLogSampleCall("INCOMING")}
                    className="px-2.5 py-1 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-[10px] font-mono cursor-pointer"
                  >
                    + Incoming Call
                  </button>
                  <button
                    type="button"
                    onClick={() => onLogSampleCall("MISSED")}
                    className="px-2.5 py-1 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-[10px] font-mono cursor-pointer"
                  >
                    + Missed Call
                  </button>
                </>
              )}
              {callHistory.length > 0 && onClearCallHistory && (
                <button
                  type="button"
                  onClick={onClearCallHistory}
                  className="px-2.5 py-1 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 text-[10px] font-mono cursor-pointer"
                >
                  Clear All
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
            {filteredCallHistory.length === 0 ? (
              <div className="h-56 flex flex-col items-center justify-center gap-2 text-slate-500 font-mono text-xs">
                <Clock className="w-8 h-8 opacity-40" />
                <span>No call history logs matching "{historyFilter}".</span>
              </div>
            ) : (
              filteredCallHistory.map((item) => {
                const isDetailsOpen = selectedHistoryId === item.id;
                return (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-2xl border transition-all flex flex-col gap-2.5 ${
                      isDetailsOpen
                        ? "bg-slate-900/90 border-cyan-400/50 shadow-[0_0_25px_rgba(34,211,238,0.12)]"
                        : "bg-white/[0.03] hover:bg-white/[0.06] border-white/10"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div
                        onClick={() =>
                          setSelectedHistoryId((prev) => (prev === item.id ? null : item.id))
                        }
                        className="flex items-center gap-3 min-w-0 cursor-pointer flex-1"
                      >
                        <div
                          className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${
                            item.type === "INCOMING"
                              ? "bg-emerald-500/15 border-emerald-400/40 text-emerald-300"
                              : item.type === "OUTGOING"
                              ? "bg-cyan-500/15 border-cyan-400/40 text-cyan-300"
                              : "bg-rose-500/15 border-rose-400/40 text-rose-300"
                          }`}
                        >
                          {item.type === "INCOMING" ? (
                            <PhoneIncoming className="w-4 h-4" />
                          ) : item.type === "OUTGOING" ? (
                            <PhoneOutgoing className="w-4 h-4" />
                          ) : (
                            <PhoneMissed className="w-4 h-4" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="text-xs font-mono font-bold text-white truncate">
                              {item.contactName}
                            </h4>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold border ${
                                item.type === "INCOMING"
                                  ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                                  : item.type === "OUTGOING"
                                  ? "bg-cyan-500/15 text-cyan-300 border-cyan-500/30"
                                  : "bg-rose-500/15 text-rose-300 border-rose-500/30"
                              }`}
                            >
                              {item.type}
                            </span>
                            {item.recordingUrl && (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-rose-500/20 text-rose-200 border border-rose-400/40 flex items-center gap-1">
                                <Mic className="w-2.5 h-2.5" />
                                RECORDED
                              </span>
                            )}
                            {item.summary && (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-violet-500/20 text-violet-200 border border-violet-400/40 flex items-center gap-1">
                                <Sparkles className="w-2.5 h-2.5 text-violet-300" />
                                AI SUMMARY
                              </span>
                            )}
                            {item.sentiment && (
                              <span
                                className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold border ${
                                  item.sentiment === "POSITIVE"
                                    ? "bg-emerald-500/15 text-emerald-300 border-emerald-400/30"
                                    : item.sentiment === "URGENT"
                                    ? "bg-amber-500/20 text-amber-300 border-amber-400/40"
                                    : item.sentiment === "FOLLOW_UP"
                                    ? "bg-cyan-500/20 text-cyan-200 border-cyan-400/40"
                                    : "bg-slate-800 text-slate-300 border-white/10"
                                }`}
                              >
                                {item.sentiment}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-slate-400 mt-0.5">
                            <span>{item.number}</span>
                            {item.label && <span>• {item.label}</span>}
                            <span>• {item.timestamp}</span>
                            <span>
                              •{" "}
                              {item.type === "MISSED"
                                ? "Missed Call"
                                : `Duration: ${formatCallDuration(item.durationSeconds)}`}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Gemini Post-Call Summary & Details Button */}
                        <button
                          type="button"
                          onClick={async () => {
                            if (soundEffectsEnabled) soundEffects.playChirp();
                            setSelectedHistoryId(item.id);
                            if (!item.summary && onAnalyzeCallSummary) {
                              await onAnalyzeCallSummary(item);
                            }
                          }}
                          disabled={item.isSummarizing}
                          className={`px-3 py-1.5 rounded-xl border text-[11px] font-mono font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                            isDetailsOpen || item.summary
                              ? "bg-violet-500/20 hover:bg-violet-500/30 text-violet-200 border-violet-400/50"
                              : "bg-white/5 hover:bg-violet-500/15 text-slate-300 hover:text-violet-200 border-white/15"
                          }`}
                          title="View Call Details & Generate Gemini Post-Call Summary"
                        >
                          {item.isSummarizing ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin text-violet-300" />
                          ) : (
                            <Sparkles className="w-3.5 h-3.5 text-violet-300" />
                          )}
                          <span>
                            {item.isSummarizing
                              ? "Summarizing..."
                              : isDetailsOpen
                              ? "Details Open"
                              : item.summary
                              ? "Call Summary"
                              : "Summarize Call"}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (soundEffectsEnabled) soundEffects.playActivatePulse();
                            onInitiateCall?.(item.contactName, item.number, item.label);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-400/30 text-[11px] font-mono font-bold flex items-center gap-1.5 cursor-pointer"
                        >
                          <PhoneCall className="w-3.5 h-3.5" />
                          <span>Call Back</span>
                        </button>

                        {onDeleteCallHistoryItem && (
                          <button
                            type="button"
                            onClick={() => onDeleteCallHistoryItem(item.id)}
                            className="p-1.5 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 cursor-pointer"
                            title="Delete Entry"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Concise Gemini Post-Call Summary Preview (when not expanded) */}
                    {item.summary && !isDetailsOpen && (
                      <div
                        onClick={() => setSelectedHistoryId(item.id)}
                        className="px-3 py-2 rounded-xl bg-violet-950/30 border border-violet-500/25 flex items-start justify-between gap-2 cursor-pointer hover:border-violet-400/40 transition-all"
                      >
                        <div className="flex items-start gap-2 min-w-0">
                          <Sparkles className="w-3.5 h-3.5 text-violet-400 shrink-0 mt-0.5" />
                          <p className="text-[11px] text-slate-200 line-clamp-2 leading-relaxed">
                            <strong className="text-violet-300 font-mono">Gemini Summary:</strong>{" "}
                            {item.summary}
                          </p>
                        </div>
                        <span className="text-[10px] font-mono text-violet-300 shrink-0 underline">
                          View Details
                        </span>
                      </div>
                    )}

                    {/* Inline Local Call Recording Audio Player & Download */}
                    {item.recordingUrl && (
                      <div className="mt-0.5 pt-2.5 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 bg-slate-900/70 px-3 py-2 rounded-xl">
                        <div className="flex items-center gap-2 text-[10px] font-mono text-rose-300">
                          <Mic className="w-3.5 h-3.5 text-rose-400" />
                          <span>{item.recordingFileName || "Call_Recording.webm"}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-1 min-w-[200px] max-w-md">
                          <audio controls src={item.recordingUrl} className="h-7 w-full" />
                          <a
                            href={item.recordingUrl}
                            download={item.recordingFileName || `Call_${item.contactName}.webm`}
                            className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-200 text-[10px] font-mono font-bold flex items-center gap-1 shrink-0"
                          >
                            <Download className="w-3 h-3" />
                            <span>Save</span>
                          </a>
                        </div>
                      </div>
                    )}

                    {/* EXPANDED CALL HISTORY DETAILS VIEW & GEMINI POST-CALL SUMMARY */}
                    {isDetailsOpen && (
                      <div className="mt-1 pt-3 border-t border-cyan-500/25 flex flex-col gap-3 bg-slate-950/80 rounded-2xl p-3.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-violet-400" />
                            <h5 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                              Call History Details & Gemini Post-Call Summary
                            </h5>
                            {item.analyzedAt && (
                              <span className="text-[10px] font-mono text-slate-400">
                                • Analyzed at {item.analyzedAt}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            {onAnalyzeCallSummary && (
                              <button
                                type="button"
                                onClick={() => onAnalyzeCallSummary(item)}
                                disabled={item.isSummarizing}
                                className="px-2.5 py-1 rounded-lg bg-violet-500/20 hover:bg-violet-500/30 border border-violet-400/40 text-violet-200 text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer"
                              >
                                <RefreshCw
                                  className={`w-3 h-3 ${item.isSummarizing ? "animate-spin" : ""}`}
                                />
                                <span>
                                  {item.isSummarizing
                                    ? "Analyzing with Gemini..."
                                    : item.summary
                                    ? "Re-Analyze with Gemini"
                                    : "Generate Gemini Summary"}
                                </span>
                              </button>
                            )}
                            {item.summary && onSpeak && (
                              <button
                                type="button"
                                onClick={() => onSpeak(item.summary!)}
                                className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-200 text-[10px] font-mono font-bold cursor-pointer"
                              >
                                Speak Summary
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setSelectedHistoryId(null)}
                              className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {item.isSummarizing ? (
                          <div className="p-4 rounded-xl bg-violet-950/20 border border-violet-500/25 flex items-center gap-3 text-xs font-mono text-violet-200">
                            <RefreshCw className="w-4 h-4 animate-spin text-violet-400 shrink-0" />
                            <span>
                              Gemini is analyzing the call recording & transcript for{" "}
                              {item.contactName}...
                            </span>
                          </div>
                        ) : item.summary ? (
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                            {/* Concise Summary & Key Takeaways */}
                            <div className="p-3 rounded-xl bg-violet-950/25 border border-violet-500/30 flex flex-col gap-2">
                              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-violet-300">
                                Executive Call Summary
                              </span>
                              <p className="text-xs text-slate-100 leading-relaxed">
                                {item.summary}
                              </p>

                              {item.keyPoints && item.keyPoints.length > 0 && (
                                <div className="mt-1 pt-2 border-t border-white/10">
                                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-300 block mb-1">
                                    Key Discussion Points
                                  </span>
                                  <ul className="space-y-1 text-[11px] text-slate-300 list-disc list-inside">
                                    {item.keyPoints.map((pt, idx) => (
                                      <li key={idx}>{pt}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>

                            {/* Action Items & Call Transcript */}
                            <div className="flex flex-col gap-2.5">
                              {item.actionItems && item.actionItems.length > 0 && (
                                <div className="p-3 rounded-xl bg-emerald-950/25 border border-emerald-500/30">
                                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-300 block mb-1">
                                    Recommended Next Steps & Action Items
                                  </span>
                                  <ul className="space-y-1 text-[11px] text-emerald-100/90 list-disc list-inside">
                                    {item.actionItems.map((act, idx) => (
                                      <li key={idx}>{act}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {item.transcript && (
                                <div className="p-3 rounded-xl bg-slate-900/90 border border-white/10">
                                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block mb-1">
                                    Call Recording / Conversation Transcript
                                  </span>
                                  <p className="text-[11px] font-mono text-slate-300 whitespace-pre-line leading-relaxed max-h-28 overflow-y-auto">
                                    {item.transcript}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between gap-2 text-xs font-mono text-slate-300">
                            <span>
                              Click "Generate Gemini Summary" to analyze this call's recording or
                              transcript.
                            </span>
                            {onAnalyzeCallSummary && (
                              <button
                                type="button"
                                onClick={() => onAnalyzeCallSummary(item)}
                                className="px-3 py-1 rounded-lg bg-violet-500 hover:bg-violet-400 text-slate-950 font-bold text-[11px] cursor-pointer shrink-0"
                              >
                                Analyze Now
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : !isAuthenticated ? (
        /* HERO LOGIN SCREEN + RECENT CALL HISTORY PREVIEW */
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          <div className="flex flex-col items-center justify-center p-6 text-center rounded-3xl bg-white/[0.02] border border-white/10">
            <div className="w-14 h-14 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-3 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
              <Users className="w-7 h-7" />
            </div>

            <h3 className="text-lg font-bold font-mono text-white mb-1.5">
              Connect Your Google Contacts
            </h3>
            <p className="text-xs text-slate-400 max-w-md leading-relaxed mb-4 font-mono">
              Authorize Dravis ASI to view your Google People address book, call or email contacts with voice commands, search phone numbers, and manage your contacts safely.
            </p>

            <button
              type="button"
              onClick={handleSignIn}
              disabled={isAuthenticating}
              className="flex items-center gap-3 px-6 py-2.5 rounded-2xl bg-white hover:bg-slate-100 text-slate-800 font-medium text-sm shadow-[0_4px_25px_rgba(255,255,255,0.15)] transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <div className="w-5 h-5 flex items-center justify-center">
                <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
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
          </div>

          {/* INLINE CALL HISTORY SECTION IN CONTACTS TAB */}
          <div className="rounded-3xl bg-white/[0.02] border border-white/10 p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                  Call History & Post-Call AI Summaries
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setActiveSubView("CALL_HISTORY")}
                className="text-[11px] font-mono text-cyan-400 hover:underline cursor-pointer"
              >
                Open Full Call History ({callHistory.length}) →
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {callHistory.slice(0, 6).map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    setActiveSubView("CALL_HISTORY");
                    setSelectedHistoryId(item.id);
                    if (!item.summary && onAnalyzeCallSummary) {
                      void onAnalyzeCallSummary(item);
                    }
                  }}
                  className="p-3 rounded-2xl bg-slate-900/60 hover:bg-slate-900/90 border border-white/10 hover:border-cyan-400/40 flex flex-col gap-2 cursor-pointer transition-all"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 ${
                          item.type === "INCOMING"
                            ? "bg-emerald-500/15 border-emerald-400/40 text-emerald-300"
                            : item.type === "OUTGOING"
                            ? "bg-cyan-500/15 border-cyan-400/40 text-cyan-300"
                            : "bg-rose-500/15 border-rose-400/40 text-rose-300"
                        }`}
                      >
                        {item.type === "INCOMING" ? (
                          <PhoneIncoming className="w-3.5 h-3.5" />
                        ) : item.type === "OUTGOING" ? (
                          <PhoneOutgoing className="w-3.5 h-3.5" />
                        ) : (
                          <PhoneMissed className="w-3.5 h-3.5" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-mono font-bold text-white truncate">
                            {item.contactName}
                          </span>
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-slate-300">
                            {item.type}
                          </span>
                        </div>
                        <p className="text-[10px] font-mono text-slate-400 truncate">
                          {item.timestamp} •{" "}
                          {item.type === "MISSED"
                            ? "Missed"
                            : formatCallDuration(item.durationSeconds)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="px-2 py-1 rounded-lg bg-violet-500/15 border border-violet-400/30 text-violet-300 text-[9px] font-mono font-bold flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5" />
                        <span>Summary</span>
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onInitiateCall?.(item.contactName, item.number, item.label);
                        }}
                        className="px-2.5 py-1 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-400/30 text-[10px] font-mono font-bold flex items-center gap-1 shrink-0 cursor-pointer"
                      >
                        <PhoneCall className="w-3 h-3" />
                        <span>Call</span>
                      </button>
                    </div>
                  </div>
                  {item.summary && (
                    <p className="text-[10px] text-slate-300 line-clamp-1 bg-violet-950/25 border border-violet-500/20 rounded-lg px-2 py-1">
                      <span className="text-violet-300 font-mono font-bold">AI: </span>
                      {item.summary}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* CONTACTS DIRECTORY INTERFACE */
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Search Bar & Quick Stats */}
          <div className="p-3 border-b border-white/10 bg-slate-900/40 flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") loadContacts();
                }}
                placeholder="Search Google Contacts by name, phone, email, organization..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-black/40 border border-white/10 focus:border-emerald-400 text-white text-xs font-mono outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-slate-400">
                {filteredContacts.length} Contact{filteredContacts.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>

          {/* Contacts Grid */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {isLoading ? (
              <div className="h-64 flex flex-col items-center justify-center gap-2 text-slate-400 font-mono text-xs">
                <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
                <span>Syncing contacts from Google People API...</span>
              </div>
            ) : filteredContacts.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center gap-2 text-slate-500 font-mono text-xs">
                <Users className="w-8 h-8 opacity-40 mb-1" />
                <span>No contacts found matching your search.</span>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(true)}
                  className="mt-2 text-emerald-400 hover:underline cursor-pointer"
                >
                  + Add a new contact
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredContacts.map((c) => {
                  const primaryPhone = c.phones[0]?.value;
                  const primaryEmail = c.emails[0]?.value;
                  const org = c.organizations[0];

                  return (
                    <div
                      key={c.resourceName}
                      onClick={() => {
                        if (soundEffectsEnabled) soundEffects.playChirp();
                        setSelectedContact(c);
                      }}
                      className="p-3.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 hover:border-emerald-400/50 transition-all cursor-pointer flex flex-col justify-between gap-3 group"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          {c.photoUrl ? (
                            <img
                              src={c.photoUrl}
                              alt={c.displayName}
                              className="w-10 h-10 rounded-2xl object-cover border border-white/20 shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 font-mono font-bold text-sm shrink-0">
                              {c.displayName.slice(0, 2).toUpperCase()}
                            </div>
                          )}

                          <div className="min-w-0">
                            <h4 className="text-xs font-mono font-bold text-white group-hover:text-emerald-300 transition-colors truncate">
                              {c.displayName}
                            </h4>
                            {org?.title && (
                              <p className="text-[10px] font-mono text-slate-400 truncate">
                                {org.title} {org.name ? `• ${org.name}` : ""}
                              </p>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRequestDeleteContact(c);
                          }}
                          className="p-1 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 cursor-pointer transition-colors"
                          title="Delete Contact"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Phone & Email Snippets */}
                      <div className="flex flex-col gap-1 text-[11px] font-mono text-slate-300">
                        {primaryPhone && (
                          <div className="flex items-center gap-1.5 truncate">
                            <Phone className="w-3 h-3 text-emerald-400 shrink-0" />
                            <span className="truncate">{primaryPhone}</span>
                          </div>
                        )}
                        {primaryEmail && (
                          <div className="flex items-center gap-1.5 truncate text-slate-400">
                            <Mail className="w-3 h-3 text-cyan-400 shrink-0" />
                            <span className="truncate">{primaryEmail}</span>
                          </div>
                        )}
                      </div>

                      {/* Action Bar */}
                      <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[11px] font-mono">
                        {primaryPhone ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (soundEffectsEnabled) soundEffects.playActivatePulse();
                              onInitiateCall?.(c.displayName, primaryPhone);
                              onSpeak?.(`Calling ${c.displayName} at ${primaryPhone}`);
                            }}
                            className="px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-400/30 flex items-center gap-1.5 transition-all cursor-pointer"
                          >
                            <PhoneCall className="w-3 h-3" />
                            <span>Call</span>
                          </button>
                        ) : (
                          <span className="text-slate-600 text-[10px]">No phone</span>
                        )}

                        {primaryEmail && (
                          <a
                            href={`mailto:${primaryEmail}`}
                            onClick={(e) => e.stopPropagation()}
                            className="px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 flex items-center gap-1 transition-all"
                          >
                            <Mail className="w-3 h-3 text-cyan-400" />
                            <span>Email</span>
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. CONTACT DETAILS MODAL */}
      <AnimatePresence>
        {selectedContact && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-slate-950 border border-emerald-500/40 rounded-3xl p-5 shadow-2xl flex flex-col gap-4 font-mono text-xs"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  {selectedContact.photoUrl ? (
                    <img
                      src={selectedContact.photoUrl}
                      alt={selectedContact.displayName}
                      className="w-12 h-12 rounded-2xl object-cover border border-white/20"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 font-bold text-base">
                      {selectedContact.displayName.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      {selectedContact.displayName}
                    </h3>
                    <span className="text-[10px] text-emerald-400">
                      Google People Contact
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedContact(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Phone Numbers */}
              {selectedContact.phones.length > 0 && (
                <div className="flex flex-col gap-1.5 p-3 rounded-2xl bg-white/[0.03] border border-white/10">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">
                    Phone Numbers
                  </span>
                  {selectedContact.phones.map((p, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-white">
                        <Phone className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{p.value}</span>
                        {p.type && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-slate-400">
                            {p.type}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (soundEffectsEnabled) soundEffects.playActivatePulse();
                          onInitiateCall?.(selectedContact.displayName, p.value);
                          onSpeak?.(`Dialing ${selectedContact.displayName}`);
                        }}
                        className="px-2 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 flex items-center gap-1 text-[10px] cursor-pointer"
                      >
                        <PhoneCall className="w-3 h-3" />
                        <span>Call</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Emails */}
              {selectedContact.emails.length > 0 && (
                <div className="flex flex-col gap-1.5 p-3 rounded-2xl bg-white/[0.03] border border-white/10">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">
                    Email Addresses
                  </span>
                  {selectedContact.emails.map((e, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-cyan-300">
                        <Mail className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{e.value}</span>
                      </div>
                      <a
                        href={`mailto:${e.value}`}
                        className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-[10px]"
                      >
                        Send Mail
                      </a>
                    </div>
                  ))}
                </div>
              )}

              {/* Organization */}
              {selectedContact.organizations.length > 0 && (
                <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center gap-2 text-slate-300">
                  <Building className="w-4 h-4 text-amber-400 shrink-0" />
                  <div>
                    <span className="block font-bold">
                      {selectedContact.organizations[0].name}
                    </span>
                    {selectedContact.organizations[0].title && (
                      <span className="text-[10px] text-slate-400">
                        {selectedContact.organizations[0].title}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Address */}
              {selectedContact.addresses.length > 0 && (
                <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center gap-2 text-slate-300">
                  <MapPin className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{selectedContact.addresses[0].formattedValue}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => handleRequestDeleteContact(selectedContact)}
                  className="px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/30 flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Contact</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedContact(null)}
                  className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. CREATE CONTACT MODAL */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-slate-950 border border-emerald-500/40 rounded-3xl p-5 shadow-2xl flex flex-col gap-4 font-mono text-xs"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <UserPlus className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Create New Contact</h3>
                    <span className="text-[10px] text-slate-400">
                      Syncs directly with your Google Account
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleRequestCreateContact} className="flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">
                      First Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={givenName}
                      onChange={(e) => setGivenName(e.target.value)}
                      placeholder="e.g. John"
                      className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 focus:border-emerald-400 text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={familyName}
                      onChange={(e) => setFamilyName(e.target.value)}
                      placeholder="e.g. Doe"
                      className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 focus:border-emerald-400 text-white outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. +91 98765 43210"
                      className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 focus:border-emerald-400 text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. john@example.com"
                      className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 focus:border-emerald-400 text-white outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">
                      Organization
                    </label>
                    <input
                      type="text"
                      value={organization}
                      onChange={(e) => setOrganization(e.target.value)}
                      placeholder="e.g. Google / Stark Industries"
                      className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 focus:border-emerald-400 text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">
                      Job Title
                    </label>
                    <input
                      type="text"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      placeholder="e.g. Lead Architect"
                      className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 focus:border-emerald-400 text-white outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">
                    Postal Address
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. 1600 Amphitheatre Parkway, Mountain View, CA"
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 focus:border-emerald-400 text-white outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10 mt-2">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-500/25"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Proceed to Save</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. CONFIRMATION MODAL */}
      <AnimatePresence>
        {confirmDialog.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
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
                      : "bg-emerald-500/20 text-emerald-400 border border-emerald-400/40"
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
                    Workspace Safety Permission Check
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
                      : "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/30"
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
