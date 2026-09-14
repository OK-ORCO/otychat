import { useEffect, useState } from 'react';
import { useSocket } from '../../../contexts/SocketContext';
import { UI_SPRITES } from '../../data/pokemon-data';
import DMConversation from '../DMConversation';

interface DMsTabProps {
  username: string;
  /** Conversation to open on mount (from a profile's Send Message button). */
  openContact?: string | null;
  onOpened?: () => void;
}

interface SelectedContact {
  id: string;
  name: string;
  online: boolean;
  unread: number;
  profilePic?: string;
  title?: string;
}

function SpriteIcon({ src, size = 24 }: { src: string; size?: number }) {
  return <img src={src} alt="" style={{ width: size, height: size, imageRendering: 'pixelated' }} />;
}

export default function DMsTab({ username, openContact, onOpened }: DMsTabProps) {
  const { onlineUsers, dms } = useSocket();
  const [selectedContact, setSelectedContact] = useState<SelectedContact | null>(null);

  useEffect(() => {
    if (!openContact || openContact === username) return;
    const online = onlineUsers.find(u => u.odName === openContact);
    setSelectedContact({
      id: openContact,
      name: openContact,
      online: !!online,
      unread: 0,
      profilePic: online?.odProfilePic,
      title: online?.odTitle
    });
    onOpened?.();
  }, [openContact, username, onlineUsers, onOpened]);

  // Build contacts list from DM history + online users
  const contacts = (() => {
    const contactMap = new Map<string, {
      id: string;
      name: string;
      online: boolean;
      profilePic?: string;
      title?: string;
      unread: number;
      lastMessageTime: number;
    }>();

    // First, add all contacts from DM history
    dms.forEach(dm => {
      const otherPerson = dm.odFromName === username ? dm.odToName : dm.odFromName;
      if (otherPerson === username) return; // Skip self

      const existing = contactMap.get(otherPerson);
      const messageTime = new Date(dm.odCreatedAt).getTime();
      const isUnread = dm.odFromName !== username && !dm.odRead;

      if (existing) {
        existing.lastMessageTime = Math.max(existing.lastMessageTime, messageTime);
        if (isUnread) existing.unread++;
      } else {
        // Check if this person is online to get their profile info
        const onlineUser = onlineUsers.find(u => u.odName === otherPerson);
        contactMap.set(otherPerson, {
          id: otherPerson,
          name: otherPerson,
          online: !!onlineUser,
          profilePic: onlineUser?.odProfilePic,
          title: onlineUser?.odTitle,
          unread: isUnread ? 1 : 0,
          lastMessageTime: messageTime
        });
      }
    });

    // Add online users who haven't been DMed yet (so you can start new convos)
    onlineUsers.forEach(u => {
      if (u.odName === username) return; // Skip self
      if (!contactMap.has(u.odName)) {
        contactMap.set(u.odName, {
          id: u.odName,
          name: u.odName,
          online: true,
          profilePic: u.odProfilePic,
          title: u.odTitle,
          unread: 0,
          lastMessageTime: 0 // No messages yet, will sort to bottom
        });
      } else {
        // Update online status for existing contacts
        const existing = contactMap.get(u.odName)!;
        existing.online = true;
        existing.profilePic = u.odProfilePic;
        existing.title = u.odTitle;
      }
    });

    // Convert to array and sort: first by unread (has unread first), then by most recent message
    return Array.from(contactMap.values()).sort((a, b) => {
      // Unread messages first
      if (a.unread > 0 && b.unread === 0) return -1;
      if (b.unread > 0 && a.unread === 0) return 1;
      // Then by most recent message
      return b.lastMessageTime - a.lastMessageTime;
    });
  })();

  if (selectedContact) {
    return (
      <DMConversation
        contact={selectedContact}
        username={username}
        onBack={() => setSelectedContact(null)}
      />
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="p-4 rounded-3xl" style={{
        background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
        boxShadow: '0 8px 24px rgba(236, 72, 153, 0.3)'
      }}>
        <h2 style={{
          fontFamily: 'Fredoka, sans-serif',
          fontSize: '18px',
          color: 'white',
          fontWeight: '700'
        }}>
          <SpriteIcon src={UI_SPRITES.dms} size={20} /> Direct Messages
        </h2>
        <p style={{
          fontSize: '12px',
          color: 'rgba(255,255,255,0.8)',
          marginTop: '4px'
        }}>
          {contacts.filter(c => c.online).length} online • {contacts.length} {contacts.length === 1 ? 'conversation' : 'conversations'}
        </p>
      </div>

      <div className="space-y-3">
        {contacts.length === 0 ? (
          <div className="p-8 text-center rounded-2xl relative overflow-hidden" style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(243,232,255,0.95) 100%)',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)'
          }}>
            {/* Decorative floating bubbles */}
            <img src={UI_SPRITES.dms} alt="" className="absolute top-4 left-6 opacity-20" style={{ transform: 'rotate(-15deg)', width: 32, height: 32, imageRendering: 'pixelated' }} />
            <img src={UI_SPRITES.dms} alt="" className="absolute top-8 right-8 opacity-15" style={{ transform: 'rotate(10deg)', width: 24, height: 24, imageRendering: 'pixelated' }} />
            <img src={UI_SPRITES.shiny} alt="" className="absolute bottom-6 left-10 opacity-10" style={{ transform: 'rotate(-5deg)', width: 20, height: 20, imageRendering: 'pixelated' }} />
            <img src={UI_SPRITES.dms} alt="" className="absolute bottom-10 right-6 opacity-15" style={{ transform: 'rotate(20deg)', width: 24, height: 24, imageRendering: 'pixelated' }} />

            {/* Main content */}
            <div className="relative z-10">
              <div className="flex justify-center gap-2 mb-4">
                <img src={UI_SPRITES.dms} alt="" style={{ width: 36, height: 36, imageRendering: 'pixelated', animation: 'bounce 2s infinite', animationDelay: '0s' }} />
                <img src={UI_SPRITES.online} alt="" style={{ width: 48, height: 48, imageRendering: 'pixelated', animation: 'bounce 2s infinite', animationDelay: '0.2s' }} />
                <img src={UI_SPRITES.dms} alt="" style={{ width: 36, height: 36, imageRendering: 'pixelated', animation: 'bounce 2s infinite', animationDelay: '0.4s' }} />
              </div>
              <p style={{
                fontFamily: 'Fredoka, sans-serif',
                fontSize: '18px',
                color: 'var(--text)',
                fontWeight: '700',
                marginBottom: '6px'
              }}>
                No conversations yet
              </p>
              <p style={{
                fontSize: '14px',
                color: 'var(--text-muted)',
                lineHeight: '1.5'
              }}>
                When friends join, you can start chatting!
              </p>
              <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full" style={{
                background: 'rgba(139, 92, 246, 0.1)',
                color: '#8b5cf6',
                fontSize: '13px',
                fontWeight: '600'
              }}>
                <SpriteIcon src={UI_SPRITES.online} size={18} />
                <span>Invite friends to the party</span>
              </div>
            </div>
          </div>
        ) : (
          contacts.map((contact) => (
            <button
              key={contact.id}
              onClick={() => setSelectedContact(contact)}
              className="w-full p-5 rounded-2xl flex items-center gap-3 transition-all transform hover:scale-105"
              style={{
                background: 'white',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
                border: 'none',
                textAlign: 'left'
              }}
            >
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl overflow-hidden" style={{
                  background: contact.online
                    ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                    : 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)'
                }}>
                  {contact.profilePic && (contact.profilePic.startsWith('data:') || contact.profilePic.startsWith('http') || contact.profilePic.startsWith('/')) ? (
                    <img src={contact.profilePic} alt={contact.name} className="w-full h-full object-cover" />
                  ) : (
                    <span>{contact.profilePic || '👤'}</span>
                  )}
                </div>
                {/* Online indicator dot */}
                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white" style={{
                  background: contact.online ? '#10b981' : '#9ca3af'
                }} />
              </div>
              <div className="flex-1">
                <div style={{
                  fontFamily: 'Fredoka, sans-serif',
                  fontSize: '16px',
                  fontWeight: '700',
                  color: 'var(--text)'
                }}>
                  {contact.name}
                </div>
                {contact.title && (
                  <div style={{
                    fontSize: '12px',
                    color: 'var(--text-muted)'
                  }}>
                    {contact.title}
                  </div>
                )}
              </div>
              {contact.unread > 0 && (
                <span className="px-3 py-1 rounded-full" style={{
                  background: 'var(--danger)',
                  color: 'white',
                  fontFamily: 'Fredoka, sans-serif',
                  fontSize: '12px',
                  fontWeight: '700',
                  minWidth: '24px',
                  textAlign: 'center',
                  boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)'
                }}>
                  {contact.unread}
                </span>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
