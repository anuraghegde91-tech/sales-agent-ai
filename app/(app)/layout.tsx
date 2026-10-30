"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Menu, Zap } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { AppSidebar } from "@/components/shared/app-sidebar"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [repName, setRepName]           = useState("")
  const [repDesignation, setRepDesignation] = useState("")
  const [ready, setReady]               = useState(false)
  const [mobileOpen, setMobileOpen]     = useState(false)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push("/login"); return }

      const { data: profile } = await supabase
        .from("profiles")
        .select("rep_name, rep_designation")
        .eq("id", user.id)
        .single()

      if (profile) {
        setRepName(profile.rep_name || "")
        setRepDesignation(profile.rep_designation || "")
      }
      setReady(true)
    }
    init()
  }, [])

  if (!ready) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ background: "#0D1117" }}>
        <div className="w-6 h-6 rounded-full border-2 border-[#58A6FF] border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#0D1117" }}>
      <AppSidebar
        repName={repName}
        repDesignation={repDesignation}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* Right side: mobile top bar + page content */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* ── Mobile top bar (hidden on lg+) ── */}
        <header
          className="lg:hidden flex items-center gap-3 px-4 h-14 shrink-0"
          style={{ background: "#161B22", borderBottom: "1px solid #21262D" }}
        >
          <button
            className="p-2 rounded-lg text-[#8B949E] hover:text-[#E6EDF3] hover:bg-[#21262D] transition-colors"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #58A6FF, #3b82f6)" }}>
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-[#E6EDF3] text-sm font-bold">Sales Agent
              <span className="ml-1 font-bold"
                style={{ background: "linear-gradient(135deg, #58A6FF, #3FB950)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                AI
              </span>
            </span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
