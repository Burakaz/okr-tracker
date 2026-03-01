interface V2SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
}

export function V2Skeleton({ className = "", width, height }: V2SkeletonProps) {
  return (
    <div
      className={`v2-skeleton ${className}`}
      style={{ width, height }}
    />
  );
}

export function V2SkeletonRow() {
  return (
    <div className="flex items-center gap-3 px-3 py-2">
      <div className="v2-skeleton w-4 h-4 rounded" />
      <div className="v2-skeleton h-3 flex-1 max-w-[160px] rounded" />
      <div className="v2-skeleton h-2 w-16 rounded ml-auto" />
    </div>
  );
}

export function V2SkeletonDashboard() {
  return (
    <div className="p-6 space-y-6">
      {/* Hero skeleton */}
      <div className="space-y-3">
        <div className="v2-skeleton h-6 w-32 rounded" />
        <div className="v2-skeleton h-3 w-48 rounded" />
        <div className="v2-skeleton h-[2px] w-full rounded-full" />
      </div>
      {/* Stats skeleton */}
      <div className="v2-skeleton h-4 w-64 rounded" />
      {/* Rows skeleton */}
      <div className="space-y-1">
        <div className="v2-skeleton h-3 w-20 rounded mb-2" />
        {[...Array(3)].map((_, i) => (
          <V2SkeletonRow key={i} />
        ))}
      </div>
    </div>
  );
}
