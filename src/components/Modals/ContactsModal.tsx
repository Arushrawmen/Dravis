/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Dravis Genuine Country-Code Calling (+91 Default), Contact Picker API & Contacts Hub
 */

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Phone,
  PhoneCall,
  User,
  Search,
  Plus,
  X,
  Smartphone,
  Trash2,
  Sparkles,
  PhoneForwarded,
  Upload,
  CheckCircle2,
  MessageCircle,
  Globe,
} from "lucide-react";
import { ContactItem, ContactPhone } from "../../types";
import { COUNTRY_CODE_OPTIONS, deviceHardware } from "../../utils/deviceHardware";

interface ContactsModalProps {
  isOpen: boolean;
  onClose: () => void;
  contacts: ContactItem[];
  onAddContact: (contact: ContactItem) => void;
  onImportContacts?: (contacts: ContactItem[]) => void;
  onDeleteContact: (id: string) => void;
  onInitiateCall: (contactName: string, number: string, label?: string) => void;
  defaultCountryCode?: string;
  onChangeCountryCode?: (code: string) => void;
}

export const ContactsModal: React.FC<ContactsModalProps> = ({
  isOpen,
  onClose,
  contacts,
  onAddContact,
  onImportContacts,
  onDeleteContact,
  onInitiateCall,
  defaultCountryCode = "+91",
  onChangeCountryCode,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCountryCode, setSelectedCountryCode] = useState(defaultCountryCode);
  const [directDialNumber, setDirectDialNumber] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const vcfInputRef = useRef<HTMLInputElement | null>(null);

  // New Contact Form State
  const [newName, setNewName] = useState("");
  const [newRelationship, setNewRelationship] = useState("");
  const [phones, setPhones] = useState<Array<{ label: "Mobile" | "Work" | "Home"; number: string }>>([
    { label: "Mobile", number: "" },
  ]);

  if (!isOpen) return null;

  const filteredContacts = contacts.filter((c) => {
    const query = searchQuery.toLowerCase();
    const matchName = c.name.toLowerCase().includes(query);
    const matchNumber = c.numbers.some((p) => p.number.includes(query));
    return matchName || matchNumber;
  });

  const handleCountryCodeChange = (code: string) => {
    setSelectedCountryCode(code);
    onChangeCountryCode?.(code);
  };

  const handleAddPhoneField = () => {
    if (phones.length >= 3) return;
    const nextLabel = phones.length === 1 ? "Work" : "Home";
    setPhones((prev) => [...prev, { label: nextLabel, number: "" }]);
  };

  const handleCreateContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const validPhones: ContactPhone[] = phones
      .filter((p) => p.number.trim().length > 0)
      .map((p, idx) => ({
        id: `phone-${Date.now()}-${idx}`,
        label: p.label,
        number: deviceHardware.formatPhoneWithCountryCode(p.number.trim(), selectedCountryCode),
        isPrimary: idx === 0,
      }));

    if (validPhones.length === 0) return;

    const newContact: ContactItem = {
      id: "cnt-" + Date.now(),
      name: newName.trim(),
      relationship: newRelationship.trim() || "Contact",
      lastContacted: "Just now",
      numbers: validPhones,
    };

    onAddContact(newContact);
    setNewName("");
    setNewRelationship("");
    setPhones([{ label: "Mobile", number: "" }]);
    setShowAddForm(false);
    setSyncStatus(`Saved ${newContact.name} (${validPhones[0].number}) to Contacts.`);
    setTimeout(() => setSyncStatus(null), 4000);
  };

  const handleDirectDial = () => {
    if (!directDialNumber.trim()) return;
    const formatted = deviceHardware.formatPhoneWithCountryCode(
      directDialNumber.trim(),
      selectedCountryCode
    );
    onInitiateCall(formatted, formatted, "Direct Dial");
    setDirectDialNumber("");
    onClose();
  };

  const handleSyncDeviceContacts = async () => {
    try {
      const picked = await deviceHardware.pickDeviceContacts(selectedCountryCode);
      if (picked.length > 0) {
        if (onImportContacts) {
          onImportContacts(picked);
        } else {
          picked.forEach((c) => onAddContact(c));
        }
        setSyncStatus(`Synced ${picked.length} real contact(s) from your device!`);
      } else {
        setSyncStatus("No contacts selected.");
      }
    } catch {
      // Trigger .vcf file picker fallback so Desktop & unsupported browsers can import contacts immediately
      vcfInputRef.current?.click();
    }
    setTimeout(() => setSyncStatus(null), 4500);
  };

  const handleVcfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = String(ev.target?.result || "");
      const parsed = deviceHardware.parseVCardContacts(text, selectedCountryCode);
      if (parsed.length > 0) {
        if (onImportContacts) {
          onImportContacts(parsed);
        } else {
          parsed.forEach((c) => onAddContact(c));
        }
        setSyncStatus(`Imported ${parsed.length} real contact(s) from ${file.name}!`);
      } else {
        setSyncStatus("Could not find phone numbers in vCard file.");
      }
      setTimeout(() => setSyncStatus(null), 4500);
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-2xl max-h-[90vh] bg-slate-950/95 backdrop-blur-3xl border border-cyan-500/40 rounded-3xl flex flex-col shadow-[0_0_40px_rgba(6,182,212,0.28)] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-cyan-500/20 bg-slate-900/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-mono font-bold text-white tracking-wide">
                  GENUINE PHONE DIALER & CONTACTS HUB
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {selectedCountryCode} ACTIVE
                </span>
              </div>
              <p className="text-[11px] font-mono text-slate-400">
                Real <span className="text-emerald-300 font-bold">tel:</span> Dialer • Country Code Auto-Prefix • Contact Picker Sync
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Country Code + Direct Keypad Dial Bar */}
        <div className="px-5 py-3.5 bg-black/50 border-b border-white/10 flex flex-col sm:flex-row items-center gap-2">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Globe className="w-4 h-4 text-cyan-400 shrink-0 hidden sm:block" />
            <select
              value={selectedCountryCode}
              onChange={(e) => handleCountryCodeChange(e.target.value)}
              className="w-full sm:w-auto bg-slate-900 border border-cyan-500/40 rounded-xl px-3 py-2 text-xs font-mono text-cyan-300 outline-none focus:border-cyan-400"
              title="Select Country Code"
            >
              {COUNTRY_CODE_OPTIONS.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.flag} {c.code} ({c.country})
                </option>
              ))}
            </select>
          </div>

          <div className="relative flex-1 w-full">
            <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
            <input
              type="tel"
              value={directDialNumber}
              onChange={(e) => setDirectDialNumber(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleDirectDial();
              }}
              placeholder={`Enter number (auto-prefixes ${selectedCountryCode}, e.g. 9876543210)...`}
              className="w-full bg-slate-900/90 border border-slate-700/80 focus:border-emerald-400 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm font-mono tabular-nums text-white placeholder:text-slate-500 outline-none transition-all"
            />
          </div>

          <button
            onClick={handleDirectDial}
            disabled={!directDialNumber.trim()}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-mono font-bold text-xs flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.4)] transition-all cursor-pointer shrink-0"
          >
            <PhoneForwarded className="w-4 h-4" />
            <span>CALL NOW</span>
          </button>
        </div>

        {/* Search, Real Device Contact Sync & New Contact Bar */}
        <div className="px-5 py-3 flex flex-wrap items-center justify-between gap-2 border-b border-white/5">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search saved contacts..."
              className="w-full bg-slate-900/60 border border-slate-800 focus:border-cyan-400 rounded-xl pl-9 pr-4 py-1.5 text-xs font-mono text-white placeholder:text-slate-500 outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              ref={vcfInputRef}
              type="file"
              accept=".vcf,text/vcard"
              onChange={handleVcfUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={handleSyncDeviceContacts}
              className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/40 text-emerald-300 font-mono text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              title="Sync Real Contacts from Phone (Contact Picker API) or Import .vcf"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Sync Device Contacts</span>
            </button>

            <button
              type="button"
              onClick={() => vcfInputRef.current?.click()}
              className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-slate-300 font-mono text-xs flex items-center gap-1 transition-all cursor-pointer"
              title="Import .vcf vCard Contacts File"
            >
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">.VCF</span>
            </button>

            <button
              type="button"
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-200 font-mono text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{showAddForm ? "Close" : "Add Contact"}</span>
            </button>
          </div>
        </div>

        {/* Sync Feedback Banner */}
        {syncStatus && (
          <div className="mx-5 mt-3 p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-400/40 text-emerald-300 text-xs font-mono flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{syncStatus}</span>
          </div>
        )}

        {/* Add Contact Form */}
        <AnimatePresence>
          {showAddForm && (
            <motion.form
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              onSubmit={handleCreateContact}
              className="p-4 bg-slate-900/80 border-b border-cyan-500/30 flex flex-col gap-3 overflow-hidden"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-mono font-bold text-slate-300 block mb-1">
                    CONTACT NAME *
                  </label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Rahul Sharma, Mom, Boss"
                    className="w-full bg-black/60 border border-slate-700 focus:border-cyan-400 rounded-lg px-3 py-1.5 text-xs font-mono text-white outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono font-bold text-slate-300 block mb-1">
                    RELATIONSHIP / TAG
                  </label>
                  <input
                    type="text"
                    value={newRelationship}
                    onChange={(e) => setNewRelationship(e.target.value)}
                    placeholder="e.g. Family, Engineer, Friend"
                    className="w-full bg-black/60 border border-slate-700 focus:border-cyan-400 rounded-lg px-3 py-1.5 text-xs font-mono text-white outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2 mt-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-cyan-300">
                    PHONE NUMBERS (AUTO-PREFIXED WITH {selectedCountryCode})
                  </span>
                  {phones.length < 3 && (
                    <button
                      type="button"
                      onClick={handleAddPhoneField}
                      className="text-[10px] font-mono text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Number</span>
                    </button>
                  )}
                </div>

                {phones.map((phone, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <select
                      value={phone.label}
                      onChange={(e) => {
                        const newPhones = [...phones];
                        newPhones[idx].label = e.target.value as any;
                        setPhones(newPhones);
                      }}
                      className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-cyan-300 outline-none"
                    >
                      <option value="Mobile">Mobile</option>
                      <option value="Work">Work</option>
                      <option value="Home">Home</option>
                    </select>

                    <input
                      type="tel"
                      required={idx === 0}
                      value={phone.number}
                      onChange={(e) => {
                        const newPhones = [...phones];
                        newPhones[idx].number = e.target.value;
                        setPhones(newPhones);
                      }}
                      placeholder={`Enter ${phone.label} number (e.g. 9876543210 or ${selectedCountryCode}9876543210)`}
                      className="flex-1 bg-black/60 border border-slate-700 focus:border-cyan-400 rounded-lg px-3 py-1.5 text-xs font-mono text-white outline-none"
                    />

                    {phones.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setPhones(phones.filter((_, i) => i !== idx))}
                        className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1.5 rounded-lg bg-white/5 text-slate-300 text-xs font-mono hover:bg-white/10 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-bold text-xs cursor-pointer"
                >
                  Save Contact
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Contacts List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {filteredContacts.length === 0 ? (
            <div className="py-12 text-center text-slate-500 font-mono text-xs">
              No contacts found matching "{searchQuery}"
            </div>
          ) : (
            filteredContacts.map((contact) => (
              <div
                key={contact.id}
                className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-cyan-950 border border-cyan-400/40 flex items-center justify-center overflow-hidden shrink-0">
                    {contact.avatar ? (
                      <img
                        src={contact.avatar}
                        alt={contact.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-5 h-5 text-cyan-300" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-mono font-bold text-white">{contact.name}</h3>
                      {contact.relationship && (
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-white/5">
                          {contact.relationship}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-mono text-cyan-400/80">
                      {contact.numbers.map((n) => n.number).join(" • ")}
                    </span>
                  </div>
                </div>

                {/* Right: Direct Native Tel Call + WhatsApp Call Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  {contact.numbers.map((phone) => {
                    const formattedNum = deviceHardware.formatPhoneWithCountryCode(
                      phone.number,
                      selectedCountryCode
                    );
                    const waDigits = formattedNum.replace(/[^\d]/g, "");
                    return (
                      <div key={phone.id} className="flex items-center gap-1.5">
                        <a
                          href={`tel:${formattedNum}`}
                          target="_top"
                          onClick={() => {
                            onInitiateCall(contact.name, formattedNum, phone.label);
                            onClose();
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500 hover:text-slate-950 border border-emerald-500/40 text-emerald-300 transition-all cursor-pointer font-mono text-xs font-bold"
                          title={`Call ${contact.name} (${formattedNum})`}
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span className="tabular-nums">{formattedNum}</span>
                        </a>

                        <a
                          href={`https://wa.me/${waDigits}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-xl bg-emerald-950/60 hover:bg-emerald-800/60 border border-emerald-500/30 text-emerald-300 transition-all"
                          title={`WhatsApp Call / Message ${contact.name}`}
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    );
                  })}

                  <button
                    onClick={() => onDeleteContact(contact.id)}
                    className="p-2 text-slate-500 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors cursor-pointer"
                    title="Delete contact"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Voice Guidance */}
        <div className="px-5 py-3 border-t border-cyan-500/20 bg-slate-900/50 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-slate-400">
          <div className="flex items-center gap-1.5 text-cyan-300">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Voice: "Call Rahul" or "Call +91 9876543210" or "9876543210 par call lagao"</span>
          </div>
          <span className="text-emerald-400">Native OS Dialer + Live Call HUD</span>
        </div>
      </motion.div>
    </div>
  );
};
