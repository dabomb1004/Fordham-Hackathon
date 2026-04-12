"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { ShieldCheck, AlertTriangle, CheckCircle2, Search, XCircle } from "lucide-react";

const FILTER_CHIPS = ["All", "Food & Beverage", "Clothing & Apparel", "Medications", "Supplements", "Beauty & Personal Care"];

const STAT_CARDS = [
  { value: "24k+", label: "Products verified" },
  { value: "91%",  label: "Accuracy rate" },
];

const RECENT_CHECKS = [
  {
    product: "Shein CURVE+ Oversized Tee",
    brand: "SHEIN",
    category: "Clothing & Apparel",
    tags: ["Fast fashion", "Labor concerns"],
    result: "Danger",
    note: "Multiple credible reports of labor violations & toxic dye levels",
  },
  {
    product: "Tylenol Extra Strength",
    brand: "Johnson & Johnson",
    category: "Medications",
    tags: ["FDA approved", "OTC"],
    result: "Safe",
    note: "Verified by FDA, no active recalls",
  },
  {
    product: "Kirkland Signature Fish Oil",
    brand: "Costco",
    category: "Supplements",
    tags: ["Omega-3", "3rd-party tested"],
    result: "Safe",
    note: "ConsumerLab certified, no contaminants detected",
  },
  {
    product: "Fenty Beauty Foundation",
    brand: "Fenty Beauty",
    category: "Beauty & Personal Care",
    tags: ["Cruelty-free", "Fragrance"],
    result: "Caution",
    note: "Contains fragrance — may irritate sensitive skin",
  },
  {
    product: "Lay's Classic Chips",
    brand: "PepsiCo",
    category: "Food & Beverage",
    tags: ["High sodium", "Gluten"],
    result: "Caution",
    note: "High sodium content flagged by AHA guidelines",
  },
  {
    product: "Patagonia Better Sweater",
    brand: "Patagonia",
    category: "Clothing & Apparel",
    tags: ["Fair Trade", "Recycled"],
    result: "Safe",
    note: "Fair Trade certified, B-Corp verified supply chain",
  },
];

const resultConfig = {
  Safe:    { bg: "#EAF5EE", text: "#2A7A4A", border: "#C3E6CC", icon: <CheckCircle2 className="w-3.5 h-3.5" />, label: "Verified" },
  Caution: { bg: "#FEF6E4", text: "#925F0A", border: "#F5DFA0", icon: <AlertTriangle className="w-3.5 h-3.5" />, label: "Caution" },
  Danger:  { bg: "#FDEDED", text: "#B83232", border: "#F5C2C2", icon: <XCircle className="w-3.5 h-3.5" />,     label: "Flagged" },
};

export default function HomePage() {
  const [activeFilter, setActiveFilter] = useState("All");
  const [userName, setUserName] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    fetch("/api/backend/user")
      .then((r) => r.json())
      .then((u) => setUserName(u?.profile?.name ?? u?.name ?? ""))
      .catch(() => {});
  }, []);

  const filtered =
    activeFilter === "All"
      ? RECENT_CHECKS
      : RECENT_CHECKS.filter((c) => c.category === activeFilter);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#FBF7F0" }}>
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-12 flex flex-col gap-14">

        {/* Hero */}
        <section className="flex flex-col gap-7">
          <div
            className="self-start flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full"
            style={{ background: "#F5EFE6", color: "#C17B3A", border: "1px solid #EAE2D6" }}
          >
            <ShieldCheck className="w-3.5 h-3.5" /> AI-powered product & brand verification
          </div>

          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8">
            <div>
              <h1 className="text-5xl font-bold leading-tight" style={{ color: "#3D2C1E" }}>
                Know what you&apos;re<br />
                <span style={{ color: "#C17B3A" }}>buying into.</span>
              </h1>
              <p className="mt-4 text-base max-w-lg leading-relaxed" style={{ color: "#6B5744" }}>
                Guardia cross-references credible sources — FDA, consumer reports, investigative
                journalism, lab tests — to flag risks or verify quality for any product or brand.
                Food, clothing, medications, beauty, and more.
              </p>
            </div>

            <div className="flex gap-3 shrink-0">
              {STAT_CARDS.map(({ value, label }) => (
                <div
                  key={label}
                  className="flex flex-col items-center justify-center rounded-2xl px-5 py-4 min-w-[80px]"
                  style={{ background: "#3D2C1E" }}
                >
                  <span className="text-2xl font-bold" style={{ color: "#C17B3A" }}>{value}</span>
                  <span className="text-xs text-center mt-1" style={{ color: "#A89080" }}>{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Search + CTA */}
          <div className="flex gap-3">
            <div
              className="flex-1 flex items-center gap-3 px-4 py-3 rounded-xl border"
              style={{ background: "#fff", borderColor: "#EAE2D6" }}
            >
              <Search className="w-4 h-4 shrink-0" style={{ color: "#C17B3A" }} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && query.trim())
                    window.location.href = `/chat?q=${encodeURIComponent(query)}`;
                }}
                placeholder='Try "SHEIN", "Tylenol", "Patagonia", "Oatly"...'
                className="flex-1 bg-transparent text-sm focus:outline-none"
                style={{ color: "#3D2C1E" }}
              />
            </div>
            <Link
              href={`/chat${query ? `?q=${encodeURIComponent(query)}` : ""}`}
              className="px-6 py-3 rounded-xl text-sm font-semibold text-white transition whitespace-nowrap"
              style={{ background: "#C17B3A" }}
            >
              Check now
            </Link>
          </div>

          {/* How it works */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { step: "1", title: "Submit anything", desc: "Type a product name, brand, or drop a photo." },
              { step: "2", title: "We search credible sources", desc: "FDA, lab reports, news, consumer databases — all cross-referenced." },
              { step: "3", title: "Get a clear verdict", desc: "Verified, caution flags, or danger alerts — with sources cited." },
            ].map(({ step, title, desc }) => (
              <div
                key={step}
                className="rounded-2xl p-5 flex flex-col gap-2"
                style={{ background: "#F5EFE6", border: "1px solid #EAE2D6" }}
              >
                <span className="text-xs font-bold" style={{ color: "#C17B3A" }}>Step {step}</span>
                <p className="font-semibold text-sm" style={{ color: "#3D2C1E" }}>{title}</p>
                <p className="text-xs leading-relaxed" style={{ color: "#6B5744" }}>{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Recent checks */}
        <section className="flex flex-col gap-4">
          <h2 className="font-bold text-lg" style={{ color: "#3D2C1E" }}>Recent Checks</h2>

          <div className="flex flex-wrap gap-2">
            {FILTER_CHIPS.map((chip) => (
              <button
                key={chip}
                onClick={() => setActiveFilter(chip)}
                className="px-4 py-1.5 rounded-full text-sm font-medium border transition"
                style={{
                  background: activeFilter === chip ? "#3D2C1E" : "#F5EFE6",
                  color: activeFilter === chip ? "#FBF7F0" : "#3D2C1E",
                  borderColor: activeFilter === chip ? "#3D2C1E" : "#EAE2D6",
                }}
              >
                {chip}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-3">
            {filtered.length === 0 ? (
              <p className="text-sm py-8 text-center" style={{ color: "#A89080" }}>No checks in this category yet.</p>
            ) : (
              filtered.map((item, i) => {
                const rs = resultConfig[item.result as keyof typeof resultConfig];
                return (
                  <div
                    key={i}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 rounded-xl border"
                    style={{ background: "#fff", borderColor: "#EAE2D6" }}
                  >
                    <div className="flex flex-col gap-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold" style={{ color: "#3D2C1E" }}>{item.product}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#F5EFE6", color: "#6B5744" }}>
                          {item.category}
                        </span>
                      </div>
                      <span className="text-xs" style={{ color: "#A89080" }}>{item.brand} · {item.note}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {item.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-xs px-2 py-0.5 rounded-full hidden sm:inline-block"
                          style={{ background: "#F5EFE6", color: "#6B5744" }}
                        >
                          {tag}
                        </span>
                      ))}
                      <span
                        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border"
                        style={{ background: rs.bg, color: rs.text, borderColor: rs.border }}
                      >
                        {rs.icon} {rs.label}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* CTA banner */}
        <section
          className="rounded-2xl px-8 py-8 flex flex-col md:flex-row items-center justify-between gap-4"
          style={{ background: "#3D2C1E" }}
        >
          <div>
            <h3 className="text-xl font-bold text-white">
              {userName ? `What are you checking today, ${userName.split(" ")[0]}?` : "Ready to verify a product?"}
            </h3>
            <p className="text-sm mt-1" style={{ color: "#A89080" }}>
              Drop a photo, paste a name, or describe what you want verified.
            </p>
          </div>
          <Link
            href="/chat"
            className="shrink-0 px-6 py-3 rounded-xl text-sm font-semibold text-white transition"
            style={{ background: "#C17B3A" }}
          >
            Start checking →
          </Link>
        </section>

      </main>
    </div>
  );
}
