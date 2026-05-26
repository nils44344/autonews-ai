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
        brand: {
          DEFAULT: "#7c3aed",
          dark: "#6d28d9",
          light: "#a855f7",
        },
        accent: "#ec4899",
        ink: "#0b0a14",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        // `display` = Space Grotesk (techy/Gen-Z). `serif` is repointed to it too
        // so every existing `font-serif` headline picks up the new look at once.
        display: ["var(--font-display)", "var(--font-sans)", "sans-serif"],
        serif: ["var(--font-display)", "var(--font-sans)", "sans-serif"],
      },
      keyframes: {
        marquee: { from: { transform: "translateX(0)" }, to: { transform: "translateX(-50%)" } },
      },
      animation: {
        marquee: "marquee 40s linear infinite",
      },
      typography: {
        DEFAULT: { css: { maxWidth: "72ch" } },
      },
    },
  },
  plugins: [],
};

export default config;
