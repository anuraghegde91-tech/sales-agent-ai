"use client"

import { useRouter } from "next/navigation"
import { SignupScreen } from "@/components/screens/signup-screen"

export default function SignupClient() {
  const router = useRouter()
  return (
    <SignupScreen
      onSuccess={() => router.push("/login")}
      onGoToLogin={() => router.push("/login")}
    />
  )
}
