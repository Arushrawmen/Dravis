/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Explicit Consent-Based Family & Guardian Supervision Dashboard
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  Users,
  Eye,
  Lock,
  Unlock,
  Trash2,
  Download,
  AlertTriangle,
  Clock,
  History,
  FileCheck,
  CheckCircle2,
  Sparkles,
  Link2Off,
  Search,
} from "lucide-react";
import { FamilySupervisionConfig, SupervisionAuditLog } from "../types";
import { soundEffects } from "../utils/audioSynth";

interface FamilySupervisionViewProps {
  config: FamilySupervisionConfig;
  onUpdateConfig: (updated: FamilySupervisionConfig) => void;
  onExportAudit: () => void;
  soundEffectsEnabled: boolean;
}

export const FamilySupervisionView: React.FC<FamilySupervisionViewProps> = ({
  config,
  onUpdateConfig,
  onExportAudit,
  soundEffectsEnabled,
}) => {
  const [guardianEmailInput, setGuardianEmailInput] = useState(config.guardianEmail);
  const [guardianNameInput, setGuardianNameInput] = useState(config.guardianName);
  const [confirmUnlinkModal, setConfirmUnlinkModal] = useState(false);
  const [confirmLockModal, setConfirmLockModal] = useState(false);

  const permissionItems: {
    key: keyof FamilySupervisionConfig["permissions"];
    title: string;
    description: string;
    icon: React.FC<any>;
  }[] = [
    {
      key: "conversationHistory",
      title: "Conversation History",
      description: "Permit guardian to review past chat and voice dialogues with DRAVIS.",
      icon: History,
    },
    {
      key: "searchHistory",
      title: "Search & Research History",
      description: "Allow inspection of web queries, topics explored, and fact-checking sessions.",
      icon: Search,
    },
    {
      key: "savedMemories",
      title: "Saved Long-Term Memories",
      description: "Allow guardian to inspect explicit facts and learned user preferences.",
      icon: FileCheck,
    },
    {
      key: "aiGeneratedContent",
      title: "AI-Generated Content & Images",
      description: "Provide transparency over image syntheses, creative stories, and code generated.",
      icon: Sparkles,
    },
    {
      key: "appActivity",
      title: "App & Desktop Automation Activity",
      description: "Log which applications (Chrome, YouTube, Excel) were launched via automation.",
      icon: Users,
    },
    {
      key: "screenAwarenessActivity",
      title: "Screen-Awareness Telemetry",
      description: "Log timestamps when OCR and screen understanding frames were inspected.",
      icon: Eye,
    },
    {
      key: "usageStatistics",
      title: "Daily Usage Statistics & Screen Time",
      description: "Track total active runtime, token consumption, and daily usage hours.",
      icon: Clock,
    },
  ];

  const handleToggleSupervision = () => {
    if (soundEffectsEnabled) soundEffects.playActivatePulse();
    const updated = {
      ...config,
      isEnabled: !config.isEnabled,
    };
    onUpdateConfig(updated);
  };

  const handleTogglePermission = (key: keyof FamilySupervisionConfig["permissions"]) => {
    if (soundEffectsEnabled) soundEffects.playChirp();
    const updated = {
      ...config,
      permissions: {
        ...config.permissions,
        [key]: !config.permissions[key],
      },
    };
    onUpdateConfig(updated);
  };

  const handleToggleEmergencyLock = () => {
    if (soundEffectsEnabled) soundEffects.playActivatePulse();
    const updated = {
      ...config,
      emergencyLockActive: !config.emergencyLockActive,
    };
    onUpdateConfig(updated);
    setConfirmLockModal(false);
  };

  const handleUnlink = () => {
    if (soundEffectsEnabled) soundEffects.playChirp();
    const updated: FamilySupervisionConfig = {
      isEnabled: false,
      guardianEmail: "",
      guardianName: "",
      relationship: "Parent",
      linkedDate: "",
      permissions: {
        conversationHistory: false,
        searchHistory: false,
        savedMemories: false,
        aiGeneratedContent: false,
        appActivity: false,
        screenAwarenessActivity: false,
        usageStatistics: false,
      },
      auditLogs: [
        ...config.auditLogs,
        {
          id: "audit-" + Date.now(),
          timestamp: new Date().toLocaleString(),
          accessor: "Local User",
          category: "Account Link",
          action: "UNLINK_GUARDIAN",
          details: "Guardian account unlinked successfully. All permissions revoked.",
        },
      ],
      emergencyLockActive: false,
    };
    onUpdateConfig(updated);
    setConfirmUnlinkModal(false);
  };

  return (
    <div 
      id="dravis-family-supervision-view"
      className="flex-1 flex flex-col p-4 sm:p-6 gap-6 overflow-y-auto bg-slate-950/60 font-sans select-none"
    >
      {/* 1. Header Banner & Consent Transparency Notice */}
      <div className="flex flex-col gap-4 p-5 rounded-3xl bg-slate-900/80 border border-cyan-500/30 backdrop-blur-xl shadow-[0_0_30px_rgba(6,182,212,0.15)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-300">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-wide">
                  FAMILY & GUARDIAN SUPERVISION
                </h2>
                <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-mono font-bold border ${
                  config.isEnabled
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                    : "bg-slate-800 text-slate-400 border-slate-700"
                }`}>
                  {config.isEnabled ? "ACTIVE SUPERVISION" : "SUPERVISION DISABLED"}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Explicit, transparent, consent-based guardian controls with zero hidden monitoring
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleToggleSupervision}
              className={`px-4 py-2.5 rounded-xl font-mono text-xs font-bold transition-all shadow-md flex items-center gap-2 ${
                config.isEnabled
                  ? "bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40"
                  : "bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.4)]"
              }`}
            >
              {config.isEnabled ? "Disable Supervision" : "Enable Consent Supervision"}
            </button>
          </div>
        </div>

        {/* Supervision Status Callout */}
        <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs font-mono text-slate-300">
          <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
          <div className="flex flex-col gap-1">
            <span className="font-bold text-cyan-300">Zero-Secret Transparency Guarantee</span>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              DRAVIS never secretly monitors or shares information. Every data category requires your explicit permission. You can review the complete access audit log or unlink guardian accounts at any moment.
            </p>
          </div>
        </div>
      </div>

      {/* 2. Guardian Details & Relationship Card */}
      {config.isEnabled && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="md:col-span-2 p-5 rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl flex flex-col gap-4">
            <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-cyan-400" /> Linked Guardian Credentials
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
              <div className="flex flex-col gap-1">
                <span className="text-slate-400 text-[11px]">Guardian Name</span>
                <input
                  type="text"
                  value={guardianNameInput}
                  onChange={(e) => setGuardianNameInput(e.target.value)}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-sans"
                />
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-slate-400 text-[11px]">Guardian Email</span>
                <input
                  type="email"
                  value={guardianEmailInput}
                  onChange={(e) => setGuardianEmailInput(e.target.value)}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-sans"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs font-mono text-slate-400">
              <span>Relationship: <strong className="text-cyan-300">{config.relationship}</strong></span>
              <span>Linked Date: <strong className="text-slate-300">{config.linkedDate || "May 2025"}</strong></span>
            </div>
          </div>

          {/* Emergency Safety Lock Card */}
          <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl flex flex-col justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-red-400 font-mono font-bold text-xs">
                <AlertTriangle className="w-4 h-4" /> Emergency Safety Lock
              </div>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Temporarily lock DRAVIS desktop automation and generative capabilities during emergencies.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setConfirmLockModal(true)}
                className={`w-full py-2.5 px-3 rounded-xl font-mono text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  config.emergencyLockActive
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                    : "bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40"
                }`}
              >
                {config.emergencyLockActive ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                <span>{config.emergencyLockActive ? "Release Emergency Lock" : "Activate Emergency Lock"}</span>
              </button>

              <button
                type="button"
                onClick={() => setConfirmUnlinkModal(true)}
                className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono flex items-center justify-center gap-1.5"
              >
                <Link2Off className="w-3.5 h-3.5 text-slate-400" />
                <span>Unlink Guardian Account</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Granular Category Permissions Grid */}
      <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400" /> Granular Category Permissions
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              Independently configure which information can be accessed by the guardian account
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {permissionItems.map((item) => {
            const Icon = item.icon;
            const isGranted = config.permissions[item.key];

            return (
              <div
                key={item.key}
                className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                  isGranted
                    ? "bg-cyan-950/20 border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.1)]"
                    : "bg-slate-950/60 border-slate-800/80 opacity-70"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-xl mt-0.5 ${
                    isGranted ? "bg-cyan-500/20 text-cyan-300" : "bg-slate-800 text-slate-500"
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-bold text-white font-mono">
                      {item.title}
                    </span>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={!config.isEnabled}
                  onClick={() => handleTogglePermission(item.key)}
                  className={`px-3 py-1.5 rounded-xl font-mono text-[11px] font-bold transition-all shrink-0 ${
                    isGranted
                      ? "bg-cyan-500 text-slate-950 shadow-[0_0_8px_rgba(6,182,212,0.5)]"
                      : "bg-slate-800 text-slate-400 hover:text-white"
                  } disabled:opacity-30 disabled:cursor-not-allowed`}
                >
                  {isGranted ? "GRANTED" : "DENIED"}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Complete Audit Log of Guardian Access */}
      <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
              <History className="w-4 h-4 text-cyan-400" /> Transparent Supervision Audit Trail
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              Immutable ledger of who accessed information, what was viewed, and exact timestamps
            </p>
          </div>

          <button
            type="button"
            onClick={onExportAudit}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Audit Log</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Accessor</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Action</th>
                <th className="py-2.5 px-3">Details</th>
              </tr>
            </thead>
            <tbody>
              {config.auditLogs.map((log) => (
                <tr key={log.id} className="border-b border-slate-800/40 hover:bg-white/5">
                  <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap">{log.timestamp}</td>
                  <td className="py-2.5 px-3 text-cyan-300 whitespace-nowrap">{log.accessor}</td>
                  <td className="py-2.5 px-3 text-slate-300">{log.category}</td>
                  <td className="py-2.5 px-3 font-semibold text-emerald-400">{log.action}</td>
                  <td className="py-2.5 px-3 text-slate-400">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modals */}
      <AnimatePresence>
        {confirmUnlinkModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <div className="max-w-md w-full p-6 rounded-3xl bg-slate-900 border border-red-500/40 flex flex-col gap-4 shadow-2xl">
              <div className="flex items-center gap-3 text-red-400">
                <AlertTriangle className="w-6 h-6" />
                <h3 className="text-base font-bold">Unlink Guardian Account?</h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-mono">
                This will immediately revoke all access permissions for <strong>{config.guardianEmail}</strong>. You can re-link at any time.
              </p>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmUnlinkModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-mono"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleUnlink}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs font-mono"
                >
                  Confirm Unlink
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {confirmLockModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <div className="max-w-md w-full p-6 rounded-3xl bg-slate-900 border border-cyan-500/40 flex flex-col gap-4 shadow-2xl">
              <div className="flex items-center gap-3 text-cyan-300">
                <Lock className="w-6 h-6" />
                <h3 className="text-base font-bold">
                  {config.emergencyLockActive ? "Release Emergency Safety Lock?" : "Engage Emergency Safety Lock?"}
                </h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-mono">
                {config.emergencyLockActive
                  ? "Releasing the safety lock will restore normal desktop automation and tool execution capabilities."
                  : "Engaging this lock temporarily pauses autonomous desktop tools and external automation until unlocked."}
              </p>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmLockModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-mono"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleToggleEmergencyLock}
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs font-mono"
                >
                  Confirm
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
