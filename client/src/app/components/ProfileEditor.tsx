import { useState } from 'react';
import ProfilePicSelector from './ProfilePicSelector';
import StatusEditor from './StatusEditor';
import TitleSelector from './TitleSelector';
import { useSocket } from '../../contexts/SocketContext';
import { Bar, Window, Key, Chip, Pic, Icon } from './ds';

interface ProfileEditorProps {
  onBack: () => void;
  profilePic?: string;
  onProfilePicChange?: (pic: string) => void;
  status?: string;
  onStatusChange?: (status: string) => void;
  username: string;
  title?: string;
  onTitleChange?: (title: string) => void;
}

export default function ProfileEditor({
  onBack,
  profilePic = '👤',
  onProfilePicChange,
  status = '',
  onStatusChange,
  username,
  title = '⭐ Emoji Enthusiast',
  onTitleChange
}: ProfileEditorProps) {
  const { user } = useSocket();
  const [showProfilePicSelector, setShowProfilePicSelector] = useState(false);
  const [showStatusEditor, setShowStatusEditor] = useState(false);
  const [showTitleSelector, setShowTitleSelector] = useState(false);

  if (showProfilePicSelector) {
    return (
      <ProfilePicSelector
        onBack={() => setShowProfilePicSelector(false)}
        onSelect={(pic) => {
          if (onProfilePicChange) onProfilePicChange(pic);
          // Go all the way back to MeTab after selecting a pic
          onBack();
        }}
        currentPic={profilePic}
      />
    );
  }

  if (showStatusEditor) {
    return (
      <StatusEditor
        onBack={() => setShowStatusEditor(false)}
        onStatusChange={(newStatus) => {
          if (onStatusChange) onStatusChange(newStatus);
          setShowStatusEditor(false);
        }}
        currentStatus={status}
      />
    );
  }

  if (showTitleSelector) {
    return (
      <TitleSelector
        onBack={() => setShowTitleSelector(false)}
        onTitleChange={(newTitle) => {
          if (onTitleChange) onTitleChange(newTitle);
          setShowTitleSelector(false);
        }}
        currentTitle={title}
      />
    );
  }

  const nameColor = user?.odNameColor || 'var(--ds-ink)';

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Bar
        left={<button onClick={onBack} title="Back"><Icon name="back" size={16} /></button>}
        title="Edit profile"
      />
      <div className="ds-lcd ds-scroll" style={{ flex: 1, minHeight: 0, padding: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Window title="Preview">
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <Pic src={profilePic} size={72} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 20, color: nameColor }}>{username}</div>
              <div className="ds-small ds-muted" style={{ marginTop: 2 }}>{status || 'No status set'}</div>
              {title && <div style={{ marginTop: 6 }}><Chip>{title}</Chip></div>}
            </div>
          </div>
        </Window>

        <Window title="Picture">
          <div className="ds-small ds-muted" style={{ marginBottom: 8 }}>Camera, upload, trainer sprites or WoW avatars.</div>
          <Key wide icon="camera" onClick={() => setShowProfilePicSelector(true)}>Change picture</Key>
        </Window>

        <Window title="Status">
          <label className="ds-small ds-muted" style={{ display: 'block', marginBottom: 4 }}>What you are up to</label>
          <div className="ds-field" style={{ display: 'flex', alignItems: 'center', marginBottom: 8, color: status ? undefined : 'var(--ds-faint)' }}>
            {status || 'Nothing yet'}
          </div>
          <Key wide icon="pencil" onClick={() => setShowStatusEditor(true)}>{status ? 'Edit status' : 'Set status'}</Key>
        </Window>

        <Window title="Title">
          <label className="ds-small ds-muted" style={{ display: 'block', marginBottom: 4 }}>Shown under your name</label>
          <div className="ds-field" style={{ display: 'flex', alignItems: 'center', marginBottom: 8, color: title ? undefined : 'var(--ds-faint)' }}>
            {title || 'No title'}
          </div>
          <Key wide icon="trophy" onClick={() => setShowTitleSelector(true)}>Choose title</Key>
        </Window>

        <div className="ds-small ds-muted" style={{ textAlign: 'center' }}>Changes save as you make them.</div>
      </div>
    </div>
  );
}
