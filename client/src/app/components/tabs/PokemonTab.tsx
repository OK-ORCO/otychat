import { useState, useEffect, CSSProperties } from 'react';
import { useSocket } from '../../../contexts/SocketContext';
import { getSpriteUrl, getPokemonName, BALL_SPRITES, STONE_SPRITES } from '../../data/pokemon-data';
import Pokedex from '../Pokedex';
import Shop from '../Shop';
import { Bar, Window, Key, Chip, Row, Progress, Icon } from '../ds';

type SubPage = 'pokedex' | 'shop' | 'zones' | null;

function Sprite({ src, alt = '', size = 24 }: { src: string; alt?: string; size?: number }) {
  return <img className="px" src={src} alt={alt} style={{ width: size, height: size, objectFit: 'contain', flex: 'none' }} />;
}

const BALLS: { key: 'poke' | 'great' | 'ultra' | 'master'; label: string; ballType: string }[] = [
  { key: 'poke', label: 'Poké', ballType: 'pokeball' },
  { key: 'great', label: 'Great', ballType: 'great' },
  { key: 'ultra', label: 'Ultra', ballType: 'ultra' },
  { key: 'master', label: 'Master', ballType: 'master' },
];

const STONES: { key: keyof typeof STONE_SPRITES; label: string }[] = [
  { key: 'fire', label: 'Fire' },
  { key: 'water', label: 'Water' },
  { key: 'thunder', label: 'Thunder' },
  { key: 'leaf', label: 'Leaf' },
  { key: 'moon', label: 'Moon' },
  { key: 'sun', label: 'Sun' },
  { key: 'dragon', label: 'Dragon' },
];

export default function PokemonTab() {
  const {
    user,
    activePokemon,
    caughtPokemon,
    evolvable,
    catchResult,
    clearCatchResult,
    ballInventory,
    stoneInventory,
    zones,
    catchPokemon,
    runFromPokemon,
    changeZone,
    evolvePokemon
  } = useSocket();

  const currentXp = user?.odTrainerXp || 0;
  const currentLevel = user?.odTrainerLevel || 1;
  const levelFloor = user?.odXpForCurrentLevel || 0;
  const xpForNextLevel = user?.odXpForNextLevel ?? null;
  const zoneId = user?.odCurrentZone || 'meadow';
  const zoneName = zones[zoneId]?.name || 'Starter Meadow';

  const [currentPage, setCurrentPage] = useState<SubPage>(null);

  const uniquePokemonIds = new Set(caughtPokemon.map(p => p.odPokemonId));
  const pokemonCaught = uniquePokemonIds.size;
  const shinyCaught = caughtPokemon.filter(p => p.odIsShiny).length;

  if (currentPage === 'pokedex') {
    return (
      <Pokedex
        caughtPokemon={caughtPokemon}
        onBack={() => setCurrentPage(null)}
      />
    );
  }

  if (currentPage === 'shop') {
    return (
      <Shop
        coins={user?.odCoins || 0}
        onBack={() => setCurrentPage(null)}
      />
    );
  }

  if (currentPage === 'zones') {
    return (
      <ZoneSelector
        zones={zones}
        currentZone={zoneId}
        trainerLevel={currentLevel}
        onSelectZone={(zone) => {
          changeZone(zone);
          setCurrentPage(null);
        }}
        onBack={() => setCurrentPage(null)}
      />
    );
  }

  const resultTitleBg = catchResult
    ? (catchResult.kind === 'caught' ? 'var(--ds-green)' : catchResult.fled ? 'var(--ds-red)' : 'var(--ds-title-grey)')
    : undefined;
  const resultTitleColor = catchResult && catchResult.kind !== 'caught' && !catchResult.fled ? 'var(--ds-ink)' : '#fff';

  const cell: CSSProperties = {
    background: 'var(--ds-paper)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '8px 4px'
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Bar title="Pokémon" sub={zoneName} />

      <div className="ds-lcd ds-scroll" style={{ flex: 1, minHeight: 0, padding: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* trainer card */}
        <Window title="Trainer" right={<span>Lv {currentLevel}</span>}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
            <span>Level {currentLevel}</span>
            <span className="ds-small ds-muted">{zoneName}</span>
          </div>
          <Progress
            value={xpForNextLevel === null ? 1 : currentXp - levelFloor}
            max={xpForNextLevel === null ? 1 : xpForNextLevel - levelFloor}
          />
          <div className="ds-small ds-muted" style={{ marginTop: 4, display: 'flex', justifyContent: 'space-between' }}>
            <span>XP</span>
            <span>{xpForNextLevel === null ? `${currentXp} · max level` : `${currentXp} / ${xpForNextLevel}`}</span>
          </div>
        </Window>

        {/* outcome of the last throw */}
        {catchResult && (
          <div className="ds-window">
            <div className="ds-window-title" style={{ background: resultTitleBg, color: resultTitleColor }}>
              <span>{catchResult.kind === 'caught' ? 'Caught' : catchResult.fled ? 'It fled' : 'It broke free'}</span>
              <button onClick={clearCatchResult} title="Dismiss" style={{ background: 'none', border: 0, color: 'inherit', padding: 0, display: 'flex' }}>
                <Icon name="x" size={14} />
              </button>
            </div>
            <div className="ds-window-body" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {catchResult.sprite
                ? <Sprite src={catchResult.sprite} size={48} />
                : <Icon name="pokeball" size={24} />}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div>{catchResult.message}</div>
                {catchResult.kind === 'caught' && (
                  <div className="ds-small ds-muted">+{catchResult.xp} XP · +{catchResult.coins} coins</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* encounter */}
        {activePokemon ? (
          <ActiveEncounter
            pokemon={activePokemon}
            ballInventory={ballInventory}
            onCatch={catchPokemon}
            onRun={runFromPokemon}
          />
        ) : (
          <Window title="Tall grass" grey>
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <div>Nothing here right now.</div>
              <div className="ds-small ds-muted" style={{ marginTop: 4 }}>Keep chatting and something will show up.</div>
            </div>
          </Window>
        )}

        {/* stats */}
        <Window title="Stats" pad={false}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr' }}>
            <div className="ds-stat" style={{ flexDirection: 'column', alignItems: 'center', gap: 2, borderBottom: 0, borderRight: '1px dashed #c5ccd6' }}>
              <b>{pokemonCaught}</b>
              <span className="ds-small ds-muted">caught</span>
            </div>
            <div className="ds-stat" style={{ flexDirection: 'column', alignItems: 'center', gap: 2, borderBottom: 0, borderRight: '1px dashed #c5ccd6' }}>
              <b>{pokemonCaught}/386</b>
              <span className="ds-small ds-muted">Pokédex</span>
            </div>
            <div className="ds-stat" style={{ flexDirection: 'column', alignItems: 'center', gap: 2, borderBottom: 0 }}>
              <b>{shinyCaught}</b>
              <span className="ds-small ds-muted">shiny</span>
            </div>
          </div>
        </Window>

        {/* evolutions available right now */}
        {evolvable.length > 0 && (
          <Window title="Ready to evolve" pad={false}>
            <div className="ds-small ds-muted" style={{ padding: '8px 10px 0' }}>Stones are used up. Level evolutions are free.</div>
            {evolvable.map((e, i) => (
              <div key={e.pokemonId} style={{ borderTop: i > 0 ? '1px dashed #c5ccd6' : undefined }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px 6px' }}>
                  <Sprite src={e.sprite} alt={e.name} size={32} />
                  <span>{e.name}</span>
                </div>
                <div style={{ padding: '0 10px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {e.options.map(o => (
                    <Key
                      key={`${o.method}-${o.stone || 'level'}-${o.toId}`}
                      wide
                      onClick={() => evolvePokemon(e.pokemonId, o.method, o.stone || undefined)}
                      style={{ justifyContent: 'flex-start' }}
                    >
                      <Sprite src={o.toSprite} alt={o.toName} size={24} />
                      <span>Evolve into {o.toName}</span>
                      <span className="ds-small ds-muted" style={{ marginLeft: 'auto' }}>
                        {o.method === 'stone' ? `uses ${o.requirement}` : o.requirement}
                      </span>
                    </Key>
                  ))}
                </div>
              </div>
            ))}
          </Window>
        )}

        {/* balls */}
        <Window title="Poké Balls" pad={false}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, background: '#c5ccd6' }}>
            {BALLS.map(b => (
              <div key={b.key} style={cell}>
                <Sprite src={BALL_SPRITES[b.key]} alt={`${b.label} Ball`} size={24} />
                <span>{b.key === 'poke' ? 'free' : ballInventory[b.key]}</span>
                <span className="ds-small ds-muted">{b.label}</span>
              </div>
            ))}
          </div>
        </Window>

        {/* stones */}
        <Window title="Evolution Stones" pad={false}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, background: '#c5ccd6' }}>
            {STONES.map(s => (
              <div key={s.key} style={cell}>
                <Sprite src={STONE_SPRITES[s.key]} alt={`${s.label} Stone`} size={24} />
                <span>{stoneInventory[s.key]}</span>
                <span className="ds-small ds-muted">{s.label}</span>
              </div>
            ))}
            <div style={{ background: 'var(--ds-paper)' }} />
          </div>
        </Window>

        {/* navigation */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <NavButton icon="map" label="Change zone" onClick={() => setCurrentPage('zones')} />
          <NavButton icon="book" label="Pokédex" onClick={() => setCurrentPage('pokedex')} />
          <NavButton icon="shop" label="Shop" onClick={() => setCurrentPage('shop')} />
          <div className="ds-window" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 10px', minHeight: 42 }}>
            <Icon name="coin" size={18} />
            <span style={{ fontSize: 18 }}>{user?.odCoins || 0}</span>
            <span className="ds-small ds-muted">coins</span>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ActiveEncounterProps {
  pokemon: {
    odId: string;
    odPokemonId: number;
    odName: string;
    odRarity: 'common' | 'uncommon' | 'rare' | 'legendary';
    odIsShiny: boolean;
    odSpriteUrl: string;
    odExpiresAt?: number;
  };
  ballInventory: { great: number; ultra: number; master: number };
  onCatch: (odId: string, ballType: string) => void;
  onRun: () => void;
}

function useSecondsLeft(expiresAt?: number) {
  const [left, setLeft] = useState<number | null>(null);
  useEffect(() => {
    if (!expiresAt) { setLeft(null); return; }
    const tick = () => setLeft(Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000)));
    tick();
    const t = setInterval(tick, 500);
    return () => clearInterval(t);
  }, [expiresAt]);
  return left;
}

function ActiveEncounter({ pokemon, ballInventory, onCatch, onRun }: ActiveEncounterProps) {
  const spriteUrl = pokemon.odSpriteUrl || getSpriteUrl(pokemon.odPokemonId, pokemon.odIsShiny);
  const pokemonName = pokemon.odName || getPokemonName(pokemon.odPokemonId);
  const secondsLeft = useSecondsLeft(pokemon.odExpiresAt);

  const countFor = (key: 'poke' | 'great' | 'ultra' | 'master') => (key === 'poke' ? null : ballInventory[key]);

  return (
    <Window
      title={`A wild ${pokemonName} appeared`}
      right={secondsLeft !== null ? <Chip kind={secondsLeft <= 5 ? 'red' : undefined}>{secondsLeft}s</Chip> : undefined}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
        <img className="px" src={spriteUrl} alt={pokemonName} style={{ width: 96, height: 96, objectFit: 'contain' }} />
        <div style={{ fontSize: 18 }}>{pokemonName}</div>
        <div style={{ display: 'flex', gap: 6 }}>
          <Chip>{pokemon.odRarity}</Chip>
          {pokemon.odIsShiny && <Chip kind="q">SHINY</Chip>}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginTop: 10 }}>
        {BALLS.map(b => {
          const count = countFor(b.key);
          const out = count !== null && count === 0;
          return (
            <Key
              key={b.key}
              col
              disabled={out}
              onClick={() => { if (!out) onCatch(pokemon.odId, b.ballType); }}
              title={`${b.label} Ball`}
              style={{ minHeight: 52 }}
            >
              <Sprite src={BALL_SPRITES[b.key]} alt={`${b.label} Ball`} size={24} />
              <span>{count === null ? b.label : count}</span>
            </Key>
          );
        })}
      </div>

      <Key wide onClick={onRun} style={{ marginTop: 8 }}>Run away</Key>
    </Window>
  );
}

interface ZoneSelectorProps {
  zones: Record<string, { name: string; levelRequired: number }>;
  currentZone: string;
  trainerLevel: number;
  onSelectZone: (zone: string) => void;
  onBack: () => void;
}

function ZoneSelector({ zones, currentZone, trainerLevel, onSelectZone, onBack }: ZoneSelectorProps) {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Bar
        title="Zones"
        sub={`Level ${trainerLevel}`}
        left={<button onClick={onBack} title="Back"><Icon name="back" size={16} /></button>}
      />
      <div className="ds-lcd ds-scroll" style={{ flex: 1, minHeight: 0, padding: 10 }}>
        <Window title="Pick a zone" pad={false}>
          {Object.entries(zones).map(([zoneId, zone]) => {
            const isUnlocked = trainerLevel >= zone.levelRequired;
            const isCurrent = currentZone === zoneId;

            if (!isUnlocked) {
              return (
                <Row key={zoneId} right={`Level ${zone.levelRequired} to unlock`}>
                  <span className="ds-faint">{zone.name}</span>
                </Row>
              );
            }
            return (
              <Row key={zoneId} onClick={() => onSelectZone(zoneId)} right={isCurrent ? <Chip kind="blue">current</Chip> : undefined}>
                <span>{zone.name}</span>
              </Row>
            );
          })}
        </Window>
      </div>
    </div>
  );
}

interface NavButtonProps {
  icon: string;
  label: string;
  onClick: () => void;
}

function NavButton({ icon, label, onClick }: NavButtonProps) {
  return (
    <Key big icon={icon} onClick={onClick} style={{ justifyContent: 'flex-start' }}>
      {label}
    </Key>
  );
}
