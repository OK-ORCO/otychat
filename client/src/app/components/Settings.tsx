import { useState, useEffect } from 'react';
import ProfilePicSelector from './ProfilePicSelector';
import StatusEditor from './StatusEditor';
import ColorPicker, { COLOR_PALETTE } from './ColorPicker';
import { loadFavorites, saveFavorites, getEmojiUrl, CUSTOM_EMOJI_IDS, UNICODE_EMOJIS } from '../data/emoji-data';
import { usePushNotifications } from '../../hooks/usePushNotifications';
import { useSocket } from '../../contexts/SocketContext';
import { Bar, Window, Key, Row, Pic, Scrim, Progress, Icon } from './ds';
import { THEMES, SCREENS, applyTheme, applyScreen, loadTheme, loadScreen } from '../theme';
import type { ThemeId, ScreenId } from '../theme';

interface SettingsProps {
  onBack: () => void;
  profilePic?: string;
  onProfilePicChange?: (pic: string) => void;
  status?: string;
  onStatusChange?: (status: string) => void;
  nameColor?: string;
  onNameColorChange?: (color: string) => void;
}

export default function Settings({ onBack, profilePic, onProfilePicChange, status, onStatusChange, nameColor = '#ec4899', onNameColorChange }: SettingsProps) {
  const { user, leave } = useSocket();
  const userId = user?.odUserId || null;
  const { isSupported, isSubscribed, isLoading, permission, subscribe, unsubscribe } = usePushNotifications(userId);

  const [favorites, setFavorites] = useState<string[]>([]);
  const [showEmojiEditor, setShowEmojiEditor] = useState(false);
  const [soundVolume, setSoundVolume] = useState(75);
  const [vibration, setVibration] = useState(true);
  const [showProfilePicSelector, setShowProfilePicSelector] = useState(false);
  const [showStatusEditor, setShowStatusEditor] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [theme, setTheme] = useState<ThemeId>(loadTheme);
  const [screen, setScreen] = useState<ScreenId>(loadScreen);

  const pickTheme = (id: ThemeId) => { applyTheme(id); setTheme(id); };
  const pickScreen = (id: ScreenId) => { applyScreen(id); setScreen(id); };

  useEffect(() => {
    setFavorites(loadFavorites());
  }, []);

  if (showProfilePicSelector) {
    return (
      <ProfilePicSelector
        onBack={() => setShowProfilePicSelector(false)}
        onSelect={(pic) => {
          if (onProfilePicChange) onProfilePicChange(pic);
          setShowProfilePicSelector(false);
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

  if (showColorPicker) {
    return (
      <ColorPicker
        onBack={() => setShowColorPicker(false)}
        onSelect={(color) => {
          if (onNameColorChange) onNameColorChange(color);
          setShowColorPicker(false);
        }}
        currentColor={nameColor}
      />
    );
  }

  const pushStatus = !isSupported
    ? 'Not supported in this browser.'
    : permission === 'denied'
      ? 'Blocked. Allow notifications in your browser settings.'
      : isSubscribed
        ? 'On. You get pinged for DMs and emergencies.'
        : 'Off.';

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Bar
        left={<button onClick={onBack} title="Back"><Icon name="back" size={16} /></button>}
        title="Settings"
      />
      <div className="ds-lcd ds-scroll" style={{ flex: 1, minHeight: 0, padding: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Window title="Notifications">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="ds-small ds-muted" style={{ flex: 1 }}>{pushStatus}</div>
            <Key
              icon="bell"
              kind={isSubscribed ? 'default' : 'primary'}
              onClick={() => (isSubscribed ? unsubscribe() : subscribe())}
              disabled={isLoading || !isSupported || permission === 'denied'}
            >
              {isLoading ? 'Working' : isSubscribed ? 'Turn off' : 'Turn on'}
            </Key>
          </div>
        </Window>

        <Window title="Theme">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
            {THEMES.map(t => (
              <button
                key={t.id}
                type="button"
                title={t.name}
                className={`ds-swatch ${theme === t.id ? 'on' : ''}`}
                style={{ width: 36, height: 28, background: t.swatch.bg, overflow: 'hidden' }}
                onClick={() => pickTheme(t.id)}
              >
                <div style={{ width: '100%', height: '100%', background: t.swatch.bg }}>
                  <div style={{ height: 8, background: t.swatch.accent }} />
                </div>
              </button>
            ))}
          </div>
          <div style={{ marginBottom: 10 }}>{THEMES.find(t => t.id === theme)?.name}</div>
          <div className="ds-small ds-muted" style={{ marginBottom: 6 }}>Screen</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {SCREENS.map(s => (
              <Key key={s.id} on={screen === s.id} onClick={() => pickScreen(s.id)} style={{ flex: 1, padding: '0 4px' }}>
                {s.name}
              </Key>
            ))}
          </div>
        </Window>

        <Window title="Name colour">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
            {COLOR_PALETTE.map(({ color, name }) => (
              <button
                key={color}
                type="button"
                title={name}
                className={`ds-swatch ${nameColor === color ? 'on' : ''}`}
                style={{ background: color, width: 28, height: 28 }}
                onClick={() => onNameColorChange && onNameColorChange(color)}
              />
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ color: nameColor, flex: 1 }}>{user?.odName || 'Your name'}</span>
            <Key icon="palette" onClick={() => setShowColorPicker(true)}>Picker</Key>
          </div>
        </Window>

        <Window title="Profile" pad={false}>
          <Row right={<Key onClick={() => setShowProfilePicSelector(true)}>Change</Key>}>
            <Pic src={profilePic} size={32} />
            <span>Profile picture</span>
          </Row>
          <Row right={<Key onClick={() => setShowStatusEditor(true)}>{status ? 'Edit' : 'Set'}</Key>}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div>Status</div>
              <div className="ds-small ds-muted" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {status || 'None set'}
              </div>
            </div>
          </Row>
        </Window>

        <Window title="Quick reactions" right={<button onClick={() => setShowEmojiEditor(true)} style={{ background: 'none', border: 0, color: '#fff', padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}><Icon name="edit" size={14} /> Edit</button>}>
          <div className="ds-small ds-muted" style={{ marginBottom: 8 }}>The seven on your reaction strip.</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {favorites.map((emoji, i) => {
              const isCustom = /^\d+$/.test(emoji);
              return (
                <div key={i} className="ds-pic" style={{ width: 36, height: 36, fontSize: 22 }}>
                  {isCustom ? <img src={getEmojiUrl(emoji)} alt="" style={{ width: 28, height: 28, objectFit: 'contain' }} /> : <span>{emoji}</span>}
                </div>
              );
            })}
          </div>
        </Window>

        <Window title="Sounds" pad={false}>
          <Row right={
            <span style={{ display: 'flex', gap: 4 }}>
              <Key sq icon="minus" onClick={() => setSoundVolume(v => Math.max(0, v - 25))} title="Quieter" />
              <Key sq icon="plus" onClick={() => setSoundVolume(v => Math.min(100, v + 25))} title="Louder" />
            </span>
          }>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Sound effects</span>
                <span className="ds-small ds-muted">{soundVolume}%</span>
              </div>
              <div style={{ marginTop: 4 }}><Progress value={soundVolume} max={100} /></div>
            </div>
          </Row>
          <Row right={<Key on={vibration} onClick={() => setVibration(!vibration)}>{vibration ? 'On' : 'Off'}</Key>}>
            Vibration
          </Row>
        </Window>

        <Window title="Log out">
          <div className="ds-small ds-muted" style={{ marginBottom: 8 }}>You will need your password to get back in.</div>
          <Key wide kind="danger" icon="logout" onClick={leave}>Log out</Key>
        </Window>

        <div className="ds-small ds-muted" style={{ textAlign: 'center', padding: '4px 0 8px' }}>OtyChat v1.0.0</div>
      </div>

      {showEmojiEditor && (
        <EmojiEditorModal
          favorites={favorites}
          onSave={(newFavorites) => {
            setFavorites(newFavorites);
            saveFavorites(newFavorites);
            setShowEmojiEditor(false);
          }}
          onClose={() => setShowEmojiEditor(false)}
        />
      )}
    </div>
  );
}

interface EmojiEditorModalProps {
  favorites: string[];
  onSave: (favorites: string[]) => void;
  onClose: () => void;
}

type Category = 'custom' | 'faces' | 'gestures' | 'hearts' | 'symbols';
const CATEGORIES: Category[] = ['custom', 'faces', 'gestures', 'hearts', 'symbols'];

function EmojiEditorModal({ favorites, onSave, onClose }: EmojiEditorModalProps) {
  const [selectedFavorites, setSelectedFavorites] = useState<string[]>(favorites);
  const [activeCategory, setActiveCategory] = useState<Category>('custom');

  const toggleEmoji = (emoji: string) => {
    if (selectedFavorites.includes(emoji)) {
      setSelectedFavorites(selectedFavorites.filter(e => e !== emoji));
    } else if (selectedFavorites.length < 7) {
      setSelectedFavorites([...selectedFavorites, emoji]);
    }
  };

  const getEmojisForCategory = () => {
    if (activeCategory === 'custom') return CUSTOM_EMOJI_IDS;
    return UNICODE_EMOJIS[activeCategory] || [];
  };

  const renderEmoji = (emoji: string, size: number) => {
    const isCustom = /^\d+$/.test(emoji);
    return isCustom
      ? <img src={getEmojiUrl(emoji)} alt="" style={{ width: size, height: size, objectFit: 'contain' }} />
      : <span style={{ fontSize: size * 0.8, lineHeight: 1 }}>{emoji}</span>;
  };

  return (
    <Scrim onClose={onClose} bottom>
      <Window
        pad={false}
        className="ds-sheet"
        title={`Quick reactions (${selectedFavorites.length}/7)`}
        right={<button onClick={onClose} style={{ background: 'none', border: 0, color: '#fff', padding: 0, display: 'flex' }}><Icon name="x" size={14} /></button>}
      >
        <div style={{ padding: 8, borderBottom: '1px dashed #c5ccd6', display: 'flex', gap: 6, flexWrap: 'wrap', minHeight: 44 }}>
          {selectedFavorites.length === 0 && (
            <div className="ds-small ds-muted" style={{ padding: '4px 0' }}>Tap emoji below to add up to seven.</div>
          )}
          {selectedFavorites.map((emoji, i) => (
            <button
              key={i}
              onClick={() => toggleEmoji(emoji)}
              className="ds-pic"
              style={{ width: 34, height: 34, background: 'var(--ds-yellow)', padding: 0 }}
              title="Remove"
            >
              {renderEmoji(emoji, 24)}
            </button>
          ))}
        </div>

        <div className="ds-scroll" style={{ display: 'flex', gap: 4, padding: 8, borderBottom: '1px dashed #c5ccd6', overflowX: 'auto' }}>
          {CATEGORIES.map((cat) => (
            <Key key={cat} on={activeCategory === cat} onClick={() => setActiveCategory(cat)} style={{ flex: 'none', minHeight: 28, fontSize: 12 }}>
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </Key>
          ))}
        </div>

        <div className="ds-scroll" style={{ padding: 8, maxHeight: 250 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
            {getEmojisForCategory().map((emoji, i) => {
              const isSelected = selectedFavorites.includes(emoji);
              return (
                <button
                  key={i}
                  onClick={() => toggleEmoji(emoji)}
                  className="ds-pic"
                  style={{ width: '100%', aspectRatio: '1', background: isSelected ? 'var(--ds-yellow)' : 'var(--ds-paper)', padding: 0 }}
                >
                  {renderEmoji(emoji, 28)}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6, padding: 8, borderTop: '1px dashed #c5ccd6' }}>
          <Key style={{ flex: 1 }} onClick={onClose}>Cancel</Key>
          <Key kind="primary" icon="check" style={{ flex: 1 }} onClick={() => onSave(selectedFavorites)}>Save</Key>
        </div>
      </Window>
    </Scrim>
  );
}
