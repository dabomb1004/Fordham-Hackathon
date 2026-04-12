import { ValidationResult, ValidationFactor } from "./chatAgent";

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
  if (!res.ok) throw new Error(`Tavily search failed: ${res.status}`);
  return res.json();
}

function combinedText(results: TavilyResult[]) {
  return results.map((r) => `${r.title} ${r.content}`).join(" ");
}

// ---------------------------------------------------------------------------
// Per-factor extractors
// ---------------------------------------------------------------------------

function analyzeSafety(results: TavilyResult[], brandName: string): ValidationFactor {
  const text = combinedText(results).toLowerCase();
  const issues: string[] = [];
  const positives: string[] = [];

  if (/fda (recall|warning|alert|ban)/i.test(text)) issues.push("FDA recall or warning on record");
  if (/class (i|ii|iii) recall/i.test(text)) issues.push("Official product recall issued");
  if (/salmonella|listeria|e\.?\s*coli/i.test(text)) issues.push("Pathogen contamination reported");
  if (/heavy metal|lead|arsenic|mercury|cadmium/i.test(text)) issues.push("Heavy metal contamination reported");
  if (/food poison|illness outbreak/i.test(text)) issues.push("Illness outbreak linked to brand");
  if (/health violation|health code/i.test(text)) issues.push("Health code violations on record");
  if (/class action|lawsuit/i.test(text)) issues.push("Active or settled lawsuits found");
  if (/misleading (claim|label)/i.test(text)) issues.push("Misleading labeling or claims reported");

  if (issues.length === 0) positives.push("No major safety incidents found");
  if (/clean record|no recall|safe product/i.test(text)) positives.push("Clean safety record");

  const status: ValidationFactor["status"] =
    issues.length >= 2 ? "fail" : issues.length === 1 ? "warn" : "pass";

  return {
    category: "Food & Product Safety",
    status,
    findings: [...issues, ...positives],
    summary: results[0]?.content?.slice(0, 180) ?? "",
  };
}

function analyzeRegulatory(results: TavilyResult[]): ValidationFactor {
  const text = combinedText(results);
  const issues: string[] = [];
  const positives: string[] = [];

  if (/fda approved/i.test(text)) positives.push("FDA approved");
  if (/fda registered/i.test(text)) positives.push("FDA registered facility");
  if (/usda (approved|inspected)/i.test(text)) positives.push("USDA approved/inspected");
  if (/ftc (warning|complaint|action)/i.test(text)) issues.push("FTC warning or complaint");
  if (/banned (ingredient|substance)/i.test(text)) issues.push("Contains banned ingredient");
  if (/undisclosed ingredient/i.test(text)) issues.push("Undisclosed ingredients reported");
  if (/counterfeit|fake|fraud/i.test(text)) issues.push("Counterfeit or fraud reports found");
  if (/warning letter/i.test(text)) issues.push("Regulatory warning letter issued");
  if (/dea schedule|controlled substance/i.test(text)) issues.push("Contains controlled substance");
  if (/gmp (certified|compliant)/i.test(text)) positives.push("GMP certified manufacturing");

  if (issues.length === 0 && positives.length === 0) positives.push("No regulatory violations found");

  const status: ValidationFactor["status"] =
    issues.length >= 1 ? "fail" : positives.length > 0 ? "pass" : "warn";

  return {
    category: "Regulatory & Licensing",
    status,
    findings: [...issues, ...positives],
    summary: results[0]?.content?.slice(0, 180) ?? "",
  };
}

function analyzeCertifications(results: TavilyResult[]): ValidationFactor {
  const text = combinedText(results);
  const found: string[] = [];

  const patterns: [RegExp, string][] = [
    [/usda organic/i, "USDA Organic"],
    [/non[\s-]gmo/i, "Non-GMO Project Verified"],
    [/nsf (certified|international)/i, "NSF Certified"],
    [/usp verified/i, "USP Verified"],
    [/informed sport/i, "Informed Sport Certified"],
    [/gluten[\s-]free certified/i, "Certified Gluten-Free"],
    [/fair trade/i, "Fair Trade Certified"],
    [/b[\s-]?corp/i, "B Corp Certified"],
    [/kosher/i, "Kosher Certified"],
    [/halal/i, "Halal Certified"],
    [/rainforest alliance/i, "Rainforest Alliance"],
    [/whole30 approved/i, "Whole30 Approved"],
    [/vegan (certified|society)/i, "Vegan Certified"],
  ];

  const seen = new Set<string>();
  for (const [pattern, label] of patterns) {
    if (pattern.test(text) && !seen.has(label)) {
      found.push(label);
      seen.add(label);
    }
  }

  return {
    category: "Certifications",
    status: found.length > 0 ? "pass" : "warn",
    findings: found.length > 0 ? found : ["No third-party certifications found"],
    summary: found.length > 0
      ? `Verified certifications: ${found.join(", ")}.`
      : "No recognized third-party certifications detected.",
  };
}

function analyzeAllergens(
  results: TavilyResult[],
  ingredientsOfConcern: string[]
): ValidationFactor {
  const text = combinedText(results).toLowerCase();
  const detected: string[] = [];
  const safe: string[] = [];

  const commonAllergens: [RegExp, string][] = [
    [/\bpeanut/i, "Peanuts"],
    [/\btree nut|almond|cashew|walnut|pecan|pistachio/i, "Tree nuts"],
    [/\bdairy|milk|lactose|whey|casein/i, "Dairy/Lactose"],
    [/\bgluten|wheat|barley|rye/i, "Gluten/Wheat"],
    [/\bsoy\b/i, "Soy"],
    [/\begg\b/i, "Eggs"],
    [/\bshellfish|shrimp|crab|lobster/i, "Shellfish"],
    [/\bfish\b|salmon|tuna|cod/i, "Fish"],
    [/\bsesame/i, "Sesame"],
  ];

  for (const [pattern, label] of commonAllergens) {
    if (pattern.test(text)) detected.push(`Contains ${label}`);
  }

  // Also check explicitly passed ingredients of concern
  for (const ingredient of ingredientsOfConcern) {
    const flagged = `${ingredient} flagged by user profile`;
    if (!detected.includes(flagged)) detected.push(flagged);
  }

  if (detected.length === 0) safe.push("No common allergens detected in search results");

  return {
    category: "Allergens & Ingredients",
    status: detected.length > 0 ? "warn" : "pass",
    findings: detected.length > 0 ? detected : safe,
    summary: detected.length > 0
      ? `Allergen signals found: ${detected.join(", ")}.`
      : "No common allergen signals found in available data.",
  };
}

function analyzeConsumerReputation(results: TavilyResult[]): ValidationFactor {
  const text = combinedText(results).toLowerCase();
  const positives: string[] = [];
  const negatives: string[] = [];

  if (/top rated|best brand|editor.?s choice|highly recommended/i.test(text)) positives.push("Top-rated by reviewers");
  if (/award.?winning|award winning/i.test(text)) positives.push("Award-winning product");
  if (/trusted brand|reputable|well established/i.test(text)) positives.push("Established and trusted brand");
  if (/complaint|negative review|bad review|do not buy/i.test(text)) negatives.push("Consumer complaints on record");
  if (/bbb complaint|better business bureau/i.test(text)) negatives.push("BBB complaints found");
  if (/scam|rip.?off/i.test(text)) negatives.push("Scam or rip-off reports found");

  if (positives.length === 0 && negatives.length === 0) positives.push("No notable consumer reputation signals found");

  return {
    category: "Consumer Reputation",
    status: negatives.length >= 2 ? "fail" : negatives.length === 1 ? "warn" : "pass",
    findings: [...negatives, ...positives],
    summary: results[0]?.content?.slice(0, 180) ?? "",
  };
}

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------

function computeTrustScore(factors: ValidationFactor[]): number {
  let score = 70;
  for (const f of factors) {
    if (f.status === "fail") score -= 18;
    else if (f.status === "warn") score -= 6;
    else score += 4;
  }
  return Math.max(0, Math.min(100, Math.round(score)));
}

function verdictFromFactors(factors: ValidationFactor[], score: number): string {
  const hasCriticalFail = factors.some(
    (f) => f.status === "fail" && (f.category === "Food & Product Safety" || f.category === "Regulatory & Licensing")
  );
  if (hasCriticalFail) return "UNSAFE";
  if (score >= 72) return "SAFE";
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
    const label = productName ? `${brandName} ${productName}` : brandName;
    const cat = productCategory ? ` ${productCategory}` : "";

    // 4 targeted parallel searches
    const [safetyData, regulatoryData, certData, reputationData] = await Promise.all([
      tavilySearch(`${label}${cat} FDA recall contamination safety warning illness outbreak`, 6),
      tavilySearch(`${label}${cat} FDA approved registered banned ingredient regulatory violation warning letter`, 5),
      tavilySearch(`${label}${cat} certified organic non-gmo NSF USP kosher halal gluten-free certification`, 5),
      tavilySearch(`${label}${cat} consumer reviews complaints BBB lawsuit class action reputation`, 5),
    ]);

    const factors: ValidationFactor[] = [
      analyzeSafety(safetyData.results, brandName),
      analyzeRegulatory(regulatoryData.results),
      analyzeCertifications(certData.results),
      analyzeAllergens([...safetyData.results, ...certData.results], ingredientsOfConcern),
      analyzeConsumerReputation(reputationData.results),
    ];

    const trustScore = computeTrustScore(factors);
    const verdict = verdictFromFactors(factors, trustScore);

    const redFlags = factors.flatMap((f) =>
      f.status !== "pass" ? f.findings.filter((x) => !x.startsWith("No ") && !x.startsWith("Clean") && !x.startsWith("Verified")) : []
    );
    const certifications = factors
      .find((f) => f.category === "Certifications")
      ?.findings.filter((x) => !x.startsWith("No ")) ?? [];

    const summary =
      safetyData.answer ??
      safetyData.results[0]?.content?.slice(0, 250) ??
      `No major safety issues found for ${label}.`;

    const allResults = [
      ...safetyData.results,
      ...regulatoryData.results,
      ...certData.results,
      ...reputationData.results,
    ];
    const sources = allResults
      .filter((r) => r.score > 0.4)
      .slice(0, 6)
      .map((r) => ({ title: r.title, url: r.url }));

    return {
      brand_name: brandName,
      product_name: productName,
      trust_score: trustScore,
      verdict,
      certifications,
      red_flags: redFlags,
      reviews_summary: summary,
      factors,
      sources,
    };
  } catch (err) {
    console.error("[validateBrand] Tavily error:", err);
    return {
      brand_name: brandName,
      product_name: productName,
      trust_score: null,
      verdict: "PENDING_VALIDATION",
      certifications: [],
      red_flags: [],
      reviews_summary: "Brand validation temporarily unavailable.",
      factors: [],
      sources: [],
      stub: true,
    };
  }
}
