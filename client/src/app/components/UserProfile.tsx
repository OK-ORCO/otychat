import { useEffect, useState } from 'react';
import { useSocket } from '../../contexts/SocketContext';
import { Bar, Window, Key, Chip, Row, Pic, Scrim, Icon } from './ds';

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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="ds-stat">
      <span className="ds-muted">{label}</span>
      <b>{value}</b>
    </div>
  );
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

  const pending = '...';

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Bar
        title="Profile"
        left={<button onClick={onBack} title="Back"><Icon name="back" size={16} /></button>}
      />

      <div className="ds-lcd ds-scroll" style={{ flex: 1, minHeight: 0, padding: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Window>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, textAlign: 'center' }}>
            <Pic src={profile?.profilePic} size={96} />
            <div style={{ fontSize: 20, color: profile?.nameColor || 'var(--ds-ink)', wordBreak: 'break-all' }}>{username}</div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'center' }}>
              {profile?.title && <Chip>{profile.title}</Chip>}
              {profile && (profile.online ? <Chip kind="live">online</Chip> : <Chip>offline</Chip>)}
              {profile && <Chip kind="blue">Lv {profile.level}</Chip>}
            </div>
            {profile?.status && <div className="ds-muted ds-small" style={{ maxWidth: 280 }}>{profile.status}</div>}
            {profile?.notFound && <div className="ds-small" style={{ color: 'var(--ds-red)' }}>This user no longer exists.</div>}
          </div>
        </Window>

        {!isOwnProfile && (
          <div style={{ display: 'flex', gap: 6 }}>
            {onDM && <Key kind="primary" icon="mail" style={{ flex: 1 }} onClick={onDM}>Send message</Key>}
            <Key icon="heart" style={{ flex: 1 }} onClick={() => setShowKudosModal(true)}>Give kudos</Key>
          </div>
        )}

        <Window pad={false} title="Stats">
          <Stat label="Coins" value={profile ? String(profile.coins) : pending} />
          <Stat label="Pokemon" value={profile ? `${profile.pokemonCaught}${profile.shinyCaught ? ` (${profile.shinyCaught} shiny)` : ''}` : pending} />
          <Stat label="Achievements" value={profile ? String(profile.achievements) : pending} />
          <Stat label="Drinks" value={profile ? String(profile.drinkCount) : pending} />
          <Stat label="Kudos" value={profile ? String(profile.kudosReceived) : pending} />
          <Stat label="Joined" value={profile ? formatJoined(profile.joinedAt) : pending} />
        </Window>

        <Window pad={false} title="Recent catches">
          {!profile || profile.recentPokemon.length === 0 ? (
            <div className="ds-muted" style={{ textAlign: 'center', padding: '18px 0', fontSize: 13 }}>
              {profile ? 'Nothing caught yet' : 'Loading'}
            </div>
          ) : (
            profile.recentPokemon.map((p, idx) => (
              <Row key={`${p.pokemonId}-${idx}`} right={timeAgo(p.caughtAt)}>
                <img className="px" src={p.sprite} alt={p.name} style={{ width: 32, height: 32 }} />
                <span style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                  {p.isShiny && <Icon name="sparkle" size={14} />}
                  {p.isShiny ? `Shiny ${p.name}` : p.name}
                </span>
              </Row>
            ))
          )}
        </Window>
      </div>

      {showKudosModal && (
        <Scrim onClose={() => !kudosSent && setShowKudosModal(false)}>
          <Window title={`Kudos for ${username}`}>
            {kudosSent ? (
              <div style={{ textAlign: 'center', padding: '8px 0' }}>
                <Icon name="heart" size={28} />
                <div style={{ marginTop: 6 }}>Kudos sent to {username}.</div>
                <div className="ds-muted ds-small" style={{ marginTop: 4 }}>You both get 10 coins.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div className="ds-small ds-muted">You both get 10 coins.</div>
                <textarea
                  className="ds-field"
                  value={kudosMessage}
                  onChange={(e) => setKudosMessage(e.target.value)}
                  placeholder="Add a message (optional)"
                  maxLength={100}
                  style={{ height: 80 }}
                />
                <div style={{ display: 'flex', gap: 6 }}>
                  <Key style={{ flex: 1 }} onClick={() => setShowKudosModal(false)}>Cancel</Key>
                  <Key kind="primary" icon="heart" style={{ flex: 1 }} onClick={handleSendKudos}>Send</Key>
                </div>
              </div>
            )}
          </Window>
        </Scrim>
      )}
    </div>
  );
}
