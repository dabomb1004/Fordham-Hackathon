import { createClient, SupabaseClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

const USER_ID = "demo_user";
const LOCAL_FALLBACK_PATH = path.join(process.cwd(), "user-profile.json");

// Lazy-init so missing env vars don't crash at module load time
let _supabase: SupabaseClient | null = null;
function getSupabase(): SupabaseClient | null {
  if (_supabase) return _supabase;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  _supabase = createClient(url, key);
  return _supabase;
}

// --- Local file fallback (used when Supabase env vars are not set) ---
function readLocalProfile(): Record<string, unknown> {
  try {
    if (fs.existsSync(LOCAL_FALLBACK_PATH)) {
      return JSON.parse(fs.readFileSync(LOCAL_FALLBACK_PATH, "utf-8"));
    }
  } catch {}
  return {};
}
function writeLocalProfile(data: Record<string, unknown>): void {
  fs.writeFileSync(LOCAL_FALLBACK_PATH, JSON.stringify(data, null, 2));
}

export async function getUser(): Promise<Record<string, unknown>> {
  const supabase = getSupabase();
  if (!supabase) return readLocalProfile();

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
  const supabase = getSupabase();
  if (!supabase) {
    writeLocalProfile(user);
    return;
  }
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
  const supabase = getSupabase();
  if (!supabase) {
    const profile = readLocalProfile();
    profile[key] = value;
    writeLocalProfile(profile);
    return;
  }

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
