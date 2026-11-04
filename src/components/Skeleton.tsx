function Bar({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-2xl bg-track ${className}`} />
}

export function Skeleton() {
  return (
    <div className="min-h-dvh lg:flex" aria-busy="true" aria-label="Loading Task Tango" role="status">
      <aside className="hidden h-dvh w-[280px] shrink-0 flex-col gap-3 border-r border-line px-4 py-6 lg:flex">
        <Bar className="mb-4 h-10 w-44" />
        {[0, 1, 2, 3, 4].map((i) => (
          <Bar key={i} className="h-10 w-full" />
        ))}
      </aside>
      <main className="mx-auto w-full max-w-[760px] flex-1 space-y-4 px-4 pt-8 sm:px-6 lg:px-10 lg:pt-12">
        <Bar className="h-4 w-48" />
        <Bar className="h-12 w-56" />
        <Bar className="h-12 w-full" />
        <Bar className="h-28 w-full" />
        <Bar className="h-20 w-full" />
        <Bar className="h-20 w-full" />
      </main>
    </div>
  )
}
