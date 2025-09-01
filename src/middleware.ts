import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    // Verificar rotas de admin
    if (req.nextUrl.pathname.startsWith("/api/ebook-categories") && req.method !== "GET") {
      if (req.nextauth.token?.role !== "ADMIN") {
        return NextResponse.json(
          { success: false, error: "Acesso negado" },
          { status: 403 }
        );
      }
    }

    if (req.nextUrl.pathname.startsWith("/api/ebooks") && 
        (req.method === "POST" || req.method === "PUT" || req.method === "DELETE")) {
      if (req.nextauth.token?.role !== "ADMIN") {
        return NextResponse.json(
          { success: false, error: "Acesso negado" },
          { status: 403 }
        );
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Permitir acesso público para GET requests
        if (req.method === "GET" && req.nextUrl.pathname.startsWith("/api/ebook-categories")) {
          return true;
        }

        if (req.method === "GET" && req.nextUrl.pathname.startsWith("/api/ebooks") && 
            !req.nextUrl.pathname.includes("/download")) {
          return true;
        }

        // Requerer autenticação para outras rotas
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    "/api/ebook-categories/:path*",
    "/api/ebooks/:path*",
    "/api/user/ebooks/:path*"
  ]
};