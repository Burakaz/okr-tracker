"use client";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = "" }: SkeletonProps) {
  return <div className={`skeleton-wave rounded ${className}`} />;
}

/** Skeleton for OKR list table */
export function OKRListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="card mx-6 mt-4 overflow-hidden">
      {/* Table header skeleton */}
      <div className="flex items-center gap-4 px-4 py-3 bg-cream-50 border-b border-cream-300">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-8" />
      </div>

      {/* Table rows skeleton */}
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 px-4 py-3 border-b border-cream-300 last:border-0"
        >
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-2 w-24 rounded-full" />
          <Skeleton className="h-5 w-10 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-4 rounded" />
        </div>
      ))}
    </div>
  );
}

/** Skeleton for OKR detail panel */
export function OKRDetailSkeleton() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="space-y-3">
        <Skeleton className="h-6 w-3/4" />
        <div className="flex gap-2">
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      </div>

      {/* Overview section */}
      <div className="space-y-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-16 w-full rounded-lg" />
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-3 w-full rounded-full" />
      </div>

      {/* Key Results */}
      <div className="space-y-3">
        <Skeleton className="h-4 w-28" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-3 bg-cream-50 rounded-lg space-y-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-2 w-full rounded-full" />
            <div className="flex justify-between">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-3 w-12" />
            </div>
          </div>
        ))}
      </div>

      {/* Check-in History */}
      <div className="space-y-3">
        <Skeleton className="h-4 w-32" />
        {[1, 2].map((i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-12 w-full rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
