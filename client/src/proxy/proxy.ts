import { NextRequest, NextResponse } from "next/server";



export function proxy(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  const pathname = req.nextUrl.pathname;

  const isChat = pathname.startsWith("/chat");
  const isAuth =
    pathname === "/login" || pathname === "/signup";

  if (isChat && !token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (isAuth && token) {
    return NextResponse.redirect(new URL("/chat", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/chat/:path*", "/login", "/signup"],
};
