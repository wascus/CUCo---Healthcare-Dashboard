// src/modules/shop/shop.model.ts
import type { Item } from "@prisma/client";

export type Category = "window" | "furniture" | "decoration" | "toy" | "other";

export type ShopItemDTO = {
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
};

export type ListParams = {
  category?: Category;
  onlyActive?: boolean;
  q?: string; // search by name/description
  limit?: number; // default 100
  offset?: number; // default 0
  sort?: "createdAt" | "name" | "price";
  dir?: "asc" | "desc";
};

// JSON Schemas for Fastify
export const itemSchema: any = {
  type: "object",
  required: ["id","name","description","price","image","category","x","y","isActive","happinessBonus","createdAt","updatedAt"],
  properties: {
    id:        { type: "string" },
    name:      { type: "string" },
    description:{ type: "string" },
    price:     { type: "integer" },
    image:     { type: "string" },
    category:  { type: "string", enum: ["window","furniture","decoration","toy","other"] },
    x:         { type: "integer" },
    y:         { type: "integer" },
    isActive:  { type: "boolean" },
    happinessBonus: { type: "integer" },
    createdAt: { type: "string" },
    updatedAt: { type: "string" },
  },
};

export const listQuerySchema: any = {
  type: "object",
  properties: {
    category:  { type: "string", enum: ["window","furniture","decoration","toy","other"] },
    onlyActive:{ type: "boolean", default: true },
    q:         { type: "string" },
    limit:     { type: "integer", minimum: 1, maximum: 200, default: 100 },
    offset:    { type: "integer", minimum: 0, default: 0 },
    sort:      { type: "string", enum: ["createdAt","name","price"], default: "createdAt" },
    dir:       { type: "string", enum: ["asc","desc"], default: "asc" },
  },
};

export function toDTO(row: Item): ShopItemDTO {
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
