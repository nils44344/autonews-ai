import { ImageResponse } from "next/og";

// Serves /logo.png — the publisher logo referenced by the JSON-LD structured
// data (Organization + Article). Google needs this to be a real, fetchable
// image for Article rich-result eligibility; we generate it instead of shipping
// a binary asset. Edge runtime so @vercel/og loads its font via wasm.
const SITE_NAME = "AutoNews AI";
export const runtime = "edge";

export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 28,
          background: "#0b1120",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            width: 120,
            height: 120,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#ffffff",
            color: "#0b1120",
            fontSize: 84,
            fontWeight: 800,
            borderRadius: 24,
          }}
        >
          A
        </div>
        <div style={{ fontSize: 64, fontWeight: 800 }}>{SITE_NAME}</div>
      </div>
    ),
    { width: 512, height: 160 },
  );
}
