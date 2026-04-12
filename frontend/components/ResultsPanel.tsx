"use client";

import { ArrowLeft, CheckCircle, XCircle, AlertTriangle, ShieldCheck, ShieldX, ShieldAlert } from "lucide-react";

interface Source {
  url: string;
  title: string;
  trust_score: number;
  stance: string;
  verdict: string;
  flags: string[];
}

interface ClaimResult {
  claim: string;
  overall_score: number;
  verdict: string;
  explanation: string;
  summary: {
    agree: number;
    disagree: number;
    neutral: number;
    flagged: number;
    blocked: number;
    total_searched: number;
  };
  sources: {
    agree: Source[];
    disagree: Source[];
    neutral: Source[];
    flagged: Source[];
    blocked: Source[];
  };
}

interface Results {
  overall_score: number;
  overall_verdict: string;
  claim_count: number;
  claims: ClaimResult[];
}

interface Props {
  results: Results;
  onReset: () => void;
}

function ScoreCircle({ score }: { score: number }) {
  const color = score >= 70 ? "#22c55e" : score >= 40 ? "#eab308" : "#ef4444";
  const r = 44;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;

  return (
    <div className="relative flex items-center justify-center" style={{ width: 120, height: 120 }}>
      <svg width="120" height="120" className="-rotate-90 absolute">
        <circle cx="60" cy="60" r={r} fill="none" stroke="#1f2937" strokeWidth="10" />
        <circle cx="60" cy="60" r={r} fill="none" stroke={color} strokeWidth="10"
          strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.7s ease" }} />
      </svg>
      <div className="flex flex-col items-center z-10">
        <span className="text-3xl font-bold text-white">{score}</span>
        <span className="text-xs text-gray-400">/ 100</span>
      </div>
    </div>
  );
}

function VerdictBadge({ verdict }: { verdict: string }) {
  const map: Record<string, { icon: any; color: string }> = {
    "LIKELY CREDIBLE": { icon: ShieldCheck, color: "bg-green-900/50 text-green-400 border-green-800" },
    "DISPUTED": { icon: ShieldAlert, color: "bg-yellow-900/50 text-yellow-400 border-yellow-800" },
    "LIKELY FALSE": { icon: ShieldX, color: "bg-red-900/50 text-red-400 border-red-800" },
  };
  const config = map[verdict] ?? map["DISPUTED"];
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-sm font-semibold ${config.color}`}>
      <Icon className="w-4 h-4" />{verdict}
    </span>
  );
}

function SourceRow({ source }: { source: Source }) {
  const stanceIcon = source.stance === "AGREE"
    ? <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
    : source.stance === "DISAGREE"
    ? <XCircle className="w-4 h-4 text-red-400 shrink-0" />
    : <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0" />;

  return (
    <div className="flex items-start gap-3 py-2 border-b border-gray-800 last:border-0">
      {stanceIcon}
      <div className="flex-1 min-w-0">
        <a href={source.url} target="_blank" rel="noopener noreferrer"
          className="text-sm text-blue-400 hover:underline truncate block">{source.title || source.url}</a>
        <p className="text-xs text-gray-500 truncate">{source.url}</p>
        {source.flags.length > 0 && (
          <div className="flex gap-1 mt-1 flex-wrap">
            {source.flags.map((f) => (
              <span key={f} className="text-xs bg-yellow-900/40 text-yellow-400 px-1.5 py-0.5 rounded">{f}</span>
            ))}
          </div>
        )}
      </div>
      <span className={`text-xs font-mono shrink-0 ${source.trust_score >= 0.65 ? "text-green-400" : source.trust_score >= 0.4 ? "text-yellow-400" : "text-red-400"}`}>
        {Math.round(source.trust_score * 100)}
      </span>
    </div>
  );
}

export function ResultsPanel({ results, onReset }: Props) {
  return (
    <main className="min-h-screen bg-gray-950 px-4 py-10">
      <div className="max-w-2xl mx-auto flex flex-col gap-6">

        {/* Back button */}
        <button onClick={onReset} className="flex items-center gap-2 text-gray-400 hover:text-white transition text-sm w-fit">
          <ArrowLeft className="w-4 h-4" /> Validate another
        </button>

        {/* Overall score card */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-8 flex flex-col sm:flex-row items-center gap-6">
          <ScoreCircle score={results.overall_score} />
          <div className="flex flex-col gap-2 text-center sm:text-left">
            <p className="text-gray-400 text-sm">{results.claim_count} claim{results.claim_count !== 1 ? "s" : ""} analyzed</p>
            <VerdictBadge verdict={results.overall_verdict} />
          </div>
        </div>

        {/* Per-claim breakdown */}
        {results.claims.map((claim: ClaimResult, i: number) => (
          <div key={i} className="bg-gray-900 rounded-2xl border border-gray-800 p-6 flex flex-col gap-4">
            {/* Claim header */}
            <div className="flex flex-col gap-2">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Claim {i + 1}</p>
              <p className="text-white font-medium">"{claim.claim}"</p>
              <div className="flex items-center gap-3">
                <VerdictBadge verdict={claim.verdict} />
                <span className="text-gray-400 text-sm">Score: <span className="text-white font-semibold">{claim.overall_score}/100</span></span>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: "Agree", value: claim.summary.agree, color: "text-green-400" },
                { label: "Disagree", value: claim.summary.disagree, color: "text-red-400" },
                { label: "Flagged", value: claim.summary.flagged, color: "text-yellow-400" },
                { label: "Blocked", value: claim.summary.blocked, color: "text-gray-500" },
              ].map((s) => (
                <div key={s.label} className="bg-gray-800 rounded-lg p-3 text-center">
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-gray-500">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Explanation */}
            <p className="text-gray-400 text-sm leading-relaxed">{claim.explanation}</p>

            {/* Sources */}
            {[...claim.sources.agree, ...claim.sources.disagree, ...claim.sources.flagged].length > 0 && (
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Sources</p>
                <div className="flex flex-col">
                  {[...claim.sources.agree, ...claim.sources.disagree, ...claim.sources.flagged].map((s, j) => (
                    <SourceRow key={j} source={s} />
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
