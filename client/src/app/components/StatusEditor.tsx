import { useState } from 'react';
import { Bar, Window, Key, Icon } from './ds';

interface StatusEditorProps {
  onBack: () => void;
  onStatusChange: (status: string) => void;
  currentStatus?: string;
}

const PRESET_STATUSES = [
  '🎉 Partying',
  '🍻 Drinking',
  '🎮 Gaming',
  '😴 Tired',
  '🔥 Vibing',
  '💯 Feeling good',
  '👀 Lurking',
  '🤔 Thinking',
  '💪 Pumped up',
  '😎 Chilling',
  '🎵 Listening to music',
  '🍕 Hungry',
  '☕ Need coffee',
  '📱 Online',
  '🚀 Ready to go',
  '💤 Sleepy'
];

const MAX = 50;

export default function StatusEditor({ onBack, onStatusChange, currentStatus = '' }: StatusEditorProps) {
  const [status, setStatus] = useState(currentStatus);

  const handleSave = () => {
    onStatusChange(status);
    onBack();
  };

  const handleClear = () => {
    setStatus('');
    onStatusChange('');
    onBack();
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Bar
        left={<button onClick={onBack} title="Back"><Icon name="back" size={16} /></button>}
        title="Status"
      />
      <div className="ds-lcd ds-scroll" style={{ flex: 1, minHeight: 0, padding: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Window title="Write one">
          <textarea
            className="ds-field"
            value={status}
            onChange={(e) => setStatus(e.target.value.slice(0, MAX))}
            placeholder="What is happening?"
            maxLength={MAX}
            rows={2}
          />
          <div className="ds-small ds-muted" style={{ textAlign: 'right', marginTop: 4 }}>{status.length} / {MAX}</div>
        </Window>

        <Window title="Or pick one">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {PRESET_STATUSES.map((preset) => (
              <Key key={preset} kind="paper" on={status === preset} onClick={() => setStatus(preset)} style={{ minHeight: 30, fontSize: 13 }}>
                {preset}
              </Key>
            ))}
          </div>
        </Window>

        <Key kind="primary" big wide icon="check" onClick={handleSave}>Save</Key>
        {status && <Key wide kind="danger" icon="trash" onClick={handleClear}>Clear status</Key>}
      </div>
    </div>
  );
}
