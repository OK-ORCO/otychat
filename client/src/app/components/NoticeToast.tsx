import { useSocket } from '../../contexts/SocketContext';
import { Icon } from './ds';

const KIND_ICON: Record<string, string> = { info: 'info', success: 'check', error: 'x' };
const KIND_COLOR: Record<string, string> = { info: 'var(--ds-blue)', success: 'var(--ds-green)', error: 'var(--ds-red)' };

/**
 * One-line transient message from the server. Slides down under the header
 * bar as an outlined strip with a coloured edge; tap to dismiss.
 */
export default function NoticeToast() {
  const { notice, dismissNotice } = useSocket();
  if (!notice) return null;

  return (
    <button
      key={notice.id}
      onClick={dismissNotice}
      className="ds-window"
      style={{
        position: 'fixed', left: 8, right: 8, zIndex: 40,
        bottom: 'calc(env(safe-area-inset-bottom, 0px) + 64px)',
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '8px 10px', textAlign: 'left', fontSize: 13,
        borderLeft: `6px solid ${KIND_COLOR[notice.kind] || KIND_COLOR.info}`,
        animation: 'ds-notice-in 0.15s steps(3)'
      }}
    >
      <Icon name={KIND_ICON[notice.kind] || 'info'} size={16} />
      <span style={{ flex: 1 }}>{notice.text}</span>
      <style>{`@keyframes ds-notice-in { from { transform: translateY(8px); } to { transform: translateY(0); } }`}</style>
    </button>
  );
}
