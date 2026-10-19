/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Google Drive Workspace Explorer & Cloud Storage Hub for Dravis ASI
 */

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  HardDrive,
  Folder,
  File,
  FileText,
  FileSpreadsheet,
  FileImage,
  FileCode,
  Search,
  Upload,
  FolderPlus,
  RefreshCw,
  Star,
  Trash2,
  ExternalLink,
  Download,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  ChevronRight,
  Home,
  X,
  Plus,
  LogOut,
  Copy,
  Sparkles,
  Grid,
  List,
} from "lucide-react";
import {
  googleDriveApi,
  DriveFileItem,
  DriveAboutInfo,
} from "../../services/googleDriveApi";
import {
  initAuth,
  googleSignIn,
  logout,
  getAccessToken,
  getCachedUser,
} from "../../services/googleAuth";
import { soundEffects } from "../../utils/audioSynth";

interface DriveConsoleProps {
  onSpeak?: (text: string) => void;
  soundEffectsEnabled?: boolean;
  onClose?: () => void;
  isCompact?: boolean;
}

export const DriveConsole: React.FC<DriveConsoleProps> = ({
  onSpeak,
  soundEffectsEnabled = true,
  onClose,
  isCompact = false,
}) => {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [aboutInfo, setAboutInfo] = useState<DriveAboutInfo | null>(null);
  const [googleUser, setGoogleUser] = useState<any>(null);

  // Explorer State
  const [currentFolderId, setCurrentFolderId] = useState<string>("root");
  const [folderHistory, setFolderHistory] = useState<Array<{ id: string; name: string }>>([
    { id: "root", name: "My Drive" },
  ]);
  const [files, setFiles] = useState<DriveFileItem[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<"GRID" | "LIST">("GRID");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterType, setFilterType] = useState<
    "ALL" | "FOLDERS" | "DOCS" | "SHEETS" | "SLIDES" | "IMAGES" | "STARRED" | "TRASH"
  >("ALL");

  // Selection & Details Drawer
  const [selectedFile, setSelectedFile] = useState<DriveFileItem | null>(null);

  // Modals State
  const [isNewFolderOpen, setIsNewFolderOpen] = useState<boolean>(false);
  const [newFolderName, setNewFolderName] = useState<string>("");
  const [isCreatingFolder, setIsCreatingFolder] = useState<boolean>(false);

  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [uploadFileName, setUploadFileName] = useState<string>("");
  const [uploadFileContent, setUploadFileContent] = useState<string>("");
  const [uploadMimeType, setUploadMimeType] = useState<string>("text/plain");
  const [isUploading, setIsUploading] = useState<boolean>(false);

  // Mandatory Explicit Confirmation Modal for mutations
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

  // Notifications
  const [notification, setNotification] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);

  const notify = (text: string, type: "success" | "error" | "info" = "info") => {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 4000);
  };

  // Auth initialization
  useEffect(() => {
    const unsubscribe = initAuth(
      (user) => {
        setIsAuthenticated(true);
        setGoogleUser(user);
        loadDriveData();
      },
      () => {
        setIsAuthenticated(false);
        setAboutInfo(null);
        setGoogleUser(null);
      }
    );

    getAccessToken().then((token) => {
      if (token) {
        setIsAuthenticated(true);
        setGoogleUser(getCachedUser());
        loadDriveData();
      }
    });

    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, []);

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
        notify("Authenticated with Google Drive!", "success");
        onSpeak?.("Google Drive access confirmed, Sir. Cloud storage online.");
        await loadDriveData();
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
    setAboutInfo(null);
    setFiles([]);
    setSelectedFile(null);
    notify("Signed out from Google Workspace.", "info");
  };

  // Load About Info and Current Folder Files
  const loadDriveData = useCallback(async () => {
    setIsLoadingFiles(true);
    try {
      // 1. Fetch storage & user about info
      googleDriveApi
        .getAbout()
        .then((about) => setAboutInfo(about))
        .catch(() => {});

      // 2. Build Query
      let q = searchQuery.trim();
      let isTrash = filterType === "TRASH";

      if (!q) {
        if (filterType === "STARRED") {
          q = "starred = true and trashed = false";
        } else if (filterType === "DOCS") {
          q = "mimeType = 'application/vnd.google-apps.document' and trashed = false";
        } else if (filterType === "SHEETS") {
          q = "mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false";
        } else if (filterType === "SLIDES") {
          q = "mimeType = 'application/vnd.google-apps.presentation' and trashed = false";
        } else if (filterType === "IMAGES") {
          q = "mimeType contains 'image/' and trashed = false";
        } else if (filterType === "FOLDERS") {
          q = "mimeType = 'application/vnd.google-apps.folder' and trashed = false";
        }
      }

      const res = await googleDriveApi.listFiles({
        folderId: filterType === "ALL" && !q ? currentFolderId : undefined,
        q: q || undefined,
        includeTrashed: isTrash,
        pageSize: 40,
      });

      setFiles(res.files);
    } catch (err: any) {
      console.error(err);
      if (
        String(err?.message || "").includes("401") ||
        String(err?.message || "").includes("Authentication required")
      ) {
        setIsAuthenticated(false);
      }
    } finally {
      setIsLoadingFiles(false);
    }
  }, [currentFolderId, filterType, searchQuery]);

  useEffect(() => {
    if (isAuthenticated) {
      loadDriveData();
    }
  }, [currentFolderId, filterType, isAuthenticated, loadDriveData]);

  // Navigate into folder
  const handleOpenFolder = (folder: DriveFileItem) => {
    if (soundEffectsEnabled) soundEffects.playChirp();
    setCurrentFolderId(folder.id);
    setFolderHistory((prev) => [...prev, { id: folder.id, name: folder.name }]);
    setSelectedFile(null);
  };

  // Navigate breadcrumb
  const handleNavigateBreadcrumb = (index: number) => {
    if (soundEffectsEnabled) soundEffects.playChirp();
    const target = folderHistory[index];
    setFolderHistory((prev) => prev.slice(0, index + 1));
    setCurrentFolderId(target.id);
    setSelectedFile(null);
  };

  // Toggle Star
  const handleToggleStar = async (file: DriveFileItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (soundEffectsEnabled) soundEffects.playChirp();

    const willBeStarred = !file.starred;
    setFiles((prev) =>
      prev.map((f) => (f.id === file.id ? { ...f, starred: willBeStarred } : f))
    );
    if (selectedFile?.id === file.id) {
      setSelectedFile((prev) => (prev ? { ...prev, starred: willBeStarred } : null));
    }

    try {
      await googleDriveApi.toggleStar(file.id, willBeStarred);
    } catch (err) {
      console.error(err);
      notify("Failed to update star in Drive", "error");
    }
  };

  // Trash File (Explicit confirmation)
  const handleRequestTrash = (file: DriveFileItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (soundEffectsEnabled) soundEffects.playAlert();

    setConfirmDialog({
      isOpen: true,
      title: "Move File to Trash?",
      description: `Are you sure you want to move "${file.name}" to Google Drive Trash?`,
      actionLabel: "Move to Trash",
      isDestructive: true,
      onConfirm: async () => {
        setIsActionPending(true);
        try {
          await googleDriveApi.trashFile(file.id);
          setFiles((prev) => prev.filter((f) => f.id !== file.id));
          if (selectedFile?.id === file.id) setSelectedFile(null);
          notify(`"${file.name}" moved to Trash.`, "info");
        } catch (err: any) {
          notify(err?.message || "Failed to move file to trash.", "error");
        } finally {
          setIsActionPending(false);
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  // Delete Permanently (Explicit confirmation)
  const handleRequestPermanentDelete = (file: DriveFileItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (soundEffectsEnabled) soundEffects.playAlert();

    setConfirmDialog({
      isOpen: true,
      title: "Permanently Delete File?",
      description: `Are you sure you want to permanently delete "${file.name}"? This action cannot be undone.`,
      actionLabel: "Delete Permanently",
      isDestructive: true,
      onConfirm: async () => {
        setIsActionPending(true);
        try {
          await googleDriveApi.deletePermanently(file.id);
          setFiles((prev) => prev.filter((f) => f.id !== file.id));
          if (selectedFile?.id === file.id) setSelectedFile(null);
          notify(`"${file.name}" permanently deleted.`, "info");
        } catch (err: any) {
          notify(err?.message || "Failed to delete file permanently.", "error");
        } finally {
          setIsActionPending(false);
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  // Create Folder
  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    setIsCreatingFolder(true);
    if (soundEffectsEnabled) soundEffects.playActivatePulse();

    try {
      const created = await googleDriveApi.createFolder(newFolderName.trim(), currentFolderId);
      setFiles((prev) => [created, ...prev]);
      notify(`Folder "${newFolderName}" created in Drive!`, "success");
      setIsNewFolderOpen(false);
      setNewFolderName("");
    } catch (err: any) {
      notify(err?.message || "Failed to create folder.", "error");
    } finally {
      setIsCreatingFolder(false);
    }
  };

  // Upload File
  const handleUploadFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFileName.trim()) return;

    setIsUploading(true);
    if (soundEffectsEnabled) soundEffects.playActivatePulse();

    try {
      const created = await googleDriveApi.uploadFile({
        name: uploadFileName.trim(),
        mimeType: uploadMimeType,
        content: uploadFileContent,
        parentFolderId: currentFolderId,
      });

      setFiles((prev) => [created, ...prev]);
      notify(`File "${uploadFileName}" uploaded to Google Drive!`, "success");
      setIsUploadOpen(false);
      setUploadFileName("");
      setUploadFileContent("");
    } catch (err: any) {
      notify(err?.message || "Failed to upload file.", "error");
    } finally {
      setIsUploading(false);
    }
  };

  // Helper to format bytes
  const formatBytes = (bytesStr?: string | number): string => {
    if (!bytesStr) return "0 B";
    const bytes = typeof bytesStr === "string" ? parseInt(bytesStr, 10) : bytesStr;
    if (isNaN(bytes) || bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  // Storage percentage calculation
  const storagePercentage = useMemo(() => {
    const usage = parseInt(aboutInfo?.storageQuota.usage || "0", 10);
    const limit = parseInt(aboutInfo?.storageQuota.limit || "1", 10);
    if (!limit || isNaN(limit) || limit <= 0) return 0;
    return Math.min(100, Math.round((usage / limit) * 100));
  }, [aboutInfo]);

  // File icon resolver
  const getFileIcon = (file: DriveFileItem) => {
    if (file.isFolder) {
      return <Folder className="w-5 h-5 text-amber-400 fill-amber-400/20" />;
    }
    const mt = file.mimeType.toLowerCase();
    if (mt.includes("document") || mt.includes("word") || mt.includes("text")) {
      return <FileText className="w-5 h-5 text-blue-400" />;
    }
    if (mt.includes("spreadsheet") || mt.includes("excel") || mt.includes("sheet")) {
      return <FileSpreadsheet className="w-5 h-5 text-emerald-400" />;
    }
    if (mt.includes("presentation") || mt.includes("powerpoint")) {
      return <FileText className="w-5 h-5 text-amber-500" />;
    }
    if (mt.includes("image/")) {
      return <FileImage className="w-5 h-5 text-cyan-400" />;
    }
    if (mt.includes("json") || mt.includes("javascript") || mt.includes("typescript") || mt.includes("html") || mt.includes("python")) {
      return <FileCode className="w-5 h-5 text-purple-400" />;
    }
    return <File className="w-5 h-5 text-slate-400" />;
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-slate-950 text-slate-100 font-sans select-none overflow-hidden">
      {/* 1. TOP HEADER & STORAGE QUOTA */}
      <div className="px-4 py-3 border-b border-cyan-500/20 bg-slate-900/60 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/20 via-blue-500/20 to-emerald-500/20 border border-blue-400/40 flex items-center justify-center text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.25)]">
            <HardDrive className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-mono font-bold text-white tracking-wide truncate">
                Google Drive Hub
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-blue-500/20 text-blue-300 border border-blue-500/30">
                Official API v3
              </span>
            </div>
            <p className="text-[11px] font-mono text-slate-400 truncate">
              {isAuthenticated
                ? aboutInfo?.user.emailAddress || googleUser?.email || "Connected via Google Workspace"
                : "Cloud File Explorer • Zero Stored Passwords"}
            </p>
          </div>
        </div>

        {/* Storage Bar & Actions */}
        <div className="flex items-center gap-3">
          {isAuthenticated && aboutInfo?.storageQuota && (
            <div className="hidden lg:flex flex-col gap-1 w-44 font-mono text-[10px]">
              <div className="flex justify-between text-slate-400">
                <span>Storage</span>
                <span>
                  {formatBytes(aboutInfo.storageQuota.usage)} / {formatBytes(aboutInfo.storageQuota.limit)}
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-400 to-emerald-400 rounded-full transition-all duration-500"
                  style={{ width: `${storagePercentage}%` }}
                />
              </div>
            </div>
          )}

          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (soundEffectsEnabled) soundEffects.playChirp();
                  setIsNewFolderOpen(true);
                }}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-mono text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
                title="Create Folder"
              >
                <FolderPlus className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">New Folder</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (soundEffectsEnabled) soundEffects.playChirp();
                  setIsUploadOpen(true);
                }}
                className="px-3 py-1.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-mono text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-[0_0_15px_rgba(59,130,246,0.35)] transition-all active:scale-95"
                title="Upload File"
              >
                <Upload className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Upload</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (soundEffectsEnabled) soundEffects.playChirp();
                  loadDriveData();
                }}
                disabled={isLoadingFiles}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 cursor-pointer"
                title="Refresh Drive"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${isLoadingFiles ? "animate-spin text-cyan-400" : ""}`}
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
            </div>
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
              <span>{isAuthenticating ? "Connecting..." : "Connect Google Drive"}</span>
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
            <HardDrive className="w-8 h-8" />
          </div>

          <h3 className="text-xl font-bold font-mono text-white mb-2">
            Connect Your Google Drive
          </h3>
          <p className="text-xs text-slate-400 max-w-md leading-relaxed mb-6 font-mono">
            Authorize Dravis ASI to securely browse, search, upload, organize, and manage your cloud files in Google Drive.
            All tokens remain in memory and never touch storage disks.
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
        /* EXPLORER INTERFACE */
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Action Bar & Breadcrumbs */}
          <div className="p-3 border-b border-white/10 bg-slate-900/40 flex flex-wrap items-center justify-between gap-3">
            {/* Breadcrumbs */}
            <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-mono text-slate-300">
              {folderHistory.map((folder, idx) => (
                <React.Fragment key={folder.id}>
                  {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />}
                  <button
                    type="button"
                    onClick={() => handleNavigateBreadcrumb(idx)}
                    className={`hover:text-cyan-300 px-1.5 py-1 rounded-lg cursor-pointer whitespace-nowrap transition-all ${
                      idx === folderHistory.length - 1
                        ? "text-white font-bold bg-white/10"
                        : "text-slate-400 hover:bg-white/5"
                    }`}
                  >
                    {idx === 0 ? (
                      <span className="flex items-center gap-1">
                        <Home className="w-3.5 h-3.5" />
                        <span>My Drive</span>
                      </span>
                    ) : (
                      folder.name
                    )}
                  </button>
                </React.Fragment>
              ))}
            </div>

            {/* Search & View Toggle */}
            <div className="flex items-center gap-2">
              <div className="relative w-48 sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") loadDriveData();
                  }}
                  placeholder="Search files in Drive..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-black/40 border border-white/10 focus:border-blue-400/50 text-white text-xs font-mono outline-none"
                />
              </div>

              <div className="flex items-center gap-1 p-0.5 rounded-xl bg-black/40 border border-white/10">
                <button
                  type="button"
                  onClick={() => setViewMode("GRID")}
                  className={`p-1.5 rounded-lg cursor-pointer ${
                    viewMode === "GRID" ? "bg-white/15 text-white" : "text-slate-400 hover:text-white"
                  }`}
                  title="Grid view"
                >
                  <Grid className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("LIST")}
                  className={`p-1.5 rounded-lg cursor-pointer ${
                    viewMode === "LIST" ? "bg-white/15 text-white" : "text-slate-400 hover:text-white"
                  }`}
                  title="List view"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="px-3 py-2 border-b border-white/5 bg-slate-950/60 flex items-center gap-1.5 overflow-x-auto text-[11px] font-mono">
            {[
              { id: "ALL" as const, label: "All Items" },
              { id: "FOLDERS" as const, label: "Folders Only" },
              { id: "DOCS" as const, label: "Google Docs" },
              { id: "SHEETS" as const, label: "Google Sheets" },
              { id: "SLIDES" as const, label: "Presentations" },
              { id: "IMAGES" as const, label: "Images" },
              { id: "STARRED" as const, label: "Starred" },
              { id: "TRASH" as const, label: "Trash" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => {
                  if (soundEffectsEnabled) soundEffects.playChirp();
                  setFilterType(f.id);
                  setSelectedFile(null);
                }}
                className={`px-3 py-1 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                  filterType === f.id
                    ? "bg-blue-500/20 text-blue-200 border border-blue-400/40 font-bold"
                    : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Files Stage & Drawer */}
          <div className="flex-1 flex overflow-hidden min-h-0">
            {/* Files Grid/List Area */}
            <div className="flex-1 overflow-y-auto p-4">
              {isLoadingFiles ? (
                <div className="h-64 flex flex-col items-center justify-center gap-2 text-slate-400 font-mono text-xs">
                  <RefreshCw className="w-6 h-6 animate-spin text-blue-400" />
                  <span>Loading files from Google Drive...</span>
                </div>
              ) : files.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center gap-2 text-slate-500 font-mono text-xs">
                  <HardDrive className="w-8 h-8 opacity-40 mb-1" />
                  <span>No files or folders found here.</span>
                </div>
              ) : viewMode === "GRID" ? (
                /* GRID VIEW */
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                  {files.map((file) => {
                    const isSelected = selectedFile?.id === file.id;
                    return (
                      <div
                        key={file.id}
                        onClick={() => {
                          if (soundEffectsEnabled) soundEffects.playChirp();
                          setSelectedFile(file);
                        }}
                        onDoubleClick={() => {
                          if (file.isFolder) handleOpenFolder(file);
                        }}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-2 group ${
                          isSelected
                            ? "bg-blue-500/15 border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)]"
                            : "bg-white/[0.03] hover:bg-white/[0.06] border-white/10"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1">
                          <div className="p-2 rounded-xl bg-black/40 border border-white/5">
                            {getFileIcon(file)}
                          </div>

                          <button
                            type="button"
                            onClick={(e) => handleToggleStar(file, e)}
                            className="p-1 hover:text-amber-400 text-slate-500 cursor-pointer"
                          >
                            <Star
                              className={`w-3.5 h-3.5 ${
                                file.starred ? "text-amber-400 fill-amber-400" : ""
                              }`}
                            />
                          </button>
                        </div>

                        <div className="min-w-0">
                          <span className="text-xs font-mono font-medium text-white block truncate" title={file.name}>
                            {file.name}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 block truncate">
                            {file.isFolder ? "Folder" : formatBytes(file.size)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* LIST VIEW */
                <div className="divide-y divide-white/5 font-mono text-xs">
                  {files.map((file) => {
                    const isSelected = selectedFile?.id === file.id;
                    return (
                      <div
                        key={file.id}
                        onClick={() => {
                          if (soundEffectsEnabled) soundEffects.playChirp();
                          setSelectedFile(file);
                        }}
                        onDoubleClick={() => {
                          if (file.isFolder) handleOpenFolder(file);
                        }}
                        className={`p-3 flex items-center justify-between gap-3 cursor-pointer transition-all ${
                          isSelected ? "bg-blue-500/15 text-white" : "hover:bg-white/[0.03] text-slate-300"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {getFileIcon(file)}
                          <span className="truncate font-medium text-white">{file.name}</span>
                        </div>

                        <div className="flex items-center gap-4 text-slate-400 text-[11px] shrink-0">
                          <span>{file.isFolder ? "—" : formatBytes(file.size)}</span>
                          <span className="hidden sm:inline">
                            {new Date(file.modifiedTime).toLocaleDateString([], {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => handleToggleStar(file, e)}
                            className="p-1 hover:text-amber-400 text-slate-500 cursor-pointer"
                          >
                            <Star
                              className={`w-3.5 h-3.5 ${
                                file.starred ? "text-amber-400 fill-amber-400" : ""
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* File Details Drawer */}
            <AnimatePresence>
              {selectedFile && (
                <motion.div
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 50 }}
                  className="w-72 sm:w-80 border-l border-white/10 bg-slate-950/90 p-4 flex flex-col justify-between overflow-y-auto shrink-0"
                >
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between pb-3 border-b border-white/10">
                      <h4 className="text-xs font-mono font-bold text-white truncate">
                        File Details
                      </h4>
                      <button
                        type="button"
                        onClick={() => setSelectedFile(null)}
                        className="p-1 rounded-lg text-slate-400 hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex flex-col items-center p-4 rounded-2xl bg-black/40 border border-white/10 text-center gap-2">
                      <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                        {getFileIcon(selectedFile)}
                      </div>
                      <span className="text-xs font-mono font-bold text-white break-all">
                        {selectedFile.name}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {selectedFile.mimeType}
                      </span>
                    </div>

                    <div className="flex flex-col gap-2 font-mono text-xs text-slate-300">
                      <div className="flex justify-between py-1 border-b border-white/5">
                        <span className="text-slate-500">Size</span>
                        <span>{selectedFile.isFolder ? "Folder" : formatBytes(selectedFile.size)}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-white/5">
                        <span className="text-slate-500">Modified</span>
                        <span>{new Date(selectedFile.modifiedTime).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-white/5">
                        <span className="text-slate-500">Created</span>
                        <span>{new Date(selectedFile.createdTime).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Buttons */}
                  <div className="flex flex-col gap-2 pt-4 border-t border-white/10 font-mono text-xs">
                    {selectedFile.webViewLink && (
                      <a
                        href={selectedFile.webViewLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-2 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Open in Google Drive</span>
                      </a>
                    )}

                    {selectedFile.webContentLink && (
                      <a
                        href={selectedFile.webContentLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Content</span>
                      </a>
                    )}

                    {selectedFile.isFolder ? (
                      <button
                        type="button"
                        onClick={() => handleOpenFolder(selectedFile)}
                        className="px-3 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold flex items-center justify-center gap-1.5 cursor-pointer border border-amber-500/30"
                      >
                        <Folder className="w-3.5 h-3.5" />
                        <span>Explore Folder</span>
                      </button>
                    ) : null}

                    {filterType === "TRASH" ? (
                      <button
                        type="button"
                        onClick={() => handleRequestPermanentDelete(selectedFile)}
                        className="px-3 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 font-bold flex items-center justify-center gap-1.5 cursor-pointer border border-red-500/30"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Permanently</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleRequestTrash(selectedFile)}
                        className="px-3 py-2 rounded-xl bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-300 flex items-center justify-center gap-1.5 cursor-pointer border border-white/10"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Move to Trash</span>
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* 3. NEW FOLDER MODAL */}
      <AnimatePresence>
        {isNewFolderOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-slate-950 border border-amber-500/40 rounded-3xl p-5 shadow-2xl flex flex-col gap-4 font-mono text-xs"
            >
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <FolderPlus className="w-4 h-4 text-amber-400" />
                  <span className="font-bold text-white text-sm">Create New Folder</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsNewFolderOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateFolder} className="flex flex-col gap-3">
                <div>
                  <label className="text-slate-300 block mb-1">Folder Name</label>
                  <input
                    type="text"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="e.g. Dravis ASI Backups"
                    required
                    className="w-full bg-black/50 border border-white/15 focus:border-amber-400 rounded-xl px-3 py-2 text-white outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsNewFolderOpen(false)}
                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingFolder}
                    className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold cursor-pointer"
                  >
                    {isCreatingFolder ? "Creating..." : "Create Folder"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. UPLOAD FILE MODAL */}
      <AnimatePresence>
        {isUploadOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-slate-950 border border-blue-500/40 rounded-3xl p-5 shadow-2xl flex flex-col gap-4 font-mono text-xs"
            >
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Upload className="w-4 h-4 text-blue-400" />
                  <span className="font-bold text-white text-sm">Upload File to Google Drive</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleUploadFile} className="flex flex-col gap-3">
                <div>
                  <label className="text-slate-300 block mb-1">File Name</label>
                  <input
                    type="text"
                    value={uploadFileName}
                    onChange={(e) => setUploadFileName(e.target.value)}
                    placeholder="e.g. notes.txt or report.json"
                    required
                    className="w-full bg-black/50 border border-white/15 focus:border-blue-400 rounded-xl px-3 py-2 text-white outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-300 block mb-1">MIME Type</label>
                  <select
                    value={uploadMimeType}
                    onChange={(e) => setUploadMimeType(e.target.value)}
                    className="w-full bg-black/50 border border-white/15 focus:border-blue-400 rounded-xl px-3 py-2 text-white outline-none"
                  >
                    <option value="text/plain">Plain Text (.txt)</option>
                    <option value="application/json">JSON (.json)</option>
                    <option value="text/markdown">Markdown (.md)</option>
                    <option value="text/html">HTML (.html)</option>
                    <option value="text/javascript">JavaScript (.js)</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 block mb-1">File Content</label>
                  <textarea
                    rows={6}
                    value={uploadFileContent}
                    onChange={(e) => setUploadFileContent(e.target.value)}
                    placeholder="Enter or paste text content to save into Google Drive..."
                    className="w-full bg-black/50 border border-white/15 focus:border-blue-400 rounded-xl p-3 text-white outline-none leading-relaxed font-sans"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsUploadOpen(false)}
                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUploading}
                    className="px-5 py-2 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-bold cursor-pointer"
                  >
                    {isUploading ? "Uploading..." : "Upload to Drive"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. MANDATORY USER CONFIRMATION MODAL FOR DESTRUCTIVE ACTIONS */}
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
