import { useState, useEffect } from 'react';
import { usePushNotifications } from '../../hooks/usePushNotifications';
import { Window, Key } from './ds';

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

    // Card on the Me tab: no need to wait, just avoid a flash while support is probed
    const timer = setTimeout(() => {
      setShowPrompt(true);
    }, 300);

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
    <Window title="Notifications">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ fontSize: 13 }}>
          {needsHomeScreen
            ? 'On iPhone: tap Share, then Add to Home Screen, and open the app from there to get DMs, Pokémon and emergency alerts.'
            : 'Get pinged for DMs, wild Pokémon and popcorn emergencies.'}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <Key style={{ flex: 1 }} onClick={handleDismiss}>
            {needsHomeScreen ? 'Got it' : 'Not now'}
          </Key>
          {!needsHomeScreen && (
            <Key kind="primary" icon="bell" style={{ flex: 1 }} onClick={handleEnable} disabled={isLoading}>
              {isLoading ? 'Enabling' : 'Enable'}
            </Key>
          )}
        </div>
      </div>
    </Window>
  );
}
