"use client";

import React, { useState, useCallback } from "react";
import Hero from "@/components/Hero";
import PlatformTabs from "@/components/PlatformTabs";
import UrlInput from "@/components/UrlInput";
import ResultCard from "@/components/ResultCard";
import ErrorMessage from "@/components/ErrorMessage";
import Footer from "@/components/Footer";
import type { Platform } from "@/lib/platforms";

interface ResultData {
  platform: string;
  title?: string;
  artist?: string;
  thumbnail?: string;
  downloadUrl?: string;
  spotifyTrackUrl?: string;
  originalUrl?: string;
}

interface DownloadOption {
  format: string;
  quality?: string;
  label: string;
}

const YOUTUBE_OPTIONS: DownloadOption[] = [
  { format: "mp4", quality: "360", label: "MP4 360p" },
  { format: "mp4", quality: "720", label: "MP4 720p" },
  { format: "mp4", quality: "1080", label: "MP4 1080p" },
  { format: "mp3", quality: "128", label: "MP3 128kbps" },
  { format: "mp3", quality: "320", label: "MP3 320kbps" },
];

export default function Home() {
  const [activePlatform, setActivePlatform] = useState<Platform>("spotify");
  const [isLoading, setIsLoading] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [result, setResult] = useState<ResultData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePlatformDetected = useCallback((platform: Platform) => {
    setActivePlatform(platform);
  }, []);

  const handleReset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  // ── Spotify flow ──
  async function handleSpotify(url: string) {
    // Step 1: Get track data
    const trackRes = await fetch("/api/spotify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "track-data", url }),
    });
    const trackData = await trackRes.json();

    if (!trackRes.ok || !trackData.success) {
      throw new Error(trackData.error || "Failed to fetch track data");
    }

    setResult({
      platform: "spotify",
      title: trackData.track.title,
      artist: trackData.track.artist,
      thumbnail: trackData.track.coverUrl,
      spotifyTrackUrl: url,
    });
  }

  async function handleSpotifyConvert(url: string) {
    setIsConverting(true);
    try {
      const convertRes = await fetch("/api/spotify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "convert", urls: url }),
      });
      const convertData = await convertRes.json();

      if (!convertRes.ok || convertData.error) {
        throw new Error(convertData.error || "Conversion failed");
      }

      // Extract download URL from response
      let downloadUrl = "";
      if (convertData.url) {
        downloadUrl = convertData.url;
      } else if (convertData.audio) {
        downloadUrl = convertData.audio;
      } else if (typeof convertData === "object") {
        // Try to find any URL in the response
        const values = Object.values(convertData);
        const urlVal = values.find(
          (v) => typeof v === "string" && (v as string).startsWith("http")
        );
        if (urlVal) downloadUrl = urlVal as string;
      }

      if (downloadUrl) {
        setResult((prev) =>
          prev ? { ...prev, downloadUrl } : null
        );
      } else {
        throw new Error("Could not extract download link from conversion");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Conversion failed";
      setError(message);
    } finally {
      setIsConverting(false);
    }
  }

  // ── Instagram flow ──
  async function handleInstagram(url: string) {
    const res = await fetch("/api/instagram", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.error || "Failed to download Instagram reel");
    }

    setResult({
      platform: "instagram",
      title: data.title || "Instagram Reel",
      thumbnail: data.thumbnail,
      downloadUrl: data.downloadUrl,
    });
  }

  // ── TikTok flow ──
  async function handleTikTok(url: string) {
    const res = await fetch("/api/tiktok", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.error || "Failed to download TikTok video");
    }

    setResult({
      platform: "tiktok",
      title: data.title || "TikTok Video",
      artist: data.author,
      thumbnail: data.thumbnail,
      downloadUrl: data.downloadUrl,
    });
  }

  // ── YouTube flow ──
  async function handleYouTube(
    url: string,
    format = "mp4",
    quality = "720"
  ) {
    const res = await fetch("/api/youtube", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, format, quality }),
    });
    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.error || "Failed to download YouTube video");
    }

    setResult({
      platform: "youtube",
      title: data.filename || "YouTube Download",
      downloadUrl: data.downloadUrl,
      originalUrl: url,
    });
  }

  // ── Main submit handler ──
  const handleSubmit = async (url: string) => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      switch (activePlatform) {
        case "spotify":
          await handleSpotify(url);
          break;
        case "instagram":
          await handleInstagram(url);
          break;
        case "tiktok":
          await handleTikTok(url);
          break;
        case "youtube":
          await handleYouTube(url);
          break;
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Download handler (for result card) ──
  const handleDownload = async (format: string, quality?: string) => {
    if (result?.platform === "spotify" && result.spotifyTrackUrl) {
      await handleSpotifyConvert(result.spotifyTrackUrl);
    } else if (result?.platform === "youtube") {
      // Re-fetch with new quality
      setIsConverting(true);
      try {
        const res = await fetch("/api/youtube", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: result.originalUrl || result.downloadUrl,
            format,
            quality,
          }),
        });
        const data = await res.json();
        if (data.success && data.downloadUrl) {
          setResult((prev) =>
            prev ? { ...prev, downloadUrl: data.downloadUrl } : null
          );
        }
      } catch {
        setError("Failed to get download link");
      } finally {
        setIsConverting(false);
      }
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      {/* Main content */}
      <main className="flex-1">
        <Hero />

        <PlatformTabs
          activePlatform={activePlatform}
          onSelect={(p) => {
            setActivePlatform(p);
            handleReset();
          }}
        />

        <UrlInput
          activePlatform={activePlatform}
          onPlatformDetected={handlePlatformDetected}
          onSubmit={handleSubmit}
          isLoading={isLoading}
        />

        {/* Error */}
        {error && (
          <ErrorMessage
            message={error}
            onDismiss={() => setError(null)}
          />
        )}

        {/* Result */}
        {result && (
          <ResultCard
            platform={result.platform}
            title={result.title}
            artist={result.artist}
            thumbnail={result.thumbnail}
            downloadUrl={result.downloadUrl}
            downloadOptions={
              activePlatform === "youtube" ? YOUTUBE_OPTIONS : undefined
            }
            isConverting={isConverting}
            onDownload={handleDownload}
            onReset={handleReset}
          />
        )}

        {/* Feature cards */}
        {!result && !error && (
          <section
            className="animate-fade-in-up mx-auto mt-16 max-w-4xl px-6 pb-16"
            style={{ opacity: 0, animationDelay: "0.7s", animationFillMode: "forwards" }}
          >
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
              {[
                {
                  name: "Spotify",
                  desc: "MP3 Download",
                  color: "bg-[#1DB954]",
                  textColor: "text-white",
                },
                {
                  name: "Instagram",
                  desc: "Reels as MP4",
                  color: "bg-[#E4405F]",
                  textColor: "text-white",
                },
                {
                  name: "TikTok",
                  desc: "No Watermark",
                  color: "bg-primary",
                  textColor: "text-on-primary",
                },
                {
                  name: "YouTube",
                  desc: "MP3 & MP4",
                  color: "bg-[#FF0000]",
                  textColor: "text-white",
                },
              ].map((card) => (
                <div
                  key={card.name}
                  className={`group ${card.color} ${card.textColor} cursor-default rounded-md p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-level3 md:p-8`}
                >
                  <p className="text-[11px] font-medium uppercase tracking-[0.6px] opacity-70">
                    {card.desc}
                  </p>
                  <h3 className="mt-2 text-xl font-medium md:text-2xl">
                    {card.name}
                  </h3>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
