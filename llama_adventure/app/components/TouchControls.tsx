'use client';

import { useEffect, useRef } from 'react';

interface TouchControlsProps {
  onMoveLeft: () => void;
  onMoveRight: () => void;
  onStopMove: () => void;
  onJump: () => void;
  onStopJump: () => void;
}

export default function TouchControls({
  onMoveLeft,
  onMoveRight,
  onStopMove,
  onJump,
  onStopJump,
}: TouchControlsProps) {
  const leftButtonRef = useRef<HTMLDivElement>(null);
  const rightButtonRef = useRef<HTMLDivElement>(null);
  const jumpButtonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const leftBtn = leftButtonRef.current;
    const rightBtn = rightButtonRef.current;
    const jumpBtn = jumpButtonRef.current;

    const handleLeftStart = (e: TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onMoveLeft();
    };

    const handleLeftEnd = (e: TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onStopMove();
    };

    const handleRightStart = (e: TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onMoveRight();
    };

    const handleRightEnd = (e: TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onStopMove();
    };

    const handleJumpStart = (e: TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onJump();
    };

    const handleJumpEnd = (e: TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onStopJump();
    };

    if (leftBtn) {
      leftBtn.addEventListener('touchstart', handleLeftStart, { passive: false });
      leftBtn.addEventListener('touchend', handleLeftEnd, { passive: false });
      leftBtn.addEventListener('touchcancel', handleLeftEnd, { passive: false });
    }

    if (rightBtn) {
      rightBtn.addEventListener('touchstart', handleRightStart, { passive: false });
      rightBtn.addEventListener('touchend', handleRightEnd, { passive: false });
      rightBtn.addEventListener('touchcancel', handleRightEnd, { passive: false });
    }

    if (jumpBtn) {
      jumpBtn.addEventListener('touchstart', handleJumpStart, { passive: false });
      jumpBtn.addEventListener('touchend', handleJumpEnd, { passive: false });
      jumpBtn.addEventListener('touchcancel', handleJumpEnd, { passive: false });
    }

    return () => {
      if (leftBtn) {
        leftBtn.removeEventListener('touchstart', handleLeftStart);
        leftBtn.removeEventListener('touchend', handleLeftEnd);
        leftBtn.removeEventListener('touchcancel', handleLeftEnd);
      }
      if (rightBtn) {
        rightBtn.removeEventListener('touchstart', handleRightStart);
        rightBtn.removeEventListener('touchend', handleRightEnd);
        rightBtn.removeEventListener('touchcancel', handleRightEnd);
      }
      if (jumpBtn) {
        jumpBtn.removeEventListener('touchstart', handleJumpStart);
        jumpBtn.removeEventListener('touchend', handleJumpEnd);
        jumpBtn.removeEventListener('touchcancel', handleJumpEnd);
      }
    };
  }, [onMoveLeft, onMoveRight, onStopMove, onJump, onStopJump]);

  return (
    <div className="touch-controls">
      <div className="touch-controls-left">
        <div ref={leftButtonRef} className="touch-btn touch-btn-left" aria-label="Move Left">
          <span>←</span>
        </div>
        <div ref={rightButtonRef} className="touch-btn touch-btn-right" aria-label="Move Right">
          <span>→</span>
        </div>
      </div>
      <div className="touch-controls-right">
        <div ref={jumpButtonRef} className="touch-btn touch-btn-jump" aria-label="Jump">
          <span>↑</span>
        </div>
      </div>
    </div>
  );
}
