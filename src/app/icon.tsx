import { ImageResponse } from "next/og";

// Generates the favicon (no binary asset needed). Mirrors the header logo:
// white "A" on the ink-dark brand square. Edge runtime so @vercel/og loads its
// font via wasm rather than the filesystem (avoids a Node fileURLToPath bug).
export const runtime = "edge";
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0b1120",
          color: "#ffffff",
          fontSize: 22,
          fontWeight: 800,
          borderRadius: 7,
        }}
      >
        A
      </div>
    ),
    size,
  );
}
