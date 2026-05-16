import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, format = "mp4", quality = "720" } = body;

    if (!url) {
      return Response.json(
        { error: "YouTube URL is required" },
        { status: 400 }
      );
    }

    // Validate YouTube URL
    const ytRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|shorts\/)|youtu\.be\/).+$/i;
    if (!ytRegex.test(url)) {
      return Response.json(
        { error: "Please provide a valid YouTube URL" },
        { status: 400 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const y2mate = require('y2mate-dl');
    
    const isAudioOnly = format === "mp3";
    let data;

    if (isAudioOnly) {
      data = await y2mate.ytmp3(url);
    } else {
      if (quality === "1080") {
        try { data = await y2mate.yt1080(url); } catch { data = await y2mate.yt720(url); }
      }
      else if (quality === "720") data = await y2mate.yt720(url);
      else if (quality === "480") data = await y2mate.yt480(url);
      else if (quality === "360") data = await y2mate.yt360(url);
      else data = await y2mate.yt720(url); // Default
    }

    if (data && data.status) {
      // Return the URL directly. Do NOT return the buffer to save bandwidth/memory
      const downloadUrl = isAudioOnly ? data.mp3 : data.url;
      
      if (!downloadUrl) {
        return Response.json(
          { error: "Failed to get download link from Y2Mate" },
          { status: 422 }
        );
      }
      
      return Response.json({
        success: true,
        downloadUrl,
        title: data.title || "youtube_download",
        platform: "youtube",
        format: isAudioOnly ? "mp3" : "mp4",
        quality: isAudioOnly ? "320" : quality,
        // Exclude the buffer from the response intentionally
      });
    }

    return Response.json(
      { error: "Unexpected response from Y2Mate service" },
      { status: 422 }
    );
  } catch (error: unknown) {
    console.error("YouTube API Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json(
      { error: "Failed to process YouTube request", details: message },
      { status: 500 }
    );
  }
}
