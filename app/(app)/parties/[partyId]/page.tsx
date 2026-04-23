import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { formatCurrency, progressMessage } from "@/lib/utils";
import { PartyHeader } from "@/components/party-header";
import { ContributionForm } from "@/components/contribution-form";
import { ActivityFeed } from "@/components/activity-feed";
import { MembersList } from "@/components/members-list";
import { CountdownTimer } from "@/components/countdown-timer";
import { Leaderboard } from "@/components/leaderboard";
import { ProgressSection } from "@/components/progress-section";
import { InviteButton } from "@/components/invite-button";
import type { Metadata } from "next";

interface Props {
  params: { partyId: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const party = await prisma.party.findUnique({ where: { id: params.partyId } });
  return { title: party ? `${party.coverEmoji} ${party.name}` : "Party" };
}

export default async function PartyPage({ params }: Props) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/signin");

  const party = await prisma.party.findUnique({
    where: { id: params.partyId },
    include: {
      host: { select: { id: true, name: true, avatarEmoji: true } },
      members: {
        include: { user: { select: { id: true, name: true, email: true, avatarEmoji: true } } },
        orderBy: { joinedAt: "asc" },
      },
    },
  });

  if (!party) notFound();

  // Security: verify the current user is a member of this party
  const membership = party.members.find((m) => m.userId === session.user.id);
  if (!membership) {
    // Not a member — send them to the join page if the token is valid
    redirect(`/join/${party.inviteToken}`);
  }

  // Fetch contributions with user info + reactions
  const contributions = await prisma.contribution.findMany({
    where: { partyId: party.id },
    include: {
      user: { select: { id: true, name: true, avatarEmoji: true } },
      reactions: {
        include: { user: { select: { id: true, name: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Compute totals
  const totalRaised = contributions.reduce((sum, c) => sum + c.amount, 0);
  const percentComplete = Math.min(100, (totalRaised / party.targetAmount) * 100);
  const isHost = party.hostId === session.user.id;

  // Per-member totals (for leaderboard + progress)
  const memberTotals = party.members.map((m) => {
    const total = contributions
      .filter((c) => c.userId === m.userId)
      .reduce((sum, c) => sum + c.amount, 0);
    const target = m.personalTarget ?? party.targetAmount / party.members.length;
    return { member: m, totalContributed: total, target };
  });

  // Serialise dates for client components
  const partyData = {
    ...party,
    targetDate: party.targetDate.toISOString(),
    createdAt: party.createdAt.toISOString(),
    updatedAt: party.updatedAt.toISOString(),
    host: party.host,
    members: party.members.map((m) => ({
      ...m,
      joinedAt: m.joinedAt.toISOString(),
    })),
  };

  const contributionsData = contributions.map((c) => ({
    ...c,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
    reactions: c.reactions.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })),
  }));

  return (
    <div className="space-y-6">
      {/* Party header with cover, progress, countdown */}
      <PartyHeader
        party={partyData}
        totalRaised={totalRaised}
        percentComplete={percentComplete}
        isHost={isHost}
      />

      {/* Motivational message */}
      <div className="rounded-2xl bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 border border-orange-100 dark:border-orange-900 px-5 py-4 text-center">
        <p className="text-sm font-medium text-orange-700 dark:text-orange-300">
          {progressMessage(percentComplete)}
        </p>
      </div>

      {/* Main grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left col — activity feed + contribution form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contribution form */}
          <ContributionForm partyId={party.id} />

          {/* Activity feed */}
          <ActivityFeed
            contributions={contributionsData}
            currentUserId={session.user.id}
            isHost={isHost}
            partyId={party.id}
          />
        </div>

        {/* Right col — stats */}
        <div className="space-y-4">
          <CountdownTimer targetDate={partyData.targetDate} />

          <ProgressSection
            memberTotals={memberTotals.map((mt) => ({
              ...mt,
              member: { ...mt.member, joinedAt: mt.member.joinedAt.toISOString() },
            }))}
            totalRaised={totalRaised}
            targetAmount={party.targetAmount}
          />

          <Leaderboard
            memberTotals={memberTotals.map((mt) => ({
              ...mt,
              member: { ...mt.member, joinedAt: mt.member.joinedAt.toISOString() },
            }))}
            currentUserId={session.user.id}
          />

          {/* Invite section */}
          <InviteButton
            partyId={party.id}
            inviteToken={party.inviteToken}
            isHost={isHost}
          />
        </div>
      </div>
    </div>
  );
}
