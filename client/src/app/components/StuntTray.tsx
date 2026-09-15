import { useState } from 'react';
import { useSocket, ShopItem } from '../../contexts/SocketContext';
import { Key, Field, Icon } from './ds';

const STUNT_LOOK: Record<string, { icon: string; blurb: string }> = {
  confetti: { icon: 'sparkle', blurb: 'Confetti all over the big screen' },
  airhorn: { icon: 'megaphone', blurb: 'BWAAAAP on the projector' },
  drumroll: { icon: 'dice', blurb: 'Build the tension' },
  sad_trombone: { icon: 'moon', blurb: 'Wah wah wah waaah' },
  rimshot: { icon: 'star', blurb: 'Ba dum tss' },
  spotlight: { icon: 'eye', blurb: 'Your name in lights for 10 seconds' },
};

/**
 * Coin-sink stunts for the projector, folded under the reaction strip on the
 * Chat tab. Collapsed to one row by default; opens into a key grid.
 */
export default function StuntTray() {
  const { user, shopItems, buyItem } = useSocket();
  const [open, setOpen] = useState(false);
  const [messageFor, setMessageFor] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  const stunts = shopItems.filter(i => i.type === 'stunt');
  const coins = user?.odCoins || 0;
  if (stunts.length === 0) return null;

  const fire = (item: ShopItem) => {
    if (coins < item.price) return;
    if (item.needsMessage) {
      if (messageFor !== item.id) {
        setMessageFor(item.id);
        setMessage('');
        return;
      }
      buyItem(item.id, message.trim());
      setMessageFor(null);
      setMessage('');
      return;
    }
    buyItem(item.id);
  };

  const pending = messageFor ? stunts.find(s => s.id === messageFor) : null;

  return (
    <div style={{ flex: 'none', background: 'var(--ds-panel)', borderBottom: '2px solid var(--ds-line)' }}>
      <button
        onClick={() => { setOpen(o => !o); setMessageFor(null); }}
        style={{
          width: '100%', background: 'none', border: 0, padding: '3px 8px',
          display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--ds-ink)'
        }}
      >
        <Icon name="tv" size={14} />
        <span style={{ flex: 1, textAlign: 'left', letterSpacing: 1, textTransform: 'uppercase' }}>Big screen stunts</span>
        <span className="ds-muted" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <Icon name="coin" size={12} />{coins}
        </span>
        <Icon name={open ? 'minus' : 'plus'} size={14} />
      </button>

      {open && (
        <div style={{ padding: '0 6px 6px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
            {stunts.map(item => {
              const look = STUNT_LOOK[item.id] || { icon: 'tv', blurb: '' };
              const canAfford = coins >= item.price;
              const composing = messageFor === item.id;
              return (
                <Key
                  key={item.id}
                  kind={composing ? 'warn' : 'paper'}
                  col
                  onClick={() => fire(item)}
                  disabled={!canAfford}
                  title={look.blurb}
                  style={{ height: 56, padding: '0 4px' }}
                >
                  <Icon name={look.icon} size={18} />
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>{item.name}</span>
                  <span className="ds-muted" style={{ display: 'inline-flex', alignItems: 'center', gap: 2, fontSize: 10 }}>
                    <Icon name="coin" size={10} />{item.price}
                  </span>
                </Key>
              );
            })}
          </div>
          {pending && (
            <div style={{ display: 'flex', gap: 6 }}>
              <Field
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Message for the screen (optional)"
                maxLength={40}
                autoFocus
                style={{ flex: 1, minWidth: 0 }}
              />
              <Key kind="primary" onClick={() => fire(pending)}>Fire</Key>
              <Key sq icon="x" onClick={() => setMessageFor(null)} title="Cancel" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
