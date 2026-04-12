"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Utensils,
  ChevronRight,
  ChevronLeft,
  Check,
  Loader2,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { UserProfile } from "@/lib/types";

// ─── Constants ───────────────────────────────────────────────────────────────

const ALLERGY_OPTIONS = [
  "None", "Nuts", "Dairy", "Gluten", "Seafood",
  "Shellfish", "Soy", "Eggs", "Wheat",
];

const DIETARY_OPTIONS = [
  { value: "None",         emoji: "🍽️" },
  { value: "Vegan",        emoji: "🌱" },
  { value: "Vegetarian",   emoji: "🥦" },
  { value: "Halal",        emoji: "☪️"  },
  { value: "Kosher",       emoji: "✡️"  },
  { value: "Paleo",        emoji: "🥩" },
  { value: "Keto",         emoji: "🧀" },
];

const SENSITIVITY_OPTIONS = [
  "Lactose Intolerance",
  "Low Sodium",
  "Low Sugar",
  "Low Fat",
  "Gluten Sensitivity",
];

const CUISINE_OPTIONS = [
  { name: "Chinese",       emoji: "🥢" },
  { name: "Italian",       emoji: "🍝" },
  { name: "Japanese",      emoji: "🍣" },
  { name: "Mexican",       emoji: "🌮" },
  { name: "Indian",        emoji: "🍛" },
  { name: "Thai",          emoji: "🍜" },
  { name: "Mediterranean", emoji: "🫒" },
  { name: "American",      emoji: "🍔" },
  { name: "Korean",        emoji: "🥘" },
  { name: "French",        emoji: "🥐" },
  { name: "Greek",         emoji: "🥗" },
  { name: "Vietnamese",    emoji: "🍲" },
];

const SPICE_LEVELS = [
  { label: "Mild",       icon: "😌" },
  { label: "Medium",     icon: "🌶️" },
  { label: "Hot",        icon: "🔥" },
  { label: "Extra Hot",  icon: "💀" },
];

const PRICE_RANGES = [
  { value: "$",   label: "Budget"   },
  { value: "$$",  label: "Moderate" },
  { value: "$$$", label: "Premium"  },
];

const EATING_GOALS = [
  { value: "healthy",      label: "Healthy",      emoji: "🥗", desc: "Balanced nutrition"    },
  { value: "comfort",      label: "Comfort Food",  emoji: "🍔", desc: "Feel-good meals"       },
  { value: "high_protein", label: "High Protein",  emoji: "💪", desc: "Fuel for fitness"      },
  { value: "weight_loss",  label: "Weight Loss",   emoji: "⚖️", desc: "Calorie conscious"     },
];

const DECISION_FACTORS = [
  { value: "taste",       label: "Taste",        emoji: "😋", desc: "I eat for the experience"  },
  { value: "health",      label: "Health",        emoji: "💚", desc: "Nutrition comes first"     },
  { value: "price",       label: "Price",         emoji: "💰", desc: "Budget is key"             },
  { value: "convenience", label: "Convenience",   emoji: "⚡", desc: "Fast and easy wins"         },
  { value: "safety",      label: "Safety",        emoji: "🛡️", desc: "Allergies matter most"     },
];

// ─── BMI Helper ──────────────────────────────────────────────────────────────

function calcBMI(height: string, weight: string): number | null {
  const ftIn = height.match(/^(\d+)'(\d+)"/);
  const cm   = height.match(/^(\d+)\s*cm/i);
  const lbs  = weight.match(/^(\d+(?:\.\d+)?)\s*lbs?/i);
  const kg   = weight.match(/^(\d+(?:\.\d+)?)\s*kg/i);

  let h = 0, w = 0;
  if (ftIn) h = (parseInt(ftIn[1]) * 12 + parseInt(ftIn[2])) * 0.0254;
  else if (cm) h = parseInt(cm[1]) / 100;
  if (lbs) w = parseFloat(lbs[1]) * 0.453592;
  else if (kg) w = parseFloat(kg[1]);

  return h > 0 && w > 0 ? Math.round((w / (h * h)) * 10) / 10 : null;
}

// ─── Default state ───────────────────────────────────────────────────────────

const DEFAULT_PROFILE: UserProfile = {
  id: "demo_user",
  profile: { name: "", age: 0, height: "", weight: "", bmi: null },
  food_safety: { allergies: [], dietary_type: ["None"], sensitivities: [] },
  preferences: { favorite_cuisines: [], spice_level: "Medium", price_range: "$$", eating_goal: "" },
  priority: { decision_factor: "" },
  onboarding: { completed: false, completed_at: null, steps_completed: [] },
};

// ─── Page ────────────────────────────────────────────────────────────────────

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep]     = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [data, setData]       = useState<UserProfile>(DEFAULT_PROFILE);

  // Load existing profile (backwards-compatible with old flat shape)
  useEffect(() => {
    fetch("/api/backend/user")
      .then((r) => r.json())
      .then((u) => {
        setData((prev) => ({
          ...prev,
          profile: {
            name:   u.profile?.name   ?? u.name   ?? "",
            age:    u.profile?.age    ?? u.age     ?? 0,
            height: u.profile?.height ?? u.height  ?? "",
            weight: u.profile?.weight ?? u.weight  ?? "",
            bmi:    u.profile?.bmi    ?? null,
          },
          food_safety: u.food_safety  ?? prev.food_safety,
          preferences: u.preferences  ?? prev.preferences,
          priority:    u.priority     ?? prev.priority,
          onboarding:  u.onboarding   ?? prev.onboarding,
        }));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const bmi = calcBMI(data.profile.height, data.profile.weight);

  // ── Toggles ───────────────────────────────────────────────────────────────

  const toggleAllergy = (val: string) =>
    setData((d) => {
      const arr = d.food_safety.allergies;
      if (val === "None")
        return { ...d, food_safety: { ...d.food_safety, allergies: ["None"] } };
      const next = arr.filter((x) => x !== "None");
      return {
        ...d,
        food_safety: {
          ...d.food_safety,
          allergies: next.includes(val)
            ? next.filter((x) => x !== val)
            : [...next, val],
        },
      };
    });

  const toggleSensitivity = (val: string) =>
    setData((d) => {
      const arr = d.food_safety.sensitivities;
      return {
        ...d,
        food_safety: {
          ...d.food_safety,
          sensitivities: arr.includes(val)
            ? arr.filter((x) => x !== val)
            : [...arr, val],
        },
      };
    });

  const toggleCuisine = (val: string) =>
    setData((d) => {
      const arr = d.preferences.favorite_cuisines;
      return {
        ...d,
        preferences: {
          ...d.preferences,
          favorite_cuisines: arr.includes(val)
            ? arr.filter((x) => x !== val)
            : [...arr, val],
        },
      };
    });

  // ── Save ──────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: UserProfile = {
        ...data,
        profile: { ...data.profile, bmi },
        onboarding: {
          completed: true,
          completed_at: new Date().toISOString(),
          steps_completed: [1, 2, 3, 4],
        },
      };
      const res = await fetch("/api/backend/user", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      toast.success("Profile saved! Let's find great food.");
      router.push("/");
    } catch {
      toast.error("Failed to save. Is the backend running?");
    } finally {
      setSaving(false);
    }
  };

  // ── Loading screen ────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-orange-400 animate-spin" />
      </div>
    );
  }

  const TOTAL_STEPS = 4;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen bg-gray-950 py-12 px-4">
      <div className="max-w-lg mx-auto flex flex-col gap-6">

        {/* ── Branding + Progress ────────────────────────────────────── */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-orange-500 flex items-center justify-center">
              <Utensils className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-bold text-xl">FoodGuard AI</span>
          </div>

          {step > 0 && (
            <div className="flex items-center gap-1.5 mt-3 max-w-xs mx-auto">
              {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex-1 h-1.5 rounded-full transition-all duration-300",
                    i < step ? "bg-orange-400" : "bg-gray-800"
                  )}
                />
              ))}
              <span className="text-gray-500 text-xs ml-1 w-8 text-right">
                {step}/{TOTAL_STEPS}
              </span>
            </div>
          )}
        </div>

        {/* ══ Step 0 — Profile Setup ══════════════════════════════════ */}
        {step === 0 && (
          <Card>
            <h1 className="text-2xl font-bold text-white mb-1">Your Profile</h1>
            <p className="text-gray-400 text-sm mb-5">
              We use this to personalize your food safety recommendations.
            </p>

            {/* Avatar + Name */}
            <div className="flex items-center gap-4 mb-5">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-2xl font-bold text-white shadow-lg flex-shrink-0">
                {data.profile.name
                  ? data.profile.name[0].toUpperCase()
                  : <User className="w-6 h-6" />}
              </div>
              <div className="flex-1">
                <p className="text-gray-500 text-xs uppercase tracking-wide font-medium mb-1">
                  Full Name
                </p>
                <input
                  value={data.profile.name}
                  onChange={(e) =>
                    setData((d) => ({
                      ...d,
                      profile: { ...d.profile, name: e.target.value },
                    }))
                  }
                  placeholder="Enter your name"
                  className="w-full bg-transparent text-white text-lg font-semibold placeholder-gray-600 border-b border-gray-700 focus:border-orange-400 outline-none pb-1 transition-colors"
                />
              </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Age">
                <TextInput
                  value={data.profile.age ? String(data.profile.age) : ""}
                  onChange={(v) =>
                    setData((d) => ({
                      ...d,
                      profile: { ...d.profile, age: parseInt(v) || 0 },
                    }))
                  }
                  placeholder="28"
                />
              </FormField>
              <FormField label="Height">
                <TextInput
                  value={data.profile.height}
                  onChange={(v) =>
                    setData((d) => ({ ...d, profile: { ...d.profile, height: v } }))
                  }
                  placeholder='5&apos;9"'
                />
              </FormField>
              <FormField label="Weight">
                <TextInput
                  value={data.profile.weight}
                  onChange={(v) =>
                    setData((d) => ({ ...d, profile: { ...d.profile, weight: v } }))
                  }
                  placeholder="165 lbs"
                />
              </FormField>
              <FormField label="BMI (auto)">
                <div className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-center">
                  {bmi !== null ? (
                    <span className="text-orange-400 font-bold">{bmi}</span>
                  ) : (
                    <span className="text-gray-600">—</span>
                  )}
                </div>
              </FormField>
            </div>

            <button
              onClick={() => setStep(1)}
              className="mt-5 w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-semibold rounded-xl py-3 transition"
            >
              Complete Your Profile <ChevronRight className="w-4 h-4" />
            </button>
          </Card>
        )}

        {/* ══ Step 1 — Quick Allergy Check ════════════════════════════ */}
        {step === 1 && (
          <Card>
            {/* Chat-style greeting bubble */}
            <div className="flex items-start gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Utensils className="w-4 h-4 text-white" />
              </div>
              <div className="bg-gray-800 rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-gray-200 leading-relaxed">
                Hi {data.profile.name || "there"}! I'll help you avoid unsafe foods,
                hidden allergens, and find better meals based on your preferences.
              </div>
            </div>

            <h2 className="text-white font-bold text-lg mb-1">
              Do you have any food allergies or dietary restrictions?
            </h2>
            <p className="text-gray-400 text-sm mb-4">Select all that apply</p>

            <div className="flex flex-wrap gap-2">
              {ALLERGY_OPTIONS.map((opt) => (
                <ToggleChip
                  key={opt}
                  selected={data.food_safety.allergies.includes(opt)}
                  onClick={() => toggleAllergy(opt)}
                >
                  {opt}
                </ToggleChip>
              ))}
            </div>

            <NavRow onBack={() => setStep(0)} onNext={() => setStep(2)} />
          </Card>
        )}

        {/* ══ Step 2 — Full Dietary Profile ═══════════════════════════ */}
        {step === 2 && (
          <Card>
            <h2 className="text-white font-bold text-lg mb-1">Your Dietary Profile</h2>
            <p className="text-gray-400 text-sm mb-5">
              Fine-tune your food safety preferences
            </p>

            <div className="flex flex-col gap-6">
              {/* Dietary type */}
              <div>
                <SectionLabel>Dietary Type</SectionLabel>
                <div className="flex flex-wrap gap-2 mt-2">
                  {DIETARY_OPTIONS.map(({ value, emoji }) => (
                    <ToggleChip
                      key={value}
                      selected={data.food_safety.dietary_type.includes(value)}
                      onClick={() =>
                        setData((d) => ({
                          ...d,
                          food_safety: { ...d.food_safety, dietary_type: [value] },
                        }))
                      }
                    >
                      {emoji} {value}
                    </ToggleChip>
                  ))}
                </div>
              </div>

              {/* Sensitivities */}
              <div>
                <SectionLabel>Additional Sensitivities</SectionLabel>
                <div className="flex flex-col gap-2 mt-2">
                  {SENSITIVITY_OPTIONS.map((opt) => {
                    const on = data.food_safety.sensitivities.includes(opt);
                    return (
                      <button
                        key={opt}
                        onClick={() => toggleSensitivity(opt)}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-xl border text-sm text-left transition",
                          on
                            ? "bg-orange-500/15 border-orange-400 text-white"
                            : "bg-gray-800/60 border-gray-700 text-gray-300 hover:border-gray-600"
                        )}
                      >
                        <div
                          className={cn(
                            "w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition",
                            on ? "bg-orange-500 border-orange-400" : "border-gray-600"
                          )}
                        >
                          {on && <Check className="w-2.5 h-2.5 text-white" />}
                        </div>
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <NavRow onBack={() => setStep(1)} onNext={() => setStep(3)} />
          </Card>
        )}

        {/* ══ Step 3 — Preferences ════════════════════════════════════ */}
        {step === 3 && (
          <Card>
            <h2 className="text-white font-bold text-lg mb-1">Your Food Preferences</h2>
            <p className="text-gray-400 text-sm mb-5">
              Help us find restaurants and dishes you'll love
            </p>

            <div className="flex flex-col gap-6">
              {/* Cuisines */}
              <div>
                <SectionLabel>Favorite Cuisines</SectionLabel>
                <div className="flex flex-wrap gap-2 mt-2">
                  {CUISINE_OPTIONS.map(({ name, emoji }) => (
                    <ToggleChip
                      key={name}
                      selected={data.preferences.favorite_cuisines.includes(name)}
                      onClick={() => toggleCuisine(name)}
                    >
                      {emoji} {name}
                    </ToggleChip>
                  ))}
                </div>
              </div>

              {/* Spice level */}
              <div>
                <SectionLabel>Spice Level</SectionLabel>
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {SPICE_LEVELS.map(({ label, icon }) => (
                    <button
                      key={label}
                      onClick={() =>
                        setData((d) => ({
                          ...d,
                          preferences: {
                            ...d.preferences,
                            spice_level: label as UserProfile["preferences"]["spice_level"],
                          },
                        }))
                      }
                      className={cn(
                        "flex flex-col items-center gap-1 py-3 rounded-xl border text-xs font-medium transition",
                        data.preferences.spice_level === label
                          ? "bg-orange-500/20 border-orange-400 text-white"
                          : "bg-gray-800 border-gray-700 text-gray-400 hover:border-orange-700"
                      )}
                    >
                      <span className="text-xl">{icon}</span>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price range */}
              <div>
                <SectionLabel>Price Range</SectionLabel>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {PRICE_RANGES.map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() =>
                        setData((d) => ({
                          ...d,
                          preferences: {
                            ...d.preferences,
                            price_range: value as UserProfile["preferences"]["price_range"],
                          },
                        }))
                      }
                      className={cn(
                        "flex flex-col items-center gap-0.5 py-3 rounded-xl border text-sm font-medium transition",
                        data.preferences.price_range === value
                          ? "bg-orange-500/20 border-orange-400 text-white"
                          : "bg-gray-800 border-gray-700 text-gray-400 hover:border-orange-700"
                      )}
                    >
                      <span className="text-base font-bold">{value}</span>
                      <span className="text-xs text-gray-500">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Eating goal */}
              <div>
                <SectionLabel>Eating Goal</SectionLabel>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {EATING_GOALS.map(({ value, label, emoji, desc }) => (
                    <button
                      key={value}
                      onClick={() =>
                        setData((d) => ({
                          ...d,
                          preferences: {
                            ...d.preferences,
                            eating_goal: value as UserProfile["preferences"]["eating_goal"],
                          },
                        }))
                      }
                      className={cn(
                        "flex items-start gap-3 p-3 rounded-xl border text-left transition",
                        data.preferences.eating_goal === value
                          ? "bg-orange-500/20 border-orange-400"
                          : "bg-gray-800 border-gray-700 hover:border-orange-700"
                      )}
                    >
                      <span className="text-2xl">{emoji}</span>
                      <div>
                        <div className="text-white text-sm font-semibold">{label}</div>
                        <div className="text-gray-500 text-xs mt-0.5">{desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <NavRow onBack={() => setStep(2)} onNext={() => setStep(4)} />
          </Card>
        )}

        {/* ══ Step 4 — Decision Priority ══════════════════════════════ */}
        {step === 4 && (
          <Card>
            <h2 className="text-white font-bold text-lg mb-1">
              What matters most when choosing food?
            </h2>
            <p className="text-gray-400 text-sm mb-5">
              This helps the AI prioritize its recommendations for you.
            </p>

            <div className="flex flex-col gap-2">
              {DECISION_FACTORS.map(({ value, label, emoji, desc }) => {
                const selected = data.priority.decision_factor === value;
                return (
                  <button
                    key={value}
                    onClick={() =>
                      setData((d) => ({
                        ...d,
                        priority: {
                          decision_factor:
                            value as UserProfile["priority"]["decision_factor"],
                        },
                      }))
                    }
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-xl border text-left transition",
                      selected
                        ? "bg-orange-500/20 border-orange-400"
                        : "bg-gray-800/60 border-gray-700 hover:border-orange-700"
                    )}
                  >
                    <span className="text-2xl w-8 text-center">{emoji}</span>
                    <div className="flex-1">
                      <div className="text-white font-semibold text-sm">{label}</div>
                      <div className="text-gray-400 text-xs mt-0.5">{desc}</div>
                    </div>
                    <div
                      className={cn(
                        "w-5 h-5 rounded-full border flex-shrink-0 flex items-center justify-center transition",
                        selected
                          ? "bg-orange-500 border-orange-400"
                          : "border-gray-600"
                      )}
                    >
                      {selected && <Check className="w-3 h-3 text-white" />}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setStep(3)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-700 bg-gray-800 text-gray-300 text-sm font-medium hover:border-gray-600 transition"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !data.priority.decision_factor}
                className="flex-1 flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-400 disabled:opacity-40 text-white font-semibold rounded-xl py-2.5 text-sm transition"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <><Check className="w-4 h-4" /> Save My Profile</>
                )}
              </button>
            </div>
          </Card>
        )}

      </div>
    </main>
  );
}

// ─── Shared sub-components ───────────────────────────────────────────────────

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 flex flex-col">
      {children}
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-gray-500 font-medium">{label}</label>
      {children}
    </div>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white placeholder-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition"
    />
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">
      {children}
    </p>
  );
}

function ToggleChip({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-3 py-1.5 rounded-lg text-sm font-medium border transition",
        selected
          ? "bg-orange-500 border-orange-400 text-white"
          : "bg-gray-800 border-gray-700 text-gray-300 hover:border-orange-700"
      )}
    >
      {children}
    </button>
  );
}

function NavRow({ onBack, onNext }: { onBack: () => void; onNext: () => void }) {
  return (
    <div className="flex gap-3 mt-5">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-700 bg-gray-800 text-gray-300 text-sm font-medium hover:border-gray-600 transition"
      >
        <ChevronLeft className="w-4 h-4" /> Back
      </button>
      <button
        onClick={onNext}
        className="flex-1 flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-semibold rounded-xl py-2.5 text-sm transition"
      >
        Continue <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
