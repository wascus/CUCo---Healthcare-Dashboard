import { createContext, useContext, useState, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useAnimationQueue } from './pages/Gamification/useAnimationQueue';
import { WAKE_UP_SEQUENCE, getHappinessBehavior, getHappinessAnimation } from './pages/Gamification/petAnimationSequences';
import type { AnimationType } from './pages/Gamification/animationConfig';
import { getInventoryBalance } from '../../services/shop';
import { calculateHappiness } from './pages/Gamification/calculations';

interface PetContextType {
  currentAnimation: AnimationType;
  petX: number;
  petY: number;
  petHappiness: number;
  energyPoints: number;
  petName: string;
  placedItems: string[];
  isAnimating: boolean;
  addSequence: (sequence: any) => void;
  deductEnergy: (amount: number) => void;
  addEnergy: (amount: number) => void;
}

const PetContext = createContext<PetContextType | undefined>(undefined);

function getStorageKey(key: string, userId: string | null | undefined): string {
  return userId ? `${key}:${userId}` : key;
}

export function PetProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [petHappiness, setPetHappiness] = useState(15);
  const [energyPoints, setEnergyPoints] = useState(0);
  const [petName, setPetName] = useState("Fluffy");
  const [placedItems, setPlacedItems] = useState<any[]>([]);
  
  const { currentAnimation, petX, petY, addSequence, isAnimating } = useAnimationQueue('idle', 'center', getHappinessAnimation(petHappiness));
  const initializedRef = useRef(false);
  const prevUserIdRef = useRef<string | null | undefined>(null);

  useEffect(() => {
    const userId = user?.id;
    
    if (prevUserIdRef.current !== userId) {
      prevUserIdRef.current = userId;
      initializedRef.current = false;
    }
    
    const placedItemsKey = getStorageKey('placed-items', userId);
    
    const savedPlacedItems = localStorage.getItem(placedItemsKey);
    const loadedPlacedItems = savedPlacedItems ? JSON.parse(savedPlacedItems) : [];
    setPlacedItems(loadedPlacedItems);
    
    if (initializedRef.current || !user) return;
    
    const nameKey = getStorageKey('pet-name', userId);
    const energyPointsKey = getStorageKey('pet-energy-points', userId);
    const lastActivityKey = getStorageKey('last-activity-time', userId);
    
    const savedName = localStorage.getItem(nameKey);
    if (savedName) setPetName(savedName);
    
    (async () => {
      try {
        const savedEnergyPoints = localStorage.getItem(energyPointsKey);
        if (savedEnergyPoints) {
          const energyPts = parseInt(savedEnergyPoints);
          setEnergyPoints(energyPts);
          try {
            await fetch('/v1/shop/balance/sync', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ balance: energyPts }),
              credentials: 'include',
            });
          } catch (syncError) {
            console.debug('[PetContext] Error syncing balance to server:', syncError);
          }
        } else {
          const serverBalance = await getInventoryBalance();
          setEnergyPoints(serverBalance);
          localStorage.setItem(energyPointsKey, serverBalance.toString());
        }
      } catch (error) {
        console.debug('[PetContext] Error fetching server balance:', error);
        const savedEnergyPoints = localStorage.getItem(energyPointsKey);
        if (savedEnergyPoints) {
          const energyPts = parseInt(savedEnergyPoints);
          setEnergyPoints(energyPts);
        } else {
          setEnergyPoints(0);
          localStorage.setItem(energyPointsKey, '0');
        }
      }
    })();

    const lastActivityTime = localStorage.getItem(lastActivityKey);
    const now = Date.now();
    const EIGHT_HOURS = 1000 * 10 * 60 * 60 * 1000;
    
    if (lastActivityTime) {
      const timeSinceLastActivity = now - parseInt(lastActivityTime);
      
      if (timeSinceLastActivity >= EIGHT_HOURS) {
        addSequence(WAKE_UP_SEQUENCE);
      } else {
        addSequence(getHappinessBehavior(petHappiness));
      }
    } else {
      addSequence(getHappinessBehavior(petHappiness));
    }
    
    localStorage.setItem(lastActivityKey, now.toString());
    initializedRef.current = true;
  }, [user, addSequence]);



  // Idle wandering
  useEffect(() => {
    const idleInterval = setInterval(() => {
      if (!isAnimating) {
        const sequence = getHappinessBehavior(petHappiness);
        addSequence(sequence);
      }
    }, 18000);

    return () => clearInterval(idleInterval);
  }, [isAnimating, addSequence, petHappiness]);






  useEffect(() => {
    if (!user) return;
    const userId = user.id;
    const placedItemsKey = getStorageKey('placed-items', userId);
    
    const pollInterval = setInterval(() => {
      if (!initializedRef.current) return;
      
      
      const savedPlacedItems = localStorage.getItem(placedItemsKey);
      const placedItems = savedPlacedItems ? JSON.parse(savedPlacedItems) : [];
      setPlacedItems(prev => {
        if (JSON.stringify(prev) !== JSON.stringify(placedItems)) {
          return placedItems;
        }
        return prev;
      });
    }, 1000);

    return () => clearInterval(pollInterval);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const userId = user.id;
    const lastActivityKey = getStorageKey('last-activity-time', userId);
    
    const updateActivity = () => {
      localStorage.setItem(lastActivityKey, Date.now().toString());
    };

    window.addEventListener('click', updateActivity);
    window.addEventListener('keypress', updateActivity);

    return () => {
      window.removeEventListener('click', updateActivity);
      window.removeEventListener('keypress', updateActivity);
    };
  }, [user]);

  useEffect(() => {
    const happiness = calculateHappiness(placedItems);
    setPetHappiness(happiness);
  }, [placedItems]);

  const deductEnergy = (amount: number) => {
    if (!user) return;
    const userId = user.id;
    const energyPointsKey = getStorageKey('pet-energy-points', userId);
    
    setEnergyPoints(prev => {
      const newEnergy = Math.max(0, prev - amount);
      localStorage.setItem(energyPointsKey, newEnergy.toString());
      return newEnergy;
    });
  };

  const addEnergy = (amount: number) => {
    if (!user) return;
    const userId = user.id;
    const energyPointsKey = getStorageKey('pet-energy-points', userId);
    
    setEnergyPoints(prev => {
      const newEnergy = prev + amount;
      localStorage.setItem(energyPointsKey, newEnergy.toString());
      return newEnergy;
    });
  };

  return (
    <PetContext.Provider value={{
      currentAnimation,
      petX,
      petY,
      petHappiness,
      energyPoints,
      petName,
      placedItems,
      isAnimating,
      addSequence,
      deductEnergy,
      addEnergy
    }}>
      {children}
    </PetContext.Provider>
  );
}

export function usePet() {
  const context = useContext(PetContext);
  if (!context) {
    throw new Error('usePet must be used within PetProvider');
  }
  return context;
}