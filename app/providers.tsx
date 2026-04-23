"use client";
/**
 * Client-side providers wrapper.
 * Keeps the root layout as a Server Component by isolating all
 * client providers here.
 */
import { SessionProvider } from "next-auth/react";
import { Toaster } from "@/components/ui/toaster";
import type { Session } from "next-auth";

interface ProvidersProps {
  children: React.ReactNode;
  session: Session | null;
}

export function Providers({ children, session }: ProvidersProps) {
  return (
    <SessionProvider session={session}>
      {children}
      <Toaster />
    </SessionProvider>
  );
}
