"use client";

import { useState, useRef } from "react";
import { Upload, Link, Shield, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { ResultsPanel } from "@/components/ResultsPanel";

type AppState = "input" | "loading" | "results";

export default function Home() {
  const [state, setState] = useState<AppState>("input");
  const [url, setUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [results, setResults] = useState<any>(null);
  const [loadingStep, setLoadingStep] = useState("Analyzing...");
  const fileRef = useRef<HTMLInputElement>(null);

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleImageSelect = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setUrl("");
  };

  const handleValidate = async () => {
    if (!url && !imageFile) {
      toast.error("Please enter a URL or upload a screenshot.");
      return;
    }
    setState("loading");

    try {
      let data;
      if (imageFile) {
        setLoadingStep("Reading screenshot...");
        const form = new FormData();
        form.append("file", imageFile);
        const res = await fetch("/api/backend/validate/image", { method: "POST", body: form });
        if (!res.ok) throw new Error(await res.text());
        data = await res.json();
      } else {
        setLoadingStep("Scraping page & searching sources...");
        const form = new FormData();
        form.append("url", url);
        const res = await fetch("/api/backend/validate/url", { method: "POST", body: form });
        if (!res.ok) throw new Error(await res.text());
        data = await res.json();
      }
      setResults(data);
      setState("results");
    } catch (err: any) {
      toast.error(err.message || "Something went wrong. Is the backend running?");
      setState("input");
    }
  };

  if (state === "results" && results) {
    return <ResultsPanel results={results} onReset={() => { setState("input"); setResults(null); clearImage(); setUrl(""); }} />;
  }

  return (
    <main className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-4">
      {/* Header */}
      <div className="mb-10 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Shield className="w-8 h-8 text-blue-400" />
          <h1 className="text-4xl font-bold text-white">TruthLens</h1>
        </div>
        <p className="text-gray-400 text-lg max-w-md">
          Paste a link or drop a screenshot — we validate it against trusted sources instantly.
        </p>
      </div>

      {/* Card */}
      <div className="w-full max-w-xl bg-gray-900 rounded-2xl border border-gray-800 p-8 flex flex-col gap-6 shadow-2xl">

        {/* URL input */}
        <div className="flex flex-col gap-2">
          <label className="text-sm text-gray-400 font-medium flex items-center gap-1.5">
            <Link className="w-4 h-4" /> Paste a URL
          </label>
          <input
            type="url"
            value={url}
            onChange={(e) => { setUrl(e.target.value); clearImage(); }}
            placeholder="https://example.com/article"
            disabled={!!imageFile || state === "loading"}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-40 transition"
          />
        </div>

        <div className="flex items-center gap-3 text-gray-600 text-sm">
          <div className="flex-1 h-px bg-gray-800" />
          or
          <div className="flex-1 h-px bg-gray-800" />
        </div>

        {/* Drop zone */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleImageSelect(f); }}
          onClick={() => !imageFile && fileRef.current?.click()}
          className={`relative rounded-xl border-2 border-dashed transition cursor-pointer flex flex-col items-center justify-center gap-3 py-8 ${
            imageFile ? "border-blue-500 bg-blue-950/20" : "border-gray-700 hover:border-gray-500 bg-gray-800/30"
          }`}
        >
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageSelect(f); }} />
          {imagePreview ? (
            <>
              <img src={imagePreview} alt="preview" className="max-h-48 rounded-lg object-contain" />
              <button onClick={(e) => { e.stopPropagation(); clearImage(); }} className="absolute top-3 right-3 bg-gray-700 hover:bg-gray-600 rounded-full p-1 transition">
                <X className="w-4 h-4 text-white" />
              </button>
            </>
          ) : (
            <>
              <Upload className="w-8 h-8 text-gray-500" />
              <p className="text-gray-400 text-sm text-center">
                Drag & drop a screenshot here<br />
                <span className="text-gray-600">or click to browse</span>
              </p>
            </>
          )}
        </div>

        {/* Validate button */}
        <button
          onClick={handleValidate}
          disabled={(!url && !imageFile) || state === "loading"}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-lg py-3 flex items-center justify-center gap-2 transition"
        >
          {state === "loading" ? (
            <><Loader2 className="w-4 h-4 animate-spin" />{loadingStep}</>
          ) : (
            <><Shield className="w-4 h-4" />Validate</>
          )}
        </button>
      </div>

      <p className="mt-6 text-gray-600 text-xs">Powered by Tavily · Claude · TruthLens</p>
    </main>
  );
}
