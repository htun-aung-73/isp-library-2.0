import { NextResponse } from "next/server"
import { getBooksByAuthorId } from "@/lib/db/client"
import { getSession } from "@/lib/db/auth"

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = (await params)

    try {
        const session = await getSession()
        if (!session) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
        }
        const books = await getBooksByAuthorId(id)
        return NextResponse.json(books)
    } catch (error) {
        console.error("Get Author Books API error:", error)
        return NextResponse.json({ error: error?.toString() }, { status: 500 })
    }
}
