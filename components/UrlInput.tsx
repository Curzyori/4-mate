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
  const [validationError, setValidationError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const config = getPlatformConfig(activePlatform);

  // Auto-detect platform from URL
  useEffect(() => {
    const detected = detectPlatform(url);
    if (detected && detected !== activePlatform) {
      onPlatformDetected(detected);
      setValidationError(null);
    }
  }, [url, activePlatform, onPlatformDetected]);

  // Clear validation error when URL changes
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
    if (validationError) {
      setValidationError(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) return;

    // Validate if URL matches active platform pattern
    const isUrlMatch = config.urlPattern.test(trimmed);
    if (!isUrlMatch) {
      setValidationError(
        `Link yang Anda masukkan salah atau tidak sesuai dengan platform ${config.name}. Silakan periksa kembali.`
      );
      return;
    }

    setValidationError(null);
    if (!isLoading) {
      onSubmit(trimmed);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrl(text);
        setValidationError(null);
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
      className="animate-fade-in-up mx-auto mt-8 w-full max-w-2xl px-4 sm:px-6"
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
          <div className="flex items-center pl-3 sm:pl-4 text-mute">
            <Search size={18} />
          </div>

          {/* Input field */}
          <input
            ref={inputRef}
            id="url-input"
            type="url"
            value={url}
            onChange={handleUrlChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={config.placeholder}
            className="flex-1 bg-transparent px-2.5 py-3 text-sm sm:text-base leading-[25.6px] tracking-[-0.16px] text-ink placeholder-mute-soft outline-none md:py-4"
            disabled={isLoading}
            autoComplete="off"
            spellCheck={false}
          />

          {/* Paste button (mobile friendly) */}
          {!url && (
            <button
              type="button"
              onClick={handlePaste}
              className="mr-1.5 sm:mr-2 rounded-sm border border-hairline px-2.5 py-1 sm:py-1.5 text-xs font-medium text-mute transition-colors hover:border-ink hover:text-ink shrink-0"
            >
              Paste
            </button>
          )}

          {/* Branded Icon (Right) */}
          <div className="hidden items-center pr-3 sm:flex shrink-0">
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
            className="mr-1 sm:mr-1.5 flex items-center gap-2 rounded-sm bg-primary px-3 sm:px-5 py-2 sm:py-3 text-sm font-medium text-on-primary transition-all duration-200 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 shrink-0"
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin shrink-0" />
                <span className="hidden sm:inline">Processing</span>
              </>
            ) : (
              <>
                <span className="hidden sm:inline">Download</span>
                <ArrowRight size={16} className="shrink-0" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Validation Error Warning */}
      {validationError && (
        <p className="mt-3 text-center text-xs sm:text-sm font-medium text-accent-red animate-slide-down px-2">
          {validationError}
        </p>
      )}

      {/* Format info */}
      <p className="mt-3 text-center text-xs text-mute-soft px-2">
        Output: {config.outputFormats.join(" / ")} • Paste a{" "}
        {config.name} URL above
      </p>
    </div>
  );
}
