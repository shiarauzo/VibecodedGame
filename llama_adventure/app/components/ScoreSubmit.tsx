'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { calculatePoints } from '@/lib/score';
import { getStoredUserData } from '@/lib/fingerprint';

interface ScoreSubmitProps {
  levelName: string;
  completionTime: number;
  onViewLeaderboard: () => void;
}

async function submitScore(
  userId: string,
  levelName: string,
  completionTime: number
) {
  const points = calculatePoints(completionTime, levelName);
  const response = await fetch('/api/scores', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userId,
      levelName,
      completionTime,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to submit score');
  }

  return response.json();
}

export function ScoreSubmit({
  levelName,
  completionTime,
  onViewLeaderboard,
}: ScoreSubmitProps) {
  const queryClient = useQueryClient();
  const [userData, setUserData] = useState<{ userId: string; avatarId: number } | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const points = calculatePoints(completionTime, levelName);

  useEffect(() => {
    setIsHydrated(true);
    setUserData(getStoredUserData());
  }, []);

  const mutation = useMutation({
    mutationFn: () => {
      const currentUserData = userData || getStoredUserData();
      if (!currentUserData) {
        throw new Error('User not found');
      }
      return submitScore(currentUserData.userId, levelName, completionTime);
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['leaderboard'] });
      const previousLeaderboard = queryClient.getQueryData(['leaderboard']);
      const currentUserData = userData || getStoredUserData();

      queryClient.setQueryData(['leaderboard'], (old: any) => {
        if (!old || !currentUserData) return old;
        const newEntry = {
          rank: 0,
          id: 'temp',
          userId: currentUserData.userId,
          levelName,
          completionTime,
          points,
          createdAt: new Date().toISOString(),
          avatarId: currentUserData.avatarId,
        };
        return {
          ...old,
          leaderboard: [newEntry, ...(old.leaderboard || [])]
            .sort((a: any, b: any) => {
              if (b.points !== a.points) return b.points - a.points;
              return a.completionTime - b.completionTime;
            })
            .slice(0, 50)
            .map((entry: any, index: number) => ({
              ...entry,
              rank: index + 1,
            })),
        };
      });

      return { previousLeaderboard };
    },
    onError: (err, variables, context) => {
      if (context?.previousLeaderboard) {
        queryClient.setQueryData(['leaderboard'], context.previousLeaderboard);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
    },
  });

  const handleSubmit = () => {
    mutation.mutate();
  };

  return (
    <div className="score-submit">
      <div className="score-stats">
        <p className="score-label">TIEMPO:</p>
        <p className="score-value">{completionTime.toFixed(2)}s</p>
        <p className="score-label">PUNTOS:</p>
        <p className="score-value">{points.toLocaleString()}</p>
      </div>
      {mutation.isSuccess ? (
        <div className="score-success">
          <p>¡Puntuación guardada!</p>
          <p style={{ fontSize: '10px', marginTop: '5px' }}>
            {points > 0 ? '¡Eres el primero en la clasificación!' : ''}
          </p>
          <button className="btn-pixel" onClick={onViewLeaderboard}>
            VER CLASIFICACIÓN
          </button>
        </div>
      ) : mutation.isError ? (
        <div className="score-error">
          <p>Error al guardar puntuación</p>
          <p style={{ fontSize: '10px', marginTop: '5px', color: '#aaa' }}>
            Puedes seguir jugando, pero la puntuación no se guardará
          </p>
          <button className="btn-pixel" onClick={handleSubmit}>
            REINTENTAR
          </button>
        </div>
      ) : (
        <button
          className="btn-pixel"
          onClick={handleSubmit}
          disabled={mutation.isPending || !isHydrated || !userData}
        >
          {mutation.isPending ? 'GUARDANDO...' : 'GUARDAR PUNTUACIÓN'}
        </button>
      )}
    </div>
  );
}
