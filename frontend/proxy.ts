import { NextRequest, NextResponse } from "next/server";

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only intercept the root path
  if (pathname !== "/") return NextResponse.next();

  try {
    const res = await fetch(new URL("/api/backend/user", req.url));
    if (res.ok) {
      const user = await res.json();
      if (!user?.onboarding?.completed) {
        return NextResponse.redirect(new URL("/onboarding", req.url));
      }
    } else {
      return NextResponse.redirect(new URL("/onboarding", req.url));
    }
  } catch {
    return NextResponse.redirect(new URL("/onboarding", req.url));
  }

  // Onboarding done — send to chat
  return NextResponse.redirect(new URL("/chat", req.url));
}

export const config = {
  matcher: ["/"],
};
