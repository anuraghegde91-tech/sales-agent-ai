import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

async function getUserFromRequest(request: Request) {
  const auth = request.headers.get("authorization") || ""
  const token = auth.replace("Bearer ", "").trim()
  if (!token) return null
  const { data: { user } } = await supabaseAdmin.auth.getUser(token)
  return user ?? null
}

export async function GET(request: Request) {
  const user = await getUserFromRequest(request)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("id, rep_name, rep_designation, whatsapp_number, email, is_verified, created_at")
    .eq("id", user.id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ profile: data })
}

export async function PATCH(request: Request) {
  const user = await getUserFromRequest(request)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  const updates: Record<string, string> = {}

  if (typeof body.rep_name        === "string" && body.rep_name.trim())        updates.rep_name        = body.rep_name.trim()
  if (typeof body.rep_designation === "string") updates.rep_designation = body.rep_designation.trim()
  if (typeof body.whatsapp_number === "string") updates.whatsapp_number = body.whatsapp_number.trim()

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No updatable fields provided" }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from("profiles")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", user.id)
    .select("id, rep_name, rep_designation, whatsapp_number, email")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, profile: data })
}
