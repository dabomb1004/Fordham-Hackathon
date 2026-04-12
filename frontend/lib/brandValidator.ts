import { ValidationResult } from "./chatAgent";

const TAVILY_API_URL = "https://api.tavily.com/search";

interface TavilyResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

interface TavilyResponse {
  results: TavilyResult[];
  answer?: string;
}

async function tavilySearch(query: string, maxResults = 5): Promise<TavilyResponse> {
  const res = await fetch(TAVILY_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: process.env.TAVILY_API_KEY,
      query,
      max_results: maxResults,
      include_answer: true,
      search_depth: "advanced",
    }),
  });

  if (!res.ok) {
    throw new Error(`Tavily search failed: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

// ---------------------------------------------------------------------------
// Scoring helpers
// ---------------------------------------------------------------------------

function extractRedFlags(results: TavilyResult[], brandName: string): string[] {
  const flags: string[] = [];
  const text = results.map((r) => `${r.title} ${r.content}`).join(" ").toLowerCase();

  const patterns: [RegExp, string][] = [
    [/fda (recall|warning|alert|ban)/i, "FDA recall or warning found"],
    [/class (i|ii|iii) recall/i, "Product recall on record"],
    [/lawsuit|class action/i, "Lawsuit or class action found"],
    [/counterfeit|fake|fraud/i, "Counterfeit/fraud reports found"],
    [/health violation|health code/i, "Health code violations found"],
    [/undisclosed ingredient/i, "Undisclosed ingredients reported"],
    [/heavy metal|lead|arsenic|mercury/i, "Heavy metal contamination reported"],
    [/salmonella|listeria|e\.?\s*coli/i, "Pathogen contamination reported"],
    [/misleading (claim|label|marketing)/i, "Misleading claims or labeling reported"],
    [/banned (ingredient|substance)/i, "Banned ingredient reported"],
  ];

  for (const [pattern, flag] of patterns) {
    if (pattern.test(text)) flags.push(flag);
  }

  return flags;
}

function extractCertifications(results: TavilyResult[]): string[] {
  const certs: string[] = [];
  const text = results.map((r) => `${r.title} ${r.content}`).join(" ");

  const patterns: [RegExp, string][] = [
    [/usda organic/i, "USDA Organic"],
    [/non[\s-]gmo/i, "Non-GMO Project Verified"],
    [/fda approved/i, "FDA Approved"],
    [/fda registered/i, "FDA Registered"],
    [/b corp/i, "B Corp Certified"],
    [/kosher/i, "Kosher Certified"],
    [/halal/i, "Halal Certified"],
    [/gluten[\s-]free certified/i, "Certified Gluten-Free"],
    [/fair trade/i, "Fair Trade Certified"],
    [/nsf (certified|international)/i, "NSF Certified"],
    [/usp verified/i, "USP Verified"],
    [/informed sport/i, "Informed Sport Certified"],
    [/bcorp|b-corp/i, "B Corp Certified"],
  ];

  const seen = new Set<string>();
  for (const [pattern, cert] of patterns) {
    if (pattern.test(text) && !seen.has(cert)) {
      certs.push(cert);
      seen.add(cert);
    }
  }

  return certs;
}

function computeTrustScore(
  redFlags: string[],
  certifications: string[],
  results: TavilyResult[]
): number {
  let score = 70; // neutral baseline

  // Red flags tank the score
  score -= redFlags.length * 15;

  // Certifications boost it
  score += certifications.length * 5;

  // Positive signals
  const positiveText = results.map((r) => `${r.title} ${r.content}`).join(" ").toLowerCase();
  if (/award|best brand|top rated|highly rated|trusted/i.test(positiveText)) score += 5;
  if (/established|founded in (19|20)\d{2}|years? of experience/i.test(positiveText)) score += 3;

  return Math.max(0, Math.min(100, Math.round(score)));
}

function verdictFromScore(score: number, redFlags: string[]): string {
  const hasCritical = redFlags.some((f) =>
    /FDA recall|contamination|banned ingredient|Counterfeit/i.test(f)
  );
  if (hasCritical) return "UNSAFE";
  if (score >= 75) return "SAFE";
  if (score >= 50) return "CAUTION";
  return "UNSAFE";
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export async function validateBrand(
  brandName: string,
  productName = "",
  productCategory = "",
  ingredientsOfConcern: string[] = []
): Promise<ValidationResult> {
  try {
    // Run targeted searches in parallel
    const productLabel = productName ? `${brandName} ${productName}` : brandName;
    const categoryHint = productCategory ? ` ${productCategory}` : "";
    const ingredientHint =
      ingredientsOfConcern.length > 0
        ? ` ${ingredientsOfConcern.slice(0, 3).join(" ")}`
        : "";

    const [safetyData, certData] = await Promise.all([
      tavilySearch(
        `${productLabel}${categoryHint} FDA recall warning lawsuit safety complaint${ingredientHint}`,
        6
      ),
      tavilySearch(
        `${productLabel}${categoryHint} certifications organic non-gmo trusted brand`,
        4
      ),
    ]);

    const allResults = [...safetyData.results, ...certData.results];

    const redFlags = extractRedFlags(allResults, brandName);
    const certifications = extractCertifications(allResults);
    const trustScore = computeTrustScore(redFlags, certifications, allResults);
    const verdict = verdictFromScore(trustScore, redFlags);

    // Build a summary from Tavily's answer or top result snippets
    const summaryParts: string[] = [];
    if (safetyData.answer) summaryParts.push(safetyData.answer);
    else if (safetyData.results[0]) summaryParts.push(safetyData.results[0].content.slice(0, 200));

    const sources = allResults
      .filter((r) => r.score > 0.4)
      .slice(0, 5)
      .map((r) => ({ title: r.title, url: r.url }));

    return {
      brand_name: brandName,
      product_name: productName,
      trust_score: trustScore,
      verdict,
      certifications,
      red_flags: redFlags,
      reviews_summary: summaryParts.join(" ").trim() || `No major safety issues found for ${productLabel}.`,
      sources,
    };
  } catch (err) {
    console.error("[validateBrand] Tavily error:", err);
    // Graceful degradation — return neutral result rather than crashing
    return {
      brand_name: brandName,
      product_name: productName,
      trust_score: null,
      verdict: "PENDING_VALIDATION",
      certifications: [],
      red_flags: [],
      reviews_summary: "Brand validation temporarily unavailable.",
      sources: [],
      stub: true,
    };
  }
}
