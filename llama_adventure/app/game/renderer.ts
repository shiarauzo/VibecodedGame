import { VIEWPORT_WIDTH, GAME_HEIGHT, PALETTE } from './constants';
import { Platform, Letter, MysteryBox, Particle } from './entities';
import { Player } from './Player';

export function drawSunsetBackground(ctx: CanvasRenderingContext2D) {
  const grad = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
  grad.addColorStop(0, PALETTE.skyTop);
  grad.addColorStop(1, PALETTE.skyBottom);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, VIEWPORT_WIDTH, GAME_HEIGHT);

  ctx.fillStyle = PALETTE.sun;
  ctx.beginPath();
  ctx.arc(150, 100, 40, 0, Math.PI * 2);
  ctx.fill();
}

export function drawSolidMountainLandscape(ctx: CanvasRenderingContext2D, cameraX: number) {
  ctx.fillStyle = PALETTE.mountainDistant;
  ctx.beginPath();
  ctx.moveTo(0, GAME_HEIGHT);
  for (let x = 0; x <= VIEWPORT_WIDTH; x += 10) {
    let parallaxX = x + (cameraX * 0.2);
    let h = 150 + Math.sin(parallaxX * 0.003) * 100 + Math.sin(parallaxX * 0.01) * 20;
    ctx.lineTo(x, GAME_HEIGHT - h);
  }
  ctx.lineTo(VIEWPORT_WIDTH, GAME_HEIGHT);
  ctx.fill();

  ctx.fillStyle = PALETTE.mountainMid;
  ctx.beginPath();
  ctx.moveTo(0, GAME_HEIGHT);
  for (let x = 0; x <= VIEWPORT_WIDTH; x += 10) {
    let parallaxX = x + (cameraX * 0.5);
    let h = 80 + Math.abs(Math.sin(parallaxX * 0.005)) * 150;
    if (h > 100) h = Math.floor(h / 20) * 20;
    ctx.lineTo(x, GAME_HEIGHT - h);
  }
  ctx.lineTo(VIEWPORT_WIDTH, GAME_HEIGHT);
  ctx.fill();
}

export function drawFogOverlay(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = 'rgba(60, 30, 10, 0.2)';
  ctx.fillRect(0, 0, VIEWPORT_WIDTH, GAME_HEIGHT);
}

export function drawPlatforms(ctx: CanvasRenderingContext2D, platforms: Platform[]) {
  platforms.forEach(p => {
    ctx.fillStyle = PALETTE.dirt;
    ctx.fillRect(p.x, p.y + 10, p.width, p.height - 10);
    ctx.fillStyle = PALETTE.grass;
    ctx.fillRect(p.x, p.y, p.width, 10);
    ctx.fillStyle = PALETTE.grassLight;
    ctx.fillRect(p.x, p.y, p.width, 3);
    p.flowers.forEach(f => {
      ctx.fillStyle = f.color;
      ctx.fillRect(p.x + f.x, p.y - 4, 4, 4);
      ctx.fillStyle = '#2E7D32';
      ctx.fillRect(p.x + f.x + 1, p.y, 2, 2);
    });
  });
}

export function drawMysteryBoxes(ctx: CanvasRenderingContext2D, mysteryBoxes: MysteryBox[]) {
  mysteryBoxes.forEach(box => {
    if (box.active) {
      ctx.fillStyle = '#FFD700';
      ctx.fillRect(box.x, box.y, box.width, box.height);

      ctx.lineWidth = 2;
      ctx.strokeStyle = '#B8860B';
      ctx.strokeRect(box.x, box.y, box.width, box.height);

      ctx.fillStyle = '#000';
      ctx.font = "bold 20px monospace";
      ctx.fillText("?", box.x + 8, box.y + 22);
    } else {
      ctx.fillStyle = '#5D4037';
      ctx.fillRect(box.x, box.y, box.width, box.height);
      ctx.strokeStyle = '#3E2723';
      ctx.strokeRect(box.x, box.y, box.width, box.height);
    }
  });
}

export function drawFinalFlag(ctx: CanvasRenderingContext2D, finalFlag: { x: number; y: number }) {
  ctx.fillStyle = '#333';
  ctx.fillRect(finalFlag.x, finalFlag.y - 120, 6, 120);
  const wave = Math.sin(Date.now() / 200) * 5;
  ctx.fillStyle = '#D91023';
  ctx.fillRect(finalFlag.x + 6, finalFlag.y - 120, 10, 60 + wave);
  ctx.fillStyle = '#FFF';
  ctx.fillRect(finalFlag.x + 16, finalFlag.y - 120 + (wave * 0.3), 10, 60 + wave);
  ctx.fillStyle = '#D91023';
  ctx.fillRect(finalFlag.x + 26, finalFlag.y - 120 + wave, 10, 60 + wave);
}

export function drawLetters(ctx: CanvasRenderingContext2D, letters: Letter[]) {
  ctx.font = "bold 24px 'Press Start 2P'";
  ctx.textAlign = "center";
  letters.forEach(l => {
    if (!l.collected) {
      const floatY = Math.sin(Date.now() / 150) * 5;
      ctx.shadowColor = '#FFD700';
      ctx.shadowBlur = 15;
      ctx.fillStyle = '#FFF';
      ctx.fillText(l.char, l.x + 10, l.y + floatY + 25);
      ctx.shadowBlur = 0;
    }
  });
}

export function drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]) {
  particles.forEach((p) => {
    if (p.isText) {
      ctx.fillStyle = '#FFF';
      ctx.font = "bold 20px monospace";
      ctx.fillText(p.text || '', p.x, p.y);
    } else {
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, 4, 4);
    }
  });
}

export function drawWarningMessage(ctx: CanvasRenderingContext2D, player: Player, finalFlag: { x: number; y: number }, collectedIndices: Set<number>, currentPhraseArray: string[]) {
  const requiredLetters = currentPhraseArray.filter(c => c !== ' ').length;
  if (player.x + player.width > finalFlag.x - 300 && collectedIndices.size < requiredLetters) {
    ctx.fillStyle = "#FFF";
    ctx.font = "12px 'Press Start 2P'";
    ctx.fillText("FALTAN LETRAS", player.x + 20, player.y - 30);
  }
}

export function render(
  ctx: CanvasRenderingContext2D,
  cameraX: number,
  platforms: Platform[],
  mysteryBoxes: MysteryBox[],
  letters: Letter[],
  particles: Particle[],
  player: Player,
  finalFlag: { x: number; y: number },
  currentPhraseArray: string[],
  collectedIndices: Set<number>
) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  drawSunsetBackground(ctx);
  drawSolidMountainLandscape(ctx, cameraX);
  drawFogOverlay(ctx);

  ctx.save();
  ctx.translate(-cameraX, 0);

  drawPlatforms(ctx, platforms);
  drawMysteryBoxes(ctx, mysteryBoxes);
  drawFinalFlag(ctx, finalFlag);
  drawLetters(ctx, letters);
  drawParticles(ctx, particles);
  drawWarningMessage(ctx, player, finalFlag, collectedIndices, currentPhraseArray);
  player.draw(ctx);

  ctx.restore();
}

