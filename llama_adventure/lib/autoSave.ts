import { getStoredUserData } from './fingerprint';
import { calculatePoints } from './score';
import { QueryClient } from '@tanstack/react-query';

export interface AutoSaveScoreParams {
  levelName: string;
  completionTime: number;
  won: boolean;
  queryClient?: QueryClient;
}

async function submitScore(
  userId: string,
  levelName: string,
  completionTime: number,
  won: boolean
) {
  const response = await fetch('/api/scores', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userId,
      levelName: levelName.trim(),
      completionTime: Number(completionTime),
      won: won === true,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(errorText);
  }

  return response.json();
}

export async function autoSaveScore({ 
  levelName, 
  completionTime, 
  won,
  queryClient 
}: AutoSaveScoreParams): Promise<void> {
  try {
    const userData = getStoredUserData();
    if (!userData || !userData.userId) {
      console.warn('No user data found, skipping auto-save');
      return;
    }

    // Validate required parameters
    if (!levelName || levelName.trim().length === 0) {
      console.warn('Invalid levelName, skipping auto-save:', levelName);
      return;
    }

    if (completionTime === undefined || completionTime === null || isNaN(completionTime) || completionTime < 0) {
      console.warn('Invalid completionTime, skipping auto-save:', completionTime);
      return;
    }

    const points = calculatePoints(completionTime, levelName);

    // If queryClient is provided, use optimistic updates
    if (queryClient) {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['leaderboard'] });
      
      // Snapshot the previous value for all leaderboard queries (general and per-level)
      const previousLeaderboard = queryClient.getQueryData(['leaderboard', null]);
      const previousLevelLeaderboard = queryClient.getQueryData(['leaderboard', levelName.trim()]);

      // Helper function to update leaderboard
      const updateLeaderboard = (old: any) => {
        if (!old) {
          // If no cached data, create a new structure
          return {
            leaderboard: [],
            limit: 50,
            offset: 0,
            hasMore: false,
          };
        }
        
        const newEntry = {
          rank: 0,
          id: 'temp-' + Date.now(),
          userId: userData.userId,
          levelName: levelName.trim(),
          completionTime: Number(completionTime),
          points: won ? points : 0,
          createdAt: new Date().toISOString(),
          avatarId: userData.avatarId || 1,
          userName: null,
        };

        const updatedLeaderboard = [newEntry, ...(old.leaderboard || [])]
          .filter((entry: any) => {
            // Remove any existing temp entries for this user/level
            if (entry.id?.startsWith('temp-') && entry.userId === userData.userId && entry.levelName === levelName.trim()) {
              return false;
            }
            return true;
          })
          .sort((a: any, b: any) => {
            if (b.points !== a.points) return b.points - a.points;
            return a.completionTime - b.completionTime;
          })
          .slice(0, 50)
          .map((entry: any, index: number) => ({
            ...entry,
            rank: index + 1,
          }));

        return {
          ...old,
          leaderboard: updatedLeaderboard,
        };
      };

      // Optimistically update both general and level-specific leaderboards
      queryClient.setQueryData(['leaderboard', null], updateLeaderboard);
      queryClient.setQueryData(['leaderboard', levelName.trim()], updateLeaderboard);

      // Perform the actual mutation in the background
      submitScore(userData.userId, levelName, completionTime, won)
        .then(() => {
          // Invalidate to refetch and get the real data
          queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
          console.log('Score auto-saved successfully', { won, points });
        })
        .catch((error) => {
          // On error, rollback to previous state
          if (previousLeaderboard) {
            queryClient.setQueryData(['leaderboard', null], previousLeaderboard);
          }
          if (previousLevelLeaderboard) {
            queryClient.setQueryData(['leaderboard', levelName.trim()], previousLevelLeaderboard);
          }
          console.error('Failed to auto-save score:', error);
        });
    } else {
      // Fallback: just do the fetch without optimistic updates
      const result = await submitScore(userData.userId, levelName, completionTime, won);
      console.log('Score auto-saved successfully', { won, points: result.points });
    }
  } catch (error) {
    console.error('Error auto-saving score:', error);
    // Don't throw - auto-save failures shouldn't break the game
  }
}

