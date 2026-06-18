# Ebook Browse Page — Design Spec

**Date:** 2026-06-18
**Status:** Approved (ready for implementation planning)
**Branch:** `feat/ebooks-browse`

## Summary

Add a new `/ebooks` page where logged-in users browse a catalog of ebooks whose
files live in Google Drive. Ebook **metadata lives in a Google Sheet** (updated
regularly, ~1000+ rows), not in the project database. The page reads the sheet
server-side, caches it, and renders a search-forward, paginated card grid
(Layout C). Clicking a card opens a modal showing the Google Drive **preview**
with a **download** button.

This feature adds **no Prisma model and no migration** — the Google Sheet is the
single source of truth for ebook metadata.

## Decisions (locked)

| Decision | Choice | Rationale |
|---|---|---|
| Browse layout | **C — search box + responsive metadata cards** | "Seamless browse" without needing cover images |
| Scale handling (1000+) | **Paginated card grid**, ~24/page, in-memory search | Tiny data; keeps DOM light at any size; no new deps |
| Metadata source | **Google Sheet**, read live + cached | Single source of truth; edited regularly by maintainers |
| Sheet access | **Sheets API v4 + service account** (private sheet) | Sheet metadata stays private |
| Sheets client | **`google-auth-library` + `fetch`** to Sheets REST | Lean; avoids the heavy full `googleapis` package |
| Database | **No table** — read sheet, cache | 1000 rows filter instantly in memory; DB adds only a sync layer for no gain |
| Access control | **Logged-in users only** | Consistent with `/books`, `/authors`, etc. |
| Filtering | **Text search only** (title / author / publisher) | Per requirements; no extra fields needed |
| Preview presentation | **Modal** (shadcn Dialog) over the grid, backed by `?book=<id>` URL param | Most seamless; deep-link shareable; back button works |
| Tests | **No test runner for v1**; helpers written pure/testable | Project has no test setup; avoid scope creep |

## Sheet schema

Columns (header row, in order):

```
Title | Author | Year | Edition | Publisher | Link
```

- `Link` is any Google Drive share URL for the ebook file.
- `Author` was added to the user's original `[Name Year Edition Publisher EbookLink]`
  proposal because the rest of the app models authors and it strengthens search.
- `Year` parsed to a number when present; blank/invalid → `null`.

## Architecture

```
/ebooks (server page, cached via unstable_cache)
   └─ getEbooks()  →  Sheets API v4 (service account)  →  rows
                   →  mapRowToEbook()  →  Ebook[]
   └─ <EbookBrowse> (client)
        - in-memory search (title/author/publisher)
        - pagination (~24/page)
        - card grid
        - click card → set ?book=<id> → open <EbookPreviewModal>
              └─ iframe  https://drive.google.com/file/d/{id}/preview
              └─ download https://drive.google.com/uc?export=download&id={id}
```

### Caching

`google-auth-library`/Sheets requests do **not** flow through Next's `fetch`
cache, so caching is done explicitly:

```ts
export const getEbooks = unstable_cache(
  _getEbooksUncached,
  ["ebooks"],
  { revalidate: Number(process.env.EBOOKS_REVALIDATE_SECONDS ?? 300) }
)
```

Stale-while-revalidate: a brief sheet outage keeps serving the last good copy.

## Modules

Each unit is small, single-purpose, and (where pure) unit-testable.

| File | Responsibility | Depends on |
|---|---|---|
| `lib/ebooks/types.ts` | `Ebook { id, title, author, year, edition, publisher, previewUrl, downloadUrl }`. `id` = Drive file ID (stable, no DB id). | — |
| `lib/ebooks/sheet.ts` | Service-account JWT auth + raw row fetch from Sheets REST `values` endpoint. | `google-auth-library`, env |
| `lib/ebooks/index.ts` | `getEbooks()` (fetch→map→cache), `getEbookById(id)`. Pure helpers: `mapRowToEbook(row)`, `extractDriveFileId(link)`, `drivePreviewUrl(id)`, `driveDownloadUrl(id)`. | `sheet.ts`, `types.ts`, `unstable_cache` |
| `app/ebooks/page.tsx` | Server component; `getEbooks()` → `<EbookBrowse>`. | `lib/ebooks` |
| `app/ebooks/loading.tsx` | Skeleton matching the card grid. | ui/skeleton |
| `components/ebook-browse.tsx` | Client: search, filter, pagination, card grid; syncs `?book=<id>`; renders modal. | RTK not needed — receives data as props |
| `components/ebook-preview-modal.tsx` | shadcn `Dialog` (Radix) centered modal: Drive preview iframe + download button. (`vaul` drawer optional for a future mobile variant.) | components/ui/dialog |
| `proxy.ts` | Add `/ebooks` to `protectedPaths`. | — |

### Drive file ID extraction

`extractDriveFileId(link)` handles, in order:

- `https://drive.google.com/file/d/{ID}/view?...`
- `https://drive.google.com/open?id={ID}`
- `https://drive.google.com/uc?id={ID}` / `?export=download&id={ID}`
- a bare `{ID}` string

Returns `null` for unparseable input. Rows whose link yields `null` render as a
card with **preview disabled** (still listed, marked unavailable).

## Data flow detail

1. Server page calls `getEbooks()` → cached `Ebook[]` (each carries precomputed
   `previewUrl` + `downloadUrl`, or `null` if no valid Drive ID).
2. `<EbookBrowse>` receives the full array as props.
3. User types → in-memory `filter()` across title/author/publisher (case-insensitive).
4. Filtered results paginated client-side (~24/page) with page controls.
5. Click card → router sets `?book=<id>`; modal opens for that ebook.
6. On mount, `<EbookBrowse>` reads `?book=<id>` from the URL and opens the modal
   if present (deep-link support). Closing the modal clears the param.

## Error handling

| Case | Behavior |
|---|---|
| Sheet unreachable, cache warm | Serve last good copy (stale-while-revalidate) |
| Sheet unreachable, no cache | Page shows friendly "Ebooks are temporarily unavailable" state |
| Row missing required fields | Use `null`/empty; still render if it has a title |
| Link missing / unparseable | Card renders, preview + download disabled, marked unavailable |
| Drive file not shared / blocked | iframe shows Drive's own message; download button still offered |

## Security

- Service-account private key stored **server-only** (`GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`),
  never `NEXT_PUBLIC`. All sheet access happens server-side.
- Sheets scope limited to `https://www.googleapis.com/auth/spreadsheets.readonly`.
- `/ebooks` added to `proxy.ts` `protectedPaths` → unauthenticated users redirected
  to login, consistent with the rest of the app.
- No ebook bytes pass through the app; the Drive file's own permissions remain the
  real access boundary.

## New environment variables

```env
GOOGLE_SERVICE_ACCOUNT_EMAIL=...@...iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEET_ID=<spreadsheet id>
GOOGLE_SHEET_RANGE=Ebooks!A2:F   # tab + range, header row excluded
EBOOKS_REVALIDATE_SECONDS=300
```

To be added to `.env.example` as part of implementation.

## New dependency

- `google-auth-library` (JWT service-account auth; pairs with a plain `fetch` to
  the Sheets REST `values` endpoint).

## Out of scope (v1)

- Admin UI / CRUD for ebooks (maintainers edit the Google Sheet directly).
- Category/subject/language filters (text search only).
- Cover images.
- Borrowing/return flow (ebooks are read/download only, separate from the physical
  borrow system).
- Automated tests (helpers kept pure for a later test pass).

## Testability

Pure functions designed for isolated unit testing once a runner is added:
`extractDriveFileId`, `mapRowToEbook`, and the search-filter + pagination logic
(extract pagination/filter into a pure helper, e.g. `filterAndPaginate(ebooks, query, page, pageSize)`).
