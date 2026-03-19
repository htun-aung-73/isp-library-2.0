import { NextRequest, NextResponse } from "next/server"
import { getAuthors } from "@/lib/db/client"
import { getSession } from "@/lib/db/auth"

export async function GET(_request: NextRequest) {
    try {
        const session = await getSession()
        if (!session) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
        }

        const authors = await getAuthors()
        return NextResponse.json({ success: true, data: authors })
    } catch (error) {
        console.error("API Error:", error)
        return NextResponse.json({ success: false, error: "Failed to fetch authors" }, { status: 500 })
    }
}
