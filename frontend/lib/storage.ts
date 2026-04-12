import fs from "fs";
import path from "path";

// ---------------------------------------------------------------------------
// Supabase swap points — teammate replaces the three functions below when the
// users table is ready. Everything else in this file stays the same.
//
// getUser()       → supabase.from('users').select().eq('id', userId).single()
// saveUser()      → supabase.from('users').upsert(user)
// saveUserMemory()→ supabase.from('users').upsert({ id, [key]: value })
// ---------------------------------------------------------------------------

const DATA_DIR = path.join(process.cwd(), "data");
const USER_FILE = path.join(DATA_DIR, "user.json");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

// TODO(teammate): replace with Supabase select
export function getUser(): Record<string, unknown> {
  ensureDataDir();
  if (!fs.existsSync(USER_FILE)) return {};
  return JSON.parse(fs.readFileSync(USER_FILE, "utf-8"));
}

// TODO(teammate): replace with Supabase upsert
export function saveUser(user: Record<string, unknown>): void {
  ensureDataDir();
  fs.writeFileSync(USER_FILE, JSON.stringify(user, null, 2));
}

// Merges a single key-value fact into the user profile.
// Called by the save_user_memory tool when the agent learns something mid-chat.
// TODO(teammate): replace with Supabase column upsert
export function saveUserMemory(key: string, value: unknown): void {
  const user = getUser();
  user[key] = value;
  saveUser(user);
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
  [key: string]: unknown; // allow arbitrary memory keys the agent saves
}
