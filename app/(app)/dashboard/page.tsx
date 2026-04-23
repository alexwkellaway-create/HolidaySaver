import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PartyCard } from "@/components/party-card";
import { Plus } from "lucide-react";

export const metadata = { title: "My Pots" };

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  // Fetch all parties this user is a member of, with totals
  const memberships = await prisma.partyMember.findMany({
    where: { userId: session.user.id },
    include: {
      party: {
        include: {
          host: { select: { id: true, name: true, avatarEmoji: true } },
          members: { include: { user: { select: { id: true, name: true, avatarEmoji: true } } } },
          _count: { select: { contributions: true } },
        },
      },
    },
    orderBy: { joinedAt: "desc" },
  });

  // For each party, compute the total raised
  const partiesWithTotals = await Promise.all(
    memberships.map(async (m) => {
      const agg = await prisma.contribution.aggregate({
        where: { partyId: m.partyId },
        _sum: { amount: true },
      });
      return {
        party: m.party,
        totalRaised: agg._sum.amount ?? 0,
      };
    })
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold">
            My Pots ✈️
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {partiesWithTotals.length === 0
              ? "No pots yet — create one below!"
              : `${partiesWithTotals.length} pot${partiesWithTotals.length !== 1 ? "s" : ""} active`}
          </p>
        </div>
        <Link href="/parties/new">
          <Button variant="sunset" className="gap-1.5">
            <Plus className="h-4 w-4" />
            New Pot
          </Button>
        </Link>
      </div>

      {/* Party cards */}
      {partiesWithTotals.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-orange-200 dark:border-orange-900 py-20 text-center gap-4">
          <div className="text-6xl">🏖️</div>
          <h2 className="font-bold text-lg">No holiday pots yet</h2>
          <p className="text-muted-foreground max-w-xs">
            Create your first pot and invite your friends. The holiday isn&apos;t going to book itself! 😄
          </p>
          <Link href="/parties/new">
            <Button variant="sunset" size="lg" className="mt-2">
              Create my first pot 🎉
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {partiesWithTotals.map(({ party, totalRaised }) => (
            <PartyCard
              key={party.id}
              party={party}
              totalRaised={totalRaised}
              currentUserId={session.user.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
