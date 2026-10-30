import { ImageResponse } from "next/og"

export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          background: "#0D1117",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background orb — top right */}
        <div
          style={{
            position: "absolute",
            top: -120,
            right: -120,
            width: 560,
            height: 560,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(88,166,255,0.22) 0%, transparent 70%)",
          }}
        />
        {/* Background orb — bottom left */}
        <div
          style={{
            position: "absolute",
            bottom: -100,
            left: -100,
            width: 480,
            height: 480,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(63,185,80,0.18) 0%, transparent 70%)",
          }}
        />
        {/* Subtle grid */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(230,237,243,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(230,237,243,0.03) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        {/* Logo row */}
        <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 36 }}>
          <div
            style={{
              width: 68,
              height: 68,
              background: "linear-gradient(135deg, #58A6FF 0%, #2563eb 100%)",
              borderRadius: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 8px 32px rgba(88,166,255,0.4)",
            }}
          >
            <span style={{ color: "white", fontSize: 28, fontWeight: 900, fontFamily: "sans-serif", letterSpacing: -1 }}>
              SA
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ color: "#E6EDF3", fontSize: 34, fontWeight: 800, fontFamily: "sans-serif", lineHeight: 1 }}>
              Sales Agent AI
            </span>
            <span style={{ color: "#58A6FF", fontSize: 17, fontFamily: "sans-serif", fontWeight: 500 }}>
              Field Intelligence Platform
            </span>
          </div>
        </div>

        {/* Main headline */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            fontSize: 72,
            fontWeight: 900,
            fontFamily: "sans-serif",
            textAlign: "center",
            lineHeight: 1.08,
            marginBottom: 24,
            letterSpacing: -2,
          }}
        >
          <span style={{ color: "#E6EDF3" }}>Walk in prepared.</span>
          <span style={{ color: "#58A6FF" }}>Every time.</span>
        </div>

        {/* Subtext */}
        <div
          style={{
            color: "#8B949E",
            fontSize: 22,
            fontFamily: "sans-serif",
            textAlign: "center",
            maxWidth: 680,
            lineHeight: 1.5,
            marginBottom: 44,
          }}
        >
          AI-powered pre-meeting briefs for field sales reps. Real-time hospital intelligence, personalized pitch points & CRM deal tracking.
        </div>

        {/* Feature pills */}
        <div style={{ display: "flex", gap: 16 }}>
          {[
            { label: "⚡  AI Briefs", bg: "rgba(88,166,255,0.12)", border: "rgba(88,166,255,0.35)", color: "#58A6FF" },
            { label: "📡  Hospital Intel", bg: "rgba(63,185,80,0.10)", border: "rgba(63,185,80,0.30)", color: "#3FB950" },
            { label: "📊  CRM Pipeline", bg: "rgba(139,92,246,0.10)", border: "rgba(139,92,246,0.30)", color: "#a78bfa" },
          ].map((f) => (
            <div
              key={f.label}
              style={{
                background: f.bg,
                border: `1.5px solid ${f.border}`,
                borderRadius: 28,
                padding: "10px 24px",
                color: f.color,
                fontSize: 17,
                fontFamily: "sans-serif",
                fontWeight: 700,
              }}
            >
              {f.label}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size },
  )
}
