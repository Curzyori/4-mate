import { NextRequest } from "next/server";
import axios from "axios";
import * as cheerio from "cheerio";

export const dynamic = "force-dynamic";

// Standard headers to avoid blocking
const HEADERS = {
  "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Referer": "https://www.y2mate.com/",
  "X-Requested-With": "XMLHttpRequest",
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, format = "mp4", quality = "720" } = body;

    if (!url) {
      return Response.json({ error: "YouTube URL is required" }, { status: 400 });
    }

    // Normalize URL and Extract video ID
    const idMatch = url.match(/(?:v=|shorts\/|youtu\.be\/|embed\/|v\/|watch\?v=)([^#\&\?]{11})/);
    const videoId = idMatch ? idMatch[1] : null;

    if (!videoId) {
      return Response.json({ error: "Invalid YouTube URL" }, { status: 400 });
    }

    const isAudioOnly = format === "mp3";
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

    // Step 1: Analyze the video
    const analyzeUrl = "https://www.y2mate.com/mates/en/analyze/ajax";
    const analyzeRes = await axios.post(
      analyzeUrl,
      new URLSearchParams({
        url: videoUrl,
        q_auto: "1",
        ajax: "1",
      }).toString(),
      { headers: HEADERS }
    );

    if (!analyzeRes.data || analyzeRes.data.status !== "success") {
      throw new Error("Y2Mate analysis failed");
    }

    const $ = cheerio.load(analyzeRes.data.result);
    const title = $("b").first().text() || "YouTube Download";
    
    let kValue = "";
    
    // Step 2: Extract conversion keys from the HTML
    if (isAudioOnly) {
      // Find the best MP3 key
      // Usually there is a button with data-ftype="mp3"
      const mp3Btn = $('button[data-ftype="mp3"]').first();
      if (mp3Btn.length) {
        // The k value is in the onclick attribute: analyze_res('v_id', 'k_value')
        const onclick = mp3Btn.attr("onclick") || "";
        const matches = onclick.match(/'([^']+)'/g);
        if (matches && matches.length >= 2) {
          kValue = matches[1].replace(/'/g, "");
        }
      }
    } else {
      // Find the MP4 key for the specific quality
      $(`button[data-ftype="mp4"]`).each((_, el) => {
        const qAttr = $(el).attr("data-fquality") || "";
        if (qAttr === quality) {
          const onclick = $(el).attr("onclick") || "";
          const matches = onclick.match(/'([^']+)'/g);
          if (matches && matches.length >= 2) {
            kValue = matches[1].replace(/'/g, "");
            return false;
          }
        }
      });

      // Fallback to first available MP4 if requested quality not found
      if (!kValue) {
        $(`button[data-ftype="mp4"]`).each((_, el) => {
          const onclick = $(el).attr("onclick") || "";
          const matches = onclick.match(/'([^']+)'/g);
          if (matches && matches.length >= 2) {
            kValue = matches[1].replace(/'/g, "");
            return false;
          }
        });
      }
    }

    if (!kValue) {
      throw new Error("Could not find conversion key for the requested format/quality");
    }

    // Step 3: Convert the video
    const convertUrl = "https://www.y2mate.com/mates/convertV2/index";
    const convertRes = await axios.post(
      convertUrl,
      new URLSearchParams({
        vid: videoId,
        k: kValue,
      }).toString(),
      { headers: HEADERS }
    );

    if (!convertRes.data || convertRes.data.status !== "ok") {
      throw new Error("Y2Mate conversion failed");
    }

    return Response.json({
      success: true,
      downloadUrl: convertRes.data.dlink,
      filename: title,
      platform: "youtube",
      format: isAudioOnly ? "mp3" : "mp4",
      quality: isAudioOnly ? "128" : quality, // Y2mate mp3 is usually 128
    });

  } catch (error: unknown) {
    console.error("YouTube Scraping Error:", error);
    const message = error instanceof Error ? error.message : "Scraping failed";
    
    return Response.json(
      { error: "Failed to process YouTube request", details: message },
      { status: 500 }
    );
  }
}
