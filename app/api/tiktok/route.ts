import { NextRequest } from "next/server";
import axios from "axios";

export const dynamic = "force-dynamic";

const TIKWM_API_URL = process.env.TIKTOK_API_URL;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url) {
      return Response.json(
        { error: "TikTok URL is required" },
        { status: 400 }
      );
    }

    // Validate TikTok URL
    const tiktokRegex =
      /^(https?:\/\/)?(www\.|vm\.|vt\.)?tiktok\.com\/.*$/i;
    if (!tiktokRegex.test(url)) {
      return Response.json(
        { error: "Please provide a valid TikTok URL" },
        { status: 400 }
      );
    }

    if (!TIKWM_API_URL) {
      return Response.json(
        { error: "TikTok API URL is not configured" },
        { status: 500 }
      );
    }

    const response = await axios.post(
      TIKWM_API_URL,
      { url },
      {
        timeout: 15000,
        maxRedirects: 2,
      }
    );

    const data = response.data;

    if (data && data.data && data.data.play) {
      return Response.json({
        success: true,
        downloadUrl: data.data.play,
        title: data.data.title || "TikTok Video",
        thumbnail: data.data.cover || data.data.origin_cover || "",
        author: data.data.author?.nickname || "Unknown",
        duration: data.data.duration || 0,
        platform: "tiktok",
        format: "mp4",
      });
    }

    return Response.json(
      {
        error:
          "Could not download TikTok video. Make sure the link is not from a private account.",
      },
      { status: 422 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json(
      { error: "Failed to process TikTok request", details: message },
      { status: 500 }
    );
  }
}
