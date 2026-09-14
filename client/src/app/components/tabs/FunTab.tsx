import { useState } from 'react';
import { useSocket } from '../../../contexts/SocketContext';
import { EmergencyHostStatus } from '../PopcornEmergency';

export default function FunTab() {
  const { user, onlineUsers, emergency, startEmergency, queueMessages, chatMessages, displayedMessageId, hideFromDisplay, startNewNight } = useSocket();
  const [picking, setPicking] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [nightOpen, setNightOpen] = useState(false);
  const [partyCode, setPartyCode] = useState('');

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
    <div className="p-4 space-y-4 pb-20">
      <div className="p-5 rounded-3xl" style={{
        background: 'linear-gradient(135deg, #f97316 0%, #ef4444 100%)',
        boxShadow: '0 8px 24px rgba(249, 115, 22, 0.3)'
      }}>
        <h2 style={{ fontFamily: 'Fredoka, sans-serif', fontSize: '20px', color: 'white', fontWeight: '700' }}>
          🎉 Fun Stuff
        </h2>
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.85)', marginTop: '4px' }}>
          Tools for the room
        </p>
      </div>

      {hosting ? (
        <EmergencyHostStatus />
      ) : (
        <div className="p-5 rounded-3xl" style={{ background: 'white', boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)' }}>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl">🍿</span>
            <div>
              <h3 style={{ fontFamily: 'Fredoka, sans-serif', fontSize: '18px', fontWeight: '700', color: 'var(--text)' }}>
                Popcorn Emergency
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                Need everyone's attention? Sound the alarm.
              </p>
            </div>
          </div>

          {!picking ? (
            <button
              onClick={() => setPicking(true)}
              className="w-full mt-3 py-4 rounded-2xl transition-all transform active:scale-95"
              style={{
                background: 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)',
                color: 'white',
                border: 'none',
                fontFamily: 'Fredoka, sans-serif',
                fontSize: '16px',
                fontWeight: '700',
                boxShadow: '0 6px 20px rgba(239, 68, 68, 0.4)'
              }}
            >
              🚨 Send Emergency
            </button>
          ) : (
            <div className="mt-3">
              <p className="mb-2" style={{ fontFamily: 'Fredoka, sans-serif', fontSize: '14px', fontWeight: '600', color: 'var(--text)' }}>
                Who needs to come?
              </p>
              {others.length === 0 ? (
                <p className="p-4 rounded-xl text-center" style={{ background: 'var(--bg-secondary)', fontSize: '13px', color: 'var(--text-muted)' }}>
                  Nobody else is online right now
                </p>
              ) : (
                <div className="rounded-2xl overflow-hidden" style={{ border: '2px solid var(--bg-secondary)' }}>
                  <PickRow label="SELECT ALL" checked={allSelected} onToggle={toggleAll} bold />
                  {others.map(u => (
                    <PickRow key={u.odName} label={u.odName} sub={u.odTitle} checked={selected.has(u.odName)} onToggle={() => toggle(u.odName)} />
                  ))}
                </div>
              )}
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => { setPicking(false); setSelected(new Set()); }}
                  className="flex-1 py-3 rounded-2xl"
                  style={{ background: 'var(--bg-secondary)', color: 'var(--text)', border: 'none', fontFamily: 'Fredoka, sans-serif', fontSize: '14px', fontWeight: '600' }}
                >
                  Cancel
                </button>
                <button
                  onClick={send}
                  disabled={selected.size === 0}
                  className="flex-1 py-3 rounded-2xl transition-all active:scale-95"
                  style={{
                    background: selected.size > 0 ? 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)' : 'var(--bg-secondary)',
                    color: selected.size > 0 ? 'white' : 'var(--text-muted)',
                    border: 'none',
                    fontFamily: 'Fredoka, sans-serif',
                    fontSize: '14px',
                    fontWeight: '700'
                  }}
                >
                  🚨 Send{selected.size > 0 ? ` (${allSelected ? 'everyone' : selected.size})` : ''}
                </button>
              </div>
              {allSelected && (
                <p className="mt-2" style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center' }}>
                  Sending to everyone also takes over the big screen
                </p>
              )}
            </div>
          )}
        </div>
      )}

      <div className="p-5 rounded-3xl" style={{ background: 'white', boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)' }}>
        <h3 style={{ fontFamily: 'Fredoka, sans-serif', fontSize: '16px', fontWeight: '700', color: 'var(--text)' }}>
          📺 On the big screen
        </h3>
        {displayed ? (
          <div className="mt-3">
            <div className="p-3 rounded-xl" style={{ background: 'var(--bg-secondary)' }}>
              <p style={{ fontFamily: 'Fredoka, sans-serif', fontSize: '13px', fontWeight: '700', color: 'var(--text)' }}>
                {displayed.odUsername}
              </p>
              {displayed.odImageData && (
                <img src={displayed.odImageData} alt="" className="mt-2 rounded-lg" style={{ maxHeight: '80px', background: '#ffffeb' }} />
              )}
              {displayed.odContent && (
                <p style={{ fontSize: '13px', color: 'var(--text)', marginTop: '4px' }}>{displayed.odContent}</p>
              )}
            </div>
            <button
              onClick={hideFromDisplay}
              className="w-full mt-3 py-3 rounded-2xl"
              style={{ background: 'var(--bg-secondary)', color: 'var(--text)', border: 'none', fontFamily: 'Fredoka, sans-serif', fontSize: '14px', fontWeight: '600' }}
            >
              Hide from display
            </button>
          </div>
        ) : (
          <p className="mt-2" style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Nothing is up right now. Send a message to the queue from Chat, then tap the screen icon on it.
          </p>
        )}
      </div>

      <div className="p-5 rounded-3xl" style={{ background: 'white', boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)' }}>
        <h3 style={{ fontFamily: 'Fredoka, sans-serif', fontSize: '16px', fontWeight: '700', color: 'var(--text)' }}>
          🌙 Start a new night
        </h3>
        <p className="mt-1" style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          Clears the chat and queue, resets everyone's drinks for tonight. Pokémon, coins and DMs stay. Host only.
        </p>
        {!nightOpen ? (
          <button
            onClick={() => setNightOpen(true)}
            className="w-full mt-3 py-3 rounded-2xl"
            style={{ background: 'var(--bg-secondary)', color: 'var(--text)', border: 'none', fontFamily: 'Fredoka, sans-serif', fontSize: '14px', fontWeight: '600' }}
          >
            I am the host
          </button>
        ) : (
          <div className="mt-3 flex gap-2">
            <input
              type="text"
              value={partyCode}
              onChange={(e) => setPartyCode(e.target.value)}
              placeholder="Party code"
              autoCapitalize="none"
              className="flex-1 px-4 py-3 outline-none"
              style={{ background: 'var(--bg-secondary)', borderRadius: '14px', border: 'none', fontFamily: 'Nunito, sans-serif', fontSize: '15px', minWidth: 0 }}
            />
            <button
              onClick={() => { if (partyCode.trim()) { startNewNight(partyCode.trim()); setNightOpen(false); setPartyCode(''); } }}
              disabled={!partyCode.trim()}
              className="px-4 py-3 rounded-2xl transition-all active:scale-95"
              style={{
                background: partyCode.trim() ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' : 'var(--bg-secondary)',
                color: partyCode.trim() ? 'white' : 'var(--text-muted)',
                border: 'none',
                fontFamily: 'Fredoka, sans-serif',
                fontSize: '14px',
                fontWeight: '700'
              }}
            >
              Reset
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function PickRow({ label, sub, checked, onToggle, bold }: { label: string; sub?: string; checked: boolean; onToggle: () => void; bold?: boolean }) {
  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center gap-3 px-4 py-3 text-left"
      style={{
        background: checked ? 'rgba(239, 68, 68, 0.08)' : 'white',
        border: 'none',
        borderBottom: '1px solid var(--bg-secondary)'
      }}
    >
      <span className="w-6 h-6 rounded-lg flex items-center justify-center" style={{
        background: checked ? '#ef4444' : 'var(--bg-secondary)',
        color: 'white',
        fontSize: '14px',
        fontWeight: '700'
      }}>
        {checked ? '✓' : ''}
      </span>
      <span style={{ fontFamily: 'Fredoka, sans-serif', fontSize: bold ? '13px' : '15px', fontWeight: '700', color: 'var(--text)', letterSpacing: bold ? '0.5px' : 0 }}>
        {label}
      </span>
      {sub && <span className="ml-auto" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{sub}</span>}
    </button>
  );
}
