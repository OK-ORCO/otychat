import { useEffect } from 'react';
import { useSocket } from '../../contexts/SocketContext';
import { Window, Scrim, Progress, Icon, formatTime } from './ds';

function dayLabel(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/** Bottom sheet listing every poll that closed with at least one vote, newest first. */
export default function PollHistory({ onClose }: { onClose: () => void }) {
  const { pollHistory, requestPollHistory } = useSocket();

  useEffect(() => {
    requestPollHistory();
  }, [requestPollHistory]);

  return (
    <Scrim onClose={onClose} bottom>
      <Window
        pad={false}
        className="ds-sheet"
        title={<span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Icon name="clock" size={14} />Past polls</span>}
        right={<button onClick={onClose} style={{ background: 'none', border: 0, color: '#fff', fontSize: 14 }}>✕</button>}
      >
        <div className="ds-scroll" style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
          {pollHistory === null ? (
            <div className="ds-muted" style={{ textAlign: 'center', padding: '24px 0', fontSize: 13 }}>Loading.</div>
          ) : pollHistory.length === 0 ? (
            <div className="ds-muted" style={{ textAlign: 'center', padding: '24px 0', fontSize: 13 }}>
              No polls have closed yet. Results land here once a poll closes with votes.
            </div>
          ) : (
            pollHistory.map(p => {
              const winner = Math.max(...p.options.map(o => o.count));
              return (
                <div key={p.id} className="ds-window" style={{ boxShadow: 'none' }}>
                  <div style={{ padding: '6px 8px 4px' }}>
                    <div style={{ fontSize: 15, lineHeight: 1.3 }}>{p.question}</div>
                    <div className="ds-small ds-muted">
                      {p.by} · {p.total} vote{p.total === 1 ? '' : 's'} · {dayLabel(p.closedAt)} {formatTime(p.closedAt)}{p.room ? ` · ${p.room}` : ''}
                    </div>
                  </div>
                  <div style={{ padding: '0 8px 8px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {p.options.map((o, i) => {
                      const pct = p.total ? Math.round((o.count / p.total) * 100) : 0;
                      const won = o.count === winner && winner > 0;
                      return (
                        <div key={i}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                            {won && <Icon name="trophy" size={12} />}
                            <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.text}</span>
                            <span className="ds-small ds-muted" style={{ whiteSpace: 'nowrap' }}>{o.count} · {pct}%</span>
                          </div>
                          <Progress value={pct} max={100} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Window>
    </Scrim>
  );
}
