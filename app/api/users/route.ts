import { NextResponse } from "next/server";
import { getAllUsers } from "@/lib/db/client";
import { isAdmin } from "@/lib/db/auth";

export async function GET() {
    try {
        if (!await isAdmin()) {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            )
        }
        const users = await getAllUsers();
        return NextResponse.json({ success: true, data: users });
    }
    catch (error) {
        console.error("Error fetching users:", error);
        return NextResponse.json({ success: false, error: "Failed to fetch users" }, { status: 500 });
    }
}