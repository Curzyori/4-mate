"use client";

import Image from "next/image";

const GRADIENT_COLORS = [
  "from-accent-purple to-accent-blue",
  "from-accent-pink to-accent-purple",
  "from-accent-blue to-accent-green",
  "from-accent-orange to-accent-pink",
];

export default function Hero() {
  return (
    <section
      id="hero-section"
      className="relative overflow-hidden pt-24 pb-8 md:pt-32 md:pb-12"
    >
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        {GRADIENT_COLORS.map((gradient, i) => (
          <div
            key={i}
            className={`absolute rounded-full bg-gradient-to-br ${gradient} opacity-[0.06] blur-3xl`}
            style={{
              width: `${250 + i * 80}px`,
              height: `${250 + i * 80}px`,
              top: `${10 + i * 15}%`,
              left: `${15 + i * 20}%`,
              animationDelay: `${i * 0.8}s`,
            }}
          />
        ))}
      </div>

      <div className="mx-auto max-w-4xl px-6 text-center">
        {/* Logo */}
        <div
          className="animate-fade-in-up mx-auto mb-8 flex justify-center"
          style={{ opacity: 0, animationDelay: "0.05s", animationFillMode: "forwards" }}
        >
          <div className="relative h-16 w-16 overflow-hidden rounded-xl bg-canvas shadow-level2 md:h-20 md:w-20">
            <Image
              src="/logo.png"
              alt="4 Mate Logo"
              fill
              className="object-contain p-2"
              priority
            />
          </div>
        </div>

        {/* Eyebrow */}
        <p
          className="animate-fade-in-up mb-6 text-xs font-medium uppercase tracking-[1.5px] text-mute"
          style={{ opacity: 0, animationDelay: "0.15s", animationFillMode: "forwards" }}
        >
          Multi-Platform Media Downloader
        </p>

        {/* App Name */}
        <h1
          className="animate-fade-in-up mb-4 text-5xl font-semibold tracking-tight text-ink md:text-7xl lg:text-[80px] lg:leading-[83.2px] lg:tracking-[-0.8px]"
          style={{ opacity: 0, animationDelay: "0.2s", animationFillMode: "forwards" }}
        >
          4{" "}
          <span className="bg-gradient-to-r from-accent-purple via-accent-pink to-accent-blue bg-clip-text text-transparent">
            Mate
          </span>
        </h1>

        {/* Tagline */}
        <p
          className="animate-fade-in-up mx-auto max-w-lg text-base leading-[25.6px] tracking-[-0.16px] text-body-mid md:text-lg"
          style={{ opacity: 0, animationDelay: "0.3s", animationFillMode: "forwards" }}
        >
          Download music and videos from{" "}
          <span className="font-medium text-ink">Spotify</span>,{" "}
          <span className="font-medium text-ink">Instagram</span>,{" "}
          <span className="font-medium text-ink">TikTok</span> &amp;{" "}
          <span className="font-medium text-ink">YouTube</span> — fast, free,
          and ad-free.
        </p>
      </div>
    </section>
  );
}
