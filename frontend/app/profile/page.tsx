"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { CheckCircle2, AlertTriangle, ShieldAlert } from "lucide-react";

interface UserData {
  profile?: { name?: string; age?: number; height?: string; weight?: string; bmi?: number };
  food_safety?: { allergies?: string[]; dietary_type?: string[]; sensitivities?: string[] };
  preferences?: { favorite_cuisines?: string[]; spice_level?: string; price_range?: string; eating_goal?: string };
  priority?: { decision_factor?: string };
}

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

export default function ProfilePage() {
  const [user, setUser] = useState<UserData>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/backend/user")
      .then((r) => r.json())
      .then((u) => setUser(u))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const name = user.profile?.name || "User";
  const initials = name.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);
  const allergies = user.food_safety?.allergies?.filter((a) => a !== "None") ?? [];
  const sensitivities = user.food_safety?.sensitivities ?? [];
  const dietaryType = user.food_safety?.dietary_type?.filter((d) => d !== "None") ?? [];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#FBF7F0" }}>
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-10">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#C17B3A", borderTopColor: "transparent" }} />
          </div>
        ) : (
          <div className="flex flex-col md:flex-row gap-6">

            {/* ── Left sidebar ── */}
            <div className="flex flex-col gap-4 md:w-64 shrink-0">

              {/* Identity card */}
              <div
                className="rounded-2xl p-6 flex flex-col gap-4"
                style={{ background: "#3D2C1E" }}
              >
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold"
                  style={{ background: "#C17B3A", color: "#FBF7F0" }}
                >
                  {initials}
                </div>
                <div>
                  <p className="text-white font-bold text-lg leading-tight">{name}</p>
                  <p className="text-sm mt-0.5" style={{ color: "#A89080" }}>
                    {allergies.length} restrictions · {totalChecks} total checks
                  </p>
                </div>

                <div className="border-t pt-4" style={{ borderColor: "#5C4033" }}>
                  <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "#A89080" }}>
                    Health Info
                  </p>
                  <div className="flex flex-col gap-2">
                    {[
                      { label: "Height", value: user.profile?.height || "—" },
                      { label: "Weight", value: user.profile?.weight || "—" },
                      { label: "Age",    value: user.profile?.age ? `${user.profile.age} yrs` : "—" },
                      { label: "BMI",    value: user.profile?.bmi ? String(user.profile.bmi) : "—" },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex justify-between text-sm">
                        <span style={{ color: "#A89080" }}>{label}</span>
                        <span className="font-medium text-white">{value}</span>
                      </div>
                    ))}
                    {dietaryType.length > 0 && (
                      <div className="flex justify-between text-sm">
                        <span style={{ color: "#A89080" }}>Diet</span>
                        <span className="font-medium text-white">{dietaryType.join(", ")}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t pt-4" style={{ borderColor: "#5C4033" }}>
                  <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "#A89080" }}>
                    Activity
                  </p>
                  <div className="flex flex-col gap-2 text-sm">
                    <div className="flex justify-between">
                      <span style={{ color: "#A89080" }}>Total checks</span>
                      <span className="font-medium text-white">{totalChecks}</span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: "#A89080" }}>Risks caught</span>
                      <span className="font-bold" style={{ color: "#B83232" }}>{dangersCaught}</span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: "#A89080" }}>Safe products</span>
                      <span className="font-bold" style={{ color: "#2A7A4A" }}>{safeMeals}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Preferences */}
              <div
                className="rounded-2xl p-5 flex flex-col gap-3"
                style={{ background: "#F5EFE6", border: "1px solid #EAE2D6" }}
              >
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#A89080" }}>
                  Preferences
                </p>
                <div className="flex flex-col gap-1.5 text-sm">
                  <div className="flex justify-between">
                    <span style={{ color: "#6B5744" }}>Spice</span>
                    <span className="font-medium" style={{ color: "#3D2C1E" }}>{user.preferences?.spice_level || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: "#6B5744" }}>Budget</span>
                    <span className="font-medium" style={{ color: "#3D2C1E" }}>{user.preferences?.price_range || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: "#6B5744" }}>Goal</span>
                    <span className="font-medium capitalize" style={{ color: "#3D2C1E" }}>{user.preferences?.eating_goal?.replace("_", " ") || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: "#6B5744" }}>Priority</span>
                    <span className="font-medium capitalize" style={{ color: "#3D2C1E" }}>{user.priority?.decision_factor || "—"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Right panel ── */}
            <div className="flex-1 flex flex-col gap-6">

              {/* Restrictions */}
              <div
                className="rounded-2xl p-6"
                style={{ background: "#fff", border: "1px solid #EAE2D6" }}
              >
                <h2 className="font-bold text-lg mb-4" style={{ color: "#3D2C1E" }}>My Restrictions</h2>

                {allergies.length === 0 && sensitivities.length === 0 ? (
                  <p className="text-sm" style={{ color: "#A89080" }}>No restrictions set.</p>
                ) : (
                  <div className="flex flex-col gap-4">
                    {allergies.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "#A89080" }}>Allergies</p>
                        <div className="flex flex-wrap gap-2">
                          {allergies.map((a) => (
                            <div
                              key={a}
                              className="px-4 py-3 rounded-xl flex flex-col gap-1 min-w-[100px]"
                              style={{ background: "#F5EFE6", border: "1px solid #EAE2D6" }}
                            >
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
                    {sensitivities.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "#A89080" }}>Sensitivities</p>
                        <div className="flex flex-wrap gap-2">
                          {sensitivities.map((s) => (
                            <div
                              key={s}
                              className="px-4 py-3 rounded-xl flex flex-col gap-1 min-w-[100px]"
                              style={{ background: "#FEF6E4", border: "1px solid #EAE2D6" }}
                            >
                              <span className="text-sm font-semibold" style={{ color: "#3D2C1E" }}>{s}</span>
                              <div className="h-1.5 rounded-full w-full" style={{ background: "#EAE2D6" }}>
                                <div className="h-1.5 rounded-full w-1/2" style={{ background: "#925F0A" }} />
                              </div>
                              <span className="text-xs" style={{ color: "#925F0A" }}>Moderate</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Check history */}
              <div
                className="rounded-2xl p-6"
                style={{ background: "#fff", border: "1px solid #EAE2D6" }}
              >
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
                            <span
                              className="flex items-center gap-1 w-fit text-xs font-semibold px-2.5 py-1 rounded-full"
                              style={{ background: rs.bg, color: rs.text }}
                            >
                              {rs.icon} {item.result}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Favorites */}
              {(user.preferences?.favorite_cuisines ?? []).length > 0 && (
                <div
                  className="rounded-2xl p-6"
                  style={{ background: "#fff", border: "1px solid #EAE2D6" }}
                >
                  <h2 className="font-bold text-lg mb-3" style={{ color: "#3D2C1E" }}>Favorite Cuisines</h2>
                  <div className="flex flex-wrap gap-2">
                    {user.preferences!.favorite_cuisines!.map((c) => (
                      <span
                        key={c}
                        className="px-3 py-1.5 rounded-full text-sm font-medium"
                        style={{ background: "#F5EFE6", color: "#3D2C1E", border: "1px solid #EAE2D6" }}
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
