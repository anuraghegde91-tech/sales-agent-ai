import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export async function POST(request: Request) {
  try {
    const { email } = await request.json()
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("email", email.trim().toLowerCase())
      .maybeSingle()

    if (error) return NextResponse.json({ error: "Server error" }, { status: 500 })

    return NextResponse.json({ exists: !!data })
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }
}
