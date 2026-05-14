import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isAuth = !!token;
    const isAuthPage = req.nextUrl.pathname.startsWith("/login");
    const isAdminRoute = req.nextUrl.pathname.startsWith("/dashboard/admin") || req.nextUrl.pathname.startsWith("/settings") || req.nextUrl.pathname.startsWith("/approval-queue");
    
    if (isAuthPage) {
      if (isAuth) {
        return NextResponse.redirect(new URL(token.role === "ADMIN" ? "/dashboard/admin" : "/dashboard/agent", req.url));
      }
      return null;
    }

    if (!isAuth) {
      let from = req.nextUrl.pathname;
      if (req.nextUrl.search) {
        from += req.nextUrl.search;
      }
      return NextResponse.redirect(new URL(`/login?from=${encodeURIComponent(from)}`, req.url));
    }

    if (isAdminRoute && token.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard/agent", req.url));
    }

    return null;
  },
  {
    callbacks: {
      async authorized() {
        // This is a work-around for handling redirect on auth pages.
        // We return true here so that the middleware function above
        // is always called.
        return true;
      },
    },
  }
);

export const config = {
  matcher: ["/dashboard/:path*", "/settings/:path*", "/approval-queue/:path*", "/login", "/campaigns/:path*", "/clients/:path*"],
};
