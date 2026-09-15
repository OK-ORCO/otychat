import { useState, useEffect } from 'react';
import { useSocket } from '../../../contexts/SocketContext';
import ProfilePicSelector from '../ProfilePicSelector';
import Settings from '../Settings';
import ProfileEditor from '../ProfileEditor';
import Achievements from '../Achievements';
import NotificationPrompt from '../NotificationPrompt';
import { Bar, Window, Key, Chip, Pic, Progress } from '../ds';

interface MeTabProps {
  username: string;
}

type SubPage = 'settings' | 'profilePic' | 'profileEditor' | 'achievements' | null;

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="ds-stat">
      <span>{label}</span>
      <b>{value}</b>
    </div>
  );
}

export default function MeTab({ username }: MeTabProps) {
  const {
    user,
    caughtPokemon,
    updateProfile,
    leave
  } = useSocket();

  const [currentPage, setCurrentPage] = useState<SubPage>(null);
  const [profilePic, setProfilePic] = useState(user?.odProfilePic || '👤');
  const [status, setStatus] = useState(user?.odStatus || '');
  const [title, setTitle] = useState(user?.odTitle || 'Newcomer');
  const [nameColor, setNameColor] = useState(user?.odNameColor || '#ec4899');

  // Sync local state with user data from socket context
  useEffect(() => {
    if (user?.odProfilePic) setProfilePic(user.odProfilePic);
    if (user?.odStatus !== undefined) setStatus(user.odStatus);
    if (user?.odTitle) setTitle(user.odTitle);
    if (user?.odNameColor) setNameColor(user.odNameColor);
  }, [user?.odProfilePic, user?.odStatus, user?.odTitle, user?.odNameColor]);

  const handleProfilePicChange = (pic: string) => {
    setProfilePic(pic);
    updateProfile({ profilePic: pic });
  };

  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus);
    updateProfile({ status: newStatus });
  };

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    updateProfile({ title: newTitle });
  };

  const handleNameColorChange = (newColor: string) => {
    setNameColor(newColor);
    updateProfile({ nameColor: newColor });
  };

  const uniquePokemonIds = new Set(caughtPokemon.map(p => p.odPokemonId));
  const pokemonCaught = uniquePokemonIds.size;

  if (currentPage === 'settings') {
    return (
      <Settings
        onBack={() => setCurrentPage(null)}
        profilePic={profilePic}
        onProfilePicChange={handleProfilePicChange}
        status={status}
        onStatusChange={handleStatusChange}
        nameColor={nameColor}
        onNameColorChange={handleNameColorChange}
      />
    );
  }

  if (currentPage === 'profilePic') {
    return (
      <ProfilePicSelector
        onBack={() => setCurrentPage(null)}
        onSelect={(pic) => {
          handleProfilePicChange(pic);
          setCurrentPage(null);
        }}
        currentPic={profilePic}
      />
    );
  }

  if (currentPage === 'profileEditor') {
    return (
      <ProfileEditor
        onBack={() => setCurrentPage(null)}
        profilePic={profilePic}
        onProfilePicChange={handleProfilePicChange}
        status={status}
        onStatusChange={handleStatusChange}
        title={title}
        onTitleChange={handleTitleChange}
        username={username}
      />
    );
  }

  if (currentPage === 'achievements') {
    return <Achievements onBack={() => setCurrentPage(null)} />;
  }

  const level = user?.odTrainerLevel || 1;
  const xp = user?.odTrainerXp || 0;
  const xpFloor = user?.odXpForCurrentLevel || 0;
  const xpNext = user?.odXpForNextLevel ?? null;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Bar title="Me" sub={username} />

      <div className="ds-lcd ds-scroll" style={{ flex: 1, minHeight: 0, padding: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <NotificationPrompt userId={user?.odUserId || null} />

        <Window title="Trainer card" pad={false}>
          <div style={{ display: 'flex', gap: 10, padding: 10, alignItems: 'flex-start' }}>
            <button
              onClick={() => setCurrentPage('profilePic')}
              title="Change picture"
              style={{ background: 'none', border: 0, padding: 0, flex: 'none' }}
            >
              <Pic src={profilePic} size={72} />
            </button>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 20, color: nameColor, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {username}
              </div>
              {status && <div className="ds-small ds-muted" style={{ marginTop: 2 }}>{status}</div>}
              {title && <div style={{ marginTop: 6 }}><Chip>{title}</Chip></div>}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderTop: '1px dashed #c5ccd6' }}>
            <div className="ds-stat" style={{ borderBottom: 0, borderRight: '1px dashed #c5ccd6' }}>
              <span className="ds-small ds-muted">Coins</span>
              <b>{user?.odCoins || 0}</b>
            </div>
            <div className="ds-stat" style={{ borderBottom: 0 }}>
              <span className="ds-small ds-muted">Level</span>
              <b>{level}</b>
            </div>
          </div>
          <div style={{ padding: '6px 10px 10px', borderTop: '1px dashed #c5ccd6' }}>
            <div className="ds-small ds-muted" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span>XP</span>
              <span>{xpNext === null ? `${xp} (max level)` : `${xp - xpFloor} / ${xpNext - xpFloor}`}</span>
            </div>
            <Progress value={xpNext === null ? 1 : xp - xpFloor} max={xpNext === null ? 1 : xpNext - xpFloor} />
          </div>
        </Window>

        <Window title="Stats" pad={false}>
          <Stat label="Reactions" value={user?.odReactions || 0} />
          <Stat label="Questions" value={user?.odQuestions || 0} />
          <Stat label="Drawings" value={user?.odDrawings || 0} />
          <Stat label="Drinks" value={user?.odDrinksTotal || 0} />
          <Stat label="Pokémon caught" value={`${pokemonCaught} / 386`} />
        </Window>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Key wide big icon="edit" onClick={() => setCurrentPage('profileEditor')}>Edit Profile</Key>
          <Key wide big icon="trophy" onClick={() => setCurrentPage('achievements')}>Achievements</Key>
          <Key wide big icon="cog" onClick={() => setCurrentPage('settings')}>Settings</Key>
        </div>

        <div style={{ marginTop: 'auto', paddingTop: 8 }}>
          <Key wide kind="danger" icon="logout" onClick={leave}>Log out</Key>
        </div>
      </div>
    </div>
  );
}
