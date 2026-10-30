"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Eye, EyeOff, ArrowLeft, RefreshCw, Zap, BarChart2, Shield } from "lucide-react"
import { supabase } from "@/lib/supabase"

const EMAIL_DOMAINS = [
  "gmail.com",
  "yahoo.com",
  "outlook.com",
  "hotmail.com",
  "icloud.com",
  "live.com",
  "protonmail.com",
  "yahoo.in",
  "rediffmail.com",
  "me.com",
]

interface LoginScreenProps {
  onLogin: () => void
  onGoToSignup: () => void
}

export const LoginScreen = ({ onLogin, onGoToSignup }: LoginScreenProps) => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [unverifiedEmail, setUnverifiedEmail] = useState("")
  const [resendState, setResendState] = useState<"idle" | "sending" | "sent">("idle")
  const [forgotMode, setForgotMode] = useState(false)
  const [forgotEmail, setForgotEmail] = useState("")
  const [forgotState, setForgotState] = useState<"idle" | "sending" | "sent">("idle")
  const [forgotError, setForgotError] = useState("")

  const [emailSuggestions, setEmailSuggestions] = useState<string[]>([])
  const [suggestionIndex, setSuggestionIndex] = useState(-1)
  const emailInputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  const [forgotSuggestions, setForgotSuggestions] = useState<string[]>([])
  const [forgotSuggestionIndex, setForgotSuggestionIndex] = useState(-1)
  const forgotInputRef = useRef<HTMLInputElement>(null)
  const forgotSuggestionsRef = useRef<HTMLDivElement>(null)

  const computeSuggestions = useCallback((val: string) => {
    if (!val) return []
    const atIdx = val.indexOf("@")
    if (atIdx === -1) {
      // No @ yet — show all domains appended to local part
      return EMAIL_DOMAINS.map((d) => `${val}@${d}`)
    }
    const afterAt = val.slice(atIdx + 1).toLowerCase()
    const local = val.slice(0, atIdx)
    if (!afterAt) return EMAIL_DOMAINS.map((d) => `${local}@${d}`)
    const filtered = EMAIL_DOMAINS.filter((d) => d.startsWith(afterAt))
    return filtered.map((d) => `${local}@${d}`)
  }, [])

  const handleEmailChange = (val: string) => {
    setEmail(val)
    setSuggestionIndex(-1)
    setEmailSuggestions(computeSuggestions(val))
  }

  const applySuggestion = (suggestion: string) => {
    setEmail(suggestion)
    setEmailSuggestions([])
    setSuggestionIndex(-1)
    emailInputRef.current?.focus()
  }

  const handleEmailKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!emailSuggestions.length) return
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSuggestionIndex((i) => Math.min(i + 1, emailSuggestions.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSuggestionIndex((i) => Math.max(i - 1, -1))
    } else if (e.key === "Enter" && suggestionIndex >= 0) {
      e.preventDefault()
      applySuggestion(emailSuggestions[suggestionIndex])
    } else if (e.key === "Escape" || e.key === "Tab") {
      setEmailSuggestions([])
      setSuggestionIndex(-1)
    }
  }

  // Close login email dropdown when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        emailInputRef.current && !emailInputRef.current.contains(e.target as Node) &&
        suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)
      ) {
        setEmailSuggestions([])
        setSuggestionIndex(-1)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const handleForgotEmailChange = (val: string) => {
    setForgotEmail(val)
    setForgotSuggestionIndex(-1)
    setForgotSuggestions(computeSuggestions(val))
  }

  const applyForgotSuggestion = (suggestion: string) => {
    setForgotEmail(suggestion)
    setForgotSuggestions([])
    setForgotSuggestionIndex(-1)
    forgotInputRef.current?.focus()
  }

  const handleForgotEmailKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!forgotSuggestions.length) return
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setForgotSuggestionIndex((i) => Math.min(i + 1, forgotSuggestions.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setForgotSuggestionIndex((i) => Math.max(i - 1, -1))
    } else if (e.key === "Enter" && forgotSuggestionIndex >= 0) {
      e.preventDefault()
      applyForgotSuggestion(forgotSuggestions[forgotSuggestionIndex])
    } else if (e.key === "Escape" || e.key === "Tab") {
      setForgotSuggestions([])
      setForgotSuggestionIndex(-1)
    }
  }

  // Close forgot-password email dropdown when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        forgotInputRef.current && !forgotInputRef.current.contains(e.target as Node) &&
        forgotSuggestionsRef.current && !forgotSuggestionsRef.current.contains(e.target as Node)
      ) {
        setForgotSuggestions([])
        setForgotSuggestionIndex(-1)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const handleResend = async () => {
    if (!unverifiedEmail || resendState === "sending") return
    setResendState("sending")
    await supabase.auth.resend({ type: "signup", email: unverifiedEmail })
    setResendState("sent")
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!forgotEmail.trim()) return
    setForgotState("sending")
    setForgotError("")

    const normalizedEmail = forgotEmail.trim().toLowerCase()

    // Check email exists in our DB before firing Supabase reset email
    try {
      const res = await fetch("/api/auth/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail }),
      })
      const json = await res.json()
      if (!json.exists) {
        setForgotError("No account found with this email address.")
        setForgotState("idle")
        return
      }
    } catch {
      setForgotError("Could not verify email. Please try again.")
      setForgotState("idle")
      return
    }

    const redirectTo = (typeof window !== "undefined" ? window.location.origin : "") + "/reset-password"
    const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, { redirectTo })
    if (error) { setForgotError(error.message); setForgotState("idle") }
    else setForgotState("sent")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return
    setIsLoading(true)
    setError("")
    setUnverifiedEmail("")
    setResendState("idle")

    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    setIsLoading(false)
    if (signInError) { setError(signInError.message); return }

    const userId = data.user!.id
    const { data: profile } = await supabase.from("profiles").select("rep_name, whatsapp_number, is_verified").eq("id", userId).single()
    if (!profile) { await supabase.auth.signOut(); setError("No account found. Please sign up first."); return }
    if (!profile.is_verified) { await supabase.auth.signOut(); setUnverifiedEmail(email.trim().toLowerCase()); return }

    if (profile.whatsapp_number) {
      fetch("/api/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: profile.whatsapp_number, message: `Welcome back to Sales AI Agent! You are signed in as ${profile.rep_name}.` }),
      }).catch(() => {})
    }
    onLogin()
  }

  return (
    <div className="min-h-screen flex" style={{ background: "#0D1117" }}>

      {/* ── Left branding panel ── */}
      <div className="hidden lg:flex w-[52%] flex-col relative overflow-hidden"
        style={{ background: "linear-gradient(160deg, #0d1f3c 0%, #0D1117 40%, #0a1a10 100%)" }}>

        {/* Ambient orbs */}
        <div className="absolute top-[-80px] left-[-80px] w-[420px] h-[420px] rounded-full opacity-30"
          style={{ background: "radial-gradient(circle, #58A6FF40 0%, transparent 70%)" }} />
        <div className="absolute bottom-[-60px] right-[-60px] w-[380px] h-[380px] rounded-full opacity-25"
          style={{ background: "radial-gradient(circle, #3FB95040 0%, transparent 70%)" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #8b5cf640 0%, transparent 70%)" }} />

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: "linear-gradient(#E6EDF3 1px, transparent 1px), linear-gradient(90deg, #E6EDF3 1px, transparent 1px)", backgroundSize: "40px 40px" }} />

        <div className="relative z-10 flex flex-col h-full px-12 py-10">

          {/* Logo */}
          <div className="flex items-center gap-2.5 animate-fade-in-up" style={{ animationDelay: "0ms" }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #58A6FF, #3b82f6)" }}>
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-[#E6EDF3] text-lg font-bold">Sales Agent</span>
              <span className="text-sm font-bold ml-1"
                style={{ background: "linear-gradient(135deg, #58A6FF, #3FB950)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                AI
              </span>
            </div>
          </div>

          {/* Headline */}
          <div className="mt-14 animate-fade-in-up" style={{ animationDelay: "100ms" }}>
            <h1 className="text-[#E6EDF3] text-4xl font-extrabold leading-tight mb-4">
              Close more deals.<br />
              <span style={{ background: "linear-gradient(135deg, #58A6FF 0%, #3FB950 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                Walk in prepared.
              </span>
            </h1>
            <p className="text-[#8B949E] text-base leading-relaxed max-w-sm">
              AI-powered pre-meeting briefs, real-time hospital intelligence, and deal pipeline tracking — all in one place.
            </p>
          </div>

          {/* Floating cards */}
          <div className="flex-1 relative mt-10">

            {/* Card 1 — Hospital Brief */}
            <div className="animate-float absolute top-0 left-0 w-[280px]"
              style={{ "--float-rotate": "-2deg" } as any}>
              <div className="rounded-2xl p-4" style={{ background: "rgba(22,27,34,0.9)", border: "1px solid #30363D", boxShadow: "0 16px 48px rgba(0,0,0,0.4)" }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white"
                      style={{ background: "linear-gradient(135deg, #58A6FF, #3b82f6)" }}>A</div>
                    <div>
                      <p className="text-[#E6EDF3] text-xs font-bold">Apollo Hospital</p>
                      <p className="text-[#6B7280] text-[10px]">Ahmedabad</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: "#8b5cf620", color: "#a78bfa" }}>Demo</span>
                </div>
                <div className="h-px mb-3" style={{ background: "#21262D" }} />
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse" />
                  <p className="text-[#4ade80] text-[10px] font-semibold">AI Brief Ready</p>
                </div>
                <p className="text-[#8B949E] text-[10px]">Dr. Mehta · Director</p>
                <p className="text-[#8B949E] text-[10px]">Today 14:00 IST · HIS, RIS</p>
              </div>
            </div>

            {/* Card 2 — Intelligence Signal */}
            <div className="animate-float-alt absolute top-8 right-4 w-[240px]"
              style={{ "--float-rotate": "2deg", animationDelay: "0.8s" } as any}>
              <div className="rounded-2xl p-4" style={{ background: "rgba(13,17,23,0.95)", border: "1px solid #21262D", boxShadow: "0 16px 48px rgba(0,0,0,0.4)" }}>
                <div className="flex items-center gap-1.5 mb-2">
                  <div className="w-2 h-2 rounded-full bg-[#ef4444]" style={{ boxShadow: "0 0 6px #ef4444" }} />
                  <p className="text-[#ef4444] text-[10px] font-bold uppercase tracking-wider">High Signal</p>
                </div>
                <p className="text-[#E6EDF3] text-xs font-semibold leading-snug mb-2">
                  Apollo expanding to new wing — HIS upgrade planned Q3
                </p>
                <p className="text-[#6B7280] text-[10px]">Source: Times of India</p>
              </div>
            </div>

            {/* Card 3 — Deal Won */}
            <div className="animate-float-slow absolute bottom-16 left-8 w-[220px]"
              style={{ "--float-rotate": "-1deg", animationDelay: "1.5s" } as any}>
              <div className="rounded-2xl p-4 animate-glow-green"
                style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.25)" }}>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-5 h-5 rounded-full bg-[#22c55e] flex items-center justify-center">
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                  <p className="text-[#4ade80] text-xs font-bold">Deal Won!</p>
                </div>
                <p className="text-[#86efac] text-[11px]">Fortis HIS — ₹18L contract</p>
                <p className="text-[#4ade80]/60 text-[10px] mt-0.5">3 meetings · 6 weeks</p>
              </div>
            </div>

            {/* Card 4 — CRM Activity */}
            <div className="animate-float absolute bottom-4 right-2 w-[200px]"
              style={{ "--float-rotate": "1.5deg", animationDelay: "2s" } as any}>
              <div className="rounded-2xl p-3.5" style={{ background: "rgba(22,27,34,0.9)", border: "1px solid #30363D" }}>
                <p className="text-[#6B7280] text-[10px] uppercase tracking-wider font-semibold mb-2">CRM Update</p>
                <div className="space-y-1.5">
                  {[
                    { color: "#58A6FF", label: "Demo Conducted" },
                    { color: "#f59e0b", label: "Proposal Sent" },
                    { color: "#8b5cf6", label: "Stage: Negotiation" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: item.color }} />
                      <p className="text-[#8B949E] text-[10px]">{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Feature bullets */}
          <div className="mt-auto pb-4 space-y-3 animate-fade-in-up" style={{ animationDelay: "300ms" }}>
            {[
              { icon: <Zap className="w-3.5 h-3.5" />, color: "#58A6FF", text: "AI briefs generated 60 min before every meeting" },
              { icon: <BarChart2 className="w-3.5 h-3.5" />, color: "#3FB950", text: "Real-time hospital news & intelligence signals" },
              { icon: <Shield className="w-3.5 h-3.5" />, color: "#8b5cf6", text: "Full CRM pipeline with deal stage tracking" },
            ].map((f) => (
              <div key={f.text} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: `${f.color}18`, color: f.color }}>{f.icon}</div>
                <p className="text-[#8B949E] text-xs">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 overflow-auto"
        style={{ background: "#0D1117" }}>

        {/* Mobile logo */}
        <div className="flex lg:hidden items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #58A6FF, #3b82f6)" }}>
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="text-[#E6EDF3] text-lg font-bold">Sales Agent <span style={{ background: "linear-gradient(135deg,#58A6FF,#3FB950)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>AI</span></span>
        </div>

        <div className="w-full max-w-[400px] animate-fade-in-up" style={{ animationDelay: "50ms" }}>

          {forgotMode ? (
            /* ── Forgot password ── */
            <div>
              <button type="button" onClick={() => { setForgotMode(false); setForgotState("idle"); setForgotError(""); setForgotEmail("") }}
                className="flex items-center gap-1.5 text-[#8B949E] text-xs mb-6 hover:text-[#E6EDF3] transition-colors">
                <ArrowLeft className="w-3.5 h-3.5" /> Back to sign in
              </button>
              <h2 className="text-[#E6EDF3] text-2xl font-bold mb-1">Reset password</h2>
              <p className="text-[#8B949E] text-sm mb-7">We&apos;ll email you a reset link.</p>
              {forgotState === "sent" ? (
                <div className="px-4 py-4 rounded-xl" style={{ background: "#22c55e10", border: "1px solid #22c55e30" }}>
                  <p className="text-[#4ade80] text-sm font-semibold mb-1">Check your inbox</p>
                  <p className="text-[#4ade80]/70 text-xs">A reset link was sent to <span className="font-medium">{forgotEmail}</span>.</p>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  {forgotError && <div className="px-4 py-3 rounded-lg text-red-400 text-sm" style={{ background: "#ef444410", border: "1px solid #ef444430" }}>{forgotError}</div>}
                  <div className="relative">
                    <label className="block text-[#6B7280] text-xs uppercase tracking-wider mb-2">Work email</label>
                    <input
                      ref={forgotInputRef}
                      type="text"
                      inputMode="email"
                      value={forgotEmail}
                      onChange={(e) => handleForgotEmailChange(e.target.value)}
                      onKeyDown={handleForgotEmailKeyDown}
                      placeholder="you@company.com"
                      required
                      autoComplete="off"
                      className="w-full h-11 rounded-xl px-4 text-[#E6EDF3] text-sm placeholder:text-[#484F58] focus:outline-none transition-colors"
                      style={{ background: "#161B22", border: "1px solid #30363D" }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = "#58A6FF"
                        setForgotSuggestions(computeSuggestions(forgotEmail))
                      }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = "#30363D" }}
                    />
                    {forgotSuggestions.length > 0 && (
                      <div
                        ref={forgotSuggestionsRef}
                        className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 rounded-xl overflow-hidden"
                        style={{ background: "#161B22", border: "1px solid #30363D", boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}
                      >
                        {forgotSuggestions.map((s, i) => {
                          const atIdx = s.indexOf("@")
                          const local = s.slice(0, atIdx + 1)
                          const domain = s.slice(atIdx + 1)
                          return (
                            <button
                              key={s}
                              type="button"
                              onMouseDown={(e) => { e.preventDefault(); applyForgotSuggestion(s) }}
                              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-left transition-colors"
                              style={{
                                background: i === forgotSuggestionIndex ? "#21262D" : "transparent",
                                borderBottom: i < forgotSuggestions.length - 1 ? "1px solid #21262D" : "none",
                              }}
                              onMouseEnter={() => setForgotSuggestionIndex(i)}
                              onMouseLeave={() => setForgotSuggestionIndex(-1)}
                            >
                              <span className="text-[#484F58]">{local}</span>
                              <span className="text-[#E6EDF3] font-medium">{domain}</span>
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                  <button type="submit" disabled={forgotState === "sending"}
                    className="w-full h-11 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-60"
                    style={{ background: "#58A6FF" }}>
                    {forgotState === "sending" ? "Sending…" : "Send reset link"}
                  </button>
                </form>
              )}
            </div>
          ) : (
            /* ── Sign in form ── */
            <div>
              <div className="mb-7">
                <h1 className="text-[#E6EDF3] text-3xl font-extrabold mb-1">Welcome back</h1>
                <p className="text-[#8B949E] text-sm">Sign in to your Sales Agent account</p>
              </div>

              {/* Unverified banner */}
              {unverifiedEmail && (
                <div className="mb-5 px-4 py-4 rounded-xl" style={{ background: "#f59e0b10", border: "1px solid #f59e0b30" }}>
                  <p className="text-[#fbbf24] text-sm font-semibold mb-1">Email not verified</p>
                  <p className="text-[#fbbf24]/70 text-xs mb-3">Check your inbox at <span className="font-medium">{unverifiedEmail}</span> and click the confirmation link.</p>
                  {resendState === "sent" ? (
                    <p className="text-[#4ade80] text-xs font-medium">Verification email resent.</p>
                  ) : (
                    <button type="button" onClick={handleResend} disabled={resendState === "sending"}
                      className="flex items-center gap-1.5 text-[#58A6FF] text-xs font-semibold hover:underline disabled:opacity-60">
                      <RefreshCw className={`w-3.5 h-3.5 ${resendState === "sending" ? "animate-spin" : ""}`} />
                      {resendState === "sending" ? "Sending…" : "Resend verification email"}
                    </button>
                  )}
                </div>
              )}

              {error && (
                <div className="mb-4 px-4 py-3 rounded-xl text-red-400 text-sm" style={{ background: "#ef444410", border: "1px solid #ef444430" }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <label className="block text-[#6B7280] text-xs uppercase tracking-wider mb-2">Work email</label>
                  <input
                    ref={emailInputRef}
                    type="text"
                    inputMode="email"
                    value={email}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    onKeyDown={handleEmailKeyDown}
                    placeholder="you@company.com"
                    required
                    autoComplete="off"
                    className="w-full h-11 rounded-xl px-4 text-[#E6EDF3] text-sm placeholder:text-[#484F58] focus:outline-none transition-colors"
                    style={{ background: "#161B22", border: "1px solid #30363D" }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "#58A6FF"
                      setEmailSuggestions(computeSuggestions(email))
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "#30363D"
                    }}
                  />
                  {/* Suggestions dropdown */}
                  {emailSuggestions.length > 0 && (
                    <div
                      ref={suggestionsRef}
                      className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 rounded-xl overflow-hidden"
                      style={{ background: "#161B22", border: "1px solid #30363D", boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}
                    >
                      {emailSuggestions.map((s, i) => {
                        const atIdx = s.indexOf("@")
                        const local = s.slice(0, atIdx + 1)
                        const domain = s.slice(atIdx + 1)
                        return (
                          <button
                            key={s}
                            type="button"
                            onMouseDown={(e) => { e.preventDefault(); applySuggestion(s) }}
                            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-left transition-colors"
                            style={{
                              background: i === suggestionIndex ? "#21262D" : "transparent",
                              borderBottom: i < emailSuggestions.length - 1 ? "1px solid #21262D" : "none",
                            }}
                            onMouseEnter={() => setSuggestionIndex(i)}
                            onMouseLeave={() => setSuggestionIndex(-1)}
                          >
                            <span className="text-[#484F58]">{local}</span>
                            <span className="text-[#E6EDF3] font-medium">{domain}</span>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[#6B7280] text-xs uppercase tracking-wider">Password</label>
                    <button type="button" onClick={() => { setForgotMode(true); setForgotEmail(email) }}
                      className="text-[#58A6FF] text-xs hover:opacity-80 transition-opacity">
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password" required autoComplete="current-password"
                      className="w-full h-11 rounded-xl px-4 pr-11 text-[#E6EDF3] text-sm placeholder:text-[#484F58] focus:outline-none transition-colors"
                      style={{ background: "#161B22", border: "1px solid #30363D" }}
                      onFocus={(e) => e.currentTarget.style.borderColor = "#58A6FF"}
                      onBlur={(e) => e.currentTarget.style.borderColor = "#30363D"} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#484F58] hover:text-[#8B949E] transition-colors">
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <button type="submit" disabled={isLoading}
                  className="w-full h-12 rounded-xl text-white text-[15px] font-bold transition-all hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ background: "linear-gradient(135deg, #58A6FF, #3b82f6)", boxShadow: "0 4px 20px rgba(88,166,255,0.3)" }}>
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      Signing in…
                    </span>
                  ) : "Sign in"}
                </button>
              </form>

              <p className="mt-6 text-center text-[#8B949E] text-sm">
                Don&apos;t have an account?{" "}
                <button onClick={onGoToSignup} className="text-[#58A6FF] font-semibold hover:opacity-80 transition-opacity">
                  Create one
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
