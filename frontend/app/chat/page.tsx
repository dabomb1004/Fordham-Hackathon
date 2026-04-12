"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Shield, Send, ImagePlus, X, Loader2, ShieldAlert, AlertTriangle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ValidationResult {
  brand_name: string;
  product_name: string;
  trust_score: number | null;
  verdict: string;
  certifications: string[];
  red_flags: string[];
  reviews_summary: string;
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
function ValidationCard({ v }: { v: ValidationResult }) {
  const isPending = v.verdict === "PENDING_VALIDATION";
  return (
    <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 p-4 flex flex-col gap-3 text-sm">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 font-semibold text-white">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{v.brand_name}{v.product_name ? ` · ${v.product_name}` : ""}</span>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${
          isPending
            ? "text-amber-400 border-amber-400/30 bg-amber-400/10"
            : v.verdict === "SAFE"
            ? "text-green-400 border-green-400/30 bg-green-400/10"
            : "text-red-400 border-red-400/30 bg-red-400/10"
        }`}>
          {v.verdict.replace("_", " ")}
        </span>
      </div>

      {(v.certifications ?? []).length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {(v.certifications ?? []).map((c) => (
            <span key={c} className="flex items-center gap-1 text-xs bg-green-500/10 text-green-300 border border-green-500/20 px-2 py-0.5 rounded-full">
              <CheckCircle2 className="w-3 h-3" />{c}
            </span>
          ))}
        </div>
      )}

      {(v.red_flags ?? []).length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {(v.red_flags ?? []).map((f) => (
            <span key={f} className="flex items-center gap-1 text-xs bg-red-500/10 text-red-300 border border-red-500/20 px-2 py-0.5 rounded-full">
              <AlertTriangle className="w-3 h-3" />{f}
            </span>
          ))}
        </div>
      )}

      <p className="text-white/50 text-xs leading-relaxed">{v.reviews_summary}</p>
      {v.stub && <p className="text-white/20 text-xs italic">Validation stub — Tavily lookup coming soon</p>}
    </div>
  );
}

// ── Quick action chips ───────────────────────────────────────────────────────
const CHIPS = [
  "Check for allergens",
  "Is this FDA approved?",
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

  // Global drag-over detection for the landing drop zone
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
      <main
        className="min-h-screen bg-black flex flex-col items-center justify-center px-4"
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        {/* Logo */}
        <div className="flex items-center gap-2 mb-12">
          <Shield className="w-6 h-6 text-amber-400" />
          <span className="text-white font-semibold text-lg tracking-tight">Guardia</span>
        </div>

        {/* Heading */}
        <div className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-3 tracking-tight">
            Is this product safe?
          </h1>
          <p className="text-white/40 text-base max-w-sm mx-auto">
            Drop a product photo or ask a question — I'll check ingredients, certifications, and flag anything that conflicts with your health profile.
          </p>
        </div>

        {/* Main input card */}
        <div className="w-full max-w-2xl">
          <div className={`rounded-3xl border transition-all duration-200 ${
            dragging
              ? "border-amber-400/60 bg-amber-400/5 shadow-[0_0_40px_rgba(251,191,36,0.1)]"
              : imageFile
              ? "border-white/20 bg-white/5"
              : "border-white/10 bg-[#1a1a1a]"
          }`}>
            {/* Image preview inside card */}
            {imagePreview && (
              <div className="px-5 pt-5">
                <div className="relative inline-block">
                  <img src={imagePreview} alt="preview" className="h-32 rounded-xl object-contain border border-white/10" />
                  <button
                    onClick={clearImage}
                    className="absolute -top-2 -right-2 bg-white/10 hover:bg-white/20 rounded-full p-1 transition"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              </div>
            )}

            {/* Drop zone (only when no image) */}
            {!imageFile && (
              <div
                onClick={() => fileRef.current?.click()}
                className="mx-5 mt-5 rounded-2xl border-2 border-dashed border-white/10 hover:border-white/20 cursor-pointer transition flex flex-col items-center justify-center py-8 gap-2"
              >
                <ImagePlus className="w-6 h-6 text-white/30" />
                <p className="text-white/30 text-sm">
                  {dragging ? "Drop it!" : "Drop a product photo, or click to browse"}
                </p>
              </div>
            )}

            {/* Text input row */}
            <div className="flex items-end gap-3 px-5 py-4">
              <button
                onClick={() => fileRef.current?.click()}
                className="shrink-0 p-2 rounded-xl text-white/30 hover:text-white/60 hover:bg-white/5 transition"
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
                className="flex-1 bg-transparent text-white placeholder-white/25 text-base resize-none focus:outline-none leading-relaxed"
                style={{ maxHeight: 120, overflowY: "auto" }}
              />

              <button
                onClick={() => handleSend()}
                disabled={!input.trim() && !imageFile}
                className="shrink-0 p-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-20 disabled:cursor-not-allowed text-black transition"
              >
                <Send className="w-4 h-4" />
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
                className="text-sm text-white/40 border border-white/10 rounded-full px-4 py-1.5 hover:border-white/30 hover:text-white/70 transition"
              >
                {chip}
              </button>
            ))}
          </div>
        </div>
      </main>
    );
  }

  // ── Chat view ─────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 px-5 py-4 border-b border-white/5">
        <Shield className="w-4 h-4 text-amber-400" />
        <span className="text-white font-semibold text-sm">Guardia</span>
        <span className="text-white/30 text-sm">— Product Safety</span>
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
                className="max-h-52 rounded-2xl object-contain border border-white/10 mb-2"
              />
            )}

            {/* Bubble */}
            {(msg.content && msg.content !== "(image)") && (
              <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-white/10 text-white rounded-br-sm"
                  : msg.askedQuestion
                  ? "bg-[#1a1a1a] text-white border border-amber-400/20 rounded-bl-sm"
                  : "bg-[#1a1a1a] text-white/90 rounded-bl-sm"
              }`}>
                {msg.askedQuestion && msg.role === "assistant" && (
                  <p className="text-xs text-amber-400 mb-1.5 font-medium">Guardia asks</p>
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
            <div className="bg-[#1a1a1a] rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-2 text-white/40 text-sm">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
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
            <img src={imagePreview} alt="preview" className="h-16 rounded-xl object-contain border border-white/10" />
            <button onClick={clearImage} className="absolute -top-2 -right-2 bg-white/10 hover:bg-white/20 rounded-full p-1 transition">
              <X className="w-3 h-3 text-white" />
            </button>
          </div>
        </div>
      )}

      {/* Input bar */}
      <div className="border-t border-white/5 px-4 py-4 max-w-2xl w-full mx-auto">
        <div className="flex items-end gap-3 bg-[#1a1a1a] border border-white/10 rounded-2xl px-4 py-3">
          <button
            onClick={() => fileRef.current?.click()}
            className="shrink-0 p-1.5 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/5 transition"
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
            className="flex-1 bg-transparent text-white placeholder-white/25 text-sm resize-none focus:outline-none leading-relaxed disabled:opacity-50"
            style={{ maxHeight: 120, overflowY: "auto" }}
          />

          <button
            onClick={() => handleSend()}
            disabled={loading || (!input.trim() && !imageFile)}
            className="shrink-0 p-2 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-20 disabled:cursor-not-allowed text-black transition"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
        <p className="text-white/15 text-xs mt-2 text-center">Enter to send · Shift+Enter for newline</p>
      </div>
    </main>
  );
}
