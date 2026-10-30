import type { Metadata } from "next"
import SignupClient from "./signup-client"

export const metadata: Metadata = {
  title: "Create Account",
  description:
    "Create your free Sales Agent AI account. Start walking into every hospital meeting with AI-powered intelligence and personalised pitch points.",
  openGraph: {
    title: "Create Account — Sales Agent AI",
    description:
      "Join Sales Agent AI — AI-powered pre-meeting briefs for field sales reps. Set up your account in under 2 minutes.",
  },
  robots: { index: true, follow: true },
}

export default function SignupPage() {
  return <SignupClient />
}
