/**
 * NextAuth — simplified credentials auth for friends-only use.
 * No email sending, no OAuth setup needed.
 * Users enter their name + email and are signed in immediately.
 * The invite link is the security gate for joining a party.
 */
import { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        name: { label: "Your name", type: "text" },
        email: { label: "Email", type: "email" },
        avatarEmoji: { label: "Avatar", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.name) return null;

        const email = credentials.email.toLowerCase().trim();
        const name = credentials.name.trim();
        if (!name || !email) return null;

        // Find or create the user — no password needed for friends-only
        const user = await prisma.user.upsert({
          where: { email },
          update: {
            name,
            // Update avatar only if a new one was explicitly chosen
            ...(credentials.avatarEmoji && { avatarEmoji: credentials.avatarEmoji }),
          },
          create: {
            email,
            name,
            avatarEmoji: credentials.avatarEmoji || "🙂",
          },
        });

        return user;
      },
    }),
  ],

  // JWT sessions — no database session table needed
  session: { strategy: "jwt" },

  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },

  callbacks: {
    async jwt({ token, user }) {
      // On first sign-in, persist user fields into the token
      if (user) {
        token.id = user.id;
        token.avatarEmoji = (user as { avatarEmoji?: string }).avatarEmoji ?? "🙂";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.avatarEmoji = (token.avatarEmoji as string) ?? "🙂";
      }
      return session;
    },
  },
};
