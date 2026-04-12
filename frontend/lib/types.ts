export type UserProfile = {
  fullName?: string;
  age?: number;
  heightCm?: number;
  weightKg?: number;
  allergies: string[];
  dietaryType?: string;
  sensitivities: string[];
  medicationAllergies?: string[];
  chronicConditions?: string[];
  currentMedications?: string[];
  insuranceProvider?: string;
  insuranceMemberId?: string;
};

export type AnalysisResult = {
  item_type: "food" | "medicine" | "unknown";
  identified_item_name: string;
  matched_brand_or_restaurant: string;
  location_context: string;
  summary: string;
  ingredients: Array<{
    name: string;
    kind?: "active" | "inactive" | "dish" | "sauce" | "unknown";
    source: string;
    certainty: "high" | "medium" | "low";
  }>;
  preparation_or_usage: string;
  official_status: {
    approvals: Array<{ label: string; year?: string; source: string }>;
    certifications: Array<{ label: string; year?: string; expiry?: string; source: string }>;
    recalls: Array<{ title: string; date?: string; source: string }>;
    bans_or_restrictions: Array<{ country: string; reason: string; source: string }>;
  };
  allergy_risk_assessment: Array<{
    allergen: string;
    risk_percent: number;
    risk_level: "low" | "medium" | "high" | "unknown";
    why: string;
    evidence: string[];
  }>;
  profile_matches: Array<{
    profile_field: string;
    matched_value: string;
    impact: string;
  }>;
  warnings: string[];
  missing_or_uncertain_data: string[];
  sources: Array<{
    title: string;
    url: string;
    source_type: "official" | "menu" | "review" | "medical" | "news" | "directory";
  }>;
  safe_follow_up_suggestions: string[];
};

export type RouterOutput = {
  item_type: "food" | "medicine" | "unknown";
  normalized_item_name: string;
  brand_or_restaurant: string;
  location_hint: string;
  form_factor: string;
  strength?: string;
  possible_synonyms: string[];
  web_search_targets: string[];
  needs_image_verification: boolean;
  ambiguities: string[];
  risk_flags: string[];
};

export type RetrievalPlan = {
  search_intent: string;
  queries: Array<{
    query: string;
    purpose: string;
    preferred_source_types: string[];
  }>;
  priority_domains: string[];
  pages_to_extract_if_found: string[];
  site_to_crawl_if_needed: Array<{ url: string; instructions: string }>;
  site_to_map_if_needed: string[];
  must_verify: string[];
  must_not_claim_without_evidence: string[];
};

export type ValidationIssue = {
  severity: "critical" | "high" | "medium" | "low";
  field: string;
  problem: string;
  fix_instruction: string;
};

export type ValidationResult = {
  approved: boolean;
  issues: ValidationIssue[];
  required_rewrites: string[];
  missing_disclaimers: string[];
  claims_to_remove: string[];
  claims_to_soften: string[];
  final_safety_notes: string[];
};

export type EvidenceBundle = {
  search_results: Array<Record<string, unknown>>;
  top_urls: string[];
  extracted: Record<string, unknown>;
  mapped: Array<Record<string, unknown>>;
  crawled: Array<Record<string, unknown>>;
};

export type AnalysisTrace = {
  router_output: RouterOutput;
  retrieval_plan: RetrievalPlan;
  evidence: EvidenceBundle;
  validation: ValidationResult;
};