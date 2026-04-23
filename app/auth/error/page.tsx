import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AuthErrorPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-blue-50 px-4">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-4">😬</div>
        <h1 className="text-2xl font-bold mb-2">Authentication Error</h1>
        <p className="text-muted-foreground mb-6">
          Something went wrong during sign in. This can happen if a magic link expired,
          was already used, or an OAuth error occurred.
        </p>
        <Link href="/auth/signin">
          <Button variant="sunset">Try again</Button>
        </Link>
      </div>
    </main>
  );
}
