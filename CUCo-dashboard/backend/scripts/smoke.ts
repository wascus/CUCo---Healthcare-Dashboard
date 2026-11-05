/* eslint-disable no-console */
import { PrismaClient, type RelationshipType, type AccessLevel } from "@prisma/client";

const prisma = new PrismaClient();

// --- tiny CLI arg parser ---
function getArg(name: string): string | undefined {
  const flag = `--${name}=`;
  const match = process.argv.find(a => a.startsWith(flag));
  return match ? match.slice(flag.length) : undefined;
}

async function main() {
  const userId = getArg("userId");
  const email = getArg("email");
  const username = getArg("username");

  if (!userId && !email && !username) {
    console.error("Usage: npx tsx backend/scripts/seedConnections.ts --userId=<uuid> | --email=<email> | --username=<username>");
    process.exit(1);
  }

  // 1) Resolve owner
  const owner =
    userId
      ? await prisma.user.findUnique({ where: { id: userId } })
      : email
        ? await prisma.user.findUnique({ where: { email } })
        : await prisma.user.findUnique({ where: { username: username! } });

  if (!owner) {
    throw new Error("Owner user not found.");
  }
  console.log("Seeding connections for:", { id: owner.id, email: owner.email, username: owner.username });

  // 2) Optional: try to connect to some existing registered users by username
  const userTargets: Array<{
    username: string;
    relationship: RelationshipType;
    accessLevel?: AccessLevel;
    label?: string | null;
    tags?: string[];
  }> = [
    { username: "alice", relationship: "GOOD_FRIEND", accessLevel: "POSITIVE_ONLY", label: "Gym buddy", tags: ["friend", "gym"] },
    { username: "therapist", relationship: "THERAPIST", accessLevel: "FULL", label: "Therapist", tags: ["support"] },
  ];

  for (const t of userTargets) {
    const target = await prisma.user.findUnique({ where: { username: t.username } });
    if (!target) {
      console.log(`⚠️  Skipping user '${t.username}' (not found).`);
      continue;
    }
    if (target.id === owner.id) {
      console.log(`⚠️  Skipping self connection for '${t.username}'.`);
      continue;
    }

    await prisma.connection.upsert({
      where: { ownerId_targetUserId: { ownerId: owner.id, targetUserId: target.id } },
      create: {
        owner: { connect: { id: owner.id } },
        targetUser: { connect: { id: target.id } },
        relationship: t.relationship,
        accessLevel: t.accessLevel ?? "NONE",
        label: t.label ?? null,            // nullable in DB
        tags: t.tags ?? [],
        status: "ACCEPTED",                // make it visible right away
        invitedVia: "internal",
      },
      update: {
        relationship: t.relationship,
        accessLevel: t.accessLevel ?? "NONE",
        ...(t.label !== undefined ? { label: t.label } : {}),
        ...(t.tags !== undefined ? { tags: { set: t.tags } } : {}),
        status: "ACCEPTED",
      },
    });

    // Ensure reciprocal for UX symmetry
    await prisma.connection.upsert({
      where: { ownerId_targetUserId: { ownerId: target.id, targetUserId: owner.id } },
      create: {
        owner: { connect: { id: target.id } },
        targetUser: { connect: { id: owner.id } },
        relationship: "OTHER",
        accessLevel: "NONE",
        label: null,
        tags: [],
        status: "ACCEPTED",
        invitedVia: "internal",
      },
      update: { status: "ACCEPTED" },
    });

    console.log(`Connected owner ↔ ${t.username}`);
  }

  // 3) Create/Upsert a few contacts + connections
  const contacts: Array<{
    displayName: string;
    email?: string;
    phone?: string;
    notes?: string;
    relationship: RelationshipType;
    accessLevel?: AccessLevel;
    label?: string | null;
    tags?: string[];
  }> = [
    {
      displayName: "Mom",
      email: "mom@example.com",
      relationship: "PARENT",
      accessLevel: "FULL",
      label: "Mom",
      tags: ["family", "support"],
    },
    {
      displayName: "Dr. Green",
      email: "dr.green@example.com",
      relationship: "DOCTOR",
      accessLevel: "NEGATIVE_ONLY",
      label: "Family doctor",
      tags: ["medical"],
    },
    {
      displayName: "Eli Cohen",
      relationship: "GOOD_FRIEND",
      accessLevel: "POSITIVE_ONLY",
      label: "Neighbor",
      tags: ["neighbor", "friend"],
      phone: "+31 6 1234 5678",
    },
  ];

  for (const c of contacts) {
    // Try reuse by (ownerId,email) if email present
    const existing = c.email
      ? await prisma.contact.findFirst({ where: { ownerId: owner.id, email: c.email } })
      : null;

    const contact = existing ?? (await prisma.contact.create({
      data: {
        ownerId: owner.id,
        displayName: c.displayName,
        email: c.email ?? null,     // map undefined -> null for nullable fields
        phone: c.phone ?? null,
        notes: c.notes ?? null,
      },
    }));

    await prisma.connection.upsert({
      where: { ownerId_contactId: { ownerId: owner.id, contactId: contact.id } },
      create: {
        owner: { connect: { id: owner.id } },
        contact: { connect: { id: contact.id } },
        relationship: c.relationship,
        accessLevel: c.accessLevel ?? "NONE",
        label: c.label ?? null,
        tags: c.tags ?? [],
        status: "ACCEPTED",
        invitedVia: "internal",
      },
      update: {
        relationship: c.relationship,
        accessLevel: c.accessLevel ?? "NONE",
        ...(c.label !== undefined ? { label: c.label } : {}),
        ...(c.tags !== undefined ? { tags: { set: c.tags } } : {}),
        status: "ACCEPTED",
      },
    });

    console.log(`Connected owner → contact '${c.displayName}'`);
  }

  console.log("Seeding done.");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
