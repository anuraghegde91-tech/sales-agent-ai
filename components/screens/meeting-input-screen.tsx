"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Search, Sparkles, Building2, User, Calendar, Phone, MapPin, Loader2 } from "lucide-react"

interface MeetingInputScreenProps {
  onSubmit: (report: any) => void
  repName?: string
  repDesignation?: string
  repWhatsapp?: string
  initialData?: any
  isEditMode?: boolean
}

interface HospitalSuggestion {
  name: string; city: string; district: string; state: string
  pincode: string; streetAddress: string; facilityType: string
  beds: string; operator: string; operatorType: string
  phone: string; website: string; lat: number | null; lon: number | null
  mapsLink: string | null
}
interface CitySuggestion { city: string; district: string; state: string }

const meetingTypes = ["First meeting", "Follow-up", "Demo", "Negotiation"]

// Curated hospital decision-maker roles relevant to healthcare software sales
const DESIGNATIONS = [
  // C-Suite / Top management
  "CEO", "MD (Managing Director)", "CMO (Chief Medical Officer)",
  "CIO (Chief Information Officer)", "CFO (Chief Financial Officer)",
  "COO (Chief Operating Officer)", "Chairman",
  // Administration
  "Hospital Administrator", "GM - Operations", "DGM - Operations",
  "Head - Administration", "Medical Superintendent",
  // IT / Technology
  "HOD - IT", "IT Manager", "Systems Manager", "Head - Digital Health",
  "IT Head", "Network Administrator",
  // Purchase / Procurement
  "Purchase Manager", "Procurement Head", "GM - Purchase",
  "Material Manager", "Head - Procurement", "Purchase Officer",
  // Finance
  "Finance Manager", "GM - Finance", "Accounts Manager",
  // Clinical / Medical
  "Medical Director", "Head - Pathology", "Head - Radiology",
  "HOD - Pathology", "HOD - Radiology", "Lab Director",
  "Chief Pathologist", "Chief Radiologist",
  // Biomedical
  "Head - Biomedical", "Biomedical Engineer", "HOD - Biomedical",
  // Nursing
  "Nursing Superintendent", "Chief Nursing Officer",
  // Quality
  "Quality Manager", "NABH Coordinator",
]

const TOP_DESIGNATIONS = [
  "Purchase Manager", "Hospital Administrator", "HOD - IT",
  "Medical Director", "CMO (Chief Medical Officer)", "CEO",
]

function useDebounce(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

export function MeetingInputScreen({
  onSubmit,
  repName = "Sales Rep",
  repDesignation = "Field Sales Executive",
  repWhatsapp = "",
  initialData,
  isEditMode = false,
}: MeetingInputScreenProps) {
  const [hospital, setHospital]         = useState("")
  const [contact, setContact]           = useState("")
  const [softwareTypes, setSoftwareTypes] = useState<string[]>([])
  const [designation, setDesignation]   = useState("")
  const [date, setDate]                 = useState("")
  const [time, setTime]                 = useState("")
  const [city, setCity]                 = useState("")
  const [errors, setErrors]             = useState<Record<string, string>>({})
  const [isLoading, setIsLoading]       = useState(false)
  const [selectedMeetingType, setSelectedMeetingType] = useState("First meeting")

  // ── Hospital autocomplete ────────────────────────────────────────────────
  const [hospitalSuggestions, setHospitalSuggestions] = useState<HospitalSuggestion[]>([])
  const [hospitalLoading, setHospitalLoading]         = useState(false)
  const [hospitalIdx, setHospitalIdx]                 = useState(-1)
  const [selectedHospital, setSelectedHospital]       = useState<HospitalSuggestion | null>(null)
  const hospitalInputRef  = useRef<HTMLInputElement>(null)
  const hospitalDropRef   = useRef<HTMLDivElement>(null)

  // ── City autocomplete ─────────────────────────────────────────────────────
  const [citySuggestions, setCitySuggestions] = useState<CitySuggestion[]>([])
  const [cityLoading, setCityLoading]         = useState(false)
  const [cityIdx, setCityIdx]                 = useState(-1)
  const cityInputRef  = useRef<HTMLInputElement>(null)
  const cityDropRef   = useRef<HTMLDivElement>(null)

  // ── Designation autocomplete ───────────────────────────────────────────────
  const [desigSuggestions, setDesigSuggestions] = useState<string[]>([])
  const [desigIdx, setDesigIdx]                 = useState(-1)
  const [desigFocused, setDesigFocused]         = useState(false)
  const desigInputRef = useRef<HTMLInputElement>(null)
  const desigDropRef  = useRef<HTMLDivElement>(null)

  const debouncedHospital = useDebounce(hospital, 420)
  const debouncedCity     = useDebounce(city, 420)

  // Fetch hospital suggestions
  useEffect(() => {
    if (debouncedHospital.length < 2) { setHospitalSuggestions([]); return }
    setHospitalLoading(true)
    fetch(`/api/places?type=hospital&q=${encodeURIComponent(debouncedHospital)}`)
      .then((r) => r.json())
      .then((data: HospitalSuggestion[]) => { setHospitalSuggestions(data); setHospitalLoading(false) })
      .catch(() => setHospitalLoading(false))
  }, [debouncedHospital])

  // Fetch city suggestions
  useEffect(() => {
    if (debouncedCity.length < 2) { setCitySuggestions([]); return }
    setCityLoading(true)
    fetch(`/api/places?type=city&q=${encodeURIComponent(debouncedCity)}`)
      .then((r) => r.json())
      .then((data: CitySuggestion[]) => { setCitySuggestions(data); setCityLoading(false) })
      .catch(() => setCityLoading(false))
  }, [debouncedCity])

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        hospitalInputRef.current && !hospitalInputRef.current.contains(e.target as Node) &&
        hospitalDropRef.current && !hospitalDropRef.current.contains(e.target as Node)
      ) setHospitalSuggestions([])
      if (
        cityInputRef.current && !cityInputRef.current.contains(e.target as Node) &&
        cityDropRef.current && !cityDropRef.current.contains(e.target as Node)
      ) setCitySuggestions([])
      if (
        desigInputRef.current && !desigInputRef.current.contains(e.target as Node) &&
        desigDropRef.current && !desigDropRef.current.contains(e.target as Node)
      ) { setDesigSuggestions([]); setDesigFocused(false) }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  // Designation filtering — purely local, no API needed
  const filterDesignations = useCallback((val: string) => {
    if (!val.trim()) return []
    const q = val.toLowerCase()
    return DESIGNATIONS.filter((d) => d.toLowerCase().includes(q)).slice(0, 7)
  }, [])

  const applyDesignation = useCallback((d: string) => {
    setDesignation(d)
    setDesigSuggestions([])
    setDesigIdx(-1)
    desigInputRef.current?.focus()
  }, [])

  const onDesigKey = (e: React.KeyboardEvent) => {
    if (!desigSuggestions.length) return
    if (e.key === "ArrowDown")  { e.preventDefault(); setDesigIdx((i) => Math.min(i + 1, desigSuggestions.length - 1)) }
    else if (e.key === "ArrowUp")   { e.preventDefault(); setDesigIdx((i) => Math.max(i - 1, -1)) }
    else if (e.key === "Enter" && desigIdx >= 0) { e.preventDefault(); applyDesignation(desigSuggestions[desigIdx]) }
    else if (e.key === "Escape" || e.key === "Tab") { setDesigSuggestions([]); setDesigIdx(-1) }
  }

  const applyHospital = useCallback((s: HospitalSuggestion) => {
    setHospital(s.name)
    setSelectedHospital(s)
    setHospitalSuggestions([])
    setHospitalIdx(-1)
    if (!city && s.city) setCity(s.city)
    hospitalInputRef.current?.focus()
  }, [city])

  // Clear selected hospital info when user edits the hospital name manually
  const onHospitalChange = (val: string) => {
    setHospital(val)
    setHospitalIdx(-1)
    if (selectedHospital && val !== selectedHospital.name) setSelectedHospital(null)
  }

  const applyCity = useCallback((s: CitySuggestion) => {
    setCity(s.city)
    setCitySuggestions([])
    setCityIdx(-1)
    cityInputRef.current?.focus()
  }, [])

  const onHospitalKey = (e: React.KeyboardEvent) => {
    if (!hospitalSuggestions.length) return
    if (e.key === "ArrowDown")  { e.preventDefault(); setHospitalIdx((i) => Math.min(i + 1, hospitalSuggestions.length - 1)) }
    else if (e.key === "ArrowUp")   { e.preventDefault(); setHospitalIdx((i) => Math.max(i - 1, -1)) }
    else if (e.key === "Enter" && hospitalIdx >= 0) { e.preventDefault(); applyHospital(hospitalSuggestions[hospitalIdx]) }
    else if (e.key === "Escape" || e.key === "Tab") { setHospitalSuggestions([]); setHospitalIdx(-1) }
  }

  const onCityKey = (e: React.KeyboardEvent) => {
    if (!citySuggestions.length) return
    if (e.key === "ArrowDown")  { e.preventDefault(); setCityIdx((i) => Math.min(i + 1, citySuggestions.length - 1)) }
    else if (e.key === "ArrowUp")   { e.preventDefault(); setCityIdx((i) => Math.max(i - 1, -1)) }
    else if (e.key === "Enter" && cityIdx >= 0) { e.preventDefault(); applyCity(citySuggestions[cityIdx]) }
    else if (e.key === "Escape" || e.key === "Tab") { setCitySuggestions([]); setCityIdx(-1) }
  }

  useEffect(() => {
    if (initialData) {
      setHospital(initialData.hospitalName || "")
      setCity(initialData.city || "")
      setContact(initialData.contactName || "")
      setDesignation(initialData.contactDesignation || "")
      const existing = initialData.softwareType || ""
      setSoftwareTypes(Array.isArray(existing) ? existing : existing ? existing.split(", ") : [])
      setDate(initialData.meetingDate || "")
      setTime(initialData.meetingTime || "")
      setSelectedMeetingType(initialData.meetingType || "First meeting")
    }
  }, [initialData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const newErrors: Record<string, string> = {}
    if (!hospital) newErrors.hospital = "Hospital name is required"
    if (!city) newErrors.city = "Location is required"
    if (softwareTypes.length === 0) newErrors.softwareType = "Select at least one software type"
    if (!contact) newErrors.contact = "Contact person is required"
    if (!designation) newErrors.designation = "Designation is required"
    if (!date) {
      newErrors.date = "Appointment date is required"
    } else {
      const selectedDate = new Date(date)
      const today = new Date(); today.setHours(0, 0, 0, 0)
      const maxDate = new Date(); maxDate.setFullYear(maxDate.getFullYear() + 2)
      if (selectedDate < today) newErrors.date = "Date cannot be in the past"
      else if (selectedDate > maxDate) newErrors.date = "Date cannot be more than 2 years in future"
    }
    if (!time) newErrors.time = "Appointment time is required"

    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return }

    setErrors({})
    setIsLoading(true)
    try {
      const response = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hospitalName: hospital, city, contactName: contact,
          contactDesignation: designation, softwareType: softwareTypes.join(", "),
          meetingDate: date, meetingTime: time,
        }),
      })
      const data = await response.json()

      onSubmit({
        hospitalName: hospital, city,
        contactName: contact, contactDesignation: designation,
        softwareType: softwareTypes.join(", "),
        meetingTime: time, meetingDate: date,
        meetingType: selectedMeetingType,
        brief: data.brief,
        hospitalLogo: data.meta?.hospitalLogo,
        hospitalImage: data.meta?.hospitalImage,
        hospitalUrl: data.meta?.hospitalUrl,
        // Pass OSM-sourced beds as fallback if AI brief doesn't have it
        osmBeds: selectedHospital?.beds || null,
      })
    } catch (error) {
      console.error("Error:", error)
      onSubmit({} as any)
    } finally {
      setIsLoading(false)
    }
  }

  const repInitials = repName.split(" ").map((p: string) => p[0]).join("").slice(0, 2).toUpperCase()

  // ── Dropdown shared styles ───────────────────────────────────────────────
  const dropStyle: React.CSSProperties = {
    background: "#161B22",
    border: "1px solid #30363D",
    boxShadow: "0 12px 40px rgba(0,0,0,0.6)",
  }

  return (
    <div
      className="min-h-full relative overflow-auto"
      style={{
        background: "linear-gradient(135deg, #0F1B35 0%, #1A2F5A 50%, #0D1F3C 100%)",
        backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23161B22\' fill-opacity=\'0.06\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/></g></g></svg>")',
      }}
    >
      {/* Ambient blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-[#58A6FF]/15 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-[#3FB950]/15 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col items-center px-6 pt-6 pb-10">

        {/* ── Form Card ── */}
        <form onSubmit={handleSubmit} className="w-full max-w-[900px]">
          <div
            className="rounded-2xl p-6"
            style={{
              background: "rgba(28, 33, 40, 0.9)",
              border: "1px solid rgba(48, 54, 61, 0.7)",
              backdropFilter: "blur(16px)",
              boxShadow: "0 8px 40px rgba(0,0,0,0.4), 0 0 1px rgba(88,166,255,0.15)",
            }}
          >
            {/* Form header */}
            <div className="flex items-center justify-between gap-4 mb-5">
              <div>
                <h2 className="text-[#E6EDF3] text-lg font-bold">
                  {isEditMode ? "Edit meeting brief" : "Schedule a meeting brief"}
                </h2>
                <p className="text-[#8B949E] text-xs mt-0.5">
                  {isEditMode ? "Update details and regenerate the AI brief." : "Fill in the details — AI brief generated instantly."}
                </p>
              </div>
              <div
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl shrink-0"
                style={{ background: "rgba(13,17,23,0.8)", border: "1px solid #30363D" }}
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                  style={{ background: "linear-gradient(135deg, #58A6FF, #3b82f6)" }}>
                  {repInitials}
                </div>
                <div className="min-w-0">
                  <p className="text-[#E6EDF3] text-xs font-bold truncate">{repName}</p>
                  <p className="text-[#8B949E] text-[10px] truncate">{repDesignation}</p>
                </div>
                {repWhatsapp && (
                  <div className="flex items-center gap-1 pl-3 shrink-0" style={{ borderLeft: "1px solid #30363D" }}>
                    <Phone className="w-3 h-3 text-[#3FB950]" />
                    <span className="text-[#3FB950] text-[10px]">{repWhatsapp}</span>
                  </div>
                )}
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ml-1"
                  style={isEditMode
                    ? { background: "#f59e0b18", color: "#fbbf24", border: "1px solid #f59e0b30" }
                    : { background: "#58A6FF18", color: "#58A6FF", border: "1px solid #58A6FF30" }}>
                  {isEditMode ? "EDIT" : "NEW"}
                </span>
              </div>
            </div>

            {/* ── SECTION 1 — CLIENT INFORMATION ────────────────────────────── */}
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background: "#58A6FF18" }}>
                  <Building2 className="w-3 h-3 text-[#58A6FF]" />
                </div>
                <h3 className="text-[#8B949E] text-xs uppercase tracking-wider font-bold">Client Information</h3>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-3">

                {/* Hospital name — autocomplete */}
                <div>
                  <label className="block text-[#8B949E] text-xs uppercase tracking-wider mb-2">Hospital name</label>
                  <div className="relative">
                    <div className="relative">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#484F58] pointer-events-none" />
                      {hospitalLoading && (
                        <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#484F58] animate-spin pointer-events-none" />
                      )}
                      <input
                        ref={hospitalInputRef}
                        type="text"
                        value={hospital}
                        onChange={(e) => onHospitalChange(e.target.value)}
                        onKeyDown={onHospitalKey}
                        placeholder="Start typing hospital name…"
                        autoComplete="off"
                        className="w-full h-10 bg-[#0D1117] border border-[#30363D] rounded-lg pl-10 pr-9 text-[#E6EDF3] text-sm placeholder:text-[#484F58] focus:outline-none focus:border-[#58A6FF] transition-colors"
                      />
                    </div>

                    {/* Hospital suggestions dropdown */}
                    {hospitalSuggestions.length > 0 && (
                      <div
                        ref={hospitalDropRef}
                        className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 rounded-xl overflow-hidden"
                        style={dropStyle}
                      >
                        {hospitalSuggestions.map((s, i) => (
                          <button
                            key={`${s.name}-${i}`}
                            type="button"
                            onMouseDown={(e) => { e.preventDefault(); applyHospital(s) }}
                            onMouseEnter={() => setHospitalIdx(i)}
                            onMouseLeave={() => setHospitalIdx(-1)}
                            className="w-full flex items-start gap-3 px-4 py-3 text-left transition-colors"
                            style={{
                              background: i === hospitalIdx ? "#21262D" : "transparent",
                              borderBottom: i < hospitalSuggestions.length - 1 ? "1px solid #21262D" : "none",
                            }}
                          >
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                              style={{ background: "#58A6FF18" }}>
                              <Building2 className="w-3.5 h-3.5 text-[#58A6FF]" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-[#E6EDF3] text-sm font-semibold truncate">{s.name}</p>
                                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0"
                                  style={{ background: "#58A6FF18", color: "#58A6FF", border: "1px solid #58A6FF30" }}>
                                  {s.facilityType}
                                </span>
                                {s.beds && (
                                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0"
                                    style={{ background: "#3FB95018", color: "#3FB950", border: "1px solid #3FB95030" }}>
                                    {s.beds} beds
                                  </span>
                                )}
                              </div>
                              <p className="text-[#8B949E] text-xs truncate mt-0.5">
                                {[s.streetAddress, s.city, s.state].filter(Boolean).join(", ")}
                                {s.pincode && <span className="text-[#484F58]"> — {s.pincode}</span>}
                              </p>
                              {(s.operator || s.operatorType) && (
                                <p className="text-[#484F58] text-[10px] mt-0.5 truncate">
                                  {s.operator}
                                  {s.operator && s.operatorType && " · "}
                                  {s.operatorType && <span className="capitalize">{s.operatorType}</span>}
                                </p>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {errors.hospital && <p className="text-red-400 text-xs mt-1">{errors.hospital}</p>}

                    {/* Selected hospital info strip */}
                    {selectedHospital && !hospitalSuggestions.length && (
                      <div className="mt-2 rounded-xl p-3 flex flex-wrap gap-x-4 gap-y-2"
                        style={{ background: "#0D1117", border: "1px solid #21262D" }}>
                        {selectedHospital.beds && (
                          <span className="flex items-center gap-1 text-xs text-[#8B949E]">
                            <span className="text-[#3FB950] font-semibold">{selectedHospital.beds}</span> beds
                          </span>
                        )}
                        {selectedHospital.operator && (
                          <span className="flex items-center gap-1 text-xs text-[#8B949E] truncate max-w-[180px]">
                            <span className="text-[#484F58]">By</span> {selectedHospital.operator}
                            {selectedHospital.operatorType && (
                              <span className="capitalize text-[#484F58]">({selectedHospital.operatorType})</span>
                            )}
                          </span>
                        )}
                        {selectedHospital.pincode && (
                          <span className="text-xs text-[#8B949E]">
                            PIN <span className="text-[#E6EDF3]">{selectedHospital.pincode}</span>
                          </span>
                        )}
                        {selectedHospital.phone && (
                          <a href={`tel:${selectedHospital.phone}`}
                            className="flex items-center gap-1 text-xs text-[#58A6FF] hover:underline">
                            📞 {selectedHospital.phone}
                          </a>
                        )}
                        {selectedHospital.website && (
                          <a href={selectedHospital.website} target="_blank" rel="noopener noreferrer"
                            className="text-xs text-[#58A6FF] hover:underline truncate max-w-[160px]">
                            🌐 Website
                          </a>
                        )}
                        {selectedHospital.mapsLink && (
                          <a href={selectedHospital.mapsLink} target="_blank" rel="noopener noreferrer"
                            className="text-xs text-[#58A6FF] hover:underline">
                            📍 Google Maps
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Location / City — autocomplete */}
                <div>
                  <label className="block text-[#8B949E] text-xs uppercase tracking-wider mb-2">Location / City</label>
                  <div className="relative">
                    <div className="relative">
                      <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#484F58] pointer-events-none" />
                      {cityLoading && (
                        <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#484F58] animate-spin pointer-events-none" />
                      )}
                      <input
                        ref={cityInputRef}
                        type="text"
                        value={city}
                        onChange={(e) => { setCity(e.target.value); setCityIdx(-1) }}
                        onKeyDown={onCityKey}
                        placeholder="Start typing city or district…"
                        autoComplete="off"
                        className="w-full h-10 bg-[#0D1117] border border-[#30363D] rounded-lg pl-10 pr-9 text-[#E6EDF3] text-sm placeholder:text-[#484F58] focus:outline-none focus:border-[#58A6FF] transition-colors"
                      />
                    </div>

                    {/* City suggestions dropdown */}
                    {citySuggestions.length > 0 && (
                      <div
                        ref={cityDropRef}
                        className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 rounded-xl overflow-hidden"
                        style={dropStyle}
                      >
                        {citySuggestions.map((s, i) => (
                          <button
                            key={`${s.city}-${i}`}
                            type="button"
                            onMouseDown={(e) => { e.preventDefault(); applyCity(s) }}
                            onMouseEnter={() => setCityIdx(i)}
                            onMouseLeave={() => setCityIdx(-1)}
                            className="w-full flex items-start gap-3 px-4 py-3 text-left transition-colors"
                            style={{
                              background: i === cityIdx ? "#21262D" : "transparent",
                              borderBottom: i < citySuggestions.length - 1 ? "1px solid #21262D" : "none",
                            }}
                          >
                            <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-0.5"
                              style={{ background: "#3FB95018" }}>
                              <MapPin className="w-3.5 h-3.5 text-[#3FB950]" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[#E6EDF3] text-sm font-medium">
                                {s.city}
                                {s.district && s.district !== s.city && (
                                  <span className="text-[#8B949E] font-normal text-xs ml-1">— {s.district}</span>
                                )}
                              </p>
                              {s.state && <p className="text-[#8B949E] text-xs mt-0.5">{s.state}</p>}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {errors.city && <p className="text-red-400 text-xs mt-1">{errors.city}</p>}
                  </div>
                </div>
              </div>

              {/* Software type chips */}
              <div>
                <label className="block text-[#8B949E] text-xs uppercase tracking-wider mb-2">
                  Software Type
                  {softwareTypes.length > 0 && <span className="ml-2 normal-case text-[#58A6FF]">({softwareTypes.length} selected)</span>}
                </label>
                <div className="flex flex-wrap gap-2">
                  {["HIS", "LIS", "RIS", "EMR", "HIMS", "Billing", "ERP"].map((type) => (
                    <button key={type} type="button"
                      onClick={() => setSoftwareTypes((prev) => prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type])}
                      className={`h-8 px-4 rounded-lg text-xs font-medium transition-all ${
                        softwareTypes.includes(type)
                          ? "bg-[#58A6FF]/15 border border-[#58A6FF] text-[#58A6FF]"
                          : "bg-[#0D1117] border border-[#30363D] text-[#8B949E] hover:border-[#484F58]"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
                {errors.softwareType && <p className="text-red-400 text-xs mt-1">{errors.softwareType}</p>}
              </div>
            </div>

            <div className="h-px bg-[#30363D]/60 mb-5" />

            {/* ── SECTION 2 — PRIMARY CONTACT ───────────────────────────────── */}
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background: "#D2992218" }}>
                  <User className="w-3 h-3 text-[#D29922]" />
                </div>
                <h3 className="text-[#8B949E] text-xs uppercase tracking-wider font-bold">Primary Contact</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#8B949E] text-xs uppercase tracking-wider mb-2">Contact person</label>
                  <input type="text" value={contact} onChange={(e) => setContact(e.target.value)} placeholder="Full name"
                    className="w-full h-10 bg-[#0D1117] border border-[#30363D] rounded-lg px-4 text-[#E6EDF3] text-sm placeholder:text-[#484F58] focus:outline-none focus:border-[#58A6FF] transition-colors" />
                  {errors.contact && <p className="text-red-400 text-xs mt-1">{errors.contact}</p>}
                </div>
                <div>
                  <label className="block text-[#8B949E] text-xs uppercase tracking-wider mb-2">Designation</label>
                  <div className="relative">
                    <input
                      ref={desigInputRef}
                      type="text"
                      value={designation}
                      onChange={(e) => {
                        setDesignation(e.target.value)
                        setDesigIdx(-1)
                        setDesigSuggestions(filterDesignations(e.target.value))
                      }}
                      onKeyDown={onDesigKey}
                      onFocus={() => {
                        setDesigFocused(true)
                        setDesigSuggestions(filterDesignations(designation))
                      }}
                      onBlur={() => setDesigFocused(false)}
                      placeholder="e.g. Purchase Manager"
                      autoComplete="off"
                      className="w-full h-10 bg-[#0D1117] border border-[#30363D] rounded-lg px-4 text-[#E6EDF3] text-sm placeholder:text-[#484F58] focus:outline-none focus:border-[#58A6FF] transition-colors"
                    />

                    {/* Designation suggestions dropdown */}
                    {desigSuggestions.length > 0 && (
                      <div
                        ref={desigDropRef}
                        className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 rounded-xl overflow-hidden"
                        style={dropStyle}
                      >
                        {desigSuggestions.map((d, i) => {
                          // Bold the matching part
                          const q = designation.toLowerCase()
                          const idx = d.toLowerCase().indexOf(q)
                          const before = idx >= 0 ? d.slice(0, idx) : d
                          const match  = idx >= 0 ? d.slice(idx, idx + q.length) : ""
                          const after  = idx >= 0 ? d.slice(idx + q.length) : ""
                          return (
                            <button
                              key={d}
                              type="button"
                              onMouseDown={(e) => { e.preventDefault(); applyDesignation(d) }}
                              onMouseEnter={() => setDesigIdx(i)}
                              onMouseLeave={() => setDesigIdx(-1)}
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
                              style={{
                                background: i === desigIdx ? "#21262D" : "transparent",
                                borderBottom: i < desigSuggestions.length - 1 ? "1px solid #21262D" : "none",
                              }}
                            >
                              <div className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
                                style={{ background: "#D2992218" }}>
                                <User className="w-3 h-3 text-[#D29922]" />
                              </div>
                              <span className="text-sm text-[#8B949E]">
                                {before}
                                <span className="text-[#E6EDF3] font-semibold">{match}</span>
                                {after}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    )}

                    {/* Quick-pick chips — show when focused and field is empty */}
                    {desigFocused && !designation && !desigSuggestions.length && (
                      <div
                        className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 rounded-xl p-3"
                        ref={desigDropRef}
                        style={dropStyle}
                      >
                        <p className="text-[#484F58] text-[10px] uppercase tracking-wider mb-2 px-1">Common roles</p>
                        <div className="flex flex-wrap gap-1.5">
                          {TOP_DESIGNATIONS.map((d) => (
                            <button
                              key={d}
                              type="button"
                              onMouseDown={(e) => { e.preventDefault(); applyDesignation(d) }}
                              className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all hover:border-[#58A6FF] hover:text-[#58A6FF]"
                              style={{ background: "#0D1117", border: "1px solid #30363D", color: "#8B949E" }}
                            >
                              {d}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  {errors.designation && <p className="text-red-400 text-xs mt-1">{errors.designation}</p>}
                </div>
              </div>
            </div>

            <div className="h-px bg-[#30363D]/60 mb-5" />

            {/* ── SECTION 3 — SCHEDULE ──────────────────────────────────────── */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background: "#39D0B418" }}>
                  <Calendar className="w-3 h-3 text-[#39D0B4]" />
                </div>
                <h3 className="text-[#8B949E] text-xs uppercase tracking-wider font-bold">Schedule</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="col-span-2">
                  <label className="block text-[#8B949E] text-xs uppercase tracking-wider mb-2">Date</label>
                  <input type="date" style={{ colorScheme: "dark" }} value={date} onChange={(e) => setDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    max={new Date(new Date().setFullYear(new Date().getFullYear() + 2)).toISOString().split("T")[0]}
                    className="w-full h-10 bg-[#0D1117] border border-[#30363D] rounded-lg px-3 text-[#E6EDF3] text-sm focus:outline-none focus:border-[#58A6FF] transition-colors" />
                  {errors.date && <p className="text-red-400 text-xs mt-1">{errors.date}</p>}
                </div>
                <div className="col-span-2">
                  <label className="block text-[#8B949E] text-xs uppercase tracking-wider mb-2">Time (IST)</label>
                  <input type="time" style={{ colorScheme: "dark" }} value={time} onChange={(e) => setTime(e.target.value)}
                    className="w-full h-10 bg-[#0D1117] border border-[#30363D] rounded-lg px-3 text-[#E6EDF3] text-sm focus:outline-none focus:border-[#58A6FF] transition-colors" />
                  {errors.time && <p className="text-red-400 text-xs mt-1">{errors.time}</p>}
                </div>
                {meetingTypes.map((type) => (
                  <div key={type} className="col-span-1 flex flex-col justify-end">
                    {type === meetingTypes[0] && (
                      <label className="block text-[#8B949E] text-xs uppercase tracking-wider mb-2">Meeting type</label>
                    )}
                    {type !== meetingTypes[0] && <div className="h-[22px]" />}
                    <button type="button" onClick={() => setSelectedMeetingType(type)}
                      className={`h-10 px-2 rounded-lg text-xs transition-all font-medium whitespace-nowrap ${
                        selectedMeetingType === type
                          ? "bg-[#58A6FF]/15 border border-[#58A6FF] text-[#58A6FF]"
                          : "bg-[#0D1117] border border-[#30363D] text-[#8B949E] hover:border-[#484F58]"
                      }`}
                    >
                      {type}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 rounded-xl flex items-center justify-center gap-2.5 text-white text-sm font-bold transition-all disabled:opacity-70 disabled:cursor-not-allowed hover:opacity-90"
              style={{ background: "#58A6FF", boxShadow: "0 0 20px rgba(88,166,255,0.25)" }}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Generating AI Brief…
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  {isEditMode ? "Update Brief" : "Create Brief"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
