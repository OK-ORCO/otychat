import { useState, useEffect } from 'react';
import { useSocket } from '../../../contexts/SocketContext';
import { UI_SPRITES } from '../../data/pokemon-data';

// Color mapping for feed item types
const TYPE_COLORS: Record<string, string> = {
  achievement: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
  pokemon: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
  drink: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
  kudos: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
  drawing: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
  slide: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
  question: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
  'level-up': 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
  'pokemon-caught': 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
};

const LEADERBOARD_TYPES = [
  { key: 'xp', label: 'XP Leaders', icon: UI_SPRITES.xpLeader, color: '#fbbf24', isSprite: true },
  { key: 'pokemon', label: 'Top Catchers', icon: '🎯', color: '#10b981' },
  { key: 'shiny', label: 'Shiny Hunters', icon: UI_SPRITES.shinyLeader, color: '#ec4899', isSprite: true },
  { key: 'drinks', label: 'Most Drinks', icon: '🍺', color: '#f97316' },
] as const;

function SpriteIcon({ src, size = 20 }: { src: string; size?: number }) {
  return <img src={src} alt="" style={{ width: size, height: size, imageRendering: 'pixelated' }} />;
}

export default function FeedTab() {
  const { feed, user, leaderboards, onlineUsers } = useSocket();
  const [activeLeaderboard, setActiveLeaderboard] = useState(0);

  // Auto-cycle through leaderboards every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveLeaderboard(prev => (prev + 1) % LEADERBOARD_TYPES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const currentLeaderboardType = LEADERBOARD_TYPES[activeLeaderboard];
  const currentLeaderboard = leaderboards[currentLeaderboardType.key as keyof typeof leaderboards] || [];

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Quick Stats Bar */}
      <div className="p-3 flex gap-3" style={{
        background: 'rgba(255, 255, 255, 0.98)',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)'
      }}>
        {/* Level */}
        <div className="flex-1 p-3 rounded-2xl" style={{
          background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
          boxShadow: '0 4px 12px rgba(251, 191, 36, 0.3)'
        }}>
          <div className="flex items-center gap-2">
            <SpriteIcon src={UI_SPRITES.levelUp} size={24} />
            <div>
              <p style={{
                fontFamily: 'Fredoka, sans-serif',
                fontSize: '10px',
                color: 'rgba(255,255,255,0.8)',
                fontWeight: '600',
                textTransform: 'uppercase'
              }}>Level</p>
              <p style={{
                fontFamily: 'Fredoka, sans-serif',
                fontSize: '20px',
                color: 'white',
                fontWeight: '700',
                lineHeight: 1
              }}>{user?.odTrainerLevel || 1}</p>
            </div>
          </div>
        </div>

        {/* Coins */}
        <div className="flex-1 p-3 rounded-2xl" style={{
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
        }}>
          <div className="flex items-center gap-2">
            <SpriteIcon src={UI_SPRITES.coin} size={24} />
            <div>
              <p style={{
                fontFamily: 'Fredoka, sans-serif',
                fontSize: '10px',
                color: 'rgba(255,255,255,0.8)',
                fontWeight: '600',
                textTransform: 'uppercase'
              }}>Coins</p>
              <p style={{
                fontFamily: 'Fredoka, sans-serif',
                fontSize: '20px',
                color: 'white',
                fontWeight: '700',
                lineHeight: 1
              }}>{user?.odCoins || 0}</p>
            </div>
          </div>
        </div>

        {/* Online */}
        <div className="p-3 rounded-2xl" style={{
          background: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
          boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
        }}>
          <div className="flex items-center gap-2">
            <SpriteIcon src={UI_SPRITES.online} size={24} />
            <div>
              <p style={{
                fontFamily: 'Fredoka, sans-serif',
                fontSize: '10px',
                color: 'rgba(255,255,255,0.8)',
                fontWeight: '600',
                textTransform: 'uppercase'
              }}>Online</p>
              <p style={{
                fontFamily: 'Fredoka, sans-serif',
                fontSize: '20px',
                color: 'white',
                fontWeight: '700',
                lineHeight: 1
              }}>{onlineUsers.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Leaderboard Section */}
        <div className="rounded-3xl overflow-hidden" style={{
          background: 'white',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)'
        }}>
          {/* Leaderboard Header */}
          <div className="p-4 flex items-center justify-between" style={{
            background: `linear-gradient(135deg, ${currentLeaderboardType.color}22 0%, ${currentLeaderboardType.color}11 100%)`,
            borderBottom: '1px solid rgba(0,0,0,0.05)'
          }}>
            <div className="flex items-center gap-3">
              {'isSprite' in currentLeaderboardType && currentLeaderboardType.isSprite ? (
                <SpriteIcon src={currentLeaderboardType.icon} size={28} />
              ) : (
                <span className="text-2xl">{currentLeaderboardType.icon}</span>
              )}
              <div>
                <h3 style={{
                  fontFamily: 'Fredoka, sans-serif',
                  fontSize: '16px',
                  color: 'var(--text)',
                  fontWeight: '700'
                }}>
                  {currentLeaderboardType.label}
                </h3>
                <p style={{
                  fontSize: '11px',
                  color: 'var(--text-muted)'
                }}>
                  Top trainers
                </p>
              </div>
            </div>

            {/* Leaderboard tabs */}
            <div className="flex gap-1">
              {LEADERBOARD_TYPES.map((type, idx) => (
                <button
                  key={type.key}
                  onClick={() => setActiveLeaderboard(idx)}
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-all"
                  style={{
                    background: activeLeaderboard === idx
                      ? type.color
                      : 'rgba(0,0,0,0.05)',
                    border: 'none',
                    cursor: 'pointer',
                    transform: activeLeaderboard === idx ? 'scale(1.1)' : 'scale(1)'
                  }}
                >
                  {'isSprite' in type && type.isSprite ? <SpriteIcon src={type.icon} size={16} /> : <span style={{ fontSize: '14px' }}>{type.icon}</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Leaderboard List */}
          <div className="p-3">
            {currentLeaderboard.length === 0 ? (
              <div className="text-center py-6">
                <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                  No data yet
                </p>
              </div>
            ) : (
              currentLeaderboard.slice(0, 5).map((entry, idx) => (
                <div
                  key={entry.username}
                  className="flex items-center gap-3 p-2 rounded-xl transition-all"
                  style={{
                    background: idx === 0 ? 'rgba(251, 191, 36, 0.1)' : 'transparent'
                  }}
                >
                  {/* Rank */}
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{
                    background: idx === 0
                      ? 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)'
                      : idx === 1
                      ? 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)'
                      : idx === 2
                      ? 'linear-gradient(135deg, #d97706 0%, #b45309 100%)'
                      : 'rgba(0,0,0,0.1)',
                    color: idx < 3 ? 'white' : 'var(--text)',
                    fontFamily: 'Fredoka, sans-serif',
                    fontSize: '12px',
                    fontWeight: '700'
                  }}>
                    {idx + 1}
                  </div>

                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <p className="truncate" style={{
                      fontFamily: 'Fredoka, sans-serif',
                      fontSize: '14px',
                      color: 'var(--text)',
                      fontWeight: entry.username === user?.odName ? '700' : '500'
                    }}>
                      {entry.username}
                      {entry.username === user?.odName && ' (You)'}
                    </p>
                  </div>

                  {/* Value */}
                  <div className="px-3 py-1 rounded-full" style={{
                    background: `${currentLeaderboardType.color}22`,
                    fontFamily: 'Fredoka, sans-serif',
                    fontSize: '12px',
                    fontWeight: '700',
                    color: currentLeaderboardType.color
                  }}>
                    {currentLeaderboardType.key === 'xp'
                      ? `Lv${entry.level}`
                      : entry.count}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Activity Feed */}
        <div>
          <h3 className="px-2 mb-3" style={{
            fontFamily: 'Fredoka, sans-serif',
            fontSize: '12px',
            color: 'var(--text-muted)',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            Live Activity
          </h3>

          <div className="space-y-2">
            {feed.length === 0 ? (
              <div className="p-6 text-center rounded-2xl" style={{
                background: 'white',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)'
              }}>
                <div className="text-3xl mb-2">🎉</div>
                <p style={{
                  fontFamily: 'Fredoka, sans-serif',
                  fontSize: '14px',
                  color: 'var(--text)',
                  fontWeight: '600'
                }}>
                  No activity yet!
                </p>
                <p style={{
                  fontSize: '12px',
                  color: 'var(--text-muted)',
                  marginTop: '4px'
                }}>
                  Start catching Pokemon!
                </p>
              </div>
            ) : (
              feed.slice(0, 10).map((event) => (
                <div
                  key={event.id}
                  className="p-3 rounded-xl flex items-center gap-3"
                  style={{
                    background: 'white',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)'
                  }}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0" style={{
                    background: TYPE_COLORS[event.type] || TYPE_COLORS.achievement
                  }}>
                    {event.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate" style={{
                      fontFamily: 'Nunito, sans-serif',
                      fontSize: '13px',
                      color: 'var(--text)',
                      lineHeight: '1.4'
                    }}>
                      {event.message}
                    </p>
                    <p style={{
                      color: 'var(--text-muted)',
                      fontFamily: 'Fredoka, sans-serif',
                      fontSize: '10px',
                      fontWeight: '600'
                    }}>
                      {new Date(event.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
