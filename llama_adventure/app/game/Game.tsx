'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { VIEWPORT_WIDTH, GAME_HEIGHT, LEVELS, GameState, MAX_LIVES } from './constants';
import { Player } from './Player';
import { Platform, Letter, MysteryBox, Particle } from './entities';
import { render } from './renderer';
import { initLevel, triggerMysteryBox, collectLetter, updateParticles } from './gameLogic';
import TouchControls from '../components/TouchControls';
import { autoSaveScore } from '@/lib/autoSave';
import { calculatePoints } from '@/lib/score';

interface GameProps {
  onShowLeaderboard?: () => void;
  currentUserId?: string;
}

export default function Game({ onShowLeaderboard, currentUserId }: GameProps = {}) {
  const queryClient = useQueryClient();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>("MENU");
  const [currentPhrase, setCurrentPhrase] = useState("");
  const [currentPhraseArray, setCurrentPhraseArray] = useState<string[]>([]);
  const [collectedIndices, setCollectedIndices] = useState<Set<number>>(new Set());
  const [lives, setLives] = useState(MAX_LIVES);
  const [gameStartTime, setGameStartTime] = useState(0);
  const [finalTime, setFinalTime] = useState(0);

  const playerRef = useRef<Player>(new Player());
  const platformsRef = useRef<Platform[]>([]);
  const mysteryBoxesRef = useRef<MysteryBox[]>([]);
  const lettersRef = useRef<Letter[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const cameraXRef = useRef(0);
  const finalFlagRef = useRef({ x: 0, y: 0 });
  const worldWidthRef = useRef({ value: 8500 });
  const keysRef = useRef<Record<string, boolean>>({
    ArrowRight: false,
    ArrowLeft: false,
    Space: false,
    ArrowUp: false
  });
  const gameStateRef = useRef<GameState>("MENU");
  const gameStartTimeRef = useRef(0);
  const currentPhraseRef = useRef<string>("");
  const currentPhraseArrayRef = useRef<string[]>([]);
  const collectedIndicesRef = useRef<Set<number>>(new Set());
  const [isMobile, setIsMobile] = useState(false);
  const scaleRef = useRef(1);
  const [debugMode, setDebugMode] = useState(false);

  const updateSlot = useCallback((index: number) => {
    const slot = document.getElementById(`slot-${index}`);
    if (slot) slot.classList.add('collected');
  }, []);

  const updateLivesUI = useCallback(() => {
    const container = document.getElementById('lives-display');
    if (!container) return;
    container.innerHTML = '';
    for (let i = 0; i < MAX_LIVES; i++) {
      const heart = document.createElement('div');
      heart.className = 'heart' + (i >= lives ? ' lost' : '');
      container.appendChild(heart);
    }
  }, [lives]);

  const loseLife = useCallback(() => {
    setLives(prev => {
      const newLives = prev - 1;
      const flash = document.createElement('div');
      flash.style.position = 'absolute';
      flash.style.top = '0';
      flash.style.left = '0';
      flash.style.width = '100%';
      flash.style.height = '100%';
      flash.style.background = 'rgba(255, 69, 0, 0.4)';
      flash.style.pointerEvents = 'none';
      flash.style.zIndex = '100';
      document.body.appendChild(flash);
      setTimeout(() => flash.remove(), 100);

      if (newLives <= 0) {
        gameStateRef.current = "LOST";
        setGameState("LOST");
      } else {
        playerRef.current.respawn();
      }
      return newLives;
    });
  }, []);

  const finishGame = useCallback((win: boolean) => {
    if (gameStateRef.current !== "PLAYING") return;
    const newState = win ? "WON" : "LOST";
    gameStateRef.current = newState;
    setGameState(newState);
    
    const now = Date.now();
    const startTime = gameStartTimeRef.current;
    const phrase = currentPhraseRef.current;
    
    // Validate that game actually started
    if (!startTime || startTime === 0) {
      console.warn('Game start time not set, cannot calculate completion time');
      return;
    }
    
    const diff = Math.max(0, (now - startTime) / 1000);
    
    // Validate currentPhrase is set
    if (!phrase || phrase.trim().length === 0) {
      console.warn('Current phrase not set, cannot save score');
      return;
    }
    
    if (win) {
      setFinalTime(diff);
      const winSubtitle = document.getElementById('win-subtitle');
      if (winSubtitle) {
        winSubtitle.innerText = `"${phrase}" COMPLETADO`;
      }
    }
    
    // Auto-save score for both win and game over with optimistic updates
    autoSaveScore({
      levelName: phrase,
      completionTime: diff,
      won: win,
      queryClient,
    });
  }, [queryClient]);

  const showMenu = useCallback(() => {
    gameStateRef.current = "MENU";
    setGameState("MENU");
    collectedIndicesRef.current = new Set();
    setCollectedIndices(new Set());
    setLives(MAX_LIVES);
  }, []);

  const startGame = useCallback((phrase: string) => {
    setCurrentPhrase(phrase);
    currentPhraseRef.current = phrase;
    const phraseArray = initLevel(
      phrase,
      playerRef.current,
      platformsRef.current,
      mysteryBoxesRef.current,
      lettersRef.current,
      particlesRef.current,
      finalFlagRef.current,
      worldWidthRef.current
    );
    currentPhraseArrayRef.current = phraseArray;
    setCurrentPhraseArray(phraseArray);
    collectedIndicesRef.current = new Set();
    setCollectedIndices(new Set());
    setLives(MAX_LIVES);
    const startTime = Date.now();
    gameStartTimeRef.current = startTime;
    setGameStartTime(startTime);
    gameStateRef.current = "PLAYING";
    setGameState("PLAYING");
    playerRef.current.worldWidth = worldWidthRef.current.value;

    const uiContainer = document.getElementById('letters-container');
    if (uiContainer) {
      uiContainer.innerHTML = '';
      phraseArray.forEach((char, i) => {
        const div = document.createElement('div');
        div.className = 'letter-slot';
        if (char === ' ') {
          div.className += ' space';
        } else {
          div.id = `slot-${i}`;
          div.innerText = char;
        }
        uiContainer.appendChild(div);
      });
    }
  }, []);

  const restartLevel = useCallback(() => {
    startGame(currentPhrase);
  }, [currentPhrase, startGame]);

  useEffect(() => {
    updateLivesUI();
  }, [lives, updateLivesUI]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;
    
    if (isMobile) {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = VIEWPORT_WIDTH * dpr;
      canvas.height = GAME_HEIGHT * dpr;
      ctx.scale(dpr, dpr);
    }

    const update = () => {
      if (gameStateRef.current !== "PLAYING") return;

      const now = Date.now();
      const diff = (now - gameStartTimeRef.current) / 1000;
      const timerDisplay = document.getElementById('timer-display');
      if (timerDisplay) {
        timerDisplay.innerText = "TIEMPO: " + diff.toFixed(2);
      }

      let indicesUpdated = false;
      const currentCollectedIndices = new Set(collectedIndicesRef.current);
      
      playerRef.current.update(
        keysRef.current,
        platformsRef.current,
        mysteryBoxesRef.current,
        (box) => {
          if (triggerMysteryBox(box, particlesRef.current, currentCollectedIndices, updateSlot)) {
            indicesUpdated = true;
          }
        },
        loseLife,
        finalFlagRef.current,
        currentPhraseArrayRef.current,
        currentCollectedIndices,
        finishGame
      );

      cameraXRef.current = playerRef.current.x - 200;
      if (cameraXRef.current < 0) cameraXRef.current = 0;
      if (cameraXRef.current > worldWidthRef.current.value - VIEWPORT_WIDTH) {
        cameraXRef.current = worldWidthRef.current.value - VIEWPORT_WIDTH;
      }

      lettersRef.current.forEach(letter => {
        if (!letter.collected) {
          const player = playerRef.current;
          if (
            player.x < letter.x + letter.width &&
            player.x + player.width > letter.x &&
            player.y < letter.y + letter.height &&
            player.y + player.height > letter.y
          ) {
            if (collectLetter(letter, particlesRef.current, currentCollectedIndices, updateSlot)) {
              indicesUpdated = true;
            }
          }
        }
      });

      if (indicesUpdated) {
        collectedIndicesRef.current = currentCollectedIndices;
        setCollectedIndices(currentCollectedIndices);
      }

      updateParticles(particlesRef.current);
    };

    const draw = () => {
      if (!ctx) return;
      if (gameStateRef.current !== "MENU") {
        render(
          ctx,
          cameraXRef.current,
          platformsRef.current,
          mysteryBoxesRef.current,
          lettersRef.current,
          particlesRef.current,
          playerRef.current,
          finalFlagRef.current,
          currentPhraseArrayRef.current,
          collectedIndicesRef.current
        );
      }
    };

    let lastTime = 0;
    const targetFPS = isMobile ? 30 : 60;
    const frameInterval = 1000 / targetFPS;

    const loop = (currentTime: number) => {
      const elapsed = currentTime - lastTime;

      if (elapsed >= frameInterval) {
        update();
        draw();
        lastTime = currentTime - (elapsed % frameInterval);
      }

      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
  }, [loseLife, finishGame, updateSlot, isMobile]);

  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
        (window.innerWidth <= 768 && 'ontouchstart' in window);
      setIsMobile(isMobileDevice);
      
      if (isMobileDevice && canvasRef.current) {
        const wrapper = document.getElementById('game-wrapper');
        if (wrapper) {
          const maxWidth = window.innerWidth - 20;
          const maxHeight = window.innerHeight - 200;
          const scaleX = maxWidth / VIEWPORT_WIDTH;
          const scaleY = maxHeight / GAME_HEIGHT;
          const scale = Math.min(scaleX, scaleY, 1);
          scaleRef.current = scale;
          wrapper.style.transform = `scale(${scale})`;
          wrapper.style.transformOrigin = 'top center';
        }
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    window.addEventListener('orientationchange', checkMobile);

    const handleKeyDown = (e: KeyboardEvent) => {
      // Debug mode shortcuts
      if (e.key.toLowerCase() === 'd' && e.ctrlKey) {
        setDebugMode(prev => !prev);
        return;
      }

      if (debugMode && gameStateRef.current === "PLAYING") {
        if (e.key.toLowerCase() === 'n') {
          // Skip to next level
          const currentIndex = LEVELS.indexOf(currentPhraseRef.current);
          if (currentIndex < LEVELS.length - 1) {
            startGame(LEVELS[currentIndex + 1]);
          }
          return;
        }
        if (e.key.toLowerCase() === 'c') {
          // Collect all letters
          const allIndices = new Set<number>();
          currentPhraseArrayRef.current.forEach((char, i) => {
            if (char !== ' ') {
              allIndices.add(i);
              updateSlot(i);
            }
          });
          collectedIndicesRef.current = allIndices;
          setCollectedIndices(allIndices);
          
          // Collect all mystery boxes
          mysteryBoxesRef.current.forEach(box => {
            if (box.active) {
              triggerMysteryBox(box, particlesRef.current, allIndices, updateSlot);
            }
          });
          
          // Collect all letters
          lettersRef.current.forEach(letter => {
            if (!letter.collected) {
              collectLetter(letter, particlesRef.current, allIndices, updateSlot);
            }
          });
          return;
        }
        if (e.key.toLowerCase() === 't') {
          // Teleport to end flag
          playerRef.current.x = finalFlagRef.current.x - 50;
          playerRef.current.y = finalFlagRef.current.y - 100;
          playerRef.current.vx = 0;
          playerRef.current.vy = 0;
          return;
        }
        if (e.key.toLowerCase() === 'f') {
          // Finish level instantly
          const allIndices = new Set<number>();
          currentPhraseArrayRef.current.forEach((char, i) => {
            if (char !== ' ') {
              allIndices.add(i);
              updateSlot(i);
            }
          });
          collectedIndicesRef.current = allIndices;
          setCollectedIndices(allIndices);
          playerRef.current.x = finalFlagRef.current.x - 50;
          playerRef.current.y = finalFlagRef.current.y - 50;
          finishGame(true);
          return;
        }
      }

      if (keysRef.current.hasOwnProperty(e.code) || e.code === 'Space') {
        keysRef.current[e.code === 'Space' ? 'Space' : e.code] = true;
        if (e.code === 'Space') e.preventDefault();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (keysRef.current.hasOwnProperty(e.code) || e.code === 'Space') {
        keysRef.current[e.code === 'Space' ? 'Space' : e.code] = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    document.body.addEventListener('touchmove', (e) => {
      if (gameStateRef.current === "PLAYING") {
        e.preventDefault();
      }
    }, { passive: false });

    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('orientationchange', checkMobile);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [debugMode, startGame, updateSlot, finishGame]);

  const handleMoveLeft = useCallback(() => {
    keysRef.current.ArrowLeft = true;
  }, []);

  const handleMoveRight = useCallback(() => {
    keysRef.current.ArrowRight = true;
  }, []);

  const handleStopMove = useCallback(() => {
    keysRef.current.ArrowLeft = false;
    keysRef.current.ArrowRight = false;
  }, []);

  const handleJump = useCallback(() => {
    keysRef.current.Space = true;
    keysRef.current.ArrowUp = true;
  }, []);

  const handleStopJump = useCallback(() => {
    keysRef.current.Space = false;
    keysRef.current.ArrowUp = false;
  }, []);

  return (
    <div className="game-container">
      <div id="game-wrapper">
        <canvas
          ref={canvasRef}
          id="gameCanvas"
          width={VIEWPORT_WIDTH}
          height={GAME_HEIGHT}
        />

        <div id="ui-layer" className={gameState === "PLAYING" ? '' : 'hidden'}>
          <div id="letters-container"></div>
          <div id="status-panel">
            <div id="lives-display"></div>
            <div id="timer-display">TIME: 0.00</div>
          </div>
          {debugMode && (
            <div style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              background: 'rgba(255, 0, 0, 0.8)',
              color: 'white',
              padding: '5px 10px',
              fontSize: '10px',
              fontFamily: 'monospace',
              borderRadius: '4px',
              zIndex: 1000
            }}>
              DEBUG MODE<br/>
              [N] Next Level<br/>
              [C] Collect All<br/>
              [T] Teleport End<br/>
              [F] Finish Level
            </div>
          )}
        </div>

        <div id="main-menu" className={`screen-overlay ${gameState === "MENU" ? '' : 'hidden'}`}>
          <h1>LLAMA ADVENTURE</h1>
          <p>SELECCIONA NIVEL</p>
          {onShowLeaderboard && (
            <button
              className="btn-pixel"
              onClick={onShowLeaderboard}
              style={{ 
                marginBottom: '20px', 
                fontSize: '12px', 
                padding: '10px 20px',
                background: '#CD853F'
              }}
            >
              VER CLASIFICACIÓN
            </button>
          )}
          <div className="level-grid">
            {LEVELS.map((levelName, index) => (
              <div
                key={index}
                className="level-btn"
                onClick={() => startGame(levelName)}
              >
                {index + 1}
              </div>
            ))}
          </div>
        </div>

        <div id="win-screen" className={`screen-overlay ${gameState === "WON" ? '' : 'hidden'}`}>
          <div className="modal-content">
            <h1>¡LOGRO OBTENIDO!</h1>
            <p id="win-subtitle">NIVEL COMPLETADO</p>
            <p id="final-time">TIEMPO: {finalTime.toFixed(2)}s</p>
            <p style={{ fontSize: '14px', marginTop: '10px', color: '#FFD700' }}>
              PUNTOS: {calculatePoints(finalTime, currentPhrase).toLocaleString()}
            </p>
            <p style={{ fontSize: '10px', marginTop: '10px', color: '#aaa' }}>
              Puntuación guardada automáticamente
            </p>
            {onShowLeaderboard && (
              <button 
                className="btn-pixel" 
                onClick={() => {
                  if (onShowLeaderboard) {
                    onShowLeaderboard();
                  }
                  showMenu();
                }}
                style={{ marginTop: '15px' }}
              >
                VER CLASIFICACIÓN
              </button>
            )}
            <button className="btn-pixel" onClick={showMenu} style={{ marginTop: '10px' }}>MENÚ PRINCIPAL</button>
          </div>
        </div>

        <div id="lose-screen" className={`screen-overlay ${gameState === "LOST" ? '' : 'hidden'}`}>
          <div className="modal-content">
            <h1>GAME OVER</h1>
            <p>La llama se perdió...</p>
            <button className="btn-pixel" onClick={restartLevel}>REINTENTAR</button>
            <br /><br />
            <button className="btn-pixel" style={{ fontSize: '10px', padding: '10px' }} onClick={showMenu}>MENÚ</button>
          </div>
        </div>
      </div>
      {isMobile && gameState === "PLAYING" && (
        <TouchControls
          onMoveLeft={handleMoveLeft}
          onMoveRight={handleMoveRight}
          onStopMove={handleStopMove}
          onJump={handleJump}
          onStopJump={handleStopJump}
        />
      )}
      <div id="controls-hint" className={isMobile ? 'mobile-hidden' : ''}>
        [FLECHAS] MOVER • [ESPACIO] SALTAR
        {debugMode && <span style={{ color: '#ff0000', marginLeft: '10px' }}>• DEBUG: CTRL+D</span>}
      </div>
    </div>
  );
}

