"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Shortlist {
  id: string;
  name: string;
  clientName: string | null;
  campaignName: string | null;
  createdAt: string;
}

export default function ShortlistsPage() {
  const [shortlists, setShortlists] = useState<Shortlist[]>([]);
  const [name, setName] = useState("");
  const [clientName, setClientName] = useState("");

  async function load() {
    const response = await fetch("/api/shortlists");
    const body = await response.json();
    setShortlists(body.shortlists ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;

    await fetch("/api/shortlists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, clientName: clientName || null }),
    });

    setName("");
    setClientName("");
    load();
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-100">Shortlists</h1>

      <form onSubmit={handleCreate} className="mt-6 flex flex-wrap gap-3">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Shortlist name"
          className="rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm text-slate-200"
        />
        <input
          value={clientName}
          onChange={(event) => setClientName(event.target.value)}
          placeholder="Client (optional)"
          className="rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm text-slate-200"
        />
        <button type="submit" className="rounded-md bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-500">
          Create shortlist
        </button>
      </form>

      <div className="mt-6 divide-y divide-slate-800 rounded-xl border border-slate-800">
        {shortlists.map((shortlist) => (
          <Link
            key={shortlist.id}
            href={`/shortlists/${shortlist.id}`}
            className="flex items-center justify-between px-4 py-3 hover:bg-slate-900"
          >
            <div>
              <p className="text-sm text-slate-100">{shortlist.name}</p>
              <p className="text-xs text-slate-500">{shortlist.clientName ?? "No client set"}</p>
            </div>
            <p className="text-xs text-slate-500">{new Date(shortlist.createdAt).toLocaleDateString()}</p>
          </Link>
        ))}
        {shortlists.length === 0 && <p className="px-4 py-6 text-sm text-slate-500">No shortlists yet.</p>}
      </div>
    </div>
  );
}
