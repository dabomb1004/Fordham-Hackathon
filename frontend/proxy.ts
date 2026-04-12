import { NextRequest, NextResponse } from "next/server";

// Always start at onboarding for demo — pre-filled data, then → /chat on save
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname !== "/") return NextResponse.next();
  return NextResponse.redirect(new URL("/onboarding", req.url));
}

export const config = {
  matcher: ["/"],
};
