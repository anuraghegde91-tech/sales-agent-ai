"use client"

import { useState, useEffect } from "react"
import { MapPin, ExternalLink, Loader2 } from "lucide-react"

interface MapEmbedProps {
  hospitalName: string
  city: string
}

export function MapEmbed({ hospitalName, city }: MapEmbedProps) {
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null)
  const [areaInfo, setAreaInfo] = useState<{ district: string; state: string; pincode: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!hospitalName) { setLoading(false); return }
    const q = city ? `${hospitalName} ${city}` : hospitalName
    setLoading(true)
    setError(false)
    fetch(`/api/places?type=hospital&q=${encodeURIComponent(q)}`)
      .then((r) => r.json())
      .then((data: any[]) => {
        const hit = data.find((d) => d.lat && d.lon) || data[0]
        if (hit?.lat && hit?.lon) {
          setCoords({ lat: hit.lat, lon: hit.lon })
          setAreaInfo({
            district: hit.district || "",
            state:    hit.state    || "",
            pincode:  hit.pincode  || "",
          })
        } else {
          setError(true)
        }
        setLoading(false)
      })
      .catch(() => { setError(true); setLoading(false) })
  }, [hospitalName, city])

  const googleMapsUrl = coords
    ? `https://www.google.com/maps?q=${coords.lat},${coords.lon}`
    : `https://maps.google.com/maps?q=${encodeURIComponent([hospitalName, city].filter(Boolean).join(" "))}`

  const osmEmbedUrl = coords
    ? `https://www.openstreetmap.org/export/embed.html` +
      `?bbox=${coords.lon - 0.009},${coords.lat - 0.009},${coords.lon + 0.009},${coords.lat + 0.009}` +
      `&layer=mapnik&marker=${coords.lat},${coords.lon}`
    : null

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "#161B22", border: "1px solid #21262D" }}>

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: "1px solid #21262D" }}>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background: "#3FB95018" }}>
            <MapPin className="w-3 h-3 text-[#3FB950]" />
          </div>
          <span className="text-[#8B949E] text-xs uppercase tracking-wider font-bold">Hospital Location</span>
        </div>
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs font-semibold text-[#58A6FF] hover:opacity-80 transition-opacity"
        >
          <ExternalLink className="w-3 h-3" />
          Open in Google Maps
        </a>
      </div>

      {/* Map */}
      {loading ? (
        <div className="h-52 flex items-center justify-center" style={{ background: "#0D1117" }}>
          <Loader2 className="w-5 h-5 text-[#484F58] animate-spin" />
        </div>
      ) : error || !osmEmbedUrl ? (
        <div className="h-52 flex flex-col items-center justify-center gap-3" style={{ background: "#0D1117" }}>
          <MapPin className="w-8 h-8 text-[#30363D]" />
          <p className="text-[#484F58] text-sm">Location not found on map</p>
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-lg text-xs font-semibold text-[#58A6FF] transition-colors hover:bg-[#21262D]"
            style={{ border: "1px solid #30363D" }}
          >
            Search on Google Maps →
          </a>
        </div>
      ) : (
        <iframe
          src={osmEmbedUrl}
          className="w-full"
          style={{ height: "220px", border: 0, display: "block" }}
          loading="lazy"
          title={`Map of ${hospitalName}`}
        />
      )}

      {/* Footer — area info */}
      <div className="flex items-center gap-4 px-5 py-3 flex-wrap" style={{ borderTop: "1px solid #21262D", background: "#0D1117" }}>
        {city && (
          <span className="flex items-center gap-1.5 text-xs text-[#8B949E]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3FB950] shrink-0" />
            {city}
          </span>
        )}
        {areaInfo?.district && areaInfo.district !== city && (
          <span className="text-xs text-[#484F58]">{areaInfo.district}</span>
        )}
        {areaInfo?.state && (
          <span className="text-xs text-[#484F58]">{areaInfo.state}</span>
        )}
        {areaInfo?.pincode && (
          <span className="text-xs font-mono text-[#484F58]">PIN {areaInfo.pincode}</span>
        )}
        {coords && (
          <span className="text-xs font-mono text-[#30363D] ml-auto">
            {coords.lat.toFixed(4)}, {coords.lon.toFixed(4)}
          </span>
        )}
      </div>
    </div>
  )
}
