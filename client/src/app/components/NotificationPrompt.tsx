import { useState, useEffect } from 'react';
import { usePushNotifications } from '../../hooks/usePushNotifications';
import { Bell, BellOff, X } from 'lucide-react';

interface NotificationPromptProps {
  userId: number | null;
}

export default function NotificationPrompt({ userId }: NotificationPromptProps) {
  const {
    isSupported,
    isSubscribed,
    isLoading,
    permission,
    subscribe,
  } = usePushNotifications(userId);

  const [isDismissed, setIsDismissed] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  // Check if we should show the prompt
  useEffect(() => {
    // Don't show if already subscribed, not supported, denied, or dismissed this session
    if (isSubscribed || !isSupported || permission === 'denied' || isDismissed) {
      setShowPrompt(false);
      return;
    }

    // Check if user has dismissed before (stored in localStorage)
    const dismissed = localStorage.getItem('notif-prompt-dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed, 10);
      // Only show again after 24 hours
      if (Date.now() - dismissedTime < 24 * 60 * 60 * 1000) {
        setShowPrompt(false);
        return;
      }
    }

    // Show prompt after a delay
    const timer = setTimeout(() => {
      setShowPrompt(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, [isSubscribed, isSupported, permission, isDismissed]);

  const handleDismiss = () => {
    setIsDismissed(true);
    setShowPrompt(false);
    localStorage.setItem('notif-prompt-dismissed', Date.now().toString());
  };

  const handleEnable = async () => {
    const success = await subscribe();
    if (success) {
      setShowPrompt(false);
    }
  };

  if (!showPrompt) return null;

  // iPhones can only receive web push once the app is on the Home Screen.
  const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    || (navigator as Navigator & { standalone?: boolean }).standalone === true;
  const needsHomeScreen = isIOS && !isStandalone;

  return (
    <div
      className="fixed bottom-24 left-4 right-4 z-50 animate-slide-up"
      style={{
        animation: 'slideUp 0.3s ease-out',
      }}
    >
      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      <div
        className="p-4 mx-auto max-w-sm"
        style={{
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
          borderRadius: '20px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)',
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div
              className="p-2 rounded-full"
              style={{
                background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
              }}
            >
              <Bell size={20} color="white" />
            </div>
            <div>
              <h3 style={{
                fontFamily: 'Fredoka, sans-serif',
                fontSize: '16px',
                color: 'white',
                fontWeight: '600',
              }}>
                Stay in the loop!
              </h3>
              <p style={{
                fontFamily: 'Nunito, sans-serif',
                fontSize: '13px',
                color: 'rgba(255, 255, 255, 0.7)',
              }}>
                {needsHomeScreen
                  ? 'On iPhone: tap Share, then Add to Home Screen, and open the app from there to get DMs, Pokémon and emergency alerts.'
                  : 'Get pinged for DMs, wild Pokémon and popcorn emergencies'}
              </p>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="p-1 rounded-full transition-colors hover:bg-white/10"
          >
            <X size={18} color="rgba(255, 255, 255, 0.5)" />
          </button>
        </div>

        {/* Buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleDismiss}
            className="flex-1 py-2 px-4 rounded-xl transition-all"
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              fontFamily: 'Fredoka, sans-serif',
              fontSize: '14px',
              color: 'rgba(255, 255, 255, 0.7)',
              border: 'none',
            }}
          >
            {needsHomeScreen ? 'Got it' : 'Not now'}
          </button>
          {!needsHomeScreen && <button
            onClick={handleEnable}
            disabled={isLoading}
            className="flex-1 py-2 px-4 rounded-xl transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
            style={{
              background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
              fontFamily: 'Fredoka, sans-serif',
              fontSize: '14px',
              color: 'white',
              fontWeight: '600',
              border: 'none',
              boxShadow: '0 4px 16px rgba(236, 72, 153, 0.3)',
              opacity: isLoading ? 0.7 : 1,
            }}
          >
            {isLoading ? (
              <>
                <span className="animate-spin">⏳</span>
                Enabling...
              </>
            ) : (
              <>
                <Bell size={16} />
                Enable
              </>
            )}
          </button>}
        </div>
      </div>
    </div>
  );
}
