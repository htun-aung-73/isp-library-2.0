import { NextResponse } from "next/server"
import { clearSession } from "@/lib/db/auth"
import { getSession } from "@/lib/db/auth"

export async function POST() {
    try {
        // const session = await getSession()
        // if (!session) {
        //     return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
        // }
        await clearSession()
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Logout API error:", error)
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        )
    }
}
