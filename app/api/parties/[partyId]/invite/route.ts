import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { nanoid } from "nanoid";

// ── POST /api/parties/[partyId]/invite ── Regenerate invite token ────────
// Host-only action.
export async function POST(_req: Request, { params }: { params: { partyId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const party = await prisma.party.findUnique({ where: { id: params.partyId } });
  if (!party) return NextResponse.json({ error: "Party not found" }, { status: 404 });

  // Server-side host check
  if (party.hostId !== session.user.id) {
    return NextResponse.json({ error: "Only the host can regenerate the invite link" }, { status: 403 });
  }

  const updated = await prisma.party.update({
    where: { id: params.partyId },
    data: { inviteToken: nanoid(21) },
    select: { inviteToken: true },
  });

  return NextResponse.json({ inviteToken: updated.inviteToken });
}
