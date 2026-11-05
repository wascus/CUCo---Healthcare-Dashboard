// prisma/seed.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Where your frontend serves these images from.
// If your assets live in /public, something like this usually works:
const IMAGE_BASE = "/assets/RetroCats/CatItems/Decorations/items";

type SeedItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: "window" | "furniture" | "decoration" | "toy" | "other";
  x: number;
  y: number;
};

// Your active SHOP_ITEMS (those not commented out)
const items: SeedItem[] = [
  // Default room items
  { id: "item_33", name: "Cat Bed", description: "Cozy bed for sleeping", price: 0, category: "furniture", x: 202, y: 198 },
  { id: "item_60", name: "Plant", description: "Green decoration", price: 30, category: "decoration", x: 140, y: 160 },
  { id: "item_59", name: "Shelf", description: "Wall shelf", price: 40, category: "furniture", x: 40, y: 210 },
  { id: "item_63", name: "Big Window", description: "Large window", price: 50, category: "window", x: 150, y: 70 },
  { id: "item_14", name: "Toy Ball", description: "Fun toy", price: 15, category: "toy", x: 400, y: 225 },
  { id: "item_78", name: "Yarn Ball", description: "Another toy", price: 18, category: "toy", x: 320, y: 220 },
  { id: "item_100", name: "Water Bowl", description: "Fresh water", price: 20, category: "other", x: 270, y: 370 },
  { id: "item_146", name: "Food Bowl", description: "Yummy food", price: 20, category: "other", x: 220, y: 395 },

  // Windows (high on walls)
  { id: "item_1", name: "Small Window", description: "Cozy white window", price: 30, category: "window", x: 290, y: 100 },

  // Furniture (on floor)
  { id: "item_4", name: "Small Shelf", description: "Perfect for decorations", price: 40, category: "furniture", x: 100, y: 250 },

  // Wall decorations (mid-height)
];

function imageFromId(itemId: string): string {
  // expects format "item_<number>"
  const n = itemId.split("_")[1];
  return `${IMAGE_BASE}/sprite_${n}.png`;
}

async function main() {
  const itemIdsToKeep = items.map((it) => it.id);

  // Deactivate items that are no longer in the seed list
  await prisma.item.updateMany({
    where: {
      id: { notIn: itemIdsToKeep },
    },
    data: {
      isActive: false,
    },
  });

  for (const it of items) {
    const image = imageFromId(it.id);

    await prisma.item.upsert({
      where: { id: it.id }, // we're using your string IDs like "item_33"
      update: {
        name: it.name,
        description: it.description,
        price: it.price,
        image,
        category: it.category,
        x: it.x,
        y: it.y,
        isActive: true,
        happinessBonus: it.price,
      },
      create: {
        id: it.id, // override default cuid() with your "item_XX"
        name: it.name,
        description: it.description,
        price: it.price,
        image,
        category: it.category,
        x: it.x,
        y: it.y,
        isActive: true,
        happinessBonus: it.price,
      },
    });
  }
  console.log(`Seeded ${items.length} items.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
