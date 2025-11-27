'use client';

import { useState, useEffect } from 'react';
import Game from './game/Game';
import { UserSetup } from './components/UserSetup';
import { Leaderboard } from './components/Leaderboard';
import { getStoredUserData } from '@/lib/fingerprint';

export default function Home() {
  const [userReady, setUserReady] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>();
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showUserSetup, setShowUserSetup] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
    const userData = getStoredUserData();
    if (userData) {
      setUserReady(true);
      setCurrentUserId(userData.userId);
      setShowUserSetup(false);
    } else {
      setShowUserSetup(true);
    }
  }, []);

  const handleUserComplete = (userId: string) => {
    setUserReady(true);
    setCurrentUserId(userId);
    setShowUserSetup(false);
  };

  if (!isHydrated) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <p>Cargando...</p>
      </div>
    );
  }

  if (showUserSetup) {
    return <UserSetup onComplete={handleUserComplete} />;
  }

  return (
    <div>
      {showLeaderboard && userReady ? (
        <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
          <Leaderboard currentUserId={currentUserId} />
          <button
            className="btn-pixel"
            onClick={() => setShowLeaderboard(false)}
            style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 1001 }}
          >
            CERRAR
          </button>
        </div>
      ) : (
        <Game
          onShowLeaderboard={() => setShowLeaderboard(true)}
          currentUserId={currentUserId}
        />
      )}
    </div>
  );
}
