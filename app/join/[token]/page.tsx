import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { JoinPartyClient } from "@/components/join-party-client";
import type { Metadata } from "next";

interface Props {
  params: { token: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const party = await prisma.party.findUnique({ where: { inviteToken: params.token } });
  return {
    title: party ? `Join ${party.name}` : "Invalid invite link",
  };
}

export default async function JoinPage({ params }: Props) {
  // Look up the party by invite token
  const party = await prisma.party.findUnique({
    where: { inviteToken: params.token },
    include: {
      host: { select: { id: true, name: true, avatarEmoji: true } },
      members: {
        include: { user: { select: { id: true, name: true, avatarEmoji: true } } },
      },
    },
  });

  // Invalid or revoked token
  if (!party) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 px-4">
        <div className="text-center max-w-md space-y-4">
          <div className="text-6xl">😬</div>
          <h1 className="text-2xl font-bold">This invite link has expired</h1>
          <p className="text-muted-foreground">
            The host may have regenerated it, or it was revoked. Ask them for a new link!
          </p>
        </div>
      </main>
    );
  }

  const session = await getServerSession(authOptions);

  // If signed in, check whether they're already a member
  if (session) {
    const isMember = party.members.some((m) => m.userId === session.user.id);
    if (isMember) {
      redirect(`/parties/${party.id}`);
    }
  }

  // Serialise for client
  const partyData = {
    id: party.id,
    name: party.name,
    destination: party.destination,
    coverEmoji: party.coverEmoji,
    targetDate: party.targetDate.toISOString(),
    host: party.host,
    memberCount: party.members.length,
    memberAvatars: party.members.slice(0, 8).map((m) => m.user.avatarEmoji),
    inviteToken: party.inviteToken,
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-amber-50 to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 px-4 py-8">
      <JoinPartyClient party={partyData} isSignedIn={!!session} />
    </main>
  );
}
