/**
 * This route handles the redirect AFTER a magic-link sign-in from the join page.
 * It:
 *  1. Sets the user's avatarEmoji if they just picked one
 *  2. Adds them as a party member
 *  3. Redirects to the party dashboard
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ALLOWED_EMOJIS = ["🌸", "🎸", "🌺", "🦁", "🐬", "🦋", "🌻", "🦊", "🐼", "🌈", "⚡", "🔥"];

export async function GET(req: Request, { params }: { params: { token: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.redirect(new URL(`/auth/signin`, req.url));
  }

  const { searchParams } = new URL(req.url);
  const avatar = searchParams.get("avatar");

  // Validate and set avatar
  if (avatar && ALLOWED_EMOJIS.includes(avatar)) {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { avatarEmoji: avatar },
    });
  }

  // Look up party
  const party = await prisma.party.findUnique({
    where: { inviteToken: params.token },
    select: { id: true },
  });

  if (!party) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Add as member (upsert to handle race conditions)
  await prisma.partyMember.upsert({
    where: { userId_partyId: { userId: session.user.id, partyId: party.id } },
    update: {},
    create: { userId: session.user.id, partyId: party.id },
  });

  return NextResponse.redirect(new URL(`/parties/${party.id}`, req.url));
}
