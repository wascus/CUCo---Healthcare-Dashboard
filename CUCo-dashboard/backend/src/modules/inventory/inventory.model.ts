// src/modules/inventory/inventory.model.ts
import type { InventoryItem, Item } from "@prisma/client";

/** Keep categories consistent with the Shop module */
export type Category = "window" | "furniture" | "decoration" | "toy" | "other";

/** Shape returned to the client */
export type InventoryItemDTO = {
  id: string;
  userId: string;
  itemId: string;
  quantity: number;
  createdAt: string; // ISO
  updatedAt: string; // ISO
  item?: {
    id: string;
    name: string;
    description: string;
    price: number;
    image: string;
    category: Category;
    x: number;
    y: number;
    isActive: boolean;
    happinessBonus: number;
    createdAt: string; // ISO
    updatedAt: string; // ISO
  } | null;
};

export const listQuerySchema = {
  type: "object",
  properties: {
    includeItem: { type: "boolean", default: true },
    limit: { type: "integer", minimum: 1, maximum: 500, default: 200 },
    offset: { type: "integer", minimum: 0, default: 0 },
  },
  additionalProperties: false,
};

export const upsertBodySchema = {
  type: "object",
  required: ["itemId", "delta"],
  properties: {
    itemId: { type: "string" },
    /** positive to add, negative to remove (never below 0) */
    delta: { type: "integer", minimum: -100000, maximum: 100000 },
  },
  additionalProperties: false,
};

export function toItemDTO(row: Item) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    price: row.price,
    image: row.image,
    category: row.category as Category,
    x: row.x,
    y: row.y,
    isActive: row.isActive,
    happinessBonus: row.happinessBonus,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function toInventoryDTO(
  row: InventoryItem & { item?: Item | null }
): InventoryItemDTO {
  return {
    id: row.id,
    userId: row.userId,
    itemId: row.itemId,
    quantity: row.quantity,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    item: row.item ? toItemDTO(row.item) : null,
  };
}
