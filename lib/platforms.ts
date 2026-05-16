export type Platform = "spotify" | "instagram" | "tiktok" | "youtube";

export interface PlatformConfig {
  id: Platform;
  name: string;
  color: string;
  bgClass: string;
  icon: string;
  placeholder: string;
  outputFormats: string[];
  urlPattern: RegExp;
}

export const PLATFORMS: PlatformConfig[] = [
  {
    id: "spotify",
    name: "Spotify",
    color: "#1DB954",
    bgClass: "bg-[#1DB954]",
    icon: "spotify",
    placeholder: "https://open.spotify.com/track/...",
    outputFormats: ["MP3"],
    urlPattern: /^(https?:\/\/)?(open\.)?spotify\.com\/(track|album|playlist)\/.+$/i,
  },
  {
    id: "instagram",
    name: "Instagram",
    color: "#E4405F",
    bgClass: "bg-[#E4405F]",
    icon: "instagram",
    placeholder: "https://www.instagram.com/reel/...",
    outputFormats: ["MP4"],
    urlPattern: /^(https?:\/\/)?(www\.)?instagram\.com\/(reel|p)\/.+$/i,
  },
  {
    id: "tiktok",
    name: "TikTok",
    color: "#080808",
    bgClass: "bg-primary",
    icon: "tiktok",
    placeholder: "https://www.tiktok.com/@user/video/...",
    outputFormats: ["MP4"],
    urlPattern: /^(https?:\/\/)?(www\.|vm\.|vt\.)?tiktok\.com\/.+$/i,
  },
  {
    id: "youtube",
    name: "YouTube",
    color: "#FF0000",
    bgClass: "bg-[#FF0000]",
    icon: "youtube",
    placeholder: "https://www.youtube.com/watch?v=...",
    outputFormats: ["MP3", "MP4"],
    urlPattern:
      /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|shorts\/)|youtu\.be\/).+$/i,
  },
];

export function detectPlatform(url: string): Platform | null {
  if (!url) return null;
  const trimmed = url.trim();
  for (const platform of PLATFORMS) {
    if (platform.urlPattern.test(trimmed)) {
      return platform.id;
    }
  }
  return null;
}

export function getPlatformConfig(id: Platform): PlatformConfig {
  return PLATFORMS.find((p) => p.id === id)!;
}
