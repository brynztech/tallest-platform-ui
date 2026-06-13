export default function ShellLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Phase 1: structural placeholder — sidebar nav and header added in Phase 2
  // NEVER add data fetching here — it would block the entire console render
  return (
    <div className="flex min-h-screen flex-col">
      {/* Sidebar nav placeholder — Phase 2 (CUX-01, CUX-02, CUX-03) */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}
