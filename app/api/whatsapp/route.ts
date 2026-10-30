import { NextResponse } from "next/server"
import { sendWhatsApp } from "@/lib/send-whatsapp"

export async function POST(request: Request) {
  try {
    const { to, message } = await request.json()
    if (!to || !message) {
      return NextResponse.json({ error: "Missing to or message" }, { status: 400 })
    }
    await sendWhatsApp(to, message)
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("WhatsApp send error:", err)
    return NextResponse.json({ error: "Failed to send" }, { status: 500 })
  }
}
