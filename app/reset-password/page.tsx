"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Zap, ShieldCheck, KeyRound, Lock, CheckCircle2 } from "lucide-react"
import { useFormik } from "formik"
import * as Yup from "yup"
import { supabase } from "@/lib/supabase"

const schema = Yup.object({
  password: Yup.string()
    .min(8, "Password must be at least 8 characters")
    .matches(/[A-Za-z]/, "Must contain at least one letter")
    .matches(/\d/, "Must contain at least one number")
    .required("Password is required"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password")], "Passwords do not match")
    .required("Please confirm your password"),
})

const STEPS = [
  { n: "01", label: "Request reset link", done: true },
  { n: "02", label: "Verify your email", done: true },
  { n: "03", label: "Set new password", done: false, active: true },
]

function ResetPasswordContent() {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [sessionError, setSessionError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true)
    })
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true)
    })
    return () => subscription.unsubscribe()
  }, [])

  const formik = useFormik({
    initialValues: { password: "", confirmPassword: "" },
    validationSchema: schema,
    validateOnBlur: true,
    validateOnChange: false,
    onSubmit: async (values, { setSubmitting }) => {
      const { error } = await supabase.auth.updateUser({ password: values.password })
      setSubmitting(false)
      if (error) {
        setSessionError(error.message)
      } else {
        setDone(true)
        setTimeout(() => router.push("/login"), 2500)
      }
    },
  })

  const inputBase = (touched: boolean | undefined, error: string | undefined) =>
    `w-full h-11 rounded-xl px-4 text-[#E6EDF3] text-sm placeholder:text-[#484F58] focus:outline-none transition-all ${
      touched && error ? "border-red-500/70" : "border-[#30363D]"
    }`

  return (
    <div className="min-h-screen flex" style={{ background: "#0D1117" }}>

      {/* ── Left branding panel ── */}
      <div className="hidden lg:flex w-[48%] flex-col relative overflow-hidden"
        style={{ background: "linear-gradient(160deg, #0d1f3c 0%, #0D1117 40%, #0a1a10 100%)" }}>

        {/* Ambient orbs */}
        <div className="absolute top-[-80px] left-[-80px] w-[420px] h-[420px] rounded-full opacity-30"
          style={{ background: "radial-gradient(circle, #58A6FF40 0%, transparent 70%)" }} />
        <div className="absolute bottom-[-60px] right-[-60px] w-[380px] h-[380px] rounded-full opacity-25"
          style={{ background: "radial-gradient(circle, #3FB95040 0%, transparent 70%)" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #8b5cf640 0%, transparent 70%)" }} />

        {/* Grid pattern */}
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
              Almost there.<br />
              <span style={{ background: "linear-gradient(135deg, #58A6FF 0%, #3FB950 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                Secure your account.
              </span>
            </h1>
            <p className="text-[#8B949E] text-base leading-relaxed max-w-sm">
              You&apos;re one step away from getting back into your account. Choose a strong new password below.
            </p>
          </div>

          {/* Step progress */}
          <div className="mt-12 space-y-4 animate-fade-in-up" style={{ animationDelay: "200ms" }}>
            <p className="text-[#484F58] text-xs uppercase tracking-widest font-semibold mb-6">Recovery steps</p>
            {STEPS.map((step) => (
              <div key={step.n} className="flex items-center gap-4">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 transition-all"
                  style={
                    step.active
                      ? { background: "linear-gradient(135deg, #58A6FF, #3b82f6)", color: "#fff", boxShadow: "0 0 16px rgba(88,166,255,0.35)" }
                      : step.done
                      ? { background: "rgba(63,185,80,0.15)", color: "#3FB950", border: "1px solid rgba(63,185,80,0.3)" }
                      : { background: "#161B22", color: "#484F58", border: "1px solid #21262D" }
                  }
                >
                  {step.done && !step.active ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    step.n
                  )}
                </div>
                <div>
                  <p
                    className="text-sm font-semibold"
                    style={{ color: step.active ? "#E6EDF3" : step.done ? "#3FB950" : "#484F58" }}
                  >
                    {step.label}
                  </p>
                  {step.active && (
                    <p className="text-[#8B949E] text-xs mt-0.5">Enter and confirm your new password</p>
                  )}
                  {step.done && !step.active && (
                    <p className="text-[#3FB950]/60 text-xs mt-0.5">Completed</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Security bullets */}
          <div className="mt-auto pb-4 space-y-3 animate-fade-in-up" style={{ animationDelay: "300ms" }}>
            {[
              { icon: <KeyRound className="w-3.5 h-3.5" />, color: "#58A6FF", text: "Use 8+ characters with letters and numbers" },
              { icon: <ShieldCheck className="w-3.5 h-3.5" />, color: "#3FB950", text: "Your data is encrypted end-to-end" },
              { icon: <Lock className="w-3.5 h-3.5" />, color: "#8b5cf6", text: "Session is valid for this recovery link only" },
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
          <span className="text-[#E6EDF3] text-lg font-bold">
            Sales Agent{" "}
            <span style={{ background: "linear-gradient(135deg,#58A6FF,#3FB950)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>AI</span>
          </span>
        </div>

        <div className="w-full max-w-[420px] animate-fade-in-up" style={{ animationDelay: "50ms" }}>

          {done ? (
            /* ── Success state ── */
            <div className="text-center">
              <div className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center"
                style={{ background: "rgba(63,185,80,0.15)", border: "1px solid rgba(63,185,80,0.35)" }}>
                <CheckCircle2 className="w-8 h-8 text-[#3FB950]" />
              </div>
              <h1 className="text-[#E6EDF3] text-2xl font-extrabold mb-2">Password updated!</h1>
              <p className="text-[#8B949E] text-sm mb-6">Your new password is set. Redirecting you to sign in…</p>
              <div className="h-1 rounded-full overflow-hidden" style={{ background: "#161B22" }}>
                <div className="h-full rounded-full animate-pulse" style={{ background: "linear-gradient(90deg, #3FB950, #58A6FF)", width: "60%" }} />
              </div>
            </div>

          ) : !ready ? (
            /* ── Verifying state ── */
            <div className="text-center">
              <div className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center"
                style={{ background: "rgba(88,166,255,0.1)", border: "1px solid rgba(88,166,255,0.25)" }}>
                <ShieldCheck className="w-8 h-8 text-[#58A6FF] animate-pulse" />
              </div>
              <h1 className="text-[#E6EDF3] text-2xl font-extrabold mb-2">Verifying reset link…</h1>
              <p className="text-[#8B949E] text-sm">Please wait while we confirm your recovery session.</p>
            </div>

          ) : (
            /* ── Form state ── */
            <>
              <div className="mb-8">
                <div className="w-12 h-12 rounded-2xl mb-5 flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, #58A6FF, #3b82f6)", boxShadow: "0 8px 24px rgba(88,166,255,0.3)" }}>
                  <KeyRound className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-[#E6EDF3] text-3xl font-extrabold mb-1">Set new password</h1>
                <p className="text-[#8B949E] text-sm">Choose a strong password to protect your account.</p>
              </div>

              {sessionError && (
                <div className="mb-5 px-4 py-3 rounded-xl text-red-400 text-sm"
                  style={{ background: "#ef444410", border: "1px solid #ef444430" }}>
                  {sessionError}
                </div>
              )}

              <form onSubmit={formik.handleSubmit} className="space-y-5">

                {/* New password */}
                <div>
                  <label className="block text-[#6B7280] text-xs uppercase tracking-wider mb-2">New password</label>
                  <div className="relative">
                    <input
                      id="password" name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Min. 8 chars, letters + numbers"
                      autoComplete="new-password"
                      value={formik.values.password}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className={inputBase(formik.touched.password, formik.errors.password) + " pr-10"}
                      style={{
                        background: "#161B22",
                        border: `1px solid ${formik.touched.password && formik.errors.password ? "rgba(239,68,68,0.7)" : "#30363D"}`,
                      }}
                      onFocus={(e) => { if (!(formik.touched.password && formik.errors.password)) e.currentTarget.style.borderColor = "#58A6FF" }}
                    />
                    <button type="button" tabIndex={-1} onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#484F58] hover:text-[#8B949E] transition-colors">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {formik.touched.password && formik.errors.password && (
                    <p className="mt-1.5 text-red-400 text-xs">{formik.errors.password}</p>
                  )}
                </div>

                {/* Confirm password */}
                <div>
                  <label className="block text-[#6B7280] text-xs uppercase tracking-wider mb-2">Confirm password</label>
                  <div className="relative">
                    <input
                      id="confirmPassword" name="confirmPassword"
                      type={showConfirm ? "text" : "password"}
                      placeholder="Re-enter your password"
                      autoComplete="new-password"
                      value={formik.values.confirmPassword}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className={inputBase(formik.touched.confirmPassword, formik.errors.confirmPassword) + " pr-10"}
                      style={{
                        background: "#161B22",
                        border: `1px solid ${formik.touched.confirmPassword && formik.errors.confirmPassword ? "rgba(239,68,68,0.7)" : "#30363D"}`,
                      }}
                      onFocus={(e) => { if (!(formik.touched.confirmPassword && formik.errors.confirmPassword)) e.currentTarget.style.borderColor = "#58A6FF" }}
                    />
                    <button type="button" tabIndex={-1} onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#484F58] hover:text-[#8B949E] transition-colors">
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {formik.touched.confirmPassword && formik.errors.confirmPassword && (
                    <p className="mt-1.5 text-red-400 text-xs">{formik.errors.confirmPassword}</p>
                  )}
                </div>

                {/* Password strength hints */}
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "8+ characters", met: formik.values.password.length >= 8 },
                    { label: "One letter", met: /[A-Za-z]/.test(formik.values.password) },
                    { label: "One number", met: /\d/.test(formik.values.password) },
                    { label: "Passwords match", met: !!formik.values.confirmPassword && formik.values.password === formik.values.confirmPassword },
                  ].map((hint) => (
                    <div key={hint.label} className="flex items-center gap-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full shrink-0 transition-colors ${hint.met ? "bg-[#3FB950]" : "bg-[#30363D]"}`} />
                      <span className={`text-xs transition-colors ${hint.met ? "text-[#3FB950]" : "text-[#484F58]"}`}>{hint.label}</span>
                    </div>
                  ))}
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={formik.isSubmitting}
                  className="w-full h-11 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{
                    background: "linear-gradient(135deg, #58A6FF 0%, #3b82f6 100%)",
                    boxShadow: "0 4px 20px rgba(88,166,255,0.3)",
                  }}
                >
                  {formik.isSubmitting ? "Updating password…" : "Update password"}
                </button>

              </form>

              <p className="text-center mt-6 text-[#484F58] text-xs">
                Remember your password?{" "}
                <a href="/login" className="text-[#58A6FF] hover:underline font-medium">Sign in</a>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordContent />
    </Suspense>
  )
}
