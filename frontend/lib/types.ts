// ─── User Profile — JSON Data Structure ─────────────────────────────────────
//
// This schema is stored in data/user.json and exchanged with the FastAPI
// backend via GET/PUT /api/backend/user.
//
// Top-level sections:
//   profile       — who the user is (personal info + BMI)
//   food_safety   — allergies, dietary type, sensitivities
//   preferences   — cuisine tastes, spice, budget, eating goal
//   priority      — what the AI should optimize for
//   onboarding    — completion metadata

// ─── Personal Profile ────────────────────────────────────────────────────────

export interface PersonalProfile {
  /** Display name */
  name: string;
  /** Age in years */
  age: number;
  /** Free-text height, e.g. "5'9\"" or "175 cm" */
  height: string;
  /** Free-text weight, e.g. "165 lbs" or "75 kg" */
  weight: string;
  /** Body Mass Index — auto-calculated from height + weight; null until both are set */
  bmi: number | null;
}

// ─── Food Safety ─────────────────────────────────────────────────────────────

export type AllergyOption = string;
export type DietaryType = string;
export type Sensitivity = string;

export interface FoodSafety {
  /** Multi-select — ["None"] means no known allergies */
  allergies: string[];
  /** Single-select dietary identity (array for extensibility) */
  dietary_type: string[];
  /** Multi-select intolerances / medical dietary needs */
  sensitivities: string[];
  medical_conditions?: string[];
  dietary_needs?: string[];
}

// ─── Food Preferences ────────────────────────────────────────────────────────

export type SpiceLevel = "Mild" | "Medium" | "Hot" | "Extra Hot";
export type PriceRange = "$" | "$$" | "$$$";
export type EatingGoal = "healthy" | "comfort" | "high_protein" | "weight_loss" | "";

export interface FoodPreferences {
  /** Multi-select list of cuisine names, e.g. ["Japanese", "Italian"] */
  favorite_cuisines: string[];
  /** How spicy the user likes their food */
  spice_level: SpiceLevel;
  /** Budget tier for restaurants / food orders */
  price_range: PriceRange;
  /**
   * Primary eating motivation:
   *   "healthy"      — balanced nutrition
   *   "comfort"      — feel-good meals
   *   "high_protein" — fitness / muscle focus
   *   "weight_loss"  — calorie-conscious
   */
  eating_goal: EatingGoal;
}

// ─── Decision Priority ───────────────────────────────────────────────────────

/**
 * What the AI agent should weight most heavily when ranking options:
 *   "taste"       — flavour / experience
 *   "health"      — nutrition score
 *   "price"       — cost / value
 *   "convenience" — speed / proximity
 *   "safety"      — allergy / dietary compliance
 */
export type DecisionFactor =
  | "taste"
  | "health"
  | "price"
  | "convenience"
  | "safety"
  | "";

export interface FoodPriority {
  decision_factor: string | string[];
}

// ─── Onboarding Status ───────────────────────────────────────────────────────

export interface OnboardingStatus {
  /** True once the user has completed all 4 steps */
  completed: boolean;
  /** ISO 8601 timestamp of when the profile was first fully saved */
  completed_at: string | null;
  /** Which step numbers have been submitted (1–4) */
  steps_completed: number[];
}

// ─── Root User Profile ───────────────────────────────────────────────────────

export interface UserProfile {
  /** Stable identifier — currently always "demo_user" */
  id: string;
  profile: PersonalProfile;
  food_safety: FoodSafety;
  preferences: FoodPreferences;
  priority: FoodPriority;
  onboarding: OnboardingStatus;
}

// ─── JSON Example (for reference) ───────────────────────────────────────────
//
// {
//   "id": "demo_user",
//   "profile": {
//     "name": "Alex Johnson",
//     "age": 28,
//     "height": "5'9\"",
//     "weight": "165 lbs",
//     "bmi": 24.4
//   },
//   "food_safety": {
//     "allergies": ["Nuts", "Shellfish"],
//     "dietary_type": ["None"],
//     "sensitivities": ["Lactose Intolerance", "Low Sodium"]
//   },
//   "preferences": {
//     "favorite_cuisines": ["Japanese", "Italian", "Thai"],
//     "spice_level": "Medium",
//     "price_range": "$$",
//     "eating_goal": "healthy"
//   },
//   "priority": {
//     "decision_factor": "health"
//   },
//   "onboarding": {
//     "completed": true,
//     "completed_at": "2026-04-12T10:30:00Z",
//     "steps_completed": [1, 2, 3, 4]
//   }
// }
