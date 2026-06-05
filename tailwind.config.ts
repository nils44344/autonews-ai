import type { Config } from "tailwindcss";

// New design system — "AI Intelligence Operating System". Dark-first, premium,
// Bloomberg + Linear + Stripe + Perplexity in spirit. Color tokens map to the
// six pillars; spacing scale bumped so layouts breathe.

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Surfaces (dark-first)
        canvas: {
          DEFAULT: "#0a0d14",      // deep intelligence black
          raised: "#0f1320",       // subtle panel
          elevated: "#151a2b",     // hover/active panel
        },
        ink: { DEFAULT: "#0b0a14" }, // legacy
        // Pillar accents — explicit semantic names so usage is intentional.
        signal:      { DEFAULT: "#3b82f6", soft: "#1e3a8a" }, // blue   (Signals)
        opportunity: { DEFAULT: "#a855f7", soft: "#581c87" }, // purple (Opportunities)
        tool:        { DEFAULT: "#06b6d4", soft: "#155e75" }, // cyan   (Tools)
        workflow:    { DEFAULT: "#6366f1", soft: "#312e81" }, // indigo (Workflows)
        startup:     { DEFAULT: "#f59e0b", soft: "#78350f" }, // amber  (Startups)
        growth:      { DEFAULT: "#10b981", soft: "#064e3b" }, // green  (Growth/up)
        warning:     { DEFAULT: "#f59e0b", soft: "#78350f" }, // amber
        brand:  { DEFAULT: "#a855f7", dark: "#7e22ce", light: "#c084fc" },
        accent: "#3b82f6",
      },
      fontFamily: {
        // Geist (Vercel/Linear/Stripe standard) via the `geist` package, which
        // exposes --font-geist-sans / --font-geist-mono. We point sans + display
        // + serif at the same family so every existing usage upgrades at once.
        sans:    ["var(--font-geist-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-geist-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        serif:   ["var(--font-geist-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono:    ["var(--font-geist-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      maxWidth: {
        prose:   "72ch",
        content: "1180px",
      },
      keyframes: {
        marquee: { from: { transform: "translateX(0)" }, to: { transform: "translateX(-50%)" } },
        "fade-up": {
          "0%":   { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%":   { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        marquee:   "marquee 40s linear infinite",
        "fade-up": "fade-up 240ms ease-out both",
        shimmer:   "shimmer 1.6s linear infinite",
      },
      boxShadow: {
        card:         "0 1px 0 rgba(255,255,255,0.04) inset, 0 1px 2px rgba(0,0,0,0.4)",
        "card-hover": "0 1px 0 rgba(255,255,255,0.06) inset, 0 6px 16px -2px rgba(0,0,0,0.45)",
      },
      typography: {
        DEFAULT: { css: { maxWidth: "72ch" } },
      },
    },
  },
  plugins: [],
};

export default config;
