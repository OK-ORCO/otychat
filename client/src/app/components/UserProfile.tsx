import { useEffect, useState } from 'react';
import { useSocket } from '../../contexts/SocketContext';

interface UserProfileProps {
  username: string;
  onBack: () => void;
  onDM?: () => void;
}

function formatJoined(iso: string) {
  const d = new Date(iso.includes('T') ? iso : iso.replace(' ', 'T') + 'Z');
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

function timeAgo(iso: string) {
  const d = new Date(iso.includes('T') ? iso : iso.replace(' ', 'T') + 'Z');
  const mins = Math.max(0, Math.round((Date.now() - d.getTime()) / 60000));
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} hr ago`;
  return `${Math.round(hours / 24)} d ago`;
}

export default function UserProfile({ username, onBack, onDM }: UserProfileProps) {
  const { sendKudos, user: currentUser, profiles, requestProfile } = useSocket();
  const [showKudosModal, setShowKudosModal] = useState(false);
  const [kudosMessage, setKudosMessage] = useState('');
  const [kudosSent, setKudosSent] = useState(false);

  useEffect(() => {
    requestProfile(username);
  }, [username, requestProfile]);

  const profile = profiles[username];
  const isOwnProfile = currentUser?.odName === username;

  const handleSendKudos = () => {
    sendKudos(username, kudosMessage);
    setKudosSent(true);
    setTimeout(() => {
      setShowKudosModal(false);
      setKudosMessage('');
      setKudosSent(false);
    }, 1500);
  };

  const pic = profile?.profilePic || '👤';
  const picIsImage = pic.startsWith('data:') || pic.startsWith('http') || pic.startsWith('/');

  return (
    <div className="min-h-screen pb-20">
      <div className="p-4 flex items-center gap-3" style={{
        background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
        boxShadow: '0 4px 16px rgba(236, 72, 153, 0.2)'
      }}>
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl transition-all transform hover:scale-110"
          style={{ background: 'rgba(255, 255, 255, 0.2)', color: 'white', border: 'none' }}
        >
          ←
        </button>
        <h2 style={{ fontFamily: 'Fredoka, sans-serif', fontSize: '18px', color: 'white', fontWeight: '700' }}>
          Profile
        </h2>
      </div>

      <div className="p-4 space-y-4">
        <div className="p-6 rounded-3xl" style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)'
        }}>
          <div className="flex flex-col items-center gap-3">
            <div className="w-28 h-28 rounded-3xl flex items-center justify-center text-7xl overflow-hidden" style={{
              background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
              boxShadow: '0 4px 16px rgba(236, 72, 153, 0.2)'
            }}>
              {picIsImage ? (
                <img src={pic} alt={username} className="w-full h-full object-cover" />
              ) : (
                <span>{pic}</span>
              )}
            </div>

            <div className="text-center">
              <h3 style={{
                fontFamily: 'Fredoka, sans-serif',
                fontSize: '24px',
                color: profile?.nameColor || 'var(--text)',
                fontWeight: '700'
              }}>
                {username}
              </h3>
              {profile?.title && (
                <div className="mt-1 px-3 py-1 rounded-full inline-block" style={{
                  background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                  color: 'white',
                  fontFamily: 'Fredoka, sans-serif',
                  fontSize: '12px',
                  fontWeight: '600'
                }}>
                  "{profile.title}"
                </div>
              )}
              {profile && (
                <p className="mt-1" style={{ fontSize: '12px', color: profile.online ? '#10b981' : 'var(--text-muted)', fontWeight: 600 }}>
                  {profile.online ? '● Online' : '○ Offline'}
                </p>
              )}
            </div>

            {profile?.status && (
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', textAlign: 'center', maxWidth: '280px' }}>
                {profile.status}
              </p>
            )}

            <div className="mt-2 px-4 py-2 rounded-2xl" style={{
              background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
              color: 'white'
            }}>
              <span style={{ fontFamily: 'Fredoka, sans-serif', fontSize: '16px', fontWeight: '700' }}>
                Level {profile?.level ?? '…'}
              </span>
            </div>
          </div>
        </div>

        {profile?.notFound && (
          <p className="text-center" style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
            This user no longer exists.
          </p>
        )}

        {onDM && !isOwnProfile && (
          <button
            onClick={onDM}
            className="w-full p-4 rounded-2xl transition-all transform hover:scale-105 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
              color: 'white',
              fontFamily: 'Fredoka, sans-serif',
              fontSize: '16px',
              fontWeight: '700',
              border: 'none',
              boxShadow: '0 4px 16px rgba(236, 72, 153, 0.3)'
            }}
          >
            💬 Send Message
          </button>
        )}

        {!isOwnProfile && (
          <button
            onClick={() => setShowKudosModal(true)}
            className="w-full p-4 rounded-2xl transition-all transform hover:scale-105 active:scale-95"
            style={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
              border: 'none',
              fontFamily: 'Fredoka, sans-serif',
              fontSize: '16px',
              fontWeight: '700',
              color: 'var(--text)'
            }}
          >
            💖 Give Kudos
          </button>
        )}

        <div className="grid grid-cols-2 gap-3">
          <StatCard icon="🪙" label="Coins" value={profile ? String(profile.coins) : '…'} />
          <StatCard icon="⚾" label="Pokémon" value={profile ? `${profile.pokemonCaught}${profile.shinyCaught ? ` (${profile.shinyCaught} shiny)` : ''}` : '…'} />
          <StatCard icon="🏆" label="Achievements" value={profile ? String(profile.achievements) : '…'} />
          <StatCard icon="🍺" label="Drinks" value={profile ? String(profile.drinkCount) : '…'} />
          <StatCard icon="💖" label="Kudos" value={profile ? String(profile.kudosReceived) : '…'} />
          <StatCard icon="📅" label="Joined" value={profile ? formatJoined(profile.joinedAt) : '…'} />
        </div>

        <div className="p-5 rounded-3xl" style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)'
        }}>
          <h3 style={{ fontFamily: 'Fredoka, sans-serif', fontSize: '16px', fontWeight: '700', color: 'var(--text)', marginBottom: '12px' }}>
            ⚾ Recent Catches
          </h3>
          {!profile || profile.recentPokemon.length === 0 ? (
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              {profile ? 'Nothing caught yet.' : 'Loading…'}
            </p>
          ) : (
            <div className="space-y-3">
              {profile.recentPokemon.map((p, idx) => (
                <div key={`${p.pokemonId}-${idx}`} className="flex items-center gap-3 pb-3 border-b" style={{ borderColor: 'var(--bg-secondary)' }}>
                  <img src={p.sprite} alt={p.name} style={{ width: 40, height: 40, imageRendering: 'pixelated', filter: p.isShiny ? 'drop-shadow(0 0 6px gold)' : 'none' }} />
                  <div className="flex-1">
                    <p style={{ fontSize: '14px', color: 'var(--text)', fontWeight: 600 }}>
                      {p.isShiny ? '✨ Shiny ' : ''}{p.name}
                    </p>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{timeAgo(p.caughtAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showKudosModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0, 0, 0, 0.5)' }}
          onClick={() => !kudosSent && setShowKudosModal(false)}
        >
          <div
            className="w-full max-w-sm p-6 rounded-3xl"
            style={{
              background: 'rgba(255, 255, 255, 0.98)',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 16px 48px rgba(0, 0, 0, 0.2)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {kudosSent ? (
              <div className="text-center py-4">
                <div className="text-6xl mb-4">💖</div>
                <p style={{ fontFamily: 'Fredoka, sans-serif', fontSize: '18px', fontWeight: '700', color: 'var(--text)' }}>
                  Kudos sent to {username}!
                </p>
                <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '8px' }}>
                  You both earned 10 coins! 🪙
                </p>
              </div>
            ) : (
              <>
                <h3 style={{ fontFamily: 'Fredoka, sans-serif', fontSize: '20px', fontWeight: '700', color: 'var(--text)', textAlign: 'center', marginBottom: '16px' }}>
                  💖 Send Kudos to {username}
                </h3>
                <p style={{ fontSize: '14px', color: 'var(--text-muted)', textAlign: 'center', marginBottom: '16px' }}>
                  You both earn 10 coins! 🪙
                </p>
                <textarea
                  value={kudosMessage}
                  onChange={(e) => setKudosMessage(e.target.value)}
                  placeholder="Add a message (optional)"
                  maxLength={100}
                  className="w-full p-3 rounded-2xl mb-4"
                  style={{
                    border: '2px solid var(--bg-secondary)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text)',
                    fontSize: '14px',
                    resize: 'none',
                    height: '80px'
                  }}
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowKudosModal(false)}
                    className="flex-1 p-3 rounded-2xl transition-all"
                    style={{ background: 'var(--bg-secondary)', color: 'var(--text)', fontFamily: 'Fredoka, sans-serif', fontWeight: '600', border: 'none' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSendKudos}
                    className="flex-1 p-3 rounded-2xl transition-all transform hover:scale-105"
                    style={{
                      background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
                      color: 'white',
                      fontFamily: 'Fredoka, sans-serif',
                      fontWeight: '700',
                      border: 'none',
                      boxShadow: '0 4px 16px rgba(236, 72, 153, 0.3)'
                    }}
                  >
                    Send 💖
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="p-4 rounded-2xl" style={{
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(10px)',
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)'
    }}>
      <div className="text-2xl mb-1">{icon}</div>
      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>{label}</div>
      <div style={{ fontFamily: 'Fredoka, sans-serif', fontSize: '18px', fontWeight: '700', color: 'var(--text)' }}>{value}</div>
    </div>
  );
}
