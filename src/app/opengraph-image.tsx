import { ImageResponse } from "next/og";

// Default social-share card (used when a page has no specific OG image).
// Edge runtime so @vercel/og loads its font via wasm, not the filesystem.
const SITE_NAME = "AutoNews AI";
export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = `${SITE_NAME} — India's tech, startup & business news`;

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "linear-gradient(135deg, #0b1120 0%, #1e1b4b 60%, #4c1d95 100%)",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div
            style={{
              width: 96,
              height: 96,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#ffffff",
              color: "#0b1120",
              fontSize: 64,
              fontWeight: 800,
              borderRadius: 20,
            }}
          >
            A
          </div>
          <div style={{ fontSize: 56, fontWeight: 800 }}>{SITE_NAME}</div>
        </div>
        <div style={{ marginTop: 48, fontSize: 64, fontWeight: 800, lineHeight: 1.1, maxWidth: 900 }}>
          India&apos;s tech, startups, AI, markets &amp; cricket — fast and clear.
        </div>
        <div style={{ marginTop: 32, fontSize: 30, color: "#c4b5fd" }}>
          AI-powered newsroom · updated around the clock
        </div>
      </div>
    ),
    size,
  );
}
