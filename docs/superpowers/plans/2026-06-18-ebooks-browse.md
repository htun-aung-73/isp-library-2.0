# Ebook Browse Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a logged-in-only `/ebooks` page that browses ebook metadata from a private Google Sheet and opens a Google Drive preview + download in a modal.

**Architecture:** Server reads the Sheet via Sheets API v4 (service-account JWT), maps rows to `Ebook[]`, and caches with `unstable_cache` (time-based revalidate). A client component does in-memory search + pagination over the full list (Layout C, ~24/page). Clicking a card sets `?book=<id>` and opens a shadcn `Dialog` containing the Drive preview iframe + download button. No database table.

**Tech Stack:** Next.js 16 (App Router, RSC), TypeScript, `google-auth-library` (new dep), shadcn/ui (Dialog, Input, Card, Badge, Pagination, Skeleton), Tailwind v4, lucide-react.

**Spec:** `docs/superpowers/specs/2026-06-18-ebooks-browse-design.md`

**Testing note:** This project has no test runner and the spec defers automated tests for v1. Pure helpers are verified with throwaway `npx tsx` scripts (no new dependency — `tsx` is already in devDependencies) that are run and then deleted before commit. UI is verified manually in the browser. Type safety is checked with `npx tsc --noEmit`.

---

## File Structure

| File | Create/Modify | Responsibility |
|---|---|---|
| `lib/ebooks/types.ts` | Create | `Ebook` type |
| `lib/ebooks/drive.ts` | Create | Pure Drive URL helpers (`extractDriveFileId`, `drivePreviewUrl`, `driveDownloadUrl`) |
| `lib/ebooks/sheet.ts` | Create | Service-account auth + raw row fetch (server-only) |
| `lib/ebooks/index.ts` | Create | `mapRowToEbook`, cached `getEbooks`, `getEbookById` |
| `lib/ebooks/browse.ts` | Create | Pure `filterAndPaginate` |
| `components/ebook-preview-modal.tsx` | Create | Dialog with Drive preview iframe + download |
| `components/ebook-browse.tsx` | Create | Client: search, pagination, card grid, `?book=` sync |
| `app/ebooks/page.tsx` | Create | Server page: `getEbooks()` → `<EbookBrowse>` |
| `app/ebooks/loading.tsx` | Create | Skeleton |
| `proxy.ts` | Modify | Add `/ebooks` to `protectedPaths` |
| `components/header.tsx` | Modify | Desktop nav "Ebooks" link |
| `components/mobile-nav.tsx` | Modify | Mobile nav "Ebooks" route |
| `.env.example` | Modify | New Google env vars |

---

## Task 1: Install dependency and document env

**Files:**
- Modify: `package.json` (via pnpm)
- Modify: `.env.example`

- [ ] **Step 1: Install google-auth-library**

Run: `pnpm add google-auth-library`
Expected: package added to `dependencies`, `pnpm-lock.yaml` updated.

- [ ] **Step 2: Append new env vars to `.env.example`**

Add these lines to the end of `.env.example`:

```env

# Google Sheets (ebooks catalog) — service account with Sheets API enabled
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEET_ID=your_spreadsheet_id
GOOGLE_SHEET_RANGE=Ebooks!A2:F
EBOOKS_REVALIDATE_SECONDS=300
```

- [ ] **Step 3: Set the same keys in your local `.env`** (not committed) with real values so later tasks can fetch live.

- [ ] **Step 4: Commit**

```bash
git add package.json pnpm-lock.yaml .env.example
git commit -m "build: add google-auth-library and ebook env vars"
```

---

## Task 2: Ebook type

**Files:**
- Create: `lib/ebooks/types.ts`

- [ ] **Step 1: Write the type**

```ts
export interface Ebook {
  id: string // Drive file ID (stable). Falls back to a title-derived key when no valid link.
  title: string
  author: string | null
  year: number | null
  edition: string | null
  publisher: string | null
  previewUrl: string | null // null when there is no valid Drive file ID
  downloadUrl: string | null
  available: boolean // false when the row has no usable Drive link
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no new errors referencing `lib/ebooks/types.ts`.

- [ ] **Step 3: Commit**

```bash
git add lib/ebooks/types.ts
git commit -m "feat(ebooks): add Ebook type"
```

---

## Task 3: Drive URL helpers (pure)

**Files:**
- Create: `lib/ebooks/drive.ts`

- [ ] **Step 1: Write the helpers**

```ts
// Extracts a Google Drive file ID from common share-link formats.
// Returns null for missing/unparseable input.
const DRIVE_ID_PATTERNS: RegExp[] = [
  /\/file\/d\/([a-zA-Z0-9_-]+)/, // https://drive.google.com/file/d/{ID}/view
  /[?&]id=([a-zA-Z0-9_-]+)/, // open?id={ID} | uc?id={ID} | uc?export=download&id={ID}
  /\/d\/([a-zA-Z0-9_-]+)/, // generic /d/{ID}
]

export function extractDriveFileId(link: string | null | undefined): string | null {
  if (!link) return null
  const trimmed = link.trim()
  if (!trimmed) return null
  for (const re of DRIVE_ID_PATTERNS) {
    const match = trimmed.match(re)
    if (match?.[1]) return match[1]
  }
  // Bare ID: no slashes/spaces, plausible length.
  if (/^[a-zA-Z0-9_-]{20,}$/.test(trimmed)) return trimmed
  return null
}

export function drivePreviewUrl(fileId: string): string {
  return `https://drive.google.com/file/d/${fileId}/preview`
}

export function driveDownloadUrl(fileId: string): string {
  return `https://drive.google.com/uc?export=download&id=${fileId}`
}
```

- [ ] **Step 2: Verify with a throwaway script**

Create `scripts/__verify-drive.ts`:

```ts
import assert from "node:assert"
import { extractDriveFileId, drivePreviewUrl, driveDownloadUrl } from "../lib/ebooks/drive"

const ID = "1AbC_dEfGhIjKlMnOpQrStUvWxYz12345"
assert.equal(extractDriveFileId(`https://drive.google.com/file/d/${ID}/view?usp=sharing`), ID)
assert.equal(extractDriveFileId(`https://drive.google.com/open?id=${ID}`), ID)
assert.equal(extractDriveFileId(`https://drive.google.com/uc?export=download&id=${ID}`), ID)
assert.equal(extractDriveFileId(ID), ID)
assert.equal(extractDriveFileId(""), null)
assert.equal(extractDriveFileId(null), null)
assert.equal(extractDriveFileId("not a link"), null)
assert.equal(drivePreviewUrl(ID), `https://drive.google.com/file/d/${ID}/preview`)
assert.equal(driveDownloadUrl(ID), `https://drive.google.com/uc?export=download&id=${ID}`)
console.log("PASS drive helpers")
```

Run: `npx tsx scripts/__verify-drive.ts`
Expected: prints `PASS drive helpers`, exit 0.

- [ ] **Step 3: Delete the throwaway script**

Run: `rm scripts/__verify-drive.ts`

- [ ] **Step 4: Commit**

```bash
git add lib/ebooks/drive.ts
git commit -m "feat(ebooks): add Drive URL helpers"
```

---

## Task 4: Sheet client (service-account fetch)

**Files:**
- Create: `lib/ebooks/sheet.ts`

- [ ] **Step 1: Write the client**

```ts
import "server-only"
import { JWT } from "google-auth-library"

const SHEETS_SCOPE = "https://www.googleapis.com/auth/spreadsheets.readonly"

function getJwtClient(): JWT {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  const rawKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
  if (!email || !rawKey) {
    throw new Error("Missing GOOGLE_SERVICE_ACCOUNT_EMAIL or GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY")
  }
  // The private key is stored in .env with literal "\n"; convert to real newlines.
  const key = rawKey.replace(/\\n/g, "\n")
  return new JWT({ email, key, scopes: [SHEETS_SCOPE] })
}

// Fetches the configured range and returns raw rows (header row excluded by the range).
export async function fetchEbookRows(): Promise<string[][]> {
  const spreadsheetId = process.env.GOOGLE_SHEET_ID
  const range = process.env.GOOGLE_SHEET_RANGE ?? "Ebooks!A2:F"
  if (!spreadsheetId) throw new Error("Missing GOOGLE_SHEET_ID")

  const client = getJwtClient()
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`
  const res = await client.fetch(url)
  const data = res.data as { values?: string[][] }
  return data.values ?? []
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no new errors. (If `server-only` is reported missing, it ships with Next.js — confirm `next` is installed.)

- [ ] **Step 3: Verify against the live sheet (requires real `.env` values)**

Create `scripts/__verify-sheet.ts`:

```ts
import "dotenv/config"
import { fetchEbookRows } from "../lib/ebooks/sheet"

const rows = await fetchEbookRows()
console.log(`fetched ${rows.length} rows`)
console.log("first row:", rows[0])
```

Run: `npx tsx scripts/__verify-sheet.ts`
Expected: prints a non-zero row count and the first row array `[Title, Author, Year, Edition, Publisher, Link]`.
If it errors with `403`/`PERMISSION_DENIED`: share the sheet with the service-account email (Viewer) and ensure the Sheets API is enabled in the GCP project.

- [ ] **Step 4: Delete the throwaway script**

Run: `rm scripts/__verify-sheet.ts`

- [ ] **Step 5: Commit**

```bash
git add lib/ebooks/sheet.ts
git commit -m "feat(ebooks): add Google Sheets service-account client"
```

---

## Task 5: Row mapping + cached getEbooks

**Files:**
- Create: `lib/ebooks/index.ts`

- [ ] **Step 1: Write mapping + cached fetch**

```ts
import { unstable_cache } from "next/cache"
import { fetchEbookRows } from "./sheet"
import { extractDriveFileId, drivePreviewUrl, driveDownloadUrl } from "./drive"
import type { Ebook } from "./types"

// Sheet columns, in order: Title | Author | Year | Edition | Publisher | Link
export function mapRowToEbook(row: string[]): Ebook | null {
  const [title, author, year, edition, publisher, link] = row
  if (!title || !title.trim()) return null // skip rows without a title

  const fileId = extractDriveFileId(link)
  const parsedYear = year && /^\d{4}$/.test(year.trim()) ? Number(year.trim()) : null

  return {
    id: fileId ?? `title-${title.trim()}`,
    title: title.trim(),
    author: author?.trim() || null,
    year: parsedYear,
    edition: edition?.trim() || null,
    publisher: publisher?.trim() || null,
    previewUrl: fileId ? drivePreviewUrl(fileId) : null,
    downloadUrl: fileId ? driveDownloadUrl(fileId) : null,
    available: fileId !== null,
  }
}

async function _getEbooks(): Promise<Ebook[]> {
  const rows = await fetchEbookRows()
  return rows.map(mapRowToEbook).filter((e): e is Ebook => e !== null)
}

const REVALIDATE = Number(process.env.EBOOKS_REVALIDATE_SECONDS ?? 300)

// google-auth-library does not flow through Next's fetch cache, so cache explicitly.
export const getEbooks = unstable_cache(_getEbooks, ["ebooks"], {
  revalidate: REVALIDATE,
  tags: ["ebooks"],
})

export async function getEbookById(id: string): Promise<Ebook | null> {
  const ebooks = await getEbooks()
  return ebooks.find((e) => e.id === id) ?? null
}
```

- [ ] **Step 2: Verify mapping with a throwaway script**

Create `scripts/__verify-map.ts`:

```ts
import assert from "node:assert"
import { mapRowToEbook } from "../lib/ebooks/index"

const ID = "1AbC_dEfGhIjKlMnOpQrStUvWxYz12345"
const ok = mapRowToEbook(["Clean Code", "Robert Martin", "2008", "1st", "Prentice Hall", `https://drive.google.com/file/d/${ID}/view`])
assert(ok)
assert.equal(ok!.title, "Clean Code")
assert.equal(ok!.year, 2008)
assert.equal(ok!.available, true)
assert.equal(ok!.previewUrl, `https://drive.google.com/file/d/${ID}/preview`)

const noLink = mapRowToEbook(["Some Book", "", "", "", "", ""])
assert(noLink)
assert.equal(noLink!.available, false)
assert.equal(noLink!.previewUrl, null)
assert.equal(noLink!.year, null)

assert.equal(mapRowToEbook(["", "", "", "", "", ""]), null) // no title -> skipped
console.log("PASS row mapping")
```

Run: `npx tsx scripts/__verify-map.ts`
Expected: prints `PASS row mapping`, exit 0.

- [ ] **Step 3: Delete the throwaway script**

Run: `rm scripts/__verify-map.ts`

- [ ] **Step 4: Commit**

```bash
git add lib/ebooks/index.ts
git commit -m "feat(ebooks): map sheet rows to Ebook and cache getEbooks"
```

---

## Task 6: Pure filter + pagination

**Files:**
- Create: `lib/ebooks/browse.ts`

- [ ] **Step 1: Write the helper**

```ts
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
```

- [ ] **Step 2: Verify with a throwaway script**

Create `scripts/__verify-browse.ts`:

```ts
import assert from "node:assert"
import { filterAndPaginate } from "../lib/ebooks/browse"
import type { Ebook } from "../lib/ebooks/types"

const make = (title: string, author: string | null): Ebook => ({
  id: title, title, author, year: null, edition: null, publisher: null,
  previewUrl: null, downloadUrl: null, available: false,
})
const data = Array.from({ length: 50 }, (_, i) => make(`Book ${i}`, i % 2 ? "Alice" : "Bob"))

const p1 = filterAndPaginate(data, "", 1, 24)
assert.equal(p1.items.length, 24)
assert.equal(p1.totalPages, 3)
assert.equal(p1.totalResults, 50)

const p3 = filterAndPaginate(data, "", 99, 24) // clamps to last page
assert.equal(p3.page, 3)
assert.equal(p3.items.length, 2)

const search = filterAndPaginate(data, "alice", 1, 24)
assert.equal(search.totalResults, 25)
console.log("PASS filter + paginate")
```

Run: `npx tsx scripts/__verify-browse.ts`
Expected: prints `PASS filter + paginate`, exit 0.

- [ ] **Step 3: Delete the throwaway script**

Run: `rm scripts/__verify-browse.ts`

- [ ] **Step 4: Commit**

```bash
git add lib/ebooks/browse.ts
git commit -m "feat(ebooks): add pure filter + pagination helper"
```

---

## Task 7: Route protection

**Files:**
- Modify: `proxy.ts:42`

- [ ] **Step 1: Add `/ebooks` to protectedPaths**

Replace this line in `proxy.ts`:

```ts
    const protectedPaths = ["/my-books", "/books", "/analytics", "/authors"]
```

with:

```ts
    const protectedPaths = ["/my-books", "/books", "/analytics", "/authors", "/ebooks"]
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add proxy.ts
git commit -m "feat(ebooks): require auth for /ebooks"
```

---

## Task 8: Preview modal component

**Files:**
- Create: `components/ebook-preview-modal.tsx`

- [ ] **Step 1: Write the component**

```tsx
"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Download, FileX } from "lucide-react"
import type { Ebook } from "@/lib/ebooks/types"

interface EbookPreviewModalProps {
  ebook: Ebook | null
  open: boolean
  onClose: () => void
}

export function EbookPreviewModal({ ebook, open, onClose }: EbookPreviewModalProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose()
      }}
    >
      <DialogContent className="max-w-3xl w-[95vw] h-[85vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-4 py-3 border-b text-left">
          <DialogTitle className="truncate">{ebook?.title ?? "Ebook"}</DialogTitle>
          {ebook?.author && <p className="text-sm text-muted-foreground">{ebook.author}</p>}
        </DialogHeader>

        <div className="flex-1 min-h-0 bg-muted">
          {ebook?.previewUrl ? (
            <iframe
              src={ebook.previewUrl}
              title={`Preview of ${ebook.title}`}
              className="w-full h-full border-0"
              allow="autoplay"
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
              <FileX className="h-10 w-10" />
              <p>Preview unavailable for this ebook.</p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 px-4 py-3 border-t">
          {ebook?.downloadUrl && (
            <Button asChild>
              <a href={ebook.downloadUrl} target="_blank" rel="noopener noreferrer">
                <Download className="h-4 w-4 mr-2" />
                Download
              </a>
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no new errors. (Confirm `components/ui/dialog.tsx` exports `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle` — it does in this project.)

- [ ] **Step 3: Commit**

```bash
git add components/ebook-preview-modal.tsx
git commit -m "feat(ebooks): add Drive preview modal"
```

---

## Task 9: Browse client component

**Files:**
- Create: `components/ebook-browse.tsx`

- [ ] **Step 1: Write the component**

```tsx
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
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no new errors. (Confirm `components/ui/pagination.tsx` exports `Pagination`, `PaginationContent`, `PaginationItem`, `PaginationPrevious`, `PaginationNext` — it does in this project.)

- [ ] **Step 3: Commit**

```bash
git add components/ebook-browse.tsx
git commit -m "feat(ebooks): add search + paginated card browse"
```

---

## Task 10: Page and loading skeleton

**Files:**
- Create: `app/ebooks/page.tsx`
- Create: `app/ebooks/loading.tsx`

- [ ] **Step 1: Write the loading skeleton**

`app/ebooks/loading.tsx`:

```tsx
import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Skeleton className="h-9 w-48 mb-2" />
      <Skeleton className="h-5 w-80 mb-8" />
      <Skeleton className="h-10 w-full max-w-md mb-6" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full rounded-lg" />
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Write the page**

`app/ebooks/page.tsx`:

```tsx
import { Suspense } from "react"
import { getEbooks } from "@/lib/ebooks"
import { EbookBrowse } from "@/components/ebook-browse"
import { Skeleton } from "@/components/ui/skeleton"
import type { Ebook } from "@/lib/ebooks/types"

export default async function EbooksPage() {
  let ebooks: Ebook[]
  try {
    ebooks = await getEbooks()
  } catch {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2">Ebooks</h1>
        <p className="text-muted-foreground">
          Ebooks are temporarily unavailable. Please try again later.
        </p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Ebooks</h1>
        <p className="text-muted-foreground">
          Browse and read ebooks from our collection.
        </p>
      </div>
      <Suspense fallback={<Skeleton className="h-10 w-full max-w-md" />}>
        <EbookBrowse ebooks={ebooks} />
      </Suspense>
    </div>
  )
}
```

Note: `EbookBrowse` uses `useSearchParams()`, which requires a `<Suspense>` boundary — provided above.

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 4: Manual browser verification**

Run: `pnpm dev`. Log in, then visit `http://localhost:3000/ebooks`.
Expected:
- Logged out → redirected to `/auth/login?callbackUrl=/ebooks`.
- Logged in → grid of ebook cards, search filters live, pagination appears when >24 results.
- Click a card → modal opens with the Drive preview iframe; URL gains `?book=<id>`.
- Reloading a `?book=<id>` URL re-opens that modal.
- Download button opens the Drive download in a new tab.
- A row with a bad/missing link shows a "No preview" badge and a disabled-preview modal.

- [ ] **Step 5: Commit**

```bash
git add app/ebooks/page.tsx app/ebooks/loading.tsx
git commit -m "feat(ebooks): add /ebooks page and loading skeleton"
```

---

## Task 11: Navigation links

**Files:**
- Modify: `components/header.tsx:3`, `components/header.tsx:30-36`
- Modify: `components/mobile-nav.tsx:6`, `components/mobile-nav.tsx` routes array

- [ ] **Step 1: Update the desktop header import**

In `components/header.tsx`, change the lucide import line:

```tsx
import { BookOpen, Search, BarChart3, Library, Shield, Users } from "lucide-react"
```

to:

```tsx
import { BookOpen, BookMarked, Search, BarChart3, Library, Shield, Users } from "lucide-react"
```

- [ ] **Step 2: Add the desktop "Ebooks" link**

In `components/header.tsx`, immediately after the closing `</Link>` of the "Browse Books" link (the block linking to `/books`), insert:

```tsx
            <Link
              href="/ebooks"
              className="flex items-center shrink-0 gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <BookMarked className="h-4 w-4" />
              Ebooks
            </Link>
```

- [ ] **Step 3: Update the mobile-nav import**

In `components/mobile-nav.tsx`, change:

```tsx
import { BookOpen, Search, BarChart3, Library, Shield, Users, Menu } from "lucide-react"
```

to:

```tsx
import { BookOpen, BookMarked, Search, BarChart3, Library, Shield, Users, Menu } from "lucide-react"
```

- [ ] **Step 4: Add the mobile "Ebooks" route**

In `components/mobile-nav.tsx`, in the `routes` array, insert this object immediately after the `/books` entry:

```tsx
    {
      href: "/ebooks",
      label: "Ebooks",
      icon: BookMarked,
      active: pathname === "/ebooks",
      show: true,
    },
```

- [ ] **Step 5: Typecheck + manual check**

Run: `npx tsc --noEmit`
Expected: no new errors.
Run `pnpm dev`: "Ebooks" appears in the desktop nav (after Browse Books) and in the mobile menu; both route to `/ebooks`.

- [ ] **Step 6: Commit**

```bash
git add components/header.tsx components/mobile-nav.tsx
git commit -m "feat(ebooks): add Ebooks nav links"
```

---

## Final verification

- [ ] **Step 1: Full typecheck**

Run: `npx tsc --noEmit`
Expected: no new errors in any `lib/ebooks/*`, `components/ebook-*`, or `app/ebooks/*` file.

- [ ] **Step 2: Lint**

Run: `pnpm lint`
Expected: no new errors for the added files.

- [ ] **Step 3: Production build smoke test**

Run: `pnpm build`
Expected: build succeeds; `/ebooks` is listed in the route output.

- [ ] **Step 4: Confirm no throwaway scripts remain**

Run: `ls scripts/__verify-*.ts 2>/dev/null`
Expected: no files listed.
