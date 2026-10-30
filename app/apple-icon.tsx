import { ImageResponse } from "next/og"

export const size = { width: 180, height: 180 }
export const contentType = "image/png"

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          background: "linear-gradient(135deg, #58A6FF 0%, #2563eb 100%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
        }}
      >
        <span
          style={{
            color: "white",
            fontSize: 76,
            fontWeight: 900,
            fontFamily: "sans-serif",
            lineHeight: 1,
            letterSpacing: -2,
          }}
        >
          SA
        </span>
        <span
          style={{
            color: "rgba(255,255,255,0.65)",
            fontSize: 22,
            fontFamily: "sans-serif",
            fontWeight: 700,
            letterSpacing: 2,
          }}
        >
          AI
        </span>
      </div>
    ),
    { ...size },
  )
}
