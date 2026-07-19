"use client";

import { useEffect, useState } from "react";

interface Shortlist {
  id: string;
  name: string;
}

export function SaveToShortlistButton({ creatorId, searchResultId }: { creatorId: string; searchResultId: string }) {
  const [shortlists, setShortlists] = useState<Shortlist[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    fetch("/api/shortlists")
      .then((res) => res.json())
      .then((body) => setShortlists(body.shortlists ?? []));
  }, [isOpen]);

  async function saveToShortlist(shortlistId: string) {
    await fetch(`/api/shortlists/${shortlistId}/creators`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ creatorId, searchResultId }),
    });
    setIsOpen(false);
    setSavedMessage("Saved");
    setTimeout(() => setSavedMessage(null), 2000);
  }

  async function createShortlistAndSave() {
    const name = window.prompt("New shortlist name");
    if (!name) return;

    const response = await fetch("/api/shortlists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const body = await response.json();
    await saveToShortlist(body.shortlist.id);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-800 hover:border-indigo-500"
      >
        {savedMessage ?? "Save Creator"}
      </button>

      {isOpen && (
        <div className="absolute right-0 z-10 mt-1 w-48 rounded-md border border-slate-300 bg-slate-50 p-1 shadow-lg">
          {shortlists.map((shortlist) => (
            <button
              key={shortlist.id}
              type="button"
              onClick={() => saveToShortlist(shortlist.id)}
              className="block w-full rounded px-2 py-1 text-left text-xs text-slate-800 hover:bg-slate-100"
            >
              {shortlist.name}
            </button>
          ))}
          <button
            type="button"
            onClick={createShortlistAndSave}
            className="block w-full rounded px-2 py-1 text-left text-xs text-indigo-600 hover:bg-slate-100"
          >
            + New shortlist
          </button>
        </div>
      )}
    </div>
  );
}
