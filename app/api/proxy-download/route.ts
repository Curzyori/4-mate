import { NextRequest } from "next/server";

// Use edge runtime for better streaming performance and bypassing standard serverless size limits
export const runtime = "edge";

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  const filename = request.nextUrl.searchParams.get("filename") || "download.mp4";

  if (!url) {
    return new Response("URL parameter is required", { status: 400 });
  }

  try {
    const response = await fetch(url, {
      headers: {
        // Optional: mimic a standard browser to bypass some restrictions
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch media: ${response.statusText}`);
    }

    // Create new headers from the original response
    const newHeaders = new Headers(response.headers);
    
    // Force download by setting Content-Disposition to attachment
    newHeaders.set("Content-Disposition", `attachment; filename="${filename}"`);
    
    // Remove headers that might interfere
    newHeaders.delete("Content-Security-Policy");
    newHeaders.delete("X-Frame-Options");

    // Return the response stream with the new headers
    return new Response(response.body, {
      status: response.status,
      headers: newHeaders,
    });
  } catch (error) {
    console.error("Proxy download error:", error);
    return new Response("Failed to proxy download", { status: 500 });
  }
}
