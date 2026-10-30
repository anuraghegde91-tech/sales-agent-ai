"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { mapRowToMeeting } from "@/lib/mapRowToMeeting"
import { DesktopBriefScreen } from "@/components/screens/desktop-brief-screen"
import { ArrowLeft } from "lucide-react"

export default function MeetingDetailPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const [meeting, setMeeting] = useState<any | null>(null)
  const [repName, setRepName] = useState("")
  const [repDesignation, setRepDesignation] = useState("")
  const [repWhatsapp, setRepWhatsapp] = useState("")
  const [userId, setUserId] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push("/login"); return }

      setUserId(user.id)

      const [{ data: profile }, { data: row }] = await Promise.all([
        supabase.from("profiles").select("rep_name, rep_designation, whatsapp_number").eq("id", user.id).single(),
        supabase.from("meetings").select("*").eq("id", id).eq("user_id", user.id).single(),
      ])

      if (profile) {
        setRepName(profile.rep_name || "")
        setRepDesignation(profile.rep_designation || "")
        setRepWhatsapp(profile.whatsapp_number || "")
      }

      if (!row) { router.push("/meetings"); return }
      setMeeting(mapRowToMeeting(row))
      setLoading(false)
    }
    load()
  }, [id])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    document.cookie = "salesai_auth=; path=/; max-age=0; SameSite=Lax"
    router.push("/login")
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#58A6FF] border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    // Mobile: natural block, page scrolls via AppLayout's main overflow-auto.
    // Desktop (lg): fixed viewport height with internal scroll zones.
    <div className="flex flex-col lg:h-full">
      {/* Back nav — sticky on mobile so it stays visible while scrolling */}
      <div className="sticky top-0 z-10 px-4 sm:px-6 py-3 shrink-0 flex items-center" style={{ borderBottom: "1px solid #21262D", background: "#0D1117" }}>
        <Link
          href="/meetings"
          className="flex items-center gap-1.5 text-[#8B949E] hover:text-[#E6EDF3] text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Meetings
        </Link>
      </div>

      {/* Brief screen wrapper: natural height on mobile, fixed flex zone on desktop */}
      <div className="lg:flex-1 lg:min-h-0 lg:overflow-hidden lg:flex">
        <DesktopBriefScreen
          meetings={meeting ? [meeting] : []}
          selectedIndex={0}
          onSelectMeeting={() => {}}
          onAddMeeting={() => router.push("/create")}
          onEditMeeting={() => router.push(`/edit?id=${id}`)}
          onLogout={handleLogout}
          repName={repName}
          repDesignation={repDesignation}
          repWhatsapp={repWhatsapp}
          userId={userId}
          hideSidebar
        />
      </div>
    </div>
  )
}
