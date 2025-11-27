import { GAME_HEIGHT, GRAVITY, TERMINAL_VELOCITY } from './constants';

export class Player {
  width = 40;
  height = 40;
  x = 50;
  y = GAME_HEIGHT - 150;
  vx = 0;
  vy = 0;
  maxSpeed = 6;
  acceleration = 0.5;
  groundFriction = 0.85;
  airFriction = 0.95;
  airControl = 0.3;
  jumpPower = -14;
  jumpHoldPower = -0.4;
  maxJumpHoldTime = 12;
  jumpHoldTime = 0;
  grounded = false;
  coyoteTime = 0;
  coyoteTimeMax = 8;
  facingRight = true;
  invulnerable = false;
  color = '#FFFFFF';
  worldWidth = 8500;

  reset() {
    this.x = 50;
    this.y = GAME_HEIGHT - 150;
    this.vx = 0;
    this.vy = 0;
    this.jumpHoldTime = 0;
    this.grounded = false;
    this.coyoteTime = 0;
    this.facingRight = true;
    this.invulnerable = false;
  }

  respawn() {
    this.x = Math.max(50, this.x - 200);
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.jumpHoldTime = 0;
    this.coyoteTime = 0;
    this.invulnerable = true;
    setTimeout(() => this.invulnerable = false, 1000);
  }

  update(keys: Record<string, boolean>, platforms: any[], mysteryBoxes: any[], triggerMysteryBox: (box: any) => void, loseLife: () => void, finalFlag: { x: number; y: number }, currentPhraseArray: string[], collectedIndices: Set<number>, finishGame: (win: boolean) => void) {
    const isJumping = keys.Space || keys.ArrowUp;
    const canJump = this.grounded || this.coyoteTime > 0;

    if (this.grounded) {
      this.coyoteTime = this.coyoteTimeMax;
    } else {
      this.coyoteTime = Math.max(0, this.coyoteTime - 1);
    }

    if (this.grounded) {
      if (keys.ArrowRight) {
        this.vx = Math.min(this.vx + this.acceleration, this.maxSpeed);
        this.facingRight = true;
      } else if (keys.ArrowLeft) {
        this.vx = Math.max(this.vx - this.acceleration, -this.maxSpeed);
        this.facingRight = false;
      } else {
        this.vx *= this.groundFriction;
        if (Math.abs(this.vx) < 0.1) this.vx = 0;
      }
    } else {
      if (keys.ArrowRight) {
        this.vx = Math.min(this.vx + this.acceleration * this.airControl, this.maxSpeed);
        this.facingRight = true;
      } else if (keys.ArrowLeft) {
        this.vx = Math.max(this.vx - this.acceleration * this.airControl, -this.maxSpeed);
        this.facingRight = false;
      }
      this.vx *= this.airFriction;
    }

    if (isJumping && canJump && this.jumpHoldTime === 0) {
      this.vy = this.jumpPower;
      this.grounded = false;
      this.coyoteTime = 0;
      this.jumpHoldTime = 1;
    }

    if (isJumping && this.jumpHoldTime > 0 && this.jumpHoldTime < this.maxJumpHoldTime && this.vy < 0) {
      this.vy += this.jumpHoldPower;
      this.jumpHoldTime++;
    } else if (!isJumping) {
      this.jumpHoldTime = 0;
    }

    this.vy += GRAVITY;
    this.vy = Math.min(this.vy, TERMINAL_VELOCITY);
    
    this.x += this.vx;
    this.y += this.vy;

    if (this.x < 0) this.x = 0;
    if (this.x > this.worldWidth - this.width) this.x = this.worldWidth - this.width;

    this.grounded = false;

    platforms.forEach(platform => {
      const dir = this.colCheck(this, platform);
      if (dir === "b") {
        this.grounded = true;
        this.coyoteTime = this.coyoteTimeMax;
        if (this.vy > 0) {
          this.vy = 0;
        }
        this.jumpHoldTime = 0;
      } else if (dir === "t") {
        if (this.vy < 0) {
          this.vy = 0;
        }
      }
    });

    mysteryBoxes.forEach(box => {
      if (box.active) {
        const dir = this.colCheck(this, box);
        if (dir === "b") {
          this.grounded = true;
          this.coyoteTime = this.coyoteTimeMax;
          if (this.vy > 0) {
            this.vy = 0;
          }
          this.jumpHoldTime = 0;
        } else if (dir === "t") {
          if (this.vy < 0) {
            this.vy = 0;
          }
          triggerMysteryBox(box);
        }
      }
    });

    if (this.y > GAME_HEIGHT) loseLife();

    if (this.x + this.width > finalFlag.x && this.x < finalFlag.x + 20) {
      const requiredLetters = currentPhraseArray.filter(c => c !== ' ').length;
      if (this.y > finalFlag.y - 100 && collectedIndices.size === requiredLetters) {
        finishGame(true);
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(Math.floor(this.x + this.width / 2), Math.floor(this.y + this.height / 2));
    if (!this.facingRight) ctx.scale(-1, 1);

    ctx.fillStyle = this.color;
    ctx.fillRect(-20, -10, 40, 20);

    ctx.fillStyle = '#EEE';
    if (Math.abs(this.vx) > 0.5 && !this.grounded === false) {
      const walk = Math.sin(Date.now() / 100) * 10;
      ctx.fillRect(-18 + walk, 10, 8, 15);
      ctx.fillRect(10 - walk, 10, 8, 15);
    } else {
      ctx.fillRect(-18, 10, 8, 15);
      ctx.fillRect(10, 10, 8, 15);
    }

    ctx.fillStyle = this.color;
    ctx.fillRect(10, -30, 10, 30);

    ctx.fillStyle = '#EEE';
    ctx.fillRect(12, -35, 3, 8);
    ctx.fillRect(17, -35, 3, 8);

    ctx.fillStyle = 'black';
    ctx.fillRect(13, -25, 4, 4);
    ctx.fillStyle = 'white';
    ctx.fillRect(15, -25, 2, 2);

    ctx.fillStyle = '#D500F9';
    ctx.fillRect(-10, -10, 5, 20);
    ctx.fillStyle = '#00E676';
    ctx.fillRect(-5, -10, 5, 20);
    ctx.fillStyle = '#FF3D00';
    ctx.fillRect(0, -10, 5, 20);

    ctx.restore();
  }

  colCheck(shapeA: any, shapeB: any) {
    const vX = (shapeA.x + (shapeA.width / 2)) - (shapeB.x + (shapeB.width / 2));
    const vY = (shapeA.y + (shapeA.height / 2)) - (shapeB.y + (shapeB.height / 2));
    const hWidths = (shapeA.width / 2) + (shapeB.width / 2);
    const hHeights = (shapeA.height / 2) + (shapeB.height / 2);
    let colDir = null;

    if (Math.abs(vX) < hWidths && Math.abs(vY) < hHeights) {
      const oX = hWidths - Math.abs(vX);
      const oY = hHeights - Math.abs(vY);

      if (oX >= oY) {
        if (vY > 0) {
          colDir = "t";
          shapeA.y += oY;
        } else {
          colDir = "b";
          shapeA.y -= oY;
        }
      } else {
        if (vX > 0) {
          colDir = "l";
          shapeA.x += oX;
        } else {
          colDir = "r";
          shapeA.x -= oX;
        }
      }
    }
    return colDir;
  }
}

