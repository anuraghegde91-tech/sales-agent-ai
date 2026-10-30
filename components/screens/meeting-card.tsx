import Link from "next/link"
import { MapPin, Clock, ChevronRight } from "lucide-react"
import { type DealStage, DEAL_STAGES } from "@/lib/constants"

interface MeetingCardProps {
  meeting: {
    id: string
    hospitalName: string
    city: string
    contactName: string
    contactDesignation: string
    meetingDate: string
    meetingTime: string
    meetingType: string
    hospitalImage?: string
    softwareType?: string
  }
  dealStage?: DealStage
}

const MEETING_TYPE_COLORS: Record<string, string> = {
  "First meeting": "#58A6FF",
  "Follow-up":     "#3b82f6",
  "Demo":          "#8b5cf6",
  "Negotiation":   "#f97316",
}

function formatDate(dateStr: string) {
  if (!dateStr) return ""
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" })
}

export function MeetingCard({ meeting, dealStage }: MeetingCardProps) {
  const stageInfo = dealStage ? DEAL_STAGES.find((s) => s.value === dealStage) : null
  const initials = meeting.hospitalName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  const softwareChips = meeting.softwareType
    ? meeting.softwareType.split(",").map((s) => s.trim()).filter(Boolean)
    : []

  const typeColor = MEETING_TYPE_COLORS[meeting.meetingType] ?? "#8B949E"

  return (
    <Link href={`/meetings/${meeting.id}`}>
      <div
        className="px-4 py-4 cursor-pointer transition-colors hover:bg-[#1C2128] group"
        style={{ borderBottom: "1px solid #21262D" }}
      >
        <div className="flex gap-3">
          {/* Avatar */}
          <div
            className="shrink-0 w-11 h-11 rounded-xl overflow-hidden flex items-center justify-center text-[#58A6FF] text-sm font-bold"
            style={{ background: "#21262D" }}
          >
            {meeting.hospitalImage ? (
              <img src={meeting.hospitalImage} alt="" className="w-full h-full object-cover" />
            ) : (
              initials
            )}
          </div>

          <div className="flex-1 min-w-0">
            {/* Name + stage */}
            <div className="flex items-start justify-between gap-2 mb-1">
              <p className="text-[#E6EDF3] text-[15px] font-bold leading-tight truncate">
                {meeting.hospitalName}
              </p>
              {stageInfo && (
                <span
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0"
                  style={{ background: `${stageInfo.color}20`, color: stageInfo.color }}
                >
                  {stageInfo.label}
                </span>
              )}
            </div>

            {/* City + date/time */}
            <div className="flex items-center gap-2 text-[#8B949E] text-xs mb-1">
              <MapPin className="w-3 h-3 shrink-0" />
              <span className="truncate">{meeting.city}</span>
              <span className="text-[#30363D]">·</span>
              <Clock className="w-3 h-3 shrink-0" />
              <span className="whitespace-nowrap">
                {formatDate(meeting.meetingDate)}{meeting.meetingTime ? ` · ${meeting.meetingTime}` : ""}
              </span>
            </div>

            {/* Contact */}
            {meeting.contactName && (
              <p className="text-[#8B949E] text-xs truncate mb-2">
                {meeting.contactName}
                {meeting.contactDesignation ? ` · ${meeting.contactDesignation}` : ""}
              </p>
            )}

            {/* Software chips + meeting type */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {softwareChips.slice(0, 4).map((chip) => (
                <span
                  key={chip}
                  className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                  style={{ background: "#21262D", color: "#6B7280" }}
                >
                  {chip}
                </span>
              ))}
              {meeting.meetingType && (
                <span
                  className="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0"
                  style={{ background: `${typeColor}18`, color: typeColor }}
                >
                  {meeting.meetingType}
                </span>
              )}
            </div>
          </div>

          <ChevronRight className="w-4 h-4 text-[#30363D] group-hover:text-[#8B949E] shrink-0 self-center transition-colors" />
        </div>
      </div>
    </Link>
  )
}
