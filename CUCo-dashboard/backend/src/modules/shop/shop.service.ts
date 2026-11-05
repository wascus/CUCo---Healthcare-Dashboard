// src/modules/shop/shop.service.ts
import type { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import type { ListParams, ShopItemDTO } from "./shop.model";
import { toDTO } from "./shop.model";

function buildWhere(params: ListParams): Prisma.ItemWhereInput {
  const { category, onlyActive = true, q } = params;
  const where: Prisma.ItemWhereInput = {};
  if (category) where.category = category;
  if (onlyActive) where.isActive = true;
  if (q && q.trim()) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ];
  }
  return where;
}

export async function listItems(params: ListParams): Promise<ShopItemDTO[]> {
  const {
    limit = 100,
    offset = 0,
    sort = "createdAt",
    dir = "asc",
  } = params;

  const rows = await prisma.item.findMany({
    where: buildWhere(params),
    orderBy: { [sort]: dir },
    take: limit,
    skip: offset,
  });

  return rows.map(toDTO);
}

export async function getItemById(id: string): Promise<ShopItemDTO | null> {
  const row = await prisma.item.findUnique({ where: { id } });
  return row ? toDTO(row) : null;
}
