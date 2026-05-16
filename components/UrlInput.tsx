"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Search, Loader2, ArrowRight } from "lucide-react";
import type { Platform } from "@/lib/platforms";
import { detectPlatform, getPlatformConfig } from "@/lib/platforms";

interface UrlInputProps {
  activePlatform: Platform;
  onPlatformDetected: (platform: Platform) => void;
  onSubmit: (url: string) => void;
  isLoading: boolean;
}

export default function UrlInput({
  activePlatform,
  onPlatformDetected,
  onSubmit,
  isLoading,
}: UrlInputProps) {
  const [url, setUrl] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const config = getPlatformConfig(activePlatform);

  // Auto-detect platform from URL
  useEffect(() => {
    const detected = detectPlatform(url);
    if (detected && detected !== activePlatform) {
      onPlatformDetected(detected);
    }
  }, [url, activePlatform, onPlatformDetected]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim() && !isLoading) {
      onSubmit(url.trim());
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrl(text);
        const detected = detectPlatform(text);
        if (detected) {
          onPlatformDetected(detected);
        }
      }
    } catch {
      // Clipboard API not available
    }
  };

  return (
    <div
      className="animate-fade-in-up mx-auto mt-8 w-full max-w-2xl px-6"
      style={{ opacity: 0, animationDelay: "0.5s", animationFillMode: "forwards" }}
    >
      <form onSubmit={handleSubmit} className="relative">
        <div
          className={`relative flex items-center overflow-hidden rounded-md border bg-canvas transition-all duration-200 ${
            isFocused
              ? "border-ink shadow-level2"
              : "border-hairline shadow-sm hover:border-mute-soft"
          }`}
        >
          {/* Search icon */}
          <div className="flex items-center pl-4 text-mute">
            <Search size={18} />
          </div>

          {/* Input field */}
          <input
            ref={inputRef}
            id="url-input"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={config.placeholder}
            className="flex-1 bg-transparent px-3 py-3.5 text-base leading-[25.6px] tracking-[-0.16px] text-ink placeholder-mute-soft outline-none md:py-4"
            disabled={isLoading}
            autoComplete="off"
            spellCheck={false}
          />

          {/* Paste button (mobile friendly) */}
          {!url && (
            <button
              type="button"
              onClick={handlePaste}
              className="mr-2 rounded-sm border border-hairline px-3 py-1.5 text-xs font-medium text-mute transition-colors hover:border-ink hover:text-ink"
            >
              Paste
            </button>
          )}

          {/* Branded Icon (Right) */}
          <div className="hidden items-center pr-3 sm:flex">
            <div className="relative h-5 w-5 opacity-40 transition-opacity hover:opacity-100">
              <Image
                src="/logo.png"
                alt="4 Mate"
                fill
                className="object-contain"
              />
            </div>
          </div>

          {/* Submit button */}
          <button
            id="download-button"
            type="submit"
            disabled={!url.trim() || isLoading}
            className="mr-1.5 flex items-center gap-2 rounded-sm bg-primary px-4 py-2.5 text-sm font-medium text-on-primary transition-all duration-200 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 md:px-5 md:py-3"
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span className="hidden sm:inline">Processing</span>
              </>
            ) : (
              <>
                <span className="hidden sm:inline">Download</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Format info */}
      <p className="mt-3 text-center text-xs text-mute-soft">
        Output: {config.outputFormats.join(" / ")} • Paste a{" "}
        {config.name} URL above
      </p>
    </div>
  );
}
