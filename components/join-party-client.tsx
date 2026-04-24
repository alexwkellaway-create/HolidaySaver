"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Loader2, Users } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/lib/use-toast";

interface JoinPartyClientProps {
  party: {
    id: string;
    name: string;
    destination: string;
    coverEmoji: string;
    targetDate: string;
    host: { id: string; name: string | null; avatarEmoji: string };
    memberCount: number;
    memberAvatars: string[];
    inviteToken: string;
  };
  isSignedIn: boolean;
}

const AVATAR_EMOJIS = ["🌸", "🎸", "🌺", "🦁", "🐬", "🦋", "🌻", "🦊", "🐼", "🌈", "⚡", "🔥"];

export function JoinPartyClient({ party, isSignedIn }: JoinPartyClientProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_EMOJIS[0]);

  async function handleJoin() {
    setLoading(true);
    const res = await fetch(`/api/join/${party.inviteToken}`, { method: "POST" });
    const data = await res.json();

    if (!res.ok) {
      toast({ variant: "destructive", title: "Couldn't join", description: data.error ?? "Please try again." });
      setLoading(false);
      return;
    }

    router.push(`/parties/${party.id}`);
  }

  async function handleSignInAndJoin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    // Sign in with name + email (no email sent — instant)
    const result = await signIn("credentials", {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      avatarEmoji: selectedAvatar,
      redirect: false,
    });

    if (result?.error) {
      toast({ variant: "destructive", title: "Sign in failed", description: "Please try again." });
      setLoading(false);
      return;
    }

    // Now join the party
    const res = await fetch(`/api/join/${party.inviteToken}`, { method: "POST" });
    const data = await res.json();

    if (!res.ok) {
      toast({ variant: "destructive", title: "Couldn't join", description: data.error });
      setLoading(false);
      return;
    }

    // Update avatar in DB
    await fetch("/api/user/avatar", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ avatarEmoji: selectedAvatar }),
    });

    router.push(`/parties/${party.id}`);
  }

  // ── Party preview card ────────────────────────────────────────────────
  const partyPreview = (
    <div className="rounded-2xl overflow-hidden shadow-lg mb-6 w-full">
      <div className="h-20 bg-gradient-to-r from-orange-400 to-amber-400 flex items-center px-6 gap-3">
        <span className="text-5xl">{party.coverEmoji}</span>
        <div className="text-white">
          <p className="font-extrabold text-lg leading-tight">{party.name}</p>
          <p className="text-sm text-orange-100">{party.destination}</p>
        </div>
      </div>
      <div className="bg-white dark:bg-slate-800 px-5 py-4 grid grid-cols-3 gap-4 text-center text-sm">
        <div>
          <p className="font-bold">{party.host.avatarEmoji} {party.host.name ?? "Unknown"}</p>
          <p className="text-muted-foreground text-xs">Host</p>
        </div>
        <div>
          <p className="font-bold flex items-center justify-center gap-1">
            <Users className="h-4 w-4" />{party.memberCount}
          </p>
          <p className="text-muted-foreground text-xs">Members</p>
        </div>
        <div>
          <p className="font-bold">{format(new Date(party.targetDate), "MMM yyyy")}</p>
          <p className="text-muted-foreground text-xs">Holiday date</p>
        </div>
      </div>
      {party.memberAvatars.length > 0 && (
        <div className="bg-white dark:bg-slate-800 border-t px-5 pb-4 flex items-center gap-1">
          <span className="text-xs text-muted-foreground mr-1">Already in:</span>
          {party.memberAvatars.map((a, i) => <span key={i} className="text-xl">{a}</span>)}
        </div>
      )}
    </div>
  );

  // ── Already signed in → one-click join ───────────────────────────────
  if (isSignedIn) {
    return (
      <div className="w-full max-w-sm space-y-4">
        {partyPreview}
        <Card className="shadow-xl border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur">
          <CardContent className="pt-6 space-y-4">
            <div className="text-center space-y-1">
              <h2 className="text-xl font-bold">You&apos;re invited! 🎉</h2>
              <p className="text-muted-foreground text-sm">Ready to join this holiday pot?</p>
            </div>
            <Button variant="sunset" size="lg" className="w-full" onClick={handleJoin} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Join Party ✈️"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Not signed in → name + email + avatar form ───────────────────────
  return (
    <div className="w-full max-w-sm space-y-4">
      {partyPreview}
      <Card className="shadow-xl border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur">
        <CardHeader className="pb-2 text-center">
          <h2 className="text-xl font-bold">Join the party 🙌</h2>
          <p className="text-muted-foreground text-sm">Just your name and email — no password, no faff.</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignInAndJoin} className="space-y-5">
            {/* Avatar picker */}
            <div className="space-y-2">
              <Label>Pick your emoji</Label>
              <div className="flex flex-wrap gap-2">
                {AVATAR_EMOJIS.map((emoji) => (
                  <button key={emoji} type="button" onClick={() => setSelectedAvatar(emoji)}
                    className={`text-2xl p-2 rounded-xl border-2 transition-all ${
                      selectedAvatar === emoji
                        ? "border-orange-500 bg-orange-50 dark:bg-orange-950 scale-110"
                        : "border-transparent hover:border-orange-200"
                    }`}>
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Your name</Label>
              <Input id="name" type="text" placeholder="Alex" value={name}
                onChange={(e) => setName(e.target.value)} required autoFocus maxLength={60} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input id="email" type="email" placeholder="alex@example.com" value={email}
                onChange={(e) => setEmail(e.target.value)} required />
              <p className="text-xs text-muted-foreground">No verification email — you&apos;ll be added instantly.</p>
            </div>

            <Button type="submit" variant="sunset" className="w-full" size="lg" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Join Party ✈️"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
