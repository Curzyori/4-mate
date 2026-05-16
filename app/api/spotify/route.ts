import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

async function getSessionData(): Promise<{
  csrfToken: string;
  cookies: string;
}> {
  const pageRes = await fetch(`${process.env.SPOTIFY_API_URL}/en1`, {
    method: "GET",
    headers: {
      "User-Agent": USER_AGENT,
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
    },
  });

  let csrfToken = "";
  let cookies = "";

  if (pageRes.ok) {
    const html = await pageRes.text();

    // Extract CSRF token via multiple patterns
    let tokenMatch;
    tokenMatch = html.match(
      /meta[^>]*name=["']csrf-token["'][^>]*content=["']([^"']+)["']/i
    );
    if (tokenMatch) csrfToken = tokenMatch[1];

    if (!csrfToken) {
      tokenMatch = html.match(
        /input[^>]*name=["']csrf_token["'][^>]*value=["']([^"']+)["']/i
      );
      if (tokenMatch) csrfToken = tokenMatch[1];
    }

    if (!csrfToken) {
      tokenMatch = html.match(
        /csrf["'-_]["']?\s*[:=]\s*["']([a-zA-Z0-9/+\-_]+={0,2})["']/i
      );
      if (tokenMatch) csrfToken = tokenMatch[1];
    }

    const setCookieHeader = pageRes.headers.get("set-cookie");
    if (setCookieHeader) {
      cookies = setCookieHeader
        .split(",")
        .map((c) => c.split(";")[0])
        .join("; ");
    }
  }

  return { csrfToken, cookies };
}

function buildHeaders(csrfToken: string, cookies: string) {
  return {
    "Content-Type": "application/json",
    "User-Agent": USER_AGENT,
    Accept: "application/json",
    "Accept-Language": "en-US,en;q=0.9",
    "X-Requested-With": "XMLHttpRequest",
    Referer: `${process.env.SPOTIFY_API_URL}/en1`,
    Origin: process.env.SPOTIFY_API_URL || "",
    "Cache-Control": "no-cache",
    Pragma: "no-cache",
    ...(csrfToken && { "X-CSRF-TOKEN": csrfToken }),
    ...(cookies && { Cookie: cookies }),
  };
}

// POST /api/spotify — handles both track-data and convert actions
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, url, urls } = body;

    if (!action) {
      return Response.json(
        { error: "Action is required (track-data or convert)" },
        { status: 400 }
      );
    }

    const { csrfToken, cookies } = await getSessionData();

    if (action === "track-data") {
      if (!url) {
        return Response.json(
          { error: "Spotify URL is required" },
          { status: 400 }
        );
      }

      const response = await fetch(`${process.env.SPOTIFY_API_URL}/getTrackData`, {
        method: "POST",
        headers: buildHeaders(csrfToken, cookies),
        body: JSON.stringify({
          spotify_url: url,
          ...(csrfToken && { csrf_token: csrfToken }),
        }),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => response.statusText);
        throw new Error(`HTTP ${response.status}: ${errorText.substring(0, 100)}`);
      }

      const data = await response.json();

      let trackInfo = null;
      if (data.name && data.artists && Array.isArray(data.artists)) {
        const albumInfo = data.album || {};
        const images = albumInfo.images || [];
        const firstArtist = data.artists[0] || {};

        trackInfo = {
          title: data.name,
          artist: firstArtist.name || "Unknown",
          album: albumInfo.name || "Unknown",
          durationMs: data.duration_ms || 0,
          coverUrl: images.length > 0 ? images[0].url : "",
          url: url,
        };
      }

      return Response.json({
        track: trackInfo,
        success: !!trackInfo,
        message: trackInfo
          ? "Track data retrieved successfully"
          : "Could not parse track data",
      });
    }

    if (action === "convert") {
      if (!urls) {
        return Response.json({ error: "URL is required" }, { status: 400 });
      }

      const response = await fetch(`${process.env.SPOTIFY_API_URL}/convert`, {
        method: "POST",
        headers: buildHeaders(csrfToken, cookies),
        body: JSON.stringify({
          urls,
          ...(csrfToken && { csrf_token: csrfToken }),
        }),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => response.statusText);
        throw new Error(`HTTP ${response.status}: ${errorText.substring(0, 100)}`);
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.message || "Conversion failed");
      }

      return Response.json(data);
    }

    return Response.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: unknown) {
    console.error("Spotify API Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json(
      { error: "Failed to process Spotify request", details: message },
      { status: 500 }
    );
  }
}
