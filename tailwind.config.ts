import type { Config } from "tailwindcss";

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
        canvas: {
          DEFAULT:  "rgb(var(--canvas) / <alpha-value>)",
          raised:   "rgb(var(--canvas-raised) / <alpha-value>)",
          elevated: "rgb(var(--canvas-elevated) / <alpha-value>)",
          rule:     "rgb(var(--canvas-rule) / <alpha-value>)",
        },
        brand:  "rgb(var(--brand) / <alpha-value>)",
        accent: "rgb(var(--accent) / <alpha-value>)",
        up:     "rgb(var(--up) / <alpha-value>)",
        down:   "rgb(var(--down) / <alpha-value>)",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
      },
      maxWidth: { content: "1480px", prose: "72ch" },
      letterSpacing: { bracket: "0.22em" },
    },
  },
  plugins: [],
};

export default config;
