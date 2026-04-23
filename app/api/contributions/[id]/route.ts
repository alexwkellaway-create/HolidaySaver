import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { validateAmount } from "@/lib/utils";

const updateSchema = z.object({
  amount: z.number().positive().max(50_000).optional(),
  note: z.string().max(200).optional().nullable(),
});

/** Check the user can edit this contribution (owner OR party host) */
async function canEdit(contributionId: string, userId: string) {
  const contribution = await prisma.contribution.findUnique({
    where: { id: contributionId },
    include: { party: { select: { hostId: true } } },
  });
  if (!contribution) return { allowed: false, contribution: null };
  const allowed = contribution.userId === userId || contribution.party.hostId === userId;
  return { allowed, contribution };
}

// ── PATCH /api/contributions/[id] ────────────────────────────────────────
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { allowed, contribution } = await canEdit(params.id, session.user.id);
  if (!contribution) return NextResponse.json({ error: "Contribution not found" }, { status: 404 });
  if (!allowed) return NextResponse.json({ error: "You can only edit your own contributions" }, { status: 403 });

  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  // Validate amount if provided
  if ((body as Record<string, unknown>)?.amount !== undefined) {
    const v = validateAmount((body as Record<string, unknown>).amount);
    if (!v.valid) return NextResponse.json({ error: v.error }, { status: 400 });
  }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

  const updated = await prisma.contribution.update({
    where: { id: params.id },
    data: {
      ...(parsed.data.amount !== undefined && { amount: parsed.data.amount }),
      ...(parsed.data.note !== undefined && { note: parsed.data.note }),
    },
    include: {
      user: { select: { id: true, name: true, avatarEmoji: true } },
      reactions: { include: { user: { select: { id: true } } } },
    },
  });

  return NextResponse.json(updated);
}

// ── DELETE /api/contributions/[id] ───────────────────────────────────────
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { allowed, contribution } = await canEdit(params.id, session.user.id);
  if (!contribution) return NextResponse.json({ error: "Contribution not found" }, { status: 404 });
  if (!allowed) return NextResponse.json({ error: "You can only delete your own contributions" }, { status: 403 });

  await prisma.contribution.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
