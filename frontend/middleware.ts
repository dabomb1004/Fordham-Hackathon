import { NextRequest, NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only check the root path
  if (pathname !== "/") return NextResponse.next();

  // Check onboarding status from Supabase via our API
  try {
    const res = await fetch(new URL("/api/backend/user", req.url));
    if (res.ok) {
      const user = await res.json();
      if (!user?.onboarding?.completed) {
        return NextResponse.redirect(new URL("/onboarding", req.url));
      }
    }
  } catch {
    // If fetch fails, redirect to onboarding to be safe
    return NextResponse.redirect(new URL("/onboarding", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/"],
};
