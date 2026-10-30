"use client"

import { useState, useEffect } from "react"
import { Clock, Pencil, Trash2, GripVertical, Check, X } from "lucide-react"
import { Sidebar } from "@/components/shared/sidebar"
import { MapEmbed } from "@/components/shared/map-embed"
import { type DealStage, DEAL_STAGES, DEAL_STAGE_COLORS, CRM_COLORS, CRM_LABELS } from "@/lib/constants"

interface CRMEntry {
  date: string
  type: "brief" | "call" | "demo" | "contract" | "note" | "meeting_done" | "proposal" | "followup" | "next_meeting" | "won" | "lost" | "on_hold" | "terminated" | "stage_change"
  note: string
}

interface DesktopBriefScreenProps {
  meetings?: any[]
  selectedIndex?: number
  onSelectMeeting?: (index: number) => void
  onAddMeeting?: () => void
  onEditMeeting?: () => void
  onLogout?: () => void
  repName?: string
  repDesignation?: string
  repWhatsapp?: string
  userId?: string
  hideSidebar?: boolean
}

const CARD_STYLE = { background: "#161B22", border: "1px solid #21262D" }
const SUB_STYLE  = { background: "#0D1117", border: "1px solid #21262D" }

const NOTE_TYPES: { value: CRMEntry["type"]; label: string }[] = [
  { value: "meeting_done", label: "Meeting Done" },
  { value: "call",         label: "Call" },
  { value: "demo",         label: "Demo" },
  { value: "proposal",     label: "Proposal" },
  { value: "note",         label: "Note" },
  { value: "won",          label: "Won" },
  { value: "lost",         label: "Lost" },
]

export function DesktopBriefScreen({
  meetings = [],
  selectedIndex = 0,
  onSelectMeeting = () => {},
  onAddMeeting = () => {},
  onEditMeeting = () => {},
  onLogout = () => {},
  repName = "Sales Rep",
  repDesignation = "Field Sales Executive",
  repWhatsapp = "",
  userId = "",
  hideSidebar = false,
}: DesktopBriefScreenProps) {
  const r = meetings[selectedIndex] || ({} as any)
  const brief = r?.brief || null
  const hospitalName = r?.hospitalName || "Hospital"
  const city = r?.city || ""
  const contactName = r?.contactName || "Contact"
  const contactDesignation = r?.contactDesignation || ""
  const meetingTime = r?.meetingTime || ""
  const meetingDate = r?.meetingDate || ""
  const hospitalImage = r?.hospitalImage || null
  const hospitalUrl = r?.hospitalUrl || null

  const contactInitials = contactName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()

  // True only after the meeting date+time (IST) has passed
  const isMeetingDone = (() => {
    if (!meetingDate || !meetingTime) return false
    const ist = new Date(Date.now() + 330 * 60 * 1000) // shift to IST
    const todayStr = ist.toISOString().slice(0, 10)
    if (meetingDate < todayStr) return true
    if (meetingDate > todayStr) return false
    const [h, m] = meetingTime.split(":").map(Number)
    return h * 60 + m <= ist.getUTCHours() * 60 + ist.getUTCMinutes()
  })()

  const [crmEntries, setCrmEntries] = useState<CRMEntry[]>([])
  const [dealStage, setDealStage] = useState<DealStage>("prospecting")
  const [addingNote, setAddingNote] = useState(false)
  const [noteText, setNoteText] = useState("")
  const [noteType, setNoteType] = useState<CRMEntry["type"]>("meeting_done")
  const [nextMeetingDate, setNextMeetingDate] = useState("")
  const [nextMeetingTime, setNextMeetingTime] = useState("")
  const [nextMeetingTopic, setNextMeetingTopic] = useState("")
  const [addingNextMeeting, setAddingNextMeeting] = useState(false)
  const [followupMeetings, setFollowupMeetings] = useState<{ id: string; date: string; time: string; topic: string }[]>([])
  const [isMobile, setIsMobile] = useState(false)
  const [editingIdx, setEditingIdx] = useState<number | null>(null)
  const [editText, setEditText] = useState("")
  const [dragSrcIdx, setDragSrcIdx] = useState<number | null>(null)
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null)
  const [dragOverStageIdx, setDragOverStageIdx] = useState<number | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ index: number; isStage: boolean; childCount: number } | null>(null)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  useEffect(() => {
    if (!hospitalName || !city || !userId) return
    const load = async () => {
      const { supabase } = await import("@/lib/supabase")

      const { data: rows } = await supabase
        .from("crm_activities")
        .select("*")
        .eq("user_id", userId)
        .eq("hospital_name", hospitalName)
        .eq("city", city)
        .order("sort_order")
      setCrmEntries(
        (rows ?? []).map((r: any) => ({ date: r.activity_date, type: r.type as CRMEntry["type"], note: r.note }))
      )

      const { data: stageRow } = await supabase
        .from("deal_stages")
        .select("stage")
        .eq("user_id", userId)
        .eq("hospital_name", hospitalName)
        .eq("city", city)
        .maybeSingle()
      setDealStage((stageRow?.stage as DealStage) || "prospecting")

      if (r?.id) {
        const { data: followups } = await supabase
          .from("meetings")
          .select("id, meeting_date, meeting_time, pitch_point")
          .eq("parent_meeting_id", r.id)
          .order("meeting_date", { ascending: true })
        setFollowupMeetings(
          (followups ?? []).map((f: any) => ({
            id: f.id,
            date: f.meeting_date || "",
            time: f.meeting_time || "",
            topic: f.pitch_point || "",
          }))
        )
      } else {
        setFollowupMeetings([])
      }
    }
    load()
  }, [hospitalName, city, userId, meetingDate, r?.id])

  async function persistCRM(entries: CRMEntry[]) {
    if (!userId || !hospitalName || !city) return
    const { supabase } = await import("@/lib/supabase")
    await supabase.from("crm_activities").delete().match({ user_id: userId, hospital_name: hospitalName, city })
    if (entries.length > 0) {
      await supabase.from("crm_activities").insert(
        entries.map((e, i) => ({
          user_id: userId, hospital_name: hospitalName, city,
          activity_date: e.date, type: e.type, note: e.note, sort_order: i,
        }))
      )
    }
  }

  function handleAddNote() {
    if (!noteText.trim()) return
    const today = new Date().toISOString().split("T")[0]
    const stageLabel = DEAL_STAGES.find(s => s.value === dealStage)?.label || dealStage
    const newEntry: CRMEntry = { date: today, type: noteType, note: noteText.trim() }
    const latestStageIdx = crmEntries.findIndex(e => e.type === "stage_change")
    const latestStageLabel = latestStageIdx >= 0 ? crmEntries[latestStageIdx].note : null
    let updated: CRMEntry[]
    if (latestStageLabel === stageLabel) {
      updated = [...crmEntries.slice(0, latestStageIdx + 1), newEntry, ...crmEntries.slice(latestStageIdx + 1)].slice(0, 50)
    } else {
      const stageEntry: CRMEntry = { date: today, type: "stage_change", note: stageLabel }
      updated = [stageEntry, newEntry, ...crmEntries].slice(0, 50)
    }
    persistCRM(updated)
    setCrmEntries(updated)
    setNoteText("")
    setAddingNote(false)
  }

  function getStageChildIndices(entries: CRMEntry[], stageIdx: number): number[] {
    const indices = [stageIdx]
    for (let j = stageIdx + 1; j < entries.length; j++) {
      if (entries[j].type === "stage_change") break
      indices.push(j)
    }
    return indices
  }

  function requestDelete(i: number) {
    const isStage = crmEntries[i].type === "stage_change"
    const childCount = isStage ? getStageChildIndices(crmEntries, i).length - 1 : 0
    setDeleteConfirm({ index: i, isStage, childCount })
  }

  function removeOrphanedStageHeaders(entries: CRMEntry[]): CRMEntry[] {
    return entries.filter((entry, i) => {
      if (entry.type !== "stage_change") return true
      const nextStageIdx = entries.findIndex((e, j) => j > i && e.type === "stage_change")
      const endIdx = nextStageIdx === -1 ? entries.length : nextStageIdx
      return endIdx > i + 1
    })
  }

  function confirmDelete() {
    if (deleteConfirm === null) return
    let updated: CRMEntry[]
    if (deleteConfirm.isStage) {
      const toRemove = new Set(getStageChildIndices(crmEntries, deleteConfirm.index))
      updated = crmEntries.filter((_, j) => !toRemove.has(j))
    } else {
      updated = crmEntries.filter((_, j) => j !== deleteConfirm.index)
      updated = removeOrphanedStageHeaders(updated)
    }
    persistCRM(updated)
    setCrmEntries(updated)
    setDeleteConfirm(null)
  }

  function handleStartEdit(i: number) {
    setEditingIdx(i)
    setEditText(crmEntries[i].note)
  }

  function handleSaveEdit(i: number) {
    if (!editText.trim()) return
    const updated = crmEntries.map((e, j) => j === i ? { ...e, note: editText.trim() } : e)
    persistCRM(updated)
    setCrmEntries(updated)
    setEditingIdx(null)
    setEditText("")
  }

  function handleReorder(from: number, to: number) {
    if (from === to) return
    const updated = [...crmEntries]
    const [removed] = updated.splice(from, 1)
    updated.splice(to, 0, removed)
    persistCRM(updated)
    setCrmEntries(updated)
    setDragSrcIdx(null)
    setDragOverIdx(null)
    setDragOverStageIdx(null)
  }

  function handleDropOnStage(stageIdx: number) {
    if (dragSrcIdx === null) return
    const updated = [...crmEntries]
    const [removed] = updated.splice(dragSrcIdx, 1)
    const adjusted = stageIdx > dragSrcIdx ? stageIdx - 1 : stageIdx
    updated.splice(adjusted + 1, 0, removed)
    persistCRM(updated)
    setCrmEntries(updated)
    setDragSrcIdx(null)
    setDragOverIdx(null)
    setDragOverStageIdx(null)
  }

  function clearDrag() {
    setDragSrcIdx(null)
    setDragOverIdx(null)
    setDragOverStageIdx(null)
  }

  async function handleStageChange(stage: DealStage) {
    setDealStage(stage)
    if (userId) {
      const { supabase } = await import("@/lib/supabase")
      await supabase.from("deal_stages").upsert(
        { user_id: userId, hospital_name: hospitalName, city, stage },
        { onConflict: "user_id,hospital_name,city" }
      )
    }
  }

  async function handleSaveNextMeeting() {
    if (!nextMeetingDate || !nextMeetingTime) return
    const istDate = new Date(nextMeetingDate + "T" + nextMeetingTime)
    const utcDate = new Date(istDate.getTime() - 330 * 60000)
    const utcTime = utcDate.toTimeString().slice(0, 5)
    const { supabase } = await import("@/lib/supabase")
    await supabase.from("meetings").insert({
      user_id: userId || undefined,
      rep_name: repName, rep_whatsapp: repWhatsapp,
      hospital_name: hospitalName, city,
      contact_name: contactName, contact_designation: contactDesignation || null,
      software_types: Array.isArray(r?.softwareTypes) ? r.softwareTypes : [],
      meeting_date: nextMeetingDate, meeting_time: utcTime,
      meeting_type: "Follow-up", pitch_point: nextMeetingTopic,
      live_signal: brief?.intelligenceSignals?.[0]?.signal || "",
      reminder_sent: false, source: "followup",
      parent_meeting_id: r?.id || null, brief_json: brief || null,
    })
    setFollowupMeetings(prev => [...prev, { id: "", date: nextMeetingDate, time: nextMeetingTime, topic: nextMeetingTopic }])
    setNextMeetingDate("")
    setNextMeetingTime("")
    setNextMeetingTopic("")
    setAddingNextMeeting(false)
  }

  const noSignals =
    !brief?.intelligenceSignals ||
    brief?.intelligenceSignals?.length === 0 ||
    brief?.intelligenceSignals?.every(
      (s: any) => s.signal?.includes("No public") || s.signal?.includes("No reliable")
    )

  const currentStage = DEAL_STAGES.find(s => s.value === dealStage)
  const currentStageDark = DEAL_STAGE_COLORS[dealStage]
  const activeStages: DealStage[] = ["prospecting", "demo", "proposal", "negotiation"]
  const stageIndex = activeStages.indexOf(dealStage)

  // ── Mobile view ───────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <div className="min-h-screen p-4 space-y-4" style={{ background: "#0D1117" }}>
        <div className="rounded-2xl p-4" style={CARD_STYLE}>
          <h1 className="text-xl font-extrabold text-[#E6EDF3]">{hospitalName}</h1>
          <p className="text-sm text-[#8B949E] mt-1">{contactName}{contactDesignation ? `, ${contactDesignation}` : ""}</p>
          <p className="text-sm text-[#8B949E]">{meetingTime}{meetingDate ? ` · ${meetingDate.split("-").reverse().join("-")}` : ""}</p>
        </div>

        <div className="rounded-2xl p-4" style={CARD_STYLE}>
          <p className="text-xs font-bold text-[#8B949E] uppercase tracking-wider mb-3">Hospital Profile</p>
          <p className="text-[#E6EDF3] text-sm font-bold">{brief?.hospitalOverview?.summary?.slice(0, 80) || "Multi-Specialty Hospital"}</p>
          <p className="text-[#8B949E] text-sm mt-1">{brief?.hospitalOverview?.beds ? `${brief.hospitalOverview.beds} Beds` : ""}{city ? ` · ${city}` : ""}</p>
          <div className="grid grid-cols-2 gap-2 mt-3">
            <div className="rounded-xl p-2" style={SUB_STYLE}>
              <p className="text-[#6B7280] text-[10px] uppercase font-semibold mb-1">Ownership</p>
              <p className="text-[#E6EDF3] text-xs font-semibold">{brief?.hospitalOverview?.keyFacts?.[1] || "Private"}</p>
            </div>
            <div className="rounded-xl p-2" style={SUB_STYLE}>
              <p className="text-[#6B7280] text-[10px] uppercase font-semibold mb-1">Accreditation</p>
              <p className="text-[#E6EDF3] text-xs font-semibold">{brief?.hospitalOverview?.keyFacts?.[2] || "-"}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl p-4" style={{ background: "#0d2818", border: "1px solid #1a4a2a" }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[#86efac] text-sm font-semibold">Your Pitch</span>
            <span className="bg-[#22c55e] text-white text-xs font-bold px-2 py-0.5 rounded-lg">PRIORITY</span>
          </div>
          <p className="text-[#6b7fa3] text-[10px] uppercase tracking-wider mb-1">The Hook</p>
          <p className="text-white text-base font-bold leading-snug mb-4">{brief?.recommendedApproach?.openingLine?.slice(0, 100) || "Lead with impact"}</p>
          {brief?.talkingPoints?.slice(0, 3).map((tp: any, i: number) => (
            <div key={i} className="flex items-start gap-2 mb-2">
              <div className="w-4 h-4 rounded-full bg-[#166534] flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg width="8" height="8" viewBox="0 0 10 10" fill="none"><path d="M2 5l2 2 4-4" stroke="#4ade80" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <p className="text-[#d1fae5] text-sm">{tp.point}</p>
            </div>
          ))}
        </div>

        {brief?.discoveryQuestions?.length > 0 && (
          <div className="rounded-2xl p-4" style={CARD_STYLE}>
            <p className="text-xs font-bold text-[#8B949E] uppercase tracking-wider mb-3">Discovery Questions</p>
            <div className="space-y-2">
              {brief.discoveryQuestions.slice(0, 4).map((q: string, i: number) => (
                <div key={i} className="flex gap-2 p-3 rounded-xl" style={SUB_STYLE}>
                  <span className="text-[#58A6FF] text-sm font-bold flex-shrink-0">Q{i + 1}</span>
                  <p className="text-[#C9D1D9] text-sm">{q}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {brief?.painPoints?.length > 0 && (
          <div className="rounded-2xl p-4 pb-8" style={CARD_STYLE}>
            <p className="text-xs font-bold text-[#8B949E] uppercase tracking-wider mb-3">Pain Points</p>
            <div className="space-y-2">
              {brief.painPoints.slice(0, 3).map((p: any, i: number) => (
                <div key={i} className="flex gap-3 p-3 rounded-xl" style={SUB_STYLE}>
                  <span className="w-2 h-2 rounded-full bg-[#58A6FF] flex-shrink-0 mt-1.5" />
                  <div>
                    <p className="text-[#E6EDF3] text-sm font-semibold">{p.pain}</p>
                    <p className="text-[#8B949E] text-xs mt-0.5">{p.evidence}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── Desktop view ──────────────────────────────────────────────────────────
  const mainContent = (
    <>
      {/* Mobile: plain block. Desktop: flex column filling the fixed-height parent. */}
      <div className="lg:flex-1 lg:flex lg:flex-col lg:overflow-hidden">

        {/* Header */}
        <header className="px-4 sm:px-8 py-4 sm:py-5 flex items-start justify-between gap-3 shrink-0 flex-wrap" style={{ borderBottom: "1px solid #21262D", background: "#0D1117" }}>
          <div>
            <h1 className="text-3xl font-extrabold text-[#E6EDF3] leading-tight">{hospitalName}</h1>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {brief?.hospitalOverview?.beds && (
                <span className="text-xs px-2.5 py-1 rounded-full font-semibold" style={{ background: "#22c55e18", color: "#4ade80" }}>
                  {brief.hospitalOverview.beds} beds
                </span>
              )}
              {city && (
                <span className="text-xs px-2.5 py-1 rounded-full font-semibold" style={{ background: "#f59e0b18", color: "#fbbf24" }}>
                  {city}
                </span>
              )}
              {r?.softwareType && (
                <span className="text-xs px-2.5 py-1 rounded-full font-semibold" style={{ background: "#58A6FF18", color: "#58A6FF" }}>
                  {r.softwareType}
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 mt-2 text-sm text-[#8B949E]">
              <span className="flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="6" r="3" stroke="#8B949E" strokeWidth="1.4"/><path d="M2 14c0-3.3 2.7-5 6-5s6 1.7 6 5" stroke="#8B949E" strokeWidth="1.4" strokeLinecap="round"/></svg>
                {contactName}{contactDesignation ? `, ${contactDesignation}` : ""}
              </span>
              <span className="text-[#30363D]">·</span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                {meetingTime}{meetingDate && ` · ${meetingDate.split("-").reverse().join("-")}`}
              </span>
            </div>
          </div>
          <div className="flex gap-2 mt-1">
            <button
              type="button"
              onClick={onEditMeeting}
              className="flex items-center gap-2 px-4 py-2 text-[#C9D1D9] text-sm font-medium rounded-lg transition-colors hover:bg-[#21262D] cursor-pointer"
              style={{ border: "1px solid #30363D" }}
            >
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M11 2l3 3-9 9H2v-3L11 2z" stroke="#C9D1D9" strokeWidth="1.4" strokeLinejoin="round"/></svg>
              Edit Meeting
            </button>
          </div>
        </header>

        {/* Mobile: natural block. Desktop: side-by-side row with independent scroll zones. */}
        <div className="lg:flex lg:flex-row lg:flex-1 lg:overflow-hidden">
          <main className="lg:flex-1 lg:overflow-auto">
            <div className="p-4 sm:p-8 space-y-5 sm:space-y-6">

              {/* Hospital not found warning */}
              {!brief?.hospitalOverview?.beds && noSignals && (
                <div className="rounded-xl px-5 py-3" style={{ background: "#2d1b0a", border: "1px solid #78350f" }}>
                  <p className="text-[#fbbf24] text-sm font-semibold">Hospital not found in public records</p>
                  <p className="text-[#d97706] text-xs mt-1">Verify hospital name and city before this meeting.</p>
                </div>
              )}

              {/* Row 1: Hospital Profile + CRM History */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">

                {/* Hospital Profile */}
                <div className="rounded-2xl p-6" style={CARD_STYLE}>
                  <div className="flex items-center justify-between mb-5">
                    <SectionLabel icon={
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><rect x="2" y="4" width="12" height="10" rx="1" stroke="#58A6FF" strokeWidth="1.4"/><path d="M5 4V3a3 3 0 016 0v1" stroke="#58A6FF" strokeWidth="1.4"/></svg>
                    } label="Hospital Profile" color="#58A6FF" />
                    {hospitalUrl && (
                      <a href={hospitalUrl} target="_blank" rel="noopener noreferrer"
                        className="text-[#58A6FF] text-xs font-semibold hover:opacity-80 flex items-center gap-1">
                        <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 10L10 2M10 2H5M10 2V7" stroke="#58A6FF" strokeWidth="1.5" strokeLinecap="round"/></svg>
                        View Hospital
                      </a>
                    )}
                  </div>
                  <div className="flex gap-4 mb-5">
                    {hospitalImage ? (
                      <img src={hospitalImage} alt={hospitalName} className="w-24 h-20 rounded-xl object-cover flex-shrink-0" style={{ border: "1px solid #30363D" }} />
                    ) : (
                      <div className="w-24 h-20 rounded-xl flex-shrink-0 flex items-center justify-center" style={SUB_STYLE}>
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><rect x="3" y="6" width="18" height="15" rx="1" stroke="#484F58" strokeWidth="1.5"/><path d="M8 6V5a4 4 0 018 0v1" stroke="#484F58" strokeWidth="1.5"/></svg>
                      </div>
                    )}
                    <div>
                      <p className="text-[#6B7280] text-[10px] uppercase tracking-wider font-semibold mb-1">Facility</p>
                      <p className="text-[#E6EDF3] text-base font-bold leading-snug">{brief?.hospitalOverview?.summary?.slice(0, 55) || "Multi-Specialty Hospital"}</p>
                      <p className="text-[#8B949E] text-sm mt-1.5">{brief?.hospitalOverview?.beds ? `${brief.hospitalOverview.beds} Beds` : "—"}{city ? ` · ${city}` : ""}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl p-3" style={SUB_STYLE}>
                      <p className="text-[#6B7280] text-[10px] uppercase tracking-wider font-semibold mb-1.5">Ownership</p>
                      <p className="text-[#E6EDF3] text-sm font-semibold leading-snug">{brief?.hospitalOverview?.keyFacts?.[1] || "Private"}</p>
                    </div>
                    <div className="rounded-xl p-3" style={SUB_STYLE}>
                      <p className="text-[#6B7280] text-[10px] uppercase tracking-wider font-semibold mb-1.5">Accreditation</p>
                      <p className="text-[#E6EDF3] text-sm font-semibold">{brief?.hospitalOverview?.keyFacts?.[2] || "Check before meeting"}</p>
                    </div>
                  </div>
                </div>

                {/* CRM History */}
                <div className="rounded-2xl p-6" style={CARD_STYLE}>
                  <SectionLabel icon={
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="#f59e0b" strokeWidth="1.4"/><path d="M8 5v3.5l2 1.5" stroke="#f59e0b" strokeWidth="1.4" strokeLinecap="round"/></svg>
                  } label="CRM History" color="#f59e0b" className="mb-4" />

                  {crmEntries.length === 0 ? (
                    <div>
                      {addingNote && <NoteForm noteText={noteText} setNoteText={setNoteText} noteType={noteType} setNoteType={setNoteType} onSave={handleAddNote} onCancel={() => setAddingNote(false)} accentColor="#58A6FF" />}
                      <div className="text-center py-8 text-[#484F58] text-sm">No history yet.</div>
                    </div>
                  ) : (
                    <div className="max-h-[260px] overflow-y-auto space-y-3 pr-1">
                      {(() => {
                        const groups: { stageIdx: number; stageName: string; date: string; stageColor: string; stageBg: string; children: { entry: CRMEntry; idx: number }[] }[] = []
                        let current: typeof groups[0] | null = null
                        crmEntries.forEach((entry, i) => {
                          if (entry.type === "stage_change") {
                            const ds = DEAL_STAGES.find(s => s.label === entry.note)
                            current = { stageIdx: i, stageName: entry.note, date: entry.date, stageColor: ds?.color || "#6b7280", stageBg: "#21262D", children: [] }
                            groups.push(current)
                          } else if (current) {
                            current.children.push({ entry, idx: i })
                          }
                        })
                        const currentStageLabel = DEAL_STAGES.find(s => s.value === dealStage)?.label || ""
                        return groups.map((group) => (
                          <div key={group.stageIdx}>
                            <div
                              className={`flex items-center gap-2 mb-1 group/stage rounded-lg px-1 py-0.5 ${dragOverStageIdx === group.stageIdx ? "bg-[#21262D]" : ""}`}
                              onDragOver={(e) => { e.preventDefault(); if (dragSrcIdx === null) return; setDragOverStageIdx(group.stageIdx); setDragOverIdx(null) }}
                              onDrop={(e) => { e.preventDefault(); handleDropOnStage(group.stageIdx) }}
                              onDragLeave={() => setDragOverStageIdx(null)}
                            >
                              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ color: group.stageColor, background: `${group.stageColor}20` }}>
                                {group.stageName}
                              </span>
                              <span className="text-[#484F58] text-[10px]">{group.date}</span>
                              <button onClick={() => requestDelete(group.stageIdx)} className="cursor-pointer ml-auto opacity-0 group-hover/stage:opacity-100 text-[#ef4444] hover:text-red-400 transition-opacity">
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>

                            <div className="ml-2 pl-3 space-y-0.5" style={{ borderLeft: `2px solid ${group.stageColor}30` }}>
                              {group.stageName === currentStageLabel && addingNote && (
                                <div className="mb-2">
                                  <NoteForm noteText={noteText} setNoteText={setNoteText} noteType={noteType} setNoteType={setNoteType} onSave={handleAddNote} onCancel={() => setAddingNote(false)} accentColor={group.stageColor} />
                                </div>
                              )}

                              {group.children.map(({ entry, idx }) => (
                                <div
                                  key={idx}
                                  draggable
                                  onDragStart={() => { setDragSrcIdx(idx); setDragOverStageIdx(null) }}
                                  onDragOver={(e) => { e.preventDefault(); setDragOverIdx(idx); setDragOverStageIdx(null) }}
                                  onDrop={(e) => { e.preventDefault(); if (dragSrcIdx !== null) handleReorder(dragSrcIdx, idx) }}
                                  onDragEnd={clearDrag}
                                  className={`flex gap-2 items-start py-1.5 rounded-lg px-1 group/entry transition-all ${dragOverIdx === idx && dragSrcIdx !== idx ? "bg-[#21262D]" : ""} ${dragSrcIdx === idx ? "opacity-40" : ""}`}
                                >
                                  <GripVertical className="w-3 h-3 text-[#484F58] opacity-0 group-hover/entry:opacity-100 cursor-grab active:cursor-grabbing flex-shrink-0 mt-1.5" />
                                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1.5 ring-1 ring-[#21262D]" style={{ background: CRM_COLORS[entry.type] || "#6B7280" }} />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-[#E6EDF3] text-xs font-semibold">{CRM_LABELS[entry.type]}</p>
                                    {editingIdx === idx ? (
                                      <div className="flex gap-1 mt-1">
                                        <input autoFocus value={editText} onChange={(e) => setEditText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSaveEdit(idx)} className="flex-1 text-xs rounded px-2 py-0.5 outline-none text-[#E6EDF3]" style={{ background: "#0D1117", border: "1px solid #58A6FF" }} />
                                        <button onClick={() => handleSaveEdit(idx)} className="cursor-pointer text-[#58A6FF]"><Check className="w-3.5 h-3.5" /></button>
                                        <button onClick={() => setEditingIdx(null)} className="cursor-pointer text-[#6B7280]"><X className="w-3.5 h-3.5" /></button>
                                      </div>
                                    ) : (
                                      <p className="text-[#8B949E] text-[11px] mt-0.5">{entry.date} — {entry.note}</p>
                                    )}
                                  </div>
                                  {editingIdx !== idx && (
                                    <div className="flex gap-1 opacity-0 group-hover/entry:opacity-100 transition-opacity flex-shrink-0 mt-0.5">
                                      <button onClick={() => handleStartEdit(idx)} className="cursor-pointer text-[#6B7280] hover:text-[#58A6FF]"><Pencil className="w-3 h-3" /></button>
                                      <button onClick={() => requestDelete(idx)} className="cursor-pointer text-[#6B7280] hover:text-[#ef4444]"><Trash2 className="w-3 h-3" /></button>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))
                      })()}
                    </div>
                  )}
                </div>
              </div>

              {/* Row 2: Stakeholder + Pitch */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">

                {/* Stakeholder Identity */}
                <div className="rounded-2xl p-6" style={CARD_STYLE}>
                  <div className="flex items-center justify-between mb-5">
                    <SectionLabel icon={
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="5" r="3" stroke="#8b5cf6" strokeWidth="1.4"/><path d="M2 14c0-3.3 2.7-5 6-5s6 1.7 6 5" stroke="#8b5cf6" strokeWidth="1.4" strokeLinecap="round"/></svg>
                    } label="Stakeholder Identity" color="#8b5cf6" />
                    {brief?.contactProfile?.verified && (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: "#58A6FF18", color: "#58A6FF", border: "1px solid #58A6FF30" }}>Verified</span>
                    )}
                  </div>
                  <div className="flex gap-4 mb-4">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xl font-bold" style={{ background: "linear-gradient(135deg, #3b82f6, #8b5cf6)" }}>
                      {contactInitials}
                    </div>
                    <div>
                      <p className="text-[#E6EDF3] text-xl font-bold">{contactName}</p>
                      <p className="text-[#8b5cf6] text-sm font-semibold mt-0.5">{contactDesignation}</p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {brief?.contactProfile?.likelyPriorities?.slice(0, 2).map((p: string, i: number) => (
                          <span key={i} className="text-[#8B949E] text-[10px] font-semibold px-2 py-0.5 rounded uppercase tracking-wider" style={{ background: "#21262D" }}>{p.split(" ").slice(0, 2).join(" ")}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  {brief?.contactProfile?.behavioralTags?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {brief.contactProfile.behavioralTags.map((tag: string, i: number) => (
                        <span key={i} className="text-[#8B949E] text-[10px] font-semibold px-2 py-0.5 rounded uppercase tracking-wider" style={{ background: "#21262D" }}>{tag}</span>
                      ))}
                    </div>
                  )}
                  {brief?.contactProfile?.engagementTip && (
                    <p className="text-[#C9D1D9] text-sm italic leading-relaxed mb-3" style={{ borderLeft: "2px solid #58A6FF", paddingLeft: "12px" }}>
                      "{brief.contactProfile.engagementTip}"
                    </p>
                  )}
                  {brief?.contactProfile?.background && (
                    <p className="text-[#8B949E] text-xs leading-relaxed mt-2">{brief.contactProfile.background}</p>
                  )}
                  {brief?.recommendedApproach?.watchOuts?.[0] && (
                    <div className="flex items-center gap-1.5 text-[#58A6FF] text-xs font-medium mt-3">
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="#58A6FF" strokeWidth="1.4"/><path d="M8 5v3" stroke="#58A6FF" strokeWidth="1.5" strokeLinecap="round"/><circle cx="8" cy="11" r="0.8" fill="#58A6FF"/></svg>
                      {brief.recommendedApproach.watchOuts[0]}
                    </div>
                  )}
                </div>

                {/* Pitch card */}
                <div className="rounded-2xl p-6" style={{ background: "#0d2818", border: "1px solid #1a4a2a" }}>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[#86efac] font-bold text-sm tracking-wide uppercase">Your Pitch</span>
                    <span className="bg-[#22c55e] text-white text-xs font-bold px-3 py-1 rounded-lg">PRIORITY</span>
                  </div>
                  <p className="text-[#4ade80] text-[10px] uppercase tracking-widest mb-2 font-semibold">The Hook</p>
                  <p className="text-white text-lg font-bold leading-snug mb-5">{brief?.recommendedApproach?.openingLine?.slice(0, 90) || "Lead with impact, win the room"}</p>
                  {brief?.talkingPoints?.slice(0, 3).map((tp: any, i: number) => (
                    <div key={i} className="flex items-start gap-3 mb-3.5">
                      <div className="w-5 h-5 rounded-full bg-[#166534] flex items-center justify-center flex-shrink-0 mt-0.5">
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2 2 4-4" stroke="#4ade80" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </div>
                      <p className="text-[#d1fae5] text-sm leading-relaxed">{tp.point}</p>
                    </div>
                  ))}
                  {brief?.recommendedApproach?.strategy && (
                    <div className="mt-4 pt-4" style={{ borderTop: "1px solid #1a4a2a" }}>
                      <p className="text-[#4ade80] text-[10px] uppercase tracking-widest mb-1.5 font-semibold">Strategy</p>
                      <p className="text-[#86efac] text-xs leading-relaxed">{brief.recommendedApproach.strategy}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Map — Hospital Location */}
              <MapEmbed hospitalName={hospitalName} city={city} />


              {/* Intelligence Signals */}
              {brief?.intelligenceSignals?.length > 0 && !noSignals && (
                <div>
                  <div className="mb-4">
                    <SectionLabel icon={
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M1 11V6a7 7 0 0114 0v5" stroke="#14b8a6" strokeWidth="1.4" strokeLinecap="round"/><path d="M1 11a2 2 0 004 0M11 11a2 2 0 004 0" stroke="#14b8a6" strokeWidth="1.4"/></svg>
                    } label="News & Market Signals" color="#14b8a6" />
                    <p className="text-[#8B949E] text-xs mt-1 ml-6">Relevant updates for {hospitalName}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-5">
                    {brief.intelligenceSignals.slice(0, 3).map((s: any, i: number) => (
                      <div key={i} className="rounded-2xl p-5" style={CARD_STYLE}>
                        <div className={`h-[3px] w-8 rounded-full mb-4 ${s.urgency === "high" ? "bg-[#ef4444]" : s.urgency === "medium" ? "bg-[#f59e0b]" : "bg-[#484F58]"}`} />
                        <p className="text-[#E6EDF3] text-sm font-bold mb-2 leading-snug">{s.signal?.slice(0, 80)}</p>
                        <p className="text-[#8B949E] text-xs leading-relaxed mb-4">{s.implication}</p>
                        {s.sourceUrl ? (
                          <a href={s.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-[#58A6FF] text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 hover:opacity-80">
                            SOURCE: {s.source?.toUpperCase() || "VIEW"} {">"}
                          </a>
                        ) : s.source && (
                          <span className="text-[#484F58] text-[10px] font-bold uppercase tracking-wider">{s.source?.toUpperCase()}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pain Points + Discovery Questions */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 pb-8">
                {brief?.painPoints?.length > 0 && (
                  <div className="rounded-2xl p-6" style={CARD_STYLE}>
                    <SectionLabel icon={
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="#ef4444" strokeWidth="1.4"/><path d="M8 5v4" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round"/><circle cx="8" cy="11.5" r="0.8" fill="#ef4444"/></svg>
                    } label="Pain Points" color="#ef4444" className="mb-5" />
                    <div className="space-y-3">
                      {brief.painPoints.slice(0, 3).map((p: any, i: number) => (
                        <div key={i} className="flex gap-3 p-3.5 rounded-xl" style={SUB_STYLE}>
                          <span className="w-2 h-2 rounded-full bg-[#58A6FF] flex-shrink-0 mt-1.5" />
                          <div>
                            <p className="text-[#E6EDF3] text-sm font-semibold">{p.pain}</p>
                            <p className="text-[#8B949E] text-xs mt-1">{p.evidence}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {brief?.discoveryQuestions?.length > 0 && (
                  <div className="rounded-2xl p-6" style={CARD_STYLE}>
                    <SectionLabel icon={
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="#3b82f6" strokeWidth="1.4"/><path d="M6 6.5c0-1.1.9-2 2-2s2 .9 2 2c0 .8-.5 1.5-1.2 1.8L8 9v1" stroke="#3b82f6" strokeWidth="1.3" strokeLinecap="round"/><circle cx="8" cy="11.5" r="0.8" fill="#3b82f6"/></svg>
                    } label="Discovery Questions" color="#3b82f6" className="mb-5" />
                    <div className="space-y-2">
                      {brief.discoveryQuestions.slice(0, 4).map((q: string, i: number) => (
                        <div key={i} className="flex gap-3 p-3.5 rounded-xl" style={SUB_STYLE}>
                          <span className="text-[#58A6FF] text-sm font-bold flex-shrink-0">Q{i + 1}</span>
                          <p className="text-[#C9D1D9] text-sm leading-relaxed">{q}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </main>

          {/* ── Right Aside — full-width block on mobile, fixed 280px sticky column on desktop ── */}
          <aside className="lg:flex lg:flex-col lg:flex-shrink-0 lg:w-[280px] lg:overflow-hidden border-t lg:border-t-0 lg:border-l" style={{ background: "#161B22", borderColor: "#21262D" }}>

            {/* Deal Stage */}
            <div className="shrink-0 p-5" style={{ borderBottom: "1px solid #21262D" }}>
              <p className="text-[#6B7280] text-[10px] uppercase tracking-wider font-semibold mb-3">Deal Stage</p>
              {stageIndex >= 0 && (
                <div className="flex gap-1 mb-3">
                  {activeStages.map((s, i) => (
                    <div key={s} className="flex-1 h-1.5 rounded-full transition-all" style={{ background: i <= stageIndex ? currentStageDark.darkColor : "#30363D" }} />
                  ))}
                </div>
              )}
              <select
                value={dealStage}
                onChange={(e) => handleStageChange(e.target.value as DealStage)}
                className="w-full text-sm font-semibold rounded-xl px-3 py-2.5 outline-none cursor-pointer"
                style={{ color: currentStageDark.darkColor, background: currentStageDark.darkBg, border: `1px solid ${currentStageDark.darkColor}40` }}
              >
                {DEAL_STAGES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
              {dealStage === "won"     && <div className="mt-3 rounded-xl p-3 text-center text-sm font-semibold" style={{ background: "#22c55e15", border: "1px solid #22c55e40", color: "#4ade80" }}>Deal Closed!</div>}
              {dealStage === "lost"    && <div className="mt-3 rounded-xl p-3 text-center text-sm font-semibold" style={{ background: "#ef444415", border: "1px solid #ef444440", color: "#f87171" }}>Deal Lost</div>}
              {dealStage === "on_hold" && <div className="mt-3 rounded-xl p-3 text-center text-sm font-semibold" style={{ background: "#f59e0b15", border: "1px solid #f59e0b40", color: "#fbbf24" }}>Following up later</div>}
            </div>

            {/* Scheduled Follow-ups — scrollable on desktop, natural height on mobile */}
            <div className="p-5 lg:flex-1 lg:min-h-0 lg:overflow-y-auto">
              <p className="text-[#6B7280] text-[10px] uppercase tracking-wider font-semibold mb-3">Scheduled Follow-ups</p>
              {followupMeetings.length === 0 ? (
                <p className="text-[#484F58] text-xs text-center py-6">No follow-ups scheduled yet.</p>
              ) : (
                <div className="space-y-2">
                  {followupMeetings.map((fm, i) => (
                    <div key={fm.id || i} className="rounded-xl p-3" style={{ background: "#22c55e12", border: "1px solid #22c55e25" }}>
                      <div className="flex items-center gap-1.5 mb-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#22c55e] flex-shrink-0" />
                        <p className="text-[#4ade80] text-xs font-semibold">{fm.date}</p>
                        <span className="text-[#22c55e40] text-xs">·</span>
                        <p className="text-[#86efac] text-xs">{fm.time} IST</p>
                      </div>
                      {fm.topic && <p className="text-[#86efac] text-[11px] pl-3 leading-relaxed">{fm.topic}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions — always visible, never scrolls away */}
            <div className="shrink-0" style={{ borderTop: "1px solid #21262D" }}>
              {dealStage !== "lost" && dealStage !== "won" && (
                <div className="px-4 pt-3 pb-2">
                  {!addingNextMeeting ? (
                    <button
                      onClick={() => setAddingNextMeeting(true)}
                      className="cursor-pointer w-full text-[#58A6FF] text-xs font-semibold py-2 rounded-lg transition-colors hover:bg-[#58A6FF15]"
                      style={{ border: "1px solid #58A6FF40" }}
                    >
                      + Schedule Next Meeting
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <input type="date" value={nextMeetingDate} onChange={(e) => setNextMeetingDate(e.target.value)} className="w-full text-xs rounded-lg px-3 py-1.5 text-[#E6EDF3] outline-none" style={{ background: "#0D1117", border: "1px solid #30363D" }} />
                      <input type="time" value={nextMeetingTime} onChange={(e) => setNextMeetingTime(e.target.value)} className="w-full text-xs rounded-lg px-3 py-1.5 text-[#E6EDF3] outline-none" style={{ background: "#0D1117", border: "1px solid #30363D" }} />
                      <input type="text" placeholder="What is it about?" value={nextMeetingTopic} onChange={(e) => setNextMeetingTopic(e.target.value)} className="w-full text-xs rounded-lg px-3 py-1.5 text-[#E6EDF3] outline-none placeholder:text-[#484F58]" style={{ background: "#0D1117", border: "1px solid #30363D" }} />
                      <div className="flex gap-2">
                        <button onClick={handleSaveNextMeeting} className="cursor-pointer flex-1 text-white text-xs font-semibold py-1.5 rounded-lg" style={{ background: "#58A6FF" }}>Save</button>
                        <button onClick={() => setAddingNextMeeting(false)} className="cursor-pointer flex-1 text-[#8B949E] text-xs font-semibold py-1.5 rounded-lg" style={{ background: "#21262D" }}>Cancel</button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="relative px-4 pb-4 pt-1">
                {!isMeetingDone ? (
                  /* Meeting hasn't happened yet — block logging */
                  <div className="w-full text-center py-2.5 rounded-xl text-xs text-[#484F58] select-none"
                    style={{ background: "#0D1117", border: "1px solid #21262D" }}>
                    <span className="block font-medium text-[#30363D]">Log Activity</span>
                    <span>Available after the meeting</span>
                  </div>
                ) : !addingNote ? (
                  <button onClick={() => setAddingNote(true)} className="sticky bottom-0 cursor-pointer w-full text-white text-sm font-semibold py-2.5 rounded-xl transition-colors hover:opacity-90" style={{ background: "#58A6FF" }}>
                    + Log Activity
                  </button>
                ) : (
                  <NoteForm noteText={noteText} setNoteText={setNoteText} noteType={noteType} setNoteType={setNoteType} onSave={handleAddNote} onCancel={() => setAddingNote(false)} accentColor="#58A6FF" />
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      {deleteConfirm !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="rounded-2xl p-6 w-full max-w-sm mx-4" style={{ background: "#161B22", border: "1px solid #30363D" }}>
            <div className="flex items-start gap-4 mb-5">
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "#ef444420" }}>
                <Trash2 className="w-5 h-5 text-[#ef4444]" />
              </div>
              <div>
                <p className="text-[#E6EDF3] text-sm font-bold">
                  {deleteConfirm.isStage ? "Delete this stage?" : "Delete this activity?"}
                </p>
                <p className="text-[#8B949E] text-xs mt-1 leading-relaxed">
                  {deleteConfirm.isStage && deleteConfirm.childCount > 0
                    ? `This will permanently delete the stage and ${deleteConfirm.childCount} activity log${deleteConfirm.childCount > 1 ? "s" : ""} within it.`
                    : "This activity log will be permanently removed."}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="cursor-pointer flex-1 text-[#C9D1D9] text-sm font-semibold py-2 rounded-xl transition-colors hover:bg-[#21262D]" style={{ border: "1px solid #30363D" }}>
                Cancel
              </button>
              <button onClick={confirmDelete} className="cursor-pointer flex-1 text-white text-sm font-semibold py-2 rounded-xl transition-colors hover:opacity-90" style={{ background: "#ef4444" }}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )

  if (hideSidebar) return mainContent

  return (
    <div className="flex h-screen" style={{ background: "#0D1117" }}>
      <Sidebar
        repName={repName}
        repDesignation={repDesignation}
        repWhatsapp={repWhatsapp}
        meetings={meetings}
        selectedMeetingIndex={selectedIndex}
        onSelectMeeting={onSelectMeeting}
        onAddMeeting={onAddMeeting}
      />
      {mainContent}
    </div>
  )
}

// ── Helper components ─────────────────────────────────────────────────────

function SectionLabel({ icon, label, color, className = "" }: { icon: React.ReactNode; label: string; color: string; className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: `${color}18` }}>
        {icon}
      </div>
      <span className="text-[#C9D1D9] font-bold text-sm">{label}</span>
    </div>
  )
}

function NoteForm({ noteText, setNoteText, noteType, setNoteType, onSave, onCancel, accentColor }: {
  noteText: string
  setNoteText: (v: string) => void
  noteType: CRMEntry["type"]
  setNoteType: (v: CRMEntry["type"]) => void
  onSave: () => void
  onCancel: () => void
  accentColor: string
}) {
  return (
    <div className="space-y-2 p-2.5 rounded-xl" style={{ background: "#0D1117", border: `1px solid ${accentColor}30` }}>
      <div className="flex flex-wrap gap-1">
        {NOTE_TYPES.map((nt) => (
          <button
            key={nt.value}
            type="button"
            onClick={() => setNoteType(nt.value)}
            className="text-[10px] font-semibold px-2 py-0.5 rounded-full transition-all cursor-pointer"
            style={noteType === nt.value
              ? { background: `${CRM_COLORS[nt.value]}25`, color: CRM_COLORS[nt.value], border: `1px solid ${CRM_COLORS[nt.value]}50` }
              : { background: "#21262D", color: "#6B7280", border: "1px solid transparent" }}
          >
            {nt.label}
          </button>
        ))}
      </div>
      <input
        type="text"
        placeholder="Add details..."
        value={noteText}
        onChange={(e) => setNoteText(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onSave()}
        className="w-full text-xs rounded-lg px-3 py-1.5 text-[#E6EDF3] outline-none placeholder:text-[#484F58]"
        style={{ background: "#161B22", border: "1px solid #30363D" }}
      />
      <div className="flex gap-2">
        <button onClick={onSave} className="cursor-pointer flex-1 text-white text-xs font-semibold py-1.5 rounded-lg" style={{ background: accentColor }}>Save</button>
        <button onClick={onCancel} className="cursor-pointer flex-1 text-[#8B949E] text-xs font-semibold py-1.5 rounded-lg" style={{ background: "#21262D" }}>Cancel</button>
      </div>
    </div>
  )
}
