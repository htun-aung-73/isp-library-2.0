import { Skeleton } from "@/components/ui/skeleton"

export default function BooksLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Skeleton className="h-10 w-48 mb-2" />
        <Skeleton className="h-5 w-90" />
      </div>

      <div className="mt-8">
        <Skeleton className="h-[600px] w-full rounded-lg" />
      </div>
    </div>
  )
}
