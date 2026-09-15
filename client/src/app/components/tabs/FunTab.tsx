import { useState, ReactNode } from 'react';
import { useSocket } from '../../../contexts/SocketContext';
import { EmergencyHostStatus } from '../PopcornEmergency';
import PollCard from '../PollCard';
import RoomControls from '../RoomControls';
import { loadPartyCode, savePartyCode } from '../../partyCode';
import { Bar, Window, Key, Field, Row, Note, Icon } from '../ds';

function Title({ icon, children }: { icon: string; children: ReactNode }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <Icon name={icon} size={14} />
      {children}
    </span>
  );
}

function CheckBox({ checked }: { checked: boolean }) {
  return (
    <span
      aria-hidden
      style={{
        width: 16, height: 16, flex: 'none',
        border: '1px solid var(--ds-line)', background: checked ? 'var(--ds-blue)' : 'var(--ds-paper)',
        color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
      }}
    >
      {checked && <Icon name="check" size={12} />}
    </span>
  );
}

export default function FunTab() {
  const { user, onlineUsers, emergency, startEmergency, queueMessages, chatMessages, displayedMessageId, hideFromDisplay, startAwards, awards } = useSocket();
  const [picking, setPicking] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [awardsOpen, setAwardsOpen] = useState(false);
  const [awardsCode, setAwardsCode] = useState(loadPartyCode);

  const others = onlineUsers.filter(u => u.odName !== user?.odName);
  const allSelected = others.length > 0 && others.every(u => selected.has(u.odName));
  const hosting = emergency?.role === 'host';

  const displayed = displayedMessageId
    ? [...queueMessages, ...chatMessages].find(m => m.odId === displayedMessageId)
    : null;

  const toggleAll = () => {
    setSelected(allSelected ? new Set() : new Set(others.map(u => u.odName)));
  };

  const toggle = (name: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name); else next.add(name);
      return next;
    });
  };

  const send = () => {
    if (selected.size === 0) return;
    startEmergency(allSelected ? 'all' : Array.from(selected));
    setPicking(false);
    setSelected(new Set());
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Bar title="Fun" sub="tools for the room" />

      <div className="ds-lcd ds-scroll" style={{ flex: 1, minHeight: 0, padding: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {hosting ? (
          <EmergencyHostStatus />
        ) : (
          <Window title={<Title icon="popcorn">Popcorn Emergency</Title>}>
            <div className="ds-small ds-muted" style={{ marginBottom: 8 }}>
              Need everyone in the room? Sound the alarm. Every phone you pick gets a full-screen call.
            </div>

            {!picking ? (
              <Key kind="primary" big wide icon="megaphone" onClick={() => setPicking(true)}>Send Emergency</Key>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div className="ds-h" style={{ margin: 0 }}>Who needs to come?</div>
                {others.length === 0 ? (
                  <div className="ds-small ds-muted" style={{ textAlign: 'center', padding: '12px 0' }}>
                    Nobody else is online right now.
                  </div>
                ) : (
                  <div className="ds-list" style={{ border: '2px solid var(--ds-line)', background: 'var(--ds-paper)' }}>
                    <Row onClick={toggleAll}>
                      <CheckBox checked={allSelected} />
                      <span className="ds-small" style={{ letterSpacing: 1 }}>SELECT ALL</span>
                    </Row>
                    {others.map(u => (
                      <Row key={u.odName} onClick={() => toggle(u.odName)} right={u.odTitle || undefined}>
                        <CheckBox checked={selected.has(u.odName)} />
                        <span>{u.odName}</span>
                      </Row>
                    ))}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 6 }}>
                  <Key style={{ flex: 1 }} onClick={() => { setPicking(false); setSelected(new Set()); }}>Cancel</Key>
                  <Key kind="primary" style={{ flex: 1 }} icon="megaphone" onClick={send} disabled={selected.size === 0}>
                    Send{selected.size > 0 ? ` (${allSelected ? 'everyone' : selected.size})` : ''}
                  </Key>
                </div>
                {allSelected && (
                  <div className="ds-small ds-muted" style={{ textAlign: 'center' }}>
                    Sending to everyone also takes over the big screen.
                  </div>
                )}
              </div>
            )}
          </Window>
        )}

        <PollCard />

        <Window title={<Title icon="trophy">Awards ceremony</Title>}>
          <div className="ds-small ds-muted" style={{ marginBottom: 8 }}>
            Wrap up the night. The big screen runs through tonight's winners and every phone gets the list. Host only.
          </div>
          {awards ? (
            <div className="ds-field" style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--ds-yellow)' }}>
              <Icon name="trophy" size={14} />
              <span>Ceremony running, started by {awards.by}</span>
            </div>
          ) : !awardsOpen ? (
            <Key wide icon="key" onClick={() => setAwardsOpen(true)}>I am the host</Key>
          ) : (
            <div style={{ display: 'flex', gap: 6 }}>
              <Field
                type="text"
                value={awardsCode}
                onChange={(e) => setAwardsCode(e.target.value)}
                placeholder="Party code"
                autoCapitalize="none"
                style={{ flex: 1, minWidth: 0 }}
              />
              <Key
                kind="primary"
                onClick={() => { if (awardsCode.trim()) { savePartyCode(awardsCode.trim()); startAwards(awardsCode.trim()); setAwardsOpen(false); } }}
                disabled={!awardsCode.trim()}
              >
                Run it
              </Key>
            </div>
          )}
        </Window>

        <Window title={<Title icon="tv">On the big screen</Title>}>
          {displayed ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Note
                name={displayed.odUsername}
                color={displayed.odColor}
                image={displayed.odImageData || null}
                text={displayed.odContent || null}
              />
              <Key wide icon="tv" onClick={hideFromDisplay}>Hide from display</Key>
            </div>
          ) : (
            <div className="ds-small ds-muted">Nothing is up right now.</div>
          )}
        </Window>

        <RoomControls />
      </div>
    </div>
  );
}
