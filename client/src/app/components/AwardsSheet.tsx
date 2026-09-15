import { useSocket } from '../../contexts/SocketContext';
import { Bar, Window, Key, Chip, Pic } from './ds';

// "1 reactions" reads badly; single-word labels drop the s at one
function countLabel(value: number, label: string) {
  return value === 1 && !label.includes(' ') && label.endsWith('s') ? label.slice(0, -1) : label;
}

/**
 * Full-screen sheet every phone gets when the host runs the awards. The big
 * screen plays them one at a time; here you get the whole list with your own
 * wins highlighted. Closing it only hides it locally.
 */
export default function AwardsSheet() {
  const { awards, user, dismissAwards, endAwards } = useSocket();
  if (!awards) return null;

  const mine = awards.awards.filter(a => a.username === user?.odName);
  const isHost = awards.by === user?.odName;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', flexDirection: 'column', background: 'var(--ds-bg)' }}>
      <Bar
        title="Tonight's awards"
        sub={mine.length > 0 ? `you won ${mine.length}` : 'watch the big screen'}
      />

      <div className="ds-lcd ds-scroll" style={{ flex: 1, minHeight: 0, padding: 10 }}>
        <Window pad={false}>
          <div className="ds-list">
            {awards.awards.map(a => {
              const won = a.username === user?.odName;
              return (
                <div
                  key={a.key}
                  className="ds-row"
                  style={{ background: won ? 'var(--ds-yellow)' : undefined, alignItems: 'center' }}
                >
                  <span style={{ width: 24, flex: 'none', textAlign: 'center', fontSize: 18, lineHeight: 1 }}>{a.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="ds-small ds-muted" style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>{a.title}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.username}</span>
                      {won && <Chip kind="blue">you</Chip>}
                    </div>
                    {a.detail && (
                      <div className="ds-small" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {a.key === 'question' ? `"${a.detail}"` : a.detail}
                      </div>
                    )}
                    {a.value !== null && a.label && (
                      <div className="ds-small ds-muted">{a.value} {countLabel(a.value, a.label)}</div>
                    )}
                  </div>
                  {a.sprite ? (
                    <img className="px" src={a.sprite} alt="" style={{ width: 40, height: 40, flex: 'none' }} />
                  ) : (
                    <Pic src={a.profilePic} size={32} style={{ flex: 'none' }} />
                  )}
                </div>
              );
            })}
          </div>
        </Window>
      </div>

      <div className="ds-tray" style={{ flex: 'none', padding: 10, paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 10px)', display: 'flex', gap: 6 }}>
        <Key big style={{ flex: 1 }} onClick={dismissAwards}>Close</Key>
        {isHost && (
          <Key kind="primary" big style={{ flex: 1 }} onClick={() => endAwards()}>End ceremony</Key>
        )}
      </div>
    </div>
  );
}
