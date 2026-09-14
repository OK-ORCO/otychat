import { useState } from 'react';
import { useSocket } from '../../contexts/SocketContext';
import ReactTab from './tabs/ReactTab';
import DMsTab from './tabs/DMsTab';
import FeedTab from './tabs/FeedTab';
import MeTab from './tabs/MeTab';
import PokemonTab from './tabs/PokemonTab';
import FunTab from './tabs/FunTab';
import AnimatedBackground from './AnimatedBackground';
import { EmergencyInviteModal } from './PopcornEmergency';
import AwardsSheet from './AwardsSheet';
import NoticeToast from './NoticeToast';
import { UI_SPRITES } from '../data/pokemon-data';

type Tab = 'feed' | 'react' | 'pokemon' | 'dms' | 'fun' | 'me';
type Theme = 'waves' | 'zigzag' | 'dots' | 'bubbles' | 'gradient';

interface MainAppProps {
  username: string;
}

export default function MainApp({ username }: MainAppProps) {
  const { unreadDMCount, user, emergency, activePokemon, poll, awards } = useSocket();
  const profilePic = user?.odProfilePic || '👤';
  const [activeTab, setActiveTab] = useState<Tab>('feed');
  const [dmTarget, setDmTarget] = useState<string | null>(null);
  const [backgroundTheme, setBackgroundTheme] = useState<Theme>('gradient');

  const openDM = (contactName: string) => {
    setDmTarget(contactName);
    setActiveTab('dms');
  };

  const hostingEmergency = emergency?.role === 'host';
  const funBadge = hostingEmergency ? '!' : poll && !poll.closed ? '📊' : undefined;

  return (
    <div className="h-screen flex flex-col relative" style={{
      color: 'var(--text)',
      fontFamily: 'Nunito, sans-serif'
    }}>
      <AnimatedBackground pattern={backgroundTheme} />

      <div className="flex-1 overflow-y-auto pb-12 relative z-10">
        {activeTab === 'feed' && <FeedTab />}
        {activeTab === 'react' && <ReactTab username={username} onOpenDM={openDM} />}
        {activeTab === 'pokemon' && <PokemonTab />}
        {activeTab === 'dms' && (
          <DMsTab
            username={username}
            openContact={dmTarget}
            onOpened={() => setDmTarget(null)}
          />
        )}
        {activeTab === 'fun' && <FunTab />}
        {activeTab === 'me' && (
          <MeTab
            username={username}
            onThemeChange={(t) => setBackgroundTheme(t as Theme)}
            currentTheme={backgroundTheme}
          />
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 flex p-1 gap-1 z-20" style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 -4px 16px rgba(0, 0, 0, 0.1)'
      }}>
        <TabButton icon={UI_SPRITES.feed} label="Feed" isSprite active={activeTab === 'feed'} onClick={() => setActiveTab('feed')} />
        <TabButton icon={UI_SPRITES.react} label="Chat" isSprite active={activeTab === 'react'} onClick={() => setActiveTab('react')} />
        <TabButton
          icon="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png"
          label="Pokémon"
          active={activeTab === 'pokemon'}
          badge={activePokemon && activeTab !== 'pokemon' ? '!' : undefined}
          onClick={() => setActiveTab('pokemon')}
        />
        <TabButton
          icon={UI_SPRITES.dms}
          label="DMs"
          isSprite
          active={activeTab === 'dms'}
          badge={unreadDMCount > 0 ? unreadDMCount : undefined}
          onClick={() => setActiveTab('dms')}
        />
        <TabButton
          icon="🍿"
          label="Fun"
          active={activeTab === 'fun'}
          badge={funBadge}
          onClick={() => setActiveTab('fun')}
        />
        <TabButton icon={profilePic} label="Me" active={activeTab === 'me'} onClick={() => setActiveTab('me')} isProfilePic />
      </div>

      <NoticeToast />
      {awards && <AwardsSheet />}
      {emergency?.role === 'invitee' && <EmergencyInviteModal />}
    </div>
  );
}

interface TabButtonProps {
  icon: string;
  label: string;
  active: boolean;
  badge?: number | string;
  isProfilePic?: boolean;
  isSprite?: boolean;
  onClick: () => void;
}

function TabButton({ icon, label, active, badge, isProfilePic, isSprite, onClick }: TabButtonProps) {
  const isImageUrl = icon.startsWith('data:') || icon.startsWith('http') || icon.startsWith('/');

  return (
    <button
      onClick={onClick}
      className="flex-1 flex flex-col items-center justify-center py-1.5 px-0.5 relative transition-all transform hover:scale-105 active:scale-95"
      style={{
        background: active
          ? 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)'
          : 'transparent',
        color: active ? 'white' : 'var(--text-muted)',
        borderRadius: '12px',
        boxShadow: active ? '0 4px 12px rgba(236, 72, 153, 0.3)' : 'none',
        minWidth: 0
      }}
    >
      {isSprite || isImageUrl ? (
        isProfilePic ? (
          <div
            className="w-6 h-6 rounded-full overflow-hidden"
            style={{
              border: active ? '2px solid white' : '2px solid var(--text-muted)',
              boxShadow: active ? '0 2px 8px rgba(0,0,0,0.2)' : 'none'
            }}
          >
            <img src={icon} alt="Profile" className="w-full h-full object-cover" />
          </div>
        ) : (
          <img
            src={icon}
            alt={label}
            className="w-6 h-6 object-contain"
            style={{ imageRendering: 'pixelated' }}
          />
        )
      ) : (
        <span className="text-xl leading-6">{icon}</span>
      )}
      <span style={{
        fontFamily: 'Fredoka, sans-serif',
        fontWeight: '600',
        fontSize: '10px'
      }}>
        {label}
      </span>
      {badge && (
        <span className="absolute -top-1 -right-0.5 px-1.5 py-0.5 rounded-full text-xs" style={{
          background: 'var(--danger)',
          color: 'white',
          fontFamily: 'Fredoka, sans-serif',
          fontSize: '10px',
          fontWeight: '700',
          minWidth: '18px',
          textAlign: 'center',
          boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)'
        }}>
          {badge}
        </span>
      )}
    </button>
  );
}
