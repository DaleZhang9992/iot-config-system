import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const intlMiddleware = createMiddleware(routing);

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 公开路径 - 不需要登录
  const publicPaths = [
    "/login",
    "/customer/",
    "/shared/",
    "/api/public/",
    "/api/auth/",
  ];
  const isPublicPath = publicPaths.some((p) => pathname.startsWith(p));

  if (isPublicPath) {
    // 国际化路径处理
    if (pathname.startsWith("/api/")) {
      return NextResponse.next();
    }
    return intlMiddleware(req);
  }

  // 检查登录状态
  const token = await getToken({ req, secret: process.env.AUTH_SECRET });

  if (!token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const role = token.role as string;

  // 角色权限检查
  if (pathname.startsWith("/sales") && role !== "SALES" && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", req.url));
  }
  if (pathname.startsWith("/fae") && role !== "FAE" && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", req.url));
  }
  if (pathname.startsWith("/rd") && role !== "RD" && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", req.url));
  }
  if (pathname.startsWith("/admin") && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  return intlMiddleware(req);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|images|api/auth).*)",
  ],
};
