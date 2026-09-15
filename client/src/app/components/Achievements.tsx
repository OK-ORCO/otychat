import { useSocket, AchievementDef } from '../../contexts/SocketContext';
import { Bar, Window, Chip, Row, Progress, Icon } from './ds';

interface AchievementsProps {
  onBack: () => void;
}

// Milestone achievements whose progress can be read off a stat counter.
const PROGRESS_TARGETS: Record<string, { stat: string; total: number }> = {
  reactions_10: { stat: 'reactions', total: 10 },
  reactions_50: { stat: 'reactions', total: 50 },
  reactions_100: { stat: 'reactions', total: 100 },
  questions_5: { stat: 'questions', total: 5 },
  questions_20: { stat: 'questions', total: 20 },
  pokemon_5: { stat: 'pokemon', total: 5 },
  pokemon_20: { stat: 'pokemon', total: 20 },
  drinks_3: { stat: 'drinks', total: 3 },
  drinks_5: { stat: 'drinks', total: 5 },
  drinks_10: { stat: 'drinks', total: 10 },
};

export default function Achievements({ onBack }: AchievementsProps) {
  const { achievementData } = useSocket();
  const unlockedIds = new Set(achievementData.unlocked.map(u => u.id));

  const unlocked = achievementData.achievements.filter(a => unlockedIds.has(a.id));
  const locked = achievementData.achievements.filter(a => !unlockedIds.has(a.id));

  const progressFor = (a: AchievementDef) => {
    const target = PROGRESS_TARGETS[a.id];
    if (!target) return undefined;
    const current = achievementData.progress[target.stat]?.current || 0;
    return { current: Math.min(current, target.total), total: target.total };
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Bar
        title="Achievements"
        sub={`${unlocked.length} / ${achievementData.achievements.length}`}
        left={<button onClick={onBack} title="Back"><Icon name="back" size={16} /></button>}
      />

      <div className="ds-lcd ds-scroll" style={{ flex: 1, minHeight: 0, padding: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {achievementData.achievements.length === 0 && (
          <div className="ds-muted" style={{ textAlign: 'center', padding: '40px 0', fontSize: 13 }}>Loading.</div>
        )}

        {unlocked.length > 0 && (
          <Window title="Unlocked" pad={false}>
            {unlocked.map(a => (
              <AchievementRow key={a.id} achievement={a} unlocked />
            ))}
          </Window>
        )}

        {locked.length > 0 && (
          <Window title="Locked" grey pad={false}>
            {locked.map(a => (
              <AchievementRow key={a.id} achievement={a} unlocked={false} progress={progressFor(a)} />
            ))}
          </Window>
        )}
      </div>
    </div>
  );
}

function AchievementRow({ achievement, unlocked, progress }: { achievement: AchievementDef; unlocked: boolean; progress?: { current: number; total: number } }) {
  const reward = [
    `${achievement.reward} coins`,
    achievement.title ? `"${achievement.title}" title` : null
  ].filter(Boolean).join(' + ');

  return (
    <Row>
      <span style={{ width: 20, fontSize: 16, lineHeight: '20px', textAlign: 'center', flex: 'none', alignSelf: 'flex-start' }}>
        {achievement.icon}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: unlocked ? undefined : 'var(--ds-muted)' }}>{achievement.name}</div>
        <div className="ds-small ds-muted">{achievement.description}</div>
        <div className="ds-small" style={{ color: unlocked ? 'var(--ds-green)' : 'var(--ds-muted)' }}>Reward: {reward}</div>
        {progress && !unlocked && (
          <div style={{ marginTop: 6 }}>
            <Progress value={progress.current} max={progress.total} />
            <div className="ds-small ds-muted" style={{ marginTop: 2 }}>{progress.current} / {progress.total}</div>
          </div>
        )}
      </div>
      {unlocked && <Chip kind="live" style={{ alignSelf: 'flex-start' }}>done</Chip>}
    </Row>
  );
}
