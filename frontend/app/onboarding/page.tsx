"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Shield, ChevronRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function Onboarding() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    age: "",
    height: "",
    weight: "",
    blood_type: "",
    medical_history: "",
    current_medications: "",
    insurance_provider: "",
    insurance_plan: "",
    insurance_member_id: "",
    insurance_group_number: "",
    insurance_copay: "",
    insurance_deductible: "",
  });

  useEffect(() => {
    fetch("/api/backend/user")
      .then((r) => r.json())
      .then((user) => {
        setForm({
          name: user.name ?? "",
          age: String(user.age ?? ""),
          height: user.height ?? "",
          weight: user.weight ?? "",
          blood_type: user.blood_type ?? "",
          medical_history: (user.medical_history ?? []).join(", "),
          current_medications: (user.current_medications ?? []).join(", "),
          insurance_provider: user.insurance?.provider ?? "",
          insurance_plan: user.insurance?.plan ?? "",
          insurance_member_id: user.insurance?.member_id ?? "",
          insurance_group_number: user.insurance?.group_number ?? "",
          insurance_copay: user.insurance?.copay ?? "",
          insurance_deductible: user.insurance?.deductible ?? "",
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleContinue = async () => {
    setSaving(true);
    try {
      const payload = {
        id: "demo_user",
        name: form.name,
        age: parseInt(form.age) || 0,
        height: form.height,
        weight: form.weight,
        blood_type: form.blood_type,
        medical_history: form.medical_history.split(",").map((s) => s.trim()).filter(Boolean),
        current_medications: form.current_medications.split(",").map((s) => s.trim()).filter(Boolean),
        insurance: {
          provider: form.insurance_provider,
          plan: form.insurance_plan,
          member_id: form.insurance_member_id,
          group_number: form.insurance_group_number,
          copay: form.insurance_copay,
          deductible: form.insurance_deductible,
        },
        onboarded: true,
      };
      const res = await fetch("/api/backend/user", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      toast.success("Profile saved!");
      router.push("/");
    } catch {
      toast.error("Failed to save. Is the backend running?");
    } finally {
      setSaving(false);
    }
  };

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-950 py-12 px-4">
      <div className="max-w-xl mx-auto flex flex-col gap-8">

        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Shield className="w-6 h-6 text-blue-400" />
            <span className="text-white font-bold text-xl">TruthLens</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Your Health Profile</h1>
          <p className="text-gray-400 text-sm mt-1">
            We use this to give you personalized validation context.
          </p>
        </div>

        {/* Personal */}
        <Section title="Personal Info">
          <Row label="Full Name"><Input value={form.name} onChange={set("name")} placeholder="Alex Johnson" /></Row>
          <Row label="Age"><Input value={form.age} onChange={set("age")} placeholder="34" /></Row>
          <Row label="Height"><Input value={form.height} onChange={set("height")} placeholder='5&apos;11"' /></Row>
          <Row label="Weight"><Input value={form.weight} onChange={set("weight")} placeholder="175 lbs" /></Row>
          <Row label="Blood Type"><Input value={form.blood_type} onChange={set("blood_type")} placeholder="O+" /></Row>
        </Section>

        {/* Medical */}
        <Section title="Medical History">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-400">Conditions (comma separated)</label>
            <textarea
              value={form.medical_history}
              onChange={set("medical_history")}
              rows={3}
              placeholder="Type 2 Diabetes, Hypertension, Seasonal allergies"
              className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-400">Current Medications (comma separated)</label>
            <textarea
              value={form.current_medications}
              onChange={set("current_medications")}
              rows={2}
              placeholder="Metformin 500mg, Lisinopril 10mg"
              className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
        </Section>

        {/* Insurance */}
        <Section title="Insurance Details">
          <Row label="Provider"><Input value={form.insurance_provider} onChange={set("insurance_provider")} placeholder="BlueCross BlueShield" /></Row>
          <Row label="Plan"><Input value={form.insurance_plan} onChange={set("insurance_plan")} placeholder="PPO Gold" /></Row>
          <Row label="Member ID"><Input value={form.insurance_member_id} onChange={set("insurance_member_id")} placeholder="BCB-4921-JX" /></Row>
          <Row label="Group Number"><Input value={form.insurance_group_number} onChange={set("insurance_group_number")} placeholder="GRP-00234" /></Row>
          <div className="grid grid-cols-2 gap-3">
            <Row label="Copay"><Input value={form.insurance_copay} onChange={set("insurance_copay")} placeholder="$20" /></Row>
            <Row label="Deductible"><Input value={form.insurance_deductible} onChange={set("insurance_deductible")} placeholder="$1,500" /></Row>
          </div>
        </Section>

        {/* CTA */}
        <button
          onClick={handleContinue}
          disabled={saving}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-semibold rounded-lg py-3 flex items-center justify-center gap-2 transition"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><ChevronRight className="w-4 h-4" />Continue to TruthLens</>}
        </button>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 flex flex-col gap-4">
      <h2 className="text-white font-semibold text-sm uppercase tracking-wide">{title}</h2>
      {children}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-gray-400">{label}</label>
      {children}
    </div>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
    />
  );
}
