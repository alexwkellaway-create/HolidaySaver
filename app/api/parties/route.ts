import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { nanoid } from "nanoid";
import { z } from "zod";

// ── Validation schema ─────────────────────────────────────────────────────
const createPartySchema = z.object({
  name: z.string().min(1).max(80),
  destination: z.string().min(1).max(100),
  targetAmount: z.number().positive().max(1_000_000),
  targetDate: z.string().refine((d) => !isNaN(Date.parse(d)) && new Date(d) > new Date(), {
    message: "Target date must be in the future",
  }),
  coverEmoji: z.string().max(10).default("✈️"),
});

// ── GET /api/parties ── List the current user's parties ─────────────────
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const memberships = await prisma.partyMember.findMany({
    where: { userId: session.user.id },
    include: {
      party: {
        include: {
          host: { select: { id: true, name: true, avatarEmoji: true } },
          members: { include: { user: { select: { id: true, name: true, avatarEmoji: true } } } },
        },
      },
    },
  });

  return NextResponse.json(memberships.map((m) => m.party));
}

// ── POST /api/parties ── Create a new party ──────────────────────────────
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const parsed = createPartySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { name, destination, targetAmount, targetDate, coverEmoji } = parsed.data;

  // Create party + add creator as first member in a transaction
  const party = await prisma.$transaction(async (tx) => {
    const p = await tx.party.create({
      data: {
        name,
        destination,
        targetAmount,
        targetDate: new Date(targetDate),
        coverEmoji,
        hostId: session.user.id,
        inviteToken: nanoid(21), // cryptographically random token
      },
    });
    // Auto-add the creator as a member
    await tx.partyMember.create({
      data: { userId: session.user.id, partyId: p.id },
    });
    return p;
  });

  return NextResponse.json(party, { status: 201 });
}
