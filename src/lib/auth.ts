// src/lib/auth.ts
import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

const databaseEnabled = Boolean(process.env.DATABASE_URL);
export const authEnabled = Boolean(
  process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET
);
const authSecret = process.env.AUTH_SECRET ?? "appgen-demo-secret";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...(databaseEnabled ? { adapter: PrismaAdapter(prisma) } : {}),
  secret: authSecret,
  providers: authEnabled
    ? [
        GitHub({
          clientId: process.env.AUTH_GITHUB_ID!,
          clientSecret: process.env.AUTH_GITHUB_SECRET!,
        }),
      ]
    : [],
  session: { strategy: databaseEnabled ? "database" : "jwt" },
  callbacks: {
    session({ session, user }) {
      if (session.user) session.user.id = user.id;
      return session;
    },
  },
  pages: {
    signIn: "/",
    error: "/",
  },
});
