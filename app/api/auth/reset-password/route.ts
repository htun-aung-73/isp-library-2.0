import { NextResponse } from "next/server"
import { resetPassword } from "@/lib/db/auth"

export async function POST(request: Request) {
    try {
        const { token, password } = await request.json()

        if (!token || !password) {
            return NextResponse.json(
                { success: false, error: "Token and password are required" },
                { status: 400 }
            )
        }

        if (password.length < 8) {
            return NextResponse.json(
                { success: false, error: "Password must be at least 8 characters long" },
                { status: 400 }
            )
        }

        const result = await resetPassword(token, password)

        if (!result.success) {
            return NextResponse.json(
                { success: false, error: result.error },
                { status: 400 }
            )
        }

        return NextResponse.json({
            success: true,
            message: "Password has been reset successfully."
        })
    } catch (error) {
        console.error("Reset password API error:", error)
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        )
    }
}
