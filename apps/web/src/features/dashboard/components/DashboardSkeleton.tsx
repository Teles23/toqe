import React from "react";
import { Skeleton } from "@/shared/ui/skeleton";

/** Placeholder enquanto `useDashboardOverview` está em loading. */
export function DashboardSkeleton(): React.JSX.Element {
  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-44 rounded-xl" />
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
      <Skeleton className="h-56 rounded-xl" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-14 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
