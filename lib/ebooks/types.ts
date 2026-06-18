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
