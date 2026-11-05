// src/modules/inventory/inventory.service.ts
import { prisma } from "../../lib/prisma";
import { toInventoryDTO, type InventoryItemDTO } from "./inventory.model";

/** Shape expected by the upsert route body */
type UpsertPayload = {
  itemId: string;
  delta: number; // positive to add, negative to subtract, 0 = no-op (ensure line exists)
};

/** List inventory for a user */
export async function listInventoryForUser(
  userId: string,
  opts: { includeItem?: boolean; limit?: number; offset?: number } = {}
): Promise<InventoryItemDTO[]> {
  const { includeItem = true, limit = 200, offset = 0 } = opts;

  const rows = await prisma.inventoryItem.findMany({
    where: { userId, quantity: { gt: 0 } },
    include: { item: includeItem },
    take: limit,
    skip: offset,
    orderBy: { createdAt: "asc" },
  });

  return rows.map((r) => toInventoryDTO(r));
}

/** Get a single inventory line for a specific item */
export async function getInventoryLine(
  userId: string,
  itemId: string,
  includeItem = true
): Promise<InventoryItemDTO | null> {
  const row = await prisma.inventoryItem.findUnique({
    where: { userId_itemId: { userId, itemId } },
    include: { item: includeItem },
  });
  return row ? toInventoryDTO(row) : null;
}

/**
 * Add/subtract quantity for an item (used when purchasing).
 * Accepts a payload object to align with the route calling `addToInventory(userId, req.body)`.
 * Guarantees quantity never goes below 0.
 */
export async function addToInventory(
  userId: string,
  payload: UpsertPayload
): Promise<InventoryItemDTO> {
  const { itemId, delta } = payload;

  // No-op: ensure the inventory line exists, return current (or newly created) state
  if (delta === 0) {
    const current = await getInventoryLine(userId, itemId, true);
    if (current) return current;

    const created = await prisma.inventoryItem.create({
      data: { userId, itemId, quantity: 0 },
      include: { item: true },
    });
    return toInventoryDTO(created);
  }

  // Transaction to avoid race conditions when incrementing and clamping
  const result = await prisma.$transaction(async (tx) => {
    // Create if not exists (with non-negative quantity)
    const existing = await tx.inventoryItem.findUnique({
      where: { userId_itemId: { userId, itemId } },
      include: { item: true },
    });

    if (!existing) {
      const created = await tx.inventoryItem.create({
        data: { userId, itemId, quantity: Math.max(delta, 0) },
        include: { item: true },
      });
      return created;
    }

    // Increment existing quantity
    const updated = await tx.inventoryItem.update({
      where: { userId_itemId: { userId, itemId } },
      data: { quantity: { increment: delta } },
      include: { item: true },
    });

    // Clamp to 0 if it went negative
    if (updated.quantity < 0) {
      const fixed = await tx.inventoryItem.update({
        where: { userId_itemId: { userId, itemId } },
        data: { quantity: 0 },
        include: { item: true },
      });
      return fixed;
    }

    return updated;
  });

  return toInventoryDTO(result);
}

/** Get the user's balance as a plain number */
export async function getUserBalance(userId: string): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { balance: true },
  });

  const raw = (user?.balance as any) ?? 0;
  // Handle Decimal.js (Prisma Decimal) or native numbers
  return typeof raw === "object" && raw?.toNumber ? raw.toNumber() : Number(raw) || 0;
}
