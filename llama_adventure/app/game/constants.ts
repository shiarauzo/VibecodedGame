export const VIEWPORT_WIDTH = 800;
export const GAME_HEIGHT = 400;
export const GRAVITY = 0.8;
export const MAX_LIVES = 3;
export const TERMINAL_VELOCITY = 15;

export const LEVELS = [
  "CRAFTER STATION",
  "IA PLAYGROUNDS",
  "START HACK PERU",
  "YAVENDIO!",
  "INSPIRA TECH",
  "HACKEANDO PRODUCTOS"
];

export const PALETTE = {
  skyTop: '#332211',
  skyBottom: '#CC6600',
  sun: '#FFD700',
  mountainDistant: '#2F4F4F',
  mountainMid: '#5A4D41',
  grass: '#4CAF50',
  grassLight: '#81C784',
  dirt: '#5D4037',
  flowerColors: ['#FFC0CB', '#FFD700', '#E0FFFF', '#FF69B4']
};

export type GameState = "MENU" | "PLAYING" | "WON" | "LOST";

