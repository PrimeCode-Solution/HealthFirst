import { withAuth, NextRequestWithAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import {
  authRateLimit,
  appointmentsApiRateLimit,
  othersApiRateLimit,
} from "@/lib/rate-limit";
import type { NextRequest, NextFetchEvent } from "next/server";

async function handleRateLimit(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "127.0.0.1";

  let limiter;
  if (pathname.startsWith("/api/auth")) {
    limiter = authRateLimit;
  } else if (pathname.startsWith("/api/appointments")) {
    limiter = appointmentsApiRateLimit;
  } else if (pathname.startsWith("/api/")) {
    limiter = othersApiRateLimit;
  }

  if (limiter) {
    try {
      const { success } = await limiter.limit(ip);
      if (!success) {
        return NextResponse.json(
          { error: "Muitas requisições. Tente novamente em breve." },
          { status: 429 },
        );
      }
    } catch (error) {
      console.error(`Redis Error on ${pathname}:`, error);
    }
  }

  return null;
}

export default async function middleware(
  req: NextRequest,
  event: NextFetchEvent,
) {
  const rateLimitResponse = await handleRateLimit(req);
  if (rateLimitResponse) return rateLimitResponse;

  const authMiddleware = withAuth(
    function middleware(req: NextRequestWithAuth) {
      const { pathname } = req.nextUrl;
      const token = req.nextauth?.token;
      const userRole = token?.role;

      const adminRoutes = ["/dashboard/medicos", "/dashboard/clientes"];
      const staffRoutes = ["/dashboard/agendamentos"];

      if (
        adminRoutes.some((route) => pathname.startsWith(route)) &&
        userRole !== "ADMIN"
      ) {
        return NextResponse.rewrite(new URL("/forbidden", req.url));
      }

      if (
        staffRoutes.some((route) => pathname.startsWith(route)) &&
        userRole !== "ADMIN" &&
        userRole !== "DOCTOR"
      ) {
        return NextResponse.rewrite(new URL("/forbidden", req.url));
      }

      return NextResponse.next();
    },
    {
      callbacks: {
        authorized: ({ req, token }) => {
          if (req.nextUrl.pathname.startsWith("/api/auth")) return true;
          return !!token;
        },
      },
      pages: {
        signIn: "/login",
      },
    },
  );

  return authMiddleware(req as NextRequestWithAuth, event);
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/:path*"],
};
