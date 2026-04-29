import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json([]);
}

export async function POST(_req: NextRequest) {
  return NextResponse.json({ status: "ok" });
}
