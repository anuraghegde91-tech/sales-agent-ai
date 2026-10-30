export type DealStage = "prospecting" | "demo" | "proposal" | "negotiation" | "won" | "lost" | "on_hold"

export type MeetingStatus = "pending" | "completed" | "cancelled" | "no_show" | "rescheduled"

export const DEAL_STAGES: { value: DealStage; label: string; color: string; bg: string }[] = [
  { value: "prospecting", label: "Prospecting", color: "#6b7280", bg: "#f3f4f6" },
  { value: "demo",        label: "Demo",        color: "#8b5cf6", bg: "#f5f3ff" },
  { value: "proposal",    label: "Proposal",    color: "#f59e0b", bg: "#fffbeb" },
  { value: "negotiation", label: "Negotiation", color: "#f97316", bg: "#fff7ed" },
  { value: "won",         label: "Deal Won",    color: "#22c55e", bg: "#f0fdf4" },
  { value: "lost",        label: "Deal Lost",   color: "#ef4444", bg: "#fef2f2" },
  { value: "on_hold",     label: "On Hold",     color: "#f59e0b", bg: "#fffbeb" },
]

export const CRM_COLORS: Record<string, string> = {
  contract:     "#22c55e",
  call:         "#3b82f6",
  demo:         "#a855f7",
  brief:        "#6b7fa3",
  note:         "#f59e0b",
  meeting_done: "#0ea5e9",
  proposal:     "#8b5cf6",
  followup:     "#3b82f6",
  next_meeting: "#14b8a6",
  won:          "#22c55e",
  lost:         "#ef4444",
  on_hold:      "#f59e0b",
  terminated:   "#6b7280",
  stage_change: "#94a3b8",
}

export const CRM_LABELS: Record<string, string> = {
  contract:     "Contract Signed",
  call:         "Follow-up Call",
  demo:         "Demo Conducted",
  brief:        "Brief Generated",
  note:         "Note",
  meeting_done: "Meeting Done",
  proposal:     "Proposal Sent",
  followup:     "Follow-up",
  next_meeting: "Next Meeting Scheduled",
  stage_change: "Deal Stage",
  won:          "Deal Won",
  lost:         "Deal Lost",
  on_hold:      "On Hold",
  terminated:   "Terminated",
}

export const DEAL_STAGE_COLORS: Record<DealStage, { color: string; bg: string; darkColor: string; darkBg: string }> = {
  prospecting: { color: "#6b7280", bg: "#f3f4f6",  darkColor: "#9ca3af", darkBg: "#374151" },
  demo:        { color: "#8b5cf6", bg: "#f5f3ff",  darkColor: "#a78bfa", darkBg: "#4c1d95" },
  proposal:    { color: "#f59e0b", bg: "#fffbeb",  darkColor: "#fbbf24", darkBg: "#78350f" },
  negotiation: { color: "#f97316", bg: "#fff7ed",  darkColor: "#fb923c", darkBg: "#7c2d12" },
  won:         { color: "#22c55e", bg: "#f0fdf4",  darkColor: "#4ade80", darkBg: "#14532d" },
  lost:        { color: "#ef4444", bg: "#fef2f2",  darkColor: "#f87171", darkBg: "#7f1d1d" },
  on_hold:     { color: "#f59e0b", bg: "#fffbeb",  darkColor: "#fbbf24", darkBg: "#78350f" },
}
