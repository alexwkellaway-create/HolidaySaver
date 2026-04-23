import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { redirect } from "next/navigation";

export default async function LandingPage() {
  // Already signed in → go straight to dashboard
  const session = await getServerSession(authOptions);
  if (session) redirect("/dashboard");

  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <div className="flex items-center gap-2 text-2xl font-bold text-orange-600">
          <span>🏖️</span>
          <span>HolidaySaver</span>
        </div>
        <Link href="/auth/signin">
          <Button variant="outline" size="sm">Sign in</Button>
        </Link>
      </nav>

      {/* Hero */}
      <section className="flex flex-col items-center text-center px-6 pt-16 pb-24 max-w-4xl mx-auto">
        <div className="text-7xl mb-6 animate-wiggle">✈️</div>
        <h1 className="text-4xl sm:text-6xl font-extrabold text-foreground mb-4 leading-tight">
          Save together,{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500">
            holiday together
          </span>
        </h1>
        <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mb-10">
          Create a pot with your friends, track who&apos;s contributing, celebrate milestones,
          and watch your dream holiday become reality — one £ at a time. 🍹
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="/auth/signin">
            <Button variant="sunset" size="xl" className="w-full sm:w-auto">
              Start saving for free
            </Button>
          </Link>
        </div>

        {/* Social proof */}
        <p className="mt-8 text-sm text-muted-foreground">
          No card required · Takes 2 minutes to set up · Free forever
        </p>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 pb-24 grid sm:grid-cols-3 gap-8">
        {[
          {
            emoji: "🎯",
            title: "Set a target",
            desc: "Give your holiday a name, destination, total cost and date. Split it evenly or set personal targets.",
          },
          {
            emoji: "📲",
            title: "Invite friends",
            desc: "Share a unique link. Friends click it, join your pot, and start logging contributions immediately.",
          },
          {
            emoji: "🎉",
            title: "Celebrate milestones",
            desc: "Confetti at 25%, 50%, 75% and 100%. React to contributions with emojis. Stay motivated together.",
          },
        ].map((f) => (
          <div
            key={f.title}
            className="bg-white/70 dark:bg-slate-800/70 backdrop-blur rounded-2xl p-6 shadow-sm border border-orange-100 dark:border-slate-700"
          >
            <div className="text-4xl mb-3">{f.emoji}</div>
            <h3 className="font-bold text-lg mb-2">{f.title}</h3>
            <p className="text-muted-foreground text-sm">{f.desc}</p>
          </div>
        ))}
      </section>

      {/* Footer */}
      <footer className="text-center pb-8 text-sm text-muted-foreground">
        HolidaySaver — built with ❤️ for group adventures
      </footer>
    </main>
  );
}
