import {
  AnalysisResult,
  UserProfile,
  AnalysisTrace,
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export async function analyzeText(userProfile: UserProfile, inputText: string) {
  const res = await fetch(`${API_BASE}/analyze/text`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userProfile, inputText }),
  });

  if (!res.ok) throw new Error("Failed to analyze text");

  return res.json() as Promise<{
    final: AnalysisResult;
    trace: AnalysisTrace;
  }>;
}

export async function askFollowup(
  userProfile: UserProfile,
  previousAnalysis: AnalysisResult,
  followUpQuestion: string
) {
  const res = await fetch(`${API_BASE}/followup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userProfile, previousAnalysis, followUpQuestion }),
  });

  if (!res.ok) throw new Error("Failed to answer follow-up");
  return res.json();
}