import "./Gamification.css";
import { useEffect, useState } from "react";
import type { ShopItem } from './shopItems';
import { purchaseItem, syncBalance } from '../../../../services/shop';
import { listInventory } from '../../../../services/inventory';
import PetCanvas from './components/PetCanvas';
import PetInfoCard from './components/PetInfoCard';
import ShopTab from './components/ShopTab';
import InventoryTab from './components/InventoryTab';
import StreakCard from './components/StreakCard';
import MilestoneCard from './components/MilestoneCard';
import { usePet } from '../../PetContext';
import { useAuth } from '../../../auth/AuthContext';
import { apiFetch } from '../../../../services/api';
import type { TaskDTO } from '../../../../services/tasks';
import { PLAY_ANIMATION_SEQUENCE } from './petAnimationSequences';

function getStorageKey(key: string, userId: string | null): string {
  return userId ? `${key}:${userId}` : key;
}

type TabType = 'pet' | 'shop' | 'inventory';

export default function Gamification() {
  const { user } = useAuth();
  const { currentAnimation, petX, petY, petHappiness, energyPoints, petName, placedItems, deductEnergy, addSequence } = usePet();
  
  const [diaryCount, setDiaryCount] = useState(0);
  const [completedTasksCount, setCompletedTasksCount] = useState(0);
  const [emotionCount, setEmotionCount] = useState(0);
  const [topicCount, setTopicCount] = useState(0);
  const [activeTab, setActiveTab] = useState<TabType>('pet');
  const [purchasedItems, setPurchasedItems] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const diaryResponse = await apiFetch<{ items: any[] }>('/v1/diary-notes?limit=100');
        const entries = diaryResponse?.items ?? [];
        setDiaryCount(entries.length);
      } catch (error) {
        console.debug('[Gamification] Error fetching diary entries:', error);
        setDiaryCount(0);
      }

      try {
        const emotionResponse = await apiFetch<{ items: any[] }>('/v1/tests-overview/emotions?limit=100');
        const emotions = emotionResponse?.items ?? [];
        setEmotionCount(emotions.length);
      } catch (error) {
        console.debug('[Gamification] Error fetching emotions:', error);
        setEmotionCount(0);
      }

      try {
        const topicResponse = await apiFetch<any[]>('/v1/grief/topics');
        const topics = topicResponse ?? [];
        setTopicCount(topics.length);
      } catch (error) {
        console.debug('[Gamification] Error fetching topics:', error);
        setTopicCount(0);
      }

      try {
        const tasksResponse = await apiFetch<TaskDTO[]>('/v1/tasks');
        const completedCount = (tasksResponse ?? []).filter((task) => task.completed).length;
        setCompletedTasksCount(completedCount);
      } catch (error) {
        console.debug('[Gamification] Error fetching tasks:', error);
        setCompletedTasksCount(0);
      }

      try {
        const inventoryResponse = await listInventory({ includeItem: false, limit: 500 });
        const backendPurchasedIds = (inventoryResponse ?? [])
          .filter((item) => item.quantity > 0)
          .map((item) => item.itemId);
        
        const purchasedItemsKey = getStorageKey('purchased-items', user?.id ?? null);
        const savedPurchases = localStorage.getItem(purchasedItemsKey);
        const localPurchasedIds = savedPurchases ? JSON.parse(savedPurchases) : [];
        
        const mergedIds = Array.from(new Set([...backendPurchasedIds, ...localPurchasedIds]));
        setPurchasedItems(mergedIds);
        localStorage.setItem(purchasedItemsKey, JSON.stringify(mergedIds));
      } catch (error) {
        console.debug('[Gamification] Error loading inventory:', error);
        const purchasedItemsKey = getStorageKey('purchased-items', user?.id ?? null);
        const savedPurchases = localStorage.getItem(purchasedItemsKey);
        if (savedPurchases) setPurchasedItems(JSON.parse(savedPurchases));
      }
    })();
  }, [user]);

  const handleNameChange = (name: string) => {
    const nameKey = getStorageKey('pet-name', user?.id ?? null);
    localStorage.setItem(nameKey, name);
    window.location.reload();
  };

  const handlePurchaseItem = async (item: ShopItem) => {
    if (purchasedItems.includes(item.id)) {
      alert('You already own this item!');
      return;
    }

    if (energyPoints < item.price) {
      alert(`Not enough energy! You need ${item.price} pts but have ${energyPoints} pts`);
      return;
    }

    try {
      await syncBalance(energyPoints);
      await purchaseItem(item.id);
      const newPurchasedItems = [...purchasedItems, item.id];
      setPurchasedItems(newPurchasedItems);
      const purchasedItemsKey = getStorageKey('purchased-items', user?.id ?? null);
      localStorage.setItem(purchasedItemsKey, JSON.stringify(newPurchasedItems));
      deductEnergy(item.price);
      alert(`Successfully purchased ${item.name} for ${item.price} pts!`);
    } catch (error: any) {
      const errorMsg = error?.message || 'Unknown error';
      alert(`Failed to purchase ${item.name}. ${errorMsg}`);
      console.error('Purchase error:', error);
    }
  };

  const handlePlaceItem = (itemId: string, item: any) => {
    const placedItemsKey = getStorageKey('placed-items', user?.id ?? null);
    const currentPlaced = JSON.parse(localStorage.getItem(placedItemsKey) || '[]');
    const itemData = {
      itemId,
      name: item?.name,
      image: item?.image,
      x: item?.x,
      y: item?.y,
      category: item?.category,
      happinessBonus: item?.price || 0,
    };
    const newPlacedItems = [...currentPlaced, itemData];
    localStorage.setItem(placedItemsKey, JSON.stringify(newPlacedItems));
    window.location.reload();
  };

  const handleRemoveItem = (itemId: string) => {
    const placedItemsKey = getStorageKey('placed-items', user?.id ?? null);
    const currentPlaced = JSON.parse(localStorage.getItem(placedItemsKey) || '[]');
    let removed = false;
    const newPlacedItems = currentPlaced.filter((item: any) => {
      if (!removed) {
        const id = typeof item === 'string' ? item : item.itemId;
        if (id === itemId) {
          removed = true;
          return false;
        }
      }
      return true;
    });
    localStorage.setItem(placedItemsKey, JSON.stringify(newPlacedItems));
    window.location.reload();
  };

  const handlePlayWithPet = () => {
    addSequence(PLAY_ANIMATION_SEQUENCE);
  };

  const renderMainContent = () => {
    switch (activeTab) {
      case 'pet':
        return (
          <PetCanvas 
            placedItems={placedItems}
            currentAnimation={currentAnimation}
            petX={petX}
            petY={petY}
          />
        );
      case 'shop':
        return (
          <ShopTab 
            purchasedItems={purchasedItems}
            energyPoints={energyPoints}
            onPurchase={handlePurchaseItem}
          />
        );
      case 'inventory':
        return (
          <InventoryTab 
            isActive={activeTab === 'inventory'}
            placedItems={placedItems}
            onPlaceItem={handlePlaceItem}
            onRemoveItem={handleRemoveItem}
          />
        );
    }
  };

  return (
    <div className="app-container">
      <header className="gamification-header">
        <h2 className="gamification-title">Your Grief Companion</h2>

      </header>

      <div className="game-main-container">
        {renderMainContent()}

        <PetInfoCard 
          petName={petName}
          energyPoints={energyPoints}
          petHappiness={petHappiness}
          diaryCount={diaryCount}
          completedTasksCount={completedTasksCount}
          emotionCount={emotionCount}
          topicCount={topicCount}
          onNameChange={handleNameChange}
          onPlayWithPet={handlePlayWithPet}
        />
      </div>

      <div className="tab-navigation">
        <button
          className={`tab-button ${activeTab === 'pet' ? 'active' : ''}`}
          onClick={() => setActiveTab('pet')}
          data-testid="tab-pet"
        >
          <span className="tab-icon"></span>
          <span>Pet</span>
        </button>
        <button
          className={`tab-button ${activeTab === 'shop' ? 'active' : ''}`}
          onClick={() => setActiveTab('shop')}
          data-testid="tab-shop"
        >
          <span className="tab-icon"></span>
          <span>Shop</span>
        </button>
        <button
          className={`tab-button ${activeTab === 'inventory' ? 'active' : ''}`}
          onClick={() => setActiveTab('inventory')}
          data-testid="tab-inventory"
        >
          <span className="tab-icon">🎒</span>
          <span>Inventory</span>
        </button>
      </div>

      <MilestoneCard />

      <StreakCard />
    </div>
  );
}