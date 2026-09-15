import { useEffect, useState, CSSProperties } from 'react';
import { useSocket, EmergencyStatus } from '../../contexts/SocketContext';
import { Window, Key, Chip, Row, Icon } from './ds';

const STATUS_CHIP: Record<EmergencyStatus, 'live' | 'red' | undefined> = {
  pending: undefined,
  accepted: 'live',
  declined: 'red',
};

function useCountdown(expiresAt: number | undefined) {
  const [secondsLeft, setSecondsLeft] = useState(0);
  useEffect(() => {
    if (!expiresAt) return;
    const tick = () => setSecondsLeft(Math.max(0, Math.round((expiresAt - Date.now()) / 1000)));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [expiresAt]);
  return secondsLeft;
}

function formatSeconds(s: number) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/**
 * A short DS-style chime, synthesised on the spot so there is no audio file to
 * ship: three rising notes, played twice, soft triangle wave. Browsers only
 * allow this after the user has touched the page, which anyone who has tapped
 * a tab already has.
 */
function playAlarm() {
  try {
    const Ctx = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const notes = [523.25, 659.25, 783.99, 523.25, 659.25, 783.99];
    const step = 0.16;
    notes.forEach((freq, i) => {
      const t = ctx.currentTime + i * step + (i >= 3 ? 0.12 : 0);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.12, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + step);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + step);
    });
    setTimeout(() => ctx.close(), 1500);
  } catch {
    // Audio is a nicety; never let it break the modal
  }
}

// Hazard stripe: the one place a repeating gradient is allowed in the DS.
const HAZARD: CSSProperties = {
  position: 'absolute', left: 0, right: 0, height: 14,
  background: 'repeating-linear-gradient(45deg, var(--ds-yellow) 0 12px, var(--ds-ink) 12px 24px)',
  borderTop: '1px solid var(--ds-ink)', borderBottom: '1px solid var(--ds-ink)'
};

/**
 * Full-screen takeover an invitee sees. It cannot be swiped away: the only exits
 * are Accept or Decline, after which a short confirmation shows with a Close button.
 */
export function EmergencyInviteModal() {
  const { emergency, respondEmergency, dismissEmergency } = useSocket();
  const secondsLeft = useCountdown(emergency?.expiresAt);
  const emergencyId = emergency?.role === 'invitee' && !emergency.myResponse ? emergency.id : null;

  useEffect(() => {
    if (emergencyId) playAlarm();
  }, [emergencyId]);

  if (!emergency || emergency.role !== 'invitee') return null;

  const responded = emergency.myResponse;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        background: 'var(--ds-red)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24
      }}
    >
      <div style={{ ...HAZARD, top: 0 }} />
      <div style={{ ...HAZARD, bottom: 0 }} />

      <Window style={{ width: '100%', maxWidth: 360 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 6, padding: '8px 0' }}>
          <Icon name="popcorn" size={64} />
          <div style={{ fontSize: 22, letterSpacing: 1, marginTop: 4 }}>POPCORN EMERGENCY</div>
          <div style={{ fontSize: 16 }}>{emergency.hostUsername} needs you</div>
          <div className="ds-small ds-muted">
            {emergency.invitees.length > 1 ? `${emergency.invitees.length} people summoned` : 'Just you'} · expires in {formatSeconds(secondsLeft)}
          </div>

          {!responded ? (
            <div style={{ display: 'flex', gap: 8, width: '100%', marginTop: 12 }}>
              <Key kind="danger" big style={{ flex: 1 }} icon="x" onClick={() => respondEmergency(false)}>Decline</Key>
              <Key kind="primary" big style={{ flex: 1 }} icon="check" onClick={() => respondEmergency(true)}>On my way</Key>
            </div>
          ) : (
            <div style={{ width: '100%', marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 18 }}>
                {responded === 'accepted' ? 'Go go go.' : 'Maybe next time.'}
              </div>
              <Key wide big onClick={dismissEmergency}>Close</Key>
            </div>
          )}
        </div>
      </Window>
    </div>
  );
}

/**
 * What the host sees while an emergency is running: who has answered, and a
 * button to close it. Rendered inside the Fun tab.
 */
export function EmergencyHostStatus() {
  const { emergency, endEmergency } = useSocket();
  const secondsLeft = useCountdown(emergency?.expiresAt);
  if (!emergency || emergency.role !== 'host') return null;

  const counts = emergency.invitees.reduce(
    (acc, i) => ({ ...acc, [i.status]: acc[i.status] + 1 }),
    { pending: 0, accepted: 0, declined: 0 } as Record<EmergencyStatus, number>
  );

  const title = (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <Icon name="popcorn" size={14} />
      Emergency in progress
    </span>
  );

  return (
    <Window title={title} right={<Chip kind="q">{formatSeconds(secondsLeft)}</Chip>} pad={false}>
      <div className="ds-list">
        {emergency.invitees.map(i => (
          <Row key={i.username} right={<Chip kind={STATUS_CHIP[i.status]}>{i.status}</Chip>}>
            <Icon name="person" size={16} />
            <span>{i.username}</span>
          </Row>
        ))}
      </div>
      <div style={{ padding: 10, borderTop: '1px dashed #c5ccd6', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div className="ds-small ds-muted" style={{ textAlign: 'center' }}>
          {counts.accepted} accepted · {counts.declined} declined · {counts.pending} pending
        </div>
        <Key kind="danger" wide icon="x" onClick={endEmergency}>Close Emergency</Key>
      </div>
    </Window>
  );
}
