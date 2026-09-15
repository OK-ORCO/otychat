import { useState, useRef, useEffect } from 'react';
import { useSocket } from '../../../contexts/SocketContext';
import MessageComposer from '../MessageComposer';
import UserProfile from '../UserProfile';
import EmojiPicker from '../EmojiPicker';
import { getEmojiUrl } from '../../data/emoji-data';
import { Bar, Note, Chip, Key, Window, Scrim, Icon, formatTime } from '../ds';

interface ReactTabProps {
  username: string;
  onOpenDM: (username: string) => void;
}

/**
 * The DS: top screen is the note feed, bottom screen is the paper you write on.
 */
export default function ReactTab({ username, onOpenDM }: ReactTabProps) {
  const {
    user,
    onlineCount,
    chatMessages,
    queueMessages,
    displayedMessageId,
    sendReaction,
    sendChat,
    sendToQueue,
    upvoteChat,
    dismissFromQueue,
    clearQueue,
    showOnDisplay,
    hideFromDisplay
  } = useSocket();
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [showQueue, setShowQueue] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const feedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (feedRef.current) feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }, 120);
    return () => clearTimeout(timer);
  }, [chatMessages]);

  const rankedQueue = [...queueMessages].sort((a, b) =>
    b.odUpvotes - a.odUpvotes || new Date(a.odCreatedAt).getTime() - new Date(b.odCreatedAt).getTime()
  );
  const nextUp = rankedQueue.find(m => m.odId !== displayedMessageId) || null;

  if (selectedUser) {
    return (
      <UserProfile
        username={selectedUser}
        onBack={() => setSelectedUser(null)}
        onDM={() => { const target = selectedUser; setSelectedUser(null); onOpenDM(target); }}
      />
    );
  }

  const handleEmojiSelect = (emoji: string, isCustom: boolean) => {
    sendReaction(isCustom ? getEmojiUrl(emoji) : emoji);
  };

  const send = (fn: typeof sendChat) => (data: { drawing?: string; text?: string; image?: string }) => {
    if (data.drawing) fn(data.text || '', 'drawing', data.drawing);
    else if (data.image) fn(data.text || '', 'image', data.image);
    else if (data.text) fn(data.text, 'text');
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Bar
        title="Chat Room A"
        sub={`${onlineCount} in room`}
        right={
          <button onClick={() => setShowQueue(true)} title="Question queue">
            <Icon name="list" size={16} />
            <span>Q{queueMessages.length > 0 ? ` ${queueMessages.length}` : ''}</span>
          </button>
        }
      />

      {/* reaction strip */}
      <div style={{ flex: 'none', padding: '4px 6px', background: 'var(--ds-panel)', borderBottom: '1px solid var(--ds-line)' }}>
        <EmojiPicker onSelect={handleEmojiSelect} />
      </div>

      {/* top screen: notes */}
      <div ref={feedRef} className="ds-lcd ds-scroll" style={{ flex: 1, minHeight: 0, padding: '8px 8px 4px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {chatMessages.length === 0 ? (
          <div className="ds-muted" style={{ textAlign: 'center', padding: '40px 0', fontSize: 13 }}>
            Nothing on the board yet. Write something below.
          </div>
        ) : (
          chatMessages.map(item => {
            const live = displayedMessageId === item.odId;
            const mine = item.odUsername === username;
            return (
              <Note
                key={item.odId}
                name={item.odUsername}
                time={formatTime(item.odCreatedAt)}
                color={item.odColor}
                onName={() => setSelectedUser(item.odUsername)}
                image={item.odImageData ? undefined : null}
                foot={(item.odInQueue || item.odUpvotes > 0 || live) ? (
                  <>
                    {item.odInQueue && <Chip kind="q">IN QUEUE</Chip>}
                    {live && <Chip kind="live">ON SCREEN</Chip>}
                    <button className="ds-chip" onClick={() => upvoteChat(item.odId)} style={{ background: item.odHasUpvoted ? 'var(--ds-blue)' : undefined, color: item.odHasUpvoted ? '#fff' : undefined }}>
                      <Icon name="star" size={11} /> {item.odUpvotes}
                    </button>
                  </>
                ) : (
                  <button className="ds-chip" onClick={() => upvoteChat(item.odId)}>
                    <Icon name="star" size={11} /> {item.odUpvotes}
                  </button>
                )}
              >
                {item.odImageData && (
                  <img
                    className="doodle"
                    src={item.odImageData}
                    alt=""
                    onClick={() => setLightbox(item.odImageData || null)}
                    style={{ cursor: 'zoom-in', ...(item.odType === 'image' ? { maxHeight: 200 } : {}) }}
                  />
                )}
                {item.odContent && <div className="txt" style={{ color: mine ? undefined : undefined }}>{item.odContent}</div>}
              </Note>
            );
          })
        )}
      </div>

      {/* bottom screen: paper */}
      <div className="ds-tray" style={{ flex: 'none', padding: 6 }}>
        <MessageComposer
          onSend={send(sendChat)}
          onSendToQueue={send(sendToQueue)}
          placeholder="Write or draw here"
          penColor={user?.odNameColor}
        />
      </div>

      {lightbox && (
        <Scrim onClose={() => setLightbox(null)}>
          <div className="ds-window" style={{ padding: 4, textAlign: 'center' }}>
            <img src={lightbox} alt="" style={{ maxWidth: '100%', maxHeight: '75vh', display: 'block', margin: '0 auto' }} />
            <div className="ds-small ds-muted" style={{ paddingTop: 4 }}>tap outside to close</div>
          </div>
        </Scrim>
      )}

      {showQueue && (
        <Scrim onClose={() => setShowQueue(false)} bottom>
          <Window
            pad={false}
            title={`Question queue (${queueMessages.length})`}
            right={<button onClick={() => setShowQueue(false)} style={{ background: 'none', border: 0, color: '#fff', fontSize: 14 }}>✕</button>}
            className="ds-sheet"
          >
            {queueMessages.length > 0 && (
              <div style={{ display: 'flex', gap: 6, padding: 8, borderBottom: '1px dashed #c5ccd6' }}>
                <Key kind="primary" style={{ flex: 1 }} onClick={() => nextUp && showOnDisplay(nextUp.odId)} disabled={!nextUp} icon="tv">
                  Show next{nextUp ? ` (${nextUp.odUpvotes})` : ''}
                </Key>
                {displayedMessageId && (
                  <Key style={{ flex: 1 }} onClick={() => dismissFromQueue(displayedMessageId)} icon="check">Done</Key>
                )}
                <Key kind="danger" onClick={() => setShowClearConfirm(true)} title="Clear the queue" icon="trash" sq />
              </div>
            )}

            <div className="ds-scroll" style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
              {queueMessages.length === 0 ? (
                <div className="ds-muted" style={{ textAlign: 'center', padding: '24px 0', fontSize: 13 }}>
                  Empty. Send a note with the Q key to put it here.
                </div>
              ) : (
                rankedQueue.map(item => {
                  const live = displayedMessageId === item.odId;
                  return (
                    <Note
                      key={item.odId}
                      name={item.odUsername}
                      color={live ? 'var(--ds-green)' : item.odColor}
                      image={item.odImageData || null}
                      text={item.odContent || null}
                      foot={
                        <>
                          {live && <Chip kind="live">ON SCREEN</Chip>}
                          <Chip><Icon name="star" size={11} /> {item.odUpvotes}</Chip>
                          <span style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
                            <Key
                              kind={live ? 'primary' : 'default'}
                              icon="tv"
                              style={{ minHeight: 24, padding: '0 6px', fontSize: 11 }}
                              onClick={() => (live ? hideFromDisplay() : showOnDisplay(item.odId))}
                            >
                              {live ? 'hide' : 'show'}
                            </Key>
                            <Key icon="x" style={{ minHeight: 24, padding: '0 6px' }} onClick={() => dismissFromQueue(item.odId)} title="Dismiss" />
                          </span>
                        </>
                      }
                    />
                  );
                })
              )}
            </div>
          </Window>
        </Scrim>
      )}

      {showClearConfirm && (
        <Scrim onClose={() => setShowClearConfirm(false)}>
          <Window title="Clear the queue?">
            <div style={{ marginBottom: 10 }}>All {queueMessages.length} items come off the queue. They stay in the chat.</div>
            <div style={{ display: 'flex', gap: 6 }}>
              <Key style={{ flex: 1 }} onClick={() => setShowClearConfirm(false)}>Keep</Key>
              <Key kind="danger" style={{ flex: 1 }} onClick={() => { clearQueue(); setShowClearConfirm(false); }}>Clear</Key>
            </div>
          </Window>
        </Scrim>
      )}
    </div>
  );
}
