import { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const role = auth?.user?.role as string | undefined;

      const path = nextUrl.pathname;

      // 公开路径
      if (
        path.startsWith("/login") ||
        path.startsWith("/customer/") ||
        path.startsWith("/shared/") ||
        path.startsWith("/api/public/") ||
        path.startsWith("/api/auth/")
      ) {
        return true;
      }

      // 需要登录
      if (!isLoggedIn) return false;

      // 角色权限检查
      if (path.startsWith("/sales") && role !== "SALES" && role !== "ADMIN") {
        return false;
      }
      if (path.startsWith("/fae") && role !== "FAE" && role !== "ADMIN") {
        return false;
      }
      if (path.startsWith("/rd") && role !== "RD" && role !== "ADMIN") {
        return false;
      }
      if (path.startsWith("/admin") && role !== "ADMIN") {
        return false;
      }

      return true;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
