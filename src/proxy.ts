import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

/**
 * Edge-compatible auth proxy using the lean authConfig (no Prisma/bcrypt imports).
 * NextAuth handles redirecting unauthenticated users to /login via the
 * `authorized` callback defined in authConfig.
 */
const handler = NextAuth(authConfig);

// Next.js 16 requires a named "proxy" function export
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const proxy = handler.auth as unknown as (...args: any[]) => any;

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
};
