import { NextResponse } from "next/server"
import { getAllBooksByStatus } from "@/lib/db/client"
import { isAdmin } from "@/lib/db/auth"

export async function GET(
    request: Request,
    { params }: { params: Promise<{ status: string }> }
) {
    try {
        if (!await isAdmin()) {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            )
        }

        const { status } = await params
        const data = await getAllBooksByStatus(status)
        return NextResponse.json({ success: true, data })
    } catch (error) {
        console.error("Error fetching borrow records by status:", error)
        return NextResponse.json(
            { success: false, error: "Failed to fetch borrow records" },
            { status: 500 }
        )
    }
}
