import { apiFetch } from './api';

export type Category = 'window' | 'furniture' | 'decoration' | 'toy' | 'other';

export type ShopItem = {
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
};
export type balanceData = {
  bla : number;
};
export type ListParams = {
  category?: Category;
  onlyActive?: boolean;
  q?: string;
  limit?: number;
  offset?: number;
  sort?: 'createdAt' | 'name' | 'price';
  dir?: 'asc' | 'desc';
};

export async function listShopItems(params: ListParams = {}) {
  const qs = new URLSearchParams();
  Object.entries({
    onlyActive: true,
    sort: 'createdAt',
    dir: 'asc',
    limit: 200,
    ...params,
  }).forEach(([k, v]) => {
    if (v !== undefined && v !== null) qs.set(k, String(v));
  });

  return apiFetch<ShopItem[]>(`/v1/shop/items${qs.size ? `?${qs.toString()}` : ''}`);
}

export async function getShopItem(id: string) {
  return apiFetch<ShopItem>(`/v1/shop/items/${id}`);
}


export async function getInventoryBalance(): Promise<number> {
  const res = await apiFetch<{ balance: number }>(`/v1/shop/balance`);
  return res.balance;
}

export async function syncBalance(balance: number): Promise<{ balance: number }> {
  return apiFetch<{ balance: number }>(`/v1/shop/balance/sync`, {
    method: 'POST',
    body: { balance },
  });
}

export async function purchaseItem(itemId: string) {
  return apiFetch(`/v1/shop/purchase/${itemId}`, {
    method: 'POST',
  });
}