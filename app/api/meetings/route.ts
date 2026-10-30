import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

const utcToIst = (utcTime: string): string => {
  const [h, m] = utcTime.split(":").map(Number)
  const d = new Date()
  d.setHours(h + 5, m + 30, 0)
  return d.toTimeString().slice(0, 5)
}

const rowToMeeting = (row: any) => {
  const brief = typeof row.brief_json === "string"
    ? JSON.parse(row.brief_json)
    : (row.brief_json || {})

  return {
    id: row.id,
    hospitalName: row.hospital_name || "",
    city: row.city || "",
    contactName: row.contact_name || "",
    contactDesignation: row.contact_designation || "",
    softwareType: Array.isArray(row.software_types) ? row.software_types.join(", ") : "",
    softwareTypes: row.software_types || [],
    meetingDate: row.meeting_date || "",
    meetingTime: row.meeting_time ? utcToIst(row.meeting_time) : "",
    meetingType: row.meeting_type || "",
    brief,
    hospitalLogo: row.hospital_logo_url || "",
    hospitalImage: row.hospital_image_url || "",
    hospitalUrl: row.hospital_url || "",
  }
}

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("user_id")
  const repName = request.nextUrl.searchParams.get("rep_name")

  if (!userId && !repName) {
    return NextResponse.json({ error: "user_id or rep_name is required" }, { status: 400 })
  }

  const query = supabaseAdmin
    .from("meetings")
    .select("*")
    .order("meeting_date", { ascending: false })

  const { data: rows, error } = await (userId
    ? query.eq("user_id", userId)
    : query.eq("rep_name", repName!))

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const meetings = (rows ?? []).map(rowToMeeting)

  return NextResponse.json({ meetings, count: meetings.length })
}
