export default function LeadsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <nav className="flex items-center border-b border-gray-200 bg-white px-6 py-4">
        <span className="text-sm font-semibold tracking-wide text-slate-900">BUSINESS LEADS</span>
      </nav>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
