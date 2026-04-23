import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { validateAmount } from "@/lib/utils";

const createContributionSchema = z.object({
  amount: z.number().positive().max(50_000),
  note: z.string().max(200).optional(),
});

// ── GET /api/parties/[partyId]/contributions ─────────────────────────────
export async function GET(_req: Request, { params }: { params: { partyId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  // Verify membership (security: never return data to non-members)
  const membership = await prisma.partyMember.findUnique({
    where: { userId_partyId: { userId: session.user.id, partyId: params.partyId } },
  });
  if (!membership) return NextResponse.json({ error: "Not a member of this party" }, { status: 403 });

  const contributions = await prisma.contribution.findMany({
    where: { partyId: params.partyId },
    include: {
      user: { select: { id: true, name: true, avatarEmoji: true } },
      reactions: { include: { user: { select: { id: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(contributions);
}

// ── POST /api/parties/[partyId]/contributions ────────────────────────────
export async function POST(req: Request, { params }: { params: { partyId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  // Verify membership
  const membership = await prisma.partyMember.findUnique({
    where: { userId_partyId: { userId: session.user.id, partyId: params.partyId } },
  });
  if (!membership) return NextResponse.json({ error: "Not a member of this party" }, { status: 403 });

  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  // Extra server-side amount validation
  const amountValidation = validateAmount((body as Record<string, unknown>)?.amount);
  if (!amountValidation.valid) return NextResponse.json({ error: amountValidation.error }, { status: 400 });

  const parsed = createContributionSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

  const contribution = await prisma.contribution.create({
    data: {
      userId: session.user.id,
      partyId: params.partyId,
      amount: parsed.data.amount,
      note: parsed.data.note,
    },
    include: {
      user: { select: { id: true, name: true, avatarEmoji: true } },
      reactions: true,
    },
  });

  return NextResponse.json(contribution, { status: 201 });
}
