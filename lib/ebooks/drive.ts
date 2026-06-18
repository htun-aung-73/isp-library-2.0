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
