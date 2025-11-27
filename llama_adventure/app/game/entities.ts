import { PALETTE, GAME_HEIGHT } from './constants';

export interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
  flowers: Array<{ x: number; color: string }>;
}

export interface Letter {
  char: string;
  targetIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
  collected: boolean;
}

export interface MysteryBox {
  x: number;
  y: number;
  width: number;
  height: number;
  active: boolean;
  char: string;
  targetIndex: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  isText?: boolean;
  text?: string;
}

export function createPlatform(x: number, y: number, w: number, h: number): Platform {
  const flowers: Array<{ x: number; color: string }> = [];
  const numFlowers = Math.floor(w / 20);
  for (let i = 0; i < numFlowers; i++) {
    if (Math.random() > 0.6) {
      flowers.push({
        x: Math.random() * w,
        color: PALETTE.flowerColors[Math.floor(Math.random() * PALETTE.flowerColors.length)]
      });
    }
  }
  return { x, y, width: w, height: h, flowers };
}

