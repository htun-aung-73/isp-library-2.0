import { NextResponse } from "next/server"
import { createBorrowRecord, getBook } from "@/lib/db/client"
import { getSession } from "@/lib/db/auth"

export async function POST(request: Request) {
    try {
        const session = await getSession()
        if (!session) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
        }

        const body = await request.json()
        const { bookId, userId, authorId, dueDate } = body

        if (!bookId || !userId || !authorId || !dueDate) {
            return NextResponse.json(
                { success: false, error: "Book ID, User ID, Author ID and Due Date are required" },
                { status: 400 }
            )
        }

        // Get current book to verify it exists
        const book = await getBook(bookId)

        if (!book) {
            return NextResponse.json(
                { success: false, error: "Book not found" },
                { status: 404 }
            )
        }

        // Create borrow record
        const borrowRecord = await createBorrowRecord({
            bookId: String(bookId),
            userId: String(userId),
            authorId: String(book.author_id),
            publisherId: String(book.publisher_id),
            dueDate: dueDate,
        })

        if (!borrowRecord) {
            return NextResponse.json(
                { success: false, error: "Failed to create borrow record" },
                { status: 500 }
            )
        }

        return NextResponse.json({ success: true, data: borrowRecord })
    } catch (error) {
        console.error("Borrow API error:", error)
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        )
    }
}

