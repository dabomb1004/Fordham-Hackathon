import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const USER_ID = "demo_user";

export async function getUser(): Promise<Record<string, unknown>> {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", USER_ID)
    .single();

  if (error || !data) return {};

  return {
    id: data.id,
    ...data.profile,
    profile: data.profile,
    food_safety: data.food_safety,
    preferences: data.preferences,
    priority: data.priority,
    onboarding: data.onboarding,
  };
}

export async function saveUser(user: Record<string, unknown>): Promise<void> {
  await supabase.from("users").upsert({
    id: USER_ID,
    profile: user.profile ?? {},
    food_safety: user.food_safety ?? {},
    preferences: user.preferences ?? {},
    priority: user.priority ?? {},
    onboarding: user.onboarding ?? {},
  });
}

export async function saveUserMemory(key: string, value: unknown): Promise<void> {
  const { data } = await supabase
    .from("users")
    .select("profile")
    .eq("id", USER_ID)
    .single();

  const profile = (data?.profile as Record<string, unknown>) ?? {};
  profile[key] = value;

  await supabase
    .from("users")
    .upsert({ id: USER_ID, profile });
}

// ---------------------------------------------------------------------------
// User profile shape (matches onboarding page payload)
// ---------------------------------------------------------------------------
export interface UserProfile {
  id: string;
  name?: string;
  age?: number;
  height?: string;
  weight?: string;
  blood_type?: string;
  medical_history?: string[];
  current_medications?: string[];
  insurance?: {
    provider?: string;
    plan?: string;
    member_id?: string;
    group_number?: string;
    copay?: string;
    deductible?: string;
  };
  onboarded?: boolean;
  [key: string]: unknown;
}
