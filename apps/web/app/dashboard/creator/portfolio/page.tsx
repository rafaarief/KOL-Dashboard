"use client";

import { useEffect, useState } from "react";
import { OcButton, OcCard } from "@/components/oc/primitives";

interface PortfolioItem {
  id: string;
  title: string;
  description: string | null;
  linkUrl: string | null;
}

export default function CreatorPortfolioPage() {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [linkUrl, setLinkUrl] = useState("");

  function load() {
    fetch("/api/creator/portfolio")
      .then((res) => res.json())
      .then((body) => setItems(body.results ?? []));
  }

  useEffect(load, []);

  async function handleAdd(event: React.FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;
    await fetch("/api/creator/portfolio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description: description || undefined, linkUrl: linkUrl || undefined }),
    });
    setTitle("");
    setDescription("");
    setLinkUrl("");
    load();
  }

  async function handleDelete(id: string) {
    await fetch("/api/creator/portfolio", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    load();
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-lg font-semibold text-oc-ink">Portfolio</h1>

      <OcCard className="mt-4 divide-y divide-oc-border">
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between px-4 py-3 text-sm">
            <div>
              <p className="font-medium text-oc-ink">{item.title}</p>
              {item.description && <p className="text-xs text-oc-ink-muted">{item.description}</p>}
            </div>
            <button onClick={() => handleDelete(item.id)} className="text-xs text-red-600 hover:underline">
              Remove
            </button>
          </div>
        ))}
        {items.length === 0 && <p className="px-4 py-6 text-sm text-oc-ink-muted">No portfolio items added yet.</p>}
      </OcCard>

      <form onSubmit={handleAdd} className="mt-4 space-y-3 rounded-oc border border-oc-border bg-oc-card p-4">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="w-full rounded-oc-input border border-oc-border bg-oc-bg px-3 py-2 text-sm" />
        <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" className="w-full rounded-oc-input border border-oc-border bg-oc-bg px-3 py-2 text-sm" />
        <input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="Link (https://...)" className="w-full rounded-oc-input border border-oc-border bg-oc-bg px-3 py-2 text-sm" />
        <OcButton type="submit">Add Portfolio Item</OcButton>
      </form>
    </div>
  );
}
