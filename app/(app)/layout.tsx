import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AppNav } from "@/components/app-nav";

/**
 * Authenticated app shell. Every route inside (app)/ requires a session.
 * If no session → redirect to sign-in.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/signin");

  return (
    <div className="min-h-screen bg-background">
      <AppNav user={session.user} />
      <main className="max-w-5xl mx-auto px-4 py-6 pb-24">{children}</main>
    </div>
  );
}
