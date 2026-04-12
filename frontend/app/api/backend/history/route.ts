import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const USER_ID = "demo_user";

export async function GET() {
  const { data, error } = await supabase
    .from("history")
    .select("*")
    .eq("user_id", USER_ID)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  const { error } = await supabase.from("history").insert({
    user_id: USER_ID,
    input: body.input ?? "",
    input_type: body.input_type ?? "url",
    verdict: body.verdict,
    score: body.score,
    claim_count: body.claim_count ?? 0,
    claims: body.claims ?? [],
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ status: "ok" });
}
