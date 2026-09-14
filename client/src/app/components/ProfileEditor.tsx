import { useState } from 'react';
import ProfilePicSelector from './ProfilePicSelector';
import StatusEditor from './StatusEditor';
import TitleSelector from './TitleSelector';

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
  const [showProfilePicSelector, setShowProfilePicSelector] = useState(false);
  const [showStatusEditor, setShowStatusEditor] = useState(false);
  const [showTitleSelector, setShowTitleSelector] = useState(false);

  if (showProfilePicSelector) {
    return (
      <ProfilePicSelector
        onBack={() => setShowProfilePicSelector(false)}
        onSelect={(pic) => {
          if (onProfilePicChange) {
            onProfilePicChange(pic);
          }
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
          if (onStatusChange) {
            onStatusChange(newStatus);
          }
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
          if (onTitleChange) {
            onTitleChange(newTitle);
          }
          setShowTitleSelector(false);
        }}
        currentTitle={title}
      />
    );
  }

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <div className="p-4 flex items-center gap-3" style={{
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
        <h2 style={{
          fontFamily: 'Fredoka, sans-serif',
          fontSize: '18px',
          color: 'white',
          fontWeight: '700'
        }}>
          ✏️ Edit Profile
        </h2>
      </div>

      <div className="p-4 space-y-4">
        {/* Profile Preview */}
        <div className="p-6 rounded-3xl text-center" style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)'
        }}>
          <div className="w-24 h-24 mx-auto mb-3 rounded-3xl flex items-center justify-center overflow-hidden" style={{
            background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)'
          }}>
            {profilePic.startsWith('data:') || profilePic.startsWith('http') || profilePic.startsWith('/') ? (
              <img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-5xl">{profilePic}</span>
            )}
          </div>
          <h3 style={{
            fontFamily: 'Fredoka, sans-serif',
            fontSize: '20px',
            color: 'var(--text)',
            fontWeight: '700',
            marginBottom: '4px'
          }}>
            {username}
          </h3>
          {status ? (
            <p style={{
              fontSize: '14px',
              color: 'var(--text-muted)',
              fontStyle: 'italic'
            }}>
              {status}
            </p>
          ) : (
            <p style={{
              fontSize: '13px',
              color: 'var(--text-muted)',
              opacity: 0.5
            }}>
              No status set
            </p>
          )}
          <div className="mt-3 px-4 py-2 inline-block rounded-full" style={{
            background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
            color: 'white',
            fontFamily: 'Fredoka, sans-serif',
            fontSize: '12px',
            fontWeight: '600'
          }}>
            {title}
          </div>
        </div>

        {/* Profile Picture Section */}
        <div className="p-5 rounded-3xl" style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)'
        }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center overflow-hidden" style={{
              background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)'
            }}>
              {profilePic.startsWith('data:') || profilePic.startsWith('http') || profilePic.startsWith('/') ? (
                <img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl">{profilePic}</span>
              )}
            </div>
            <div className="flex-1">
              <h3 style={{
                fontFamily: 'Fredoka, sans-serif',
                fontSize: '16px',
                color: 'var(--text)',
                fontWeight: '700'
              }}>
                Profile Picture
              </h3>
              <p style={{
                fontSize: '13px',
                color: 'var(--text-muted)'
              }}>
                Choose from camera, upload, or sprites
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowProfilePicSelector(true)}
            className="w-full p-4 rounded-2xl transition-all transform hover:scale-102 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
              color: 'white',
              fontFamily: 'Fredoka, sans-serif',
              fontSize: '14px',
              fontWeight: '700',
              border: 'none',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
            }}
          >
            📸 Change Picture
          </button>
        </div>

        {/* Status Section */}
        <div className="p-5 rounded-3xl" style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)'
        }}>
          <h3 className="mb-2" style={{
            fontFamily: 'Fredoka, sans-serif',
            fontSize: '16px',
            color: 'var(--text)',
            fontWeight: '700'
          }}>
            💬 Status
          </h3>
          <div className="p-4 rounded-2xl mb-3" style={{
            background: 'var(--bg-secondary)'
          }}>
            {status ? (
              <p style={{
                fontSize: '14px',
                color: 'var(--text)',
                fontFamily: 'Nunito, sans-serif',
                fontWeight: '600'
              }}>
                {status}
              </p>
            ) : (
              <p style={{
                fontSize: '13px',
                color: 'var(--text-muted)',
                fontStyle: 'italic'
              }}>
                No status set
              </p>
            )}
          </div>
          <button
            onClick={() => setShowStatusEditor(true)}
            className="w-full p-4 rounded-2xl transition-all transform hover:scale-102 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
              color: 'white',
              fontFamily: 'Fredoka, sans-serif',
              fontSize: '14px',
              fontWeight: '700',
              border: 'none',
              boxShadow: '0 4px 12px rgba(236, 72, 153, 0.3)'
            }}
          >
            ✏️ {status ? 'Edit Status' : 'Set Status'}
          </button>
        </div>

        {/* Display Title */}
        <div className="p-5 rounded-3xl" style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)'
        }}>
          <h3 className="mb-2" style={{
            fontFamily: 'Fredoka, sans-serif',
            fontSize: '16px',
            color: 'var(--text)',
            fontWeight: '700'
          }}>
            🏆 Display Title
          </h3>
          <div className="p-4 rounded-2xl mb-3" style={{
            background: 'var(--bg-secondary)'
          }}>
            <p style={{
              fontSize: '14px',
              color: 'var(--text)',
              fontFamily: 'Nunito, sans-serif',
              fontWeight: '600'
            }}>
              {title}
            </p>
          </div>
          <button
            onClick={() => setShowTitleSelector(true)}
            className="w-full p-4 rounded-2xl transition-all transform hover:scale-102 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
              color: 'white',
              fontFamily: 'Fredoka, sans-serif',
              fontSize: '14px',
              fontWeight: '700',
              border: 'none',
              boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
            }}
          >
            🎖️ Choose Title
          </button>
        </div>

        {/* Name Color */}
        <div className="p-5 rounded-3xl" style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)'
        }}>
          <h3 className="mb-3" style={{
            fontFamily: 'Fredoka, sans-serif',
            fontSize: '16px',
            color: 'var(--text)',
            fontWeight: '700'
          }}>
            🎨 Name Color
          </h3>
          <p className="mb-4" style={{
            fontSize: '13px',
            color: 'var(--text-muted)'
          }}>
            Choose how your name appears in chat
          </p>
          <div className="grid grid-cols-5 gap-2 mb-3">
            {[
              '#ec4899', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b',
              '#ef4444', '#06b6d4', '#8b5cf6', '#f97316', '#14b8a6'
            ].map((color, i) => (
              <button
                key={i}
                className="w-full aspect-square rounded-2xl transition-all transform hover:scale-110 active:scale-95"
                style={{
                  background: color,
                  border: i === 0 ? '3px solid var(--text)' : 'none',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
                }}
              />
            ))}
          </div>
          <div className="p-3 rounded-2xl text-center" style={{
            background: 'var(--bg-secondary)'
          }}>
            <span style={{
              fontFamily: 'Fredoka, sans-serif',
              fontSize: '14px',
              color: '#ec4899',
              fontWeight: '700'
            }}>
              {username}
            </span>
            <span style={{
              fontSize: '12px',
              color: 'var(--text-muted)',
              marginLeft: '8px'
            }}>
              Preview
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}