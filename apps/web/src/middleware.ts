import { NextResponse } from "next/server";
import { withAuth } from "next-auth/middleware";

export default withAuth(
  function middleware(req) {
    const isAdminRoute = req.nextUrl.pathname.startsWith("/admin");
    const isAdmin = req.nextauth.token?.isAdmin;

    if (isAdminRoute && !isAdmin) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  },
);

export const config = {
  matcher: [
    "/",
    "/chat/:path*",
    "/friends/:path*",
    "/circles/:path*",
    "/discover/:path*",
    "/settings/:path*",
    "/admin/:path*",
    "/profile/:path*",
    "/api/circles/:path*",
    "/api/profiles/:path*",
    "/api/connections/:path*",
    "/api/friends/:path*",
    "/api/settings/:path*",
    "/api/admin/:path*",
    "/api/ws-token",
  ],
};
