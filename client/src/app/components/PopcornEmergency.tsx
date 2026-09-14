import { useEffect, useState } from 'react';
import { useSocket, EmergencyStatus } from '../../contexts/SocketContext';

const STATUS_ICON: Record<EmergencyStatus, string> = {
  pending: '⏳',
  accepted: '✅',
  declined: '❌',
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
 * Two-tone siren synthesised on the spot, so there is no audio file to ship.
 * Browsers only allow this after the user has touched the page, which anyone
 * who has tapped a tab already has.
 */
function playAlarm() {
  try {
    const Ctx = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const gain = ctx.createGain();
    gain.gain.value = 0.15;
    gain.connect(ctx.destination);
    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.connect(gain);
    const t0 = ctx.currentTime;
    for (let i = 0; i < 6; i++) {
      osc.frequency.setValueAtTime(i % 2 === 0 ? 880 : 660, t0 + i * 0.25);
    }
    gain.gain.setValueAtTime(0.15, t0 + 1.4);
    gain.gain.linearRampToValueAtTime(0, t0 + 1.6);
    osc.start(t0);
    osc.stop(t0 + 1.6);
    osc.onended = () => ctx.close();
  } catch {
    // Audio is a nicety; never let it break the modal
  }
}

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
      className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6 text-center"
      style={{
        background: 'linear-gradient(180deg, #7f1d1d 0%, #b91c1c 50%, #7f1d1d 100%)',
        color: 'white',
        animation: 'emergency-in 0.4s ease-out'
      }}
    >
      <div className="absolute top-0 left-0 right-0 h-3" style={{ background: 'repeating-linear-gradient(90deg, #fbbf24 0 24px, #1f2937 24px 48px)' }} />
      <div className="absolute bottom-0 left-0 right-0 h-3" style={{ background: 'repeating-linear-gradient(90deg, #fbbf24 0 24px, #1f2937 24px 48px)' }} />

      <div className="text-8xl mb-2" style={{ animation: 'popcorn-bounce 0.5s ease-in-out infinite alternate' }}>🍿</div>
      <h1 style={{
        fontFamily: 'Fredoka, sans-serif',
        fontSize: '32px',
        fontWeight: '700',
        letterSpacing: '1px',
        textShadow: '0 4px 12px rgba(0,0,0,0.4)'
      }}>
        POPCORN EMERGENCY
      </h1>
      <p className="mt-2" style={{ fontFamily: 'Fredoka, sans-serif', fontSize: '20px', fontWeight: '600' }}>
        {emergency.hostUsername} needs you!
      </p>
      <p className="mt-1" style={{ fontSize: '13px', opacity: 0.85 }}>
        {emergency.invitees.length > 1 ? `${emergency.invitees.length} people summoned` : 'Just you'} · expires in {formatSeconds(secondsLeft)}
      </p>

      {!responded ? (
        <div className="mt-8 flex gap-4 w-full max-w-sm">
          <button
            onClick={() => respondEmergency(false)}
            className="flex-1 py-5 rounded-3xl transition-all active:scale-95"
            style={{
              background: 'rgba(255,255,255,0.15)',
              color: 'white',
              border: '2px solid rgba(255,255,255,0.4)',
              fontFamily: 'Fredoka, sans-serif',
              fontSize: '18px',
              fontWeight: '700'
            }}
          >
            ❌ Decline
          </button>
          <button
            onClick={() => respondEmergency(true)}
            className="flex-1 py-5 rounded-3xl transition-all active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
              color: 'white',
              border: 'none',
              fontFamily: 'Fredoka, sans-serif',
              fontSize: '18px',
              fontWeight: '700',
              boxShadow: '0 8px 24px rgba(16, 185, 129, 0.5)'
            }}
          >
            ✅ On my way
          </button>
        </div>
      ) : (
        <div className="mt-8 w-full max-w-sm">
          <p style={{ fontFamily: 'Fredoka, sans-serif', fontSize: '22px', fontWeight: '700' }}>
            {responded === 'accepted' ? 'Go go go! 🏃' : 'Maybe next time.'}
          </p>
          <button
            onClick={dismissEmergency}
            className="mt-6 w-full py-4 rounded-2xl"
            style={{
              background: 'rgba(255,255,255,0.2)',
              color: 'white',
              border: 'none',
              fontFamily: 'Fredoka, sans-serif',
              fontSize: '16px',
              fontWeight: '700'
            }}
          >
            Close
          </button>
        </div>
      )}

      <style>{`
        @keyframes emergency-in {
          from { opacity: 0; transform: scale(1.05); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes popcorn-bounce {
          from { transform: translateY(0) rotate(-6deg); }
          to { transform: translateY(-14px) rotate(6deg); }
        }
      `}</style>
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

  return (
    <div className="p-5 rounded-3xl" style={{
      background: 'white',
      boxShadow: '0 8px 24px rgba(239, 68, 68, 0.25)',
      border: '3px solid #ef4444'
    }}>
      <div className="flex items-center justify-between mb-3">
        <h3 style={{ fontFamily: 'Fredoka, sans-serif', fontSize: '18px', fontWeight: '700', color: 'var(--text)' }}>
          🍿 Emergency in progress
        </h3>
        <span style={{ fontFamily: 'Fredoka, sans-serif', fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600' }}>
          {formatSeconds(secondsLeft)}
        </span>
      </div>

      <div className="space-y-2 mb-4">
        {emergency.invitees.map(i => (
          <div key={i.username} className="flex items-center gap-3 px-3 py-2 rounded-xl" style={{
            background: i.status === 'accepted'
              ? 'rgba(16, 185, 129, 0.12)'
              : i.status === 'declined'
              ? 'rgba(239, 68, 68, 0.1)'
              : 'var(--bg-secondary)'
          }}>
            <span className="text-lg">{STATUS_ICON[i.status]}</span>
            <span style={{ fontFamily: 'Fredoka, sans-serif', fontSize: '15px', fontWeight: '700', color: 'var(--text)' }}>
              {i.username}
            </span>
            <span className="ml-auto" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {i.status}
            </span>
          </div>
        ))}
      </div>

      <p className="mb-4" style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center' }}>
        {counts.accepted} accepted · {counts.declined} declined · {counts.pending} pending
      </p>

      <button
        onClick={endEmergency}
        className="w-full py-3 rounded-2xl transition-all active:scale-95"
        style={{
          background: '#ef4444',
          color: 'white',
          border: 'none',
          fontFamily: 'Fredoka, sans-serif',
          fontSize: '15px',
          fontWeight: '700'
        }}
      >
        Close Emergency
      </button>
    </div>
  );
}
