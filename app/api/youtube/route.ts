import { NextRequest } from "next/server";
import ytdl from "@distube/ytdl-core";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, format = "mp4", quality = "720" } = body;

    if (!url) {
      return Response.json({ error: "YouTube URL is required" }, { status: 400 });
    }

    // Validate YouTube URL
    if (!ytdl.validateURL(url)) {
      return Response.json({ error: "Invalid YouTube URL" }, { status: 400 });
    }

    // Step 1: Fetch Video Info
    const info = await ytdl.getInfo(url);
    const title = info.videoDetails.title || "YouTube Download";
    const videoId = info.videoDetails.videoId;

    const isAudioOnly = format === "mp3";
    let downloadUrl = "";
    let selectedQuality = "";

    // Step 2: Choose Format
    if (isAudioOnly) {
      // Find the best audio format
      const audioFormat = ytdl.chooseFormat(info.formats, { 
        quality: 'highestaudio',
        filter: 'audioonly'
      });
      downloadUrl = audioFormat.url;
      selectedQuality = audioFormat.audioBitrate?.toString() || "128";
    } else {
      // Find the best video+audio format (usually 360p or 720p if available as combined)
      // If combined 720p is not available, ytdl.chooseFormat will try to find the best alternative
      try {
        const videoFormat = ytdl.chooseFormat(info.formats, {
          quality: quality === "1080" ? "highestvideo" : (quality === "720" ? "highestvideo" : "highestvideo"),
          filter: (f) => f.hasVideo && f.hasAudio && (f.container === "mp4")
        });
        downloadUrl = videoFormat.url;
        selectedQuality = videoFormat.qualityLabel || quality;
      } catch (e) {
        // Fallback to any combined format if MP4 not found
        const fallbackFormat = ytdl.chooseFormat(info.formats, {
          quality: 'highest',
          filter: 'audioandvideo'
        });
        downloadUrl = fallbackFormat.url;
        selectedQuality = fallbackFormat.qualityLabel || "360p";
      }
    }

    if (!downloadUrl) {
      throw new Error("Could not find a suitable download link");
    }

    return Response.json({
      success: true,
      downloadUrl: downloadUrl,
      filename: title,
      platform: "youtube",
      format: isAudioOnly ? "mp3" : "mp4",
      quality: selectedQuality,
      metadata: {
        title: title,
        author: info.videoDetails.author.name,
        thumbnail: info.videoDetails.thumbnails[0]?.url,
        duration: info.videoDetails.lengthSeconds,
        views: info.videoDetails.viewCount
      }
    });

  } catch (error: unknown) {
    console.error("YouTube Download Error:", error);
    const message = error instanceof Error ? error.message : "Failed to process YouTube request";
    
    return Response.json(
      { error: message, details: "Please try again or use a different video" },
      { status: 500 }
    );
  }
}
