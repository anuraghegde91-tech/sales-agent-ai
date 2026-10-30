import type { Metadata } from "next"
import LoginClient from "./login-client"

export const metadata: Metadata = {
  title: "Sign In",
  description:
    "Sign in to Sales Agent AI — your AI-powered field intelligence platform for hospital sales meetings.",
  openGraph: {
    title: "Sign In — Sales Agent AI",
    description: "Sign in to your Sales Agent AI account and walk into every meeting prepared.",
  },
  robots: { index: true, follow: true },
}

export default function LoginPage() {
  return <LoginClient />
}
