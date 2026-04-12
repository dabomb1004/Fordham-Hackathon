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

type Source = { title: string; url: string };

function topSources(results: TavilyResult[], n = 3): Source[] {
  return results
    .filter((r) => r.score > 0.3)
    .slice(0, n)
    .map((r) => ({ title: r.title, url: r.url }));
}

// ---------------------------------------------------------------------------
// Brand-proximity check
// Returns true if the text strongly associates the brand with the issue
// (not just a generic industry article)
// ---------------------------------------------------------------------------
function mentionsBrandDirectly(text: string, brandName: string): boolean {
  const brand = brandName.toLowerCase().split(" ")[0]; // e.g. "doctor's" from "Doctor's Best"
  const window = 300; // characters around a brand mention to check for issue keywords
  const lower = text.toLowerCase();
  let idx = lower.indexOf(brand);
  while (idx !== -1) {
    const snippet = lower.slice(Math.max(0, idx - window), idx + window);
    if (
      /recall|warning|lawsuit|contamination|outbreak|violation|banned|fraud|complaint/i.test(snippet)
    ) return true;
    idx = lower.indexOf(brand, idx + 1);
  }
  return false;
}

// ---------------------------------------------------------------------------
// Factor: Food & Product Safety
// Score 0-100 for this factor only
// ---------------------------------------------------------------------------
function analyzeSafety(results: TavilyResult[], brandName: string): ValidationFactor & { score: number } {
  const text = combinedText(results);
  const lower = text.toLowerCase();
  const issues: string[] = [];
  const positives: string[] = [];

  // Only flag if the brand is directly implicated (not generic industry news)
  const directlyImplicated = mentionsBrandDirectly(text, brandName);

  if (directlyImplicated) {
    if (/class (i|ii|iii) recall/i.test(lower)) issues.push("Official product recall on record");
    else if (/fda (recall|alert)/i.test(lower)) issues.push("FDA recall or alert linked to brand");
    if (/salmonella|listeria|e\.?\s*coli|hepatitis/i.test(lower)) issues.push("Pathogen contamination reported");
    if (/heavy metal|lead|arsenic|mercury|cadmium/i.test(lower)) issues.push("Heavy metal contamination reported");
    if (/illness outbreak|food poison/i.test(lower)) issues.push("Illness outbreak associated with brand");
    if (/health violation|health code/i.test(lower)) issues.push("Health code violations on record");
    if (/misleading (claim|label)/i.test(lower)) issues.push("Misleading labeling or claims reported");
    if (/class action/i.test(lower)) issues.push("Class action lawsuit found");
  }

  if (issues.length === 0) {
    positives.push("No direct safety incidents found for this brand");
    if (/clean record|no recall|safe/i.test(lower)) positives.push("Reported clean safety record");
  }

  // Weighted score: start at 100, deduct per confirmed direct issue
  let score = 100;
  for (const issue of issues) {
    if (/recall|contamination|outbreak/i.test(issue)) score -= 35;
    else if (/lawsuit|violation/i.test(issue)) score -= 20;
    else score -= 15;
  }
  score = Math.max(0, score);

  const status: ValidationFactor["status"] =
    score >= 75 ? "pass" : score >= 45 ? "warn" : "fail";

  return {
    category: "Food & Product Safety",
    status,
    findings: [...issues, ...positives],
    summary: results[0]?.content?.slice(0, 200) ?? "",
    sources: topSources(results),
    score,
  };
}

// ---------------------------------------------------------------------------
// Factor: Regulatory & Licensing
// ---------------------------------------------------------------------------
function analyzeRegulatory(results: TavilyResult[], brandName: string): ValidationFactor & { score: number } {
  const text = combinedText(results);
  const lower = text.toLowerCase();
  const issues: string[] = [];
  const positives: string[] = [];

  const directlyImplicated = mentionsBrandDirectly(text, brandName);

  // Positives — look broadly
  if (/fda (approved|cleared)/i.test(text)) positives.push("FDA approved or cleared");
  if (/fda registered/i.test(text)) positives.push("FDA registered facility");
  if (/usda (approved|inspected)/i.test(text)) positives.push("USDA approved/inspected");
  if (/gmp (certified|compliant|manufacturing)/i.test(text)) positives.push("GMP certified manufacturing");
  if (/iso (certified|9001|22000)/i.test(text)) positives.push("ISO certified");

  // Negatives — only if brand is directly implicated
  if (directlyImplicated) {
    if (/banned (ingredient|substance)/i.test(lower)) issues.push("Contains banned ingredient");
    if (/undisclosed ingredient/i.test(lower)) issues.push("Undisclosed ingredients reported");
    if (/counterfeit|fake product/i.test(lower)) issues.push("Counterfeit product reports found");
    if (/warning letter/i.test(lower)) issues.push("Regulatory warning letter issued to brand");
    if (/ftc (warning|complaint|action)/i.test(lower)) issues.push("FTC warning or enforcement action");
    if (/dea schedule|controlled substance/i.test(lower)) issues.push("Contains controlled substance");
  }

  if (issues.length === 0 && positives.length === 0) {
    positives.push("No regulatory violations found");
  }

  let score = 70; // neutral baseline
  score += positives.length * 10;
  score -= issues.length * 25;
  score = Math.max(0, Math.min(100, score));

  const status: ValidationFactor["status"] =
    issues.length >= 1 ? "fail" : positives.length > 0 ? "pass" : "warn";

  return {
    category: "Regulatory & Licensing",
    status,
    findings: [...issues, ...positives],
    summary: results[0]?.content?.slice(0, 200) ?? "",
    sources: topSources(results),
    score,
  };
}

// ---------------------------------------------------------------------------
// Factor: Certifications
// ---------------------------------------------------------------------------
function analyzeCertifications(results: TavilyResult[]): ValidationFactor & { score: number } {
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
    [/certified (organic|natural)/i, "Certified Organic/Natural"],
  ];

  const seen = new Set<string>();
  for (const [pattern, label] of patterns) {
    if (pattern.test(text) && !seen.has(label)) {
      found.push(label);
      seen.add(label);
    }
  }

  // Score: 60 base + 10 per cert, capped at 100
  const score = Math.min(100, 60 + found.length * 10);

  return {
    category: "Certifications",
    status: found.length >= 2 ? "pass" : found.length === 1 ? "warn" : "warn",
    findings: found.length > 0 ? found : ["No third-party certifications found"],
    summary: found.length > 0
      ? `Verified certifications: ${found.join(", ")}.`
      : "No recognized third-party certifications detected in available sources.",
    sources: topSources(results),
    score,
  };
}

// ---------------------------------------------------------------------------
// Factor: Allergens & Ingredients
// INFO ONLY — does not affect trust score
// ---------------------------------------------------------------------------
function analyzeAllergens(
  results: TavilyResult[],
  ingredientsOfConcern: string[]
): ValidationFactor & { score: number } {
  const text = combinedText(results).toLowerCase();
  const detected: string[] = [];

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

  // Flag ingredients the agent specifically flagged against the user's profile
  for (const ingredient of ingredientsOfConcern) {
    const flagged = `${ingredient} — flagged against your profile`;
    if (!detected.find((d) => d.toLowerCase().includes(ingredient.toLowerCase()))) {
      detected.push(flagged);
    }
  }

  return {
    category: "Allergens & Ingredients",
    // Always "warn" if allergens detected (informational), "pass" if none
    // This factor does NOT contribute to trust score
    status: detected.length > 0 ? "warn" : "pass",
    findings: detected.length > 0 ? detected : ["No common allergens detected"],
    summary: detected.length > 0
      ? "Allergen information is provided for your awareness. Cross-check with product label."
      : "No common allergen signals found in available data.",
    sources: topSources(results),
    score: 100, // neutral — never drags down trust score
  };
}

// ---------------------------------------------------------------------------
// Factor: Consumer Reputation
// ---------------------------------------------------------------------------
function analyzeConsumerReputation(results: TavilyResult[], brandName: string): ValidationFactor & { score: number } {
  const text = combinedText(results);
  const lower = text.toLowerCase();
  const positives: string[] = [];
  const negatives: string[] = [];

  const directlyImplicated = mentionsBrandDirectly(text, brandName);

  if (/top rated|best brand|editor.?s choice|highly recommended|best seller/i.test(text)) positives.push("Top-rated by reviewers");
  if (/award.?winning/i.test(text)) positives.push("Award-winning product or brand");
  if (/trusted brand|reputable|well.?established|decades? of/i.test(text)) positives.push("Established and trusted brand");
  if (/widely available|sold (at|in) major/i.test(text)) positives.push("Widely distributed and available");

  if (directlyImplicated) {
    if (/bbb complaint|better business bureau/i.test(lower)) negatives.push("BBB complaints on record");
    if (/scam|rip.?off/i.test(lower)) negatives.push("Scam or fraud reports found");
  }
  // "complaints" is too broad — only flag if brand-direct
  if (directlyImplicated && /class action|mass complaint/i.test(lower)) negatives.push("Mass consumer complaints found");

  if (positives.length === 0 && negatives.length === 0) positives.push("No notable reputation signals found");

  let score = 70;
  score += positives.filter((p) => !p.includes("notable")).length * 8;
  score -= negatives.length * 20;
  score = Math.max(0, Math.min(100, score));

  return {
    category: "Consumer Reputation",
    status: negatives.length >= 1 ? "warn" : positives.length > 1 ? "pass" : "pass",
    findings: [...negatives, ...positives],
    summary: results[0]?.content?.slice(0, 200) ?? "",
    sources: topSources(results),
    score,
  };
}

// ---------------------------------------------------------------------------
// Weighted trust score
// Allergens factor is INFO ONLY and excluded from score
// Weights: Safety 40%, Regulatory 30%, Certifications 20%, Reputation 10%
// ---------------------------------------------------------------------------
function computeTrustScore(factors: (ValidationFactor & { score: number })[]): number {
  const weights: Record<string, number> = {
    "Food & Product Safety": 0.40,
    "Regulatory & Licensing": 0.30,
    "Certifications": 0.20,
    "Consumer Reputation": 0.10,
    "Allergens & Ingredients": 0, // info only, excluded
  };

  let total = 0;
  let totalWeight = 0;
  for (const f of factors) {
    const w = weights[f.category] ?? 0;
    if (w === 0) continue;
    total += f.score * w;
    totalWeight += w;
  }

  return totalWeight > 0 ? Math.round(total / totalWeight) : 70;
}

function verdictFromScore(score: number, factors: (ValidationFactor & { score: number })[]): string {
  // Only UNSAFE if a critical factor (Safety or Regulatory) is confirmed fail WITH a low score
  const safetyFactor = factors.find((f) => f.category === "Food & Product Safety");
  const regulatoryFactor = factors.find((f) => f.category === "Regulatory & Licensing");

  const criticalFail =
    (safetyFactor && safetyFactor.status === "fail" && safetyFactor.score < 40) ||
    (regulatoryFactor && regulatoryFactor.status === "fail" && regulatoryFactor.score < 40);

  if (criticalFail) return "UNSAFE";
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
    const label = productName ? `${brandName} ${productName}` : brandName;
    const cat = productCategory ? ` ${productCategory}` : "";

    const [safetyData, regulatoryData, certData, reputationData] = await Promise.all([
      tavilySearch(`"${brandName}" ${cat} recall contamination outbreak illness safety warning`, 6),
      tavilySearch(`"${brandName}" FDA approved registered warning letter banned regulatory violation`, 5),
      tavilySearch(`"${brandName}" certified organic non-gmo NSF USP kosher halal gluten-free`, 5),
      tavilySearch(`"${brandName}" ${productName} reviews reputation complaints BBB trusted`, 5),
    ]);

    const safetyFactor = analyzeSafety(safetyData.results, brandName);
    const regulatoryFactor = analyzeRegulatory(regulatoryData.results, brandName);
    const certFactor = analyzeCertifications(certData.results);
    const allergenFactor = analyzeAllergens([...safetyData.results, ...certData.results], ingredientsOfConcern);
    const reputationFactor = analyzeConsumerReputation(reputationData.results, brandName);

    const factors = [safetyFactor, regulatoryFactor, certFactor, allergenFactor, reputationFactor];
    const trustScore = computeTrustScore(factors);
    const verdict = verdictFromScore(trustScore, factors);

    const redFlags = factors.flatMap((f) =>
      f.status === "fail" ? f.findings.filter((x) => !x.startsWith("No ") && !x.startsWith("Clean") && !x.startsWith("Verified")) : []
    );
    const certifications = certFactor.findings.filter((x) => !x.startsWith("No "));

    const summary =
      safetyData.answer ??
      safetyData.results[0]?.content?.slice(0, 250) ??
      `No major safety issues found for ${label}.`;

    const allResults = [...safetyData.results, ...regulatoryData.results, ...certData.results, ...reputationData.results];
    const sources = allResults.filter((r) => r.score > 0.4).slice(0, 6).map((r) => ({ title: r.title, url: r.url }));

    // Strip internal score from factors before returning (not needed in UI)
    const cleanFactors: ValidationFactor[] = factors.map(({ score: _score, ...rest }) => rest);

    return {
      brand_name: brandName,
      product_name: productName,
      trust_score: trustScore,
      verdict,
      certifications,
      red_flags: redFlags,
      reviews_summary: summary,
      factors: cleanFactors,
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
