import { NextResponse } from "next/server"
import { forgotPassword } from "@/lib/db/auth"

export async function POST(request: Request) {
    try {
        const { email } = await request.json()

        if (!email) {
            return NextResponse.json(
                { success: false, error: "Email is required" },
                { status: 400 }
            )
        }

        const result = await forgotPassword(email)

        if (!result.success) {
            return NextResponse.json(
                { success: false, error: result.error },
                { status: 500 }
            )
        }

        // Always return success to avoid leaking whether an email exists
        return NextResponse.json({
            success: true,
            message: "If an account with that email exists, a password reset link has been sent."
        })
    } catch (error) {
        console.error("Forgot password API error:", error)
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        )
    }
}
