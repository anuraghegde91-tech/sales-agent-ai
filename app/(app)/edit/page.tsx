"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { MeetingInputScreen } from "@/components/screens/meeting-input-screen"
import { supabase } from "@/lib/supabase"

function istToUtc(istTime: string): string {
  const [h, m] = istTime.split(":").map(Number)
  const d = new Date()
  d.setHours(h - 5, m - 30, 0)
  return d.toTimeString().slice(0, 5)
}

function EditContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const meetingId = searchParams.get("id")
  const [repName, setRepName] = useState("")
  const [repDesignation, setRepDesignation] = useState("")
  const [repWhatsapp, setRepWhatsapp] = useState("")
  const [userId, setUserId] = useState("")
  const [initialData, setInitialData] = useState<any>(null)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push("/login"); return }
      setUserId(user.id)

      const { data: profile } = await supabase
        .from("profiles")
        .select("rep_name, rep_designation, whatsapp_number")
        .eq("id", user.id)
        .single()
      if (profile) {
        setRepName(profile.rep_name || "")
        setRepDesignation(profile.rep_designation || "")
        setRepWhatsapp(profile.whatsapp_number || "")
      }

      if (meetingId) {
        const { data } = await supabase
          .from("meetings")
          .select("*")
          .eq("id", meetingId)
          .eq("user_id", user.id)
          .single()

        if (data) {
          const [h, m] = (data.meeting_time || "00:00").split(":").map(Number)
          const d = new Date()
          d.setHours(h + 5, m + 30, 0)
          setInitialData({
            hospitalName: data.hospital_name || "",
            city: data.city || "",
            contactName: data.contact_name || "",
            contactDesignation: data.contact_designation || "",
            softwareType: Array.isArray(data.software_types) ? data.software_types.join(", ") : "",
            meetingDate: data.meeting_date || "",
            meetingTime: d.toTimeString().slice(0, 5),
            meetingType: data.meeting_type || "First meeting",
          })
        }
      }
    }
    load()
  }, [meetingId])

  const handleSubmit = async (report: any) => {
    if (!meetingId || !userId) return
    const softwareTypes: string[] = report.softwareType
      ? report.softwareType.split(",").map((s: string) => s.trim()).filter(Boolean)
      : []

    await supabase
      .from("meetings")
      .update({
        rep_name: repName,
        rep_whatsapp: repWhatsapp,
        hospital_name: report.hospitalName,
        city: report.city || "",
        contact_name: report.contactName,
        contact_designation: report.contactDesignation || null,
        software_types: softwareTypes,
        meeting_date: report.meetingDate,
        meeting_time: istToUtc(report.meetingTime),
        meeting_type: report.meetingType || "First meeting",
        pitch_point: report.brief?.talkingPoints?.[0]?.point || "",
        live_signal: report.brief?.intelligenceSignals?.[0]?.signal || "",
        brief_json: report.brief || null,
        hospital_image_url: report.hospitalImage || null,
        hospital_logo_url: report.hospitalLogo || null,
        hospital_url: report.hospitalUrl || null,
        beds: report.brief?.hospitalOverview?.beds || report.osmBeds || null,
        reminder_sent: false,
        reminder_24h_sent: false,
      })
      .eq("id", meetingId)
      .eq("user_id", userId)

    // WhatsApp notification — fire and forget
    if (repWhatsapp) {
      const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
      const [y, mo, d] = (report.meetingDate as string).split("-").map(Number)
      const dateFmt = `${d} ${months[mo - 1]} ${y}`
      const contact = report.contactDesignation
        ? `${report.contactName}, ${report.contactDesignation}`
        : report.contactName
      const appUrl = window.location.origin

      const message =
`✏️ Meeting Updated — ${report.hospitalName}

🏥 ${report.hospitalName}, ${report.city || ""}
📆 ${dateFmt} · ${report.meetingTime} IST
👤 ${contact}
💊 ${softwareTypes.join(", ") || "—"}
📋 ${report.meetingType || "First meeting"}

Your meeting details have been updated and reminders reset.

👉 View updated details:
${appUrl}/meetings/${meetingId}`

      fetch("/api/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: repWhatsapp, message }),
      }).catch(() => {})
    }

    router.push(`/meetings/${meetingId}`)
  }

  return (
    <MeetingInputScreen
      repName={repName}
      repDesignation={repDesignation}
      repWhatsapp={repWhatsapp}
      initialData={initialData}
      isEditMode
      onSubmit={handleSubmit}
    />
  )
}

export default function EditMeetingPage() {
  return (
    <Suspense>
      <EditContent />
    </Suspense>
  )
}
