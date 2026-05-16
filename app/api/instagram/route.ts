import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url) {
      return Response.json(
        { error: "Instagram URL is required" },
        { status: 400 }
      );
    }

    // Validate Instagram reel URL
    const igReelRegex = /^(https?:\/\/)?(www\.)?instagram\.com\/(reel|p|tv|stories)\/.+$/i;
    if (!igReelRegex.test(url)) {
      return Response.json(
        { error: "Please provide a valid Instagram URL" },
        { status: 400 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const igdl = require("./igdl");
    const result = await igdl(url);

    if (result && result.status && result.data && result.data.length > 0) {
      // Find the best quality or just return the first one
      const video = result.data.find((d: any) => d.url && d.url.includes("mp4")) || result.data[0];
      
      if (video && video.url) {
        return Response.json({
          success: true,
          downloadUrl: video.url,
          platform: "instagram",
          format: "mp4",
          thumbnail: video.thumbnail || video.thumb || "",
          title: video.title || "Instagram Reel",
        });
      }
    }

    return Response.json(
      {
        error: "Could not extract download link. The reel may be private or the service is temporarily unavailable.",
      },
      { status: 422 }
    );
  } catch (error: unknown) {
    console.error("Instagram API Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json(
      { error: "Failed to process Instagram request", details: message },
      { status: 500 }
    );
  }
}
