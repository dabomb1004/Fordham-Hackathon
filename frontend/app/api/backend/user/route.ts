import { NextResponse } from "next/server";
import { getUser, saveUser } from "@/lib/storage";

// GET /api/backend/user
export async function GET() {
  try {
    const user = getUser();
    return NextResponse.json(user);
  } catch (err) {
    console.error("[GET /api/backend/user]", err);
    return NextResponse.json({ error: "Failed to load user profile" }, { status: 500 });
  }
}

// PUT /api/backend/user
export async function PUT(request: Request) {
  try {
    const data = await request.json();
    saveUser(data);
    return NextResponse.json({ status: "ok" });
  } catch (err) {
    console.error("[PUT /api/backend/user]", err);
    return NextResponse.json({ error: "Failed to save user profile" }, { status: 500 });
  }
}
