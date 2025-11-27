import { nanoid } from 'nanoid';
import { getFingerprint, storeUserId, getStoredUserData } from './fingerprint';

export interface UserData {
  id: string;
  avatarId: number;
}

export function assignRandomAvatar(): number {
  return Math.floor(Math.random() * 8) + 1;
}

export async function getOrCreateUser(): Promise<UserData> {
  const stored = getStoredUserData();
  if (stored) {
    return { id: stored.userId, avatarId: stored.avatarId };
  }

  const fingerprint = await getFingerprint();
  const avatarId = assignRandomAvatar();

  try {
    const response = await fetch('/api/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fingerprintHash: fingerprint.hash,
        avatarId,
      }),
    });

    if (!response.ok) {
      let errorData: any = {};
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = { error: 'Failed to parse error response' };
        }
      } else {
        const text = await response.text().catch(() => 'Unknown error');
        errorData = { error: text || response.statusText || 'Unknown error' };
      }
      
      console.error('API Error:', {
        status: response.status,
        statusText: response.statusText,
        errorData,
        url: response.url
      });
      
      const errorMessage = errorData.error || errorData.message || response.statusText || 'Failed to create user';
      throw new Error(`Failed to create user: ${errorMessage} (Status: ${response.status})`);
    }

    const user = await response.json();
    storeUserId(user.id, user.avatarId);
    return { id: user.id, avatarId: user.avatarId };
  } catch (error) {
    console.error('Error creating user:', error);
    const fallbackId = nanoid();
    storeUserId(fallbackId, avatarId);
    return { id: fallbackId, avatarId };
  }
}
