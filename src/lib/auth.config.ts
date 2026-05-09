import type { NextAuthConfig } from "next-auth";

/**
 * Edge-compatible auth config (no Node.js-only imports like Prisma/bcrypt).
 * Used in middleware for JWT session validation.
 * The full auth config with DB access lives in auth.ts.
 */
export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      // Local dev mode: SQLite DATABASE_URL = bypass all auth checks
      if ((process.env.DATABASE_URL ?? "").startsWith("file:")) return true;

      const isLoggedIn = !!auth?.user;
      const isPublic =
        nextUrl.pathname.startsWith("/login") ||
        nextUrl.pathname.startsWith("/register") ||
        nextUrl.pathname.startsWith("/api/auth") ||
        nextUrl.pathname.startsWith("/api/ical") ||
        nextUrl.pathname.startsWith("/api/webhooks");

      if (isPublic) return true;
      if (!isLoggedIn) return false;
      return true;
    },
  },
};
