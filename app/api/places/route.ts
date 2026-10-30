import { NextRequest, NextResponse } from "next/server"

// Nominatim (OpenStreetMap) — free, no API key, 1 req/s policy (we debounce on client)
const NOMINATIM = process.env.NEXT_PUBLIC_HOSPITAL_LOCATION_API_URL
const UA = "SalesAgentAI/1.0 (contact: admin@salesagentai.com)"

function getName(item: any): string {
  return (
    item.address?.amenity ||
    item.address?.hospital ||
    item.address?.clinic ||
    item.address?.healthcare ||
    item.name ||
    item.display_name.split(",")[0].trim()
  )
}

function getCity(addr: any): string {
  return (
    addr?.city ||
    addr?.town ||
    addr?.municipality ||
    addr?.village ||
    addr?.suburb ||
    addr?.county ||
    ""
  )
}

function getPhone(extratags: any): string {
  return (
    extratags?.phone ||
    extratags?.["contact:phone"] ||
    extratags?.["contact:mobile"] ||
    ""
  )
}

function getWebsite(extratags: any): string {
  return (
    extratags?.website ||
    extratags?.["contact:website"] ||
    extratags?.url ||
    ""
  )
}

function getBeds(extratags: any): string {
  return extratags?.beds || extratags?.["capacity:beds"] || ""
}

function getOperator(extratags: any): string {
  return extratags?.operator || extratags?.brand || ""
}

function getOperatorType(extratags: any): string {
  // government | private | religious | ngo | etc.
  return extratags?.["operator:type"] || extratags?.ownership || ""
}

function getFacilityType(item: any): string {
  const t = item.type || item.address?.amenity || ""
  const map: Record<string, string> = {
    hospital:      "Hospital",
    clinic:        "Clinic",
    doctors:       "Doctor's Office",
    nursing_home:  "Nursing Home",
    dentist:       "Dental",
    pharmacy:      "Pharmacy",
    health_centre: "Health Centre",
    healthcare:    "Healthcare",
  }
  return map[t] || (t ? t.replace(/_/g, " ") : "Healthcare Facility")
}

function getStreetAddress(addr: any): string {
  const parts = [
    addr?.house_number,
    addr?.road || addr?.pedestrian || addr?.footway,
    addr?.suburb || addr?.neighbourhood,
  ].filter(Boolean)
  return parts.join(", ")
}

export async function GET(req: NextRequest) {
  const q    = req.nextUrl.searchParams.get("q")?.trim() || ""
  const type = req.nextUrl.searchParams.get("type") || "hospital"

  if (q.length < 2) return NextResponse.json([])

  try {
    let url: string

    if (type === "hospital") {
      const query = /hospital|clinic|medical|health/i.test(q) ? q : `${q} hospital`
      url =
        `${NOMINATIM}?q=${encodeURIComponent(query)}` +
        `&countrycodes=in&format=json&addressdetails=1&extratags=1&limit=10&dedupe=1`
    } else {
      url =
        `${NOMINATIM}?q=${encodeURIComponent(q)}` +
        `&countrycodes=in&format=json&addressdetails=1&limit=8&dedupe=1&featuretype=settlement`
    }

    const res = await fetch(url, {
      headers: { "User-Agent": UA, "Accept-Language": "en" },
      next: { revalidate: 120 },
    })
    if (!res.ok) return NextResponse.json([])

    const raw: any[] = await res.json()

    if (type === "hospital") {
      const results = raw
        .filter(
          (item) =>
            item.class === "amenity" ||
            item.class === "healthcare" ||
            item.type === "hospital" ||
            item.type === "clinic" ||
            item.type === "doctors" ||
            item.address?.amenity ||
            item.address?.hospital
        )
        .map((item) => {
          const ext = item.extratags || {}
          const addr = item.address || {}
          const lat  = item.lat  ? parseFloat(item.lat)  : null
          const lon  = item.lon  ? parseFloat(item.lon)  : null

          return {
            name:          getName(item),
            city:          getCity(addr),
            district:      addr.county || addr.district || "",
            state:         addr.state  || "",
            pincode:       addr.postcode || "",
            streetAddress: getStreetAddress(addr),
            facilityType:  getFacilityType(item),
            beds:          getBeds(ext),
            operator:      getOperator(ext),
            operatorType:  getOperatorType(ext),
            phone:         getPhone(ext),
            website:       getWebsite(ext),
            lat,
            lon,
            mapsLink:      lat && lon
              ? `https://www.google.com/maps?q=${lat},${lon}`
              : null,
          }
        })
        .filter((r) => r.name.length > 1)
        .slice(0, 6)

      return NextResponse.json(results)
    } else {
      const results = raw
        .map((item) => {
          const city = getCity(item.address) || item.display_name.split(",")[0].trim()
          return {
            city,
            district: item.address?.county || item.address?.district || "",
            state:    item.address?.state || "",
          }
        })
        .filter((r) => r.city)
        .slice(0, 6)

      return NextResponse.json(results)
    }
  } catch {
    return NextResponse.json([])
  }
}
