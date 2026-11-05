import { useEffect, useRef, useState } from "react";
import { SHOP_ITEMS } from '../shopItems';
import { listShopItems } from '../../../../../services/shop';
import { resolveItemImage } from '../../../../../utils/images';
import { ANIMATIONS, type AnimationType } from '../animationConfig';
import { TICKLE_SEQUENCE } from '../petAnimationSequences';
import { usePet } from '../../../PetContext';
import catBed from "../../../assets/RetroCats/CatItems/Decorations/items/sprite_33.png";
import roomBg from "../../../assets/RetroCats/CatItems/Rooms/Room1.png";
import plantSprite from "../../../assets/RetroCats/CatItems/Decorations/items/sprite_60.png";
import shelfSprite from "../../../assets/RetroCats/CatItems/Decorations/items/sprite_59.png";
import smallBrownWindowSprite from "../../../assets/RetroCats/CatItems/Decorations/items/sprite_2.png";
import smallWhiteWindowSprite from "../../../assets/RetroCats/CatItems/Decorations/items/sprite_1.png";
import bigWindowSprite from "../../../assets/RetroCats/CatItems/Decorations/items/sprite_63.png";
import painting1 from "../../../assets/RetroCats/CatItems/Decorations/items/sprite_43.png";
import painting2 from "../../../assets/RetroCats/CatItems/Decorations/items/sprite_45.png";
import toy1 from "../../../assets/RetroCats/CatItems/Decorations/items/sprite_14.png";
import toy2 from "../../../assets/RetroCats/CatItems/Decorations/items/sprite_78.png";
import waterSprite from "../../../assets/RetroCats/CatItems/Decorations/items/sprite_100.png";
import foodSprite from "../../../assets/RetroCats/CatItems/Decorations/items/sprite_146.png";

interface PetCanvasProps {
  placedItems: string[];
  currentAnimation: AnimationType;
  petX: number;
  petY: number;
  scale?: number;
}

export default function PetCanvas({ placedItems, currentAnimation, petX, petY, scale = 1 }: PetCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>(null);
  const [shopItemsMap, setShopItemsMap] = useState<Record<string, any>>({});
  const { addSequence } = usePet();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const baseSize = 512;
    const scaledSize = baseSize * scale;
    canvas.width = scaledSize;
    canvas.height = scaledSize;

    // Default room items
    const roomImage = new Image();
    const bedImage = new Image();
    const plantImage = new Image();
    const shelfImage = new Image();
    const smallBrownWindowImage = new Image();
    const smallWhiteWindowImage = new Image();
    const bigWindowImage = new Image();
    const paintingImage = new Image();
    const painting2Image = new Image();
    const toyImage = new Image();
    const toy2Image = new Image();
    const waterImage = new Image();
    const foodImage = new Image();

    roomImage.src = roomBg;
    bedImage.src = catBed;
    plantImage.src = plantSprite;
    shelfImage.src = shelfSprite;
    smallBrownWindowImage.src = smallBrownWindowSprite;
    smallWhiteWindowImage.src = smallWhiteWindowSprite;
    bigWindowImage.src = bigWindowSprite;
    paintingImage.src = painting1;
    painting2Image.src = painting2;
    toyImage.src = toy1;
    toy2Image.src = toy2;
    waterImage.src = waterSprite;
    foodImage.src = foodSprite;

    // Load current animation sprite
    const catImage = new Image();
    const animConfig = ANIMATIONS[currentAnimation] || ANIMATIONS['idle'];
    catImage.src = animConfig.sprite;

    // Load placed item images. Prefer backend shop items (IDs from inventory), fall back to local SHOP_ITEMS
    const placedItemImages: HTMLImageElement[] = [];
    const placedItemData: Array<{ image: HTMLImageElement; x: number; y: number }> = [];

    placedItems.forEach((placedItem, index) => {
      const id = typeof placedItem === 'string' ? placedItem : (placedItem as any).id;
      const itemData = shopItemsMap[id] || SHOP_ITEMS.find(i => i.id === id) || (typeof placedItem === 'object' ? placedItem : null);

      if (itemData) {
        const img = new Image();
        img.src = resolveItemImage(itemData.image);
        placedItemImages.push(img);

        const col = index % 3;
        const row = Math.floor(index / 3);
        placedItemData.push({
          image: img,
          x: (itemData.x as number) || 350 + (col * 60),
          y: (itemData.y as number) || 300 + (row * 60)
        });
      }
    });

    let imagesLoaded = 0;
    const totalImages = 14 + placedItemImages.length;
    let currentFrame = 0;
    let time = 0;

    const checkLoaded = () => {
      imagesLoaded++;
      if (imagesLoaded === totalImages) startAnimation();
    };

    roomImage.onload = checkLoaded;
    catImage.onload = checkLoaded;
    bedImage.onload = checkLoaded;
    plantImage.onload = checkLoaded;
    shelfImage.onload = checkLoaded;
    smallBrownWindowImage.onload = checkLoaded;
    smallWhiteWindowImage.onload = checkLoaded;
    bigWindowImage.onload = checkLoaded;
    paintingImage.onload = checkLoaded;
    painting2Image.onload = checkLoaded;
    toyImage.onload = checkLoaded;
    toy2Image.onload = checkLoaded;
    waterImage.onload = checkLoaded;
    foodImage.onload = checkLoaded;
    placedItemImages.forEach(img => img.onload = checkLoaded);

    const startAnimation = () => {
      const drawScene = () => {
        ctx.fillStyle = '#39546a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.drawImage(roomImage, 0, 0, canvas.width, canvas.height);

        // Draw placed items from inventory
        placedItemData.forEach(({ image, x, y }) => {
          ctx.drawImage(image, x * scale, y * scale, image.width * scale, image.height * scale);
        });

        // Draw pet with current animation
        ctx.drawImage(
          catImage,
          currentFrame * animConfig.frameWidth, 0,
          animConfig.frameWidth, animConfig.frameHeight,
          petX * scale, petY * scale,
          65 * scale, 65 * scale
        );

        if (time % animConfig.speed === 0) {
          currentFrame = (currentFrame + 1) % animConfig.frames;
        }

        time += 1;
        animationFrameRef.current = requestAnimationFrame(drawScene);
      };

      drawScene();
    };

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [placedItems, currentAnimation, petX, petY, scale]);

  // Fetch shop items from backend so PetCanvas can resolve placed item ids coming from inventory
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const items = await listShopItems({ onlyActive: true, limit: 500 });
        if (!alive) return;
        const map: Record<string, any> = {};
        for (const it of items) map[it.id] = it;
        setShopItemsMap(map);
      } catch (err) {
        // fallback to local SHOP_ITEMS if backend unavailable
        const map: Record<string, any> = {};
        for (const it of SHOP_ITEMS) map[it.id] = it;
        if (alive) setShopItemsMap(map);
      }
    })();

    return () => { alive = false; };
  }, []);

  // Handle canvas click for tickle animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleCanvasClick = () => {
      addSequence(TICKLE_SEQUENCE);
    };

    canvas.addEventListener('click', handleCanvasClick);

    return () => {
      canvas.removeEventListener('click', handleCanvasClick);
    };
  }, [addSequence]);

  return (
    <div className="pet-container">
      <canvas 
        ref={canvasRef} 
        className="pet-canvas"
        data-testid="pet-canvas"
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}