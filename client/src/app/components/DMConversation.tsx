import { useEffect, useRef } from 'react';
import { useSocket } from '../../contexts/SocketContext';
import MessageComposer from './MessageComposer';

interface Contact {
  id: string;
  name: string;
  online: boolean;
  profilePic?: string;
  title?: string;
}

interface DMConversationProps {
  contact: Contact;
  username: string;
  onBack: () => void;
}

export default function DMConversation({ contact, username, onBack }: DMConversationProps) {
  const { dms, sendDM, markDMsRead } = useSocket();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Filter messages for this conversation
  const messages = dms.filter(dm =>
    (dm.odFromName === contact.name && dm.odToName === username) ||
    (dm.odFromName === username && dm.odToName === contact.name)
  ).sort((a, b) => new Date(a.odCreatedAt).getTime() - new Date(b.odCreatedAt).getTime());

  // Mark messages as read when opening conversation
  useEffect(() => {
    markDMsRead(contact.name);
  }, [contact.name, markDMsRead]);

  // Auto-scroll when new messages arrive
  useEffect(() => {
    const timer = setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [messages.length]);

  const handleSend = (data: { drawing?: string; text?: string; image?: string }) => {
    if (data.drawing || data.text || data.image) {
      sendDM(contact.name, data.text || '', data.drawing, data.image);
    }
  };

  return (
    <div className="flex flex-col" style={{ height: 'calc(100dvh - 56px)' }}>
      {/* Header */}
      <div className="flex-shrink-0 p-4 flex items-center gap-3" style={{
        background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
        boxShadow: '0 4px 16px rgba(236, 72, 153, 0.2)'
      }}>
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl transition-all transform hover:scale-110"
          style={{
            background: 'rgba(255, 255, 255, 0.2)',
            color: 'white',
            border: 'none'
          }}
        >
          ←
        </button>
        {/* Profile Pic */}
        <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg overflow-hidden" style={{
          background: 'rgba(255, 255, 255, 0.2)',
        }}>
          {contact.profilePic && (contact.profilePic.startsWith('data:') || contact.profilePic.startsWith('http') || contact.profilePic.startsWith('/')) ? (
            <img src={contact.profilePic} alt={contact.name} className="w-full h-full object-cover" />
          ) : (
            <span>{contact.profilePic || '👤'}</span>
          )}
        </div>
        <div className="flex-1">
          <div style={{
            fontFamily: 'Fredoka, sans-serif',
            fontSize: '16px',
            color: 'white',
            fontWeight: '700'
          }}>
            {contact.name}
          </div>
          <div style={{
            fontSize: '12px',
            color: 'rgba(255, 255, 255, 0.8)'
          }}>
            {contact.online ? '🟢 Online' : '⚫ Offline'}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
              No messages yet. Say hi!
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.odFromName === username;
            return (
              <div
                key={msg.odId}
                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-2`}>
                  {/* Message Bubble */}
                  <div className="p-4 rounded-3xl" style={{
                    background: isMe
                      ? 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)'
                      : 'white',
                    color: isMe ? 'white' : 'var(--text)',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                    borderRadius: isMe ? '24px 24px 4px 24px' : '24px 24px 24px 4px'
                  }}>
                    {msg.odImageData && (
                      <img
                        src={msg.odImageData}
                        alt="Drawing"
                        className="mb-2 rounded-xl w-full"
                        style={{
                          maxHeight: '150px',
                          objectFit: 'contain',
                          background: '#ffffeb'
                        }}
                      />
                    )}
                    {msg.odContent && (
                      <p style={{
                        fontFamily: 'Nunito, sans-serif',
                        fontSize: '14px'
                      }}>
                        {msg.odContent}
                      </p>
                    )}
                  </div>

                  {/* Meta */}
                  <div className="flex items-center gap-2 px-2">
                    <span style={{
                      color: 'var(--text-muted)',
                      fontFamily: 'Fredoka, sans-serif',
                      fontSize: '11px',
                      fontWeight: '600'
                    }}>
                      {isMe ? 'You' : msg.odFromName}
                    </span>
                    <span style={{
                      color: 'var(--text-muted)',
                      fontSize: '11px'
                    }}>
                      {new Date(msg.odCreatedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0 p-4" style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 -4px 16px rgba(0, 0, 0, 0.1)'
      }}>
        <MessageComposer onSend={handleSend} placeholder={`Message ${contact.name}...`} />
      </div>
    </div>
  );
}
