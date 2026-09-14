import { useState, useRef, useEffect } from 'react';
import { useSocket } from '../../../contexts/SocketContext';
import { UI_SPRITES } from '../../data/pokemon-data';
import MessageComposer from '../MessageComposer';
import UserProfile from '../UserProfile';
import EmojiPicker from '../EmojiPicker';
import { getEmojiUrl } from '../../data/emoji-data';

interface ReactTabProps {
  username: string;
  onOpenDM: (username: string) => void;
}

export default function ReactTab({ username, onOpenDM }: ReactTabProps) {
  const {
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

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    const timer = setTimeout(() => {
      if (feedRef.current) {
        feedRef.current.scrollTop = feedRef.current.scrollHeight;
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [chatMessages]);

  // Scroll to bottom on initial mount
  useEffect(() => {
    const timer = setTimeout(() => {
      if (feedRef.current) {
        feedRef.current.scrollTop = feedRef.current.scrollHeight;
      }
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Sort messages chronologically (oldest first)
  const sortedMessages = [...chatMessages];

  // The presenter works the queue by popularity, then age
  const rankedQueue = [...queueMessages].sort((a, b) =>
    b.odUpvotes - a.odUpvotes || new Date(a.odCreatedAt).getTime() - new Date(b.odCreatedAt).getTime()
  );
  const nextUp = rankedQueue.find(m => m.odId !== displayedMessageId) || null;

  if (selectedUser) {
    return (
      <UserProfile
        username={selectedUser}
        onBack={() => setSelectedUser(null)}
        onDM={() => {
          const target = selectedUser;
          setSelectedUser(null);
          onOpenDM(target);
        }}
      />
    );
  }

  const handleEmojiSelect = (emoji: string, isCustom: boolean) => {
    // For custom emojis, send the URL; for unicode, send the emoji directly
    const emojiToSend = isCustom ? getEmojiUrl(emoji) : emoji;
    sendReaction(emojiToSend);
  };

  const handleSend = (data: { drawing?: string; text?: string; image?: string }) => {
    if (data.drawing) {
      sendChat(data.text || '', 'drawing', data.drawing);
    } else if (data.image) {
      sendChat(data.text || '', 'image', data.image);
    } else if (data.text) {
      sendChat(data.text, 'text');
    }
  };

  const handleSendToQueue = (data: { drawing?: string; text?: string; image?: string }) => {
    if (data.drawing) {
      sendToQueue(data.text || '', 'drawing', data.drawing);
    } else if (data.image) {
      sendToQueue(data.text || '', 'image', data.image);
    } else if (data.text) {
      sendToQueue(data.text, 'text');
    }
  };

  const handleUpvote = (id: string) => {
    upvoteChat(id);
  };

  const handleClearQueue = () => {
    clearQueue();
    setShowClearConfirm(false);
  };

  return (
    <div className="flex flex-col" style={{ height: 'calc(100dvh - 56px)' }}>
      {/* Emoji Reactions */}
      <div className="flex-shrink-0 p-3" style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)'
      }}>
        <EmojiPicker onSelect={handleEmojiSelect} />
      </div>

      {/* Chat Feed - This is the only scrolling area */}
      <div ref={feedRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        <div className="flex items-center justify-between px-2 mb-2">
          <h3 style={{
            fontFamily: 'Fredoka, sans-serif',
            fontSize: '12px',
            color: 'var(--text-muted)',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            Chat
          </h3>
          <button
            onClick={() => setShowQueue(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full transition-all hover:scale-105"
            style={{
              background: queueMessages.length > 0
                ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                : 'var(--bg-secondary)',
              color: queueMessages.length > 0 ? 'white' : 'var(--text)',
              fontFamily: 'Fredoka, sans-serif',
              fontSize: '12px',
              fontWeight: '600',
              border: 'none',
              cursor: 'pointer',
              boxShadow: queueMessages.length > 0 ? '0 2px 8px rgba(245, 158, 11, 0.4)' : 'none'
            }}
          >
            📋 Q {queueMessages.length > 0 && <span>({queueMessages.length})</span>}
          </button>
        </div>

        {sortedMessages.length === 0 ? (
          <div className="p-8 text-center rounded-2xl" style={{
            background: 'white',
            boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06)'
          }}>
            <img src={UI_SPRITES.react} alt="" className="mb-3" style={{ width: 48, height: 48, imageRendering: 'pixelated' }} />
            <p style={{
              fontFamily: 'Fredoka, sans-serif',
              fontSize: '16px',
              color: 'var(--text)',
              fontWeight: '600'
            }}>
              No messages yet!
            </p>
            <p style={{
              fontSize: '13px',
              color: 'var(--text-muted)',
              marginTop: '4px'
            }}>
              Be the first to say something
            </p>
          </div>
        ) : (
          sortedMessages.map((item) => (
            <div
              key={item.odId}
              className="p-4 rounded-2xl"
              style={{
                background: 'white',
                boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06)',
                border: item.odInQueue ? '2px solid #f59e0b' : '2px solid #3b82f6'
              }}
            >
              {/* Header */}
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm" style={{
                  background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
                  color: 'white',
                  fontFamily: 'Fredoka, sans-serif',
                  fontWeight: '700'
                }}>
                  {item.odUsername[0]}
                </div>
                <button
                  onClick={() => setSelectedUser(item.odUsername)}
                  style={{
                    fontFamily: 'Fredoka, sans-serif',
                    fontSize: '13px',
                    fontWeight: '700',
                    color: 'var(--text)',
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    textDecorationColor: 'transparent',
                    transition: 'text-decoration-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.textDecorationColor = 'var(--text)'}
                  onMouseLeave={(e) => e.currentTarget.style.textDecorationColor = 'transparent'}
                >
                  {item.odUsername}
                </button>
                {item.odInQueue && (
                  <span className="px-2 py-0.5 rounded-full text-xs" style={{
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    color: 'white',
                    fontFamily: 'Fredoka, sans-serif',
                    fontSize: '10px',
                    fontWeight: '700'
                  }}>
                    📋 In Q
                  </span>
                )}
                <span className="px-2 py-0.5 rounded-full text-xs" style={{
                  background: item.odType === 'drawing'
                    ? 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)'
                    : item.odType === 'image'
                    ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                    : 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
                  color: 'white',
                  fontFamily: 'Fredoka, sans-serif',
                  fontSize: '10px',
                  fontWeight: '700'
                }}>
                  {item.odType === 'drawing' ? '🎨 Drawing' : item.odType === 'image' ? '📷 Image' : '💬 Message'}
                </span>
                <span className="ml-auto text-xs" style={{
                  color: 'var(--text-muted)',
                  fontSize: '11px'
                }}>
                  {new Date(item.odCreatedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                </span>
              </div>

              {/* Content */}
              {item.odImageData && (
                <img
                  src={item.odImageData}
                  alt="Drawing"
                  className="mb-2 rounded-xl w-full"
                  onClick={() => setLightbox(item.odImageData || null)}
                  style={{
                    maxHeight: '150px',
                    objectFit: 'contain',
                    background: '#ffffeb',
                    cursor: 'zoom-in'
                  }}
                />
              )}
              {item.odContent && (
                <p style={{
                  fontFamily: 'Nunito, sans-serif',
                  fontSize: '14px',
                  color: 'var(--text)',
                  lineHeight: '1.5'
                }}>
                  {item.odContent}
                </p>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={() => handleUpvote(item.odId)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl transition-all transform hover:scale-105"
                  style={{
                    background: item.odHasUpvoted
                      ? 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)'
                      : 'var(--bg-secondary)',
                    border: 'none',
                    fontFamily: 'Fredoka, sans-serif',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: item.odHasUpvoted ? 'white' : 'var(--text)'
                  }}
                >
                  👍 {item.odUpvotes}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Composer - Part of flexbox layout */}
      <div className="flex-shrink-0 p-3" style={{
        background: 'rgba(255, 255, 255, 0.98)',
        borderTop: '1px solid rgba(0, 0, 0, 0.06)'
      }}>
        <MessageComposer
          onSend={handleSend}
          onSendToQueue={handleSendToQueue}
          placeholder="Say something..."
        />
      </div>

      {/* Tap-to-enlarge for doodles and photos */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0, 0, 0, 0.85)' }}
          onClick={() => setLightbox(null)}
        >
          <img
            src={lightbox}
            alt=""
            style={{ maxWidth: '100%', maxHeight: '85vh', borderRadius: '16px', background: '#ffffeb', boxShadow: '0 16px 48px rgba(0,0,0,0.5)' }}
          />
          <span className="absolute top-4 right-4 text-white" style={{ fontFamily: 'Fredoka, sans-serif', fontSize: '14px', opacity: 0.8 }}>
            tap to close
          </span>
        </div>
      )}

      {/* Queue Panel Modal */}
      {showQueue && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ background: 'rgba(0, 0, 0, 0.5)' }}
          onClick={() => setShowQueue(false)}
        >
          <div
            className="w-full max-w-lg rounded-t-3xl p-4"
            style={{
              background: 'white',
              maxHeight: '70vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 style={{
                fontFamily: 'Fredoka, sans-serif',
                fontSize: '20px',
                fontWeight: '700',
                color: 'var(--text)'
              }}>
                📋 Question Queue
              </h2>
              <div className="flex gap-2">
                {queueMessages.length > 0 && (
                  <button
                    onClick={() => setShowClearConfirm(true)}
                    className="px-3 py-1.5 rounded-xl transition-all hover:scale-105"
                    style={{
                      background: '#ef4444',
                      color: 'white',
                      fontFamily: 'Fredoka, sans-serif',
                      fontSize: '12px',
                      fontWeight: '600',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    Clear All
                  </button>
                )}
                <button
                  onClick={() => setShowQueue(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{
                    background: 'var(--bg-secondary)',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '16px'
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Presenter controls */}
            {queueMessages.length > 0 && (
              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => nextUp && showOnDisplay(nextUp.odId)}
                  disabled={!nextUp}
                  className="flex-1 py-3 rounded-xl transition-all active:scale-95"
                  style={{
                    background: nextUp ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'var(--bg-secondary)',
                    color: nextUp ? 'white' : 'var(--text-muted)',
                    border: 'none',
                    fontFamily: 'Fredoka, sans-serif',
                    fontSize: '14px',
                    fontWeight: '700'
                  }}
                >
                  📺 Show next{nextUp ? ` (👍 ${nextUp.odUpvotes})` : ''}
                </button>
                {displayedMessageId && (
                  <button
                    onClick={() => dismissFromQueue(displayedMessageId)}
                    className="flex-1 py-3 rounded-xl transition-all active:scale-95"
                    style={{
                      background: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
                      color: 'white',
                      border: 'none',
                      fontFamily: 'Fredoka, sans-serif',
                      fontSize: '14px',
                      fontWeight: '700'
                    }}
                  >
                    ✓ Done with this one
                  </button>
                )}
              </div>
            )}

            {/* Queue List, most upvoted first */}
            <div className="flex-1 overflow-y-auto space-y-3">
              {queueMessages.length === 0 ? (
                <div className="p-8 text-center">
                  <p style={{
                    fontFamily: 'Fredoka, sans-serif',
                    fontSize: '16px',
                    color: 'var(--text-muted)'
                  }}>
                    No questions in queue
                  </p>
                  <p style={{
                    fontSize: '13px',
                    color: 'var(--text-muted)',
                    marginTop: '4px'
                  }}>
                    Use the 📋 Q button to send messages to the queue
                  </p>
                </div>
              ) : (
                rankedQueue.map((item) => (
                  <div
                    key={item.odId}
                    className="p-3 rounded-xl"
                    style={{
                      background: displayedMessageId === item.odId ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-secondary)',
                      border: displayedMessageId === item.odId ? '2px solid #10b981' : '2px solid #f59e0b'
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span style={{
                            fontFamily: 'Fredoka, sans-serif',
                            fontSize: '13px',
                            fontWeight: '700',
                            color: 'var(--text)'
                          }}>
                            {item.odUsername}
                          </span>
                          <span className="px-2 py-0.5 rounded-full" style={{
                            background: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
                            color: 'white',
                            fontFamily: 'Fredoka, sans-serif',
                            fontSize: '10px',
                            fontWeight: '700'
                          }}>
                            👍 {item.odUpvotes}
                          </span>
                          {displayedMessageId === item.odId && (
                            <span className="px-2 py-0.5 rounded-full" style={{
                              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                              color: 'white',
                              fontFamily: 'Fredoka, sans-serif',
                              fontSize: '10px',
                              fontWeight: '700'
                            }}>
                              📺 LIVE
                            </span>
                          )}
                        </div>
                        {item.odImageData && (
                          <img
                            src={item.odImageData}
                            alt="Drawing"
                            className="mb-2 rounded-lg"
                            style={{
                              maxHeight: '80px',
                              objectFit: 'contain',
                              background: '#ffffeb'
                            }}
                          />
                        )}
                        {item.odContent && (
                          <p style={{
                            fontFamily: 'Nunito, sans-serif',
                            fontSize: '13px',
                            color: 'var(--text)',
                            lineHeight: '1.4'
                          }}>
                            {item.odContent}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => {
                            if (displayedMessageId === item.odId) hideFromDisplay();
                            else showOnDisplay(item.odId);
                          }}
                          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-110"
                          style={{
                            background: displayedMessageId === item.odId
                              ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                              : 'var(--bg-secondary)',
                            border: displayedMessageId === item.odId ? '2px solid #059669' : '2px solid transparent',
                            cursor: 'pointer',
                            boxShadow: displayedMessageId === item.odId ? '0 0 10px rgba(16, 185, 129, 0.6)' : 'none'
                          }}
                          title={displayedMessageId === item.odId ? 'Hide from display' : 'Show on display'}
                        >
                          <span style={{ fontSize: '14px' }}>📺</span>
                        </button>
                        <button
                          onClick={() => dismissFromQueue(item.odId)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-110"
                          style={{
                            background: '#ef4444',
                            border: 'none',
                            cursor: 'pointer'
                          }}
                          title="Dismiss"
                        >
                          <span style={{ fontSize: '14px', color: 'white' }}>✕</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Clear Confirmation Dialog */}
      {showClearConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0, 0, 0, 0.5)' }}
          onClick={() => setShowClearConfirm(false)}
        >
          <div
            className="rounded-2xl p-6 mx-4"
            style={{
              background: 'white',
              maxWidth: '320px',
              width: '100%'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{
              fontFamily: 'Fredoka, sans-serif',
              fontSize: '18px',
              fontWeight: '700',
              color: 'var(--text)',
              marginBottom: '8px'
            }}>
              Clear Queue?
            </h3>
            <p style={{
              fontFamily: 'Nunito, sans-serif',
              fontSize: '14px',
              color: 'var(--text-muted)',
              marginBottom: '16px'
            }}>
              This will remove all {queueMessages.length} items from the queue. Messages will still be visible in the chat.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 px-4 py-2 rounded-xl transition-all hover:scale-105"
                style={{
                  background: 'var(--bg-secondary)',
                  color: 'var(--text)',
                  fontFamily: 'Fredoka, sans-serif',
                  fontSize: '14px',
                  fontWeight: '600',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleClearQueue}
                className="flex-1 px-4 py-2 rounded-xl transition-all hover:scale-105"
                style={{
                  background: '#ef4444',
                  color: 'white',
                  fontFamily: 'Fredoka, sans-serif',
                  fontSize: '14px',
                  fontWeight: '600',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}