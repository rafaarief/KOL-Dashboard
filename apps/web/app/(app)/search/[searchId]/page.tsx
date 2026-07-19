"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { CreatorCard, type CreatorResultRow } from "@/components/CreatorCard";

interface SearchRow {
  id: string;
  originalQuery: string;
  status: string;
  progressStep: string | null;
  progressPercentage: number;
  candidateVideoCount: number;
  qualifyingVideoCount: number;
  creatorCount: number;
  errorCount: number;
}

const PROGRESS_STEPS = [
  "generating_keywords",
  "deduplicating_creators",
  "inspecting_profiles",
  "completed",
];

const STEP_LABELS: Record<string, string> = {
  generating_keywords: "Searching TikTok keywords",
  deduplicating_creators: "Deduplicating candidate creators",
  inspecting_profiles: "Inspecting creator profiles",
  completed: "Completed",
};

const SORT_OPTIONS = [
  { value: "best_match", label: "Best match" },
  { value: "most_recent", label: "Most recent upload" },
  { value: "highest_views", label: "Highest relevant-video views" },
  { value: "highest_followers", label: "Highest followers" },
  { value: "lowest_followers", label: "Lowest followers" },
];

export default function SearchResultsPage() {
  const params = useParams<{ searchId: string }>();
  const [search, setSearch] = useState<SearchRow | null>(null);
  const [results, setResults] = useState<CreatorResultRow[]>([]);
  const [sort, setSort] = useState("best_match");
  const [minimumScore, setMinimumScore] = useState("");
  const [niche, setNiche] = useState("");

  useEffect(() => {
    let isCancelled = false;

    async function poll() {
      const response = await fetch(`/api/searches/${params.searchId}`);
      if (!response.ok || isCancelled) return;
      const body = await response.json();
      setSearch(body.search);

      if (!["completed", "failed", "cancelled"].includes(body.search.status)) {
        setTimeout(poll, 2000);
      }
    }

    poll();
    return () => {
      isCancelled = true;
    };
  }, [params.searchId]);

  useEffect(() => {
    const query = new URLSearchParams({ sort });
    if (minimumScore) query.set("minimumScore", minimumScore);
    if (niche) query.set("niche", niche);

    fetch(`/api/searches/${params.searchId}/results?${query.toString()}`)
      .then((res) => res.json())
      .then((body) => setResults(body.results ?? []));
  }, [params.searchId, sort, minimumScore, niche, search?.status]);

  const activeStepIndex = useMemo(
    () => (search?.progressStep ? PROGRESS_STEPS.indexOf(search.progressStep) : -1),
    [search?.progressStep]
  );

  async function handleCancel() {
    await fetch(`/api/searches/${params.searchId}/cancel`, { method: "POST" });
  }

  if (!search) {
    return <p className="text-slate-500">Loading search...</p>;
  }

  const isRunning = !["completed", "failed", "cancelled"].includes(search.status);

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">&ldquo;{search.originalQuery}&rdquo;</h1>
          <p className="mt-1 text-sm text-slate-500">
            {search.creatorCount} creators ranked · {search.qualifyingVideoCount} of {search.candidateVideoCount} candidate
            videos met the view threshold
            {search.errorCount > 0 ? ` · ${search.errorCount} steps failed but did not stop the search` : ""}
          </p>
        </div>
        <a
          href={`/api/searches/${params.searchId}/export.csv`}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-800 hover:border-indigo-500"
        >
          Export CSV
        </a>
      </div>

      {isRunning && (
        <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-700">{STEP_LABELS[search.progressStep ?? ""] ?? "Interpreting query"}</p>
            <button onClick={handleCancel} className="text-xs text-slate-500 hover:text-red-600">
              Cancel search
            </button>
          </div>
          <div className="mt-3 flex gap-1">
            {PROGRESS_STEPS.map((step, index) => (
              <div
                key={step}
                className={`h-1.5 flex-1 rounded-full ${index <= activeStepIndex ? "bg-indigo-500" : "bg-slate-200"}`}
              />
            ))}
          </div>
        </div>
      )}

      {search.status === "failed" && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          This search stopped early ({search.progressStep}). No CAPTCHA or access-control bypass was attempted — try again
          later or narrow the query.
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        <select value={sort} onChange={(event) => setSort(event.target.value)} className="rounded-md border border-slate-300 bg-slate-50 px-3 py-1.5 text-sm text-slate-800">
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <input
          value={minimumScore}
          onChange={(event) => setMinimumScore(event.target.value)}
          placeholder="Min match %"
          className="w-32 rounded-md border border-slate-300 bg-slate-50 px-3 py-1.5 text-sm text-slate-800"
        />
        <input
          value={niche}
          onChange={(event) => setNiche(event.target.value)}
          placeholder="Niche"
          className="w-48 rounded-md border border-slate-300 bg-slate-50 px-3 py-1.5 text-sm text-slate-800"
        />
      </div>

      <div className="mt-6 space-y-4">
        {results.length === 0 && !isRunning && <p className="text-slate-500">No creators matched yet. Try loosening the filters.</p>}
        {results.map((row) => (
          <CreatorCard key={row.result.id} row={row} />
        ))}
      </div>
    </div>
  );
}
