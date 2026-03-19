import { NextResponse } from "next/server"
import { updateBorrowRecord } from "@/lib/db/client"
import { getSession } from "@/lib/db/auth"

export async function PATCH(request: Request) {
    try {
        const session = await getSession()
        if (!session) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
        }
        const { borrowId } = await request.json()

        if (!borrowId) {
            return NextResponse.json(
                { success: false, error: "Borrow ID is required" },
                { status: 400 }
            )
        }

        // Update borrow record to returned
        const borrowRecord = await updateBorrowRecord(String(borrowId), {
            status: "returned",
            returned_at: new Date().toISOString(),
        })

        if (!borrowRecord) {
            return NextResponse.json(
                { success: false, error: "Failed to update borrow record" },
                { status: 500 }
            )
        }

        return NextResponse.json({ success: true, data: borrowRecord })
    } catch (error) {
        console.error("Return API error:", error)
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        )
    }
}
