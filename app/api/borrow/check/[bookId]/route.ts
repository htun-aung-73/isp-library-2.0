import { NextResponse } from "next/server"
import { checkBookBorrowedByUser } from "@/lib/db/client"
import { getSession } from "@/lib/db/auth"

export async function GET(
    request: Request,
    { params }: { params: Promise<{ bookId: string }> }
) {
    try {
        const session = await getSession()
        if (!session) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
        }
        const { bookId } = await params
        const data = await checkBookBorrowedByUser(bookId)
        return NextResponse.json({ success: true, data })
    } catch (error) {
        console.error("Error checking book borrow status:", error)
        return NextResponse.json(
            { success: false, error: "Failed to check borrow status" },
            { status: 500 }
        )
    }
}
