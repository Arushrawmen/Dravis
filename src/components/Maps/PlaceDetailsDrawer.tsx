/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Google Maps Place Details Drawer with Full Contact Information,
 * Website, Hours, and High-Resolution Photo Gallery.
 */

import React from "react";
import { motion } from "motion/react";
import {
  X,
  MapPin,
  Globe,
  Phone,
  Clock,
  Star,
  ExternalLink,
  Copy,
  Check,
  Maximize2,
  Navigation,
  Share2,
} from "lucide-react";
import { PlacePhotoItem } from "./PhotoZoomModal";

export interface PlaceDetailedInfo {
  id: string;
  title: string;
  category?: string;
  rating?: number;
  reviewCount?: number;
  description: string;
  address: string;
  phone?: string;
  website?: string;
  openingHours?: string;
  photos: PlacePhotoItem[];
  lat: number;
  lng: number;
}

interface PlaceDetailsDrawerProps {
  place: PlaceDetailedInfo | null;
  onClose: () => void;
  onOpenPhotoZoom: (photo: PlacePhotoItem) => void;
  onNavigateTo?: (lat: number, lng: number) => void;
}

export const PlaceDetailsDrawer: React.FC<PlaceDetailsDrawerProps> = ({
  place,
  onClose,
  onOpenPhotoZoom,
  onNavigateTo,
}) => {
  const [copiedField, setCopiedField] = React.useState<string | null>(null);

  if (!place) return null;

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <motion.aside
      initial={{ x: 380, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 380, opacity: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="absolute top-14 right-3 bottom-3 w-80 sm:w-96 bg-slate-900/90 border border-cyan-500/30 rounded-2xl backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.6)] flex flex-col z-30 overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-start justify-between gap-3 bg-slate-950/60">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 text-[10px] font-mono font-bold uppercase tracking-wider">
              {place.category || "Landmark"}
            </span>
            {place.rating && (
              <span className="flex items-center gap-1 text-[11px] font-mono text-amber-300">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span>{place.rating.toFixed(1)}</span>
                {place.reviewCount && (
                  <span className="text-slate-400">({place.reviewCount.toLocaleString()})</span>
                )}
              </span>
            )}
          </div>
          <h2 className="text-base font-bold text-white leading-tight truncate">{place.title}</h2>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs font-sans">
        {/* Photos Carousel / Grid with Zoom Trigger */}
        {place.photos && place.photos.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono font-bold text-cyan-400 uppercase tracking-wider">
                High-Resolution Photos ({place.photos.length})
              </span>
              <span className="text-[10px] font-mono text-slate-400">Click to Zoom In</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {place.photos.slice(0, 4).map((photo) => (
                <div
                  key={photo.id}
                  onClick={() => onOpenPhotoZoom(photo)}
                  className="group relative h-24 rounded-xl overflow-hidden border border-white/10 bg-black cursor-pointer shadow-sm hover:border-cyan-400/50 transition-all"
                >
                  <img
                    src={photo.url}
                    alt={photo.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-1.5">
                    <span className="text-[10px] font-mono text-white truncate max-w-[80%]">
                      {photo.title}
                    </span>
                    <div className="p-1 rounded bg-cyan-400 text-slate-950 shadow">
                      <Maximize2 className="w-3 h-3" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {place.photos.length > 0 && (
              <button
                type="button"
                onClick={() => onOpenPhotoZoom(place.photos[0])}
                className="w-full mt-2 py-1.5 px-3 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/30 text-cyan-300 font-mono text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Open Photo Lightbox & Wheel Zoom</span>
              </button>
            )}
          </div>
        )}

        {/* About Section */}
        <div>
          <h3 className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1">
            About This Place
          </h3>
          <p className="text-slate-200 leading-relaxed text-xs">{place.description}</p>
        </div>

        {/* Contact & Essential Info */}
        <div className="space-y-2.5 pt-2 border-t border-white/10">
          <h3 className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1">
            Contact & Location Details
          </h3>

          {/* Address */}
          <div className="flex items-start gap-2.5 p-2 rounded-xl bg-white/5 border border-white/5">
            <MapPin className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <span className="text-[10px] text-slate-400 font-mono block">Address</span>
              <p className="text-white text-xs leading-tight">{place.address}</p>
            </div>
            <button
              type="button"
              onClick={() => handleCopy(place.address, "address")}
              title="Copy Address"
              className="p-1 text-slate-400 hover:text-white transition-colors"
            >
              {copiedField === "address" ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          {/* Phone / Mobile */}
          {place.phone && (
            <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white/5 border border-white/5">
              <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-[10px] text-slate-400 font-mono block">Mobile / Phone</span>
                <a
                  href={`tel:${place.phone}`}
                  className="text-emerald-300 hover:underline font-mono text-xs font-bold"
                >
                  {place.phone}
                </a>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(place.phone!, "phone")}
                title="Copy Number"
                className="p-1 text-slate-400 hover:text-white transition-colors"
              >
                {copiedField === "phone" ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          )}

          {/* Website */}
          {place.website && (
            <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white/5 border border-white/5">
              <Globe className="w-4 h-4 text-blue-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-[10px] text-slate-400 font-mono block">Official Website</span>
                <a
                  href={place.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-300 hover:underline font-mono text-xs truncate flex items-center gap-1"
                >
                  <span className="truncate">{place.website.replace(/^https?:\/\//, "")}</span>
                  <ExternalLink className="w-3 h-3 shrink-0" />
                </a>
              </div>
            </div>
          )}

          {/* Opening Hours */}
          {place.openingHours && (
            <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white/5 border border-white/5">
              <Clock className="w-4 h-4 text-amber-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-[10px] text-slate-400 font-mono block">Opening Hours</span>
                <p className="text-amber-200 text-xs font-mono">{place.openingHours}</p>
              </div>
            </div>
          )}
        </div>

        {/* Action Button: Center Map */}
        {onNavigateTo && (
          <div className="pt-2">
            <button
              type="button"
              onClick={() => onNavigateTo(place.lat, place.lng)}
              className="w-full py-2 px-3 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-[0_0_15px_rgba(34,211,238,0.3)] cursor-pointer"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Center & View on Map</span>
            </button>
          </div>
        )}
      </div>
    </motion.aside>
  );
};
