import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const ALLOWED_EMOJIS = ["👏", "🔥", "💪", "✈️"];

const reactionSchema = z.object({
  emoji: z.enum(["👏", "🔥", "💪", "✈️"]),
});

// ── POST /api/contributions/[id]/reactions ── Toggle a reaction ──────────
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  // Verify the user is a member of the party that owns this contribution
  const contribution = await prisma.contribution.findUnique({
    where: { id: params.id },
    select: { partyId: true },
  });
  if (!contribution) return NextResponse.json({ error: "Contribution not found" }, { status: 404 });

  const membership = await prisma.partyMember.findUnique({
    where: { userId_partyId: { userId: session.user.id, partyId: contribution.partyId } },
  });
  if (!membership) return NextResponse.json({ error: "Not a member of this party" }, { status: 403 });

  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const parsed = reactionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: `Emoji must be one of: ${ALLOWED_EMOJIS.join(", ")}` },
      { status: 400 }
    );
  }

  // Toggle: if reaction exists, delete it; otherwise create it
  const existing = await prisma.reaction.findUnique({
    where: {
      contributionId_userId_emoji: {
        contributionId: params.id,
        userId: session.user.id,
        emoji: parsed.data.emoji,
      },
    },
  });

  if (existing) {
    await prisma.reaction.delete({ where: { id: existing.id } });
    return NextResponse.json({ action: "removed", emoji: parsed.data.emoji });
  } else {
    await prisma.reaction.create({
      data: { contributionId: params.id, userId: session.user.id, emoji: parsed.data.emoji },
    });
    return NextResponse.json({ action: "added", emoji: parsed.data.emoji });
  }
}
