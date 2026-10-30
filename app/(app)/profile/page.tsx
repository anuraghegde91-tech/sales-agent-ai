"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Input } from "@/components/ui/input"
import {
  Pencil, Check, X, User, Mail, Phone, Briefcase,
  ShieldCheck, Shield, CalendarDays, Trophy, Hash, Clock,
} from "lucide-react"

interface Profile {
  id: string
  rep_name: string
  rep_designation: string
  whatsapp_number: string
  email: string
  is_verified: boolean
  created_at: string
}

type EditableField = "rep_name" | "rep_designation" | "whatsapp_number"

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<EditableField | null>(null)
  const [editing, setEditing] = useState<EditableField | null>(null)
  const [draftName, setDraftName] = useState("")
  const [draftDesignation, setDraftDesignation] = useState("")
  const [draftPhone, setDraftPhone] = useState("")
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)
  const [totalMeetings, setTotalMeetings] = useState<number | null>(null)
  const [wonDeals, setWonDeals] = useState<number | null>(null)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push("/login"); return }

      const [{ data }, { count: meetingCount }, { count: wonCount }] = await Promise.all([
        supabase.from("profiles").select("id, rep_name, rep_designation, whatsapp_number, email, is_verified, created_at").eq("id", user.id).single(),
        supabase.from("meetings").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("deal_stages").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("stage", "won"),
      ])

      if (data) {
        setProfile(data as Profile)
        setDraftName(data.rep_name || "")
        setDraftDesignation(data.rep_designation || "")
        setDraftPhone(data.whatsapp_number || "")
      }
      setTotalMeetings(meetingCount ?? 0)
      setWonDeals(wonCount ?? 0)
      setLoading(false)
    }
    load()
  }, [])

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3000)
  }

  async function saveField(field: EditableField, value: string) {
    if (!profile) return
    setSaving(field)
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token ?? ""}` },
      body: JSON.stringify({ [field]: value }),
    })
    const json = await res.json()
    setSaving(null)
    if (json.success) {
      setProfile((p) => p ? { ...p, ...json.profile } : p)
      showToast("Saved successfully", true)
    } else {
      showToast(json.error || "Save failed", false)
    }
    setEditing(null)
  }

  function cancelEdit(field: EditableField) {
    if (field === "rep_name")        setDraftName(profile?.rep_name || "")
    if (field === "rep_designation") setDraftDesignation(profile?.rep_designation || "")
    if (field === "whatsapp_number") setDraftPhone(profile?.whatsapp_number || "")
    setEditing(null)
  }

  const initials = (profile?.rep_name || "U")
    .split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-IN", { month: "long", year: "numeric" })
    : "—"

  const accountAge = profile?.created_at
    ? Math.floor((Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24))
    : 0

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-[#58A6FF] border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-3xl m-auto space-y-6">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-4 py-2.5 rounded-lg text-sm font-medium shadow-lg ${toast.ok ? "bg-[#22c55e] text-white" : "bg-[#ef4444] text-white"}`}>
          {toast.msg}
        </div>
      )}

      {/* ── Hero Banner ── */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ border: "1px solid #21262D" }}
      >
        {/* Gradient strip */}
        <div
          className="h-24 w-full"
          style={{ background: "linear-gradient(135deg, #1C2128 0%, #0d2239 50%, #1a1a2e 100%)" }}
        />

        {/* Avatar + name row */}
        <div className="px-8 pb-7" style={{ background: "#161B22" }}>
          <div className="flex items-end gap-5 -mt-10">
            {/* Avatar */}
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shrink-0 ring-4"
              style={{ background: "linear-gradient(135deg, #58A6FF, #3b82f6)", ringColor: "#161B22" } as any}
            >
              {initials}
            </div>

            {/* Name + badges */}
            <div className="pb-1 flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mt-2">
                {editing === "rep_name" ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={draftName}
                      onChange={(e) => setDraftName(e.target.value)}
                      className="h-8 text-lg font-bold text-[#E6EDF3] bg-[#0D1117] border-[#58A6FF] focus-visible:ring-0 w-48"
                      autoFocus
                      onKeyDown={(e) => { if (e.key === "Enter") saveField("rep_name", draftName); if (e.key === "Escape") cancelEdit("rep_name") }}
                    />
                    <button disabled={saving === "rep_name"} onClick={() => saveField("rep_name", draftName)} className="text-[#22c55e] hover:opacity-80 cursor-pointer">
                      <Check className="w-4 h-4" />
                    </button>
                    <button onClick={() => cancelEdit("rep_name")} className="text-[#8B949E] hover:opacity-80 cursor-pointer">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <h2 className="text-[#E6EDF3] text-2xl font-bold">{profile?.rep_name || "—"}</h2>
                    <button onClick={() => setEditing("rep_name")} className="text-[#484F58] hover:text-[#8B949E] cursor-pointer transition-colors">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
                {profile?.is_verified && (
                  <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: "#22c55e18", color: "#4ade80", border: "1px solid #22c55e30" }}>
                    <ShieldCheck className="w-3 h-3" /> Verified
                  </span>
                )}
              </div>
              <p className="text-[#8B949E] text-sm mt-0.5">{profile?.rep_designation || "Sales Representative"}</p>
              <p className="text-[#6B7280] text-xs mt-0.5">{profile?.email}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Meetings", value: totalMeetings ?? 0, icon: <CalendarDays className="w-5 h-5" />, color: "#58A6FF" },
          { label: "Won Deals",      value: wonDeals ?? 0,      icon: <Trophy         className="w-5 h-5" />, color: "#22c55e" },
          { label: "Days Active",    value: accountAge,         icon: <Clock          className="w-5 h-5" />, color: "#f59e0b" },
        ].map(({ label, value, icon, color }) => (
          <div key={label} className="rounded-xl p-5 flex items-center gap-4" style={{ background: "#161B22", border: "1px solid #21262D" }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${color}18`, color }}>
              {icon}
            </div>
            <div>
              <p className="text-[#E6EDF3] text-2xl font-bold leading-tight">{value}</p>
              <p className="text-[#8B949E] text-xs">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Personal Information ── */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "#161B22", border: "1px solid #21262D" }}>
        <div className="px-6 py-4" style={{ borderBottom: "1px solid #21262D" }}>
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-[#58A6FF]" />
            <h3 className="text-[#E6EDF3] text-sm font-bold">Personal Information</h3>
          </div>
          <p className="text-[#6B7280] text-xs mt-0.5 ml-6">Update your name and role details</p>
        </div>

        <div className="p-6 space-y-5">
          {/* Full Name */}
          <ProfileField
            label="Full Name"
            icon={<User className="w-3.5 h-3.5" />}
            value={profile?.rep_name || "—"}
            editing={editing === "rep_name"}
            saving={saving === "rep_name"}
            draft={draftName}
            setDraft={setDraftName}
            onEdit={() => setEditing("rep_name")}
            onSave={() => saveField("rep_name", draftName)}
            onCancel={() => cancelEdit("rep_name")}
          />

          {/* Email */}
          <ProfileField
            label="Email Address"
            icon={<Mail className="w-3.5 h-3.5" />}
            value={profile?.email || "—"}
            readOnly
          />

          {/* Designation */}
          <ProfileField
            label="Designation / Role"
            icon={<Briefcase className="w-3.5 h-3.5" />}
            value={profile?.rep_designation || "—"}
            placeholder="e.g. Field Sales Executive"
            editing={editing === "rep_designation"}
            saving={saving === "rep_designation"}
            draft={draftDesignation}
            setDraft={setDraftDesignation}
            onEdit={() => setEditing("rep_designation")}
            onSave={() => saveField("rep_designation", draftDesignation)}
            onCancel={() => cancelEdit("rep_designation")}
          />
        </div>
      </div>

      {/* ── Contact Information ── */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "#161B22", border: "1px solid #21262D" }}>
        <div className="px-6 py-4" style={{ borderBottom: "1px solid #21262D" }}>
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-[#22c55e]" />
            <h3 className="text-[#E6EDF3] text-sm font-bold">Contact Information</h3>
          </div>
          <p className="text-[#6B7280] text-xs mt-0.5 ml-6">Used for WhatsApp meeting reminders</p>
        </div>

        <div className="p-6">
          <ProfileField
            label="WhatsApp Number"
            icon={<Phone className="w-3.5 h-3.5" />}
            value={profile?.whatsapp_number || "—"}
            placeholder="+91 9876543210"
            editing={editing === "whatsapp_number"}
            saving={saving === "whatsapp_number"}
            draft={draftPhone}
            setDraft={setDraftPhone}
            onEdit={() => setEditing("whatsapp_number")}
            onSave={() => saveField("whatsapp_number", draftPhone)}
            onCancel={() => cancelEdit("whatsapp_number")}
          />
        </div>
      </div>

      {/* ── Account Details ── */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "#161B22", border: "1px solid #21262D" }}>
        <div className="px-6 py-4" style={{ borderBottom: "1px solid #21262D" }}>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#8b5cf6]" />
            <h3 className="text-[#E6EDF3] text-sm font-bold">Account Details</h3>
          </div>
          <p className="text-[#6B7280] text-xs mt-0.5 ml-6">Read-only account metadata</p>
        </div>

        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <p className="text-[#6B7280] text-xs flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5" /> User ID
            </p>
            <div className="h-9 px-3 rounded-lg flex items-center" style={{ background: "#0D1117", border: "1px solid #21262D" }}>
              <span className="text-[#484F58] text-xs font-mono truncate">{profile?.id}</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <p className="text-[#6B7280] text-xs flex items-center gap-1.5">
              <CalendarDays className="w-3.5 h-3.5" /> Member Since
            </p>
            <div className="h-9 px-3 rounded-lg flex items-center" style={{ background: "#0D1117", border: "1px solid #21262D" }}>
              <span className="text-[#8B949E] text-sm">{memberSince}</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <p className="text-[#6B7280] text-xs flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" /> Verification Status
            </p>
            <div className="h-9 px-3 rounded-lg flex items-center gap-2" style={{ background: "#0D1117", border: "1px solid #21262D" }}>
              {profile?.is_verified ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-[#22c55e]" />
                  <span className="text-[#4ade80] text-sm font-medium">Verified Account</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-[#f59e0b]" />
                  <span className="text-[#fbbf24] text-sm font-medium">Pending Verification</span>
                </>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <p className="text-[#6B7280] text-xs flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" /> Email Status
            </p>
            <div className="h-9 px-3 rounded-lg flex items-center gap-2" style={{ background: "#0D1117", border: "1px solid #21262D" }}>
              <span className="w-2 h-2 rounded-full bg-[#22c55e]" />
              <span className="text-[#8B949E] text-sm">{profile?.email}</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}

// ── Reusable field row ────────────────────────────────────────────────────

function ProfileField({
  label, icon, value, placeholder, readOnly = false,
  editing = false, saving = false,
  draft, setDraft, onEdit, onSave, onCancel,
}: {
  label: string
  icon: React.ReactNode
  value: string
  placeholder?: string
  readOnly?: boolean
  editing?: boolean
  saving?: boolean
  draft?: string
  setDraft?: (v: string) => void
  onEdit?: () => void
  onSave?: () => void
  onCancel?: () => void
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[#6B7280] text-xs flex items-center gap-1.5">
        {icon} {label}
      </label>

      {editing ? (
        <div className="flex items-center gap-2">
          <Input
            value={draft}
            onChange={(e) => setDraft?.(e.target.value)}
            placeholder={placeholder}
            className="h-10 text-sm text-[#E6EDF3] bg-[#0D1117] border-[#58A6FF] focus-visible:ring-0 flex-1"
            autoFocus
            onKeyDown={(e) => { if (e.key === "Enter") onSave?.(); if (e.key === "Escape") onCancel?.() }}
          />
          <button
            disabled={saving}
            onClick={onSave}
            className="w-9 h-10 flex items-center justify-center rounded-lg text-[#22c55e] hover:bg-[#22c55e18] transition-colors cursor-pointer disabled:opacity-50"
            style={{ border: "1px solid #22c55e30" }}
          >
            <Check className="w-4 h-4" />
          </button>
          <button
            onClick={onCancel}
            className="w-9 h-10 flex items-center justify-center rounded-lg text-[#8B949E] hover:bg-[#21262D] transition-colors cursor-pointer"
            style={{ border: "1px solid #30363D" }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <div className="flex-1 h-10 px-3 rounded-lg flex items-center text-sm" style={{ background: "#0D1117", border: "1px solid #21262D", color: value === "—" ? "#484F58" : "#E6EDF3" }}>
            {value}
          </div>
          {!readOnly && (
            <button
              onClick={onEdit}
              className="w-9 h-10 flex items-center justify-center rounded-lg text-[#6B7280] hover:text-[#E6EDF3] hover:bg-[#21262D] transition-colors cursor-pointer"
              style={{ border: "1px solid #21262D" }}
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  )
}
