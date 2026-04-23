import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updatePartySchema = z.object({
  name: z.string().min(1).max(80).optional(),
  destination: z.string().min(1).max(100).optional(),
  targetAmount: z.number().positive().max(1_000_000).optional(),
  targetDate: z.string().optional(),
  coverEmoji: z.string().max(10).optional(),
  hostId: z.string().optional(), // For host transfer
});

/** Verify the requesting user is a member of the party. Returns party or null. */
async function getPartyAsMember(partyId: string, userId: string) {
  const party = await prisma.party.findUnique({
    where: { id: partyId },
    include: {
      host: { select: { id: true, name: true, avatarEmoji: true } },
      members: {
        include: { user: { select: { id: true, name: true, email: true, avatarEmoji: true } } },
      },
    },
  });
  if (!party) return null;
  const isMember = party.members.some((m) => m.userId === userId);
  if (!isMember) return null;
  return party;
}

// ── GET /api/parties/[partyId] ───────────────────────────────────────────
export async function GET(_req: Request, { params }: { params: { partyId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const party = await getPartyAsMember(params.partyId, session.user.id);
  if (!party) return NextResponse.json({ error: "Party not found or you are not a member" }, { status: 404 });

  return NextResponse.json({
    ...party,
    targetDate: party.targetDate.toISOString(),
    createdAt: party.createdAt.toISOString(),
    updatedAt: party.updatedAt.toISOString(),
    members: party.members.map((m) => ({ ...m, joinedAt: m.joinedAt.toISOString() })),
  });
}

// ── PATCH /api/parties/[partyId] ── Host-only update ────────────────────
export async function PATCH(req: Request, { params }: { params: { partyId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const party = await getPartyAsMember(params.partyId, session.user.id);
  if (!party) return NextResponse.json({ error: "Party not found" }, { status: 404 });

  // Host-only action — verify server-side
  if (party.hostId !== session.user.id) {
    return NextResponse.json({ error: "Only the host can edit party details" }, { status: 403 });
  }

  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const parsed = updatePartySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

  // If transferring host, verify the new host is a member
  if (parsed.data.hostId) {
    const newHostIsMember = party.members.some((m) => m.userId === parsed.data.hostId);
    if (!newHostIsMember) return NextResponse.json({ error: "New host must be a party member" }, { status: 400 });
  }

  const updated = await prisma.party.update({
    where: { id: params.partyId },
    data: {
      ...(parsed.data.name && { name: parsed.data.name }),
      ...(parsed.data.destination && { destination: parsed.data.destination }),
      ...(parsed.data.targetAmount && { targetAmount: parsed.data.targetAmount }),
      ...(parsed.data.targetDate && { targetDate: new Date(parsed.data.targetDate) }),
      ...(parsed.data.coverEmoji && { coverEmoji: parsed.data.coverEmoji }),
      ...(parsed.data.hostId && { hostId: parsed.data.hostId }),
    },
  });

  return NextResponse.json({
    ...updated,
    targetDate: updated.targetDate.toISOString(),
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  });
}

// ── DELETE /api/parties/[partyId] ── Host-only delete ───────────────────
export async function DELETE(_req: Request, { params }: { params: { partyId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const party = await getPartyAsMember(params.partyId, session.user.id);
  if (!party) return NextResponse.json({ error: "Party not found" }, { status: 404 });

  if (party.hostId !== session.user.id) {
    return NextResponse.json({ error: "Only the host can delete a party" }, { status: 403 });
  }

  await prisma.party.delete({ where: { id: params.partyId } });
  return NextResponse.json({ success: true });
}
