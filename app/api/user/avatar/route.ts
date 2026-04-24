import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ALLOWED_EMOJIS = ["🌸", "🎸", "🌺", "🦁", "🐬", "🦋", "🌻", "🦊", "🐼", "🌈", "⚡", "🔥", "🙂"];

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { avatarEmoji } = await req.json();
  if (!ALLOWED_EMOJIS.includes(avatarEmoji)) {
    return NextResponse.json({ error: "Invalid emoji" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { avatarEmoji },
  });

  return NextResponse.json({ success: true });
}
