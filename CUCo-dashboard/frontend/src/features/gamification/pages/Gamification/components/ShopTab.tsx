import { useEffect, useState } from 'react';
import { ShoppingBag as ShoppingBagIcon } from '@mui/icons-material';
import { listShopItems, type ShopItem } from '../../../../../services/shop';
import { resolveItemImage } from '../../../../../utils/images';

export default function ShopTab({ purchasedItems, energyPoints, onPurchase }:{
  purchasedItems: string[]; energyPoints: number; onPurchase:(item: ShopItem)=>Promise<void>;
}) {
  const [items, setItems] = useState<ShopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'createdAt' | 'price'>('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  
  useEffect(() => {
    let alive = true;
  
    (async () => {
      try {
        const itemsResp = await listShopItems({ 
          onlyActive: true,
          sort: sortBy,
          dir: sortDir,
        });
        if (!alive) return;
        setItems(itemsResp);
      } catch (e) {
        if (!alive) return;
        const message = e instanceof Error ? e.message : 'Failed to load shop';
        setErr(message);
      } finally {
        if (alive) setLoading(false);
      }
    })();
  
    return () => { alive = false; };
  }, [sortBy, sortDir]);
  

  if (loading) return <div className="p-4">Loading shop…</div>;
  if (err) return <div className="p-4 text-red-600">{err}</div>;

  return (
    <div className="shop-content-container" data-testid="shop-content">
      <div className="shop-header">
        <h3 className="shop-title"><ShoppingBagIcon sx={{ mr: 0.5 }} /> Item Shop</h3>
        <div className="shop-balance">
          <span>Your Balance:</span>
          <span className="balance-amount">{energyPoints} pts</span>
        </div>
      </div>

      <div className="shop-sort-controls" style={{ padding: '12px 16px', borderBottom: '1px solid #e0e0e0', display: 'flex', gap: '12px', alignItems: 'center' }}>
        <label htmlFor="sort-select" style={{ fontWeight: 500 }}>Sort by:</label>
        <select 
          id="sort-select"
          value={sortBy} 
          onChange={(e) => setSortBy(e.target.value as 'createdAt' | 'price')}
          style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid #ccc', cursor: 'pointer' }}
        >
          <option value="createdAt">Newest</option>
          <option value="price">Cost</option>
        </select>
        <button 
          onClick={() => setSortDir(sortDir === 'asc' ? 'desc' : 'asc')}
          style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid #ccc', cursor: 'pointer', backgroundColor: '#f5f5f5' }}
          title={sortDir === 'asc' ? 'Click to sort descending' : 'Click to sort ascending'}
        >
          {sortDir === 'asc' ? '↑ Low to High' : '↓ High to Low'}
        </button>
      </div>

      {loading && <div className="shop-loading" role="status">Loading items…</div>}
      {err && !loading && (
        <div className="shop-error" role="alert">
          {err} <button onClick={() => location.reload()}>Retry</button>
        </div>
      )}

      {!loading && !err && (
        <div className="shop-items-grid">
          {items.map((item) => {
            const isOwned = purchasedItems.includes(item.id);
            const canAfford = energyPoints >= item.price;

            return (
              <div
                key={item.id}
                className={`shop-item-card ${isOwned ? 'owned' : ''}`}
                data-testid={`shop-item-${item.id}`}
              >
                <div className="shop-item-image-container">
                  <img
                    src={resolveItemImage(item.image)}
                    alt={item.name}
                    className="shop-item-image"
                    loading="lazy"
                    decoding="async"
                  />
                  {isOwned && <div className="owned-badge">✓ Owned</div>}
                </div>
                <div className="shop-item-info">
                  <h4 className="shop-item-name">{item.name}</h4>
                  <p className="shop-item-description">{item.description}</p>
                  <div className="shop-item-footer">
                    <span className="shop-item-price">{item.price} pts</span>
                    <button
                      className={`shop-buy-button ${!canAfford || isOwned ? 'disabled' : ''}`}
                      onClick={async () => {
                        setPurchasingId(item.id);
                        try {
                          await onPurchase(item);
                        } finally {
                          setPurchasingId(null);
                        }
                      }}
                      disabled={!canAfford || isOwned || purchasingId === item.id}
                      data-testid={`button-buy-${item.id}`}
                      aria-disabled={!canAfford || isOwned || purchasingId === item.id}
                    >
                      {purchasingId === item.id ? 'Buying...' : isOwned ? 'Owned' : canAfford ? 'Buy' : 'Not enough pts'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          {items.length === 0 && <div className="shop-empty">No items available.</div>}
        </div>
      )}
    </div>
  );
}
