"use client";

import { useEffect, useRef } from "react";

interface ConfirmModalProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  tone?: "default" | "danger";
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Shared confirmation surface for admin destructive/high-impact actions (suspend, role change,
 * state-machine overrides). Traps Escape-to-cancel and focuses the confirm button on open so
 * keyboard users aren't stranded on the trigger element behind the overlay. */
export function ConfirmModal({ open, title, description, confirmLabel = "Confirm", tone = "default", busy, onConfirm, onCancel }: ConfirmModalProps) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    confirmRef.current?.focus();
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-oc-lg border border-oc-border bg-oc-card p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="confirm-modal-title" className="text-sm font-semibold text-oc-ink">
          {title}
        </h2>
        <p className="mt-2 text-sm text-oc-ink-muted">{description}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-oc-input border border-oc-border px-3.5 py-1.5 text-sm hover:bg-oc-bg"
          >
            Cancel
          </button>
          <button
            ref={confirmRef}
            type="button"
            disabled={busy}
            onClick={onConfirm}
            className={`rounded-oc-input px-3.5 py-1.5 text-sm font-medium text-white disabled:opacity-50 ${
              tone === "danger" ? "bg-red-600 hover:bg-red-700" : "bg-oc-600 hover:bg-oc-700"
            }`}
          >
            {busy ? "Working…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
