"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const EXAMPLE_QUERIES = [
  "photobooth blok m",
  "food reviewer bandung",
  "micro KOL beauty jakarta",
  "creator jogja yang bahas tempat nongkrong",
  "cari creator aktif 14 hari terakhir dengan minimal 20 ribu views",
];

export default function SearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!query.trim()) return;

    setIsSubmitting(true);
    setError(null);

    const response = await fetch("/api/searches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      setIsSubmitting(false);
      setError("Could not start this search. Please try again.");
      return;
    }

    const body = await response.json();
    router.push(`/search/${body.searchId}`);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold text-slate-100">Find TikTok creators</h1>
      <p className="mt-2 text-sm text-slate-400">
        Describe who you&apos;re looking for, in Indonesian or English — like you&apos;re briefing a sourcing specialist.
      </p>

      <form onSubmit={handleSubmit} className="mt-6">
        <textarea
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="photobooth blok m"
          rows={3}
          className="w-full resize-none rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-indigo-500"
        />
        {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-3 rounded-lg bg-indigo-600 px-5 py-2 font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
        >
          {isSubmitting ? "Starting search..." : "Search"}
        </button>
      </form>

      <div className="mt-8">
        <p className="text-xs uppercase tracking-wide text-slate-500">Try something like</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {EXAMPLE_QUERIES.map((example) => (
            <button
              key={example}
              onClick={() => setQuery(example)}
              className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300 hover:border-indigo-500 hover:text-indigo-300"
              type="button"
            >
              {example}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
