import { useEffect, useRef } from 'react';
import { useSocket } from '../../contexts/SocketContext';
import MessageComposer from './MessageComposer';
import { Bar, Note, Icon, formatTime } from './ds';

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
  const { dms, sendDM, markDMsRead, user } = useSocket();
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
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Bar
        title={contact.name}
        sub={contact.online ? 'online' : 'offline'}
        left={<button onClick={onBack} title="Back"><Icon name="back" size={16} /></button>}
      />

      <div ref={scrollRef} className="ds-lcd ds-scroll" style={{ flex: 1, minHeight: 0, padding: '8px 8px 4px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {messages.length === 0 ? (
          <div className="ds-muted" style={{ textAlign: 'center', padding: '40px 0', fontSize: 13 }}>
            No messages yet
          </div>
        ) : (
          messages.map(msg => {
            const isMe = msg.odFromName === username;
            return (
              <Note
                key={msg.odId}
                name={msg.odFromName}
                time={formatTime(msg.odCreatedAt)}
                color={isMe ? user?.odNameColor : msg.odFromColor}
                image={msg.odImageData || null}
                text={msg.odContent || null}
              />
            );
          })
        )}
      </div>

      <div className="ds-tray" style={{ flex: 'none', padding: 6 }}>
        <MessageComposer
          onSend={handleSend}
          placeholder={`Message ${contact.name}`}
          compact
          penColor={user?.odNameColor}
        />
      </div>
    </div>
  );
}
