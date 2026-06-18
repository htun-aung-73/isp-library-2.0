import type { Ebook } from "./types"

export interface BrowseResult {
  items: Ebook[]
  totalPages: number
  totalResults: number
  page: number
}

// Distinct, non-empty author names, case-insensitively de-duped, sorted A→Z.
// Used to populate the author filter dropdown.
export function uniqueAuthors(ebooks: Ebook[]): string[] {
  const seen = new Map<string, string>()
  for (const e of ebooks) {
    const a = e.author?.trim()
    if (!a) continue
    const key = a.toLowerCase()
    if (!seen.has(key)) seen.set(key, a)
  }
  return Array.from(seen.values()).sort((a, b) => a.localeCompare(b))
}

// Distinct publication years present in the catalog, newest first.
// Used to populate the year filter dropdown.
export function uniqueYears(ebooks: Ebook[]): number[] {
  const seen = new Set<number>()
  for (const e of ebooks) {
    if (e.year != null) seen.add(e.year)
  }
  return Array.from(seen).sort((a, b) => b - a)
}

// Case-insensitive search over title/author/publisher, optional exact-author
// and exact-year filters, then slice to a page. Clamps page into [1, totalPages].
// `author === ""` and `year === null` mean "no filter".
export function filterAndPaginate(
  ebooks: Ebook[],
  query: string,
  author: string,
  year: number | null,
  page: number,
  pageSize: number,
): BrowseResult {
  const q = query.trim().toLowerCase()
  const a = author.trim().toLowerCase()

  const filtered = ebooks.filter((e) => {
    if (a && e.author?.trim().toLowerCase() !== a) return false
    if (year != null && e.year !== year) return false
    if (!q) return true
    return [e.title, e.author, e.publisher]
      .filter((f): f is string => Boolean(f))
      .some((f) => f.toLowerCase().includes(q))
  })

  const totalResults = filtered.length
  const totalPages = Math.max(1, Math.ceil(totalResults / pageSize))
  const safePage = Math.min(Math.max(1, page), totalPages)
  const start = (safePage - 1) * pageSize
  const items = filtered.slice(start, start + pageSize)

  return { items, totalPages, totalResults, page: safePage }
}
