import { useState } from 'react';
import { Bar, Window, Key, Row, Chip, Progress, Icon } from './ds';

interface TitleSelectorProps {
  onBack: () => void;
  onTitleChange: (title: string) => void;
  currentTitle?: string;
}

interface Title {
  id: string;
  emoji: string;
  name: string;
  description: string;
  unlocked: boolean;
  requirement?: string;
}

const AVAILABLE_TITLES: Title[] = [
  { id: 'none', emoji: '⚪', name: 'No Title', description: 'Display no title', unlocked: true },
  { id: 'emoji-enthusiast', emoji: '⭐', name: 'Emoji Enthusiast', description: 'Send 100+ emoji reactions', unlocked: true },
  { id: 'social-butterfly', emoji: '🦋', name: 'Social Butterfly', description: 'Send 50+ DMs', unlocked: true },
  { id: 'artist', emoji: '🎨', name: 'Artist', description: 'Create 25+ drawings', unlocked: true },
  { id: 'party-legend', emoji: '🎉', name: 'Party Legend', description: 'Log 20+ drinks', unlocked: true },
  { id: 'question-master', emoji: '❓', name: 'Question Master', description: 'Ask 15+ questions', unlocked: true },
  { id: 'pokemon-trainer', emoji: '⚡', name: 'Pokémon Trainer', description: 'Catch 10+ Pokémon', unlocked: true },
  { id: 'poke-master', emoji: '🏆', name: 'Poké Master', description: 'Catch 50+ Pokémon', unlocked: false, requirement: 'Catch 50 Pokémon' },
  { id: 'millionaire', emoji: '💰', name: 'Millionaire', description: 'Earn 10,000 coins', unlocked: false, requirement: 'Earn 10,000 coins' },
  { id: 'night-owl', emoji: '🦉', name: 'Night Owl', description: 'Active past 2 AM', unlocked: false, requirement: 'Be active past 2 AM' },
  { id: 'early-bird', emoji: '🐦', name: 'Early Bird', description: 'First to join 5 sessions', unlocked: false, requirement: 'First to join 5 sessions' },
  { id: 'kudos-king', emoji: '👑', name: 'Kudos King', description: 'Receive 100+ kudos', unlocked: false, requirement: 'Receive 100 kudos' },
  { id: 'doodle-deity', emoji: '✨', name: 'Doodle Deity', description: 'Create 100+ drawings', unlocked: false, requirement: 'Create 100 drawings' },
  { id: 'chatterbox', emoji: '💬', name: 'Chatterbox', description: 'Send 500+ messages', unlocked: false, requirement: 'Send 500 messages' },
  { id: 'trendsetter', emoji: '🌟', name: 'Trendsetter', description: 'Get 50+ upvotes on questions', unlocked: false, requirement: 'Get 50+ upvotes on questions' },
  { id: 'collector', emoji: '🎁', name: 'Collector', description: 'Buy 20+ shop items', unlocked: false, requirement: 'Buy 20 shop items' }
];

export default function TitleSelector({ onBack, onTitleChange, currentTitle = '⭐ Emoji Enthusiast' }: TitleSelectorProps) {
  const [selectedTitle, setSelectedTitle] = useState(currentTitle);
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all');

  const filteredTitles = AVAILABLE_TITLES.filter(title => {
    if (filter === 'unlocked') return title.unlocked;
    if (filter === 'locked') return !title.unlocked;
    return true;
  });

  const isCurrent = (title: Title) =>
    selectedTitle === `${title.emoji} ${title.name}` || (title.id === 'none' && !selectedTitle);

  const handleSelect = (title: Title) => {
    if (!title.unlocked) return;
    const titleText = title.id === 'none' ? '' : `${title.emoji} ${title.name}`;
    setSelectedTitle(titleText);
  };

  const handleSave = () => {
    onTitleChange(selectedTitle);
    onBack();
  };

  const unlockedCount = AVAILABLE_TITLES.filter(t => t.unlocked).length;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Bar
        left={<button onClick={onBack} title="Back"><Icon name="back" size={16} /></button>}
        title="Title"
      />
      <div className="ds-lcd ds-scroll" style={{ flex: 1, minHeight: 0, padding: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Window title="Current">
          {selectedTitle ? <Chip>{selectedTitle}</Chip> : <span className="ds-small ds-muted">No title selected</span>}
        </Window>

        <div style={{ display: 'flex', gap: 6 }}>
          {(['all', 'unlocked', 'locked'] as const).map(f => (
            <Key key={f} on={filter === f} onClick={() => setFilter(f)} style={{ flex: 1 }}>
              {f === 'all' ? 'All' : f === 'unlocked' ? 'Unlocked' : 'Locked'}
            </Key>
          ))}
        </div>

        <Window pad={false}>
          {filteredTitles.map(title => {
            const current = isCurrent(title);
            const body = (
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: title.unlocked ? undefined : 'var(--ds-faint)' }}>{title.name}</div>
                <div className="ds-small ds-muted">{title.unlocked ? title.description : title.requirement}</div>
              </div>
            );
            if (!title.unlocked) {
              return (
                <Row key={title.id} right={<Chip><Icon name="key" size={11} /> locked</Chip>}>
                  {body}
                </Row>
              );
            }
            return (
              <Row key={title.id} onClick={() => handleSelect(title)} right={current ? <Chip kind="blue">current</Chip> : ''}>
                {body}
              </Row>
            );
          })}
          {filteredTitles.length === 0 && (
            <div className="ds-small ds-muted" style={{ padding: 12, textAlign: 'center' }}>Nothing here.</div>
          )}
        </Window>

        <Window title="Unlocked">
          <div className="ds-small ds-muted" style={{ marginBottom: 4 }}>{unlockedCount} / {AVAILABLE_TITLES.length} titles</div>
          <Progress value={unlockedCount} max={AVAILABLE_TITLES.length} />
        </Window>

        <Key kind="primary" big wide icon="check" onClick={handleSave}>Save</Key>
      </div>
    </div>
  );
}
