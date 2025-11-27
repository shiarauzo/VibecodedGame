import FingerprintJS from '@fingerprintjs/fingerprintjs';

const STORAGE_KEY = 'llama_game_fingerprint';
const STORAGE_USER_KEY = 'llama_game_user';

export interface FingerprintData {
  hash: string;
  userAgent: string;
  screenResolution: string;
  timezone: string;
  language: string;
  canvasHash?: string;
}

export async function getFingerprint(): Promise<FingerprintData> {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // Invalid stored data, regenerate
    }
  }

  const fp = await FingerprintJS.load();
  const result = await fp.get();

  const canvasComponent = result.components.canvas;
  const canvasHash = canvasComponent && typeof canvasComponent === 'object' && 'value' in canvasComponent 
    ? String(canvasComponent.value) 
    : undefined;

  const fingerprintData: FingerprintData = {
    hash: result.visitorId,
    userAgent: navigator.userAgent,
    screenResolution: `${window.screen.width}x${window.screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language,
    canvasHash,
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(fingerprintData));
  return fingerprintData;
}

export function getStoredUserId(): string | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(STORAGE_USER_KEY);
  if (stored) {
    try {
      const data = JSON.parse(stored);
      return data.userId || null;
    } catch {
      return null;
    }
  }
  return null;
}

export function storeUserId(userId: string, avatarId: number): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_USER_KEY, JSON.stringify({ userId, avatarId }));
}

export function getStoredUserData(): { userId: string; avatarId: number } | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(STORAGE_USER_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }
  return null;
}
