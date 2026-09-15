import { useState, useEffect } from 'react';
import {
  CUSTOM_EMOJI_IDS,
  UNICODE_EMOJIS,
  getEmojiUrl,
  loadFavorites,
  saveFavorites,
} from '../data/emoji-data';
import { Key, Window, Scrim } from './ds';

interface EmojiPickerProps {
  onSelect: (emoji: string, isCustom: boolean) => void;
}

type Category = 'custom' | 'faces' | 'gestures' | 'hearts' | 'animals' | 'food' | 'activities' | 'objects' | 'symbols';

const CATEGORY_NAMES: Record<Category, string> = {
  custom: 'Fellas',
  faces: 'Faces',
  gestures: 'Hands',
  hearts: 'Hearts',
  animals: 'Animals',
  food: 'Food',
  activities: 'Games',
  objects: 'Things',
  symbols: 'Symbols',
};

const isCustom = (emoji: string) => /^\d+$/.test(emoji);

const renderEmoji = (emoji: string, px: number) => (
  isCustom(emoji)
    ? <img src={getEmojiUrl(emoji)} alt="" style={{ width: px, height: px, objectFit: 'contain' }} />
    : <span style={{ fontSize: px * 0.8, lineHeight: 1 }}>{emoji}</span>
);

interface EmojiWindowProps {
  onSelect: (emoji: string, isCustom: boolean) => void;
  onClose: () => void;
  title?: string;
  /** Fires when the favourites strip is edited inside the window. */
  onFavoritesChange?: (favorites: string[]) => void;
}

/**
 * The full picker as a window over a scrim: category keys and a 7-column grid,
 * with an edit mode that picks the seven favourites for the reaction strip.
 */
export function EmojiWindow({ onSelect, onClose, title = 'Emoji', onFavoritesChange }: EmojiWindowProps) {
  const [favorites, setFavorites] = useState<string[]>(() => loadFavorites());
  const [activeCategory, setActiveCategory] = useState<Category>('custom');
  const [editMode, setEditMode] = useState(false);

  const handleEmojiClick = (emoji: string) => {
    if (editMode) {
      const next = favorites.includes(emoji)
        ? favorites.filter(f => f !== emoji)
        : [...favorites.slice(0, 6), emoji];
      setFavorites(next);
      saveFavorites(next);
      onFavoritesChange?.(next);
    } else {
      onSelect(emoji, isCustom(emoji));
    }
  };

  return (
    <Scrim onClose={onClose}>
      <Window
        pad={false}
        title={editMode ? 'Pick your 7 favourites' : title}
        right={
          <span style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => setEditMode(!editMode)} style={{ background: 'none', border: 0, color: '#fff', fontSize: 12, textDecoration: 'underline' }}>
              {editMode ? 'done' : 'edit favourites'}
            </button>
            <button onClick={onClose} style={{ background: 'none', border: 0, color: '#fff', fontSize: 14 }}>✕</button>
          </span>
        }
      >
        <div style={{ display: 'flex', gap: 4, padding: 6, overflowX: 'auto', borderBottom: '1px dashed #c5ccd6', scrollbarWidth: 'none' }}>
          {(Object.keys(CATEGORY_NAMES) as Category[]).map(cat => (
            <Key key={cat} on={activeCategory === cat} onClick={() => setActiveCategory(cat)} style={{ minHeight: 28, fontSize: 12, padding: '0 8px', flex: 'none' }}>
              {CATEGORY_NAMES[cat]}
            </Key>
          ))}
        </div>

        <div className="ds-scroll" style={{ maxHeight: 260, padding: 6 }}>
          {editMode && (
            <div className="ds-small ds-muted" style={{ padding: '2px 4px 6px' }}>
              Tap to add or remove. Seven fit on the strip.
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
            {(activeCategory === 'custom' ? CUSTOM_EMOJI_IDS : UNICODE_EMOJIS[activeCategory]).map((emoji, i) => {
              const fav = favorites.includes(emoji);
              return (
                <button
                  key={`${activeCategory}-${i}`}
                  onClick={() => handleEmojiClick(emoji)}
                  className={`ds-key sq ${editMode && fav ? 'warn' : 'paper'}`}
                  style={{ width: '100%', height: 40 }}
                >
                  {renderEmoji(emoji, 26)}
                </button>
              );
            })}
          </div>
        </div>
      </Window>
    </Scrim>
  );
}

/**
 * Reaction strip: seven favourite slots plus a "more" key that opens the full
 * picker as a window. Emoji are content here, so they stay emoji.
 */
export default function EmojiPicker({ onSelect }: EmojiPickerProps) {
  const [showFullPicker, setShowFullPicker] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    setFavorites(loadFavorites());
  }, []);

  const slot = (emoji: string, i: number) => (
    <button
      key={`${emoji}-${i}`}
      onClick={() => onSelect(emoji, isCustom(emoji))}
      className="ds-key sq paper"
      style={{ width: 32, height: 32, flex: 'none' }}
    >
      {renderEmoji(emoji, 22)}
    </button>
  );

  return (
    <>
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 4, overflowX: 'auto', flex: 1, minWidth: 0, scrollbarWidth: 'none' }}>
          {favorites.map(slot)}
        </div>
        <Key sq onClick={() => setShowFullPicker(true)} icon="dots" title="All emoji" style={{ width: 32, height: 32, flex: 'none' }} />
      </div>

      {showFullPicker && (
        <EmojiWindow
          onSelect={(emoji, custom) => { onSelect(emoji, custom); setShowFullPicker(false); }}
          onClose={() => setShowFullPicker(false)}
          onFavoritesChange={setFavorites}
        />
      )}
    </>
  );
}
