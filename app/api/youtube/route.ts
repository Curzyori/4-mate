import { NextRequest } from "next/server";
import axios from "axios";

export const dynamic = "force-dynamic";

// Helper to extract YouTube Video ID
function extractVideoId(url: string) {
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, format = "mp4", quality = "720" } = body;

    if (!url) {
      return Response.json({ error: "YouTube URL is required" }, { status: 400 });
    }

    const videoId = extractVideoId(url);
    if (!videoId) {
      return Response.json({ error: "Invalid YouTube URL" }, { status: 400 });
    }

    // Step 1: Analyze the video using y2mate API
    // We use a mirror if possible, or the main site
    const analyzeUrl = "https://www.y2mate.com/mates/analyzeV2/ajax";
    const analyzeFormData = new URLSearchParams();
    analyzeFormData.append("k_query", url);
    analyzeFormData.append("k_page", "home");
    analyzeFormData.append("hl", "en");
    analyzeFormData.append("q_auto", "0");

    const analyzeRes = await axios.post(analyzeUrl, analyzeFormData.toString(), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "Referer": "https://www.y2mate.com/en/youtube/" + videoId,
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "X-Requested-With": "XMLHttpRequest"
      }
    });

    const data = analyzeRes.data;
    if (!data || data.status !== "ok" || !data.links) {
      throw new Error(data.msg || "Failed to analyze video. YouTube might be blocking the request.");
    }

    const title = data.title || "YouTube Video";
    const thumbnail = `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`;

    // Step 2: Find the best matching 'k' token for the requested quality/format
    let selectedK = "";
    let selectedQualityLabel = "";

    if (format === "mp3") {
      // Find MP3
      const mp3Links = data.links.mp3 || {};
      // Try to find 128kbps or similar
      const bestMp3 = mp3Links["mp3128"] || Object.values(mp3Links)[0];
      if (bestMp3) {
        selectedK = (bestMp3 as any).k;
        selectedQualityLabel = (bestMp3 as any).q;
      }
    } else {
      // Find MP4
      const mp4Links = data.links.mp4 || {};
      
      // Try to match requested quality (e.g. 720, 1080)
      const targetQualities = [quality, "720", "360", "480", "1080"];
      for (const q of targetQualities) {
        // Find key that contains the quality string
        const key = Object.keys(mp4Links).find(k => (mp4Links[k] as any).q.includes(q));
        if (key) {
          selectedK = (mp4Links[key] as any).k;
          selectedQualityLabel = (mp4Links[key] as any).q;
          break;
        }
      }

      // Fallback to first available mp4
      if (!selectedK) {
        const firstMp4 = Object.values(mp4Links)[0];
        if (firstMp4) {
          selectedK = (firstMp4 as any).k;
          selectedQualityLabel = (firstMp4 as any).q;
        }
      }
    }

    if (!selectedK) {
      throw new Error("Requested format/quality not available");
    }

    // Step 3: Convert the video to get the download link
    const convertUrl = "https://www.y2mate.com/mates/convertV2/index";
    const convertFormData = new URLSearchParams();
    convertFormData.append("vid", videoId);
    convertFormData.append("k", selectedK);

    const convertRes = await axios.post(convertUrl, convertFormData.toString(), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "Referer": "https://www.y2mate.com/en/youtube/" + videoId,
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "X-Requested-With": "XMLHttpRequest"
      }
    });

    const convertData = convertRes.data;
    if (!convertData || convertData.status !== "ok" || !convertData.dlink) {
      throw new Error(convertData.msg || "Failed to get download link");
    }

    return Response.json({
      success: true,
      downloadUrl: convertData.dlink,
      filename: title,
      platform: "youtube",
      format: format,
      quality: selectedQualityLabel,
      metadata: {
        title: title,
        thumbnail: thumbnail,
        videoId: videoId
      }
    });

  } catch (error: any) {
    console.error("YouTube Route Error:", error.message);
    
    // Fallback error message
    let errorMessage = "Failed to process YouTube request";
    if (error.response?.data?.msg) errorMessage = error.response.data.msg;
    else if (error.message) errorMessage = error.message;

    return Response.json(
      { 
        error: errorMessage, 
        details: "If the error persists, YouTube might be blocking our requests. Please try a different video or wait a moment." 
      },
      { status: 500 }
    );
  }
}
