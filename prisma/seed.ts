/**
 * Seed script — creates a demo party with fake members and contributions
 * so you can see the app fully populated on first run.
 *
 * Run with:  npm run db:seed
 */
import { PrismaClient } from "@prisma/client";
import { nanoid } from "nanoid";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // ── Users ────────────────────────────────────────────────────────────────
  const alice = await prisma.user.upsert({
    where: { email: "alice@example.com" },
    update: {},
    create: {
      email: "alice@example.com",
      name: "Alice",
      avatarEmoji: "🌸",
    },
  });

  const bob = await prisma.user.upsert({
    where: { email: "bob@example.com" },
    update: {},
    create: {
      email: "bob@example.com",
      name: "Bob",
      avatarEmoji: "🎸",
    },
  });

  const carol = await prisma.user.upsert({
    where: { email: "carol@example.com" },
    update: {},
    create: {
      email: "carol@example.com",
      name: "Carol",
      avatarEmoji: "🌺",
    },
  });

  const dave = await prisma.user.upsert({
    where: { email: "dave@example.com" },
    update: {},
    create: {
      email: "dave@example.com",
      name: "Dave",
      avatarEmoji: "🦁",
    },
  });

  // ── Party ────────────────────────────────────────────────────────────────
  const existingParty = await prisma.party.findFirst({
    where: { name: "Ibiza 2026 🌴" },
  });

  const party = existingParty ?? (await prisma.party.create({
    data: {
      name: "Ibiza 2026 🌴",
      destination: "Ibiza, Spain",
      targetAmount: 3000,
      targetDate: new Date("2026-07-15"),
      coverEmoji: "🏖️",
      hostId: alice.id,
      inviteToken: nanoid(21),
    },
  }));

  // ── Members ──────────────────────────────────────────────────────────────
  for (const user of [alice, bob, carol, dave]) {
    await prisma.partyMember.upsert({
      where: { userId_partyId: { userId: user.id, partyId: party.id } },
      update: {},
      create: { userId: user.id, partyId: party.id },
    });
  }

  // ── Contributions ────────────────────────────────────────────────────────
  const contributions = [
    { user: alice, amount: 250, note: "First contribution! 🎉", daysAgo: 30 },
    { user: bob, amount: 100, note: "Let's gooo! ✈️", daysAgo: 28 },
    { user: carol, amount: 200, note: "Payday treat 💸", daysAgo: 25 },
    { user: dave, amount: 150, note: "Side hustle money 🔥", daysAgo: 22 },
    { user: alice, amount: 300, note: "Big month!", daysAgo: 20 },
    { user: bob, amount: 200, note: "Almost at my target 👏", daysAgo: 15 },
    { user: carol, amount: 175, note: "Getting closer 🍹", daysAgo: 12 },
    { user: alice, amount: 100, note: "Quick top-up", daysAgo: 7 },
    { user: dave, amount: 250, note: "Freelance bonus 💰", daysAgo: 3 },
    { user: bob, amount: 125, note: "Sold my old guitar!", daysAgo: 1 },
  ];

  const createdContributions = [];
  for (const c of contributions) {
    const date = new Date();
    date.setDate(date.getDate() - c.daysAgo);

    const existing = await prisma.contribution.findFirst({
      where: { userId: c.user.id, partyId: party.id, amount: c.amount, note: c.note },
    });

    if (!existing) {
      const contribution = await prisma.contribution.create({
        data: {
          userId: c.user.id,
          partyId: party.id,
          amount: c.amount,
          note: c.note,
          createdAt: date,
        },
      });
      createdContributions.push({ contribution, user: c.user });
    }
  }

  // ── Reactions ────────────────────────────────────────────────────────────
  // Add some reactions to the first few contributions
  const allContributions = await prisma.contribution.findMany({
    where: { partyId: party.id },
    take: 5,
    orderBy: { createdAt: "asc" },
  });

  const reactionEmojis = ["👏", "🔥", "💪", "✈️"];
  const reactors = [alice, bob, carol, dave];

  for (const contribution of allContributions) {
    // Add 2-3 random reactions
    const numReactions = Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < numReactions; i++) {
      const reactor = reactors[i % reactors.length];
      const emoji = reactionEmojis[Math.floor(Math.random() * reactionEmojis.length)];

      // Skip if it's the contributor reacting to their own post (allowed, but let's vary it)
      if (reactor.id === contribution.userId) continue;

      await prisma.reaction.upsert({
        where: {
          contributionId_userId_emoji: {
            contributionId: contribution.id,
            userId: reactor.id,
            emoji,
          },
        },
        update: {},
        create: {
          contributionId: contribution.id,
          userId: reactor.id,
          emoji,
        },
      });
    }
  }

  console.log(`✅ Seeded party: "${party.name}"`);
  console.log(`   Invite link token: ${party.inviteToken}`);
  console.log(`   Try: http://localhost:3000/join/${party.inviteToken}`);
  console.log(`   Members: Alice (host), Bob, Carol, Dave`);
  console.log(`   Contributions: ${contributions.length} total`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
