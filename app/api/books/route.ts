import { NextResponse } from "next/server"
import { getBooks } from "@/lib/db/client"
import { getSession } from "@/lib/db/auth"

export async function GET() {
    try {
        const session = await getSession()
        if (!session) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
        }
        const books = await getBooks()
        return NextResponse.json({ success: true, data: books })
    } catch (error) {
        console.error("Get Books API error:", error)
        return NextResponse.json({ error: error?.toString() }, { status: 500 })
    }
}