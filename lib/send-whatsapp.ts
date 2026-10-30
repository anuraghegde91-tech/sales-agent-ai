// Server-only Twilio WhatsApp helper — never import in client components.

const SID   = process.env.TWILIO_ACCOUNT_SID!
const TOKEN = process.env.TWILIO_AUTH_TOKEN!
const FROM  = process.env.TWILIO_WHATSAPP_FROM!

export function cleanPhone(raw: string): string {
  let p = raw.replace(/\D/g, "")
  if (p.startsWith("0")) p = p.slice(1)
  if (!p.startsWith("91")) p = "91" + p
  return p
}

export async function sendWhatsApp(to: string, body: string): Promise<void> {
  if (!to || !SID || !TOKEN || !FROM) return
  const phone = cleanPhone(to)
  await fetch(`https://api.twilio.com/2010-04-01/Accounts/${SID}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: "Basic " + btoa(`${SID}:${TOKEN}`),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ From: FROM, To: `whatsapp:+${phone}`, Body: body }),
  })
}

// ── Message builders ────────────────────────────────────────────────────────

const APP_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://salesagentai.com"

function fmtDate(dateStr: string): string {
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
  const [y, m, d] = dateStr.split("-").map(Number)
  return `${d} ${months[m - 1]} ${y}`
}

/** Converts stored UTC HH:MM to IST display string */
function utcToIst(utcTime: string): string {
  const [h, m] = utcTime.split(":").map(Number)
  const d = new Date()
  d.setUTCHours(h, m, 0)
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Kolkata" })
}

export function meetingCreatedMsg(m: {
  hospitalName: string; city: string
  contactName: string; contactDesignation?: string
  softwareTypes: string[]; meetingDate: string; meetingTimeIst: string
  meetingType: string; meetingId: string
}): string {
  const contact = m.contactDesignation
    ? `${m.contactName}, ${m.contactDesignation}`
    : m.contactName
  return (
`📅 Meeting Scheduled — ${m.hospitalName}

🏥 ${m.hospitalName}, ${m.city}
📆 ${fmtDate(m.meetingDate)} · ${m.meetingTimeIst} IST
👤 ${contact}
💊 ${m.softwareTypes.join(", ") || "—"}
📋 ${m.meetingType}

Your AI brief will be ready 60 mins before the meeting. Walk in prepared!

👉 View meeting details:
${APP_URL}/meetings/${m.meetingId}`
  )
}

export function meetingUpdatedMsg(m: {
  hospitalName: string; city: string
  contactName: string; contactDesignation?: string
  softwareTypes: string[]; meetingDate: string; meetingTimeIst: string
  meetingType: string; meetingId: string
}): string {
  const contact = m.contactDesignation
    ? `${m.contactName}, ${m.contactDesignation}`
    : m.contactName
  return (
`✏️ Meeting Updated — ${m.hospitalName}

🏥 ${m.hospitalName}, ${m.city}
📆 ${fmtDate(m.meetingDate)} · ${m.meetingTimeIst} IST
👤 ${contact}
💊 ${m.softwareTypes.join(", ") || "—"}
📋 ${m.meetingType}

Your meeting details have been updated and reminders reset.

👉 View updated details:
${APP_URL}/meetings/${m.meetingId}`
  )
}

export function reminder24hMsg(m: {
  hospitalName: string; city: string
  contactName: string; contactDesignation?: string
  meetingTimeUtc: string; meetingType: string; meetingId: string
}): string {
  const contact = m.contactDesignation
    ? `${m.contactName}, ${m.contactDesignation}`
    : m.contactName
  const time = utcToIst(m.meetingTimeUtc)
  return (
`⏰ Meeting Tomorrow — ${m.hospitalName}

You have a meeting tomorrow at ${time} IST.

🏥 ${m.hospitalName}, ${m.city}
👤 ${contact}
📋 ${m.meetingType}

Rest up! Your full AI prep brief will arrive 60 minutes before the meeting.

👉 Preview now:
${APP_URL}/meetings/${m.meetingId}`
  )
}

export function reminder60minMsg(m: {
  hospitalName: string; city: string
  contactName: string; contactDesignation?: string
  meetingTimeUtc: string; meetingType: string
  pitchPoint?: string; liveSignal?: string
  beds?: string | number; softwareTypes: string[]; meetingId: string
}): string {
  const contact = m.contactDesignation
    ? `${m.contactName}, ${m.contactDesignation}`
    : m.contactName
  const time = utcToIst(m.meetingTimeUtc)
  const pitch  = m.pitchPoint  || "See full brief for details."
  const signal = m.liveSignal  || "See full brief for details."
  const beds   = m.beds        ? String(m.beds) : "N/A"
  const sw     = m.softwareTypes.join(", ") || "—"
  return (
`🚨 Meeting in 60 Mins — Walk in prepared!

🏥 ${m.hospitalName} | ${m.city}
⏰ ${time} IST
👤 ${contact}
📋 ${m.meetingType}
━━━━━━━━━━━━━━━━━━━━
💡 KEY PITCH POINT
${pitch}

📡 INTELLIGENCE SIGNAL
${signal}

🏢 HOSPITAL SNAPSHOT
• Beds: ${beds}
• Software Focus: ${sw}
━━━━━━━━━━━━━━━━━━━━
You've got this! 💪

👉 Full AI Brief:
${APP_URL}/meetings/${m.meetingId}`
  )
}

export function signupWelcomeMsg(repName: string): string {
  return (
`👋 Welcome to Sales Agent AI, ${repName}!

Your account is ready. Here's what you get:

⚡ AI-powered pre-meeting briefs
📡 Real-time hospital intelligence
📊 CRM deal pipeline tracking

Create your first meeting and walk in prepared.
Let's close some deals! 🎯

— Sales Agent AI Team`
  )
}
