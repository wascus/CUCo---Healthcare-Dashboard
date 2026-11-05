import sprite_1 from "../../assets/RetroCats/CatItems/Decorations/items/sprite_1.png";
import sprite_4 from "../../assets/RetroCats/CatItems/Decorations/items/sprite_4.png";
import sprite_33 from "../../assets/RetroCats/CatItems/Decorations/items/sprite_33.png"; // bed
import sprite_60 from "../../assets/RetroCats/CatItems/Decorations/items/sprite_60.png"; // plant
import sprite_59 from "../../assets/RetroCats/CatItems/Decorations/items/sprite_59.png"; // shelf
import sprite_63 from "../../assets/RetroCats/CatItems/Decorations/items/sprite_63.png"; // big window
import sprite_14 from "../../assets/RetroCats/CatItems/Decorations/items/sprite_14.png"; // toy1
import sprite_78 from "../../assets/RetroCats/CatItems/Decorations/items/sprite_78.png"; // toy2
import sprite_100 from "../../assets/RetroCats/CatItems/Decorations/items/sprite_100.png"; // water
import sprite_146 from "../../assets/RetroCats/CatItems/Decorations/items/sprite_146.png"; // food

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: 'window' | 'furniture' | 'decoration' | 'toy' | 'other';
  x?: number;
  y?: number;
  happinessBonus?: number;
}

export const SHOP_ITEMS: ShopItem[] = [
    // Default room items (from PetCanvas.tsx)
  { id: 'item_33', name: 'Cat Bed', description: 'Cozy bed for sleeping', price: 0, image: sprite_33, category: 'furniture', x: 202, y: 198, happinessBonus: 0 },
  { id: 'item_60', name: 'Plant', description: 'Green decoration', price: 30, image: sprite_60, category: 'decoration', x: 140, y: 160, happinessBonus: 30 },
  { id: 'item_59', name: 'Shelf', description: 'Wall shelf', price: 40, image: sprite_59, category: 'furniture', x: 40, y: 210, happinessBonus: 40 },
  { id: 'item_63', name: 'Big Window', description: 'Large window', price: 50, image: sprite_63, category: 'window', x: 150, y: 70, happinessBonus: 50 },
  { id: 'item_14', name: 'Toy Ball', description: 'Fun toy', price: 15, image: sprite_14, category: 'toy', x: 400, y: 225, happinessBonus: 15 },
  { id: 'item_78', name: 'Yarn Ball', description: 'Another toy', price: 18, image: sprite_78, category: 'toy', x: 320, y: 220, happinessBonus: 18 },
  { id: 'item_100', name: 'Water Bowl', description: 'Fresh water', price: 20, image: sprite_100, category: 'other', x: 270, y: 370, happinessBonus: 20 },
  { id: 'item_146', name: 'Food Bowl', description: 'Yummy food', price: 20, image: sprite_146, category: 'other', x: 220, y: 395, happinessBonus: 20 },
  // Windows (high on walls)
  { id: 'item_1', name: 'Small Window', description: 'Cozy white window', price: 30, image: sprite_1, category: 'window', x: 290, y: 100, happinessBonus: 30 },
  
  // Furniture (on floor)
  { id: 'item_4', name: 'Small Shelf', description: 'Perfect for decorations', price: 40, image: sprite_4, category: 'furniture', x: 100, y: 250, happinessBonus: 40 },
];
