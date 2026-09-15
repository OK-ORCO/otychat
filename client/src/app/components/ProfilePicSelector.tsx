import { useState } from 'react';
import TrainerSprites from './TrainerSprites';
import WoWAvatars from './WoWAvatars';
import { Bar, Window, Key, Row, Pic, Icon } from './ds';

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
        onSelect={(sprite) => { onSelect(sprite); }}
        current={currentPic}
      />
    );
  }

  if (view === 'wow') {
    return (
      <WoWAvatars
        onBack={() => setView('menu')}
        onSelect={(avatar) => { onSelect(avatar); }}
        current={currentPic}
      />
    );
  }

  if (view === 'camera' && cameraStream) {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Bar
          left={<button onClick={stopCamera} title="Back"><Icon name="back" size={16} /></button>}
          title="Take a photo"
        />
        <div className="ds-lcd ds-scroll" style={{ flex: 1, minHeight: 0, padding: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="ds-window" style={{ padding: 4 }}>
            <video
              id="camera-preview"
              autoPlay
              playsInline
              ref={(video) => {
                if (video && cameraStream) {
                  video.srcObject = cameraStream;
                }
              }}
              style={{ width: '100%', display: 'block', background: '#000' }}
            />
          </div>
          <Key kind="primary" big wide icon="camera" onClick={capturePhoto}>Capture</Key>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Bar
        left={<button onClick={onBack} title="Back"><Icon name="back" size={16} /></button>}
        title="Profile picture"
      />
      <div className="ds-lcd ds-scroll" style={{ flex: 1, minHeight: 0, padding: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {currentPic && (
          <Window title="Current">
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <Pic src={currentPic} size={96} />
            </div>
          </Window>
        )}

        <Window title="Pick a new one" pad={false}>
          <Row onClick={startCamera} right={<Icon name="play" size={12} />}>
            <Icon name="camera" size={18} />
            <div>
              <div>Take a photo</div>
              <div className="ds-small ds-muted">Use your camera</div>
            </div>
          </Row>
          <label className="ds-row press" style={{ cursor: 'pointer' }}>
            <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
            <Icon name="image" size={18} />
            <div>
              <div>Upload a photo</div>
              <div className="ds-small ds-muted">From your gallery</div>
            </div>
            <span className="ds-n"><Icon name="play" size={12} /></span>
          </label>
          <Row onClick={() => setView('trainer')} right={<Icon name="play" size={12} />}>
            <Icon name="pokeball" size={18} />
            <div>
              <div>Trainer sprites</div>
              <div className="ds-small ds-muted">Classic Pokémon trainers</div>
            </div>
          </Row>
          <Row onClick={() => setView('wow')} right={<Icon name="play" size={12} />}>
            <Icon name="person" size={18} />
            <div>
              <div>WoW avatars</div>
              <div className="ds-small ds-muted">World of Warcraft characters</div>
            </div>
          </Row>
        </Window>
      </div>
    </div>
  );
}
