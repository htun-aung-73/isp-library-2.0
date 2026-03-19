import { NextResponse } from "next/server"
import { getBook } from "@/lib/db/client"
import { getSession } from "@/lib/db/auth"

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession()
        if (!session) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
        }
        const { id } = await params
        const book = await getBook(id)

        if (!book) {
            return NextResponse.json({ error: "Book not found" }, { status: 404 })
        }

        return NextResponse.json({ success: true, data: book })
    } catch (error) {
        console.error("API Error:", error)
        return NextResponse.json({ error: "Failed to fetch book" }, { status: 500 })
    }
}
