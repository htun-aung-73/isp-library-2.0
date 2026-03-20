import { Skeleton } from "@/components/ui/skeleton"

export default function AuthorsLoading() {
  return (
    <div className="container mx-auto px-4 py-12 space-y-8">
      {/* Header Skeleton */}
      <div className="space-y-3">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-6 w-96" />
      </div>

      {/* Authors List Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    </div>
  )
}
