import { useState } from 'react';
import { useSocket } from '../../contexts/SocketContext';

/**
 * Lives on the Fun tab. Shows the live poll with tap-to-vote, or a small form
 * to start one. Results also render on the big screen.
 */
export default function PollCard() {
  const { user, poll, myPollVote, createPoll, votePoll, closePoll, clearPoll } = useSocket();
  const [composing, setComposing] = useState(false);
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

  return (
    <div className="p-5 rounded-3xl" style={{ background: 'white', boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)' }}>
      <div className="flex items-center justify-between">
        <h3 style={{ fontFamily: 'Fredoka, sans-serif', fontSize: '16px', fontWeight: '700', color: 'var(--text)' }}>
          📊 Poll
        </h3>
        {poll && (
          <span className="px-2 py-0.5 rounded-full" style={{
            background: poll.closed ? 'var(--bg-secondary)' : 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
            color: poll.closed ? 'var(--text-muted)' : 'white',
            fontFamily: 'Fredoka, sans-serif',
            fontSize: '11px',
            fontWeight: '700'
          }}>
            {poll.closed ? 'Closed' : 'Live'}
          </span>
        )}
      </div>

      {poll ? (
        <div className="mt-3">
          <p style={{ fontFamily: 'Fredoka, sans-serif', fontSize: '17px', fontWeight: '700', color: 'var(--text)', lineHeight: 1.3 }}>
            {poll.question}
          </p>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
            by {poll.by} · {poll.total} vote{poll.total === 1 ? '' : 's'}
          </p>
          <div className="mt-3 space-y-2">
            {poll.options.map((o, i) => {
              const pct = poll.total ? Math.round((o.count / poll.total) * 100) : 0;
              const chosen = myPollVote === i;
              return (
                <button
                  key={i}
                  onClick={() => !poll.closed && votePoll(i)}
                  disabled={poll.closed}
                  className="w-full relative overflow-hidden rounded-xl text-left transition-all active:scale-95"
                  style={{
                    background: 'var(--bg-secondary)',
                    border: chosen ? '2px solid #8b5cf6' : '2px solid transparent',
                    padding: '10px 14px',
                    cursor: poll.closed ? 'default' : 'pointer'
                  }}
                >
                  <div className="absolute left-0 top-0 bottom-0" style={{
                    width: `${pct}%`,
                    background: 'linear-gradient(90deg, rgba(236,72,153,0.25) 0%, rgba(139,92,246,0.25) 100%)',
                    transition: 'width 0.3s ease'
                  }} />
                  <div className="relative flex items-center justify-between">
                    <span style={{ fontFamily: 'Fredoka, sans-serif', fontSize: '14px', fontWeight: '600', color: 'var(--text)' }}>
                      {chosen ? '✓ ' : ''}{o.text}
                    </span>
                    <span style={{ fontFamily: 'Fredoka, sans-serif', fontSize: '13px', fontWeight: '700', color: '#8b5cf6' }}>
                      {pct}%
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
          {isMine && (
            <div className="flex gap-2 mt-3">
              {!poll.closed ? (
                <button
                  onClick={() => closePoll()}
                  className="flex-1 py-3 rounded-2xl"
                  style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', border: 'none', fontFamily: 'Fredoka, sans-serif', fontSize: '14px', fontWeight: '700' }}
                >
                  Close poll
                </button>
              ) : (
                <button
                  onClick={() => clearPoll()}
                  className="flex-1 py-3 rounded-2xl"
                  style={{ background: 'var(--bg-secondary)', color: 'var(--text)', border: 'none', fontFamily: 'Fredoka, sans-serif', fontSize: '14px', fontWeight: '600' }}
                >
                  Take it off the screen
                </button>
              )}
            </div>
          )}
        </div>
      ) : !composing ? (
        <>
          <p className="mt-1" style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Ask the room something. Everyone votes from their phone, results show on the big screen.
          </p>
          <button
            onClick={() => setComposing(true)}
            className="w-full mt-3 py-3 rounded-2xl transition-all active:scale-95"
            style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)', color: 'white', border: 'none', fontFamily: 'Fredoka, sans-serif', fontSize: '15px', fontWeight: '700', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)' }}
          >
            Start a poll
          </button>
        </>
      ) : (
        <div className="mt-3 space-y-2">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Question"
            maxLength={120}
            className="w-full px-4 py-3 outline-none"
            style={{ background: 'var(--bg-secondary)', borderRadius: '14px', border: 'none', fontFamily: 'Nunito, sans-serif', fontSize: '15px' }}
          />
          {options.map((o, i) => (
            <input
              key={i}
              type="text"
              value={o}
              onChange={(e) => setOptions(prev => prev.map((p, j) => (j === i ? e.target.value : p)))}
              placeholder={`Option ${i + 1}`}
              maxLength={60}
              className="w-full px-4 py-3 outline-none"
              style={{ background: 'var(--bg-secondary)', borderRadius: '14px', border: 'none', fontFamily: 'Nunito, sans-serif', fontSize: '15px' }}
            />
          ))}
          {options.length < 6 && (
            <button
              onClick={() => setOptions(prev => [...prev, ''])}
              className="w-full py-2 rounded-xl"
              style={{ background: 'transparent', color: '#8b5cf6', border: '2px dashed var(--bg-secondary)', fontFamily: 'Fredoka, sans-serif', fontSize: '13px', fontWeight: '600' }}
            >
              + Add option
            </button>
          )}
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => { setComposing(false); setQuestion(''); setOptions(['', '']); }}
              className="flex-1 py-3 rounded-2xl"
              style={{ background: 'var(--bg-secondary)', color: 'var(--text)', border: 'none', fontFamily: 'Fredoka, sans-serif', fontSize: '14px', fontWeight: '600' }}
            >
              Cancel
            </button>
            <button
              onClick={send}
              disabled={!canSend}
              className="flex-1 py-3 rounded-2xl transition-all active:scale-95"
              style={{
                background: canSend ? 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)' : 'var(--bg-secondary)',
                color: canSend ? 'white' : 'var(--text-muted)',
                border: 'none',
                fontFamily: 'Fredoka, sans-serif',
                fontSize: '14px',
                fontWeight: '700'
              }}
            >
              Ask the room
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
