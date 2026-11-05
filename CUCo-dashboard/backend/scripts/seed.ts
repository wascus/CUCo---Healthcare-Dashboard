import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const TOPICS = [
  { key: "first_holiday", title: "First holiday without them", promptText: "How did it feel? What helped?" },
  { key: "milestones", title: "Important milestones", promptText: "What dates will be hard? Plan support." },
  { key: "support_network", title: "Support network", promptText: "Who can you lean on this week?" },
];

async function main() {
  for (const t of TOPICS) {
    await prisma.griefTopic.upsert({
      where: { key: t.key },
      update: { title: t.title, promptText: t.promptText ?? null },
      create: t,
    });
  }
  console.log("Seeded grief topics:", TOPICS.length);
}

main().finally(() => prisma.$disconnect());
