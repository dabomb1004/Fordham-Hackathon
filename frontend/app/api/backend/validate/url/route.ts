import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const BACKEND = process.env.BACKEND_URL ?? "http://localhost:8000";
const USER_ID = "demo_user";

export async function POST(req: NextRequest) {
  const form = await req.formData();

  // Proxy to FastAPI
  const res = await fetch(`${BACKEND}/validate/url`, { method: "POST", body: form });
  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json({ error: text }, { status: res.status });
  }

  const data = await res.json();

  // Persist to Supabase history
  await supabase.from("history").insert({
    user_id: USER_ID,
    input: form.get("url") as string,
    input_type: "url",
    verdict: data.overall_verdict,
    score: data.overall_score,
    claim_count: data.claim_count ?? 0,
    claims: data.claims ?? [],
  });

  return NextResponse.json(data);
}
