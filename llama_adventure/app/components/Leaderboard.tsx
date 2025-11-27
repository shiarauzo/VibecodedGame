'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Avatar } from './Avatars';
import { LEVELS } from '../game/constants';
import { getStoredUserData } from '@/lib/fingerprint';

interface LeaderboardEntry {
  rank: number;
  id: string;
  userId: string;
  levelName: string;
  completionTime: number;
  points: number;
  createdAt: string;
  avatarId: number;
  userName?: string | null;
}

interface LeaderboardData {
  leaderboard: LeaderboardEntry[];
  limit: number;
  offset: number;
  hasMore: boolean;
}

async function fetchLeaderboard(level?: string): Promise<LeaderboardData> {
  const url = level
    ? `/api/scores?level=${encodeURIComponent(level)}&limit=50`
    : `/api/scores?limit=50`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch leaderboard');
  }
  return response.json();
}

export function Leaderboard({ currentUserId }: { currentUserId?: string }) {
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [showNameInput, setShowNameInput] = useState(false);
  const [userName, setUserName] = useState('');
  const queryClient = useQueryClient();

  useEffect(() => {
    const userData = getStoredUserData();
    if (userData && currentUserId === userData.userId) {
      // Check if user already has a name by looking at leaderboard data
      const cachedData = queryClient.getQueryData<LeaderboardData>(['leaderboard', selectedLevel]);
      if (cachedData) {
        const userEntry = cachedData.leaderboard.find(e => e.userId === currentUserId);
        if (userEntry?.userName) {
          setUserName(userEntry.userName);
        }
      }
    }
  }, [currentUserId, selectedLevel, queryClient]);

  const updateNameMutation = useMutation({
    mutationFn: async (name: string) => {
      const userData = getStoredUserData();
      if (!userData) throw new Error('No user data');
      
      const response = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userData.userId,
          name: name.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update name');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
      setShowNameInput(false);
    },
  });

  const { data, isLoading, error } = useQuery<LeaderboardData>({
    queryKey: ['leaderboard', selectedLevel],
    queryFn: () => fetchLeaderboard(selectedLevel || undefined),
    refetchInterval: 10000,
  });

  if (isLoading) {
    return (
      <div className="leaderboard-container">
        <div className="modal-content">
          <p>Cargando clasificación...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="leaderboard-container">
        <div className="modal-content">
          <h1>CLASIFICACIÓN</h1>
          <div className="leaderboard-empty">
            <p>Error al cargar clasificación</p>
            <p style={{ fontSize: '10px', marginTop: '10px', color: '#aaa' }}>
              {error instanceof Error ? error.message : 'Error desconocido'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const hasScores = data && data.leaderboard && data.leaderboard.length > 0;

  const handleSaveName = () => {
    if (userName.trim()) {
      updateNameMutation.mutate(userName.trim());
    }
  };

  return (
    <div className="leaderboard-container">
      <div className="modal-content">
        <h1>CLASIFICACIÓN</h1>
        {currentUserId && (
          <div style={{ marginBottom: '15px', fontSize: '12px' }}>
            {showNameInput ? (
              <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Tu nombre"
                  maxLength={20}
                  style={{
                    padding: '5px 10px',
                    fontSize: '12px',
                    fontFamily: 'inherit',
                    border: '2px solid #333',
                    background: '#fff',
                    color: '#000',
                    flex: 1,
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveName();
                    if (e.key === 'Escape') setShowNameInput(false);
                  }}
                  autoFocus
                />
                <button
                  className="btn-pixel"
                  onClick={handleSaveName}
                  disabled={updateNameMutation.isPending || !userName.trim()}
                  style={{ fontSize: '10px', padding: '5px 10px' }}
                >
                  {updateNameMutation.isPending ? '...' : 'OK'}
                </button>
                <button
                  className="btn-pixel"
                  onClick={() => setShowNameInput(false)}
                  style={{ fontSize: '10px', padding: '5px 10px', background: '#666' }}
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                className="btn-pixel"
                onClick={() => setShowNameInput(true)}
                style={{ fontSize: '10px', padding: '5px 10px', background: '#555' }}
              >
                {userName ? `✏️ ${userName}` : '➕ Agregar nombre'}
              </button>
            )}
          </div>
        )}
        <div className="leaderboard-tabs">
          <button
            className={`leaderboard-tab ${selectedLevel === null ? 'active' : ''}`}
            onClick={() => setSelectedLevel(null)}
          >
            GENERAL
          </button>
          {LEVELS.map((level) => (
            <button
              key={level}
              className={`leaderboard-tab ${selectedLevel === level ? 'active' : ''}`}
              onClick={() => setSelectedLevel(level)}
            >
              {level.split(' ')[0]}
            </button>
          ))}
        </div>
        {!hasScores ? (
          <div className="leaderboard-empty">
            <p>🎮 ¡Sé el primero en jugar!</p>
            <p style={{ fontSize: '10px', marginTop: '10px', color: '#aaa' }}>
              Completa un nivel para aparecer en la clasificación
            </p>
          </div>
        ) : (
          <div className="leaderboard-table">
            <div className="leaderboard-header">
              <div className="leaderboard-col rank">RANK</div>
              <div className="leaderboard-col avatar">AVATAR</div>
              <div className="leaderboard-col player">JUGADOR</div>
              <div className="leaderboard-col time">TIEMPO</div>
              <div className="leaderboard-col points">PUNTOS</div>
            </div>
            {data?.leaderboard.map((entry) => (
              <div
                key={entry.id}
                className={`leaderboard-row ${
                  entry.userId === currentUserId ? 'current-user' : ''
                }`}
              >
                <div className="leaderboard-col rank">#{entry.rank}</div>
                <div className="leaderboard-col avatar">
                  <Avatar avatarId={entry.avatarId} size={24} />
                </div>
                <div className="leaderboard-col player">
                  {entry.userName ? entry.userName : `Jugador #${entry.userId.slice(0, 6)}`}
                </div>
                <div className="leaderboard-col time">
                  {entry.completionTime.toFixed(2)}s
                </div>
                <div className="leaderboard-col points">
                  {entry.points.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
