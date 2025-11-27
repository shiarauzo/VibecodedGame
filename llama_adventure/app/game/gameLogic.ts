import { GAME_HEIGHT, MAX_LIVES } from './constants';
import { Platform, Letter, MysteryBox, Particle, createPlatform } from './entities';
import { Player } from './Player';

export function initLevel(
  phraseText: string,
  player: Player,
  platforms: Platform[],
  mysteryBoxes: MysteryBox[],
  letters: Letter[],
  particles: Particle[],
  finalFlag: { x: number; y: number },
  worldWidth: { value: number }
) {
  platforms.length = 0;
  mysteryBoxes.length = 0;
  letters.length = 0;
  particles.length = 0;
  player.reset();

  const currentPhraseArray = phraseText.split('');

  platforms.push(createPlatform(0, GAME_HEIGHT - 40, 600, 40));

  let currentX = 500;

  currentPhraseArray.forEach((char, index) => {
    if (char === ' ') {
      platforms.push(createPlatform(currentX, GAME_HEIGHT - 40, 300, 40));
      currentX += 300;
      return;
    }

    const gap = 150 + Math.random() * 100;
    currentX += gap;

    const challengeType = Math.random();

    if (challengeType < 0.5) {
      const yPos = 180 + Math.random() * 50;
      platforms.push(createPlatform(currentX - 50, yPos + 40, 120, 20));
      if (gap > 200) platforms.push(createPlatform(currentX - (gap / 2) - 40, yPos + 80, 80, 20));

      letters.push({
        char,
        targetIndex: index,
        x: currentX - 10,
        y: yPos,
        width: 20,
        height: 20,
        collected: false
      });
    } else {
      const yPos = 220;
      platforms.push(createPlatform(currentX - 50, yPos + 40, 120, 20));

      mysteryBoxes.push({
        x: currentX - 15,
        y: yPos - 90,
        width: 30,
        height: 30,
        active: true,
        char: char,
        targetIndex: index
      });
    }
  });

  const finalX = currentX + 300;
  platforms.push(createPlatform(finalX, GAME_HEIGHT - 60, 400, 60));
  finalFlag.x = finalX + 200;
  finalFlag.y = GAME_HEIGHT - 60;
  worldWidth.value = finalX + 600;

  return currentPhraseArray;
}

export function triggerMysteryBox(
  box: MysteryBox,
  particles: Particle[],
  collectedIndices: Set<number>,
  updateSlot: (index: number) => void
): boolean {
  if (!box.active) return false;
  box.active = false;

  particles.push({
    x: box.x + 5,
    y: box.y - 20,
    vx: 0,
    vy: -2,
    life: 60,
    color: '#FFF',
    text: box.char,
    isText: true
  });

  collectedIndices.add(box.targetIndex);
  updateSlot(box.targetIndex);
  return true;
}

export function collectLetter(
  letter: Letter,
  particles: Particle[],
  collectedIndices: Set<number>,
  updateSlot: (index: number) => void
): boolean {
  if (letter.collected) return false;
  letter.collected = true;
  collectedIndices.add(letter.targetIndex);
  updateSlot(letter.targetIndex);

  for (let i = 0; i < 10; i++) {
    particles.push({
      x: letter.x + 10,
      y: letter.y + 10,
      vx: (Math.random() - 0.5) * 10,
      vy: (Math.random() - 0.5) * 10,
      life: 30,
      color: '#FFD700',
      isText: false
    });
  }
  return true;
}

export function updateParticles(particles: Particle[]) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.life--;
    p.x += p.vx;
    p.y += p.vy;

    if (p.life <= 0) {
      particles.splice(i, 1);
    }
  }
}

