/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Add Reminder / Scheduled Task Modal
 */

import React, { useState } from "react";
import { Calendar, Clock, X, Plus } from "lucide-react";
import { ReminderItem } from "../../types";
import { soundEffects } from "../../utils/audioSynth";

interface AddReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddReminder: (reminder: ReminderItem) => void;
  soundEffectsEnabled: boolean;
}

export const AddReminderModal: React.FC<AddReminderModalProps> = ({
  isOpen,
  onClose,
  onAddReminder,
  soundEffectsEnabled,
}) => {
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("03:00 PM");
  const [date, setDate] = useState("Today");
  const [priority, setPriority] = useState<"HIGH" | "MEDIUM" | "LOW">("MEDIUM");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    if (soundEffectsEnabled) soundEffects.playActivatePulse();

    onAddReminder({
      id: "rem-" + Date.now(),
      title: title.trim(),
      time,
      date,
      completed: false,
      priority,
    });

    setTitle("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-950 border border-white/10 rounded-2xl p-5 flex flex-col gap-4 shadow-[0_0_35px_rgba(0,0,0,0.5)]">
        <div className="flex items-center justify-between pb-2 border-b border-white/5">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider">
              SCHEDULE NEW TASK / REMINDER
            </h3>
          </div>
          <button
            onClick={() => {
              if (soundEffectsEnabled) soundEffects.playChirp();
              onClose();
            }}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3 font-mono text-xs">
          <div>
            <label className="text-slate-400 block mb-1">Task Title / Directive</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Sync Quantum Core Database"
              className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400/60 font-sans"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 block mb-1">Target Time</label>
              <input
                type="text"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                placeholder="e.g. 02:30 PM"
                className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400/60"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Scheduled Date</label>
              <input
                type="text"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                placeholder="e.g. Today, Tomorrow"
                className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400/60"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Priority Classification</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as any)}
              className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400/60"
            >
              <option value="HIGH" className="bg-slate-950">HIGH PRIORITY</option>
              <option value="MEDIUM" className="bg-slate-950">MEDIUM PRIORITY</option>
              <option value="LOW" className="bg-slate-950">LOW PRIORITY</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/5 mt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white transition-all"
            >
              CANCEL
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold transition-all shadow-[0_0_15px_rgba(34,211,238,0.3)] flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>LOG REMINDER</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
