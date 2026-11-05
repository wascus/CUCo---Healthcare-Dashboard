import type { AnimationType } from './animationConfig';
import type { PositionKey } from './petPositions';

export interface AnimationStep {
  type: 'move' | 'animate' | 'wait';
  position?: PositionKey;
  animation?: AnimationType;
  duration?: number; // milliseconds
}

export type AnimationSequence = AnimationStep[];

// Feed sequence: run to food bowl → happy → run back
export const FEED_SEQUENCE: AnimationSequence = [
  { type: 'move', position: 'foodBowl', animation: 'running' },
  { type: 'animate', animation: 'happy', duration: 2000 },
  { type: 'animate', animation: 'excited', duration: 1500 },
  { type: 'move', position: 'center', animation: 'running' }
];

// Play sequence: run to play area → jump → excited → run back
export const PLAY_SEQUENCE: AnimationSequence = [
//   { type: 'animate', animation: 'running', duration: 500 },
//   { type: 'move', position: 'playArea', animation: 'running' },
  { type: 'animate', animation: 'box1', duration: 8000 },  // ←  tickle to box1
//   { type: 'animate', animation: 'happy', duration: 1000 },
//   { type: 'animate', animation: 'running', duration: 500 },
//   { type: 'move', position: 'center', animation: 'running' },
];

// Tickle sequence: tickle animation only
export const TICKLE_SEQUENCE: AnimationSequence = [
  { type: 'animate', animation: 'tickle', duration: 2000 }
];

// Play sequence: running → dance
export const PLAY_ANIMATION_SEQUENCE: AnimationSequence = [
  { type: 'animate', animation: 'running', duration: 1000 },
  { type: 'animate', animation: 'dance', duration: 2000 }
];

// Wake-up sequence: sleeping → wake up → happy
export const WAKE_UP_SEQUENCE: AnimationSequence = [
  { type: 'animate', animation: 'sleeping', duration: 3000 },
  { type: 'animate', animation: 'happy', duration: 2000 },
  { type: 'animate', animation: 'idle', duration: 1000 }
];

// Random idle animations (no movement)
export const IDLE_SEQUENCES: AnimationSequence[] = [
  [
    { type: 'animate', animation: 'chilling', duration: 3000 },
    { type: 'animate', animation: 'idle', duration: 1000 }
  ],
  [
    { type: 'animate', animation: 'idle', duration: 2000 },
    { type: 'animate', animation: 'happy', duration: 2000 }
  ],
  [
    { type: 'animate', animation: 'chilling', duration: 2000 },
    { type: 'animate', animation: 'idle', duration: 2000 }
  ]
];

// Get random idle sequence
export function getRandomIdleSequence(): AnimationSequence {
  return IDLE_SEQUENCES[Math.floor(Math.random() * IDLE_SEQUENCES.length)];
}

// Happiness-based behavior (no movement)
export function getHappinessBehavior(happiness: number): AnimationSequence {
  if (happiness < 30) {
    // Low happiness: idle
    return [
      { type: 'animate', animation: 'idle', duration: 3000 }
    ];
  } else if (happiness <= 60) {
    // Medium happiness: happy
    return [
      { type: 'animate', animation: 'happy', duration: 3000 }
    ];
  } else {
    // High happiness: excited
    return [
      { type: 'animate', animation: 'excited', duration: 3000 }
    ];
  }
}

export function getHappinessAnimation(happiness: number): AnimationType {
  if (happiness < 30) return 'idle';
  if (happiness <= 60) return 'happy';
  return 'excited';
}