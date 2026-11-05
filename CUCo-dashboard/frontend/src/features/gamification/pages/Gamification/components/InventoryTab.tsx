// src/features/gamification/components/InventoryTab.tsx
import { useEffect, useMemo, useState } from 'react';
import { listInventory, type InventoryItem } from '../../../../../services/inventory';
import { api } from '../../../../../services/api';
import { resolveItemImage } from '../../../../../utils/images';
import { SHOP_ITEMS } from '../shopItems';
import { useAuth } from '../../../../auth/AuthContext';

function getStorageKey(key: string, userId: string | null): string {
  return userId ? `${key}:${userId}` : key;
}

interface InventoryTabProps {
  /** items currently placed in the room (can be itemId strings or item objects, can contain duplicates for multiple placements) */
  placedItems: (string | any)[];
  /** place a single instance of the item */
  onPlaceItem: (itemId: string, item: any) => void;
  /** remove a single instance of the item */
  onRemoveItem: (itemId: string) => void;
  /** whether this tab is currently active */
  isActive?: boolean;
}

export default function InventoryTab({
  placedItems,
  onPlaceItem,
  onRemoveItem,
  isActive = true,
}: InventoryTabProps) {
  const { user } = useAuth();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // Load current user's inventory (refetch when tab becomes active)
  useEffect(() => {
    if (!isActive) return;

    let cancelled = false;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        // Quick auth check: if not signed-in, backend inventory will return an empty array silently.
        // Call /auth/me to determine session state and show an informative message.
        try {
          const me = await api.me();
          if (!me) {
            if (!cancelled) setErr('You are not signed in — sign in to see your inventory');
            return;
          }
        } catch (e) {
          // If /auth/me errors (network), continue and let listInventory handle it
          console.debug('[InventoryTab] /auth/me check failed', e);
        }
        const data = await listInventory({ includeItem: true, limit: 500 });
        console.debug('[InventoryTab] listInventory response', data);

        if (!cancelled) {
          if (Array.isArray(data) && data.length === 0) {
            const purchasedItemsKey = getStorageKey('purchased-items', user?.id ?? null);
            const saved = localStorage.getItem(purchasedItemsKey);
            if (saved) {
              try {
                const ids: string[] = JSON.parse(saved || '[]');
                const fallback = ids
                  .map((id, idx) => {
                    const item = SHOP_ITEMS.find(i => i.id === id);
                    if (!item) return null;
                    const now = new Date().toISOString();
                    return {
                      id: `local-${id}-${idx}`,
                      userId: 'local',
                      itemId: id,
                      quantity: 1,
                      createdAt: now,
                      updatedAt: now,
                      item,
                    } as InventoryItem;
                  })
                  .filter(Boolean) as InventoryItem[];

                if (fallback.length > 0) {
                  setItems(fallback);
                } else {
                  setItems(data);
                }
              } catch (err) {
                setItems(data);
              }
            } else {
              setItems(data);
            }
          } else {
            setItems(data);
          }
        }
      } catch (e: any) {
        if (!cancelled) setErr(e?.message || 'Failed to load inventory');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isActive, user]);

  // Count how many instances of each itemId are currently placed
  const placedCountById = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of placedItems) {
      const itemId = typeof item === 'string' ? item : item.itemId;
      map.set(itemId, (map.get(itemId) || 0) + 1);
    }
    return map;
  }, [placedItems]);

  // Decorate inventory with derived counts
  const decorated = useMemo(() => {
    return items
      .filter((inv) => inv.quantity > 0 && inv.item) // only show items that exist & are owned
      .map((inv) => {
        const total = inv.quantity;
        const currentlyPlaced = placedCountById.get(inv.itemId) || 0;
        const remaining = Math.max(total - currentlyPlaced, 0);
        return { ...inv, total, currentlyPlaced, remaining, isPlaced: currentlyPlaced > 0 };
      })
      // stable alphabetical by item name
      .sort((a, b) => (a.item!.name || '').localeCompare(b.item!.name || ''));
  }, [items, placedCountById]);

  return (
    <div className="inventory-tab">
      <div className="inventory-header">
        <h2 className="inventory-title">Your Inventory</h2>
      </div>

      {loading && <div className="inventory-loading">Loading inventory…</div>}
      {err && !loading && <div className="inventory-error">Error: {err}</div>}

      {!loading && !err && (
        <div className="inventory-grid" data-testid="inventory-grid">
          {decorated.map((entry) => {
            const itm = entry.item!;
            const imgSrc = resolveItemImage(itm.image);

            return (
              <div
                key={entry.id}
                className="inventory-card"
                data-testid={`inventory-card-${entry.itemId}`}
              >
                <div className="inventory-card-media">
                  <img
                    src={imgSrc}
                    alt={itm.name}
                    className="inventory-card-image"
                    loading="lazy"
                    data-testid={`img-${entry.itemId}`}
                  />
                </div>

                <div className="inventory-card-body">
                  <div className="inventory-card-title">{itm.name}</div>
                  {itm.description && (
                    <div className="inventory-card-desc">{itm.description}</div>
                  )}
                  {itm.happinessBonus > 0 && (
                    <div style={{ fontSize: '0.85rem', color: '#666', margin: '4px 0' }}>
                      💚 Happiness: +{itm.happinessBonus}
                    </div>
                  )}

                  <div className="inventory-card-actions">
                    <button
                      className="btn btn-primary"
                      disabled={entry.remaining <= 0}
                      onClick={() => onPlaceItem(entry.itemId, entry.item)}
                      data-testid={`button-place-${entry.itemId}`}
                      title={entry.remaining <= 0 ? 'No available items to place' : 'Place one'}
                    >
                      ✓ Place
                    </button>

                    <button
                      className="btn btn-secondary"
                      disabled={!entry.isPlaced}
                      onClick={() => onRemoveItem(entry.itemId)}
                      data-testid={`button-remove-${entry.itemId}`}
                      title={!entry.isPlaced ? 'None placed to remove' : 'Remove one'}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {decorated.length === 0 && (
            <div className="inventory-empty" data-testid="inventory-empty">
              You don’t have any items yet. Visit the Shop to get started!
            </div>
          )}
        </div>
      )}
    </div>
  );
}
