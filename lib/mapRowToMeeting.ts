export function mapRowToMeeting(row: any) {
  const brief =
    typeof row.brief_json === "string"
      ? JSON.parse(row.brief_json)
      : row.brief_json || {}

  const [h, m] = (row.meeting_time || "00:00").split(":").map(Number)
  const d = new Date()
  d.setHours(h + 5, m + 30, 0)
  const meetingTimeIst = d.toTimeString().slice(0, 5)

  return {
    id: row.id,
    hospitalName: row.hospital_name || "",
    city: row.city || "",
    contactName: row.contact_name || "",
    contactDesignation: row.contact_designation || "",
    softwareType: Array.isArray(row.software_types)
      ? row.software_types.join(", ")
      : "",
    softwareTypes: row.software_types || [],
    meetingDate: row.meeting_date || "",
    meetingTime: meetingTimeIst,
    meetingType: row.meeting_type || "",
    hospitalImage: row.hospital_image_url || "",
    hospitalLogo: row.hospital_logo_url || "",
    hospitalUrl: row.hospital_url || "",
    status: row.status || "pending",
    brief,
  }
}
