"use client"

import { useCallback, useMemo, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { EbookPreviewModal } from "@/components/ebook-preview-modal"
import { filterAndPaginate } from "@/lib/ebooks/browse"
import type { Ebook } from "@/lib/ebooks/types"

const PAGE_SIZE = 24

export function EbookBrowse({ ebooks }: { ebooks: Ebook[] }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [query, setQuery] = useState("")
  const [page, setPage] = useState(1)

  const result = useMemo(
    () => filterAndPaginate(ebooks, query, page, PAGE_SIZE),
    [ebooks, query, page],
  )

  const selectedId = searchParams.get("book")
  const selectedEbook = useMemo(
    () => (selectedId ? ebooks.find((e) => e.id === selectedId) ?? null : null),
    [ebooks, selectedId],
  )

  const openBook = useCallback(
    (id: string) => {
      router.push(`${pathname}?book=${encodeURIComponent(id)}`, { scroll: false })
    },
    [router, pathname],
  )

  const closeBook = useCallback(() => {
    router.push(pathname, { scroll: false })
  }, [router, pathname])

  return (
    <div>
      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setPage(1)
          }}
          placeholder="Search by title, author, or publisher…"
          className="pl-9"
          aria-label="Search ebooks"
        />
      </div>

      <p className="text-sm text-muted-foreground mb-4">
        {result.totalResults} ebook{result.totalResults === 1 ? "" : "s"}
      </p>

      {result.items.length === 0 ? (
        <p className="text-muted-foreground py-12 text-center">No ebooks match your search.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {result.items.map((ebook) => (
            <Card
              key={ebook.id}
              onClick={() => openBook(ebook.id)}
              className="p-4 cursor-pointer hover:border-primary transition-colors flex flex-col gap-2"
            >
              <h3 className="font-medium line-clamp-2">{ebook.title}</h3>
              {ebook.author && <p className="text-sm text-muted-foreground">{ebook.author}</p>}
              <div className="mt-auto flex flex-wrap gap-2 pt-2 text-xs">
                {ebook.publisher && <Badge variant="secondary">{ebook.publisher}</Badge>}
                {ebook.year && <Badge variant="outline">{ebook.year}</Badge>}
                {!ebook.available && <Badge variant="destructive">No preview</Badge>}
              </div>
            </Card>
          ))}
        </div>
      )}

      {result.totalPages > 1 && (
        <Pagination className="mt-8">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  setPage((p) => Math.max(1, p - 1))
                }}
              />
            </PaginationItem>
            <PaginationItem>
              <span className="px-4 text-sm">
                Page {result.page} of {result.totalPages}
              </span>
            </PaginationItem>
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  setPage((p) => Math.min(result.totalPages, p + 1))
                }}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      <EbookPreviewModal ebook={selectedEbook} open={selectedEbook !== null} onClose={closeBook} />
    </div>
  )
}
