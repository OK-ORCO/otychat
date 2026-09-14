import { useState } from 'react';

// Playful color palette matching the app's aesthetic
const COLOR_PALETTE = [
  // Row 1 - Pinks & Purples
  { color: '#ec4899', name: 'Pink' },
  { color: '#f472b6', name: 'Rose' },
  { color: '#c084fc', name: 'Violet' },
  { color: '#8b5cf6', name: 'Purple' },
  // Row 2 - Blues & Cyans
  { color: '#3b82f6', name: 'Blue' },
  { color: '#06b6d4', name: 'Cyan' },
  { color: '#22d3ee', name: 'Sky' },
  { color: '#14b8a6', name: 'Teal' },
  // Row 3 - Greens & Yellows
  { color: '#10b981', name: 'Emerald' },
  { color: '#84cc16', name: 'Lime' },
  { color: '#eab308', name: 'Yellow' },
  { color: '#f59e0b', name: 'Amber' },
  // Row 4 - Oranges & Reds
  { color: '#f97316', name: 'Orange' },
  { color: '#ef4444', name: 'Red' },
  { color: '#64748b', name: 'Slate' },
  { color: '#1a1a2e', name: 'Dark' },
];

interface ColorPickerProps {
  onBack: () => void;
  onSelect: (color: string) => void;
  currentColor?: string;
}

export default function ColorPicker({ onBack, onSelect, currentColor = '#ec4899' }: ColorPickerProps) {
  const [selectedColor, setSelectedColor] = useState(currentColor);

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <div className="p-4 flex items-center gap-3" style={{
        background: `linear-gradient(135deg, ${selectedColor} 0%, ${adjustBrightness(selectedColor, -20)} 100%)`,
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
        transition: 'background 0.3s ease'
      }}>
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl transition-all transform hover:scale-110"
          style={{
            background: 'rgba(255, 255, 255, 0.2)',
            color: 'white',
            border: 'none'
          }}
        >
          <span style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }}>&#8592;</span>
        </button>
        <h2 style={{
          fontFamily: 'Fredoka, sans-serif',
          fontSize: '18px',
          color: 'white',
          fontWeight: '700',
          textShadow: '0 1px 3px rgba(0,0,0,0.2)'
        }}>
          Pick Your Color
        </h2>
      </div>

      <div className="p-4 space-y-4">
        {/* Preview */}
        <section>
          <div className="p-5 rounded-3xl" style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)'
          }}>
            <h3 className="mb-3" style={{
              fontFamily: 'Fredoka, sans-serif',
              fontSize: '16px',
              color: 'var(--text)',
              fontWeight: '700'
            }}>
              Preview
            </h3>

            {/* Name preview */}
            <div className="p-4 rounded-2xl mb-4" style={{
              background: 'var(--bg-secondary)'
            }}>
              <p style={{
                fontFamily: 'Fredoka, sans-serif',
                fontSize: '20px',
                fontWeight: '700',
                color: selectedColor,
                textShadow: `0 0 20px ${selectedColor}40`
              }}>
                Your Name
              </p>
              <p style={{
                fontSize: '13px',
                color: 'var(--text-muted)',
                marginTop: '4px'
              }}>
                How your name appears in chat
              </p>
            </div>

            {/* Emoji bubble preview */}
            <div className="flex items-center gap-3">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-3xl"
                style={{
                  background: `linear-gradient(135deg, ${selectedColor}30 0%, ${selectedColor}10 100%)`,
                  border: `3px solid ${selectedColor}`,
                  boxShadow: `0 0 20px ${selectedColor}40`
                }}
              >
                <span>&#128640;</span>
              </div>
              <p style={{
                fontSize: '13px',
                color: 'var(--text-muted)'
              }}>
                Your emojis will have this colored glow
              </p>
            </div>
          </div>
        </section>

        {/* Color Grid */}
        <section>
          <div className="p-5 rounded-3xl" style={{
            background: 'white',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)'
          }}>
            <h3 className="mb-4" style={{
              fontFamily: 'Fredoka, sans-serif',
              fontSize: '16px',
              color: 'var(--text)',
              fontWeight: '700'
            }}>
              Choose a Color
            </h3>

            <div className="grid grid-cols-4 gap-3">
              {COLOR_PALETTE.map(({ color, name }) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className="aspect-square rounded-2xl transition-all transform hover:scale-105 active:scale-95"
                  style={{
                    background: color,
                    border: selectedColor === color ? '4px solid #1a1a2e' : '4px solid transparent',
                    boxShadow: selectedColor === color
                      ? `0 0 20px ${color}60, 0 4px 12px rgba(0,0,0,0.2)`
                      : '0 2px 8px rgba(0,0,0,0.1)',
                    position: 'relative'
                  }}
                  title={name}
                >
                  {selectedColor === color && (
                    <div
                      className="absolute inset-0 flex items-center justify-center text-white text-xl font-bold"
                      style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}
                    >
                      <span>&#10003;</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Save Button */}
        <button
          onClick={() => onSelect(selectedColor)}
          className="w-full py-4 rounded-2xl transition-all transform hover:scale-102 active:scale-98"
          style={{
            background: `linear-gradient(135deg, ${selectedColor} 0%, ${adjustBrightness(selectedColor, -20)} 100%)`,
            color: 'white',
            fontFamily: 'Fredoka, sans-serif',
            fontSize: '16px',
            fontWeight: '700',
            border: 'none',
            boxShadow: `0 4px 16px ${selectedColor}40`
          }}
        >
          Save Color
        </button>
      </div>
    </div>
  );
}

// Helper function to adjust color brightness
function adjustBrightness(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max(0, Math.min(255, (num >> 16) + amt));
  const G = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amt));
  const B = Math.max(0, Math.min(255, (num & 0x0000FF) + amt));
  return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
}
