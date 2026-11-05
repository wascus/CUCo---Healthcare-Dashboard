import { useState, useEffect, useRef, useCallback } from 'react';
import type { AnimationType } from './animationConfig';
import { PET_POSITIONS } from './petPositions';
import type { PositionKey } from './petPositions';
import type { AnimationSequence } from './petAnimationSequences';

interface UseAnimationQueueReturn {
  currentAnimation: AnimationType;
  petX: number;
  petY: number;
  addSequence: (sequence: AnimationSequence) => void;
  isAnimating: boolean;
}

export function useAnimationQueue(
  initialAnimation: AnimationType = 'idle',
  initialPosition: PositionKey = 'center',
  defaultAnimation: AnimationType = 'idle'
): UseAnimationQueueReturn {
  const [currentAnimation, setCurrentAnimation] = useState<AnimationType>(initialAnimation);
  const [petX, setPetX] = useState<number>(PET_POSITIONS[initialPosition].x);
  const [petY, setPetY] = useState<number>(PET_POSITIONS[initialPosition].y);
  const [isAnimating, setIsAnimating] = useState(false);
  
  const queueRef = useRef<AnimationSequence>([]);
  const isProcessingRef = useRef(false);
  const animationTimeoutRef = useRef<number | null>(null);

  // Sync current animation with default animation if not currently playing a sequence
  useEffect(() => {
    if (!isAnimating && queueRef.current.length === 0) {
      setCurrentAnimation(defaultAnimation);
    }
  }, [defaultAnimation, isAnimating]);

  // Smooth position lerping
  const lerpPosition = useCallback((
    targetX: number,
    targetY: number,
    duration: number = 1000
  ): Promise<void> => {
    return new Promise((resolve) => {
      const startX = petX;
      const startY = petY;
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Ease-in-out function
        const easeProgress = progress < 0.5
          ? 2 * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 2) / 2;

        const newX = startX + (targetX - startX) * easeProgress;
        const newY = startY + (targetY - startY) * easeProgress;

        setPetX(newX);
        setPetY(newY);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };

      animate();
    });
  }, [petX, petY]);

  // Process next step in queue
  const processNextStep = useCallback(async () => {
    if (isProcessingRef.current) {
      return;
    }
    
    if (queueRef.current.length === 0) {
      setCurrentAnimation(defaultAnimation);
      setIsAnimating(false);
      return;
    }

    isProcessingRef.current = true;
    setIsAnimating(true);
    const step = queueRef.current.shift()!;

    try {
      if (step.type === 'move' && step.position) {
        const target = PET_POSITIONS[step.position];
        if (step.animation) {
          setCurrentAnimation(step.animation);
        }
        await lerpPosition(target.x, target.y, 1000);
      } else if (step.type === 'animate' && step.animation) {
        setCurrentAnimation(step.animation);
        if (step.duration) {
          await new Promise(resolve => {
            animationTimeoutRef.current = window.setTimeout(resolve, step.duration);
          });
        }
      } else if (step.type === 'wait' && step.duration) {
        await new Promise(resolve => {
          animationTimeoutRef.current = window.setTimeout(resolve, step.duration);
        });
      }
    } catch (error) {
      console.error('Animation step error:', error);
    }

    isProcessingRef.current = false;
    processNextStep();
  }, [lerpPosition, defaultAnimation]);

  // Add sequence to queue
  const addSequence = useCallback((sequence: AnimationSequence) => {
    queueRef.current.push(...sequence);
    if (!isProcessingRef.current) {
      processNextStep();
    }
  }, [processNextStep]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, []);

  return {
    currentAnimation,
    petX,
    petY,
    addSequence,
    isAnimating
  };
}