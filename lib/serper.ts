export interface SerperResult {
  title: string;
  snippet: string;
  link: string;
  date?: string;
  sourceQuality: "high" | "medium" | "low";
  confidenceScore: number;
  verified: boolean;
  source: string;
}

export interface HospitalIntelligence {
  recentNews: SerperResult[];
  tenderSignals: SerperResult[];
  contactVerification: SerperResult[];
  executiveMoves: SerperResult[];
  hospitalLogo?: string;
  hospitalImage?: string;
  beds?: number | null;
  hospitalUrl?: string
}

export interface CTOValidation {
  name: string;
  designation: string;
  verified: boolean;
  source?: string;
}

function getSourceQuality(url: string): "high" | "medium" | "low" {
  const highQualitySources = [
    "economictimes.com",
    "livemint.com",
    "businessstandard.com",
    "thehindu.com",
    "ndtv.com",
    "moneycontrol.com",
    "reuters.com",
    "timesofindia.com",
    "ethealthworld.com",
    "deccanherald.com",
    "thehindubusinessline.com",
    "financialexpress.com",
  ];

  const mediumQualitySources = [
    "prnewswire.com",
    "apollohospitals.com",
    "fortishealthcare.com",
    "manipalhospitals.com",
    "narayanahealth.org",
    "practo.com",
    "justdial.com",
    "sulekha.com",
    "bajajfinservhealth.in",
    "watchdoq.com",
    "lazoi.com",
    "365doctor.in",
    "indiamart.com",
    "zoominfo.com",
    "clinicspots.com",
    "medsurgeindia.com",
    "credihealth.com",
    "vaidam.com",
    "hospital.com",
    "nhp.gov.in",
    "nabh.co",
    "cardiologistindia.com",
    "sehat.com",
    "lybrate.com",
  ];

  const lowQualitySources = [
    "instagram.com",
    "facebook.com",
    "twitter.com",
    "x.com",
    "reddit.com",
    "quora.com",
    "scribd.com",
    "indsoft24.com",
  ];

  const lowerUrl = url.toLowerCase();
  if (lowQualitySources.some((s) => lowerUrl.includes(s))) return "low";
  if (highQualitySources.some((s) => lowerUrl.includes(s))) return "high";
  if (mediumQualitySources.some((s) => lowerUrl.includes(s))) return "medium";
  if (lowerUrl.includes("blog") || lowerUrl.includes("news") || lowerUrl.includes("press")) return "medium";
  return "medium";
}

function getSourceName(url: string): string {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return "Unknown";
  }
}

function calculateConfidenceScore(
  sourceQuality: "high" | "medium" | "low",
  verified: boolean
): number {
  let score = 50;
  if (sourceQuality === "high") score += 30;
  else if (sourceQuality === "medium") score += 15;
  else score -= 10;
  if (verified) score += 20;
  return Math.max(0, Math.min(100, score));
}

/**
 * KEY FIX: Check if a result is actually about the hospital we searched for.
 * Requires at least one meaningful word from the hospital name to appear
 * in the title or snippet (case-insensitive).
 */
function isRelevantToHospital(
  result: { title: string; snippet: string },
  hospitalName: string
): boolean {
  const combined = (result.title + " " + result.snippet).toLowerCase();

  // Extract meaningful words from hospital name (ignore common words)
  const stopWords = new Set([
    "hospital", "hospitals", "the", "and", "of", "in", "at", "for",
    "a", "an", "to", "dr", "doctor", "clinic", "centre", "center",
    "medical", "health", "care", "institute", "trust",
  ]);

  const nameWords = hospitalName
    .toLowerCase()
    .split(/[\s,.-]+/)
    .filter((w) => w.length > 2 && !stopWords.has(w));

  if (nameWords.length === 0) {
    // Fallback: just check if full hospital name appears
    return combined.includes(hospitalName.toLowerCase());
  }

  // At least one meaningful name word must appear in the result
  return nameWords.some((word) => combined.includes(word));
}

function isSalesUsefulSignal(result: { title: string; snippet: string }): boolean {
  const combined = (result.title + " " + result.snippet).toLowerCase();

  // Block useless directory/booking/unrelated results
  const uselessPatterns = [
    /ph:\s*\d{5}/i,
    /appointment booking portal/i,
    /paramedical course/i,
    /she joined/i,
    /she wanted to join/i,
    /book appointment/i,
    /ratings.*reviews/i,
    /view fees/i,
    /contact number.*ratings/i,
  ];
  if (uselessPatterns.some((p) => p.test(combined))) return false;

  // Must contain at least one sales-relevant keyword
  const usefulKeywords = [
    "expansion", "new wing", "new block", "upgrade", "modernize",
    "accreditation", "nabh", "nabl", "jci",
    "tender", "procurement", "purchase", "contract",
    "technology", "digital", "software", "system", "it",
    "new hospital", "opening", "launch", "inaugurate",
    "investment", "funding", "project",
    "beds", "capacity", "speciality", "specialty", "department",
    "partnership", "tie-up", "collaboration",
    "super specialist", "new service", "new department",
  ];
  return usefulKeywords.some((kw) => combined.includes(kw));
}

async function serperSearch(
  query: string,
  num = 10,
  hospitalName?: string
): Promise<SerperResult[]> {
  const res = await fetch("https://google.serper.dev/search", {
    method: "POST",
    headers: {
      "X-API-KEY": process.env.SERPER_API_KEY!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ q: query, num, gl: "in", hl: "en" }),
  });

  if (!res.ok) {
    console.error("Serper error:", res.status, await res.text());
    return [];
  }

  const data = await res.json();

  let results: SerperResult[] = (data.organic ?? []).map((r: any) => {
    const sourceQuality = getSourceQuality(r.link);
    return {
      title: r.title,
      snippet: r.snippet,
      link: r.link,
      date: r.date ?? null,
      sourceQuality,
      source: getSourceName(r.link),
      confidenceScore: 0,
      verified: false,
    };
  });

  // KEY FIX: Filter out results not actually about this hospital
  if (hospitalName) {
    const before = results.length;
    results = results.filter((r) => isRelevantToHospital(r, hospitalName));
    const after = results.length;
    if (before !== after) {
      console.log(`[Serper] Filtered ${before - after} irrelevant results for "${hospitalName}"`);
    }
    // Only keep sales-useful signals
    results = results.filter((r) => isSalesUsefulSignal(r));
  }

  // Keep low quality only if no medium/high results found
  const hasGoodResults = results.some((r) => r.sourceQuality !== "low");
  if (hasGoodResults) {
    results = results.filter((r) => r.sourceQuality !== "low");
  }

  // Cross-source validation
  results.forEach((result) => {
    const words = result.snippet.toLowerCase().split(" ").slice(0, 5).join(" ");
    result.verified = results.filter(
      (o) => o.link !== result.link && o.snippet.toLowerCase().includes(words)
    ).length > 0;
  });

  // Calculate confidence scores
  results.forEach((result) => {
    result.confidenceScore = calculateConfidenceScore(
      result.sourceQuality,
      result.verified
    );
  });

  results.sort((a, b) => b.confidenceScore - a.confidenceScore);
  return results;
}

async function serperImageSearch(query: string): Promise<string | undefined> {
  try {
    const res = await fetch("https://google.serper.dev/images", {
      method: "POST",
      headers: {
        "X-API-KEY": process.env.SERPER_API_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ q: query, num: 1, gl: "in", hl: "en" }),
    });
    if (!res.ok) return undefined;
    const data = await res.json();
    return data.images?.[0]?.imageUrl;
  } catch {
    return undefined;
  }
}

function extractBedsFromSnippet(snippet: string, title?: string): number | null {
  const text = `${title ?? ""} ${snippet}`;
  const patterns = [
    /(\d+)[- ]?bed(?:s|ded)?\s*hospital/i,
    /equipped with (\d+)\s*beds/i,
    /has\s+(\d+)\s*beds/i,
    /\b(\d+)\s*(?:beds?|bed capacity|total beds?)/i,
    /\b(\d+)\s*(?:patient beds?|hospital beds?)/i,
    /beds?[:\s]+(\d+)/i,
    /capacity[:\s]+(\d+)\s*beds?/i,
    /No\.\s*of\s*Beds[:\s]+(\d+)/i,
    /(\d+)\s*(?:bedded|bed)\s*(?:facility|hospital|centre|center)/i,
    /facility.*?(\d+)\s*beds/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      const beds = parseInt(match[1], 10);
      if (beds > 10 && beds < 5000) return beds;
    }
  }
  return null;
}

export async function gatherHospitalIntelligence(
  hospitalName: string,
  city: string,
  contactName: string,
  contactDesignation: string,
  softwareType: string
): Promise<HospitalIntelligence> {

  const exactQuery = `"${hospitalName}" ${city}`;

  const [recentNews, tenderSignals, contactVerification, executiveMoves, hospitalImage, bedsSearch] =
    await Promise.all([
      // News — specific to hospital as subject, not just mentioned in passing
      serperSearch(`${exactQuery} hospital expansion OR upgrade OR accreditation OR new OR launch OR technology`, 5, hospitalName),
      // Tender signals
      serperSearch(`${exactQuery} tender OR procurement OR purchase OR upgrade ${softwareType} hospital`, 10, hospitalName),
      // Contact verification — no hospital filter (contact may appear on other pages)
      serperSearch(`${contactName} "${hospitalName}" ${city}`),
      // Directory data: specialties, doctors
      serperSearch(`${exactQuery} hospital specialties doctors services departments`, 10, hospitalName),
      // Image
      serperImageSearch(`${hospitalName} hospital ${city}`),
      // Beds — target directories most likely to have structured bed count
      serperSearch(`"${hospitalName}" ${city} beds`, 5),
    ]);

  // Extract beds — check all result sets
  let beds: number | null = null;
  for (const result of [...bedsSearch, ...executiveMoves, ...recentNews]) {
    const extracted = extractBedsFromSnippet(result.snippet, result.title);
    if (extracted) {
      beds = extracted;
      console.log(`[Beds] Found ${beds} beds from: ${result.source} — "${result.snippet.slice(0, 80)}"`);
      break;
    }
  }

  // Fallback: try ZoomInfo directly if beds not found
  if (!beds) {
    try {
      const zoomResults = await serperSearch(`${hospitalName} ${city} hospital beds capacity`, 5);
      for (const r of zoomResults) {
        const extracted = extractBedsFromSnippet(r.snippet, r.title);
        if (extracted) {
          beds = extracted;
          console.log(`[Beds] Found via ZoomInfo fallback: ${beds}`);
          break;
        }
      }
    } catch (e) {
      console.error("[Beds] ZoomInfo fallback failed:", e);
    }
  }

  // Pick best homepage URL using scoring
  const scoreHospitalUrl = (url: string, name: string): number => {
    try {
      const u = new URL(url);
      const depth = u.pathname.replace(/\/\$/, "") === "" ? 0 : u.pathname.split("/").filter(Boolean).length;
      const domain = u.hostname.toLowerCase();
      const n = name.toLowerCase().replace(/\s+/g, "").slice(0, 6);
      let score = 0;
      if (depth === 0) score += 20;
      else if (depth === 1) score += 10;
      else score -= depth * 5;
      if (domain.includes(n)) score += 15;
      if (/(\/)(es|fr|de|pt|ar|zh|ja|ko|ru)(\/)|\.es\/|\.fr\//.test(url)) score -= 30;
      if (/(news|blog|article|press|media|events|careers)/i.test(url)) score -= 20;
      if (/youtube\.com|youtu\.be|facebook\.com|twitter\.com|linkedin\.com|instagram\.com|wikipedia\.org/i.test(domain)) score -= 50;
if (/indeed\.com|naukri\.com|glassdoor\.com|monster\.com|shine\.com|timesjobs\.com|foundit\.in|apna\.co/i.test(domain)) score -= 100;
if (/practo\.com|justdial\.com|sulekha\.com|lybrate\.com|credihealth\.com|vaidam\.com/i.test(domain)) score -= 30;
      return score;
    } catch { return -99; }
  };
  const allLinks = [
    ...contactVerification, ...recentNews, ...tenderSignals,
    ...executiveMoves, ...(bedsSearch ?? [])
  ].map(r => r.link).filter(Boolean);
  const hospitalUrl = allLinks.length > 0
    ? allLinks.reduce((best, url) =>
        scoreHospitalUrl(url, hospitalName) > scoreHospitalUrl(best, hospitalName) ? url : best
      )
    : undefined;

return {
    recentNews,
    tenderSignals,
    contactVerification,
    executiveMoves,
    hospitalImage,
    beds,
    hospitalUrl,
  };
}

export async function validateCTODesignation(
  hospitalName: string,
  city: string,
  contactName: string,
  contactDesignation: string
): Promise<CTOValidation> {
  const contactSearchResults = await serperSearch(
    `${contactName} "${hospitalName}" ${city} ${contactDesignation}`
    // No hospital filter here — contact pages may not mention the hospital name in snippet
  );

  const contactFound = contactSearchResults.some(
    (r) =>
      r.snippet.toLowerCase().includes(contactName.toLowerCase()) &&
      r.snippet.toLowerCase().includes(hospitalName.toLowerCase())
  );

  return {
    name: contactName,
    designation: contactDesignation,
    verified: contactFound,
    source: contactFound ? "verified_online" : "unverified",
  };
}