import { NextResponse } from "next/server";
import { getUserByUserId } from "@/lib/db/client";
import { isAdmin } from "@/lib/db/auth";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        if (!await isAdmin()) {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            )
        }
        const user = await getUserByUserId(id);
        if (!user) {
            return NextResponse.json(
                { success: false, error: "User not found" },
                { status: 404 }
            )
        }
        return NextResponse.json({ success: true, data: user });
    }
    catch (error) {
        console.error("Error fetching user:", error);
        return NextResponse.json({ success: false, error: "Failed to fetch user" }, { status: 500 });
    }
}