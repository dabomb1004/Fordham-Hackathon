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

// ─── Brand tokens (from style.json) ─────────────────────────────────────────
// espresso   #3D2C1E  — nav, headers, dark text
// amber_spice #C17B3A — primary buttons, CTA
// cream      #FBF7F0  — page background
// warm_sand  #F5EFE6  — card / tag background
// linen      #EAE2D6  — borders, dividers

// ─── Constants ───────────────────────────────────────────────────────────────

const ALLERGY_OPTIONS = [
  "None", "Nuts", "Dairy", "Gluten", "Seafood",
  "Shellfish", "Soy", "Eggs", "Wheat",
];

const DIETARY_OPTIONS = [
  { value: "None",       emoji: "🍽️" },
  { value: "Vegan",      emoji: "🌱" },
  { value: "Vegetarian", emoji: "🥦" },
  { value: "Halal",      emoji: "☪️"  },
  { value: "Kosher",     emoji: "✡️"  },
  { value: "Paleo",      emoji: "🥩" },
  { value: "Keto",       emoji: "🧀" },
];

const MEDICAL_CONDITIONS = [
  "Lactose Intolerance",
  "Gluten Sensitivity",
  "Celiac Disease",
  "IBS",
  "Diabetes",
];

const DIETARY_NEEDS = [
  "Low Sodium",
  "Low Sugar",
  "Low Fat",
  "Low Carb",
  "High Protein",
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
  { label: "Mild",      icon: "😌" },
  { label: "Medium",    icon: "🌶️" },
  { label: "Hot",       icon: "🔥" },
  { label: "Extra Hot", icon: "💀" },
];

const PRICE_RANGES = [
  { value: "$",   label: "Budget"   },
  { value: "$$",  label: "Moderate" },
  { value: "$$$", label: "Premium"  },
];

const EATING_GOALS = [
  { value: "healthy",      label: "Healthy",     emoji: "🥗", desc: "Balanced nutrition"  },
  { value: "comfort",      label: "Comfort Food", emoji: "🍔", desc: "Feel-good meals"     },
  { value: "high_protein", label: "High Protein", emoji: "💪", desc: "Fuel for fitness"    },
  { value: "weight_loss",  label: "Weight Loss",  emoji: "⚖️", desc: "Calorie conscious"   },
];

const DECISION_FACTORS = [
  { value: "safety",      label: "Safety",        emoji: "🛡️", desc: "Flag health risks & recalls first"        },
  { value: "health",      label: "Health",        emoji: "💚", desc: "Ingredients & nutrition matter most"       },
  { value: "ethics",      label: "Ethics",        emoji: "⚖️", desc: "Labor practices & sustainability"          },
  { value: "quality",     label: "Quality",       emoji: "⭐", desc: "Brand credibility & certifications"        },
  { value: "price",       label: "Price",         emoji: "💰", desc: "Value for money"                           },
];

// ─── BMI helper ──────────────────────────────────────────────────────────────

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
  priority: { decision_factor: [] as string[] },
  onboarding: { completed: false, completed_at: null, steps_completed: [] },
};

// ─── Page ────────────────────────────────────────────────────────────────────

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep]       = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [data, setData]       = useState<UserProfile>(DEFAULT_PROFILE);

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
          food_safety: u.food_safety ?? prev.food_safety,
          preferences: u.preferences ?? prev.preferences,
          priority:    u.priority    ?? prev.priority,
          onboarding:  u.onboarding  ?? prev.onboarding,
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
          allergies: next.includes(val) ? next.filter((x) => x !== val) : [...next, val],
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
          sensitivities: arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val],
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
          favorite_cuisines: arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val],
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
      router.push("/home");
    } catch {
      toast.error("Failed to save. Is the backend running?");
    } finally {
      setSaving(false);
    }
  };

  // ── Loading ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#FBF7F0" }}>
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: "#C17B3A" }} />
      </div>
    );
  }

  const TOTAL_STEPS = 4;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen py-12 px-4" style={{ background: "#FBF7F0" }}>
      <div className="max-w-lg mx-auto flex flex-col gap-6">

        {/* ── Branding + Progress ──────────────────────────────────── */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "#3D2C1E" }}>
              <Utensils className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-xl" style={{ color: "#3D2C1E" }}>Guardia</span>
          </div>

          {step > 0 && (
            <div className="flex items-center gap-1.5 mt-3 max-w-xs mx-auto">
              {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                <div
                  key={i}
                  className="flex-1 h-1.5 rounded-full transition-all duration-300"
                  style={{ background: i < step ? "#C17B3A" : "#EAE2D6" }}
                />
              ))}
              <span className="text-xs ml-1 w-8 text-right" style={{ color: "#B5A497" }}>
                {step}/{TOTAL_STEPS}
              </span>
            </div>
          )}
        </div>

        {/* ══ Step 0 — Profile Setup ══════════════════════════════════ */}
        {step === 0 && (
          <Card>
            <h1 className="text-2xl font-bold mb-1" style={{ color: "#3D2C1E" }}>Your Profile</h1>
            <p className="text-sm mb-5" style={{ color: "#8C7466" }}>
              We use this to personalize your food safety recommendations.
            </p>

            {/* Avatar + Name */}
            <div className="flex items-center gap-4 mb-5">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-bold text-white shadow-md flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #C17B3A, #3D2C1E)" }}
              >
                {data.profile.name
                  ? data.profile.name[0].toUpperCase()
                  : <User className="w-6 h-6" />}
              </div>
              <div className="flex-1">
                <p className="text-xs uppercase tracking-wide font-semibold mb-1" style={{ color: "#B5A497" }}>
                  Full Name
                </p>
                <input
                  value={data.profile.name}
                  onChange={(e) =>
                    setData((d) => ({ ...d, profile: { ...d.profile, name: e.target.value } }))
                  }
                  placeholder="Enter your name"
                  className="w-full bg-transparent text-lg font-semibold outline-none pb-1 transition-colors"
                  style={{
                    color: "#3D2C1E",
                    borderBottom: "2px solid #EAE2D6",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderBottomColor = "#C17B3A")}
                  onBlur={(e) => (e.currentTarget.style.borderBottomColor = "#EAE2D6")}
                />
              </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Age">
                <StyledInput
                  value={data.profile.age ? String(data.profile.age) : ""}
                  onChange={(v) => setData((d) => ({ ...d, profile: { ...d.profile, age: parseInt(v) || 0 } }))}
                  placeholder="28"
                />
              </FormField>
              <FormField label="Height (cm)">
                <StyledInput
                  value={data.profile.height}
                  onChange={(v) => setData((d) => ({ ...d, profile: { ...d.profile, height: v } }))}
                  placeholder="175"
                />
              </FormField>
              <FormField label="Weight (kg)">
                <StyledInput
                  value={data.profile.weight}
                  onChange={(v) => setData((d) => ({ ...d, profile: { ...d.profile, weight: v } }))}
                  placeholder="70"
                />
              </FormField>
              <FormField label="BMI (auto)">
                <div
                  className="rounded-lg px-4 py-2.5 text-sm text-center font-semibold"
                  style={{ background: "#F5EFE6", border: "1px solid #EAE2D6", color: bmi ? "#C17B3A" : "#B5A497" }}
                >
                  {bmi ?? "—"}
                </div>
              </FormField>
            </div>

            <CtaButton onClick={() => setStep(1)} className="mt-5">
              Complete Your Profile <ChevronRight className="w-4 h-4" />
            </CtaButton>
          </Card>
        )}

        {/* ══ Step 1 — Quick Allergy Check ════════════════════════════ */}
        {step === 1 && (
          <Card>
            {/* Chat bubble */}
            <div className="flex items-start gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: "#3D2C1E" }}>
                <Utensils className="w-4 h-4 text-white" />
              </div>
              <div className="rounded-2xl rounded-tl-sm px-4 py-3 text-sm leading-relaxed" style={{ background: "#F5EFE6", color: "#3D2C1E" }}>
                Hi {data.profile.name || "there"}! I&apos;ll cross-reference any product or brand against credible sources — flagging health risks, recalls, harmful ingredients, or ethical concerns based on your profile.
              </div>
            </div>

            <h2 className="text-lg font-bold mb-1" style={{ color: "#3D2C1E" }}>
              Do you have any known allergies?
            </h2>
            <p className="text-sm mb-4" style={{ color: "#8C7466" }}>Guardia will flag these in any product it checks — food, medications, cosmetics, and more</p>

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
            <h2 className="text-lg font-bold mb-1" style={{ color: "#3D2C1E" }}>Your Health Profile</h2>
            <p className="text-sm mb-5" style={{ color: "#8C7466" }}>Guardia uses this to flag risks across food, medications, supplements, and personal care products</p>

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

              {/* Medical Conditions */}
              <div>
                <SectionLabel>Medical Conditions</SectionLabel>
                <p className="text-xs mt-1 mb-2" style={{ color: "#A89080" }}>Select conditions you have been diagnosed with</p>
                <div className="flex flex-col gap-2">
                  {MEDICAL_CONDITIONS.map((opt) => {
                    const on = data.food_safety.sensitivities.includes(opt);
                    return (
                      <button
                        key={opt}
                        onClick={() => toggleSensitivity(opt)}
                        className="flex items-center gap-3 p-3 rounded-xl text-sm text-left transition-all"
                        style={{
                          background: on ? "#FEF6E4" : "#F5EFE6",
                          border: `1px solid ${on ? "#C17B3A" : "#EAE2D6"}`,
                          color: on ? "#925F0A" : "#3D2C1E",
                        }}
                      >
                        <div
                          className="w-4 h-4 rounded flex-shrink-0 flex items-center justify-center transition-all"
                          style={{
                            background: on ? "#C17B3A" : "transparent",
                            border: `1.5px solid ${on ? "#C17B3A" : "#B5A497"}`,
                          }}
                        >
                          {on && <Check className="w-2.5 h-2.5 text-white" />}
                        </div>
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dietary Needs */}
              <div>
                <SectionLabel>Dietary Needs</SectionLabel>
                <p className="text-xs mt-1 mb-2" style={{ color: "#A89080" }}>Select doctor-recommended or personal dietary restrictions</p>
                <div className="flex flex-col gap-2">
                  {DIETARY_NEEDS.map((opt) => {
                    const on = data.food_safety.sensitivities.includes(opt);
                    return (
                      <button
                        key={opt}
                        onClick={() => toggleSensitivity(opt)}
                        className="flex items-center gap-3 p-3 rounded-xl text-sm text-left transition-all"
                        style={{
                          background: on ? "#F5EFE6" : "#F5EFE6",
                          border: `1px solid ${on ? "#C17B3A" : "#EAE2D6"}`,
                          color: on ? "#3D2C1E" : "#3D2C1E",
                        }}
                      >
                        <div
                          className="w-4 h-4 rounded flex-shrink-0 flex items-center justify-center transition-all"
                          style={{
                            background: on ? "#C17B3A" : "transparent",
                            border: `1.5px solid ${on ? "#C17B3A" : "#B5A497"}`,
                          }}
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
            <h2 className="text-lg font-bold mb-1" style={{ color: "#3D2C1E" }}>Your Food Preferences</h2>
            <p className="text-sm mb-5" style={{ color: "#8C7466" }}>Help us find restaurants and dishes you'll love</p>

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
                  {SPICE_LEVELS.map(({ label, icon }) => {
                    const on = data.preferences.spice_level === label;
                    return (
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
                        className="flex flex-col items-center gap-1 py-3 rounded-xl text-xs font-medium transition-all"
                        style={{
                          background: on ? "#FEF6E4" : "#F5EFE6",
                          border: `1px solid ${on ? "#C17B3A" : "#EAE2D6"}`,
                          color: on ? "#925F0A" : "#8C7466",
                        }}
                      >
                        <span className="text-xl">{icon}</span>
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Price range */}
              <div>
                <SectionLabel>Price Range</SectionLabel>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {PRICE_RANGES.map(({ value, label }) => {
                    const on = data.preferences.price_range === value;
                    return (
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
                        className="flex flex-col items-center gap-0.5 py-3 rounded-xl text-sm font-medium transition-all"
                        style={{
                          background: on ? "#FEF6E4" : "#F5EFE6",
                          border: `1px solid ${on ? "#C17B3A" : "#EAE2D6"}`,
                          color: on ? "#925F0A" : "#3D2C1E",
                        }}
                      >
                        <span className="text-base font-bold">{value}</span>
                        <span className="text-xs" style={{ color: on ? "#C17B3A" : "#8C7466" }}>{label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Eating goal */}
              <div>
                <SectionLabel>Eating Goal</SectionLabel>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {EATING_GOALS.map(({ value, label, emoji, desc }) => {
                    const on = data.preferences.eating_goal === value;
                    return (
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
                        className="flex items-start gap-3 p-3 rounded-xl text-left transition-all"
                        style={{
                          background: on ? "#FEF6E4" : "#F5EFE6",
                          border: `1px solid ${on ? "#C17B3A" : "#EAE2D6"}`,
                        }}
                      >
                        <span className="text-2xl">{emoji}</span>
                        <div>
                          <div className="text-sm font-semibold" style={{ color: on ? "#925F0A" : "#3D2C1E" }}>{label}</div>
                          <div className="text-xs mt-0.5" style={{ color: "#8C7466" }}>{desc}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <NavRow onBack={() => setStep(2)} onNext={() => setStep(4)} />
          </Card>
        )}

        {/* ══ Step 4 — Decision Priority ══════════════════════════════ */}
        {step === 4 && (
          <Card>
            <h2 className="text-lg font-bold mb-1" style={{ color: "#3D2C1E" }}>
              What matters most when verifying a product?
            </h2>
            <p className="text-sm mb-5" style={{ color: "#8C7466" }}>
              Guardia will lead with what you care about most.
            </p>

            <p className="text-xs mb-3" style={{ color: "#A89080" }}>Select all that apply</p>
            <div className="flex flex-col gap-2">
              {DECISION_FACTORS.map(({ value, label, emoji, desc }) => {
                const factors = Array.isArray(data.priority.decision_factor)
                  ? data.priority.decision_factor
                  : data.priority.decision_factor ? [data.priority.decision_factor] : [];
                const on = factors.includes(value);
                return (
                  <button
                    key={value}
                    onClick={() =>
                      setData((d) => {
                        const arr = Array.isArray(d.priority.decision_factor)
                          ? d.priority.decision_factor
                          : d.priority.decision_factor ? [d.priority.decision_factor] : [];
                        const next = arr.includes(value)
                          ? arr.filter((x) => x !== value)
                          : [...arr, value];
                        return { ...d, priority: { decision_factor: next } };
                      })
                    }
                    className="flex items-center gap-4 p-4 rounded-xl text-left transition-all"
                    style={{
                      background: on ? "#FEF6E4" : "#F5EFE6",
                      border: `1px solid ${on ? "#C17B3A" : "#EAE2D6"}`,
                    }}
                  >
                    <span className="text-2xl w-8 text-center">{emoji}</span>
                    <div className="flex-1">
                      <div className="font-semibold text-sm" style={{ color: on ? "#925F0A" : "#3D2C1E" }}>{label}</div>
                      <div className="text-xs mt-0.5" style={{ color: "#8C7466" }}>{desc}</div>
                    </div>
                    <div
                      className="w-5 h-5 rounded flex-shrink-0 flex items-center justify-center transition-all"
                      style={{
                        background: on ? "#C17B3A" : "transparent",
                        border: `2px solid ${on ? "#C17B3A" : "#B5A497"}`,
                      }}
                    >
                      {on && <Check className="w-3 h-3 text-white" />}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex gap-3 mt-5">
              <BackButton onClick={() => setStep(3)} />
              <button
                onClick={handleSave}
                disabled={saving || !(Array.isArray(data.priority.decision_factor) ? data.priority.decision_factor.length > 0 : !!data.priority.decision_factor)}
                className="flex-1 flex items-center justify-center gap-2 font-semibold rounded-xl py-2.5 text-sm transition-all disabled:opacity-40"
                style={{ background: "#C17B3A", color: "white" }}
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
    <div
      className="rounded-2xl p-6 flex flex-col shadow-sm"
      style={{ background: "white", border: "1px solid #EAE2D6" }}
    >
      {children}
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#B5A497" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function StyledInput({
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
      className="rounded-lg px-3 py-2.5 text-sm outline-none transition-all"
      style={{
        background: "#F5EFE6",
        border: "1px solid #EAE2D6",
        color: "#3D2C1E",
      }}
      onFocus={(e) => (e.currentTarget.style.borderColor = "#C17B3A")}
      onBlur={(e) => (e.currentTarget.style.borderColor = "#EAE2D6")}
    />
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#B5A497" }}>
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
      className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
      style={{
        background: selected ? "#C17B3A" : "#F5EFE6",
        border: `1px solid ${selected ? "#C17B3A" : "#EAE2D6"}`,
        color: selected ? "white" : "#3D2C1E",
      }}
    >
      {children}
    </button>
  );
}

function CtaButton({
  onClick,
  children,
  className = "",
}: {
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn("w-full flex items-center justify-center gap-2 font-semibold rounded-xl py-3 text-sm transition-all", className)}
      style={{ background: "#C17B3A", color: "white" }}
    >
      {children}
    </button>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
      style={{ background: "#F5EFE6", border: "1px solid #EAE2D6", color: "#3D2C1E" }}
    >
      <ChevronLeft className="w-4 h-4" /> Back
    </button>
  );
}

function NavRow({ onBack, onNext }: { onBack: () => void; onNext: () => void }) {
  return (
    <div className="flex gap-3 mt-5">
      <BackButton onClick={onBack} />
      <button
        onClick={onNext}
        className="flex-1 flex items-center justify-center gap-2 font-semibold rounded-xl py-2.5 text-sm transition-all"
        style={{ background: "#C17B3A", color: "white" }}
      >
        Continue <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
