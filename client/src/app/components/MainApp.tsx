import { useState } from 'react';
import { useSocket } from '../../contexts/SocketContext';
import ReactTab from './tabs/ReactTab';
import DMsTab from './tabs/DMsTab';
import FeedTab from './tabs/FeedTab';
import MeTab from './tabs/MeTab';
import PokemonTab from './tabs/PokemonTab';
import FunTab from './tabs/FunTab';
import { EmergencyInviteModal } from './PopcornEmergency';
import AwardsSheet from './AwardsSheet';
import NoticeToast from './NoticeToast';
import { Icon } from './ds';

type Tab = 'feed' | 'react' | 'pokemon' | 'dms' | 'fun' | 'me';

interface MainAppProps {
  username: string;
}

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'feed', label: 'FEED', icon: 'home' },
  { id: 'react', label: 'CHAT', icon: 'chat' },
  { id: 'pokemon', label: 'MON', icon: 'pokeball' },
  { id: 'dms', label: 'DM', icon: 'mail' },
  { id: 'fun', label: 'FUN', icon: 'star' },
  { id: 'me', label: 'ME', icon: 'person' },
];

export default function MainApp({ username }: MainAppProps) {
  const { unreadDMCount, emergency, activePokemon, poll, awards } = useSocket();
  const [activeTab, setActiveTab] = useState<Tab>('feed');
  const [dmTarget, setDmTarget] = useState<string | null>(null);

  const openDM = (contactName: string) => {
    setDmTarget(contactName);
    setActiveTab('dms');
  };

  const badges: Partial<Record<Tab, string>> = {};
  if (unreadDMCount > 0) badges.dms = String(unreadDMCount);
  if (activePokemon && activeTab !== 'pokemon') badges.pokemon = '!';
  if (emergency?.role === 'host') badges.fun = '!';
  else if (poll && !poll.closed && activeTab !== 'fun') badges.fun = '?';

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        {activeTab === 'feed' && <FeedTab />}
        {activeTab === 'react' && <ReactTab username={username} onOpenDM={openDM} />}
        {activeTab === 'pokemon' && <PokemonTab />}
        {activeTab === 'dms' && (
          <DMsTab username={username} openContact={dmTarget} onOpened={() => setDmTarget(null)} />
        )}
        {activeTab === 'fun' && <FunTab />}
        {activeTab === 'me' && <MeTab username={username} />}
      </div>

      <nav className="ds-tabbar">
        {TABS.map(t => (
          <button key={t.id} className={`ds-tab ${activeTab === t.id ? 'on' : ''}`} onClick={() => setActiveTab(t.id)}>
            <Icon name={t.icon} size={18} />
            <span>{t.label}</span>
            {badges[t.id] && <span className="ds-badge">{badges[t.id]}</span>}
          </button>
        ))}
      </nav>

      <NoticeToast />
      {awards && <AwardsSheet />}
      {emergency?.role === 'invitee' && <EmergencyInviteModal />}
    </div>
  );
}
