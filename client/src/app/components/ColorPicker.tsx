import { useState } from 'react';
import { useSocket } from '../../contexts/SocketContext';
import { Bar, Window, Key, Icon } from './ds';

export const COLOR_PALETTE = [
  { color: '#ec4899', name: 'Pink' },
  { color: '#f472b6', name: 'Rose' },
  { color: '#c084fc', name: 'Violet' },
  { color: '#8b5cf6', name: 'Purple' },
  { color: '#3b82f6', name: 'Blue' },
  { color: '#06b6d4', name: 'Cyan' },
  { color: '#22d3ee', name: 'Sky' },
  { color: '#14b8a6', name: 'Teal' },
  { color: '#10b981', name: 'Emerald' },
  { color: '#84cc16', name: 'Lime' },
  { color: '#eab308', name: 'Yellow' },
  { color: '#f59e0b', name: 'Amber' },
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
  const { user } = useSocket();
  const [selectedColor, setSelectedColor] = useState(currentColor);
  const name = user?.odName || 'Your name';

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Bar
        left={<button onClick={onBack} title="Back"><Icon name="back" size={16} /></button>}
        title="Name colour"
      />
      <div className="ds-lcd ds-scroll" style={{ flex: 1, minHeight: 0, padding: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Window title="Preview">
          <div style={{ fontSize: 20, color: selectedColor }}>{name}</div>
          <div className="ds-small ds-muted" style={{ marginTop: 2 }}>This is your pen colour. Your name and notes use it.</div>
        </Window>

        <Window title="Pick one">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, justifyItems: 'center' }}>
            {COLOR_PALETTE.map(({ color, name: label }) => (
              <button
                key={color}
                type="button"
                className={`ds-swatch ${selectedColor === color ? 'on' : ''}`}
                style={{ background: color, width: 44, height: 44 }}
                onClick={() => setSelectedColor(color)}
                title={label}
              />
            ))}
          </div>
        </Window>

        <Key kind="primary" big wide onClick={() => onSelect(selectedColor)}>Save</Key>
      </div>
    </div>
  );
}
