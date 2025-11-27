'use client';

import { useEffect, useState } from 'react';
import { nanoid } from 'nanoid';
import { getOrCreateUser, assignRandomAvatar } from '@/lib/user';
import { AvatarGrid } from './Avatars';
import { storeUserId, getFingerprint, getStoredUserData } from '@/lib/fingerprint';

interface UserSetupProps {
  onComplete: (userId: string, avatarId: number) => void;
}

export function UserSetup({ onComplete }: UserSetupProps) {
  const [selectedAvatar, setSelectedAvatar] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [userName, setUserName] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);

  useEffect(() => {
    const initializeUser = async () => {
      try {
        const user = await getOrCreateUser();
        setSelectedAvatar(user.avatarId);
        setIsLoading(false);
        // Auto-complete immediately with random avatar
        // Don't wait for name input - it's optional
        onComplete(user.id, user.avatarId);
      } catch (error) {
        console.error('Error initializing user:', error);
        try {
          const fingerprint = await getFingerprint();
          const fallbackAvatar = assignRandomAvatar();
          const fallbackId = nanoid();
          storeUserId(fallbackId, fallbackAvatar);
          setSelectedAvatar(fallbackAvatar);
          setIsLoading(false);
          onComplete(fallbackId, fallbackAvatar);
        } catch (fallbackError) {
          console.error('Fallback user creation failed:', fallbackError);
          const fallbackAvatar = assignRandomAvatar();
          const fallbackId = nanoid();
          storeUserId(fallbackId, fallbackAvatar);
          setSelectedAvatar(fallbackAvatar);
          setIsLoading(false);
          onComplete(fallbackId, fallbackAvatar);
        }
      }
    };

    initializeUser();
  }, [onComplete]);

  const handleSaveName = async () => {
    if (!userName.trim()) return;
    
    try {
      const userData = getStoredUserData();
      if (!userData) return;

      const response = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userData.userId,
          name: userName.trim(),
        }),
      });

      if (response.ok) {
        setShowNameInput(false);
      }
    } catch (error) {
      console.error('Error saving name:', error);
    }
  };

  const handleAvatarSelect = (avatarId: number) => {
    setSelectedAvatar(avatarId);
  };

  const handleStart = async () => {
    if (!selectedAvatar) return;

    setIsCreating(true);
    try {
      const fingerprint = await getFingerprint();
      const user = await getOrCreateUser();
      if (selectedAvatar !== user.avatarId) {
        const response = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fingerprintHash: fingerprint.hash,
            avatarId: selectedAvatar,
          }),
        });
        if (response.ok) {
          const updatedUser = await response.json();
          storeUserId(updatedUser.id, updatedUser.avatarId);
          onComplete(updatedUser.id, updatedUser.avatarId);
        } else {
          onComplete(user.id, user.avatarId);
        }
      } else {
        onComplete(user.id, user.avatarId);
      }
    } catch (error) {
      console.error('Error updating avatar:', error);
      const user = await getOrCreateUser();
      onComplete(user.id, user.avatarId);
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="user-setup-overlay">
        <div className="modal-content">
          <p>Cargando...</p>
        </div>
      </div>
    );
  }

  if (!selectedAvatar) {
    return (
      <div className="user-setup-overlay">
        <div className="modal-content">
          <p>Preparando avatar...</p>
        </div>
      </div>
    );
  }

  // Component auto-completes, so this shouldn't normally render
  // But keeping it as fallback
  return null;
}
