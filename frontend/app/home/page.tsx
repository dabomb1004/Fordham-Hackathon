"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { ShieldCheck, AlertTriangle, CheckCircle2, Search } from "lucide-react";

const FILTER_CHIPS = ["All", "Food & Snacks", "Medications", "Supplements", "Beverages", "Personal Care"];

const STAT_CARDS = [
  { value: "12k+", label: "Products verified" },
  { value: "38",   label: "Risk flags caught" },
  { value: "<3s",  label: "Per check" },
];

const RECENT_CHECKS = [
  {
    product: "Tylenol Extra Strength",
    brand: "Johnson & Johnson",
    tags: ["Acetaminophen", "OTC"],
    result: "Safe",
  },
  {
    product: "Lay's Classic Chips",
    brand: "PepsiCo",
    tags: ["Gluten", "Soy"],
    result: "Caution",
  },
  {
    product: "Kirkland Fish Oil",
    brand: "Costco",
    tags: ["Shellfish", "Omega-3"],
    result: "Danger",
  },
  {
    product: "Oatly Oat Milk",
    brand: "Oatly",
    tags: ["Gluten-free", "Vegan"],
    result: "Safe",
  },
  {
    product: "Advil Liqui-Gels",
    brand: "Haleon",
    tags: ["Ibuprofen", "NSAID"],
    result: "Caution",
  },
];

const resultStyle: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
  Safe:    { bg: "#EAF5EE", text: "#2A7A4A", icon: <CheckCircle2 className="w-3 h-3" /> },
  Caution: { bg: "#FEF6E4", text: "#925F0A", icon: <AlertTriangle className="w-3 h-3" /> },
  Danger:  { bg: "#FDEDED", text: "#B83232", icon: <AlertTriangle className="w-3 h-3" /> },
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
      : RECENT_CHECKS.filter((c) =>
          activeFilter === "Medications"
            ? ["Tylenol Extra Strength", "Advil Liqui-Gels"].includes(c.product)
            : activeFilter === "Supplements"
            ? c.product.includes("Fish Oil")
            : activeFilter === "Food & Snacks"
            ? ["Lay's Classic Chips", "Oatly Oat Milk"].includes(c.product)
            : true
        );

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#FBF7F0" }}>
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-12 flex flex-col gap-12">

        {/* Hero */}
        <section className="flex flex-col gap-6">
          {/* Badge */}
          <div
            className="self-start flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full"
            style={{ background: "#F5EFE6", color: "#C17B3A", border: "1px solid #EAE2D6" }}
          >
            <ShieldCheck className="w-3.5 h-3.5" /> AI-powered product safety checker
          </div>

          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <h1 className="text-5xl font-bold leading-tight" style={{ color: "#3D2C1E" }}>
                Verify before<br />
                <span style={{ color: "#C17B3A" }}>you consume.</span>
              </h1>
              <p className="mt-3 text-base max-w-md" style={{ color: "#6B5744" }}>
                Scan any food product, medication, or supplement — we cross-check ingredients,
                certifications, and flag anything that conflicts with your personal health profile.
              </p>
            </div>

            {/* Stat cards */}
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

          {/* Search bar + CTA */}
          <div className="flex gap-3">
            <div
              className="flex-1 flex items-center gap-3 px-4 py-3 rounded-xl border"
              style={{ background: "#fff", borderColor: "#EAE2D6" }}
            >
              <Search className="w-4 h-4 shrink-0" style={{ color: "#C17B3A" }} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder='Try "Advil", "Lays", "Kirkland Fish Oil"...'
                className="flex-1 bg-transparent text-sm focus:outline-none"
                style={{ color: "#3D2C1E" }}
              />
            </div>
            <Link
              href={`/chat${query ? `?q=${encodeURIComponent(query)}` : ""}`}
              className="px-6 py-3 rounded-xl text-sm font-semibold text-white transition"
              style={{ background: "#C17B3A" }}
            >
              Check now
            </Link>
          </div>
        </section>

        {/* Filter chips */}
        <section className="flex flex-col gap-4">
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

          {/* Recent checks */}
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide mb-3" style={{ color: "#A89080" }}>
              Recent Checks
            </h2>
            <div className="flex flex-col gap-2">
              {filtered.map((item, i) => {
                const rs = resultStyle[item.result];
                return (
                  <div
                    key={i}
                    className="flex items-center justify-between px-5 py-4 rounded-xl border"
                    style={{ background: "#fff", borderColor: "#EAE2D6" }}
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-semibold" style={{ color: "#3D2C1E" }}>
                        {item.product}
                      </span>
                      <span className="text-xs" style={{ color: "#A89080" }}>{item.brand}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{ background: "#F5EFE6", color: "#6B5744" }}
                        >
                          {tag}
                        </span>
                      ))}
                      <span
                        className="flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full ml-2"
                        style={{ background: rs.bg, color: rs.text }}
                      >
                        {rs.icon} {item.result}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA banner */}
        <section
          className="rounded-2xl px-8 py-8 flex flex-col md:flex-row items-center justify-between gap-4"
          style={{ background: "#3D2C1E" }}
        >
          <div>
            <h3 className="text-xl font-bold text-white">
              {userName ? `Ready to check, ${userName.split(" ")[0]}?` : "Ready to check a product?"}
            </h3>
            <p className="text-sm mt-1" style={{ color: "#A89080" }}>
              Drop a photo or type a product name — Guardia does the rest.
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
