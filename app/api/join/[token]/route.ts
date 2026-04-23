import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Simple in-memory rate limiter for the join endpoint.
 * Prevents brute-forcing invite tokens.
 * In production, replace with Redis (e.g. Upstash) for multi-instance deployments.
 */
const joinAttempts = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10; // max attempts per IP per window
const RATE_WINDOW_MS = 60 * 1000; // 1 minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = joinAttempts.get(ip);

  if (!record || now > record.resetAt) {
    joinAttempts.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true; // allowed
  }

  if (record.count >= RATE_LIMIT) return false; // blocked

  record.count++;
  return true; // allowed
}

// ── POST /api/join/[token] ── Join a party via invite token ─────────────
export async function POST(req: Request, { params }: { params: { token: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  // Rate limit by user ID (safer than IP in serverless environments)
  const allowed = checkRateLimit(session.user.id);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many join attempts. Please wait a minute." },
      { status: 429 }
    );
  }

  // Look up the party by invite token
  const party = await prisma.party.findUnique({
    where: { inviteToken: params.token },
    select: { id: true, name: true },
  });

  if (!party) {
    return NextResponse.json(
      { error: "This invite link is invalid or has been revoked." },
      { status: 404 }
    );
  }

  // Check if already a member
  const existing = await prisma.partyMember.findUnique({
    where: { userId_partyId: { userId: session.user.id, partyId: party.id } },
  });

  if (existing) {
    // Already a member — just redirect them
    return NextResponse.json({ partyId: party.id, alreadyMember: true });
  }

  // Add as member
  await prisma.partyMember.create({
    data: { userId: session.user.id, partyId: party.id },
  });

  return NextResponse.json({ partyId: party.id, alreadyMember: false }, { status: 201 });
}
