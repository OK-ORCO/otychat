import { useState } from 'react';
import TrainerSprites from './TrainerSprites';
import WoWAvatars from './WoWAvatars';

interface ProfilePicSelectorProps {
  onBack: () => void;
  onSelect: (imageData: string) => void;
  currentPic?: string;
}

type View = 'menu' | 'camera' | 'trainer' | 'wow';

export default function ProfilePicSelector({ onBack, onSelect, currentPic }: ProfilePicSelectorProps) {
  const [view, setView] = useState<View>('menu');
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onSelect(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' } 
      });
      setCameraStream(stream);
      setView('camera');
    } catch (err) {
      alert('Camera access denied or not available');
      console.error('Camera error:', err);
    }
  };

  const capturePhoto = () => {
    const video = document.getElementById('camera-preview') as HTMLVideoElement;
    if (video) {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const imageData = canvas.toDataURL('image/png');
        stopCamera();
        onSelect(imageData);
      }
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setView('menu');
  };

  if (view === 'trainer') {
    return (
      <TrainerSprites
        onBack={() => setView('menu')}
        onSelect={(sprite) => {
          onSelect(sprite);
        }}
      />
    );
  }

  if (view === 'wow') {
    return (
      <WoWAvatars
        onBack={() => setView('menu')}
        onSelect={(avatar) => {
          onSelect(avatar);
        }}
      />
    );
  }

  if (view === 'camera' && cameraStream) {
    return (
      <div className="min-h-screen pb-20">
        {/* Header */}
        <div className="p-4 flex items-center gap-3" style={{
          background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
        }}>
          <button
            onClick={stopCamera}
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
            📸 Take Photo
          </h2>
        </div>

        <div className="p-4 flex flex-col items-center gap-4">
          <video
            id="camera-preview"
            autoPlay
            playsInline
            ref={(video) => {
              if (video && cameraStream) {
                video.srcObject = cameraStream;
              }
            }}
            className="w-full max-w-md rounded-3xl"
            style={{
              background: '#000',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)'
            }}
          />
          
          <button
            onClick={capturePhoto}
            className="px-8 py-4 rounded-3xl transition-all transform hover:scale-105 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
              color: 'white',
              fontFamily: 'Fredoka, sans-serif',
              fontSize: '16px',
              fontWeight: '700',
              border: 'none',
              boxShadow: '0 8px 24px rgba(236, 72, 153, 0.3)'
            }}
          >
            📸 Capture
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <div className="p-4 flex items-center gap-3" style={{
        background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
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
          🖼️ Change Profile Picture
        </h2>
      </div>

      <div className="p-4 space-y-3">
        {/* Current Picture Preview */}
        {currentPic && (
          <div className="p-5 rounded-3xl flex flex-col items-center gap-3" style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)'
          }}>
            <p style={{
              fontFamily: 'Fredoka, sans-serif',
              fontSize: '14px',
              color: 'var(--text-muted)'
            }}>
              Current Picture
            </p>
            <div className="w-32 h-32 rounded-3xl flex items-center justify-center text-6xl overflow-hidden" style={{
              background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
              boxShadow: '0 4px 16px rgba(236, 72, 153, 0.2)'
            }}>
              {currentPic.startsWith('data:') || currentPic.startsWith('http') || currentPic.startsWith('/') ? (
                <img src={currentPic} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span>{currentPic}</span>
              )}
            </div>
          </div>
        )}

        {/* Options */}
        <button
          onClick={startCamera}
          className="w-full p-5 rounded-2xl transition-all transform hover:scale-105 active:scale-95"
          style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
            border: 'none',
            textAlign: 'left'
          }}
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl" style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)'
            }}>
              📸
            </div>
            <div className="flex-1">
              <div style={{
                fontFamily: 'Fredoka, sans-serif',
                fontSize: '16px',
                fontWeight: '700',
                color: 'var(--text)',
                marginBottom: '4px'
              }}>
                Take a Photo
              </div>
              <div style={{
                fontSize: '13px',
                color: 'var(--text-muted)'
              }}>
                Use your camera
              </div>
            </div>
            <span style={{ color: 'var(--text-muted)', fontSize: '20px' }}>›</span>
          </div>
        </button>

        <label
          className="w-full p-5 rounded-2xl transition-all transform hover:scale-105 active:scale-95 block cursor-pointer"
          style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)'
          }}
        >
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl" style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
            }}>
              📁
            </div>
            <div className="flex-1">
              <div style={{
                fontFamily: 'Fredoka, sans-serif',
                fontSize: '16px',
                fontWeight: '700',
                color: 'var(--text)',
                marginBottom: '4px'
              }}>
                Upload a Photo
              </div>
              <div style={{
                fontSize: '13px',
                color: 'var(--text-muted)'
              }}>
                Choose from gallery
              </div>
            </div>
            <span style={{ color: 'var(--text-muted)', fontSize: '20px' }}>›</span>
          </div>
        </label>

        <button
          onClick={() => setView('trainer')}
          className="w-full p-5 rounded-2xl transition-all transform hover:scale-105 active:scale-95"
          style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
            border: 'none',
            textAlign: 'left'
          }}
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl" style={{
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
            }}>
              🎮
            </div>
            <div className="flex-1">
              <div style={{
                fontFamily: 'Fredoka, sans-serif',
                fontSize: '16px',
                fontWeight: '700',
                color: 'var(--text)',
                marginBottom: '4px'
              }}>
                Trainer Sprites
              </div>
              <div style={{
                fontSize: '13px',
                color: 'var(--text-muted)'
              }}>
                Classic Pokémon trainers
              </div>
            </div>
            <span style={{ color: 'var(--text-muted)', fontSize: '20px' }}>›</span>
          </div>
        </button>

        <button
          onClick={() => setView('wow')}
          className="w-full p-5 rounded-2xl transition-all transform hover:scale-105 active:scale-95"
          style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
            border: 'none',
            textAlign: 'left'
          }}
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl" style={{
              background: 'linear-gradient(135deg, #1e40af 0%, #7c3aed 100%)'
            }}>
              ⚔️
            </div>
            <div className="flex-1">
              <div style={{
                fontFamily: 'Fredoka, sans-serif',
                fontSize: '16px',
                fontWeight: '700',
                color: 'var(--text)',
                marginBottom: '4px'
              }}>
                WoW Avatars
              </div>
              <div style={{
                fontSize: '13px',
                color: 'var(--text-muted)'
              }}>
                World of Warcraft characters
              </div>
            </div>
            <span style={{ color: 'var(--text-muted)', fontSize: '20px' }}>›</span>
          </div>
        </button>
      </div>
    </div>
  );
}
