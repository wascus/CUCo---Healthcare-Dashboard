/* eslint-disable @typescript-eslint/no-explicit-any */
// src/services/inventory.ts
import { apiFetch } from './api';
import type { Category } from './shop'; // keep categories consistent

export type InventoryItem = {
  id: string;
  userId: string;
  itemId: string;
  quantity: number;
  createdAt: string;
  updatedAt: string;
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
    createdAt: string;
    updatedAt: string;
  } | null;
};

export async function listInventory(params?: {
  includeItem?: boolean;
  limit?: number;
  offset?: number;
}) {
  const qs = new URLSearchParams();
  const p = { includeItem: true, limit: 200, offset: 0, ...(params || {}) };
  Object.entries(p).forEach(([k, v]) => {
    if (v !== undefined && v !== null) qs.set(k, String(v));
  });
  const suffix = qs.size ? `?${qs.toString()}` : '';
  return apiFetch<InventoryItem[]>(`/v1/inventory/${suffix}`);
}

/** Handy helper for purchases; call this after a successful charge */
export async function addToInventory(itemId: string, delta = 1) {
  return apiFetch<InventoryItem>(`/v1/inventory/upsert`, {
    method: 'POST',
    body: { itemId, delta },
  });
}

/** Optional: fetch a single line */
export async function getInventoryLine(itemId: string) {
  return apiFetch<InventoryItem>(`/v1/inventory/${itemId}`);
}

