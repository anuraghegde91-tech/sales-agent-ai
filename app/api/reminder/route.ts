import { timingSafeEqual } from "crypto"
import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import {
  sendWhatsApp,
  reminder24hMsg,
  reminder60minMsg,
} from "@/lib/send-whatsapp"

const H24 = 25 * 60 * 60 * 1000  // 25 h window — catches any cron timing gap
const H1  = 65 * 60 * 1000        // 65 min window — same reason

async function sendReminders() {
  const now = new Date()

  // Fetch meetings where at least one reminder is still pending
  const { data: meetings } = await supabaseAdmin
    .from("meetings")
    .select("*")
    .or("reminder_sent.eq.false,reminder_24h_sent.eq.false")

  if (!meetings) return { sent24h: 0, sent60min: 0 }

  let sent24h = 0
  let sent60min = 0

  for (const meeting of meetings) {
    if (!meeting.rep_whatsapp) continue

    const meetingTime = new Date(`${meeting.meeting_date}T${meeting.meeting_time}Z`)
    const diff = meetingTime.getTime() - now.getTime()

    if (diff <= 0) continue  // meeting already passed

    const softwareTypes: string[] = Array.isArray(meeting.software_types)
      ? meeting.software_types
      : []

    // ── 60-minute detailed reminder ────────────────────────────────────────
    if (diff <= H1 && !meeting.reminder_sent) {
      await sendWhatsApp(
        meeting.rep_whatsapp,
        reminder60minMsg({
          hospitalName:      meeting.hospital_name,
          city:              meeting.city || "",
          contactName:       meeting.contact_name,
          contactDesignation: meeting.contact_designation || "",
          meetingTimeUtc:    meeting.meeting_time,
          meetingType:       meeting.meeting_type || "Meeting",
          pitchPoint:        meeting.pitch_point  || "",
          liveSignal:        meeting.live_signal   || "",
          beds:              meeting.beds,
          softwareTypes,
          meetingId:         meeting.id,
        })
      )
      await supabaseAdmin
        .from("meetings")
        .update({ reminder_sent: true })
        .eq("id", meeting.id)
      sent60min++
      continue  // skip 24h check for this meeting if 60-min just fired
    }

    // ── 24-hour simple reminder ────────────────────────────────────────────
    if (diff <= H24 && diff > H1 && !meeting.reminder_24h_sent) {
      await sendWhatsApp(
        meeting.rep_whatsapp,
        reminder24hMsg({
          hospitalName:      meeting.hospital_name,
          city:              meeting.city || "",
          contactName:       meeting.contact_name,
          contactDesignation: meeting.contact_designation || "",
          meetingTimeUtc:    meeting.meeting_time,
          meetingType:       meeting.meeting_type || "Meeting",
          meetingId:         meeting.id,
        })
      )
      await supabaseAdmin
        .from("meetings")
        .update({ reminder_24h_sent: true })
        .eq("id", meeting.id)
      sent24h++
    }
  }

  return { sent24h, sent60min }
}

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const expected = Buffer.from(`Bearer ${secret}`)
  const received = Buffer.from(request.headers.get("authorization") || "")
  return expected.length === received.length && timingSafeEqual(expected, received)
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const result = await sendReminders()
  return NextResponse.json(result)
}
