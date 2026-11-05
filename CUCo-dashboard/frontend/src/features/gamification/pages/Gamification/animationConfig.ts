import sleepingSprite from "../../assets/RetroCats/Cats/Sprites/Sleeping.png";
import idleSprite from "../../assets/RetroCats/Cats/Sprites/Idle.png";
import chillingSprite from "../../assets/RetroCats/Cats/Sprites/Chilling.png";
import happySprite from "../../assets/RetroCats/Cats/Sprites/Happy.png";
import excitedSprite from "../../assets/RetroCats/Cats/Sprites/Excited.png";
import danceSprite from "../../assets/RetroCats/Cats/Sprites/Dance.png";
import runningSprite from "../../assets/RetroCats/Cats/Sprites/Running.png";
import jumpSprite from "../../assets/RetroCats/Cats/Sprites/Jump.png";
import tickleSprite from "../../assets/RetroCats/Cats/Sprites/Tickle.png";
import box1Sprite from "../../assets/RetroCats/Cats/Sprites/Box1.png";

export type AnimationType = 
  | 'sleeping' 
  | 'idle' 
  | 'chilling' 
  | 'happy' 
  | 'excited' 
  | 'dance'
  | 'running'
  | 'jump'
  | 'tickle'
  | 'box1';

export interface AnimationConfig {
  sprite: string;
  frames: number;
  frameWidth: number;
  frameHeight: number;
  speed: number; // frames before switching to next frame (lower = faster)
}

export const ANIMATIONS: Record<AnimationType, AnimationConfig> = {
  sleeping: {
    sprite: sleepingSprite,
    frames: 4,
    frameWidth: 64,
    frameHeight: 64,
    speed: 20
  },
  idle: {
    sprite: idleSprite,
    frames: 4,
    frameWidth: 64,
    frameHeight: 64,
    speed: 30
  },
  chilling: {
    sprite: chillingSprite,
    frames: 8,
    frameWidth: 64,
    frameHeight: 64,
    speed: 10
  },
  happy: {
    sprite: happySprite,
    frames: 4,
    frameWidth: 64,
    frameHeight: 64,
    speed: 5
  },
  excited: {
    sprite: excitedSprite,
    frames: 3,
    frameWidth: 64,
    frameHeight: 64,
    speed: 5
  },
  dance: {
    sprite: danceSprite,
    frames: 4,
    frameWidth: 64,
    frameHeight: 64,
    speed: 5
  },
  running: {
    sprite: runningSprite,
    frames: 4,
    frameWidth: 64,
    frameHeight: 64,
    speed: 5
  },
  jump: {
    sprite: jumpSprite,
    frames: 12,
    frameWidth: 64,
    frameHeight: 64,
    speed: 2
  },
  tickle: {  
    sprite: tickleSprite,
    frames: 4,
    frameWidth: 64,
    frameHeight: 64,
    speed: 8
  },
    box1: { 
    sprite: box1Sprite,
    frames: 12,
    frameWidth: 64,
    frameHeight: 64,
    speed: 8
  }
};

// Get animation based on happiness level
export function getAnimationForHappiness(happiness: number): AnimationType {
  if (happiness <= 30) return 'sleeping';
  if (happiness <= 50) return 'chilling';
  if (happiness <= 70) return 'happy';
  if (happiness <= 90) return 'excited';
  return 'dance';
}