import type { Ebook } from "./types"

export interface BrowseResult {
  items: Ebook[]
  totalPages: number
  totalResults: number
  page: number
}

// Case-insensitive search over title/author/publisher, then slice to a page.
// Clamps page into [1, totalPages].
export function filterAndPaginate(
  ebooks: Ebook[],
  query: string,
  page: number,
  pageSize: number,
): BrowseResult {
  const q = query.trim().toLowerCase()
  const filtered = q
    ? ebooks.filter((e) =>
        [e.title, e.author, e.publisher]
          .filter((f): f is string => Boolean(f))
          .some((f) => f.toLowerCase().includes(q)),
      )
    : ebooks

  const totalResults = filtered.length
  const totalPages = Math.max(1, Math.ceil(totalResults / pageSize))
  const safePage = Math.min(Math.max(1, page), totalPages)
  const start = (safePage - 1) * pageSize
  const items = filtered.slice(start, start + pageSize)

  return { items, totalPages, totalResults, page: safePage }
}
