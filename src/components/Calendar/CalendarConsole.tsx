/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Google Calendar Workspace Console for Dravis ASI (Desktop HUD & Android Liquid Glass)
 */

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Video,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  ExternalLink,
  Users,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  LogOut,
  X,
  CalendarDays,
  CalendarCheck2,
} from "lucide-react";
import {
  googleCalendarApi,
  CalendarEvent,
  CalendarListEntry,
} from "../../services/googleCalendarApi";
import {
  initAuth,
  googleSignIn,
  logout,
  getAccessToken,
  getCachedUser,
} from "../../services/googleAuth";
import { soundEffects } from "../../utils/audioSynth";

interface CalendarConsoleProps {
  onSpeak?: (text: string) => void;
  soundEffectsEnabled?: boolean;
  onClose?: () => void;
  isCompact?: boolean;
}

export const CalendarConsole: React.FC<CalendarConsoleProps> = ({
  onSpeak,
  soundEffectsEnabled = true,
  onClose,
  isCompact = false,
}) => {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [googleUser, setGoogleUser] = useState<any>(null);

  // Calendar & Events State
  const [calendars, setCalendars] = useState<CalendarListEntry[]>([]);
  const [selectedCalendarId, setSelectedCalendarId] = useState<string>("primary");
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState<boolean>(false);
  const [activeView, setActiveView] = useState<"AGENDA" | "MONTH">("AGENDA");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Current viewed month for Month View
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  // Event Details Modal
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // New Event Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [eventSummary, setEventSummary] = useState<string>("");
  const [eventDescription, setEventDescription] = useState<string>("");
  const [eventLocation, setEventLocation] = useState<string>("");
  const [eventStartDate, setEventStartDate] = useState<string>(() => {
    const d = new Date();
    d.setHours(d.getHours() + 1, 0, 0, 0);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  });
  const [eventEndDate, setEventEndDate] = useState<string>(() => {
    const d = new Date();
    d.setHours(d.getHours() + 2, 0, 0, 0);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  });
  const [eventAttendees, setEventAttendees] = useState<string>("");
  const [addGoogleMeet, setAddGoogleMeet] = useState<boolean>(true);
  const [isCreatingEvent, setIsCreatingEvent] = useState<boolean>(false);

  // Quick Add Natural Language State (Voice / Assistant)
  const [quickAddText, setQuickAddText] = useState<string>("");
  const [isQuickAdding, setIsQuickAdding] = useState<boolean>(false);

  // Confirmation Modal State (Mandatory for destructive/mutating actions)
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

  // Notification Toast
  const [notification, setNotification] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);

  const notify = (text: string, type: "success" | "error" | "info" = "info") => {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 4000);
  };

  // Load calendar events
  const loadCalendarData = useCallback(async () => {
    setIsLoadingEvents(true);
    try {
      // 1. Fetch calendar list
      googleCalendarApi
        .listCalendars()
        .then((cals) => setCalendars(cals))
        .catch(() => {});

      // 2. Query events from 30 days ago to 90 days ahead
      const timeMin = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
      const timeMax = new Date(Date.now() + 90 * 24 * 3600 * 1000).toISOString();

      const items = await googleCalendarApi.listEvents(selectedCalendarId, {
        timeMin,
        timeMax,
        q: searchQuery.trim() || undefined,
        maxResults: 100,
        singleEvents: true,
        orderBy: "startTime",
      });

      setEvents(items);
    } catch (err: any) {
      console.error(err);
      if (
        String(err?.message || "").includes("401") ||
        String(err?.message || "").includes("Authentication required")
      ) {
        setIsAuthenticated(false);
      }
    } finally {
      setIsLoadingEvents(false);
    }
  }, [selectedCalendarId, searchQuery]);

  // Auth initialization
  useEffect(() => {
    const unsubscribe = initAuth(
      (user) => {
        setIsAuthenticated(true);
        setGoogleUser(user);
      },
      () => {
        setIsAuthenticated(false);
        setGoogleUser(null);
        setEvents([]);
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
      loadCalendarData();
    }
  }, [selectedCalendarId, isAuthenticated, loadCalendarData]);

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
        notify("Authenticated with Google Calendar!", "success");
        onSpeak?.("Google Calendar access confirmed, Sir. Schedule and agenda online.");
        await loadCalendarData();
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
    setEvents([]);
    setSelectedEvent(null);
    notify("Signed out from Google Workspace.", "info");
  };

  // Quick Add Event (e.g. "Lunch meeting with David tomorrow at 1pm")
  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickAddText.trim()) return;

    setIsQuickAdding(true);
    if (soundEffectsEnabled) soundEffects.playActivatePulse();

    try {
      const created = await googleCalendarApi.quickAddEvent(selectedCalendarId, quickAddText.trim());
      setEvents((prev) => [...prev, created].sort((a, b) => {
        const tA = new Date(a.start.dateTime || a.start.date || 0).getTime();
        const tB = new Date(b.start.dateTime || b.start.date || 0).getTime();
        return tA - tB;
      }));
      notify(`Event "${created.summary}" scheduled!`, "success");
      onSpeak?.(`Event ${created.summary} has been added to your Google Calendar.`);
      setQuickAddText("");
    } catch (err: any) {
      notify(err?.message || "Failed to add event.", "error");
    } finally {
      setIsQuickAdding(false);
    }
  };

  // Full Create Event (with Confirmation dialog as mandated by skill)
  const handleRequestCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventSummary.trim()) {
      notify("Please provide an event title.", "error");
      return;
    }

    if (soundEffectsEnabled) soundEffects.playChirp();

    const startIso = new Date(eventStartDate).toISOString();
    const endIso = new Date(eventEndDate).toISOString();

    setConfirmDialog({
      isOpen: true,
      title: "Schedule Google Calendar Event?",
      description: `Create "${eventSummary}" scheduled from ${new Date(startIso).toLocaleString()} to ${new Date(endIso).toLocaleString()}?`,
      actionLabel: "Schedule Event",
      isDestructive: false,
      onConfirm: async () => {
        setIsActionPending(true);
        try {
          const attendeeList = eventAttendees
            .split(",")
            .map((email) => email.trim())
            .filter(Boolean)
            .map((email) => ({ email }));

          const created = await googleCalendarApi.createEvent(selectedCalendarId, {
            summary: eventSummary.trim(),
            description: eventDescription.trim() || undefined,
            location: eventLocation.trim() || undefined,
            start: { dateTime: startIso },
            end: { dateTime: endIso },
            attendees: attendeeList.length > 0 ? attendeeList : undefined,
            addGoogleMeet,
          });

          setEvents((prev) => [created, ...prev]);
          notify(`"${created.summary}" scheduled successfully!`, "success");
          onSpeak?.(`Event ${created.summary} scheduled on your calendar.`);
          setIsCreateModalOpen(false);
          setEventSummary("");
          setEventDescription("");
          setEventLocation("");
          setEventAttendees("");
        } catch (err: any) {
          notify(err?.message || "Failed to create event.", "error");
        } finally {
          setIsActionPending(false);
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  // Delete Event with Mandatory Confirmation Dialog
  const handleRequestDeleteEvent = (event: CalendarEvent) => {
    if (soundEffectsEnabled) soundEffects.playAlert();

    setConfirmDialog({
      isOpen: true,
      title: "Delete Calendar Event?",
      description: `Are you sure you want to delete "${event.summary}" from Google Calendar? This cannot be undone.`,
      actionLabel: "Delete Event",
      isDestructive: true,
      onConfirm: async () => {
        setIsActionPending(true);
        try {
          await googleCalendarApi.deleteEvent(selectedCalendarId, event.id);
          setEvents((prev) => prev.filter((e) => e.id !== event.id));
          if (selectedEvent?.id === event.id) setSelectedEvent(null);
          notify(`"${event.summary}" deleted.`, "info");
          onSpeak?.(`Event ${event.summary} was deleted from Google Calendar.`);
        } catch (err: any) {
          notify(err?.message || "Failed to delete event.", "error");
        } finally {
          setIsActionPending(false);
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  // Helper date formatter
  const formatEventTime = (event: CalendarEvent) => {
    if (event.isAllDay) {
      return `All Day • ${new Date(event.start.date || "").toLocaleDateString([], {
        weekday: "short",
        month: "short",
        day: "numeric",
      })}`;
    }
    const start = new Date(event.start.dateTime || "");
    const end = new Date(event.end.dateTime || "");
    const dateStr = start.toLocaleDateString([], {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
    const timeStr = `${start.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} - ${end.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
    return `${dateStr} • ${timeStr}`;
  };

  // Group events by Day for Agenda View
  const groupedEvents = useMemo(() => {
    const groups: { [dateKey: string]: CalendarEvent[] } = {};
    events.forEach((evt) => {
      const raw = evt.start.dateTime || evt.start.date || "";
      const d = new Date(raw);
      const key = isNaN(d.getTime())
        ? "Other"
        : d.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric", year: "numeric" });
      if (!groups[key]) groups[key] = [];
      groups[key].push(evt);
    });
    return groups;
  }, [events]);

  return (
    <div className="relative w-full h-full flex flex-col bg-slate-950 text-slate-100 font-sans select-none overflow-hidden">
      {/* 1. TOP HEADER & TELEMETRY */}
      <div className="px-4 py-3 border-b border-cyan-500/20 bg-slate-900/60 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500/20 via-indigo-500/20 to-cyan-500/20 border border-blue-400/40 flex items-center justify-center text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.25)]">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-mono font-bold text-white tracking-wide truncate">
                Google Calendar Hub
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-blue-500/20 text-blue-300 border border-blue-500/30">
                Official API v3
              </span>
            </div>
            <p className="text-[11px] font-mono text-slate-400 truncate">
              {isAuthenticated
                ? googleUser?.email || "Google Calendar Connected"
                : "Real-time Agenda & Event Scheduler • Zero Stored Passwords"}
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
                className="px-3.5 py-1.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-mono text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-[0_0_15px_rgba(59,130,246,0.35)] transition-all active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">New Event</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (soundEffectsEnabled) soundEffects.playChirp();
                  loadCalendarData();
                }}
                disabled={isLoadingEvents}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 cursor-pointer"
                title="Refresh Calendar"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${isLoadingEvents ? "animate-spin text-cyan-400" : ""}`}
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
              <span>{isAuthenticating ? "Connecting..." : "Connect Google Calendar"}</span>
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

      {/* 2. MAIN BODY */}
      {!isAuthenticated ? (
        /* HERO LOGIN SCREEN */
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center overflow-y-auto">
          <div className="w-16 h-16 rounded-3xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-4 shadow-[0_0_30px_rgba(59,130,246,0.2)]">
            <CalendarDays className="w-8 h-8" />
          </div>

          <h3 className="text-xl font-bold font-mono text-white mb-2">
            Connect Your Google Calendar
          </h3>
          <p className="text-xs text-slate-400 max-w-md leading-relaxed mb-6 font-mono">
            Authorize Dravis ASI to view your schedule, create events via natural voice commands, generate Google Meet links, and keep your daily timeline aligned.
          </p>

          <button
            type="button"
            onClick={handleSignIn}
            disabled={isAuthenticating}
            className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-white hover:bg-slate-100 text-slate-800 font-medium text-sm shadow-[0_4px_25px_rgba(255,255,255,0.15)] transition-all active:scale-95 cursor-pointer disabled:opacity-50"
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
      ) : (
        /* CALENDAR INTERFACE */
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Quick Add Bar with Voice / AI phrasing */}
          <div className="p-3 border-b border-white/10 bg-slate-900/40 flex flex-wrap items-center justify-between gap-3">
            <form onSubmit={handleQuickAdd} className="flex-1 min-w-[280px] flex items-center gap-2">
              <div className="relative flex-1">
                <Sparkles className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-cyan-400" />
                <input
                  type="text"
                  value={quickAddText}
                  onChange={(e) => setQuickAddText(e.target.value)}
                  placeholder="Quick Schedule: e.g. 'Project review meeting tomorrow at 3pm' or 'Lunch with Sam Friday'..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-black/40 border border-white/10 focus:border-cyan-400 text-white text-xs font-mono outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={isQuickAdding || !quickAddText.trim()}
                className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono text-xs font-bold shrink-0 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {isQuickAdding ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                <span>Quick Add</span>
              </button>
            </form>

            {/* Search Input & View Selectors */}
            <div className="flex items-center gap-2">
              <div className="relative w-40 sm:w-56">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") loadCalendarData();
                  }}
                  placeholder="Search events..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-black/40 border border-white/10 focus:border-blue-400 text-white text-xs font-mono outline-none"
                />
              </div>

              {calendars.length > 1 && (
                <select
                  value={selectedCalendarId}
                  onChange={(e) => setSelectedCalendarId(e.target.value)}
                  className="bg-black/40 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs font-mono text-slate-200 outline-none"
                >
                  {calendars.map((c) => (
                    <option key={c.id} value={c.id} className="bg-slate-900 text-white">
                      {c.summary}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Agenda / Events Stream */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 divide-y divide-white/5">
            {isLoadingEvents ? (
              <div className="h-64 flex flex-col items-center justify-center gap-2 text-slate-400 font-mono text-xs">
                <RefreshCw className="w-6 h-6 animate-spin text-blue-400" />
                <span>Syncing schedule from Google Calendar...</span>
              </div>
            ) : Object.keys(groupedEvents).length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center gap-2 text-slate-500 font-mono text-xs">
                <CalendarDays className="w-8 h-8 opacity-40 mb-1" />
                <span>No upcoming events found on this calendar.</span>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(true)}
                  className="mt-2 text-cyan-400 hover:underline cursor-pointer"
                >
                  + Schedule an event now
                </button>
              </div>
            ) : (
              (Object.entries(groupedEvents) as [string, CalendarEvent[]][]).map(([dayLabel, dayEvents]) => (
                <div key={dayLabel} className="py-4 first:pt-0">
                  <div className="flex items-center gap-2 mb-3">
                    <CalendarCheck2 className="w-4 h-4 text-cyan-400 shrink-0" />
                    <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
                      {dayLabel}
                    </h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 text-slate-400">
                      {dayEvents.length} event{dayEvents.length > 1 ? "s" : ""}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {dayEvents.map((evt) => (
                      <div
                        key={evt.id}
                        onClick={() => {
                          if (soundEffectsEnabled) soundEffects.playChirp();
                          setSelectedEvent(evt);
                        }}
                        className="p-3.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 hover:border-blue-400/50 transition-all cursor-pointer flex flex-col justify-between gap-3 group"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h4 className="text-xs font-mono font-bold text-white group-hover:text-cyan-300 transition-colors truncate">
                              {evt.summary}
                            </h4>
                            <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400 mt-1">
                              <Clock className="w-3 h-3 text-cyan-400 shrink-0" />
                              <span className="truncate">{formatEventTime(evt)}</span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRequestDeleteEvent(evt);
                            }}
                            className="p-1 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 cursor-pointer transition-colors"
                            title="Delete Event"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {evt.location && (
                          <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400 truncate">
                            <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
                            <span className="truncate">{evt.location}</span>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[11px] font-mono">
                          {evt.hangoutLink ? (
                            <a
                              href={evt.hangoutLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-400/30 flex items-center gap-1 transition-all"
                            >
                              <Video className="w-3 h-3" />
                              <span>Join Meet</span>
                            </a>
                          ) : (
                            <span className="text-slate-500 text-[10px]">No Meet Link</span>
                          )}

                          {evt.htmlLink && (
                            <a
                              href={evt.htmlLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-cyan-400 hover:underline flex items-center gap-1"
                            >
                              <span>Google Calendar</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 3. EVENT DETAILS MODAL */}
      <AnimatePresence>
        {selectedEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-slate-950 border border-blue-500/40 rounded-3xl p-5 shadow-2xl flex flex-col gap-4 font-mono text-xs"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-blue-400" />
                  <h3 className="font-bold text-white text-sm truncate">{selectedEvent.summary}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedEvent(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-col gap-3 font-mono text-xs text-slate-300">
                <div className="flex items-start gap-2.5">
                  <Clock className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-400 block text-[10px]">TIME & DATE</span>
                    <span className="text-white">{formatEventTime(selectedEvent)}</span>
                  </div>
                </div>

                {selectedEvent.location && (
                  <div className="flex items-start gap-2.5">
                    <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-slate-400 block text-[10px]">LOCATION</span>
                      <span className="text-white">{selectedEvent.location}</span>
                    </div>
                  </div>
                )}

                {selectedEvent.description && (
                  <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 font-sans text-xs leading-relaxed text-slate-200">
                    {selectedEvent.description}
                  </div>
                )}

                {selectedEvent.attendees && selectedEvent.attendees.length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    <span className="text-slate-400 text-[10px] flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      <span>ATTENDEES ({selectedEvent.attendees.length})</span>
                    </span>
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                      {selectedEvent.attendees.map((att, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-[11px] text-slate-300">
                          {att.displayName || att.email}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => handleRequestDeleteEvent(selectedEvent)}
                  className="px-3.5 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/30 flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Event</span>
                </button>

                <div className="flex items-center gap-2">
                  {selectedEvent.hangoutLink && (
                    <a
                      href={selectedEvent.hangoutLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Join Meet</span>
                    </a>
                  )}

                  {selectedEvent.htmlLink && (
                    <a
                      href={selectedEvent.htmlLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>View in Google</span>
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. NEW EVENT CREATION MODAL */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-slate-950 border border-blue-500/40 rounded-3xl p-5 shadow-2xl flex flex-col gap-4 font-mono text-xs max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-blue-400" />
                  <span className="font-bold text-white text-sm">Schedule Google Calendar Event</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleRequestCreateEvent} className="flex flex-col gap-3">
                <div>
                  <label className="text-slate-300 block mb-1">Event Title *</label>
                  <input
                    type="text"
                    value={eventSummary}
                    onChange={(e) => setEventSummary(e.target.value)}
                    placeholder="e.g. Dravis Architecture Sync"
                    required
                    className="w-full bg-black/50 border border-white/15 focus:border-blue-400 rounded-xl px-3 py-2 text-white outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-300 block mb-1">Start Time *</label>
                    <input
                      type="datetime-local"
                      value={eventStartDate}
                      onChange={(e) => setEventStartDate(e.target.value)}
                      required
                      className="w-full bg-black/50 border border-white/15 focus:border-blue-400 rounded-xl px-3 py-2 text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-slate-300 block mb-1">End Time *</label>
                    <input
                      type="datetime-local"
                      value={eventEndDate}
                      onChange={(e) => setEventEndDate(e.target.value)}
                      required
                      className="w-full bg-black/50 border border-white/15 focus:border-blue-400 rounded-xl px-3 py-2 text-white outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-300 block mb-1">Location (optional)</label>
                  <input
                    type="text"
                    value={eventLocation}
                    onChange={(e) => setEventLocation(e.target.value)}
                    placeholder="e.g. Conference Room A or Remote"
                    className="w-full bg-black/50 border border-white/15 focus:border-blue-400 rounded-xl px-3 py-2 text-white outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-300 block mb-1">Guests / Attendees (comma separated)</label>
                  <input
                    type="text"
                    value={eventAttendees}
                    onChange={(e) => setEventAttendees(e.target.value)}
                    placeholder="user1@example.com, user2@example.com"
                    className="w-full bg-black/50 border border-white/15 focus:border-blue-400 rounded-xl px-3 py-2 text-white outline-none"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="add-meet-checkbox"
                    checked={addGoogleMeet}
                    onChange={(e) => setAddGoogleMeet(e.target.checked)}
                    className="rounded accent-blue-500 cursor-pointer"
                  />
                  <label htmlFor="add-meet-checkbox" className="text-slate-300 flex items-center gap-1.5 cursor-pointer">
                    <Video className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Generate Google Meet video link</span>
                  </label>
                </div>

                <div>
                  <label className="text-slate-300 block mb-1">Description / Notes</label>
                  <textarea
                    rows={3}
                    value={eventDescription}
                    onChange={(e) => setEventDescription(e.target.value)}
                    placeholder="Agenda, topics, notes..."
                    className="w-full bg-black/50 border border-white/15 focus:border-blue-400 rounded-xl p-3 text-white outline-none leading-relaxed font-sans"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-bold cursor-pointer shadow-md"
                  >
                    Schedule Event
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. MANDATORY CONFIRMATION DIALOG (FOR DESTRUCTIVE/MUTATING ACTIONS) */}
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
                      : "bg-blue-500/20 text-blue-400 border border-blue-400/40"
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
                      : "bg-blue-500 hover:bg-blue-400 text-white shadow-blue-500/30"
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
