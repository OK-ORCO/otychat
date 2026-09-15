import { useState, useEffect } from 'react';
import { useSocket } from '../../../contexts/SocketContext';
import { Bar, Window, Key, Row, Icon, formatTime } from '../ds';

const LEADERBOARD_TYPES = [
  { key: 'xp', label: 'Level', icon: 'level' },
  { key: 'pokemon', label: 'Catches', icon: 'pokeball' },
  { key: 'shiny', label: 'Shiny', icon: 'sparkle' },
  { key: 'drinks', label: 'Drinks', icon: 'drink' },
] as const;

const TONIGHT_TYPES = [
  { key: 'reactions', label: 'Hype', icon: 'fire' },
  { key: 'catches', label: 'Catches', icon: 'pokeball' },
  { key: 'messages', label: 'Messages', icon: 'chat' },
  { key: 'drinks', label: 'Drinks', icon: 'drink' },
] as const;

type BoardMode = 'tonight' | 'all';

interface FeedEvent {
  type: string;
  icon: string;
}

/** The feed item's emoji field is data from the socket layer; pick a line icon for it. */
function feedIcon(event: FeedEvent): string {
  switch (event.type) {
    case 'level-up': return 'level';
    case 'achievement': return 'trophy';
    case 'pokemon-caught': return event.icon === '✨' ? 'sparkle' : 'pokeball';
    case 'pokemon': return event.icon === '✨' ? 'sparkle' : event.icon === '🌟' ? 'star' : 'pokeball';
    case 'drink': return 'drink';
    case 'kudos':
      if (event.icon === '💖') return 'heart';
      if (event.icon === '🎉') return 'sparkle';
      return 'megaphone';
    case 'question':
      if (event.icon === '📷') return 'camera';
      if (event.icon === '🎨') return 'pencil';
      return 'chat';
    case 'drawing': return 'pencil';
    case 'slide': return 'tv';
    default: return 'info';
  }
}

function StatCell({ label, value, last }: { label: string; value: number | string; last?: boolean }) {
  return (
    <div
      className="ds-stat"
      style={{
        flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
        borderBottom: 0, borderRight: last ? 0 : '1px dashed #c5ccd6'
      }}
    >
      <b>{value}</b>
      <span className="ds-small ds-muted">{label}</span>
    </div>
  );
}

export default function FeedTab() {
  const { feed, user, leaderboards, onlineUsers } = useSocket();
  const [activeLeaderboard, setActiveLeaderboard] = useState(0);
  const [mode, setMode] = useState<BoardMode>('tonight');
  const types = mode === 'tonight' ? TONIGHT_TYPES : LEADERBOARD_TYPES;

  // Auto-cycle through leaderboards every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveLeaderboard(prev => (prev + 1) % types.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [types.length]);

  const currentLeaderboardType = types[Math.min(activeLeaderboard, types.length - 1)];
  const currentLeaderboard = (mode === 'tonight'
    ? leaderboards.tonight?.[currentLeaderboardType.key as keyof NonNullable<typeof leaderboards.tonight>]
    : leaderboards[currentLeaderboardType.key as keyof typeof leaderboards]) as { username: string; level?: number; count?: number }[] | undefined || [];

  const smallKey = { minHeight: 26, padding: '0 8px', fontSize: 12 } as const;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Bar title="Feed" sub={`${onlineUsers.length} online`} />

      <div className="ds-lcd ds-scroll" style={{ flex: 1, minHeight: 0, padding: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* quick stats */}
        <Window pad={false}>
          <div style={{ display: 'flex' }}>
            <StatCell label="level" value={user?.odTrainerLevel || 1} />
            <StatCell label="coins" value={user?.odCoins || 0} />
            <StatCell label="online" value={onlineUsers.length} last />
          </div>
        </Window>

        {/* leaderboard */}
        <Window
          pad={false}
          title={`${currentLeaderboardType.label} ${mode === 'tonight' ? 'tonight' : 'all time'}`}
        >
          <div style={{ display: 'flex', gap: 6, padding: 8, borderBottom: '1px dashed #c5ccd6', alignItems: 'center' }}>
            {(['tonight', 'all'] as BoardMode[]).map(m => (
              <Key
                key={m}
                on={mode === m}
                style={{ ...smallKey, flex: 1 }}
                onClick={() => { setMode(m); setActiveLeaderboard(0); }}
              >
                {m === 'tonight' ? 'Tonight' : 'All time'}
              </Key>
            ))}
            <span style={{ display: 'flex', gap: 4, marginLeft: 'auto' }}>
              {types.map((type, idx) => (
                <Key
                  key={type.key}
                  sq
                  on={activeLeaderboard === idx}
                  icon={type.icon}
                  iconSize={16}
                  title={type.label}
                  style={{ width: 30, height: 30 }}
                  onClick={() => setActiveLeaderboard(idx)}
                />
              ))}
            </span>
          </div>

          {currentLeaderboard.length === 0 ? (
            <div className="ds-muted" style={{ textAlign: 'center', padding: '18px 0', fontSize: 13 }}>
              {mode === 'tonight' ? 'Nothing yet tonight' : 'Nothing yet'}
            </div>
          ) : (
            currentLeaderboard.slice(0, 5).map((entry, idx) => {
              const me = entry.username === user?.odName;
              return (
                <div key={entry.username} className="ds-row" style={{ background: idx === 0 ? 'var(--ds-yellow)' : undefined }}>
                  <span className="ds-muted" style={{ width: 18, textAlign: 'right', fontSize: 12 }}>{idx + 1}</span>
                  <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {entry.username}
                    {me && <span className="ds-muted ds-small"> (you)</span>}
                  </span>
                  <span className="ds-n" style={{ fontSize: 14, color: 'var(--ds-ink)' }}>
                    {currentLeaderboardType.key === 'xp' ? `Lv ${entry.level}` : entry.count}
                  </span>
                </div>
              );
            })
          )}
        </Window>

        {/* activity */}
        <Window pad={false} title="Activity">
          {feed.length === 0 ? (
            <div className="ds-muted" style={{ textAlign: 'center', padding: '18px 0', fontSize: 13 }}>
              Nothing yet tonight
            </div>
          ) : (
            feed.slice(0, 10).map(event => (
              <Row key={event.id} right={formatTime(new Date(event.timestamp).toISOString())}>
                <Icon name={feedIcon(event)} size={16} />
                <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 13 }}>
                  {event.message}
                </span>
              </Row>
            ))
          )}
        </Window>
      </div>
    </div>
  );
}
