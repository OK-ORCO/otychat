import { useSocket } from '../../contexts/SocketContext';

// "1 reactions" reads badly; single-word labels drop the s at one
function countLabel(value: number, label: string) {
  return value === 1 && !label.includes(' ') && label.endsWith('s') ? label.slice(0, -1) : label;
}

/**
 * Full-screen sheet every phone gets when the host runs the awards. The big
 * screen plays them one at a time; here you get the whole list with your own
 * wins highlighted. Closing it only hides it locally.
 */
export default function AwardsSheet() {
  const { awards, user, dismissAwards, endAwards } = useSocket();
  if (!awards) return null;

  const mine = awards.awards.filter(a => a.username === user?.odName);
  const isHost = awards.by === user?.odName;

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{
      background: 'linear-gradient(180deg, #1e1b4b 0%, #312e81 100%)',
      color: 'white',
      animation: 'awards-in 0.4s ease-out'
    }}>
      <div className="p-5 text-center" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 20px)' }}>
        <div className="text-5xl">🏆</div>
        <h1 style={{ fontFamily: 'Fredoka, sans-serif', fontSize: '28px', fontWeight: '700', marginTop: '6px' }}>
          Tonight's Awards
        </h1>
        <p style={{ fontSize: '13px', opacity: 0.8 }}>
          {mine.length > 0
            ? `You won ${mine.length} award${mine.length === 1 ? '' : 's'}!`
            : 'Watch the big screen'}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
        {awards.awards.map(a => {
          const won = a.username === user?.odName;
          const picIsImage = a.profilePic.startsWith('data:') || a.profilePic.startsWith('http') || a.profilePic.startsWith('/');
          return (
            <div key={a.key} className="p-4 rounded-2xl flex items-center gap-3" style={{
              background: won ? 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)' : 'rgba(255,255,255,0.1)',
              color: won ? '#1f2937' : 'white',
              boxShadow: won ? '0 8px 24px rgba(251, 191, 36, 0.4)' : 'none'
            }}>
              <div className="text-3xl">{a.icon}</div>
              <div className="flex-1 min-w-0">
                <p style={{ fontFamily: 'Fredoka, sans-serif', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', opacity: 0.85 }}>
                  {a.title}
                </p>
                <p style={{ fontFamily: 'Fredoka, sans-serif', fontSize: '18px', fontWeight: '700' }}>
                  {a.username}{won ? ' (you!)' : ''}
                </p>
                {a.detail && (
                  <p className="truncate" style={{ fontSize: '13px', opacity: 0.85 }}>
                    {a.key === 'question' ? `"${a.detail}"` : a.detail}
                  </p>
                )}
                {a.value !== null && a.label && (
                  <p style={{ fontSize: '12px', opacity: 0.8 }}>{a.value} {countLabel(a.value, a.label)}</p>
                )}
              </div>
              {a.sprite ? (
                <img src={a.sprite} alt="" style={{ width: 48, height: 48, imageRendering: 'pixelated' }} />
              ) : (
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl overflow-hidden" style={{ background: 'rgba(0,0,0,0.15)' }}>
                  {picIsImage ? <img src={a.profilePic} alt="" className="w-full h-full object-cover" /> : a.profilePic}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="p-4 flex gap-2" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}>
        <button
          onClick={dismissAwards}
          className="flex-1 py-4 rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: 'none', fontFamily: 'Fredoka, sans-serif', fontSize: '16px', fontWeight: '700' }}
        >
          Close
        </button>
        {isHost && (
          <button
            onClick={() => endAwards()}
            className="flex-1 py-4 rounded-2xl"
            style={{ background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)', color: 'white', border: 'none', fontFamily: 'Fredoka, sans-serif', fontSize: '16px', fontWeight: '700' }}
          >
            End ceremony
          </button>
        )}
      </div>

      <style>{`
        @keyframes awards-in {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
