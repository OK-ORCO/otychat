import { useState } from 'react';
import { useSocket, ShopItem } from '../../contexts/SocketContext';
import { BALL_SPRITES, STONE_SPRITES } from '../data/pokemon-data';
import { Bar, Window, Key, Field, Row, Heading, Icon } from './ds';

interface ShopProps {
  coins: number;
  onBack: () => void;
}

// Presentation for each server item id. The catalogue itself (names, prices)
// comes from the server so the two can never disagree.
const ITEM_LOOK: Record<string, { icon?: string; sprite?: string; description: string }> = {
  great_ball_5: { sprite: BALL_SPRITES.great, description: '1.5x catch rate' },
  ultra_ball_3: { sprite: BALL_SPRITES.ultra, description: '2x catch rate' },
  master_ball: { sprite: BALL_SPRITES.master, description: 'Never fails' },
  incense: { icon: 'fire', description: 'More spawns for 30 minutes' },
  lure: { icon: 'search', description: 'Rarer Pokémon for your next 5 catches' },
  lucky_egg: { icon: 'star', description: 'Double XP for 30 minutes' },
  fire_stone: { sprite: STONE_SPRITES.fire, description: 'Evolve fire-type Pokémon' },
  water_stone: { sprite: STONE_SPRITES.water, description: 'Evolve water-type Pokémon' },
  thunder_stone: { sprite: STONE_SPRITES.thunder, description: 'Evolve electric-type Pokémon' },
  leaf_stone: { sprite: STONE_SPRITES.leaf, description: 'Evolve grass-type Pokémon' },
  moon_stone: { sprite: STONE_SPRITES.moon, description: 'Evolve special Pokémon' },
  sun_stone: { sprite: STONE_SPRITES.sun, description: 'Evolve sun-loving Pokémon' },
  dragon_scale: { sprite: STONE_SPRITES.dragon, description: 'Evolve dragon-type Pokémon' },
  shiny_charm: { icon: 'sparkle', description: 'Double shiny encounter rate, forever' },
  confetti: { icon: 'sparkle', description: 'Confetti all over the big screen' },
  airhorn: { icon: 'megaphone', description: 'BWAAAAP on the projector' },
  drumroll: { icon: 'dice', description: 'Build the tension' },
  sad_trombone: { icon: 'moon', description: 'Wah wah wah waaah' },
  rimshot: { icon: 'star', description: 'Ba dum tss' },
  spotlight: { icon: 'eye', description: 'Your name in lights for 10 seconds, with a message' },
};

const CATEGORY_FOR_TYPE: Record<ShopItem['type'], { label: string; order: number }> = {
  stunt: { label: 'Big screen', order: 0 },
  ball: { label: 'Poké Balls', order: 1 },
  effect: { label: 'Boosts', order: 2 },
  stone: { label: 'Evolution stones', order: 3 },
  permanent: { label: 'Upgrades', order: 4 },
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
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Bar
        title="Shop"
        sub={`${coins} coins`}
        left={<button onClick={onBack} title="Back"><Icon name="back" size={16} /></button>}
      />

      <div className="ds-lcd ds-scroll" style={{ flex: 1, minHeight: 0, padding: 10, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {categories.length === 0 && (
          <div className="ds-muted" style={{ textAlign: 'center', padding: '40px 0', fontSize: 13 }}>Loading the shop.</div>
        )}
        {categories.map(category => (
          <div key={category.type}>
            <Heading>{category.label}</Heading>
            <Window pad={false}>
              {category.items.map(item => {
                const look = ITEM_LOOK[item.id] || { icon: 'shop', description: '' };
                const canAfford = coins >= item.price;
                const composing = messageFor === item.id;
                return (
                  <div key={item.id}>
                    <Row>
                      {look.sprite
                        ? <img className="px" src={look.sprite} alt="" style={{ width: 24, height: 24, objectFit: 'contain', flex: 'none' }} />
                        : <span style={{ width: 24, display: 'flex', justifyContent: 'center', flex: 'none' }}><Icon name={look.icon || 'shop'} size={18} /></span>}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div>{item.name}</div>
                        {look.description && <div className="ds-small ds-muted">{look.description}</div>}
                      </div>
                      <Key
                        kind="primary"
                        onClick={() => handleBuy(item)}
                        disabled={!canAfford}
                        style={{ minHeight: 30, padding: '0 8px', fontSize: 13, flex: 'none' }}
                      >
                        {composing ? 'Fire' : <><Icon name="coin" size={14} />{item.price}</>}
                      </Key>
                    </Row>
                    {composing && (
                      <div style={{ padding: '0 10px 10px', borderBottom: '1px dashed #c5ccd6' }}>
                        <Field
                          type="text"
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          placeholder="Message for the screen (optional)"
                          maxLength={40}
                          autoFocus
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </Window>
          </div>
        ))}
      </div>
    </div>
  );
}
