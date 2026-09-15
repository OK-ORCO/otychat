import { useState } from 'react';
import { Bar, Icon } from './ds';

interface WoWAvatarsProps {
  onBack: () => void;
  onSelect: (sprite: string) => void;
  current?: string;
}

// Local avatars path (files copied to public/avatars/)
const AVATAR_BASE = '/avatars';

// Curated WoW-specific avatar IDs from the Battle.net gallery
const WOW_AVATARS = [
  { id: 661530, label: 'Avatar 1' },
  { id: 661531, label: 'Avatar 2' },
  { id: 661532, label: 'Avatar 3' },
  { id: 661533, label: 'Avatar 4' },
  { id: 661535, label: 'Avatar 5' },
  { id: 661536, label: 'Avatar 6' },
  { id: 661537, label: 'Avatar 7' },
  { id: 661538, label: 'Avatar 8' },
  { id: 661539, label: 'Avatar 9' },
  { id: 661540, label: 'Avatar 10' },
  { id: 661541, label: 'Avatar 11' },
  { id: 661542, label: 'Avatar 12' },
  { id: 661543, label: 'Avatar 13' },
  { id: 661544, label: 'Avatar 14' },
  { id: 661545, label: 'Avatar 15' },
  { id: 661546, label: 'Avatar 16' },
  { id: 661547, label: 'Avatar 17' },
  { id: 661548, label: 'Avatar 18' },
  { id: 661549, label: 'Avatar 19' },
  { id: 661550, label: 'Avatar 20' },
];

export default function WoWAvatars({ onBack, onSelect, current }: WoWAvatarsProps) {
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());
  const [failedImages, setFailedImages] = useState<Set<number>>(new Set());

  const handleImageLoad = (id: number) => {
    setLoadedImages(prev => new Set(prev).add(id));
  };

  const handleImageError = (id: number) => {
    setFailedImages(prev => new Set(prev).add(id));
  };

  const src = (id: number) => `${AVATAR_BASE}/${id}.jpg`;

  const handleSelect = (id: number) => {
    onSelect(src(id));
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Bar
        left={<button onClick={onBack} title="Back"><Icon name="back" size={16} /></button>}
        title="WoW avatars"
      />
      <div className="ds-lcd ds-scroll" style={{ flex: 1, minHeight: 0, padding: 10 }}>
        <div className="ds-small ds-muted" style={{ textAlign: 'center', marginBottom: 8 }}>Tap one to use it as your picture.</div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {WOW_AVATARS.map((avatar) => {
            const hasLoaded = loadedImages.has(avatar.id);
            const hasFailed = failedImages.has(avatar.id);
            const selected = current === src(avatar.id);

            return (
              <button
                key={avatar.id}
                onClick={() => !hasFailed && handleSelect(avatar.id)}
                disabled={hasFailed}
                title={avatar.label}
                style={{
                  aspectRatio: '1',
                  width: '100%',
                  padding: 0,
                  border: '1px solid var(--ds-line)',
                  outline: selected ? '2px solid var(--ds-ink)' : undefined,
                  outlineOffset: selected ? 1 : undefined,
                  background: 'var(--ds-paper)',
                  opacity: hasFailed ? 0.4 : 1,
                  overflow: 'hidden',
                  display: 'block'
                }}
              >
                <img
                  src={src(avatar.id)}
                  alt={avatar.label}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', opacity: hasLoaded ? 1 : 0 }}
                  onLoad={() => handleImageLoad(avatar.id)}
                  onError={() => handleImageError(avatar.id)}
                />
              </button>
            );
          })}
        </div>

        <div className="ds-small ds-faint" style={{ textAlign: 'center', marginTop: 12 }}>
          Avatars from Battle.net / Blizzard Entertainment
        </div>
      </div>
    </div>
  );
}
