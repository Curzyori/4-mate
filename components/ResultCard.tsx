"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  Download,
  Music,
  Video,
  Loader2,
  CheckCircle,
  ExternalLink,
  ChevronDown,
} from "lucide-react";

interface DownloadOption {
  format: string;
  quality?: string;
  label: string;
}

interface ResultCardProps {
  platform: string;
  title?: string;
  artist?: string;
  thumbnail?: string;
  downloadUrl?: string;
  downloadOptions?: DownloadOption[];
  isConverting?: boolean;
  onDownload: (format: string, quality?: string) => void;
  onReset: () => void;
}

export default function ResultCard({
  platform,
  title,
  artist,
  thumbnail,
  downloadUrl,
  downloadOptions,
  isConverting,
  onDownload,
  onReset,
}: ResultCardProps) {
  const [selectedFormat, setSelectedFormat] = useState(
    platform === "spotify" ? "mp3" : (downloadOptions?.[0]?.format || "mp4")
  );
  const [selectedQuality, setSelectedQuality] = useState(
    downloadOptions?.[0]?.quality || (platform === "spotify" ? "320" : "720")
  );
  const [showOptions, setShowOptions] = useState(false);

  const isVideo = platform !== "spotify";
  const FormatIcon = isVideo ? Video : Music;

  return (
    <div
      id="result-card"
      className="animate-slide-down mx-auto mt-8 w-full max-w-2xl px-6"
    >
      <div className="overflow-hidden rounded-md border border-hairline bg-canvas shadow-level2">
        {/* Thumbnail + Info */}
        <div className="flex flex-col sm:flex-row">
          {/* Thumbnail */}
          {thumbnail ? (
            <div className="relative h-48 w-full shrink-0 bg-gray-100 sm:h-auto sm:w-48">
              <img
                src={thumbnail}
                alt={title || "Media thumbnail"}
                className="h-full w-full object-cover"
              />
              <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded-sm bg-primary/80 px-2 py-1 text-[11px] font-medium text-on-primary backdrop-blur-sm">
                <FormatIcon size={12} />
                {selectedFormat.toUpperCase()}
              </div>
            </div>
          ) : (
            <div className="flex h-32 w-full shrink-0 items-center justify-center bg-gray-50 sm:h-auto sm:w-48">
              <FormatIcon size={40} className="text-hairline" />
            </div>
          )}

          {/* Info */}
          <div className="flex flex-1 flex-col justify-between p-5">
            <div>
              <div className="mb-1 flex items-center gap-2">
                <p className="text-[12px] font-medium uppercase tracking-[0.6px] text-mute">
                  {platform}
                </p>
                <div className="h-3 w-px bg-hairline" />
                <div className="relative h-4 w-4 opacity-50">
                  <Image
                    src="/logo.png"
                    alt="4 Mate"
                    fill
                    className="object-contain"
                  />
                </div>
              </div>
              <h3 className="text-lg font-medium leading-[1.3] tracking-tight text-ink line-clamp-2">
                {title || "Ready to download"}
              </h3>
              {artist && (
                <p className="mt-1 text-sm text-body-mid">{artist}</p>
              )}
            </div>

            {/* Quality selector for YouTube */}
            {platform === "youtube" && downloadOptions && downloadOptions.length > 1 && (
              <div className="mt-4">
                <button
                  onClick={() => setShowOptions(!showOptions)}
                  className="flex items-center gap-1 text-sm font-medium text-mute transition-colors hover:text-ink"
                >
                  Quality: {selectedQuality}
                  {selectedFormat === "mp4" ? "p" : "kbps"}
                  <ChevronDown
                    size={14}
                    className={`transition-transform ${showOptions ? "rotate-180" : ""}`}
                  />
                </button>

                {showOptions && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {downloadOptions.map((opt) => (
                      <button
                        key={`${opt.format}-${opt.quality}`}
                        onClick={() => {
                          setSelectedFormat(opt.format);
                          setSelectedQuality(opt.quality || "");
                          setShowOptions(false);
                        }}
                        className={`rounded-sm border px-3 py-1.5 text-xs font-medium transition-all ${
                          selectedFormat === opt.format &&
                          selectedQuality === opt.quality
                            ? "border-ink bg-primary text-on-primary"
                            : "border-hairline text-mute hover:border-ink hover:text-ink"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="mt-4 flex items-center gap-3">
              {downloadUrl ? (
                <a
                  id="download-link"
                  href={`/api/proxy-download?url=${encodeURIComponent(downloadUrl)}&filename=${encodeURIComponent(`${title || platform}.${selectedFormat}`)}`}
                  download={`${title || platform}.${selectedFormat}`}
                  className="inline-flex items-center gap-2 rounded-sm bg-primary px-5 py-2.5 text-sm font-medium text-on-primary transition-all hover:opacity-90"
                >
                  <Download size={16} />
                  Download {selectedFormat.toUpperCase()}
                </a>
              ) : (
                <button
                  id="convert-button"
                  onClick={() => onDownload(selectedFormat, selectedQuality)}
                  disabled={isConverting}
                  className="inline-flex items-center gap-2 rounded-sm bg-primary px-5 py-2.5 text-sm font-medium text-on-primary transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isConverting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Converting...
                    </>
                  ) : (
                    <>
                      <Download size={16} />
                      Get Download Link
                    </>
                  )}
                </button>
              )}

              <button
                id="reset-button"
                onClick={onReset}
                className="rounded-sm border border-hairline px-4 py-2.5 text-sm font-medium text-mute transition-all hover:border-ink hover:text-ink"
              >
                New
              </button>
            </div>
          </div>
        </div>

        {/* Success bar */}
        {downloadUrl && (
          <div className="flex items-center gap-2 border-t border-hairline bg-accent-green/5 px-5 py-2.5">
            <CheckCircle size={14} className="text-accent-green" />
            <span className="text-xs font-medium text-accent-green">
              Download link ready — click to save
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
