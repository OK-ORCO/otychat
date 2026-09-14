import { useState } from 'react';
import { useSocket, ShopItem } from '../../contexts/SocketContext';
import { UI_SPRITES, BALL_SPRITES, STONE_SPRITES } from '../data/pokemon-data';

function SpriteIcon({ src, size = 24 }: { src: string; size?: number }) {
  return <img src={src} alt="" style={{ width: size, height: size, imageRendering: 'pixelated' }} />;
}

interface ShopProps {
  coins: number;
  onBack: () => void;
}

// Presentation for each server item id. The catalogue itself (names, prices)
// comes from the server so the two can never disagree.
const ITEM_LOOK: Record<string, { icon?: string; sprite?: string; description: string; gradient: string }> = {
  great_ball_5: { sprite: BALL_SPRITES.great, description: '1.5x catch rate', gradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' },
  ultra_ball_3: { sprite: BALL_SPRITES.ultra, description: '2x catch rate', gradient: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)' },
  master_ball: { sprite: BALL_SPRITES.master, description: 'Never fails', gradient: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)' },
  incense: { icon: '🕯️', description: 'More spawns for 30 minutes', gradient: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)' },
  lure: { icon: '🎣', description: 'Rarer Pokémon for your next 5 catches', gradient: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)' },
  lucky_egg: { icon: '🥚', description: 'Double XP for 30 minutes', gradient: 'linear-gradient(135deg, #fde68a 0%, #f59e0b 100%)' },
  fire_stone: { sprite: STONE_SPRITES.fire, description: 'Evolve fire-type Pokémon', gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' },
  water_stone: { sprite: STONE_SPRITES.water, description: 'Evolve water-type Pokémon', gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' },
  thunder_stone: { sprite: STONE_SPRITES.thunder, description: 'Evolve electric-type Pokémon', gradient: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)' },
  leaf_stone: { sprite: STONE_SPRITES.leaf, description: 'Evolve grass-type Pokémon', gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' },
  moon_stone: { sprite: STONE_SPRITES.moon, description: 'Evolve special Pokémon', gradient: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' },
  sun_stone: { sprite: STONE_SPRITES.sun, description: 'Evolve sun-loving Pokémon', gradient: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)' },
  dragon_scale: { sprite: STONE_SPRITES.dragon, description: 'Evolve dragon-type Pokémon', gradient: 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)' },
  shiny_charm: { icon: '✨', description: 'Double shiny encounter rate, forever', gradient: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)' },
  confetti: { icon: '🎉', description: 'Confetti all over the big screen', gradient: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)' },
  airhorn: { icon: '📯', description: 'BWAAAAP on the projector', gradient: 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)' },
  drumroll: { icon: '🥁', description: 'Build the tension', gradient: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' },
  sad_trombone: { icon: '🎺', description: 'Wah wah wah waaah', gradient: 'linear-gradient(135deg, #64748b 0%, #475569 100%)' },
  rimshot: { icon: '🥁', description: 'Ba dum tss', gradient: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)' },
  spotlight: { icon: '💡', description: 'Your name in lights for 10 seconds, with a message', gradient: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)' },
};

const CATEGORY_FOR_TYPE: Record<ShopItem['type'], { label: string; icon: string; order: number }> = {
  stunt: { label: 'Big Screen', icon: '🎬', order: 0 },
  ball: { label: 'Poké Balls', icon: '⚾', order: 1 },
  effect: { label: 'Boosts', icon: '⚡', order: 2 },
  stone: { label: 'Evolution Stones', icon: '💎', order: 3 },
  permanent: { label: 'Upgrades', icon: '👑', order: 4 },
};

export default function Shop({ coins, onBack }: ShopProps) {
  const { buyItem, shopItems } = useSocket();
  const [messageFor, setMessageFor] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  const handleBuy = (item: ShopItem) => {
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

  const categories = Object.entries(CATEGORY_FOR_TYPE)
    .sort((a, b) => a[1].order - b[1].order)
    .map(([type, meta]) => ({ type: type as ShopItem['type'], ...meta, items: shopItems.filter(i => i.type === type) }))
    .filter(c => c.items.length > 0);

  return (
    <div className="min-h-screen pb-20" style={{ background: 'var(--bg-primary)' }}>
      <div className="p-4 flex items-center gap-3" style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)'
      }}>
        <button onClick={onBack} className="text-2xl" style={{ color: 'var(--accent-solid)', background: 'none', border: 'none' }}>
          ←
        </button>
        <h2 style={{ fontFamily: 'Fredoka, sans-serif', fontSize: '20px', fontWeight: '700', flex: 1 }}>
          <SpriteIcon src={UI_SPRITES.shop} size={22} /> Shop
        </h2>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full" style={{
          background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
          color: 'white'
        }}>
          <SpriteIcon src={UI_SPRITES.coin} size={18} />
          <span style={{ fontFamily: 'Fredoka, sans-serif', fontSize: '16px', fontWeight: '700' }}>{coins}</span>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {categories.length === 0 && (
          <p className="text-center" style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Loading shop…</p>
        )}
        {categories.map(category => (
          <div key={category.type}>
            <h3 className="mb-3 flex items-center gap-2" style={{ fontFamily: 'Fredoka, sans-serif', fontSize: '16px', fontWeight: '700', color: 'var(--text)' }}>
              <span>{category.icon}</span>
              {category.label}
            </h3>

            <div className="space-y-3">
              {category.items.map(item => {
                const look = ITEM_LOOK[item.id] || { icon: '🎁', description: '', gradient: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)' };
                const canAfford = coins >= item.price;

                const composing = messageFor === item.id;
                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl flex items-center gap-4 flex-wrap"
                    style={{ background: 'white', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)', opacity: canAfford ? 1 : 0.6 }}
                  >
                    <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl flex-shrink-0" style={{ background: look.gradient }}>
                      {look.sprite ? <SpriteIcon src={look.sprite} size={36} /> : look.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p style={{ fontFamily: 'Fredoka, sans-serif', fontSize: '16px', fontWeight: '700', color: 'var(--text)' }}>
                        {item.name}
                      </p>
                      {look.description && (
                        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>{look.description}</p>
                      )}
                    </div>
                    {composing && (
                      <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Message for the screen (optional)"
                        maxLength={40}
                        autoFocus
                        className="w-full px-4 py-3 outline-none order-last"
                        style={{ background: 'var(--bg-secondary)', borderRadius: '14px', border: 'none', fontFamily: 'Nunito, sans-serif', fontSize: '14px' }}
                      />
                    )}
                    <button
                      onClick={() => handleBuy(item)}
                      disabled={!canAfford}
                      className="px-4 py-3 rounded-xl flex items-center gap-2 transition-all transform hover:scale-105 active:scale-95"
                      style={{
                        background: canAfford ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'var(--bg-secondary)',
                        color: canAfford ? 'white' : 'var(--text-muted)',
                        fontFamily: 'Fredoka, sans-serif',
                        fontSize: '14px',
                        fontWeight: '700',
                        border: 'none',
                        cursor: canAfford ? 'pointer' : 'not-allowed',
                        boxShadow: canAfford ? '0 4px 12px rgba(16, 185, 129, 0.3)' : 'none'
                      }}
                    >
                      <span>{composing ? '💡' : '🪙'}</span>
                      {composing ? 'Fire' : item.price}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
