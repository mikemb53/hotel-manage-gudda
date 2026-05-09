import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { authConfig } from "@/lib/auth.config";

// ─── Dev bypass ─────────────────────────────────────────────────────────────
// When DISABLE_AUTH=true (set by .env.local in local mode), every call to
// auth() returns a hardcoded admin session so no login is needed.
// This flag is NEVER set in production .env — it only lives in .env.local.
const DEV_SESSION = {
  user: {
    id: "dev-admin",
    name: "Admin",
    email: "admin@hotel.com",
    role: "ADMIN" as const,
  },
  expires: new Date(Date.now() + 86_400_000).toISOString(),
};
// ────────────────────────────────────────────────────────────────────────────

const { handlers, signIn, signOut, auth: _auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.passwordHash) return null;

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );
        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        (session.user as { role?: string }).role = token.role as string;
      }
      return session;
    },
  },
});

export { handlers, signIn, signOut };

// Local dev mode bypass: when DATABASE_URL is a SQLite file (set in .env.local),
// auth() returns a hardcoded admin session so no login is required.
// SQLite is only used in local mode — production always uses PostgreSQL.
export const auth = (async (...args: Parameters<typeof _auth>) => {
  if ((process.env.DATABASE_URL ?? "").startsWith("file:")) {
    return DEV_SESSION as unknown as Awaited<ReturnType<typeof _auth>>;
  }
  return _auth(...args as unknown as []);
}) as typeof _auth;
