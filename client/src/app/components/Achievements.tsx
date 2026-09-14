import { useSocket, AchievementDef } from '../../contexts/SocketContext';
import { UI_SPRITES } from '../data/pokemon-data';

function SpriteIcon({ src, size = 24 }: { src: string; size?: number }) {
  return <img src={src} alt="" style={{ width: size, height: size, imageRendering: 'pixelated' }} />;
}

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
    <div className="min-h-screen pb-20">
      <div className="p-4 flex items-center gap-3" style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)'
      }}>
        <button onClick={onBack} className="text-2xl" style={{ color: 'var(--accent-solid)', background: 'none', border: 'none' }}>
          ←
        </button>
        <h2 style={{ fontFamily: 'Fredoka, sans-serif', fontSize: '20px', fontWeight: '700', flex: 1, color: 'var(--text)' }}>
          <SpriteIcon src={UI_SPRITES.achievements} size={22} /> Achievements
        </h2>
        <div className="px-3 py-1 rounded-full" style={{
          background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
          color: 'white',
          fontFamily: 'Fredoka, sans-serif',
          fontSize: '13px',
          fontWeight: '700'
        }}>
          {unlocked.length}/{achievementData.achievements.length}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {achievementData.achievements.length === 0 && (
          <p className="text-center" style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Loading…</p>
        )}

        {unlocked.length > 0 && (
          <>
            <SectionLabel text="Unlocked" />
            <div className="space-y-3">
              {unlocked.map(a => (
                <AchievementCard key={a.id} achievement={a} unlocked />
              ))}
            </div>
          </>
        )}

        {locked.length > 0 && (
          <>
            <SectionLabel text="Locked" />
            <div className="space-y-3">
              {locked.map(a => (
                <AchievementCard key={a.id} achievement={a} unlocked={false} progress={progressFor(a)} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function SectionLabel({ text }: { text: string }) {
  return (
    <h3 className="px-2" style={{
      fontFamily: 'Fredoka, sans-serif',
      fontSize: '12px',
      color: 'var(--text-muted)',
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    }}>
      {text}
    </h3>
  );
}

function AchievementCard({ achievement, unlocked, progress }: { achievement: AchievementDef; unlocked: boolean; progress?: { current: number; total: number } }) {
  const reward = [
    `${achievement.reward} coins`,
    achievement.title ? `"${achievement.title}" title` : null
  ].filter(Boolean).join(' + ');

  return (
    <div className="p-4 rounded-2xl" style={{
      background: 'white',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
      border: unlocked ? '2px solid #10b981' : '2px solid transparent',
      opacity: unlocked ? 1 : 0.85
    }}>
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0" style={{
          background: unlocked ? 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)' : 'var(--bg-secondary)',
          filter: unlocked ? 'none' : 'grayscale(1)'
        }}>
          {achievement.icon}
        </div>
        <div className="flex-1 min-w-0">
          <h4 style={{ fontFamily: 'Fredoka, sans-serif', fontSize: '15px', fontWeight: '700', color: 'var(--text)' }}>
            {achievement.name}
          </h4>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
            {achievement.description}
          </p>
          <p style={{ fontSize: '12px', color: '#8b5cf6', marginTop: '4px', fontWeight: 600 }}>
            Reward: {reward}
          </p>

          {progress && !unlocked && (
            <div className="mt-3">
              <div className="flex justify-between mb-1" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                <span>Progress</span>
                <span style={{ fontFamily: 'Fredoka, sans-serif', fontWeight: 700 }}>{progress.current}/{progress.total}</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-secondary)' }}>
                <div
                  className="h-full transition-all"
                  style={{
                    background: 'linear-gradient(90deg, #ec4899 0%, #8b5cf6 100%)',
                    width: `${(progress.current / progress.total) * 100}%`
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
