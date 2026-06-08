import type { Config } from "tailwindcss";

// NEW signature for AutoNews AI — distinctive on purpose. No more purple-blue
// rainbow (every generic dark dashboard does that). Single brand channel:
// electric teal as primary, warm amber-gold as accent. Pillars get distinct
// hues but they're all anchored to the teal/amber axis so the brand reads as
// one product, not six unrelated sections.

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
        // ── Surfaces (theme-aware via "R G B" CSS-var triplets) ──
        // The rgb(var(...) / <alpha-value>) format lets Tailwind apply alpha
        // modifiers like bg-canvas/85 directly. Switching to raw "R G B"
        // triplets in globals.css fixes the bug where the sticky header
        // appeared light while the rest of the page was dark.
        canvas: {
          DEFAULT:   "rgb(var(--canvas) / <alpha-value>)",
          raised:    "rgb(var(--canvas-raised) / <alpha-value>)",
          elevated:  "rgb(var(--canvas-elevated) / <alpha-value>)",
          rule:      "rgb(var(--canvas-rule) / <alpha-value>)",
        },
        ink: { DEFAULT: "rgb(var(--fg) / <alpha-value>)" },

        // ── Brand: electric teal (primary) + amber gold (accent) ──
        // Brand + accent are CSS-variable driven so the role-personality
        // system can recolor every bg-brand / text-brand / border-brand /
        // bg-accent etc. instantly without rebuilds.
        brand: {
          DEFAULT: "rgb(var(--brand-rgb) / <alpha-value>)",
          dark:    "#0d9488",
          light:   "rgb(var(--brand-rgb) / 0.7)",
        },
        accent: {
          DEFAULT: "rgb(var(--accent-rgb) / <alpha-value>)",
          dark:    "#d97706",
          light:   "rgb(var(--accent-rgb) / 0.7)",
        },

        // ── Pillars (semantic, anchored to teal/amber axis) ──────
        // Opportunities — the moat, gets the brand teal.
        opportunity: { DEFAULT: "#22d3b8", soft: "#0d9488" },
        // Signals — high-energy amber.
        signal:      { DEFAULT: "#fbbf24", soft: "#92400e" },
        // Tools — cool blue-teal, related to brand.
        tool:        { DEFAULT: "#38bdf8", soft: "#075985" },
        // Workflows — muted violet (complement to teal).
        workflow:    { DEFAULT: "#a78bfa", soft: "#5b21b6" },
        // Startups — orange-red, signals breakouts.
        startup:     { DEFAULT: "#fb7185", soft: "#9f1239" },
        // Growth + warning kept consistent.
        growth:      { DEFAULT: "#34d399", soft: "#065f46" },
        warning:     { DEFAULT: "#fbbf24", soft: "#92400e" },
      },
      fontFamily: {
        // Reverted: serif italic was too hard to read. Everything readable
        // now uses Geist Sans; only the data ledgers use Geist Mono.
        sans:    ["var(--font-geist-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-geist-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        serif:   ["var(--font-geist-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono:    ["var(--font-geist-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      maxWidth: {
        prose:   "72ch",
        content: "1240px",   // slightly wider than before — more breathing room
      },
      letterSpacing: {
        bracket: "0.22em",   // for [01] OPPORTUNITIES style section marks
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
        // Slow horizontal drift for ticker bars.
        ticker: {
          from: { transform: "translateX(0)" },
          to:   { transform: "translateX(-50%)" },
        },
      },
      animation: {
        marquee:   "marquee 40s linear infinite",
        "fade-up": "fade-up 240ms ease-out both",
        shimmer:   "shimmer 1.6s linear infinite",
        ticker:    "ticker 70s linear infinite",
      },
      boxShadow: {
        card:         "0 1px 0 rgba(255,255,255,0.04) inset, 0 1px 2px rgba(0,0,0,0.55)",
        "card-hover": "0 1px 0 rgba(34, 211, 184, 0.12) inset, 0 8px 20px -4px rgba(0,0,0,0.6)",
        // Subtle glow for the brand teal accent on hover targets.
        glow:         "0 0 30px -8px rgba(34, 211, 184, 0.4)",
      },
      typography: {
        DEFAULT: { css: { maxWidth: "72ch" } },
      },
    },
  },
  plugins: [],
};

export default config;
