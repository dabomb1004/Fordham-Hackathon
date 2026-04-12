"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Shield, Send, ImagePlus, X, Loader2, ShieldAlert, AlertTriangle, CheckCircle2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ValidationFactor {
  category: string;
  status: "pass" | "warn" | "fail";
  findings: string[];
  summary: string;
  sources: { title: string; url: string }[];
}

interface ValidationResult {
  brand_name: string;
  product_name: string;
  trust_score: number | null;
  verdict: string;
  certifications: string[];
  red_flags: string[];
  reviews_summary: string;
  factors: ValidationFactor[];
  stub?: boolean;
}

interface ChatResult {
  reply: string;
  validation: ValidationResult | null;
  askedQuestion: boolean;
}

interface DisplayMessage {
  role: "user" | "assistant";
  content: string;
  imagePreview?: string;
  validation?: ValidationResult | null;
  askedQuestion?: boolean;
}

// ── Validation card ─────────────────────────────────────────────────────────
const STATUS_STYLES = {
  pass: {
    icon: <CheckCircle2 className="w-3.5 h-3.5 shrink-0" style={{ color: "#2A7A4A" }} />,
    label: { color: "#2A7A4A" },
    bg: { background: "#EAF5EE", border: "1px solid #c3e6d0" },
  },
  warn: {
    icon: <AlertTriangle className="w-3.5 h-3.5 shrink-0" style={{ color: "#925F0A" }} />,
    label: { color: "#925F0A" },
    bg: { background: "#FEF6E4", border: "1px solid #f0d9a8" },
  },
  fail: {
    icon: <ShieldAlert className="w-3.5 h-3.5 shrink-0" style={{ color: "#B83232" }} />,
    label: { color: "#B83232" },
    bg: { background: "#FDEEED", border: "1px solid #f0bcbc" },
  },
};

function ValidationCard({ v }: { v: ValidationResult }) {
  const isPending = v.verdict === "PENDING_VALIDATION";

  const verdictStyle = isPending
    ? { color: "#925F0A", background: "#FEF6E4", border: "1px solid #f0d9a8" }
    : v.verdict === "SAFE"
    ? { color: "#2A7A4A", background: "#EAF5EE", border: "1px solid #c3e6d0" }
    : v.verdict === "CAUTION"
    ? { color: "#925F0A", background: "#FEF6E4", border: "1px solid #f0d9a8" }
    : { color: "#B83232", background: "#FDEEED", border: "1px solid #f0bcbc" };

  return (
    <div className="mt-3 rounded-2xl p-4 flex flex-col gap-4 text-sm" style={{ background: "#F5EFE6", border: "1px solid #EAE2D6" }}>
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 font-semibold" style={{ color: "#3D2C1E" }}>
          <ShieldAlert className="w-4 h-4 shrink-0" style={{ color: "#C17B3A" }} />
          <span>{v.brand_name}{v.product_name ? ` · ${v.product_name}` : ""}</span>
        </div>
        <div className="flex items-center gap-2">
          {v.trust_score !== null && (
            <span className="text-xs font-mono" style={{ color: "#9a8878" }}>
              {v.trust_score}/100
            </span>
          )}
          <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold" style={verdictStyle}>
            {v.verdict.replace(/_/g, " ")}
          </span>
        </div>
      </div>

      {/* Per-factor breakdown */}
      {(v.factors ?? []).length > 0 && (
        <div className="flex flex-col gap-2">
          {v.factors.map((f) => {
            const style = STATUS_STYLES[f.status];
            return (
              <div key={f.category} className="rounded-xl p-3 flex flex-col gap-1.5" style={style.bg}>
                <div className="flex items-center gap-1.5 text-xs font-semibold" style={style.label}>
                  {style.icon}
                  {f.category}
                </div>
                <ul className="flex flex-col gap-0.5 pl-5">
                  {f.findings.map((item) => (
                    <li key={item} className="text-xs list-disc" style={{ color: "#5a4a3a" }}>{item}</li>
                  ))}
                </ul>
                {(f.sources ?? []).length > 0 && (
                  <div className="flex flex-col gap-1 mt-1 pl-1 pt-2" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
                    {f.sources.map((s) => (
                      <a
                        key={s.url}
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs truncate transition-colors hover:underline"
                        style={{ color: "#C17B3A" }}
                      >
                        <ExternalLink className="w-3 h-3 shrink-0" />
                        <span className="truncate">{s.title}</span>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Fallback chips if no factors */}
      {(v.factors ?? []).length === 0 && (
        <>
          {(v.certifications ?? []).length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {(v.certifications ?? []).map((c) => (
                <span key={c} className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full" style={{ background: "#EAF5EE", color: "#2A7A4A", border: "1px solid #c3e6d0" }}>
                  <CheckCircle2 className="w-3 h-3" />{c}
                </span>
              ))}
            </div>
          )}
          {(v.red_flags ?? []).length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {(v.red_flags ?? []).map((f) => (
                <span key={f} className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full" style={{ background: "#FDEEED", color: "#B83232", border: "1px solid #f0bcbc" }}>
                  <AlertTriangle className="w-3 h-3" />{f}
                </span>
              ))}
            </div>
          )}
        </>
      )}

      {/* Summary */}
      <p className="text-xs leading-relaxed pt-3" style={{ color: "#9a8878", borderTop: "1px solid #EAE2D6" }}>{v.reviews_summary}</p>
      {v.stub && <p className="text-xs italic" style={{ color: "#c0b0a0" }}>Validation pending</p>}
    </div>
  );
}

// ── Quick action chips ───────────────────────────────────────────────────────
const CHIPS = [
  "Is this brand legit?",
  "Any recalls or warnings?",
  "Is this FDA approved?",
  "Check labor practices",
  "Any harmful ingredients?",
  "Verify certifications",
];

// ── Main page ────────────────────────────────────────────────────────────────
export default function ChatPage() {
  const [started, setStarted] = useState(false);
  const [displayMessages, setDisplayMessages] = useState<DisplayMessage[]>([]);
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (started) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [displayMessages, loading, started]);

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleImageSelect = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }, []);

  const handleSend = async (overrideMessage?: string) => {
    const userText = (overrideMessage ?? input).trim();
    if (!userText && !imageFile) return;
    if (loading) return;

    const capturedPreview = imagePreview;
    const capturedFile = imageFile;

    setStarted(true);
    setDisplayMessages((prev) => [
      ...prev,
      { role: "user", content: userText || "", imagePreview: capturedPreview ?? undefined },
    ]);
    setInput("");
    clearImage();
    setLoading(true);

    try {
      const form = new FormData();
      if (userText) form.append("message", userText);
      if (capturedFile) form.append("image", capturedFile);
      form.append("history", JSON.stringify(history));

      const res = await fetch("/api/chat", { method: "POST", body: form });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(err.error || "Request failed");
      }

      const result: ChatResult = await res.json();

      setHistory((prev) => [
        ...prev,
        { role: "user", content: userText || "(image)" },
        { role: "assistant", content: result.reply },
      ]);

      setDisplayMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: result.reply,
          validation: result.validation,
          askedQuestion: result.askedQuestion,
        },
      ]);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
      setDisplayMessages((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = () => setDragging(false);
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleImageSelect(file);
  };

  // ── Landing view ──────────────────────────────────────────────────────────
  if (!started) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "#FBF7F0" }}>
        <Navbar />
        <main
          className="flex-1 flex flex-col items-center justify-center px-4"
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
        >
          {/* Logo */}
          <div className="flex items-center gap-2 mb-10">
            <Shield className="w-6 h-6" style={{ color: "#C17B3A" }} />
            <span className="font-semibold text-lg tracking-tight" style={{ color: "#3D2C1E" }}>Guardia</span>
          </div>

          {/* Heading */}
          <div className="text-center mb-8">
            <h1 className="text-4xl sm:text-5xl font-bold mb-2 tracking-tight" style={{ color: "#3D2C1E" }}>
              Know what you&apos;re
            </h1>
            <h1 className="text-4xl sm:text-5xl font-bold mb-4 tracking-tight" style={{ color: "#C17B3A" }}>
              buying into.
            </h1>
            <p className="text-base max-w-sm mx-auto" style={{ color: "#9a8878" }}>
              Drop a photo or ask about any product — food, medication, supplements, cosmetics. Cross-referenced against FDA, consumer reports, and more.
            </p>
          </div>

          {/* Main input card */}
          <div className="w-full max-w-2xl">
            <div
              className="rounded-3xl transition-all duration-200"
              style={{
                background: "#fff",
                border: dragging ? "2px dashed #C17B3A" : "1px solid #EAE2D6",
                boxShadow: dragging ? "0 0 30px rgba(193,123,58,0.12)" : "0 2px 12px rgba(61,44,30,0.06)",
              }}
            >
              {/* Image preview */}
              {imagePreview && (
                <div className="px-5 pt-5">
                  <div className="relative inline-block">
                    <img src={imagePreview} alt="preview" className="h-32 rounded-xl object-contain" style={{ border: "1px solid #EAE2D6" }} />
                    <button
                      onClick={clearImage}
                      className="absolute -top-2 -right-2 rounded-full p-1 transition"
                      style={{ background: "#EAE2D6" }}
                    >
                      <X className="w-3 h-3" style={{ color: "#3D2C1E" }} />
                    </button>
                  </div>
                </div>
              )}

              {/* Drop zone */}
              {!imageFile && (
                <div
                  onClick={() => fileRef.current?.click()}
                  className="mx-5 mt-5 rounded-2xl cursor-pointer transition flex flex-col items-center justify-center py-8 gap-2"
                  style={{ border: "2px dashed #EAE2D6" }}
                >
                  <ImagePlus className="w-6 h-6" style={{ color: "#C17B3A" }} />
                  <p className="text-sm" style={{ color: "#9a8878" }}>
                    {dragging ? "Drop it!" : "Drop a product photo, or click to browse"}
                  </p>
                </div>
              )}

              {/* Text input row */}
              <div className="flex items-end gap-3 px-5 py-4">
                <button
                  onClick={() => fileRef.current?.click()}
                  className="shrink-0 p-2 rounded-xl transition"
                  style={{ color: "#9a8878" }}
                  title="Upload image"
                >
                  <ImagePlus className="w-5 h-5" />
                </button>

                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
                  }}
                  placeholder="Ask about a product or ingredient..."
                  rows={1}
                  className="flex-1 bg-transparent text-base resize-none focus:outline-none leading-relaxed"
                  style={{ color: "#3D2C1E" }}
                />

                <button
                  onClick={() => handleSend()}
                  disabled={!input.trim() && !imageFile}
                  className="shrink-0 px-4 py-2 rounded-xl font-semibold text-sm transition disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{ background: "#C17B3A", color: "#fff" }}
                >
                  Check now
                </button>
              </div>
            </div>

            {/* Hidden file input */}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageSelect(f); }}
            />

            {/* Quick chips */}
            <div className="flex flex-wrap justify-center gap-2 mt-5">
              {CHIPS.map((chip) => (
                <button
                  key={chip}
                  onClick={() => { setInput(chip); handleSend(chip); }}
                  className="text-sm rounded-full px-4 py-1.5 transition"
                  style={{ color: "#5a4a3a", background: "#F5EFE6", border: "1px solid #EAE2D6" }}
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ── Chat view ─────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen flex flex-col" style={{ background: "#FBF7F0" }}>
      <Navbar />

      {/* Sub-header */}
      <div className="flex items-center gap-2 px-5 py-3" style={{ borderBottom: "1px solid #EAE2D6" }}>
        <Shield className="w-4 h-4" style={{ color: "#C17B3A" }} />
        <span className="font-semibold text-sm" style={{ color: "#3D2C1E" }}>Guardia</span>
        <span className="text-sm" style={{ color: "#9a8878" }}>— Product Safety</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-8 flex flex-col gap-6 max-w-2xl w-full mx-auto">
        {displayMessages.map((msg, i) => (
          <div key={i} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
            {/* Image */}
            {msg.imagePreview && (
              <img
                src={msg.imagePreview}
                alt="uploaded"
                className="max-h-52 rounded-2xl object-contain mb-2"
                style={{ border: "1px solid #EAE2D6" }}
              />
            )}

            {/* Bubble */}
            {(msg.content && msg.content !== "(image)") && (
              <div
                className="max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap"
                style={
                  msg.role === "user"
                    ? { background: "#3D2C1E", color: "#FBF7F0", borderRadius: "18px 18px 4px 18px" }
                    : msg.askedQuestion
                    ? { background: "#fff", color: "#3D2C1E", border: "1px solid #C17B3A", borderRadius: "18px 18px 18px 4px" }
                    : { background: "#fff", color: "#3D2C1E", border: "1px solid #EAE2D6", borderRadius: "18px 18px 18px 4px" }
                }
              >
                {msg.askedQuestion && msg.role === "assistant" && (
                  <p className="text-xs mb-1.5 font-semibold" style={{ color: "#C17B3A" }}>Guardia asks</p>
                )}
                {msg.content}
              </div>
            )}

            {/* Validation card */}
            {msg.validation && (
              <div className="max-w-[85%] w-full">
                <ValidationCard v={msg.validation} />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-start">
            <div className="rounded-2xl px-4 py-3 flex items-center gap-2 text-sm" style={{ background: "#fff", border: "1px solid #EAE2D6", color: "#9a8878" }}>
              <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: "#C17B3A" }} />
              Analyzing...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Image preview strip */}
      {imagePreview && (
        <div className="max-w-2xl w-full mx-auto px-5 pb-2">
          <div className="relative inline-block">
            <img src={imagePreview} alt="preview" className="h-16 rounded-xl object-contain" style={{ border: "1px solid #EAE2D6" }} />
            <button onClick={clearImage} className="absolute -top-2 -right-2 rounded-full p-1 transition" style={{ background: "#EAE2D6" }}>
              <X className="w-3 h-3" style={{ color: "#3D2C1E" }} />
            </button>
          </div>
        </div>
      )}

      {/* Input bar */}
      <div className="px-4 py-4 max-w-2xl w-full mx-auto" style={{ borderTop: "1px solid #EAE2D6" }}>
        <div className="flex items-end gap-3 rounded-2xl px-4 py-3" style={{ background: "#fff", border: "1px solid #EAE2D6" }}>
          <button
            onClick={() => fileRef.current?.click()}
            className="shrink-0 p-1.5 rounded-lg transition"
            style={{ color: "#9a8878" }}
            title="Upload image"
          >
            <ImagePlus className="w-4 h-4" />
          </button>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageSelect(f); }}
          />

          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
            }}
            placeholder="Ask a follow-up question..."
            rows={1}
            disabled={loading}
            className="flex-1 bg-transparent text-sm resize-none focus:outline-none leading-relaxed disabled:opacity-50"
            style={{ color: "#3D2C1E" }}
          />

          <button
            onClick={() => handleSend()}
            disabled={loading || (!input.trim() && !imageFile)}
            className="shrink-0 p-2 rounded-xl transition disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ background: "#C17B3A", color: "#fff" }}
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
        <p className="text-xs mt-2 text-center" style={{ color: "#c0b0a0" }}>Enter to send · Shift+Enter for newline</p>
      </div>
    </main>
  );
}
