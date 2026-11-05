export interface PetPosition {
  x: number;
  y: number;
  name: string;
}

export const PET_POSITIONS = {
  bed: { x: 225, y: 185, name: 'bed' },
  center: { x: 256, y: 300, name: 'center' },
  foodBowl: { x: 220, y: 395, name: 'foodBowl' },
  playArea: { x: 380, y: 280, name: 'playArea' },
  leftSide: { x: 150, y: 280, name: 'leftSide' }
} as const;

export type PositionKey = keyof typeof PET_POSITIONS;