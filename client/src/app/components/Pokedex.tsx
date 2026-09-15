import { useState, useMemo } from 'react';
import { getSpriteUrl, getPokemonName, ALL_POKEMON } from '../data/pokemon-data';
import { Bar, Window, Key, Chip, Scrim, Icon } from './ds';

interface Pokemon {
  odId: string;
  odPokemonId: number;
  odName: string;
  odRarity: string;
  odIsShiny: boolean;
  odZone: string;
  odSpriteUrl: string;
}

interface PokedexProps {
  caughtPokemon: Pokemon[];
  onBack: () => void;
}

type Filter = 'all' | 'caught' | 'missing' | 'shiny';

const pad3 = (id: number) => id.toString().padStart(3, '0');

export default function Pokedex({ caughtPokemon, onBack }: PokedexProps) {
  const [filter, setFilter] = useState<Filter>('all');
  const [selectedPokemon, setSelectedPokemon] = useState<number | null>(null);

  const caughtMap = useMemo(() => {
    const map = new Map<number, Pokemon[]>();
    caughtPokemon.forEach(p => {
      const existing = map.get(p.odPokemonId) || [];
      existing.push(p);
      map.set(p.odPokemonId, existing);
    });
    return map;
  }, [caughtPokemon]);

  const caughtIds = new Set(caughtPokemon.map(p => p.odPokemonId));
  const shinyIds = new Set(caughtPokemon.filter(p => p.odIsShiny).map(p => p.odPokemonId));
  const caughtCount = caughtIds.size;
  const shinyCount = shinyIds.size;

  const filteredPokemon = ALL_POKEMON.filter(p => {
    if (filter === 'caught') return caughtIds.has(p.id);
    if (filter === 'missing') return !caughtIds.has(p.id);
    if (filter === 'shiny') return shinyIds.has(p.id);
    return true;
  });

  const selectedData = selectedPokemon ? caughtMap.get(selectedPokemon) : null;

  const filters: { id: Filter; label: string; count: number }[] = [
    { id: 'all', label: 'all', count: 386 },
    { id: 'caught', label: 'caught', count: caughtCount },
    { id: 'missing', label: 'missing', count: 386 - caughtCount },
    { id: 'shiny', label: 'shiny', count: shinyCount },
  ];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Bar
        title="Pokédex"
        sub={`${caughtCount} / 386`}
        left={<button onClick={onBack} title="Back"><Icon name="back" size={16} /></button>}
      />

      <div style={{ flex: 'none', display: 'flex', gap: 6, padding: '8px 10px', background: 'var(--ds-panel)', borderBottom: '2px solid var(--ds-line)' }}>
        {filters.map(f => (
          <Key
            key={f.id}
            on={filter === f.id}
            onClick={() => setFilter(f.id)}
            style={{ flex: 1, minHeight: 30, padding: '0 4px', fontSize: 12, gap: 4 }}
          >
            {f.label} <span className="ds-muted">{f.count}</span>
          </Key>
        ))}
      </div>

      <div className="ds-lcd ds-scroll" style={{ flex: 1, minHeight: 0, padding: 10 }}>
        {filteredPokemon.length === 0 ? (
          <div className="ds-muted" style={{ textAlign: 'center', padding: '40px 0', fontSize: 13 }}>Nothing here yet.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 4 }}>
            {filteredPokemon.map(pokemon => {
              const isCaught = caughtIds.has(pokemon.id);
              const isShiny = shinyIds.has(pokemon.id);
              return (
                <button
                  key={pokemon.id}
                  onClick={() => isCaught && setSelectedPokemon(pokemon.id)}
                  title={isCaught ? pokemon.name : `#${pad3(pokemon.id)}`}
                  style={{
                    position: 'relative', aspectRatio: '1 / 1', padding: 0,
                    border: '1px solid var(--ds-line)', background: 'var(--ds-paper)', borderRadius: 0,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    cursor: isCaught ? 'pointer' : 'default'
                  }}
                >
                  <img
                    className="px"
                    src={getSpriteUrl(pokemon.id, isCaught && isShiny)}
                    alt={isCaught ? pokemon.name : '???'}
                    style={{ width: 48, height: 48, objectFit: 'contain', filter: isCaught ? 'none' : 'brightness(0) opacity(0.35)' }}
                  />
                  <span style={{ fontSize: 10, lineHeight: '10px', color: isCaught ? 'var(--ds-muted)' : 'var(--ds-faint)', position: 'absolute', left: 3, bottom: 2 }}>
                    {pad3(pokemon.id)}
                  </span>
                  {isCaught && isShiny && (
                    <Chip kind="q" style={{ position: 'absolute', top: 2, right: 2, fontSize: 9, lineHeight: '12px', padding: '0 3px' }}>shiny</Chip>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {selectedPokemon && selectedData && (
        <Scrim onClose={() => setSelectedPokemon(null)}>
          <Window
            title={`#${pad3(selectedPokemon)} ${getPokemonName(selectedPokemon)}`}
            right={
              <button onClick={() => setSelectedPokemon(null)} title="Close" style={{ background: 'none', border: 0, color: '#fff', padding: 0, display: 'flex' }}>
                <Icon name="x" size={14} />
              </button>
            }
            pad={false}
          >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: 12 }}>
              <img
                className="px"
                src={getSpriteUrl(selectedPokemon, shinyIds.has(selectedPokemon))}
                alt={getPokemonName(selectedPokemon)}
                style={{ width: 96, height: 96, objectFit: 'contain' }}
              />
              <div style={{ fontSize: 18 }}>{getPokemonName(selectedPokemon)}</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {selectedData[0]?.odRarity && <Chip>{selectedData[0].odRarity}</Chip>}
                {shinyIds.has(selectedPokemon) && <Chip kind="q">SHINY</Chip>}
              </div>
            </div>
            <div className="ds-stat"><span className="ds-muted">Times caught</span><b>{selectedData.length}</b></div>
            <div className="ds-stat"><span className="ds-muted">First caught in</span><b style={{ fontSize: 14 }}>{selectedData[0]?.odZone || 'Unknown'}</b></div>
            <div style={{ padding: 10 }}>
              <Key wide onClick={() => setSelectedPokemon(null)}>Close</Key>
            </div>
          </Window>
        </Scrim>
      )}
    </div>
  );
}
