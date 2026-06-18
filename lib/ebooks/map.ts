import { extractDriveFileId, drivePreviewUrl, driveDownloadUrl } from "./drive"
import type { Ebook } from "./types"

// Sheet columns, in order: Title | Author | Year | Edition | Publisher | Link
// Pure: no I/O, no server-only imports — unit-testable in isolation.
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
