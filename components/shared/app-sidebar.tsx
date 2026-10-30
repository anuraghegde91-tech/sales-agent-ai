"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { LayoutDashboard, CalendarDays, User, LogOut, X } from "lucide-react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { supabase } from "@/lib/supabase"

interface AppSidebarProps {
  repName?: string
  repDesignation?: string
  mobileOpen?: boolean
  onMobileClose?: () => void
}

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/meetings",  label: "Meetings",  icon: CalendarDays },
]

export function AppSidebar({
  repName = "",
  repDesignation = "",
  mobileOpen = false,
  onMobileClose = () => {},
}: AppSidebarProps) {
  const pathname = usePathname()
  const router   = useRouter()

  const initials = repName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "U"

  const handleLogout = async () => {
    await supabase.auth.signOut()
    document.cookie = "salesai_auth=; path=/; max-age=0; SameSite=Lax"
    router.push("/login")
  }

  const handleNavClick = () => {
    // Auto-close drawer on mobile when a nav item is tapped
    onMobileClose()
  }

  return (
    <>
      {/* ── Mobile backdrop overlay ── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={[
          "flex flex-col shrink-0",
          "h-screen",
          // Desktop: static, always visible
          "lg:static lg:translate-x-0 lg:w-[240px]",
          // Mobile: fixed overlay, slide in/out
          "fixed top-0 left-0 z-50 w-[270px]",
          "transition-transform duration-300 ease-in-out lg:transition-none",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        ].join(" ")}
        style={{ background: "#161B22", borderRight: "1px solid #21262D" }}
      >
        {/* Brand + mobile close */}
        <div className="px-5 py-5 flex items-center justify-between" style={{ borderBottom: "1px solid #21262D" }}>
          <div>
            <p className="text-[#E6EDF3] font-bold text-base leading-tight">Sales Agent</p>
            <p className="text-[#8B949E] text-xs mt-0.5">Field Intelligence</p>
          </div>
          {/* Close button — only on mobile */}
          <button
            className="lg:hidden p-1.5 rounded-lg text-[#8B949E] hover:text-[#E6EDF3] hover:bg-[#21262D] transition-colors"
            onClick={onMobileClose}
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/")
            return (
              <Link
                key={href}
                href={href}
                onClick={handleNavClick}
                className={[
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  active
                    ? "text-[#E6EDF3]"
                    : "text-[#8B949E] hover:text-[#E6EDF3] hover:bg-[#21262D]",
                ].join(" ")}
                style={active ? { background: "#21262D" } : {}}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* User profile */}
        <div className="p-4" style={{ borderTop: "1px solid #21262D" }}>
          <Popover>
            <PopoverTrigger asChild>
              <button className="flex items-center gap-3 w-full rounded-lg p-2 hover:bg-[#21262D] transition-colors text-left">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                  style={{ background: "#58A6FF" }}
                >
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="text-[#E6EDF3] text-sm font-medium truncate leading-tight">
                    {repName || "User"}
                  </p>
                  <p className="text-[#8B949E] text-xs truncate leading-tight">
                    {repDesignation || "Sales Rep"}
                  </p>
                </div>
              </button>
            </PopoverTrigger>
            <PopoverContent
              side="top"
              align="start"
              className="w-48 p-1"
              style={{ background: "#161B22", border: "1px solid #30363D" }}
            >
              <Link
                href="/profile"
                onClick={handleNavClick}
                className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-[#E6EDF3] hover:bg-[#21262D] transition-colors"
              >
                <User className="w-4 h-4 text-[#8B949E]" />
                Go to Profile
              </Link>
              <Separator className="my-1" style={{ background: "#30363D" }} />
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-[#f87171] hover:bg-[#21262D] transition-colors w-full text-left"
              >
                <LogOut className="w-4 h-4" />
                Switch User
              </button>
            </PopoverContent>
          </Popover>
        </div>
      </aside>
    </>
  )
}
