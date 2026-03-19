import { Suspense } from "react"
import { BookAgGrid } from "@/components/book-ag-grid"
import { Skeleton } from "@/components/ui/skeleton"

export default function BooksPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Browse Books</h1>
        <p className="text-muted-foreground">Search and filter our collection with ease and find your next favorite book elegantly. </p>
      </div>

      <Suspense fallback={<BookGridSkeleton />}>
        <BookList />
      </Suspense>
    </div>
  )
}

async function BookList() {
  return <BookAgGrid />
}

function BookGridSkeleton() {
  return (
    <div className="mt-8">
      <Skeleton className="h-9 px-3 rounded-md w-64" />
      <Skeleton className="h-[600px] w-full rounded-lg mt-8" />
    </div>
  )
}

