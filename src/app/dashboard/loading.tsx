export default function DashboardLoading() {
  return (
    <div className="h-full flex flex-col">
      {/* Header skeleton */}
      <div className="h-14 flex items-center justify-between px-6 border-b border-cream-300/50">
        <div className="flex items-center gap-4 flex-1">
          <div className="skeleton-wave h-7 w-20 rounded-lg" />
          <div className="flex-1 max-w-md">
            <div className="skeleton-wave h-9 w-full rounded-lg" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="skeleton-wave h-8 w-24 rounded-lg" />
          <div className="skeleton-wave h-8 w-28 rounded-lg" />
          <div className="skeleton-wave h-8 w-8 rounded-lg" />
          <div className="skeleton-wave h-7 w-7 rounded-full" />
        </div>
      </div>

      {/* Table skeleton */}
      <div className="flex-1 overflow-y-auto">
        <div className="card mx-6 mt-4 overflow-hidden">
          {/* Table header */}
          <div className="flex items-center gap-4 px-4 py-3 bg-cream-50 border-b border-cream-300">
            <div className="skeleton-wave h-3 w-32 rounded" />
            <div className="skeleton-wave h-3 w-20 rounded" />
            <div className="skeleton-wave h-3 w-24 rounded" />
            <div className="skeleton-wave h-3 w-16 rounded" />
            <div className="skeleton-wave h-3 w-16 rounded" />
            <div className="skeleton-wave h-3 w-16 rounded" />
            <div className="skeleton-wave h-3 w-8 rounded" />
          </div>

          {/* Table rows */}
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 px-4 py-3 border-b border-cream-300 last:border-0"
            >
              <div className="skeleton-wave h-4 w-48 rounded" />
              <div className="skeleton-wave h-5 w-20 rounded-full" />
              <div className="skeleton-wave h-2 w-24 rounded-full" />
              <div className="skeleton-wave h-5 w-10 rounded-full" />
              <div className="skeleton-wave h-5 w-16 rounded-full" />
              <div className="skeleton-wave h-4 w-16 rounded" />
              <div className="skeleton-wave h-4 w-4 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
