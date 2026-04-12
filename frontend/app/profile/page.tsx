"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { CheckCircle2, AlertTriangle, ShieldAlert, Pencil, X, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface UserData {
  id?: string;
  profile?: { name?: string; age?: number; height?: string; weight?: string; bmi?: number };
  food_safety?: { allergies?: string[]; dietary_type?: string[]; sensitivities?: string[] };
  preferences?: { favorite_cuisines?: string[]; spice_level?: string; price_range?: string; eating_goal?: string };
  priority?: { decision_factor?: string | string[] };
  onboarding?: { completed?: boolean; completed_at?: string | null; steps_completed?: number[] };
}

const ALLERGY_OPTIONS = ["Nuts", "Dairy", "Gluten", "Seafood", "Shellfish", "Soy", "Eggs", "Wheat"];
const DIETARY_OPTIONS = ["None", "Vegan", "Vegetarian", "Halal", "Kosher", "Paleo", "Keto"];
const MEDICAL_CONDITIONS = ["Lactose Intolerance", "Gluten Sensitivity", "Celiac Disease", "IBS", "Diabetes"];
const DIETARY_NEEDS = ["Low Sodium", "Low Sugar", "Low Fat", "Low Carb", "High Protein"];
const CUISINE_OPTIONS = ["Chinese", "Italian", "Japanese", "Mexican", "Indian", "Thai", "Mediterranean", "American", "Korean", "French", "Greek", "Vietnamese"];
const SPICE_LEVELS = ["Mild", "Medium", "Hot", "Extra Hot"];
const PRICE_RANGES = ["$", "$$", "$$$"];
const EATING_GOALS = [
  { value: "healthy", label: "Healthy" },
  { value: "comfort", label: "Comfort Food" },
  { value: "high_protein", label: "High Protein" },
  { value: "weight_loss", label: "Weight Loss" },
];
const DECISION_FACTORS = ["taste", "health", "price", "convenience", "safety"];

const MOCK_HISTORY = [
  { product: "Tylenol Extra Strength", brand: "Johnson & Johnson", date: "Today",     result: "Safe" },
  { product: "Lay's Classic Chips",    brand: "PepsiCo",           date: "Yesterday", result: "Caution" },
  { product: "Kirkland Fish Oil",      brand: "Costco",            date: "Apr 10",    result: "Danger" },
  { product: "Oatly Oat Milk",         brand: "Oatly",             date: "Apr 9",     result: "Safe" },
  { product: "Advil Liqui-Gels",       brand: "Haleon",            date: "Apr 8",     result: "Caution" },
];

const resultStyle: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
  Safe:    { bg: "#EAF5EE", text: "#2A7A4A", icon: <CheckCircle2 className="w-3 h-3" /> },
  Caution: { bg: "#FEF6E4", text: "#925F0A", icon: <AlertTriangle className="w-3 h-3" /> },
  Danger:  { bg: "#FDEDED", text: "#B83232", icon: <ShieldAlert className="w-3 h-3" /> },
};

const totalChecks = MOCK_HISTORY.length;
const dangersCaught = MOCK_HISTORY.filter((h) => h.result === "Danger").length;
const safeMeals = MOCK_HISTORY.filter((h) => h.result === "Safe").length;

function Chip({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 rounded-lg text-sm font-medium border transition"
      style={{
        background: selected ? "#C17B3A" : "#F5EFE6",
        color: selected ? "#fff" : "#3D2C1E",
        borderColor: selected ? "#C17B3A" : "#EAE2D6",
      }}
    >
      {children}
    </button>
  );
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserData>({});
  const [draft, setDraft] = useState<UserData>({});
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/backend/user")
      .then((r) => r.json())
      .then((u) => { setUser(u); setDraft(u); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const startEdit = () => { setDraft(JSON.parse(JSON.stringify(user))); setEditing(true); };
  const cancelEdit = () => setEditing(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/backend/user", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      if (!res.ok) throw new Error();
      setUser(draft);
      setEditing(false);
      toast.success("Profile updated!");
    } catch {
      toast.error("Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  // Draft helpers
  const setProfile = (key: string, val: string | number) =>
    setDraft((d) => ({ ...d, profile: { ...d.profile, [key]: val } }));

  const toggleAllergy = (val: string) =>
    setDraft((d) => {
      const arr = d.food_safety?.allergies ?? [];
      const next = arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];
      return { ...d, food_safety: { ...d.food_safety, allergies: next } };
    });

  const toggleSensitivity = (val: string) =>
    setDraft((d) => {
      const arr = d.food_safety?.sensitivities ?? [];
      const next = arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];
      return { ...d, food_safety: { ...d.food_safety, sensitivities: next } };
    });

  const toggleCuisine = (val: string) =>
    setDraft((d) => {
      const arr = d.preferences?.favorite_cuisines ?? [];
      const next = arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];
      return { ...d, preferences: { ...d.preferences, favorite_cuisines: next } };
    });

  const src = editing ? draft : user;
  const name = src.profile?.name || "User";
  const initials = name.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);
  const allergies = src.food_safety?.allergies?.filter((a) => a !== "None") ?? [];
  const sensitivities = src.food_safety?.sensitivities ?? [];
  const dietaryType = src.food_safety?.dietary_type?.filter((d) => d !== "None") ?? [];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#FBF7F0" }}>
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-10">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: "#C17B3A", borderTopColor: "transparent" }} />
          </div>
        ) : (
          <>
            {/* Edit / Save bar */}
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold" style={{ color: "#3D2C1E" }}>My Profile</h1>
              {editing ? (
                <div className="flex gap-2">
                  <button
                    onClick={cancelEdit}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl border text-sm font-medium transition"
                    style={{ borderColor: "#EAE2D6", color: "#6B5744", background: "#F5EFE6" }}
                  >
                    <X className="w-3.5 h-3.5" /> Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white transition disabled:opacity-50"
                    style={{ background: "#C17B3A" }}
                  >
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    Save Changes
                  </button>
                </div>
              ) : (
                <button
                  onClick={startEdit}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl border text-sm font-medium transition"
                  style={{ borderColor: "#EAE2D6", color: "#3D2C1E", background: "#F5EFE6" }}
                >
                  <Pencil className="w-3.5 h-3.5" /> Edit Profile
                </button>
              )}
            </div>

            <div className="flex flex-col md:flex-row gap-6">

              {/* ── Left sidebar ── */}
              <div className="flex flex-col gap-4 md:w-64 shrink-0">
                <div className="rounded-2xl p-6 flex flex-col gap-4" style={{ background: "#3D2C1E" }}>
                  <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold" style={{ background: "#C17B3A", color: "#FBF7F0" }}>
                    {initials}
                  </div>

                  {editing ? (
                    <input
                      value={draft.profile?.name ?? ""}
                      onChange={(e) => setProfile("name", e.target.value)}
                      className="bg-transparent border-b text-white font-bold text-lg focus:outline-none pb-1"
                      style={{ borderColor: "#5C4033" }}
                      placeholder="Your name"
                    />
                  ) : (
                    <div>
                      <p className="text-white font-bold text-lg leading-tight">{name}</p>
                      <p className="text-sm mt-0.5" style={{ color: "#A89080" }}>
                        {allergies.length} restrictions · {totalChecks} total checks
                      </p>
                    </div>
                  )}

                  {/* Health Info */}
                  <div className="border-t pt-4" style={{ borderColor: "#5C4033" }}>
                    <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "#A89080" }}>Health Info</p>
                    <div className="flex flex-col gap-2.5">
                      {[
                        { label: "Height", key: "height", placeholder: "175 cm" },
                        { label: "Weight", key: "weight", placeholder: "75 kg" },
                        { label: "Age",    key: "age",    placeholder: "28" },
                      ].map(({ label, key, placeholder }) => (
                        <div key={key} className="flex justify-between items-center text-sm">
                          <span style={{ color: "#A89080" }}>{label}</span>
                          {editing ? (
                            <input
                              value={String((draft.profile as Record<string, string | number | null | undefined>)?.[key] ?? "")}
                              onChange={(e) => setProfile(key, key === "age" ? parseInt(e.target.value) || 0 : e.target.value)}
                              className="bg-transparent border-b text-white text-right w-24 focus:outline-none text-sm"
                              style={{ borderColor: "#5C4033" }}
                              placeholder={placeholder}
                            />
                          ) : (
                            <span className="font-medium text-white">
                              {(src.profile as Record<string, string | number | null | undefined>)?.[key] || "—"}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Activity */}
                  <div className="border-t pt-4" style={{ borderColor: "#5C4033" }}>
                    <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "#A89080" }}>Activity</p>
                    <div className="flex flex-col gap-2 text-sm">
                      <div className="flex justify-between"><span style={{ color: "#A89080" }}>Total checks</span><span className="font-medium text-white">{totalChecks}</span></div>
                      <div className="flex justify-between"><span style={{ color: "#A89080" }}>Risks caught</span><span className="font-bold" style={{ color: "#B83232" }}>{dangersCaught}</span></div>
                      <div className="flex justify-between"><span style={{ color: "#A89080" }}>Safe products</span><span className="font-bold" style={{ color: "#2A7A4A" }}>{safeMeals}</span></div>
                    </div>
                  </div>
                </div>

                {/* Preferences card */}
                <div className="rounded-2xl p-5 flex flex-col gap-3" style={{ background: "#F5EFE6", border: "1px solid #EAE2D6" }}>
                  <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#A89080" }}>Preferences</p>
                  {editing ? (
                    <div className="flex flex-col gap-3">
                      <div>
                        <p className="text-xs mb-1.5" style={{ color: "#6B5744" }}>Spice Level</p>
                        <div className="flex flex-wrap gap-1.5">
                          {SPICE_LEVELS.map((s) => (
                            <Chip key={s} selected={draft.preferences?.spice_level === s} onClick={() => setDraft((d) => ({ ...d, preferences: { ...d.preferences, spice_level: s } }))}>
                              {s}
                            </Chip>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs mb-1.5" style={{ color: "#6B5744" }}>Price Range</p>
                        <div className="flex gap-1.5">
                          {PRICE_RANGES.map((p) => (
                            <Chip key={p} selected={draft.preferences?.price_range === p} onClick={() => setDraft((d) => ({ ...d, preferences: { ...d.preferences, price_range: p } }))}>
                              {p}
                            </Chip>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs mb-1.5" style={{ color: "#6B5744" }}>Eating Goal</p>
                        <div className="flex flex-wrap gap-1.5">
                          {EATING_GOALS.map(({ value, label }) => (
                            <Chip key={value} selected={draft.preferences?.eating_goal === value} onClick={() => setDraft((d) => ({ ...d, preferences: { ...d.preferences, eating_goal: value } }))}>
                              {label}
                            </Chip>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs mb-1.5" style={{ color: "#6B5744" }}>Priority</p>
                        <div className="flex flex-wrap gap-1.5">
                          {DECISION_FACTORS.map((f) => {
                            const factors = Array.isArray(draft.priority?.decision_factor)
                              ? draft.priority!.decision_factor as string[]
                              : draft.priority?.decision_factor ? [draft.priority.decision_factor as string] : [];
                            return (
                            <Chip key={f} selected={factors.includes(f)} onClick={() => setDraft((d) => {
                              const arr = Array.isArray(d.priority?.decision_factor)
                                ? d.priority!.decision_factor as string[]
                                : d.priority?.decision_factor ? [d.priority.decision_factor as string] : [];
                              const next = arr.includes(f) ? arr.filter((x) => x !== f) : [...arr, f];
                              return { ...d, priority: { decision_factor: next } };
                            })}>
                              {f}
                            </Chip>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1.5 text-sm">
                      {[
                        { label: "Spice",    value: src.preferences?.spice_level },
                        { label: "Budget",   value: src.preferences?.price_range },
                        { label: "Goal",     value: src.preferences?.eating_goal?.replace("_", " ") },
                        { label: "Priority", value: Array.isArray(src.priority?.decision_factor) ? (src.priority!.decision_factor as string[]).join(", ") : src.priority?.decision_factor as string | undefined },
                      ].map(({ label, value }) => (
                        <div key={label} className="flex justify-between">
                          <span style={{ color: "#6B5744" }}>{label}</span>
                          <span className="font-medium capitalize" style={{ color: "#3D2C1E" }}>{value || "—"}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* ── Right panel ── */}
              <div className="flex-1 flex flex-col gap-6">

                {/* Restrictions */}
                <div className="rounded-2xl p-6" style={{ background: "#fff", border: "1px solid #EAE2D6" }}>
                  <h2 className="font-bold text-lg mb-4" style={{ color: "#3D2C1E" }}>My Restrictions</h2>

                  {editing ? (
                    <div className="flex flex-col gap-5">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "#A89080" }}>Allergies</p>
                        <div className="flex flex-wrap gap-2">
                          {ALLERGY_OPTIONS.map((a) => (
                            <Chip key={a} selected={(draft.food_safety?.allergies ?? []).includes(a)} onClick={() => toggleAllergy(a)}>{a}</Chip>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "#A89080" }}>Dietary Type</p>
                        <div className="flex flex-wrap gap-2">
                          {DIETARY_OPTIONS.map((d) => (
                            <Chip key={d} selected={(draft.food_safety?.dietary_type ?? []).includes(d)} onClick={() => setDraft((prev) => ({ ...prev, food_safety: { ...prev.food_safety, dietary_type: [d] } }))}>{d}</Chip>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "#A89080" }}>Medical Conditions</p>
                        <p className="text-xs mb-2" style={{ color: "#A89080" }}>Select conditions you have been diagnosed with</p>
                        <div className="flex flex-wrap gap-2">
                          {MEDICAL_CONDITIONS.map((s) => (
                            <Chip key={s} selected={(draft.food_safety?.sensitivities ?? []).includes(s)} onClick={() => toggleSensitivity(s)}>{s}</Chip>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "#A89080" }}>Dietary Needs</p>
                        <p className="text-xs mb-2" style={{ color: "#A89080" }}>Select dietary preferences or doctor-recommended restrictions</p>
                        <div className="flex flex-wrap gap-2">
                          {DIETARY_NEEDS.map((s) => (
                            <Chip key={s} selected={(draft.food_safety?.sensitivities ?? []).includes(s)} onClick={() => toggleSensitivity(s)}>{s}</Chip>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : allergies.length === 0 && sensitivities.length === 0 ? (
                    <p className="text-sm" style={{ color: "#A89080" }}>No restrictions set.</p>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {allergies.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "#A89080" }}>Allergies</p>
                          <div className="flex flex-wrap gap-2">
                            {allergies.map((a) => (
                              <div key={a} className="px-4 py-3 rounded-xl flex flex-col gap-1 min-w-[100px]" style={{ background: "#F5EFE6", border: "1px solid #EAE2D6" }}>
                                <span className="text-sm font-semibold" style={{ color: "#3D2C1E" }}>{a}</span>
                                <div className="h-1.5 rounded-full w-full" style={{ background: "#EAE2D6" }}>
                                  <div className="h-1.5 rounded-full w-4/5" style={{ background: "#B83232" }} />
                                </div>
                                <span className="text-xs" style={{ color: "#B83232" }}>Severe</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {sensitivities.filter(s => MEDICAL_CONDITIONS.includes(s)).length > 0 && (
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "#A89080" }}>Medical Conditions</p>
                          <div className="flex flex-wrap gap-2">
                            {sensitivities.filter(s => MEDICAL_CONDITIONS.includes(s)).map((s) => (
                              <span key={s} className="px-3 py-1.5 rounded-full text-sm font-medium" style={{ background: "#FEF6E4", color: "#925F0A", border: "1px solid #F5DFA0" }}>{s}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {sensitivities.filter(s => DIETARY_NEEDS.includes(s)).length > 0 && (
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "#A89080" }}>Dietary Needs</p>
                          <div className="flex flex-wrap gap-2">
                            {sensitivities.filter(s => DIETARY_NEEDS.includes(s)).map((s) => (
                              <span key={s} className="px-3 py-1.5 rounded-full text-sm font-medium" style={{ background: "#F5EFE6", color: "#3D2C1E", border: "1px solid #EAE2D6" }}>{s}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {dietaryType.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "#A89080" }}>Dietary Type</p>
                          <div className="flex flex-wrap gap-2">
                            {dietaryType.map((d) => (
                              <span key={d} className="px-3 py-1.5 rounded-full text-sm font-medium" style={{ background: "#F5EFE6", color: "#3D2C1E", border: "1px solid #EAE2D6" }}>{d}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Cuisines */}
                <div className="rounded-2xl p-6" style={{ background: "#fff", border: "1px solid #EAE2D6" }}>
                  <h2 className="font-bold text-lg mb-4" style={{ color: "#3D2C1E" }}>Favorite Cuisines</h2>
                  {editing ? (
                    <div className="flex flex-wrap gap-2">
                      {CUISINE_OPTIONS.map((c) => (
                        <Chip key={c} selected={(draft.preferences?.favorite_cuisines ?? []).includes(c)} onClick={() => toggleCuisine(c)}>{c}</Chip>
                      ))}
                    </div>
                  ) : (src.preferences?.favorite_cuisines ?? []).length === 0 ? (
                    <p className="text-sm" style={{ color: "#A89080" }}>No cuisines set.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {src.preferences!.favorite_cuisines!.map((c) => (
                        <span key={c} className="px-3 py-1.5 rounded-full text-sm font-medium" style={{ background: "#F5EFE6", color: "#3D2C1E", border: "1px solid #EAE2D6" }}>{c}</span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Check history */}
                <div className="rounded-2xl p-6" style={{ background: "#fff", border: "1px solid #EAE2D6" }}>
                  <h2 className="font-bold text-lg mb-4" style={{ color: "#3D2C1E" }}>Check History</h2>
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ color: "#A89080" }}>
                        <th className="text-left pb-3 font-medium">Product</th>
                        <th className="text-left pb-3 font-medium">Brand</th>
                        <th className="text-left pb-3 font-medium">Date</th>
                        <th className="text-left pb-3 font-medium">Result</th>
                      </tr>
                    </thead>
                    <tbody>
                      {MOCK_HISTORY.map((item, i) => {
                        const rs = resultStyle[item.result];
                        return (
                          <tr key={i} className="border-t" style={{ borderColor: "#F5EFE6" }}>
                            <td className="py-3 font-medium" style={{ color: "#3D2C1E" }}>{item.product}</td>
                            <td className="py-3" style={{ color: "#6B5744" }}>{item.brand}</td>
                            <td className="py-3" style={{ color: "#A89080" }}>{item.date}</td>
                            <td className="py-3">
                              <span className="flex items-center gap-1 w-fit text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: rs.bg, color: rs.text }}>
                                {rs.icon} {item.result}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
