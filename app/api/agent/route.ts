import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import {
  gatherHospitalIntelligence,
  HospitalIntelligence,
  SerperResult,
  validateCTODesignation,
} from "@/lib/serper";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

function formatIntelligenceForPrompt(intel: HospitalIntelligence): string {
  const fmt = (results: typeof intel.recentNews, label: string) => {
    const highConfidence = results.filter((r) => r.confidenceScore > 0);
    if (!highConfidence.length) return `${label}: No reliable recent signals found.\n`;
    return (
      `${label}:\n` +
      highConfidence
        .slice(0, 5)
        .map((r, i) => {
          const confidence = r.confidenceScore > 70 ? "HIGH" : r.confidenceScore > 50 ? "MEDIUM" : "LOW";
          return `  ${i + 1}. [${confidence} CONFIDENCE - ${r.sourceQuality.toUpperCase()} SOURCE] ${r.title} – ${r.snippet}${r.date ? ` (${r.date})` : ""} (Verified: ${r.verified ? "YES" : "NO"}) [SOURCE: ${r.source}] [LINK: ${r.link}]`;
        })
        .join("\n") +
      "\n"
    );
  };
  return [
    fmt(intel.recentNews, "RECENT HOSPITAL NEWS & SIGNALS"),
    fmt(intel.tenderSignals, "TENDER / PROCUREMENT SIGNALS"),
    fmt(intel.contactVerification, "CONTACT PERSON VERIFICATION"),
    fmt(intel.executiveMoves, "LEADERSHIP & EXECUTIVE MOVES"),
  ].join("\n");
}

// KEY FIX: Convert top Serper results into pre-built JSON so LLM just uses them directly
function buildSignalsJSON(intel: HospitalIntelligence, softwareType: string): string {
  // Gather all results across categories, sorted by confidence
  const allResults: SerperResult[] = [
    ...intel.tenderSignals,
    ...intel.recentNews,
    ...intel.executiveMoves,
  ]
    .filter((r) => r.confidenceScore > 0 && r.sourceQuality !== "low")
    .sort((a, b) => b.confidenceScore - a.confidenceScore)
    .slice(0, 3);

  if (allResults.length === 0) {
    return `[
    {
      "signal": "No reliable signals found for this hospital in web search",
      "source": "No source",
      "sourceQuality": "low",
      "confidence": "low",
      "verified": false,
      "implication": "Use discovery questions to uncover their current pain points with ${softwareType}",
      "urgency": "low"
    }
  ]`;
  }

  const signals = allResults.map((r) => ({
    signal: r.snippet,
    source: r.source,
    sourceUrl: r.link,
    sourceQuality: r.sourceQuality,
    confidence: r.confidenceScore > 70 ? "high" : r.confidenceScore > 50 ? "medium" : "low",
    verified: r.verified,
    implication: `__FILL_IN: What does this signal mean for ${softwareType} sales at this hospital?__`,
    urgency: r.confidenceScore > 70 ? "high" : "medium",
}));
    
  return JSON.stringify(signals, null, 2);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { hospitalName, city, softwareType, contactName, contactDesignation, meetingDate, meetingTime } = body;

    let intelligenceSummary = "";
    let contactVerified = false;
    let validatedDesignation = contactDesignation;
    let hospitalLogo = undefined;
    let hospitalImage = undefined;
    let hospitalBeds: number | null = null;
    let prebuiltSignalsJSON = "";
    let hospitalUrl: string | undefined = undefined;

    try {
      const ctoValidation = await validateCTODesignation(
        hospitalName, city, contactName, contactDesignation
      );
      contactVerified = ctoValidation.verified;

      const intel = await gatherHospitalIntelligence(
        hospitalName, city, contactName, contactDesignation, softwareType
      );
      hospitalLogo = intel.hospitalLogo;
      hospitalImage = intel.hospitalImage;
      hospitalBeds = intel.beds || null;
      hospitalUrl = intel.hospitalUrl;
      intelligenceSummary = formatIntelligenceForPrompt(intel);
      prebuiltSignalsJSON = buildSignalsJSON(intel, softwareType);

      console.log("=== SERPER INTEL ===", intelligenceSummary.slice(0, 1000));
      console.log("=== PRE-BUILT SIGNALS ===", prebuiltSignalsJSON);

      if (intel.contactVerification.length > 0) {
        const match = intel.contactVerification.find(
          (r) =>
            r.title.toLowerCase().includes(contactName?.toLowerCase()) ||
            r.snippet.toLowerCase().includes(contactName?.toLowerCase())
        );
        if (match) {
          contactVerified = true;
        }
      }
    } catch (err) {
      console.error("Serper search failed, continuing without intel:", err);
    }

    const systemPrompt = `You are an expert hospital software sales strategist for the Indian healthcare market.
You create POWERFUL, data-driven pre-meeting pitch briefs for sales reps that win deals.
Use intelligence signals to generate SPECIFIC content for this exact hospital. Every pain point, talking point and discovery question must be tailored to this hospital's actual situation. Never use generic filler. Always respond with valid JSON only. No markdown, no explanation.`;

    const userPrompt = `Generate a powerful, consultative pre-meeting pitch brief for:

MEETING DETAILS:
- Hospital: ${hospitalName}, ${city}
- Software Type: ${softwareType}
- Contact: ${contactName} (${validatedDesignation})
- Meeting: ${meetingDate} at ${meetingTime}
- Contact Verified: ${contactVerified ? "YES ✓" : "NO - VALIDATE FIRST"}

REAL-TIME INTELLIGENCE (from web search):
${intelligenceSummary || "NO WEB INTELLIGENCE FOUND"}

CONTACT VERIFICATION: ${
  contactVerified
    ? `VERIFIED ✓ – ${contactName} confirmed in ${hospitalName} leadership`
    : `NOT VERIFIED ✗ – ${contactName} not found. MUST VALIDATE before pitching!`
}

INSTRUCTIONS:
1. For the "intelligenceSignals" field, use EXACTLY the pre-built signals array below. 
   Only fill in the "implication" field for each signal - write what the signal means for ${softwareType} sales at ${hospitalName}.
   Do NOT change signal text, source, sourceQuality, confidence, verified, or urgency values.
2. If a signal's text is "No reliable signals found...", keep it as-is and write a discovery-focused implication.
3. For painPoints: 4 points specific to ${hospitalName} size/signals. Use signals as evidence.
4. For talkingPoints: point 1 must reference their biggest signal. All points hospital-specific.
5. For discoveryQuestions: reference ${hospitalName} signals and ${contactName} role specifically.
6. For nextSteps: tailor to this hospital deal stage and contact verification status.
7. For recommendedApproach.strategy: customize based on hospital size and contact role.

PRE-BUILT SIGNALS (use these exactly, only fill in implication):
${prebuiltSignalsJSON}

Return ONLY valid JSON in this exact structure:
{
  "hospitalOverview": {
    "summary": "Facts from web search. If no data: 'Limited public data - focus on discovery'",
    "beds": ${hospitalBeds || null},
    "keyFacts": ["Only facts found in web search"]
  },
  "contactProfile": {
    "name": "${contactName}",
    "designation": "${validatedDesignation}",
    "verified": ${contactVerified},
    "likelyPriorities": ["GENERATE: Top priority for ${contactName} based on their ${validatedDesignation} role", "GENERATE: Second priority based on ${hospitalName} signals", "GENERATE: Third priority specific to their designation"],
    "engagementTip": "GENERATE: Specific behavioral insight for ${contactName} as ${validatedDesignation} at ${hospitalName} - what drives their decisions?",
    "behavioralTags": ["GENERATE: 2-word tag like EX-COMPANY or COST-FOCUSED based on designation", "GENERATE: Second behavioral tag"],
    "background": "GENERATE: 1-2 sentences about what a ${validatedDesignation} at a hospital like ${hospitalName} typically cares about, based on signals"
  },
  "intelligenceSignals": ${prebuiltSignalsJSON.replace(/__FILL_IN[^_]*__/g, "Write implication here")},
  "painPoints": [
    {
      "pain": "${softwareType === "HIS" ? "Manual workflows creating data silos, reducing care coordination speed" : softwareType === "LIS" ? "Lab turnaround times impacting clinical decisions" : softwareType === "RIS" ? "Image archival delays affecting patient care" : softwareType === "EMR" ? "Clinical documentation burden reducing physician time with patients" : softwareType === "HIMS" ? "Fragmented hospital data preventing unified reporting" : softwareType === "Billing" ? "High claim rejection rates and slow collections cycle" : "Siloed procurement, finance and HR data"}",
      "evidence": "Critical ${softwareType} pain point for Indian hospitals"
    },
    {
      "pain": "GENERATE: Second pain point specific to ${hospitalName} signals",
      "evidence": "GENERATE: Evidence from intelligence signals above"
    },
    {
      "pain": "GENERATE: Third pain point specific to ${hospitalName} and ${softwareType}",
      "evidence": "GENERATE: Evidence from hospital size and expansion signals"
    },
    {
      "pain": "GENERATE: Fourth pain point specific to ${contactName} role and priorities",
      "evidence": "GENERATE: Evidence from contact profile and hospital context"
    }
  ],
  "talkingPoints": [
    {
      "point": "${softwareType === 'HIS' ? 'Automate OPD workflows and bed management to reduce patient wait times' : softwareType === 'LIS' ? 'Reduce lab turnaround time by 40-60% with auto-validation and auto-reporting' : softwareType === 'RIS' ? 'Cut radiology report turnaround from hours to minutes with DICOM integration' : softwareType === 'EMR' ? 'Accelerate clinical documentation by 50% with structured templates and voice input' : softwareType === 'HIMS' ? 'Unify hospital-wide data into single source of truth for compliance and audit' : softwareType === 'Billing' ? 'Reduce claim rejection rate by 35% and accelerate collections cycle' : 'Integrate procurement, finance and HR into single ERP dashboard'}",
      "hook": "Directly addresses ${validatedDesignation}'s primary ${softwareType} KPI"
    },
    { "point": "GENERATE: Second talking point referencing ${hospitalName} expansion signals", "hook": "GENERATE: Hook specific to ${validatedDesignation} priorities" },
    { "point": "GENERATE: Third talking point specific to ${hospitalName} size and specialty", "hook": "GENERATE: Hook addressing their known challenges" },
    { "point": "GENERATE: Fourth talking point addressing ${contactName} role concerns", "hook": "GENERATE: Hook tied to their deal stage" }
  "recommendedApproach": {
    "openingLine": "${contactVerified ? `Thank you for making time. We work with ${validatedDesignation}s across India modernizing ${softwareType}.` : `I appreciate the opportunity to understand ${hospitalName}'s priorities for ${softwareType}.`}",
    "strategy": "1) Validate their current pain points with ${softwareType} 2) Position our proven approach 3) Quantify ROI specific to their size 4) Outline next steps with timeline",
    "watchOuts": [
      ${contactVerified ? `"Confirm budget timeline and stakeholder alignment"` : `"PRIORITY: Confirm ${contactName} is decision authority for ${softwareType}"`},
      "Identify competing vendors already in discussions",
      "Understand their change management readiness"
    ]
  },
  "discoveryQuestions": [
    ${!contactVerified ? `"Is ${contactName} the key decision-maker for ${softwareType}, or should we include others?",` : ""}
    "GENERATE: Question about ${hospitalName} current ${softwareType} challenges based on signals",
    "GENERATE: Question specific to ${hospitalName} expansion/growth signals",
    "GENERATE: Question about ${contactName} decision timeline and budget based on their role",
    "GENERATE: Question about stakeholders specific to ${hospitalName} size and structure",
    "GENERATE: Question about barriers specific to ${hospitalName} context"
  ],
  "competitorAlerts": [],
  "nextSteps": [
    ${!contactVerified ? `"Verify ${contactName}'s authority in decision-making",` : ""}
    "Prepare ROI calculator tailored to ${hospitalName}'s size and specialty",
    "Research hospital's recent expansion or accreditation news for talking points",
    "Identify quick wins implementable in first 90 days",
    "Prepare demo focused on ${validatedDesignation} KPIs, not technical features"
  ]
}`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.4,
      max_tokens: 2000,
    });

    const raw = completion.choices[0].message.content ?? "";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in LLM response");

    let jsonStr = jsonMatch[0]
      .replace(/,\s*]/g, "]")
      .replace(/,\s*}/g, "}")
      .replace(/[\x00-\x1F\x7F]/g, " ");

    const brief = JSON.parse(jsonStr);

    // Post-process: replace any unfilled implication placeholders
    if (brief.intelligenceSignals) {
      brief.intelligenceSignals = brief.intelligenceSignals.map((s: any) => ({
        ...s,
        implication: s.implication?.includes("__FILL_IN") || s.implication?.includes("Write implication here")
          ? `This signal is relevant to ${softwareType} procurement at ${hospitalName} — use as a conversation opener`
          : s.implication,
      }));
    }

    return NextResponse.json({
      success: true,
      brief,
      meta: {
        contactVerified,
        intelligenceSearched: !!intelligenceSummary,
        hospital: hospitalName,
        city,
        hospitalLogo,
        hospitalImage,
        hospitalUrl,
        timestamp: new Date().toISOString(),
        signalsCount: brief.intelligenceSignals?.length ?? 0,
      },
    });

  } catch (err: any) {
    console.error("Agent error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}