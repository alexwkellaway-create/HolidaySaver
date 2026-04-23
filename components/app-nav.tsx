"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LogOut, Plus, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Session } from "next-auth";

interface AppNavProps {
  user: Session["user"];
}

export function AppNav({ user }: AppNavProps) {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-orange-600 hover:text-orange-700 transition-colors">
          <span className="text-xl">🏖️</span>
          <span className="hidden sm:inline">HolidaySaver</span>
        </Link>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {pathname !== "/dashboard" && (
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="gap-1.5">
                <Home className="h-4 w-4" />
                <span className="hidden sm:inline">My Pots</span>
              </Button>
            </Link>
          )}

          <Link href="/parties/new">
            <Button variant="sunset" size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">New Pot</span>
            </Button>
          </Link>

          {/* User avatar + sign out */}
          <div className="flex items-center gap-2 pl-2 border-l">
            <span
              className="text-xl cursor-default"
              title={user.name ?? user.email ?? "You"}
            >
              {(user as { avatarEmoji?: string }).avatarEmoji ?? "🙂"}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground"
              onClick={() => signOut({ callbackUrl: "/" })}
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
