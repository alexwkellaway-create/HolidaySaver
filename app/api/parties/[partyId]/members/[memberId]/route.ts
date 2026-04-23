import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// ── DELETE /api/parties/[partyId]/members/[memberId] ── Host removes member
export async function DELETE(
  _req: Request,
  { params }: { params: { partyId: string; memberId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const party = await prisma.party.findUnique({ where: { id: params.partyId } });
  if (!party) return NextResponse.json({ error: "Party not found" }, { status: 404 });

  // Server-side host check
  if (party.hostId !== session.user.id) {
    return NextResponse.json({ error: "Only the host can remove members" }, { status: 403 });
  }

  // Prevent removing the host themselves
  const member = await prisma.partyMember.findUnique({ where: { id: params.memberId } });
  if (!member) return NextResponse.json({ error: "Member not found" }, { status: 404 });
  if (member.userId === party.hostId) {
    return NextResponse.json({ error: "Cannot remove the host. Transfer host role first." }, { status: 400 });
  }

  await prisma.partyMember.delete({ where: { id: params.memberId } });
  return NextResponse.json({ success: true });
}
