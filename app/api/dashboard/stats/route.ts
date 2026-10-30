import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

function getDateRange(range: string): { from: string; to: string } {
  const today = new Date()
  const to = today.toISOString().split("T")[0]
  const from = new Date(today)
  if (range === "week") from.setDate(today.getDate() - 6)
  else if (range === "quarter") from.setDate(today.getDate() - 89)
  else if (range === "all") from.setFullYear(2020, 0, 1)
  else from.setDate(1)
  return { from: from.toISOString().split("T")[0], to }
}

function groupByPeriod(
  meetings: { meeting_date: string }[],
  from: string,
  to: string,
): { period: string; count: number }[] {
  const daysDiff =
    (new Date(to).getTime() - new Date(from).getTime()) / (1000 * 60 * 60 * 24)
  const counts: Record<string, number> = {}
  for (const m of meetings) {
    const d = new Date(m.meeting_date)
    let key: string
    if (daysDiff <= 56) {
      const day = d.getDay()
      const monday = new Date(d)
      monday.setDate(d.getDate() - ((day + 6) % 7))
      key = monday.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })
    } else {
      key = d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" })
    }
    counts[key] = (counts[key] || 0) + 1
  }
  return Object.entries(counts)
    .map(([period, count]) => ({ period, count }))
    .sort((a, b) => a.period.localeCompare(b.period))
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get("user_id")
  const rangeParam = searchParams.get("range") || "month"
  if (!userId) return NextResponse.json({ error: "user_id required" }, { status: 400 })

  const { from, to } = getDateRange(rangeParam)
  const today = new Date().toISOString().split("T")[0]

  const [
    meetingsInRangeRes,
    allMeetingsRes,
    stagesRes,
    upcomingListRes,
    recentActivitiesRes,
  ] = await Promise.all([
    supabaseAdmin
      .from("meetings")
      .select("meeting_date, meeting_type, software_types, city")
      .eq("user_id", userId)
      .gte("meeting_date", from)
      .lte("meeting_date", to),
    supabaseAdmin
      .from("meetings")
      .select("id, meeting_date, software_types, city")
      .eq("user_id", userId),
    supabaseAdmin
      .from("deal_stages")
      .select("stage")
      .eq("user_id", userId),
    supabaseAdmin
      .from("meetings")
      .select("id, hospital_name, city, meeting_date, meeting_time, meeting_type, contact_name")
      .eq("user_id", userId)
      .gte("meeting_date", today)
      .order("meeting_date", { ascending: true })
      .order("meeting_time", { ascending: true })
      .limit(5),
    supabaseAdmin
      .from("crm_activities")
      .select("id, hospital_name, city, type, note, activity_date, meeting_id")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(8),
  ])

  const meetingsInRange = meetingsInRangeRes.data ?? []
  const allMeetings = allMeetingsRes.data ?? []
  const stages = stagesRes.data ?? []
  const upcomingList = upcomingListRes.data ?? []
  const recentActivities = recentActivitiesRes.data ?? []

  // Deal stage buckets
  const dealOutcomes = { won: 0, lost: 0, in_progress: 0, on_hold: 0 }
  const stageCounts: Record<string, number> = {}
  for (const s of stages) {
    if (s.stage === "won") dealOutcomes.won++
    else if (s.stage === "lost") dealOutcomes.lost++
    else if (s.stage === "on_hold") dealOutcomes.on_hold++
    else dealOutcomes.in_progress++
    stageCounts[s.stage] = (stageCounts[s.stage] || 0) + 1
  }

  const STAGE_ORDER = ["prospecting", "demo", "proposal", "negotiation", "won", "lost", "on_hold"]
  const pipelineByStage = STAGE_ORDER
    .filter((stage) => stageCounts[stage])
    .map((stage) => ({ stage, count: stageCounts[stage] }))

  const decided = dealOutcomes.won + dealOutcomes.lost
  const winRate = decided > 0 ? Math.round((dealOutcomes.won / decided) * 100) : 0

  // Meeting type breakdown (within selected range)
  const typeCounts: Record<string, number> = {}
  for (const m of meetingsInRange) {
    const t = m.meeting_type || "First meeting"
    typeCounts[t] = (typeCounts[t] || 0) + 1
  }
  const meetingTypes = Object.entries(typeCounts)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count)

  // Software type mix (all time — unnest the array per meeting)
  const softwareCounts: Record<string, number> = {}
  for (const m of allMeetings) {
    const types = Array.isArray(m.software_types) ? m.software_types : []
    for (const t of types) {
      if (t) softwareCounts[t] = (softwareCounts[t] || 0) + 1
    }
  }
  const softwareMix = Object.entries(softwareCounts)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)

  // Top cities (all time)
  const cityCounts: Record<string, number> = {}
  for (const m of allMeetings) {
    if (m.city) cityCounts[m.city] = (cityCounts[m.city] || 0) + 1
  }
  const topCities = Object.entries(cityCounts)
    .map(([city, count]) => ({ city, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6)

  return NextResponse.json({
    totalMeetings: allMeetings.length,
    wonDeals: dealOutcomes.won,
    upcomingMeetings: allMeetings.filter((m) => m.meeting_date >= today).length,
    winRate,
    activeAccounts: dealOutcomes.in_progress,
    dealOutcomes,
    meetingsPerPeriod: groupByPeriod(meetingsInRange, from, to),
    pipelineByStage,
    meetingTypes,
    softwareMix,
    topCities,
    upcomingList,
    recentActivities,
  })
}
