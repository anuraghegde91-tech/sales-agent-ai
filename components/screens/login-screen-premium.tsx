"use client"

import { useState } from "react"
import { Eye, EyeOff, User } from "lucide-react"

interface LoginScreenProps {
  onLogin: (repName: string, repDesignation: string) => void
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [repName, setRepName] = useState("")
  const [repDesignation, setRepDesignation] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (email && password && repName && repDesignation) {
      onLogin(repName, repDesignation)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F1B35] via-[#1A2F5A] to-[#0D1F3C] relative flex flex-col items-center justify-center px-4 overflow-hidden">
      {/* Premium background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-[#58A6FF]/20 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-[#3FB950]/20 to-transparent rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-gradient-to-br from-[#58A6FF]/10 via-transparent to-[#3FB950]/10 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2" />
      </div>
      <div className="relative z-10">
      <div className="text-center mb-12">
        <div className="flex items-center justify-center gap-2 mb-3">
          <span className="text-[#E6EDF3] text-3xl font-bold">Sales Agent</span>
          <span className="text-[#58A6FF]" style={{background: 'linear-gradient(135deg, #58A6FF 0%, #3FB950 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>AI</span>
        </div>
        <p className="text-[#8B949E] text-sm">Field Intelligence Platform</p>
      </div>

      <div className="w-full max-w-[440px] bg-gradient-to-b from-[#1C2128]/80 to-[#161B22]/80 backdrop-blur-xl border border-[#30363D]/50 rounded-2xl p-8 shadow-2xl" style={{
        boxShadow: '0 8px 32px rgba(88, 166, 255, 0.1), 0 0 1px rgba(88, 166, 255, 0.2)'
      }}>
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#58A6FF] to-[#3FB950] flex items-center justify-center mb-5 shadow-lg" style={{
            boxShadow: '0 0 20px rgba(88, 166, 255, 0.4)'
          }}>
            <User className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-[#E6EDF3] text-2xl font-bold mb-2">Welcome!!</h1>
          <p className="text-[#8B949E] text-sm">Sign in to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[#8B949E] text-xs uppercase tracking-wide mb-2">Your name</label>
            <input
              type="text"
              value={repName}
              onChange={(e) => setRepName(e.target.value)}
              placeholder="Arjun Kulkarni"
              className="w-full h-11 bg-[#161B22] border border-[#30363D] rounded-lg px-4 text-[#E6EDF3] text-sm placeholder:text-[#484F58] focus:outline-none focus:border-[#58A6FF] transition-colors"
            />
          </div>

          <div>
            <label className="block text-[#8B949E] text-xs uppercase tracking-wide mb-2">Your designation</label>
            <input
              type="text"
              value={repDesignation}
              onChange={(e) => setRepDesignation(e.target.value)}
              placeholder="Field Sales Executive"
              className="w-full h-11 bg-[#161B22] border border-[#30363D] rounded-lg px-4 text-[#E6EDF3] text-sm placeholder:text-[#484F58] focus:outline-none focus:border-[#58A6FF] transition-colors"
            />
          </div>

          <div>
            <label className="block text-[#8B949E] text-xs uppercase tracking-wide mb-2">Work email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="arjun@company.com"
              className="w-full h-11 bg-[#161B22] border border-[#30363D] rounded-lg px-4 text-[#E6EDF3] text-sm placeholder:text-[#484F58] focus:outline-none focus:border-[#58A6FF] transition-colors"
            />
          </div>

          <div>
            <label className="block text-[#8B949E] text-xs uppercase tracking-wide mb-2">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full h-11 bg-[#161B22] border border-[#30363D] rounded-lg px-4 pr-10 text-[#E6EDF3] text-sm placeholder:text-[#484F58] focus:outline-none focus:border-[#58A6FF] transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#484F58] hover:text-[#8B949E]"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <div className="flex justify-end mt-2">
              <button type="button" className="text-[#58A6FF] text-sm hover:underline">Forgot password?</button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full h-11 bg-[#58A6FF] rounded-lg text-white text-[15px] font-medium hover:bg-[#4A94E8] transition-colors"
          >
            Sign in
          </button>


        </form>
      </div>

      <p className="mt-8 text-[#8B949E] text-sm">
        Don&apos;t have an account?{" "}
        <button className="text-[#58A6FF] hover:text-[#7CB3FF] transition-colors font-medium">Contact your admin</button>
      </p>

      <div className="absolute bottom-6 left-0 right-0 text-center z-10">
        <p className="text-[#3FB950] text-xs font-semibold">● CONNECTED · SERVER: IN-SOUTH</p>
        <p className="text-[#484F58] text-xs mt-1">© 2026 Sales Agent · Secure Platform</p>
      </div>
      </div>
    </div>
  )
}