export default function Loading() {
  return (
    <div className="space-y-5 pb-2">
      <div className="surface-card px-4 py-4">
        <div className="h-4 w-32 animate-pulse rounded bg-[color:var(--background-muted)]" />
        <div className="mt-2 h-8 w-48 animate-pulse rounded bg-[color:var(--background-muted)]" />
      </div>

      <div className="surface-card p-4">
        <div className="h-6 w-24 animate-pulse rounded bg-[color:var(--background-muted)]" />
      </div>

      <div className="grid grid-cols-1 gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="surface-card p-4">
            <div className="mb-2 h-6 w-3/4 animate-pulse rounded bg-[color:var(--background-muted)]" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-[color:var(--background-muted)]" />
          </div>
        ))}
      </div>
    </div>
  );
}
