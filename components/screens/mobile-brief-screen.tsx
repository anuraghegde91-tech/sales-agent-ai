"use client"

import { useState } from "react"

interface Meeting {
  hospitalName?: string
  city?: string
  contactName?: string
  contactDesignation?: string
  meetingTime?: string
  meetingDate?: string
  hospitalImage?: string
  brief?: any
}

interface MobileBriefScreenProps {
  meetings?: Meeting[]
  selectedIndex?: number
  onSelectMeeting?: (index: number) => void
  onAddMeeting?: () => void
  repName?: string
  repDesignation?: string
}

type NavTab = "brief" | "signals" | "pitch" | "contact"

export function MobileBriefScreen({
  meetings = [],
  selectedIndex = 0,
  onSelectMeeting = () => {},
  onAddMeeting = () => {},
  repName = "Sales Rep",
  repDesignation = "Field Sales Executive",
}: MobileBriefScreenProps) {
  const [activeNav, setActiveNav] = useState<NavTab>("brief")
  const [showMoreTags, setShowMoreTags] = useState(false)
  const [showMorePitch, setShowMorePitch] = useState(false)
  const [showMorePain, setShowMorePain] = useState(false)
  const [showMoreQ, setShowMoreQ] = useState(false)

  const r = meetings[selectedIndex] || ({} as any)
  const brief = r?.brief || null
  const hospitalName = r?.hospitalName || "Hospital"
  const city = r?.city || ""
  const contactName = r?.contactName || "Contact"
  const contactDesignation = r?.contactDesignation || ""
  const meetingTime = r?.meetingTime || ""
  const meetingDate = r?.meetingDate || ""

  const contactInitials = contactName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
  const repInitials = repName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()

  const talkingPoints = brief?.talkingPoints || []
  const painPoints = brief?.painPoints || []
  const discoveryQs = brief?.discoveryQuestions || []
  const signals = brief?.intelligenceSignals || []
  const priorities = brief?.contactProfile?.likelyPriorities || []

  const MoreBtn = ({ onClick }: { onClick: () => void }) => (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 bg-white text-[#0a7a8a] text-[9px] rounded-full border border-[#c8d8e4] cursor-pointer"
      style={{ boxShadow: "1px 1px 5px rgba(0,0,0,0.07)" }}
    >
      More
      <svg width="7" height="5" viewBox="0 0 8 6" fill="none">
        <path d="M1 1L4 5L7 1" stroke="#5bc8d8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  )

  const CardHeader = ({ label }: { label: string }) => (
    <div className="flex items-center gap-1.5 mb-3">
      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "linear-gradient(135deg,#5bc8d8,#3ab0c0)" }} />
      <p className="text-[8px] text-[#8a9aaa] uppercase tracking-widest font-semibold">{label}</p>
    </div>
  )

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: "#edf1f7" }}>

      {/* Status bar */}
      <div className="flex justify-between items-center px-5 pt-3 pb-1 bg-white">
        <div className="flex gap-1">
          {[1,2,3,4].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#1a3a4a]" />)}
        </div>
        <p className="text-[10px] font-semibold text-[#1a3a4a]">{meetingTime || "11:01"}</p>
      </div>

      {/* Header */}
      <div
        className="px-4 pt-3 pb-4"
        style={{ background: "linear-gradient(135deg,#c5e8f2,#a8d8e8)" }}
      >
        <div className="flex justify-between items-start mb-3">
          <div>
            <h1 className="text-[17px] font-bold text-[#0a3a5a]">{hospitalName}</h1>
            <p className="text-[10px] text-[#3a8aaa] mt-0.5">{city}</p>
          </div>
          <div
            className="px-3 py-1.5 rounded-full text-[10px] font-semibold text-[#0a5a7a]"
            style={{ background: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.9)" }}
          >
            {meetingTime} Today
          </div>
        </div>
        {signals[0]?.signal && (
          <div
            className="px-3 py-2 rounded-xl text-[10px] font-medium text-[#0a5a7a] truncate"
            style={{ background: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.7)" }}
          >
            {signals[0].signal}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 px-4 pt-3">
        {[
          { label: "Contact", value: contactName, sub: contactDesignation },
          { label: "Meeting", value: meetingTime, sub: meetingDate, glow: true },
          { label: "Beds", value: brief?.hospitalOverview?.beds || "N/A", sub: "Total capacity" },
          { label: "Hospital", value: hospitalName?.split(" ")[0], sub: "Multi-specialty" },
        ].map((s, i) => (
          <div
            key={i}
            className="bg-white rounded-[14px] px-3 py-3 border"
            style={
              s.glow
                ? { borderColor: "rgba(91,200,216,0.35)", boxShadow: "2px 2px 8px rgba(0,0,0,0.05),0 0 12px rgba(91,200,216,0.15)" }
                : { borderColor: "#dde3ec", boxShadow: "2px 2px 8px rgba(0,0,0,0.04)" }
            }
          >
            <p className="text-[8px] text-[#8a9aaa] uppercase tracking-wider mb-1 font-semibold">{s.label}</p>
            <p className="text-[14px] font-bold text-[#1a3a4a] truncate">{s.value}</p>
            <p className="text-[8px] text-[#9aaabb] mt-0.5 truncate">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4 pt-3 pb-2 flex flex-col gap-3">

        {/* Stakeholder */}
        <div
          className="bg-white rounded-[16px] p-4 border"
          style={{ borderColor: "rgba(91,200,216,0.3)", boxShadow: "2px 2px 8px rgba(0,0,0,0.04),0 0 14px rgba(91,200,216,0.12)" }}
        >
          <CardHeader label="Stakeholder" />
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-[10px] flex items-center justify-center text-[13px] font-bold text-white flex-shrink-0"
              style={{ background: "linear-gradient(135deg,#5bc8d8,#3ab0c0)", boxShadow: "0 3px 10px rgba(91,200,216,0.3)" }}
            >
              {contactInitials}
            </div>
            <div>
              <p className="text-[13px] font-bold text-[#1a3a4a]">{contactName}</p>
              <p className="text-[10px] text-[#6a8a9a] mt-0.5">{contactDesignation}</p>
              {brief?.contactProfile?.verified && (
                <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[8px] text-[#0a6a8a] font-semibold bg-[rgba(91,200,216,0.12)] border border-[rgba(91,200,216,0.3)]">
                  ✓ Verified
                </span>
              )}
            </div>
          </div>

          <div className="h-px bg-[#edf1f7] my-3" />

          {brief?.contactProfile?.engagementTip && (
            <div className="flex items-start gap-2">
              <div className="w-[2px] min-h-[30px] rounded-sm flex-shrink-0" style={{ background: "#e6b830" }} />
              <div>
                <p className="text-[8px] text-[#8a7a00] uppercase tracking-wider font-semibold">Tip</p>
                <p className="text-[10px] text-[#5a4800] mt-1 italic leading-relaxed">{brief.contactProfile.engagementTip}</p>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-1.5 mt-3">
            {priorities.slice(0, 2).map((p: string, i: number) => (
              <span key={i} className="px-2 py-1 rounded-full text-[8px] text-[#1a6a8a] bg-[rgba(91,200,216,0.1)] border border-[rgba(91,200,216,0.2)] font-medium">
                {p.split(" ").slice(0, 2).join(" ")}
              </span>
            ))}
          </div>
          {!showMoreTags && priorities.length > 2 && <MoreBtn onClick={() => setShowMoreTags(true)} />}
          {showMoreTags && (
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {priorities.slice(2).map((p: string, i: number) => (
                <span key={i} className="px-2 py-1 rounded-full text-[8px] text-[#1a6a8a] bg-[rgba(91,200,216,0.1)] border border-[rgba(91,200,216,0.2)] font-medium">
                  {p.split(" ").slice(0, 2).join(" ")}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Pitch */}
        <div
          className="bg-white rounded-[16px] p-4 border-l-[3px]"
          style={{ borderColor: "rgba(57,208,180,0.28)", borderLeftColor: "#5bc8d8", boxShadow: "2px 2px 8px rgba(0,0,0,0.04),0 0 12px rgba(57,208,180,0.1)" }}
        >
          <CardHeader label="Your pitch" />
          {brief?.recommendedApproach?.openingLine && (
            <p className="text-[11px] font-semibold text-[#1a3a4a] leading-relaxed mb-3">{brief.recommendedApproach.openingLine}</p>
          )}
          {talkingPoints.slice(0, 2).map((tp: any, i: number) => (
            <div key={i} className="bg-[#f6f9fc] border-l-[2px] border-[#5bc8d8] rounded-r-[8px] px-3 py-2 mb-2">
              <p className="text-[10px] font-semibold text-[#1a3a4a]">{tp.point}</p>
              <p className="text-[8px] text-[#8a9aaa] mt-1">{tp.hook}</p>
            </div>
          ))}
          {!showMorePitch && talkingPoints.length > 2 && <MoreBtn onClick={() => setShowMorePitch(true)} />}
          {showMorePitch && talkingPoints.slice(2).map((tp: any, i: number) => (
            <div key={i} className="bg-[#f6f9fc] border-l-[2px] border-[#5bc8d8] rounded-r-[8px] px-3 py-2 mb-2">
              <p className="text-[10px] font-semibold text-[#1a3a4a]">{tp.point}</p>
              <p className="text-[8px] text-[#8a9aaa] mt-1">{tp.hook}</p>
            </div>
          ))}
          <span className="inline-flex items-center gap-1 mt-2 px-2.5 py-1 rounded-full text-[8px] text-[#0a6a8a] bg-[rgba(91,200,216,0.1)] border border-[rgba(91,200,216,0.22)] font-medium">
            <span className="text-[#0a8a6a]">✓</span> Matched to {contactDesignation} priorities
          </span>
        </div>

        {/* Signals */}
        <div className="bg-white rounded-[16px] p-4 border border-[#dde3ec]" style={{ boxShadow: "2px 2px 8px rgba(0,0,0,0.04)" }}>
          <CardHeader label="Live signals" />
          {signals.map((sig: any, i: number) => (
            <div key={i} className="bg-[#f6f9fc] rounded-xl border-l-[2px] border-[#5bc8d8] px-3 py-2.5 mb-2">
              <div className="flex items-start justify-between gap-2 mb-1">
                <p className="text-[10px] font-semibold text-[#1a3a4a] flex-1 leading-snug">{sig.signal}</p>
                <span className={`rounded-full px-2 py-0.5 text-[8px] flex-shrink-0 font-medium ${
                  sig.urgency === "high" ? "bg-[rgba(248,81,73,0.1)] text-[#a0251e]" :
                  sig.urgency === "medium" ? "bg-[rgba(210,153,34,0.1)] text-[#7a4f00]" :
                  "bg-[rgba(139,148,158,0.1)] text-[#5a6a7a]"
                }`}>{sig.urgency}</span>
              </div>
              <p className="text-[8px] text-[#8a9aaa] mb-1.5 leading-relaxed">{sig.implication}</p>
              {sig.sourceUrl && (
                <a href={sig.sourceUrl} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[8px] text-[#5bc8d8] no-underline font-medium">
                  <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
                    <path d="M2 10L10 2M10 2H5M10 2V7" stroke="#5bc8d8" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  {sig.source || "View source"}
                </a>
              )}
            </div>
          ))}
          {signals.length === 0 && <p className="text-[10px] text-[#8a9aaa] italic">No public signals found</p>}
        </div>

        {/* Pain points */}
        <div className="bg-white rounded-[16px] p-4 border border-[#dde3ec]" style={{ boxShadow: "2px 2px 8px rgba(0,0,0,0.04)" }}>
          <CardHeader label="Pain points" />
          {painPoints.slice(0, 2).map((p: any, i: number) => (
            <div key={i} className="flex items-start gap-2 bg-[#f6f9fc] rounded-xl px-3 py-2 mb-2 border border-[#e8edf2]">
              <div className="w-1.5 h-1.5 rounded-full bg-[#5bc8d8] flex-shrink-0 mt-1.5" />
              <div>
                <p className="text-[10px] text-[#1a3a4a] font-medium">{p.pain}</p>
                <p className="text-[8px] text-[#8a9aaa] mt-0.5">{p.evidence}</p>
              </div>
            </div>
          ))}
          {!showMorePain && painPoints.length > 2 && <MoreBtn onClick={() => setShowMorePain(true)} />}
          {showMorePain && painPoints.slice(2).map((p: any, i: number) => (
            <div key={i} className="flex items-start gap-2 bg-[#f6f9fc] rounded-xl px-3 py-2 mb-2 border border-[#e8edf2]">
              <div className="w-1.5 h-1.5 rounded-full bg-[#5bc8d8] flex-shrink-0 mt-1.5" />
              <div>
                <p className="text-[10px] text-[#1a3a4a] font-medium">{p.pain}</p>
                <p className="text-[8px] text-[#8a9aaa] mt-0.5">{p.evidence}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Discovery questions */}
        <div className="bg-white rounded-[16px] p-4 border border-[#dde3ec] mb-2" style={{ boxShadow: "2px 2px 8px rgba(0,0,0,0.04)" }}>
          <CardHeader label="Discovery questions" />
          {discoveryQs.slice(0, 2).map((q: string, i: number) => (
            <div key={i} className="flex gap-2 bg-[#f6f9fc] rounded-xl px-3 py-2 mb-2 border border-[#e8edf2]">
              <span className="text-[9px] font-bold text-[#5bc8d8] min-w-[16px]">Q{i + 1}</span>
              <p className="text-[10px] text-[#1a3a4a] leading-snug">{q}</p>
            </div>
          ))}
          {!showMoreQ && discoveryQs.length > 2 && <MoreBtn onClick={() => setShowMoreQ(true)} />}
          {showMoreQ && discoveryQs.slice(2).map((q: string, i: number) => (
            <div key={i} className="flex gap-2 bg-[#f6f9fc] rounded-xl px-3 py-2 mb-2 border border-[#e8edf2]">
              <span className="text-[9px] font-bold text-[#5bc8d8] min-w-[16px]">Q{i + 3}</span>
              <p className="text-[10px] text-[#1a3a4a] leading-snug">{q}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom nav */}
      <div className="flex justify-around items-center px-4 py-2.5 bg-white border-t border-[#e8edf2]">
        {[
          {
            key: "brief", label: "Brief",
            icon: (active: boolean) => (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="2" y="2" width="5" height="5" rx="1.5" fill={active ? "white" : "#8a9aaa"} />
                <rect x="9" y="2" width="5" height="5" rx="1.5" fill={active ? "white" : "#8a9aaa"} />
                <rect x="2" y="9" width="5" height="5" rx="1.5" fill={active ? "white" : "#8a9aaa"} />
                <rect x="9" y="9" width="5" height="5" rx="1.5" fill={active ? "white" : "#8a9aaa"} />
              </svg>
            )
          },
          {
            key: "signals", label: "Signals",
            icon: (active: boolean) => (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="5" stroke={active ? "white" : "#8a9aaa"} strokeWidth="1.5" />
                <path d="M8 5v3l2 2" stroke={active ? "white" : "#8a9aaa"} strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            )
          },
          {
            key: "pitch", label: "Pitch",
            icon: (active: boolean) => (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M3 4h10M3 12h6" stroke={active ? "white" : "#8a9aaa"} strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            )
          },
          {
            key: "contact", label: "Contact",
            icon: (active: boolean) => (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="6" r="3" stroke={active ? "white" : "#8a9aaa"} strokeWidth="1.5" />
                <path d="M2 14c0-3 2.7-5 6-5s6 2 6 5" stroke={active ? "white" : "#8a9aaa"} strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            )
          },
        ].map((item) => {
          const active = activeNav === item.key as NavTab
          return (
            <button key={item.key} onClick={() => setActiveNav(item.key as NavTab)}
              className="flex flex-col items-center gap-1 border-none bg-transparent cursor-pointer">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={active ? { background: "linear-gradient(135deg,#5bc8d8,#3ab0c0)" } : {}}
              >
                {item.icon(active)}
              </div>
              <span className={`text-[8px] font-medium ${active ? "text-[#0a7a8a]" : "text-[#8a9aaa]"}`}>
                {item.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
