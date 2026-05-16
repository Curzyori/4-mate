import { NextRequest } from "next/server";
import axios from "axios";

export const dynamic = "force-dynamic";

// List of Y2Mate mirrors to try in order
const Y2MATE_MIRRORS = [
  "https://www.y2mate.com",
  "https://en1.y2mate.is",
  "https://y2mate.nu",
  "https://y2mate.bz"
];

// Helper to extract YouTube Video ID
function extractVideoId(url: string) {
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

async function tryY2Mate(mirror: string, url: string, videoId: string, format: string, quality: string) {
  const analyzeUrl = `${mirror}/mates/analyzeV2/ajax`;
  const analyzeFormData = new URLSearchParams();
  analyzeFormData.append("k_query", url);
  analyzeFormData.append("k_page", "home");
  analyzeFormData.append("hl", "en");
  analyzeFormData.append("q_auto", "0");

  const analyzeRes = await axios.post(analyzeUrl, analyzeFormData.toString(), {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      "Referer": `${mirror}/en/youtube/${videoId}`,
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "X-Requested-With": "XMLHttpRequest"
    },
    timeout: 5000 // 5 seconds timeout for each mirror
  });

  const data = analyzeRes.data;
  if (!data || data.status !== "ok" || !data.links) {
    throw new Error(data.msg || "Failed to analyze video");
  }

  // Find best 'k'
  let selectedK = "";
  let selectedQualityLabel = "";

  if (format === "mp3") {
    const mp3Links = data.links.mp3 || {};
    const bestMp3 = mp3Links["mp3128"] || Object.values(mp3Links)[0];
    if (bestMp3) {
      selectedK = (bestMp3 as any).k;
      selectedQualityLabel = (bestMp3 as any).q;
    }
  } else {
    const mp4Links = data.links.mp4 || {};
    const targetQualities = [quality, "720", "360", "480", "1080"];
    for (const q of targetQualities) {
      const key = Object.keys(mp4Links).find(k => (mp4Links[k] as any).q.includes(q));
      if (key) {
        selectedK = (mp4Links[key] as any).k;
        selectedQualityLabel = (mp4Links[key] as any).q;
        break;
      }
    }
    if (!selectedK) {
      const firstMp4 = Object.values(mp4Links)[0];
      if (firstMp4) {
        selectedK = (firstMp4 as any).k;
        selectedQualityLabel = (firstMp4 as any).q;
      }
    }
  }

  if (!selectedK) throw new Error("Format not available");

  // Step 2: Convert
  const convertUrl = `${mirror}/mates/convertV2/index`;
  const convertFormData = new URLSearchParams();
  convertFormData.append("vid", videoId);
  convertFormData.append("k", selectedK);

  const convertRes = await axios.post(convertUrl, convertFormData.toString(), {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      "Referer": `${mirror}/en/youtube/${videoId}`,
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "X-Requested-With": "XMLHttpRequest"
    },
    timeout: 8000
  });

  const convertData = convertRes.data;
  if (!convertData || convertData.status !== "ok" || !convertData.dlink) {
    throw new Error(convertData.msg || "Failed to get download link");
  }

  return {
    downloadUrl: convertData.dlink,
    title: data.title || "YouTube Video",
    quality: selectedQualityLabel
  };
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

    // Try mirrors one by one
    let lastError: any = null;
    for (const mirror of Y2MATE_MIRRORS) {
      try {
        console.log(`Trying YouTube download via mirror: ${mirror}`);
        const result = await tryY2Mate(mirror, url, videoId, format, quality);
        
        return Response.json({
          success: true,
          downloadUrl: result.downloadUrl,
          filename: result.title,
          platform: "youtube",
          format: format,
          quality: result.quality,
          metadata: {
            title: result.title,
            thumbnail: `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
            videoId: videoId,
            mirrorUsed: mirror
          }
        });
      } catch (err: any) {
        console.error(`Mirror ${mirror} failed:`, err.message);
        lastError = err;
        // Continue to next mirror if this one fails
        continue;
      }
    }

    // If all mirrors fail
    throw lastError || new Error("All download mirrors failed");

  } catch (error: any) {
    console.error("YouTube Route Error:", error.message);
    
    let errorMessage = error.message || "Failed to process YouTube request";
    if (error.code === 'ENOTFOUND') {
      errorMessage = "Connection error: The download server is unreachable. YouTube might be blocking our requests.";
    }

    return Response.json(
      { 
        error: errorMessage, 
        details: "We tried multiple sources, but all are currently unavailable. This often happens due to temporary IP blocks by YouTube. Please try again later." 
      },
      { status: 500 }
    );
  }
}
