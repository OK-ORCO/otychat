import { useSocket } from '../../contexts/SocketContext';

const KIND_STYLES: Record<string, string> = {
  info: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
  success: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
  error: 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)',
};

/**
 * One-line transient message from the server (shop result, catch outcome,
 * zone change, kudos). Tap to dismiss; it also clears itself.
 */
export default function NoticeToast() {
  const { notice, dismissNotice } = useSocket();
  if (!notice) return null;

  return (
    <button
      key={notice.id}
      onClick={dismissNotice}
      className="fixed left-4 right-4 z-40 px-4 py-3 rounded-2xl text-left"
      style={{
        top: 'calc(env(safe-area-inset-top, 0px) + 12px)',
        background: KIND_STYLES[notice.kind] || KIND_STYLES.info,
        color: 'white',
        border: 'none',
        fontFamily: 'Fredoka, sans-serif',
        fontSize: '14px',
        fontWeight: '600',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
        animation: 'notice-in 0.25s ease-out'
      }}
    >
      {notice.text}
      <style>{`
        @keyframes notice-in {
          from { opacity: 0; transform: translateY(-12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </button>
  );
}
