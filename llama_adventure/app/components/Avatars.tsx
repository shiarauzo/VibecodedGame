'use client';

import React from 'react';

interface AvatarProps {
  avatarId: number;
  size?: number;
  selected?: boolean;
  onClick?: () => void;
}

export function Avatar({ avatarId, size = 32, selected = false, onClick }: AvatarProps) {
  const avatar = getAvatarSVG(avatarId, size);
  
  return (
    <div
      className={`avatar-container ${selected ? 'selected' : ''}`}
      onClick={onClick}
      style={{
        width: size,
        height: size,
        cursor: onClick ? 'pointer' : 'default',
        border: selected ? '3px solid #FFD700' : '2px solid #CD853F',
        boxShadow: selected ? '0 0 10px #FFD700' : 'none',
        imageRendering: 'pixelated',
      }}
      dangerouslySetInnerHTML={{ __html: avatar }}
    />
  );
}

function getAvatarSVG(avatarId: number, size: number): string {
  const avatars: Record<number, string> = {
    1: `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" fill="#FFD700"/>
      <circle cx="${size/2}" cy="${size/3}" r="${size/6}" fill="#8B4513"/>
      <rect x="${size/4}" y="${size/2}" width="${size/2}" height="${size/3}" fill="#CD853F"/>
    </svg>`,
    2: `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" fill="#FFA500"/>
      <rect x="${size/4}" y="${size/4}" width="${size/2}" height="${size/2}" fill="#8B4513"/>
      <circle cx="${size/3}" cy="${size/3}" r="${size/12}" fill="#000"/>
      <circle cx="${2*size/3}" cy="${size/3}" r="${size/12}" fill="#000"/>
    </svg>`,
    3: `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" fill="#FFD700"/>
      <polygon points="${size/2},${size/4} ${size/3},${size/2} ${2*size/3},${size/2}" fill="#8B4513"/>
      <rect x="${size/3}" y="${size/2}" width="${size/3}" height="${size/2}" fill="#CD853F"/>
    </svg>`,
    4: `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" fill="#FFA500"/>
      <circle cx="${size/2}" cy="${size/3}" r="${size/5}" fill="#8B4513"/>
      <rect x="${size/3}" y="${size/2}" width="${size/3}" height="${size/2}" fill="#CD853F"/>
      <rect x="${size/4}" y="${size/2}" width="${size/2}" height="${size/8}" fill="#654321"/>
    </svg>`,
    5: `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" fill="#FFD700"/>
      <rect x="${size/4}" y="${size/4}" width="${size/2}" height="${size/2}" fill="#8B4513"/>
      <circle cx="${size/3}" cy="${size/3}" r="${size/16}" fill="#FFF"/>
      <circle cx="${2*size/3}" cy="${size/3}" r="${size/16}" fill="#FFF"/>
      <rect x="${size/3}" y="${size/2}" width="${size/3}" height="${size/8}" fill="#654321"/>
    </svg>`,
    6: `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" fill="#FFA500"/>
      <polygon points="${size/2},${size/5} ${size/4},${size/2} ${3*size/4},${size/2}" fill="#8B4513"/>
      <rect x="${size/4}" y="${size/2}" width="${size/2}" height="${size/2}" fill="#CD853F"/>
      <circle cx="${size/2}" cy="${size/3}" r="${size/20}" fill="#000"/>
    </svg>`,
    7: `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" fill="#FFD700"/>
      <circle cx="${size/2}" cy="${size/3}" r="${size/4}" fill="#8B4513"/>
      <rect x="${size/3}" y="${size/2}" width="${size/3}" height="${size/2}" fill="#CD853F"/>
      <rect x="${size/4}" y="${size/2}" width="${size/2}" height="${size/10}" fill="#654321"/>
    </svg>`,
    8: `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" fill="#FFA500"/>
      <rect x="${size/3}" y="${size/4}" width="${size/3}" height="${size/2}" fill="#8B4513"/>
      <circle cx="${size/3}" cy="${size/3}" r="${size/20}" fill="#FFF"/>
      <circle cx="${2*size/3}" cy="${size/3}" r="${size/20}" fill="#FFF"/>
      <rect x="${size/4}" y="${size/2}" width="${size/2}" height="${size/2}" fill="#CD853F"/>
    </svg>`,
  };

  return avatars[avatarId] || avatars[1];
}

export function AvatarGrid({ selectedId, onSelect, size = 40 }: { selectedId?: number; onSelect: (id: number) => void; size?: number }) {
  return (
    <div className="avatar-grid">
      {[1, 2, 3, 4, 5, 6, 7, 8].map((id) => (
        <Avatar
          key={id}
          avatarId={id}
          size={size}
          selected={selectedId === id}
          onClick={() => onSelect(id)}
        />
      ))}
    </div>
  );
}
