import { useState } from 'react';
import { useSocket } from '../../contexts/SocketContext';
import { loadPartyCode, savePartyCode } from '../partyCode';
import { Window, Key, Field, Icon, formatTime } from './ds';

/**
 * The room the chat lives in, plus the host's controls for it: rename it, or
 * open a fresh room (wipes chat and queue, resets tonight's drinks). Both need
 * the party code. Used from the Chat tab's room sheet and the Fun tab.
 */
export default function RoomControls({ onDone }: { onDone?: () => void }) {
  const { room, onlineCount, startNewNight, renameRoom } = useSocket();
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState(loadPartyCode);
  const [name, setName] = useState('');
  const [confirmFresh, setConfirmFresh] = useState(false);

  const ready = code.trim().length > 0;

  const rename = () => {
    if (!ready || !name.trim()) return;
    savePartyCode(code.trim());
    renameRoom(code.trim(), name.trim());
    setName('');
    onDone?.();
  };

  const fresh = () => {
    if (!ready) return;
    savePartyCode(code.trim());
    startNewNight(code.trim(), name.trim() || undefined);
    setName('');
    setConfirmFresh(false);
    onDone?.();
  };

  return (
    <Window
      title={<span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Icon name="chat" size={14} />Room</span>}
      right={<span className="ds-small">{onlineCount} here</span>}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: open ? 10 : 0 }}>
        <div style={{ fontSize: 20, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{room.name}</div>
        {room.startedAt && <span className="ds-small ds-muted">open since {formatTime(room.startedAt)}</span>}
      </div>

      {!open ? (
        <Key wide icon="key" onClick={() => setOpen(true)} style={{ marginTop: 10 }}>I am the host</Key>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Field
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Party code"
            autoCapitalize="none"
            autoComplete="off"
          />
          <Field
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Room name"
            maxLength={32}
          />
          <div style={{ display: 'flex', gap: 6 }}>
            <Key style={{ flex: 1 }} icon="edit" onClick={rename} disabled={!ready || !name.trim()}>Rename</Key>
            <Key kind="danger" style={{ flex: 1 }} icon="refresh" onClick={() => setConfirmFresh(true)} disabled={!ready}>Open new room</Key>
          </div>
          {confirmFresh ? (
            <div className="ds-field" style={{ background: 'var(--ds-yellow)', padding: 8, minHeight: 0 }}>
              <div style={{ marginBottom: 6 }}>
                Open {name.trim() ? `"${name.trim()}"` : 'the next room'}? Chat and the queue are wiped and drinks reset. Pokemon, coins and DMs stay.
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <Key style={{ flex: 1 }} onClick={() => setConfirmFresh(false)}>Keep this room</Key>
                <Key kind="danger" style={{ flex: 1 }} onClick={fresh}>Open it</Key>
              </div>
            </div>
          ) : (
            <div className="ds-small ds-muted">
              Rename keeps everything. Open new room starts fresh. Leave the name blank for the next letter.
            </div>
          )}
          <button
            onClick={() => { setOpen(false); setConfirmFresh(false); }}
            className="ds-small ds-muted"
            style={{ background: 'none', border: 0, padding: 0, textDecoration: 'underline', alignSelf: 'flex-start' }}
          >
            hide host controls
          </button>
        </div>
      )}
    </Window>
  );
}
