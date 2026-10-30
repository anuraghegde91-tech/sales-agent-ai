"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { mapRowToMeeting } from "@/lib/mapRowToMeeting"
import { MeetingCard } from "@/components/screens/meeting-card"
import { Button } from "@/components/ui/button"
import { type DealStage } from "@/lib/constants"
import { Plus, CalendarDays, Clock, History } from "lucide-react"

interface Meeting {
  id: string
  hospitalName: string
  city: string
  contactName: string
  contactDesignation: string
  meetingDate: string
  meetingTime: string
  meetingType: string
  hospitalImage: string
  softwareType?: string
}

// Returns current date string (YYYY-MM-DD) and minutes-of-day in IST (+05:30)
function getNowIst() {
  const utc = new Date()
  const ist = new Date(utc.getTime() + 330 * 60 * 1000) // UTC + 5:30
  return {
    dateStr:  ist.toISOString().slice(0, 10),
    minutes:  ist.getUTCHours() * 60 + ist.getUTCMinutes(),
  }
}

export default function MeetingsPage() {
  const router = useRouter()
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [stageMap, setStageMap] = useState<Record<string, DealStage>>({})
  const [loading, setLoading] = useState(true)
  const [nowIst, setNowIst] = useState(getNowIst)

  // Refresh current time every minute so categories update live
  useEffect(() => {
    const timer = setInterval(() => setNowIst(getNowIst()), 60_000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push("/login"); return }

      const [{ data: rows }, { data: stages }] = await Promise.all([
        supabase.from("meetings").select("*").eq("user_id", user.id).order("meeting_date", { ascending: false }),
        supabase.from("deal_stages").select("hospital_name, city, stage").eq("user_id", user.id),
      ])

      setMeetings((rows ?? []).map(mapRowToMeeting))

      const map: Record<string, DealStage> = {}
      for (const s of stages ?? []) {
        map[`${s.hospital_name}::${s.city}`] = s.stage as DealStage
      }
      setStageMap(map)
      setLoading(false)
    }
    load()
  }, [])

  // Time-aware categorisation: today's meetings split by whether the time has passed
  function categorize(m: Meeting): "past" | "today" | "upcoming" {
    if (m.meetingDate < nowIst.dateStr) return "past"
    if (m.meetingDate > nowIst.dateStr) return "upcoming"
    // Same date — check time in IST (meetingTime is already IST HH:MM from mapRowToMeeting)
    const [h, min] = m.meetingTime.split(":").map(Number)
    return (h * 60 + min) <= nowIst.minutes ? "past" : "today"
  }

  const past = meetings
    .filter((m) => categorize(m) === "past")
    .sort((a, b) =>
      b.meetingDate !== a.meetingDate
        ? b.meetingDate.localeCompare(a.meetingDate)   // most recent date first
        : b.meetingTime.localeCompare(a.meetingTime)   // latest time first within same date
    )

  const today = meetings
    .filter((m) => categorize(m) === "today")
    .sort((a, b) => a.meetingTime.localeCompare(b.meetingTime)) // earliest upcoming first

  const upcoming = meetings
    .filter((m) => categorize(m) === "upcoming")
    .sort((a, b) =>
      a.meetingDate !== b.meetingDate
        ? a.meetingDate.localeCompare(b.meetingDate)   // nearest date first
        : a.meetingTime.localeCompare(b.meetingTime)   // earliest time first within same date
    )

  const getStage = (m: Meeting) => stageMap[`${m.hospitalName}::${m.city}`]

  return (
    <div className="p-4 sm:p-6 h-full flex flex-col gap-4 sm:gap-5">

      {/* ── Header ── */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-[#E6EDF3]">Meetings</h1>
          {!loading && (
            <p className="text-[#8B949E] text-sm mt-0.5">
              {meetings.length} total · {today.length} today · {upcoming.length} upcoming
            </p>
          )}
        </div>
        <Button asChild style={{ background: "#58A6FF" }} className="text-white hover:opacity-90">
          <Link href="/create">
            <Plus className="w-4 h-4 mr-1.5" /> New Meeting
          </Link>
        </Button>
      </div>

      {/* ── Summary Stat Strip ── */}
      {!loading && (
        <div className="grid grid-cols-3 gap-3 shrink-0">
          {[
            { label: "Past",     count: past.length,     icon: <History  className="w-4 h-4" />, color: "#8B949E" },
            { label: "Today",    count: today.length,    icon: <Clock    className="w-4 h-4" />, color: "#22c55e" },
            { label: "Upcoming", count: upcoming.length, icon: <CalendarDays className="w-4 h-4" />, color: "#f59e0b" },
          ].map(({ label, count, icon, color }) => (
            <div
              key={label}
              className="flex items-center gap-3 px-4 py-3 rounded-xl"
              style={{ background: "#161B22", border: "1px solid #21262D" }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: `${color}18`, color }}
              >
                {icon}
              </div>
              <div>
                <p className="text-[#E6EDF3] text-xl font-bold leading-tight">{count}</p>
                <p className="text-[#8B949E] text-xs">{label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Kanban Columns ── */}
      {loading ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-[#58A6FF] border-t-transparent animate-spin" />
        </div>
      ) : (
        /* On mobile: horizontal scroll; on desktop: flex fill */
        <div className="flex gap-4 flex-1 min-h-0 overflow-x-auto pb-1 -mx-6 px-6 lg:mx-0 lg:px-0 lg:overflow-x-visible">
          <MeetingColumn
            title="Past"
            count={past.length}
            dotColor="#8B949E"
            accentColor="#8B949E"
            meetings={past}
            getStage={getStage}
            emptyLabel="No past meetings"
          />
          <MeetingColumn
            title="Today"
            count={today.length}
            dotColor="#22c55e"
            accentColor="#22c55e"
            meetings={today}
            getStage={getStage}
            emptyLabel="No meetings today"
          />
          <MeetingColumn
            title="Upcoming"
            count={upcoming.length}
            dotColor="#f59e0b"
            accentColor="#f59e0b"
            meetings={upcoming}
            getStage={getStage}
            emptyLabel="No upcoming meetings"
          />
        </div>
      )}
    </div>
  )
}

function MeetingColumn({
  title, count, dotColor, accentColor, meetings, getStage, emptyLabel,
}: {
  title: string
  count: number
  dotColor: string
  accentColor: string
  meetings: Meeting[]
  getStage: (m: Meeting) => DealStage | undefined
  emptyLabel: string
}) {
  return (
    <div
      className="flex-1 flex flex-col rounded-xl overflow-hidden"
      style={{ border: "1px solid #21262D", background: "#161B22", minWidth: "280px" }}
    >
      {/* Column header */}
      <div
        className="flex items-center gap-2.5 px-4 py-3.5 shrink-0"
        style={{ borderBottom: "1px solid #21262D", background: "#1C2128" }}
      >
        <span
          className="w-2.5 h-2.5 rounded-full shrink-0"
          style={{ background: dotColor, boxShadow: `0 0 8px ${dotColor}` }}
        />
        <span className="text-[#E6EDF3] text-sm font-bold">{title}</span>
        <span
          className="ml-auto text-xs font-bold px-2.5 py-0.5 rounded-full"
          style={{ background: `${accentColor}18`, color: accentColor }}
        >
          {count}
        </span>
      </div>

      {/* Scrollable list */}
      <div className="flex-1 overflow-y-auto">
        {meetings.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 gap-1">
            <p className="text-[#484F58] text-xs">{emptyLabel}</p>
          </div>
        ) : (
          meetings.map((m) => (
            <MeetingCard key={m.id} meeting={m} dealStage={getStage(m)} />
          ))
        )}
      </div>
    </div>
  )
}
