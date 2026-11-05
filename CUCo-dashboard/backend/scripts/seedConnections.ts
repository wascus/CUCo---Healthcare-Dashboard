/* eslint-disable no-console */
import { PrismaClient, type RelationshipType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function getArg(name: string): string | undefined {
  const flag = `--${name}=`;
  const match = process.argv.find((a) => a.startsWith(flag));
  return match ? match.slice(flag.length) : undefined;
}

async function main() {
  const userId = getArg("userId");
  const email = getArg("email");
  const username = getArg("username");

  if (!userId && !email && !username) {
    console.error(
      "Usage:\n" +
        "  npx tsx backend/scripts/seedConnections.ts --userId=<uuid>\n" +
        "  OR --email=<email> OR --username=<username>"
    );
    process.exit(1);
  }

  // 1) Resolve owner (the current user)
  const owner = userId
    ? await prisma.user.findUnique({ where: { id: userId } })
    : email
    ? await prisma.user.findUnique({ where: { email } })
    : await prisma.user.findUnique({ where: { username: username! } });

  if (!owner) throw new Error("Owner user not found.");
  console.log("Seeding connections for:", {
    id: owner.id,
    email: owner.email,
    username: owner.username,
  });

  // 2) Prepare 5 people to create (email = firstName@test.com)
  const PASSWORD = "Ttest123123!";
  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  type PersonSeed = {
    first: string;                // used for email/username
    name: string;                 // display name
    relationship: RelationshipType;
    label?: string | null;
  };

  const people: PersonSeed[] = [
    { first: "dad",        name: "Dad",        relationship: "PARENT",      label: "Dad" },
    { first: "mom",        name: "Mom",        relationship: "PARENT",      label: "Mom" },
    { first: "bestfriend", name: "Best Friend",relationship: "BEST_FRIEND", label: "Best friend" },
    { first: "partner",    name: "Partner",    relationship: "PARTNER",     label: "Partner" },
    { first: "doctor",     name: "Dr. Green",  relationship: "DOCTOR",      label: "Family doctor" },
  ];

  // 3) Upsert users, then upsert connections owner -> user (and reciprocal)
  for (const p of people) {
    const userEmail = `${p.first}@test.com`.toLowerCase();
    const userUsername = p.first.toLowerCase();

    // Upsert the person as a registered user
    const person = await prisma.user.upsert({
      where: { email: userEmail },
      update: {
        name: p.name,
        username: userUsername, // will fail if unique clash with other existing, change if needed
      },
      create: {
        email: userEmail,
        username: userUsername,
        name: p.name,
        passwordHash, // <-- rename if your schema uses a different field
      },
      select: { id: true, email: true, username: true, name: true },
    });

    if (person.id === owner.id) {
      console.log(`⚠️  Skipping self connection for '${p.first}'.`);
      continue;
    }

    // Owner -> Person (primary connection)
    await prisma.connection.upsert({
      where: { ownerId_targetUserId: { ownerId: owner.id, targetUserId: person.id } },
      create: {
        owner: { connect: { id: owner.id } },
        targetUser: { connect: { id: person.id } },
        relationship: p.relationship,
        label: p.label ?? null,
        note: null,                  // put "access=full|partial" here later if you like
        status: "ACCEPTED",          // visible right away
        invitedVia: "internal",
      },
      update: {
        relationship: p.relationship,
        ...(p.label !== undefined ? { label: p.label } : {}),
        status: "ACCEPTED",
      },
    });

    // Reciprocal Person -> Owner (nice UX)
    await prisma.connection.upsert({
      where: { ownerId_targetUserId: { ownerId: person.id, targetUserId: owner.id } },
      create: {
        owner: { connect: { id: person.id } },
        targetUser: { connect: { id: owner.id } },
        relationship: "OTHER",
        label: null,
        note: null,
        status: "ACCEPTED",
        invitedVia: "internal",
      },
      update: { status: "ACCEPTED" },
    });

    console.log(`Created/connected ${p.name} <${userEmail}>`);
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
