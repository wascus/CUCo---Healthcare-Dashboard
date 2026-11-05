// src/utils/images.ts
// Eagerly import every .png/.gif in the gamification assets folder as URL strings.
// Works with Vite 5+ (using `query` instead of deprecated `as`).

export const ALL_ASSET_URLS = import.meta.glob(
  '../features/gamification/assets/**/*.{png,gif}',
  { eager: true, query: '?url', import: 'default' }
) as Record<string, string>;

/**
 * Resolves an image path stored in the database into a real URL that <img src> can use.
 * Handles DB paths like:
 *  - "/assets/RetroCats/CatItems/Decorations/items/sprite_63.png"
 *  - "RetroCats/CatItems/Decorations/items/sprite_63.png"
 *  - "sprite_63.png"
 */
export function resolveItemImage(dbPath: string): string {
  const norm = dbPath.replace(/\\/g, '/');
  const roots = ['RetroCats', 'Catroom', 'Cats', 'GIFT'];

  // Try to find the matching asset root
  const root = roots.find(r =>
    norm.includes(`/${r}/`) || norm.startsWith(`${r}/`)
  );

  if (root) {
    const start = norm.indexOf(root);
    const subpath = norm.slice(start); // e.g. RetroCats/CatItems/Decorations/items/sprite_63.png

    // Match against glob keys
    const exactKey = Object.keys(ALL_ASSET_URLS).find(
      k => k.endsWith(`/assets/${subpath}`) || k.endsWith(subpath)
    );
    if (exactKey) return ALL_ASSET_URLS[exactKey];
  }

  // Fallback: filename match
  const filename = norm.split('/').pop()!;
  const byFile = Object.keys(ALL_ASSET_URLS).find(k => k.endsWith(`/${filename}`));
  if (byFile) return ALL_ASSET_URLS[byFile];

  console.warn('[resolveItemImage] asset not found:', dbPath);
  return dbPath; // fallback (works if later served from /public)
}
