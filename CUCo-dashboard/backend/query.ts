import { prisma } from './src/lib/prisma';

async function main() {
  const inventoryItems = await prisma.inventoryItem.findMany({
    include: { item: true, user: { select: { id: true, email: true } } },
  });
  
  console.log('=== All Inventory Items ===');
  inventoryItems.forEach((inv) => {
    console.log(`User: ${inv.user?.email}, Item: ${inv.item?.name}, Quantity: ${inv.quantity}`);
  });
  
  const users = await prisma.user.findMany({
    select: { id: true, email: true, balance: true },
  });
  
  console.log('\n=== All Users ===');
  users.forEach((u) => {
    console.log(`${u.email}: balance=${u.balance}`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
