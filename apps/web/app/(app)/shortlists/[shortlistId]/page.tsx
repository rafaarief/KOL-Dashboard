"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

const STATUSES = [
  "Discovered",
  "Reviewed",
  "Shortlisted",
  "Ready to Contact",
  "Contacted",
  "Replied",
  "Negotiating",
  "Accepted",
  "Rejected",
  "Campaign Completed",
];

interface Entry {
  entry: {
    id: string;
    status: string;
    internalNotes: string | null;
  };
  creator: {
    id: string;
    username: string;
    displayName: string | null;
    profileUrl: string;
    primaryNiche: string | null;
    followerCount: number | null;
  };
}

export default function ShortlistDetailPage() {
  const params = useParams<{ shortlistId: string }>();
  const [entries, setEntries] = useState<Entry[]>([]);

  async function load() {
    const response = await fetch(`/api/shortlists/${params.shortlistId}/creators`);
    const body = await response.json();
    setEntries(body.entries ?? []);
  }

  useEffect(() => {
    load();
  }, [params.shortlistId]);

  async function updateEntry(entryId: string, updates: Record<string, unknown>) {
    await fetch(`/api/shortlists/${params.shortlistId}/creators/${entryId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-100">Shortlist creators</h1>

      <div className="mt-6 space-y-3">
        {entries.map(({ entry, creator }) => (
          <div key={entry.id} className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-100">{creator.displayName ?? creator.username}</p>
                <a href={creator.profileUrl} target="_blank" rel="noreferrer" className="text-xs text-slate-500 hover:text-indigo-400">
                  @{creator.username}
                </a>
              </div>
              <select
                defaultValue={entry.status}
                onChange={(event) => updateEntry(entry.id, { status: event.target.value })}
                className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-200"
              >
                {STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
            <textarea
              defaultValue={entry.internalNotes ?? ""}
              onBlur={(event) => updateEntry(entry.id, { internalNotes: event.target.value })}
              placeholder="Internal notes..."
              rows={2}
              className="mt-3 w-full resize-none rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200"
            />
          </div>
        ))}
        {entries.length === 0 && <p className="text-sm text-slate-500">No creators saved to this shortlist yet.</p>}
      </div>
    </div>
  );
}
