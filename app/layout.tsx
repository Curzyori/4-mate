import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "4 Mate — Multi-Platform Media Downloader",
  description:
    "Download media from Spotify, Instagram, TikTok, and YouTube in MP3 or MP4 format. Fast, free, and ad-free.",
  keywords: [
    "downloader",
    "spotify",
    "instagram",
    "tiktok",
    "youtube",
    "mp3",
    "mp4",
    "media downloader",
  ],
  openGraph: {
    title: "4 Mate — Multi-Platform Media Downloader",
    description:
      "Download media from Spotify, Instagram, TikTok, and YouTube. Fast, free, and ad-free.",
    url: "https://4mate.curzy.my.id",
    siteName: "4 Mate",
    type: "website",
  },
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/logo.png" sizes="any" />
        <link rel="apple-touch-icon" href="/logo.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-canvas text-body antialiased" suppressHydrationWarning>
        {children}
        {/* Hide potential floating dev icons/toolbars */}
        <style dangerouslySetInnerHTML={{ __html: `
          [data-vercel-toolbar], 
          #vercel-live-feedback-container,
          .nextjs-static-indicator {
            display: none !important;
          }
        `}} />
      </body>
    </html>
  );
}
