"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { MeetingInputScreen } from "@/components/screens/meeting-input-screen"
import { supabase } from "@/lib/supabase"

function istToUtc(istTime: string): string {
  const [h, m] = istTime.split(":").map(Number)
  const d = new Date()
  d.setHours(h - 5, m - 30, 0)
  return d.toTimeString().slice(0, 5)
}

export default function CreateMeetingPage() {
  const router = useRouter()
  const [repName, setRepName] = useState("")
  const [repDesignation, setRepDesignation] = useState("")
  const [repWhatsapp, setRepWhatsapp] = useState("")
  const [userId, setUserId] = useState("")

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
    }
    load()
  }, [])

  const handleSubmit = async (report: any) => {
    const softwareTypes: string[] = report.softwareType
      ? report.softwareType.split(",").map((s: string) => s.trim()).filter(Boolean)
      : []
    const meetingTimeUtc = istToUtc(report.meetingTime)

    const { data } = await supabase
      .from("meetings")
      .insert({
        user_id: userId,
        rep_name: repName,
        rep_whatsapp: repWhatsapp,
        hospital_name: report.hospitalName,
        city: report.city || "",
        contact_name: report.contactName,
        contact_designation: report.contactDesignation || null,
        software_types: softwareTypes,
        meeting_date: report.meetingDate,
        meeting_time: meetingTimeUtc,
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
        source: "form",
      })
      .select("id")
      .single()

    // WhatsApp notification — fire and forget
    if (repWhatsapp && data?.id) {
      const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
      const [y, mo, d] = (report.meetingDate as string).split("-").map(Number)
      const dateFmt = `${d} ${months[mo - 1]} ${y}`
      const contact = report.contactDesignation
        ? `${report.contactName}, ${report.contactDesignation}`
        : report.contactName
      const appUrl = window.location.origin

      const message =
`📅 Meeting Scheduled — ${report.hospitalName}

🏥 ${report.hospitalName}, ${report.city || ""}
📆 ${dateFmt} · ${report.meetingTime} IST
👤 ${contact}
💊 ${softwareTypes.join(", ") || "—"}
📋 ${report.meetingType || "First meeting"}

Your AI brief will be ready 60 mins before the meeting. Walk in prepared!

👉 View meeting details:
${appUrl}/meetings/${data.id}`

      fetch("/api/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: repWhatsapp, message }),
      }).catch(() => {})
    }

    router.push(data?.id ? `/meetings/${data.id}` : "/meetings")
  }

  return (
    <MeetingInputScreen
      repName={repName}
      repDesignation={repDesignation}
      repWhatsapp={repWhatsapp}
      onSubmit={handleSubmit}
    />
  )
}
