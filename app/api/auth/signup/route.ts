import { NextResponse } from "next/server"
import { signup } from "@/lib/db/auth"

export async function POST(request: Request) {
    try {
        const { email, hashedPassword, username } = await request.json()

        if (!email || !hashedPassword || !username) {
            return NextResponse.json(
                { success: false, error: "Email, password and username are required" },
                { status: 400 }
            )
        }

        const result = await signup(username, email, hashedPassword)

        if (result.success && result.user) {
            return NextResponse.json({ 
                success: true, 
                user: result.user,
                accessToken: result.accessToken 
            })
        } else {
            return NextResponse.json(
                { success: false, error: result.error },
                { status: 400 }
            )
        }

    } catch (error) {
        console.error("Signup API error:", error)
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        )
    }
}
