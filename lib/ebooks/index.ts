import { unstable_cache } from "next/cache"
import { fetchEbookRows } from "./sheet"
import { mapRowToEbook } from "./map"
import type { Ebook } from "./types"

export { mapRowToEbook }

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
