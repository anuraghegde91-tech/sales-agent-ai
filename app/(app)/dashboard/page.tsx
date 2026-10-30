"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts"
import { CalendarDays, Trophy, Clock, TrendingUp, Plus, Target } from "lucide-react"
import { CRM_COLORS, CRM_LABELS, DEAL_STAGES } from "@/lib/constants"

// ── Types ─────────────────────────────────────────────────────────────────

interface UpcomingMeeting {
  id: string
  hospital_name: string
  city: string
  meeting_date: string
  meeting_time: string
  meeting_type: string
  contact_name: string
}

interface RecentActivity {
  id: string
  hospital_name: string
  city: string
  type: string
  note: string
  activity_date: string
  meeting_id: string | null
}

interface Stats {
  totalMeetings: number
  wonDeals: number
  upcomingMeetings: number
  winRate: number
  activeAccounts: number
  dealOutcomes: { won: number; lost: number; in_progress: number; on_hold: number }
  meetingsPerPeriod: { period: string; count: number }[]
  pipelineByStage: { stage: string; count: number }[]
  meetingTypes: { type: string; count: number }[]
  softwareMix: { type: string; count: number }[]
  topCities: { city: string; count: number }[]
  upcomingList: UpcomingMeeting[]
  recentActivities: RecentActivity[]
}

// ── Constants ─────────────────────────────────────────────────────────────

const RANGE_OPTIONS = [
  { value: "week",    label: "This Week" },
  { value: "month",   label: "This Month" },
  { value: "quarter", label: "This Quarter" },
  { value: "all",     label: "All Time" },
]

const DEAL_OUTCOME_DATA = (o: Stats["dealOutcomes"]) =>
  [
    { name: "Won",         value: o.won,         color: "#22c55e" },
    { name: "Lost",        value: o.lost,        color: "#ef4444" },
    { name: "In Progress", value: o.in_progress, color: "#58A6FF" },
    { name: "On Hold",     value: o.on_hold,     color: "#f59e0b" },
  ].filter((d) => d.value > 0)

const MEETING_TYPE_COLORS: Record<string, string> = {
  "First meeting": "#58A6FF",
  "Follow-up":     "#3b82f6",
  "Demo":          "#8b5cf6",
  "Negotiation":   "#f97316",
}

const STAGE_COLOR_MAP = Object.fromEntries(DEAL_STAGES.map((s) => [s.value, s.color]))

const TOOLTIP_STYLE = {
  contentStyle: {
    background: "#21262D",
    border: "1px solid #30363D",
    borderRadius: 8,
    color: "#E6EDF3",
    fontSize: 12,
  },
}

// ── Helpers ───────────────────────────────────────────────────────────────

function utcToIst(t: string | null): string {
  if (!t) return "--:--"
  const [h, m] = t.split(":").map(Number)
  const d = new Date()
  d.setHours(h + 5, m + 30, 0)
  return d.toTimeString().slice(0, 5)
}

function relativeDate(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
  if (diff === 0) return "Today"
  if (diff === 1) return "Yesterday"
  if (diff < 7) return `${diff}d ago`
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })
}

// ── Shared small components ───────────────────────────────────────────────

function KpiCard({
  label, value, suffix = "", icon, color,
}: {
  label: string; value: number; suffix?: string; icon: React.ReactNode; color: string
}) {
  return (
    <Card style={{ background: "#161B22", border: "1px solid #21262D" }}>
      <CardContent className="p-5 flex items-center gap-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: `${color}20`, color }}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-[#8B949E] text-xs truncate">{label}</p>
          <p className="text-[#E6EDF3] text-2xl font-bold leading-tight">{value}{suffix}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function Section({
  title, subtitle, children, className = "",
}: {
  title: string; subtitle?: string; children: React.ReactNode; className?: string
}) {
  return (
    <Card style={{ background: "#161B22", border: "1px solid #21262D" }} className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-[#E6EDF3] text-sm font-semibold">{title}</CardTitle>
        {subtitle && <p className="text-[#8B949E] text-xs">{subtitle}</p>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

function Empty({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center h-32 text-[#8B949E] text-xs">{label}</div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter()
  const [userId, setUserId] = useState("")
  const [repName, setRepName] = useState("")
  const [range, setRange] = useState("month")
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push("/login"); return }
      setUserId(user.id)
      const { data: profile } = await supabase
        .from("profiles")
        .select("rep_name")
        .eq("id", user.id)
        .single()
      setRepName(profile?.rep_name || "")
    }
    init()
  }, [])

  useEffect(() => {
    if (!userId) return
    const loadStats = async () => {
      setLoading(true)
      const res = await fetch(`/api/dashboard/stats?user_id=${userId}&range=${range}`)
      const json = await res.json()
      setStats(json)
      setLoading(false)
    }
    loadStats()
  }, [userId, range])

  const firstName = repName.split(" ")[0] || "there"

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 min-h-screen">

      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div
          className="inline-flex items-center px-5 py-2 rounded-full border text-[#E6EDF3] font-medium text-base"
          style={{ background: "#161B22", borderColor: "#30363D" }}
        >
          Hello, {firstName} 👋
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setRange(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                range === opt.value
                  ? "text-[#E6EDF3]"
                  : "text-[#8B949E] hover:text-[#E6EDF3] hover:bg-[#21262D]"
              }`}
              style={range === opt.value ? { background: "#21262D" } : {}}
            >
              {opt.label}
            </button>
          ))}
          <Button asChild size="sm" style={{ background: "#58A6FF" }} className="text-white hover:opacity-90 ml-1">
            <Link href="/create">
              <Plus className="w-3.5 h-3.5 mr-1" /> New Meeting
            </Link>
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 rounded-full border-2 border-[#58A6FF] border-t-transparent animate-spin" />
        </div>
      ) : !stats ? null : (
        <>
          {/* ── KPI Row ── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <KpiCard label="Total Meetings"   value={stats.totalMeetings}   icon={<CalendarDays className="w-5 h-5" />} color="#58A6FF" />
            <KpiCard label="Win Rate"         value={stats.winRate}         suffix="%" icon={<TrendingUp className="w-5 h-5" />} color="#22c55e" />
            <KpiCard label="Active Accounts"  value={stats.activeAccounts}  icon={<Target className="w-5 h-5" />}      color="#8b5cf6" />
            <KpiCard label="Won Deals"        value={stats.wonDeals}        icon={<Trophy className="w-5 h-5" />}      color="#22c55e" />
            <KpiCard label="Upcoming"         value={stats.upcomingMeetings} icon={<Clock className="w-5 h-5" />}     color="#f59e0b" />
          </div>

          {/* ── Row 2: Meetings Over Time + Sales Pipeline ── */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            <Section
              className="lg:col-span-3"
              title="Meetings Over Time"
              subtitle="Meetings scheduled in the selected period"
            >
              {stats.meetingsPerPeriod.length === 0 ? (
                <Empty label="No meetings in this period" />
              ) : (
                <ResponsiveContainer width="100%" height={230}>
                  <BarChart data={stats.meetingsPerPeriod} barCategoryGap="40%">
                    <CartesianGrid strokeDasharray="3 3" stroke="#21262D" vertical={false} />
                    <XAxis dataKey="period" tick={{ fill: "#8B949E", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#8B949E", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip {...TOOLTIP_STYLE} cursor={{ fill: "#ffffff10" }} />
                    <Bar dataKey="count" name="Meetings" fill="#58A6FF" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Section>

            <Section
              className="lg:col-span-2"
              title="Sales Pipeline"
              subtitle="Active accounts by deal stage"
            >
              {stats.pipelineByStage.length === 0 ? (
                <Empty label="No deal stages tracked yet" />
              ) : (
                <ResponsiveContainer width="100%" height={230}>
                  <BarChart data={stats.pipelineByStage} layout="vertical" barCategoryGap="28%">
                    <CartesianGrid strokeDasharray="3 3" stroke="#21262D" horizontal={false} />
                    <XAxis type="number" tick={{ fill: "#8B949E", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <YAxis
                      type="category"
                      dataKey="stage"
                      tick={{ fill: "#8B949E", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      width={82}
                      tickFormatter={(v) => DEAL_STAGES.find((s) => s.value === v)?.label ?? v}
                    />
                    <Tooltip
                      {...TOOLTIP_STYLE}
                      cursor={{ fill: "#ffffff10" }}
                      formatter={(v) => [v, "Accounts"]}
                      labelFormatter={(l) => DEAL_STAGES.find((s) => s.value === l)?.label ?? l}
                    />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                      {stats.pipelineByStage.map((entry, i) => (
                        <Cell key={i} fill={STAGE_COLOR_MAP[entry.stage] ?? "#58A6FF"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Section>
          </div>

          {/* ── Row 3: Deal Outcomes + Meeting Types + Software Mix ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            {/* Deal Outcomes */}
            <Section title="Deal Outcomes" subtitle="Win/loss ratio across all accounts">
              {DEAL_OUTCOME_DATA(stats.dealOutcomes).length === 0 ? (
                <Empty label="No deal data yet" />
              ) : (
                <ResponsiveContainer width="100%" height={210}>
                  <PieChart>
                    <Pie
                      data={DEAL_OUTCOME_DATA(stats.dealOutcomes)}
                      cx="50%"
                      cy="50%"
                      innerRadius={52}
                      outerRadius={78}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {DEAL_OUTCOME_DATA(stats.dealOutcomes).map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip {...TOOLTIP_STYLE} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: "#8B949E" }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </Section>

            {/* Meeting Types */}
            <Section title="Meeting Types" subtitle="Breakdown for the selected period">
              {stats.meetingTypes.length === 0 ? (
                <Empty label="No meetings in this period" />
              ) : (
                <ResponsiveContainer width="100%" height={210}>
                  <BarChart data={stats.meetingTypes} layout="vertical" barCategoryGap="25%">
                    <CartesianGrid strokeDasharray="3 3" stroke="#21262D" horizontal={false} />
                    <XAxis type="number" tick={{ fill: "#8B949E", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <YAxis
                      type="category"
                      dataKey="type"
                      tick={{ fill: "#8B949E", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      width={88}
                    />
                    <Tooltip {...TOOLTIP_STYLE} cursor={{ fill: "#ffffff10" }} formatter={(v) => [v, "Meetings"]} />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                      {stats.meetingTypes.map((entry, i) => (
                        <Cell key={i} fill={MEETING_TYPE_COLORS[entry.type] ?? "#58A6FF"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Section>

            {/* Software Mix */}
            <Section title="Software Mix" subtitle="Products pitched (all time)">
              {stats.softwareMix.length === 0 ? (
                <Empty label="No software data yet" />
              ) : (
                <ResponsiveContainer width="100%" height={210}>
                  <BarChart data={stats.softwareMix} layout="vertical" barCategoryGap="25%">
                    <CartesianGrid strokeDasharray="3 3" stroke="#21262D" horizontal={false} />
                    <XAxis type="number" tick={{ fill: "#8B949E", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <YAxis
                      type="category"
                      dataKey="type"
                      tick={{ fill: "#8B949E", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      width={42}
                    />
                    <Tooltip {...TOOLTIP_STYLE} cursor={{ fill: "#ffffff10" }} formatter={(v) => [v, "Meetings"]} />
                    <Bar dataKey="count" fill="#14b8a6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Section>
          </div>

          {/* ── Row 4: Territory Coverage ── */}
          {stats.topCities.length > 0 && (() => {
            const totalCities  = stats.topCities.length
            const topCity      = stats.topCities[0]
            const totalInCities = stats.topCities.reduce((s, c) => s + c.count, 0)
            const maxCount     = topCity?.count || 1
            return (
              <Section title="Territory Coverage" subtitle="Geographic distribution of your meetings">
                {/* Summary KPIs */}
                <div className="grid grid-cols-3 gap-3 mb-5">
                  {[
                    { label: "Cities Covered",   value: totalCities,            color: "#3FB950" },
                    { label: "Top City",          value: topCity?.city || "—",  color: "#f59e0b" },
                    { label: "Multi-City Meetings", value: totalInCities,        color: "#58A6FF" },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="rounded-xl p-3 text-center" style={{ background: "#0D1117", border: "1px solid #21262D" }}>
                      <p className="text-lg font-bold" style={{ color }}>{value}</p>
                      <p className="text-[#484F58] text-[10px] uppercase tracking-wider mt-0.5">{label}</p>
                    </div>
                  ))}
                </div>

                {/* City breakdown bars */}
                <div className="space-y-2.5">
                  {stats.topCities.map((c, i) => {
                    const pct = Math.round((c.count / maxCount) * 100)
                    const colors = ["#f59e0b", "#58A6FF", "#3FB950", "#8b5cf6", "#14b8a6", "#f97316", "#ec4899", "#06b6d4"]
                    const color = colors[i % colors.length]
                    return (
                      <div key={c.city} className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 text-[10px] font-bold" style={{ background: `${color}18`, color }}>
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[#C9D1D9] text-xs font-medium truncate">{c.city}</span>
                            <span className="text-[#8B949E] text-xs shrink-0 ml-2">{c.count} meeting{c.count !== 1 ? "s" : ""}</span>
                          </div>
                          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#21262D" }}>
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{ width: `${pct}%`, background: color }}
                            />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </Section>
            )
          })()}

          {/* ── Row 5: Top Cities Chart + Upcoming Meetings ── */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

            {/* Top Cities */}
            <Section
              className="lg:col-span-2"
              title="Top Cities"
              subtitle="Most active locations (all time)"
            >
              {stats.topCities.length === 0 ? (
                <Empty label="No location data yet" />
              ) : (
                <ResponsiveContainer width="100%" height={230}>
                  <BarChart data={stats.topCities} layout="vertical" barCategoryGap="25%">
                    <CartesianGrid strokeDasharray="3 3" stroke="#21262D" horizontal={false} />
                    <XAxis type="number" tick={{ fill: "#8B949E", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <YAxis
                      type="category"
                      dataKey="city"
                      tick={{ fill: "#8B949E", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      width={72}
                    />
                    <Tooltip {...TOOLTIP_STYLE} cursor={{ fill: "#ffffff10" }} formatter={(v) => [v, "Meetings"]} />
                    <Bar dataKey="count" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Section>

            {/* Upcoming Meetings */}
            <Section
              className="lg:col-span-3"
              title="Upcoming Meetings"
              subtitle="Next scheduled appointments"
            >
              {stats.upcomingList.length === 0 ? (
                <Empty label="No upcoming meetings scheduled" />
              ) : (
                <div className="space-y-2">
                  {stats.upcomingList.map((m) => (
                    <Link
                      key={m.id}
                      href={`/meetings/${m.id}`}
                      className="flex items-center gap-3 p-3 rounded-lg transition-colors hover:bg-[#21262D]"
                      style={{ border: "1px solid #21262D" }}
                    >
                      <div className="w-10 shrink-0 text-center">
                        <p className="text-[#58A6FF] text-[10px] font-bold uppercase leading-tight">
                          {new Date(m.meeting_date).toLocaleDateString("en-IN", { month: "short" })}
                        </p>
                        <p className="text-[#E6EDF3] text-xl font-bold leading-tight">
                          {new Date(m.meeting_date).getDate()}
                        </p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[#E6EDF3] text-sm font-semibold truncate">{m.hospital_name}</p>
                        <p className="text-[#8B949E] text-xs truncate">{m.city} · {m.contact_name}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-full"
                          style={{ background: "#58A6FF20", color: "#58A6FF" }}
                        >
                          {m.meeting_type}
                        </span>
                        <p className="text-[#8B949E] text-xs mt-1">{utcToIst(m.meeting_time)}</p>
                      </div>
                    </Link>
                  ))}
                  {stats.upcomingMeetings > 5 && (
                    <Link
                      href="/meetings"
                      className="flex items-center justify-center text-xs text-[#58A6FF] hover:opacity-80 pt-1"
                    >
                      View all {stats.upcomingMeetings} upcoming →
                    </Link>
                  )}
                </div>
              )}
            </Section>
          </div>

          {/* ── Row 5: Recent CRM Activity ── */}
          <Section title="Recent CRM Activity" subtitle="Latest logged events across all accounts">
            {stats.recentActivities.length === 0 ? (
              <Empty label="No CRM activity logged yet" />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {stats.recentActivities.map((a) => {
                  const color = CRM_COLORS[a.type] ?? "#8B949E"
                  const label = CRM_LABELS[a.type] ?? a.type
                  return (
                    <div
                      key={a.id}
                      className="p-3 rounded-lg space-y-1.5"
                      style={{ background: "#0D1117", border: "1px solid #21262D" }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-full truncate"
                          style={{ background: `${color}20`, color }}
                        >
                          {label}
                        </span>
                        <span className="text-[#484F58] text-[10px] shrink-0">
                          {relativeDate(a.activity_date)}
                        </span>
                      </div>
                      <p className="text-[#E6EDF3] text-xs font-semibold truncate">{a.hospital_name}</p>
                      <p className="text-[#8B949E] text-[10px] truncate">{a.city}</p>
                      {a.note && (
                        <p className="text-[#8B949E] text-[10px] line-clamp-2">{a.note}</p>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </Section>
        </>
      )}
    </div>
  )
}
