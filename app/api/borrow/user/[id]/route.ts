import { NextResponse } from "next/server"
import { getBorrowedBooksByUserId } from "@/lib/db/client"
import { getSession } from "@/lib/db/auth"

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession()
        if (!session) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
        }
        const { id } = await params
        const data = await getBorrowedBooksByUserId(id)
        return NextResponse.json({ success: true, data })
    } catch (error) {
        console.error("Error fetching user borrowed books:", error)
        return NextResponse.json(
            { success: false, error: "Failed to fetch borrowed books" },
            { status: 500 }
        )
    }
}
