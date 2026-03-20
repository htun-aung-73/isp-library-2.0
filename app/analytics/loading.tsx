import { Skeleton } from "@/components/ui/skeleton"

export default function AnalyticsLoading() {
  return (
    <div className="container mx-auto px-4 py-12 space-y-10">
      {/* Header Skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-6 w-80" />
      </div>

      {/* Analytics Charts Skeleton */}
      <div className="grid gap-8">
        <Skeleton className="h-[450px] w-full rounded-xl" />
        <div className="grid md:grid-cols-2 gap-8">
          <Skeleton className="h-[400px] w-full rounded-xl" />
          <Skeleton className="h-[400px] w-full rounded-xl" />
        </div>
      </div>
    </div>
  )
}
