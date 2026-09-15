import { useEffect, useState } from 'react';
import { useSocket } from '../../../contexts/SocketContext';
import DMConversation from '../DMConversation';
import { Bar, Window, Row, Pic, Chip } from '../ds';

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

  const unread = contacts.reduce((n, c) => n + c.unread, 0);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Bar title="Messages" sub={`${unread} unread`} />

      <div className="ds-lcd ds-scroll" style={{ flex: 1, minHeight: 0, padding: 10 }}>
        <Window pad={false} title="People" right={<span className="ds-small">{contacts.filter(c => c.online).length} online</span>}>
          {contacts.length === 0 ? (
            <div className="ds-muted" style={{ textAlign: 'center', padding: '24px 0', fontSize: 13 }}>
              No one to message yet
            </div>
          ) : (
            contacts.map(contact => {
              const tags = contact.online || contact.unread > 0 ? (
                <>
                  {contact.online && <Chip kind="live">online</Chip>}
                  {contact.unread > 0 && <Chip kind="red" style={{ marginLeft: 4 }}>{contact.unread}</Chip>}
                </>
              ) : undefined;
              return (
                <Row key={contact.id} onClick={() => setSelectedContact(contact)} right={tags}>
                  <Pic src={contact.profilePic} size={32} />
                  <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{contact.name}</span>
                    {contact.title && <span className="ds-muted ds-small" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{contact.title}</span>}
                  </span>
                </Row>
              );
            })
          )}
        </Window>
      </div>
    </div>
  );
}
