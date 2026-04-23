/**
 * NextAuth configuration.
 * Supports:
 *  - Email magic links (no password needed)
 *  - Google OAuth (optional — works without GOOGLE_CLIENT_ID)
 */
import { PrismaAdapter } from "@auth/prisma-adapter";
import { type NextAuthOptions } from "next-auth";
import EmailProvider from "next-auth/providers/email";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  // Use Prisma to persist sessions, accounts, and users
  adapter: PrismaAdapter(prisma) as NextAuthOptions["adapter"],

  providers: [
    // Magic-link email — requires SMTP env vars
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: Number(process.env.EMAIL_SERVER_PORT ?? 587),
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM ?? "HolidaySaver <noreply@holidaypot.app>",
    }),

    // Google OAuth — only added when credentials are present
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
  ],

  pages: {
    signIn: "/auth/signin",
    // verifyRequest: "/auth/verify", // Show "Check your email" page
    error: "/auth/error",
  },

  callbacks: {
    // Attach the user id to the session so API routes can use it
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        session.user.avatarEmoji = (user as { avatarEmoji?: string }).avatarEmoji ?? "🙂";
      }
      return session;
    },
  },

  session: {
    strategy: "database", // Store sessions in DB (not JWT) — safer for our use case
  },
};
