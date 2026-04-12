import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const USER_ID = "demo_user";

export async function GET() {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", USER_ID)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Flatten to shape the onboarding page expects
  return NextResponse.json({
    id: data.id,
    ...data.profile,
    profile: data.profile,
    food_safety: data.food_safety,
    preferences: data.preferences,
    priority: data.priority,
    onboarding: data.onboarding,
  });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();

  const { error } = await supabase
    .from("users")
    .upsert({
      id: USER_ID,
      profile: body.profile ?? {},
      food_safety: body.food_safety ?? {},
      preferences: body.preferences ?? {},
      priority: body.priority ?? {},
      onboarding: body.onboarding ?? {},
    });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ status: "ok" });
}
