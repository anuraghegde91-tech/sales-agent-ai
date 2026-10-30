"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Eye, EyeOff, CheckCircle, Mail, Zap, BarChart2, Shield } from "lucide-react"

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
import { useFormik } from "formik"
import * as Yup from "yup"
import { supabase } from "@/lib/supabase"

interface SignupScreenProps {
  onSuccess: () => void
  onGoToLogin: () => void
}

const validationSchema = Yup.object({
  repName: Yup.string().trim().min(2, "Name must be at least 2 characters").required("Full name is required"),
  repDesignation: Yup.string().trim().min(2, "Designation must be at least 2 characters").required("Designation is required"),
  whatsappNumber: Yup.string().matches(/^\d{10}$/, "Enter a valid 10-digit number").optional().nullable(),
  email: Yup.string().email("Enter a valid email address").required("Work email is required"),
  password: Yup.string()
    .min(8, "Password must be at least 8 characters")
    .matches(/[A-Za-z]/, "Must contain at least one letter")
    .matches(/\d/, "Must contain at least one number")
    .required("Password is required"),
  confirmPassword: Yup.string().oneOf([Yup.ref("password")], "Passwords do not match").required("Please confirm your password"),
})

function Field({ label, error, touched, children }: { label: string; error?: string; touched?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[#6B7280] text-xs uppercase tracking-wider mb-1.5">{label}</label>
      {children}
      {touched && error && <p className="mt-1 text-red-400 text-xs">{error}</p>}
    </div>
  )
}

const inputBase = "w-full h-10 rounded-xl px-3.5 text-[#E6EDF3] text-sm placeholder:text-[#484F58] focus:outline-none transition-colors"
const inputStyle = { background: "#161B22", border: "1px solid #30363D" }

export const SignupScreen = ({ onSuccess, onGoToLogin }: SignupScreenProps) => {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [serverError, setServerError] = useState("")
  const [confirmedEmail, setConfirmedEmail] = useState("")

  const [emailSuggestions, setEmailSuggestions] = useState<string[]>([])
  const [suggestionIndex, setSuggestionIndex] = useState(-1)
  const emailInputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  const computeSuggestions = useCallback((val: string) => {
    if (!val) return []
    const atIdx = val.indexOf("@")
    if (atIdx === -1) return EMAIL_DOMAINS.map((d) => `${val}@${d}`)
    const afterAt = val.slice(atIdx + 1).toLowerCase()
    const local = val.slice(0, atIdx)
    if (!afterAt) return EMAIL_DOMAINS.map((d) => `${local}@${d}`)
    return EMAIL_DOMAINS.filter((d) => d.startsWith(afterAt)).map((d) => `${local}@${d}`)
  }, [])

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

  const formik = useFormik({
    initialValues: { repName: "", repDesignation: "", whatsappNumber: "", email: "", password: "", confirmPassword: "" },
    validationSchema,
    validateOnBlur: true,
    validateOnChange: false,
    onSubmit: async (values, { setSubmitting }) => {
      setServerError("")
      const whatsapp = values.whatsappNumber ? `+91${values.whatsappNumber.trim()}` : null
      const redirectTo = (typeof window !== "undefined" ? window.location.origin : "") + "/login"
      const { data, error } = await supabase.auth.signUp({
        email: values.email.trim().toLowerCase(),
        password: values.password,
        options: {
          emailRedirectTo: redirectTo,
          data: { rep_name: values.repName.trim(), rep_designation: values.repDesignation.trim(), rep_whatsapp: whatsapp },
        },
      })
      setSubmitting(false)
      if (error) {
        setServerError(
          error.message.toLowerCase().includes("already registered") || error.message.toLowerCase().includes("already exists")
            ? "An account with this email already exists. Please sign in instead."
            : error.message
        )
        return
      }
      if (data.user && (data.user.identities?.length ?? 0) === 0) {
        setServerError("An account with this email already exists. Please sign in instead.")
        return
      }
      // WhatsApp welcome notification — fire and forget
      if (values.whatsappNumber.trim()) {
        const name = values.repName.trim() || "there"
        fetch("/api/whatsapp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: `+91${values.whatsappNumber.trim()}`,
            message:
`👋 Welcome to Sales Agent AI, ${name}!

Your account has been created successfully.

Here's what's waiting for you:

⚡ AI-powered pre-meeting briefs
📡 Real-time hospital intelligence
📊 CRM deal pipeline tracking

Create your first meeting and walk in prepared.
Let's close some deals! 🎯

— Sales Agent AI Team`,
          }),
        }).catch(() => {})
      }

      if (!data.session) { setConfirmedEmail(values.email.trim().toLowerCase()); return }
      onSuccess()
    },
  })

  function borderColor(touched?: boolean, error?: string) {
    return touched && error ? "#ef4444" : "#30363D"
  }
  function focusBorder(touched?: boolean, error?: string) {
    return touched && error ? "#ef4444" : "#58A6FF"
  }

  // ── Email confirmation screen ──────────────────────────────────────────────
  if (confirmedEmail) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#0D1117" }}>
        <div className="w-full max-w-[400px] animate-fade-in-up text-center">
          <div className="flex justify-center mb-5">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center animate-glow-blue"
              style={{ background: "linear-gradient(135deg, #58A6FF20, #3FB95020)", border: "1px solid #58A6FF30" }}>
              <Mail className="w-9 h-9 text-[#58A6FF]" />
            </div>
          </div>
          <h2 className="text-[#E6EDF3] text-2xl font-extrabold mb-2">Check your inbox</h2>
          <p className="text-[#8B949E] text-sm mb-1">We sent a confirmation link to</p>
          <p className="text-[#58A6FF] font-semibold mb-7 break-all">{confirmedEmail}</p>
          <div className="rounded-2xl p-4 text-left space-y-3 mb-7" style={{ background: "#161B22", border: "1px solid #21262D" }}>
            {[
              "Click the link in the email to verify your account",
              "After confirming, come back and sign in",
              "Check your spam folder if you don't see it in 2 minutes",
            ].map((step) => (
              <div key={step} className="flex items-start gap-2.5">
                <CheckCircle className="w-4 h-4 text-[#3FB950] shrink-0 mt-0.5" />
                <p className="text-[#8B949E] text-sm">{step}</p>
              </div>
            ))}
          </div>
          <button onClick={onGoToLogin}
            className="w-full h-12 rounded-xl text-white text-sm font-bold hover:opacity-90 transition-all"
            style={{ background: "linear-gradient(135deg, #58A6FF, #3b82f6)", boxShadow: "0 4px 20px rgba(88,166,255,0.3)" }}>
            Go to Sign In
          </button>
        </div>
      </div>
    )
  }

  // ── Signup form ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex" style={{ background: "#0D1117" }}>

      {/* ── Left branding panel ── */}
      <div className="hidden lg:flex w-[42%] flex-col relative overflow-hidden"
        style={{ background: "linear-gradient(160deg, #0d1f3c 0%, #0D1117 40%, #0a1a10 100%)" }}>

        <div className="absolute top-[-80px] left-[-80px] w-[420px] h-[420px] rounded-full opacity-30"
          style={{ background: "radial-gradient(circle, #58A6FF40 0%, transparent 70%)" }} />
        <div className="absolute bottom-[-60px] right-[-60px] w-[380px] h-[380px] rounded-full opacity-25"
          style={{ background: "radial-gradient(circle, #3FB95040 0%, transparent 70%)" }} />
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: "linear-gradient(#E6EDF3 1px, transparent 1px), linear-gradient(90deg, #E6EDF3 1px, transparent 1px)", backgroundSize: "40px 40px" }} />

        <div className="relative z-10 flex flex-col h-full px-10 py-10">

          {/* Logo */}
          <div className="flex items-center gap-2.5 animate-fade-in-up">
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

          <div className="mt-12 animate-fade-in-up" style={{ animationDelay: "100ms" }}>
            <h1 className="text-[#E6EDF3] text-3xl font-extrabold leading-tight mb-4">
              Your AI field<br />
              <span style={{ background: "linear-gradient(135deg, #58A6FF 0%, #3FB950 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                intelligence partner
              </span>
            </h1>
            <p className="text-[#8B949E] text-sm leading-relaxed">
              Join sales reps using AI-powered briefs to walk into every hospital meeting fully prepared.
            </p>
          </div>

          {/* Steps visual */}
          <div className="mt-10 space-y-4 animate-fade-in-up" style={{ animationDelay: "200ms" }}>
            {[
              { step: "01", title: "Schedule a meeting", desc: "Add hospital, contact & time", color: "#58A6FF" },
              { step: "02", title: "AI brief generated", desc: "Hospital intel + pitch in 60 seconds", color: "#3FB950" },
              { step: "03", title: "Walk in prepared", desc: "Signals, pain points & talking points", color: "#8b5cf6" },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black shrink-0"
                  style={{ background: `${item.color}18`, color: item.color, border: `1px solid ${item.color}30` }}>
                  {item.step}
                </div>
                <div>
                  <p className="text-[#E6EDF3] text-sm font-semibold">{item.title}</p>
                  <p className="text-[#6B7280] text-xs">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Feature pills */}
          <div className="mt-auto pb-4 space-y-2.5 animate-fade-in-up" style={{ animationDelay: "300ms" }}>
            {[
              { icon: <Zap className="w-3 h-3" />, color: "#58A6FF", text: "AI pre-meeting briefs" },
              { icon: <BarChart2 className="w-3 h-3" />, color: "#3FB950", text: "Hospital intelligence signals" },
              { icon: <Shield className="w-3 h-3" />, color: "#8b5cf6", text: "CRM deal pipeline" },
            ].map((f) => (
              <div key={f.text} className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
                  style={{ background: `${f.color}18`, color: f.color }}>{f.icon}</div>
                <p className="text-[#8B949E] text-xs">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 overflow-auto"
        style={{ background: "#0D1117" }}>

        {/* Mobile logo */}
        <div className="flex lg:hidden items-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #58A6FF, #3b82f6)" }}>
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="text-[#E6EDF3] text-lg font-bold">Sales Agent <span style={{ background: "linear-gradient(135deg,#58A6FF,#3FB950)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>AI</span></span>
        </div>

        <div className="w-full max-w-[420px] animate-fade-in-up" style={{ animationDelay: "50ms" }}>

          <div className="mb-6">
            <h1 className="text-[#E6EDF3] text-3xl font-extrabold mb-1">Create account</h1>
            <p className="text-[#8B949E] text-sm">Set up your Sales Agent profile</p>
          </div>

          {serverError && (
            <div className="mb-4 px-4 py-3 rounded-xl text-red-400 text-sm" style={{ background: "#ef444410", border: "1px solid #ef444430" }}>
              {serverError}
            </div>
          )}

          <form onSubmit={formik.handleSubmit} className="space-y-3.5">

            {/* Name + Designation — side by side */}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Full name" error={formik.errors.repName} touched={formik.touched.repName}>
                <input id="repName" name="repName" type="text" placeholder="Arjun Kulkarni" autoComplete="name"
                  value={formik.values.repName} onChange={formik.handleChange}
                  className={inputBase} style={{ ...inputStyle, borderColor: borderColor(formik.touched.repName, formik.errors.repName) }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = focusBorder(formik.touched.repName, formik.errors.repName) }}
                  onBlur={(e) => { formik.handleBlur(e); e.currentTarget.style.borderColor = borderColor(formik.touched.repName, formik.errors.repName) }} />
              </Field>
              <Field label="Designation" error={formik.errors.repDesignation} touched={formik.touched.repDesignation}>
                <input id="repDesignation" name="repDesignation" type="text" placeholder="Sales Executive" autoComplete="organization-title"
                  value={formik.values.repDesignation} onChange={formik.handleChange}
                  className={inputBase} style={{ ...inputStyle, borderColor: borderColor(formik.touched.repDesignation, formik.errors.repDesignation) }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = focusBorder(formik.touched.repDesignation, formik.errors.repDesignation) }}
                  onBlur={(e) => { formik.handleBlur(e); e.currentTarget.style.borderColor = borderColor(formik.touched.repDesignation, formik.errors.repDesignation) }} />
              </Field>
            </div>

            {/* WhatsApp */}
            <Field label="WhatsApp number (optional)" error={formik.errors.whatsappNumber} touched={formik.touched.whatsappNumber}>
              <div className="flex h-10 rounded-xl overflow-hidden transition-colors"
                style={{ ...inputStyle, borderColor: formik.touched.whatsappNumber && formik.errors.whatsappNumber ? "#ef4444" : "#30363D" }}>
                <span className="flex items-center px-3 text-[#6B7280] text-sm shrink-0" style={{ borderRight: "1px solid #30363D" }}>+91</span>
                <input id="whatsappNumber" name="whatsappNumber" type="tel" placeholder="98765 43210" autoComplete="tel"
                  value={formik.values.whatsappNumber} onChange={formik.handleChange} onBlur={formik.handleBlur}
                  className="flex-1 bg-transparent px-3 text-[#E6EDF3] text-sm placeholder:text-[#484F58] focus:outline-none"
                />
              </div>
            </Field>

            {/* Email */}
            <Field label="Work email" error={formik.errors.email} touched={formik.touched.email}>
              <div className="relative">
                <input
                  ref={emailInputRef}
                  id="email" name="email"
                  type="text" inputMode="email"
                  placeholder="you@company.com"
                  autoComplete="off"
                  value={formik.values.email}
                  onChange={(e) => {
                    formik.setFieldValue("email", e.target.value)
                    setSuggestionIndex(-1)
                    setEmailSuggestions(computeSuggestions(e.target.value))
                  }}
                  onKeyDown={(e) => {
                    if (!emailSuggestions.length) return
                    if (e.key === "ArrowDown") { e.preventDefault(); setSuggestionIndex((i) => Math.min(i + 1, emailSuggestions.length - 1)) }
                    else if (e.key === "ArrowUp") { e.preventDefault(); setSuggestionIndex((i) => Math.max(i - 1, -1)) }
                    else if (e.key === "Enter" && suggestionIndex >= 0) { e.preventDefault(); formik.setFieldValue("email", emailSuggestions[suggestionIndex]); setEmailSuggestions([]); setSuggestionIndex(-1) }
                    else if (e.key === "Escape" || e.key === "Tab") { setEmailSuggestions([]); setSuggestionIndex(-1) }
                  }}
                  className={inputBase}
                  style={{ ...inputStyle, borderColor: borderColor(formik.touched.email, formik.errors.email) }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = focusBorder(formik.touched.email, formik.errors.email)
                    setEmailSuggestions(computeSuggestions(formik.values.email))
                  }}
                  onBlur={(e) => { formik.handleBlur(e); e.currentTarget.style.borderColor = borderColor(formik.touched.email, formik.errors.email) }}
                />
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
                          onMouseDown={(e) => { e.preventDefault(); formik.setFieldValue("email", s); setEmailSuggestions([]); setSuggestionIndex(-1); emailInputRef.current?.focus() }}
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
            </Field>

            {/* Password + Confirm — side by side */}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Password" error={formik.errors.password} touched={formik.touched.password}>
                <div className="relative">
                  <input id="password" name="password" type={showPassword ? "text" : "password"}
                    placeholder="Min. 8 chars" autoComplete="new-password"
                    value={formik.values.password} onChange={formik.handleChange}
                    className={inputBase + " pr-9"} style={{ ...inputStyle, borderColor: borderColor(formik.touched.password, formik.errors.password) }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = focusBorder(formik.touched.password, formik.errors.password) }}
                    onBlur={(e) => { formik.handleBlur(e); e.currentTarget.style.borderColor = borderColor(formik.touched.password, formik.errors.password) }} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#484F58] hover:text-[#8B949E]">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </Field>
              <Field label="Confirm" error={formik.errors.confirmPassword} touched={formik.touched.confirmPassword}>
                <div className="relative">
                  <input id="confirmPassword" name="confirmPassword" type={showConfirm ? "text" : "password"}
                    placeholder="Re-enter" autoComplete="new-password"
                    value={formik.values.confirmPassword} onChange={formik.handleChange}
                    className={inputBase + " pr-9"} style={{ ...inputStyle, borderColor: borderColor(formik.touched.confirmPassword, formik.errors.confirmPassword) }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = focusBorder(formik.touched.confirmPassword, formik.errors.confirmPassword) }}
                    onBlur={(e) => { formik.handleBlur(e); e.currentTarget.style.borderColor = borderColor(formik.touched.confirmPassword, formik.errors.confirmPassword) }} />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#484F58] hover:text-[#8B949E]">
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </Field>
            </div>

            <button type="submit" disabled={formik.isSubmitting}
              className="w-full h-12 rounded-xl text-white text-[15px] font-bold transition-all hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed mt-1"
              style={{ background: "linear-gradient(135deg, #58A6FF, #3b82f6)", boxShadow: "0 4px 20px rgba(88,166,255,0.3)" }}>
              {formik.isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Creating account…
                </span>
              ) : "Create account"}
            </button>
          </form>

          <p className="mt-5 text-center text-[#8B949E] text-sm">
            Already have an account?{" "}
            <button onClick={onGoToLogin} className="text-[#58A6FF] font-semibold hover:opacity-80 transition-opacity">
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
