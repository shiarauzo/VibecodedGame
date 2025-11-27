import { LEVELS } from '../app/game/constants';

const BASE_POINTS = 10000;
const TIME_PENALTY_MULTIPLIER = 100;

const LEVEL_MULTIPLIERS: Record<string, number> = {
  'CRAFTER STATION': 1.0,
  'IA PLAYGROUNDS': 1.2,
  'START HACK PERU': 1.3,
  'YAVENDIO!': 1.1,
  'INSPIRA TECH': 1.4,
  'HACKEANDO PRODUCTOS': 1.5,
};

export function calculatePoints(completionTime: number, levelName: string): number {
  const timePenalty = completionTime * TIME_PENALTY_MULTIPLIER;
  const baseScore = Math.max(0, BASE_POINTS - timePenalty);
  const multiplier = LEVEL_MULTIPLIERS[levelName] || 1.0;
  return Math.floor(baseScore * multiplier);
}

export function isValidLevel(levelName: string): boolean {
  return LEVELS.includes(levelName);
}
