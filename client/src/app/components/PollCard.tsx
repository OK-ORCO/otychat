import { useState } from 'react';
import { useSocket } from '../../contexts/SocketContext';
import PollHistory from './PollHistory';
import { Window, Key, Chip, Field, Progress, Icon } from './ds';

/**
 * Lives on the Fun tab. Shows the live poll with tap-to-vote, or a small form
 * to start one. Results also render on the big screen.
 */
export default function PollCard() {
  const { user, poll, myPollVote, createPoll, votePoll, closePoll, clearPoll } = useSocket();
  const [composing, setComposing] = useState(false);
  const [history, setHistory] = useState(false);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);

  const isMine = !!poll && poll.by === user?.odName;
  const filled = options.map(o => o.trim()).filter(Boolean);
  const canSend = question.trim().length > 0 && filled.length >= 2;

  const send = () => {
    if (!canSend) return;
    createPoll(question.trim(), filled);
    setComposing(false);
    setQuestion('');
    setOptions(['', '']);
  };

  const title = (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <Icon name="level" size={14} />
      Poll
    </span>
  );

  const historyKey = (
    <button onClick={() => setHistory(true)} style={{ background: 'none', border: 0, color: '#fff', padding: 0, display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
      <Icon name="clock" size={13} /> past polls
    </button>
  );

  return (
    <Window
      title={title}
      right={
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {poll && <Chip kind={poll.closed ? undefined : 'live'}>{poll.closed ? 'closed' : 'live'}</Chip>}
          {historyKey}
        </span>
      }
    >
      {history && <PollHistory onClose={() => setHistory(false)} />}
      {poll ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div>
            <div style={{ fontSize: 16, lineHeight: 1.3 }}>{poll.question}</div>
            <div className="ds-small ds-muted">
              by {poll.by} · {poll.total} vote{poll.total === 1 ? '' : 's'}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {poll.options.map((o, i) => {
              const pct = poll.total ? Math.round((o.count / poll.total) * 100) : 0;
              const chosen = myPollVote === i;
              return (
                <Key
                  key={i}
                  wide
                  on={chosen}
                  onClick={() => !poll.closed && votePoll(i)}
                  disabled={poll.closed}
                  style={{ padding: '6px 10px', color: poll.closed ? 'var(--ds-ink)' : undefined }}
                >
                  <span style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%', textAlign: 'left' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {chosen && <Icon name="check" size={14} />}
                      <span style={{ flex: 1, minWidth: 0 }}>{o.text}</span>
                      <span className="ds-small ds-muted" style={{ whiteSpace: 'nowrap' }}>{o.count} · {pct}%</span>
                    </span>
                    <Progress value={pct} max={100} />
                  </span>
                </Key>
              );
            })}
          </div>

          {isMine && (
            !poll.closed
              ? <Key wide icon="check" onClick={() => closePoll()}>Close poll</Key>
              : <Key wide icon="tv" onClick={() => clearPoll()}>Take it off the screen</Key>
          )}
        </div>
      ) : !composing ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div className="ds-small ds-muted">
            Ask the room something. Everyone votes from their phone and the results show on the big screen.
          </div>
          <Key kind="primary" wide onClick={() => setComposing(true)}>Start a poll</Key>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Field
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Question"
            maxLength={120}
          />
          {options.map((o, i) => (
            <Field
              key={i}
              type="text"
              value={o}
              onChange={(e) => setOptions(prev => prev.map((p, j) => (j === i ? e.target.value : p)))}
              placeholder={`Option ${i + 1}`}
              maxLength={60}
            />
          ))}
          {options.length < 6 && (
            <Key wide onClick={() => setOptions(prev => [...prev, ''])}>+ Add option</Key>
          )}
          <div style={{ display: 'flex', gap: 6 }}>
            <Key style={{ flex: 1 }} onClick={() => { setComposing(false); setQuestion(''); setOptions(['', '']); }}>Cancel</Key>
            <Key kind="primary" style={{ flex: 1 }} onClick={send} disabled={!canSend}>Ask the room</Key>
          </div>
        </div>
      )}
    </Window>
  );
}
