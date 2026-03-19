import { NextResponse } from "next/server"
import { getAllBorrowRecords } from "@/lib/db/client"
import { isAdmin } from "@/lib/db/auth"

export async function GET() {
    try {
        if (!await isAdmin()) {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            )
        }

        const data = await getAllBorrowRecords()
        return NextResponse.json({ success: true, data })
    } catch (error) {
        console.error("Error fetching all borrow records:", error)
        return NextResponse.json(
            { success: false, error: "Failed to fetch borrow records" },
            { status: 500 }
        )
    }
}
