"use client"

import { useRouter } from "next/navigation"
import { LoginScreen } from "@/components/screens/login-screen"
import { supabase } from "@/lib/supabase"

export default function LoginClient() {
  const router = useRouter()

  const handleLogin = async () => {
    document.cookie = "salesai_auth=1; path=/; max-age=604800; SameSite=Lax"
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from("meetings").select("id").eq("user_id", user.id).limit(1)
    router.push(data && data.length > 0 ? "/dashboard" : "/create")
  }

  return (
    <LoginScreen
      onLogin={handleLogin}
      onGoToSignup={() => router.push("/signup")}
    />
  )
}
