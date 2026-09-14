import { useState, useMemo } from 'react';
import { getSpriteUrl, getPokemonName, ALL_POKEMON } from '../data/pokemon-data';

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

export default function Pokedex({ caughtPokemon, onBack }: PokedexProps) {
  const [filter, setFilter] = useState<Filter>('all');
  const [selectedPokemon, setSelectedPokemon] = useState<number | null>(null);

  // Create a map of caught Pokemon for quick lookup
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

  return (
    <div className="min-h-screen pb-20" style={{ background: 'var(--bg-primary)' }}>
      {/* Header */}
      <div className="p-4 flex items-center gap-3" style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)'
      }}>
        <button
          onClick={onBack}
          className="text-2xl"
          style={{ color: 'var(--accent-solid)' }}
        >
          ←
        </button>
        <h2 style={{
          fontFamily: 'Fredoka, sans-serif',
          fontSize: '20px',
          fontWeight: '700',
          flex: 1
        }}>
          🎮 Pokédex
        </h2>
        <div className="text-right">
          <div style={{
            fontFamily: 'Fredoka, sans-serif',
            fontSize: '16px',
            fontWeight: '700',
            color: 'var(--accent-solid)'
          }}>
            {caughtCount}/386
          </div>
          {shinyCount > 0 && (
            <div style={{ fontSize: '12px', color: '#fbbf24' }}>
              ✨ {shinyCount} shiny
            </div>
          )}
        </div>
      </div>

      {/* Filter */}
      <div className="p-4 flex gap-2 overflow-x-auto">
        <FilterButton
          label="All"
          count={386}
          active={filter === 'all'}
          onClick={() => setFilter('all')}
          color="#6b7280"
        />
        <FilterButton
          label="Caught"
          count={caughtCount}
          active={filter === 'caught'}
          onClick={() => setFilter('caught')}
          color="#10b981"
        />
        <FilterButton
          label="Missing"
          count={386 - caughtCount}
          active={filter === 'missing'}
          onClick={() => setFilter('missing')}
          color="#ef4444"
        />
        <FilterButton
          label="Shiny"
          count={shinyCount}
          active={filter === 'shiny'}
          onClick={() => setFilter('shiny')}
          color="#fbbf24"
        />
      </div>

      {/* Pokemon Grid */}
      <div className="p-4 grid grid-cols-4 gap-2">
        {filteredPokemon.map(pokemon => {
          const isCaught = caughtIds.has(pokemon.id);
          const isShiny = shinyIds.has(pokemon.id);

          return (
            <button
              key={pokemon.id}
              onClick={() => isCaught && setSelectedPokemon(pokemon.id)}
              className="p-2 rounded-2xl flex flex-col items-center gap-1 transition-all active:scale-95"
              style={{
                background: isCaught
                  ? isShiny
                    ? 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)'
                    : 'white'
                  : 'var(--bg-secondary)',
                boxShadow: isCaught ? '0 4px 12px rgba(0, 0, 0, 0.1)' : 'none',
                opacity: isCaught ? 1 : 0.4
              }}
            >
              <span style={{
                fontSize: '11px',
                fontWeight: '600',
                color: isCaught ? (isShiny ? 'white' : 'var(--text)') : 'var(--text-muted)',
                fontFamily: 'Fredoka, sans-serif'
              }}>
                #{pokemon.id.toString().padStart(3, '0')}
              </span>
              <div className="w-12 h-12 flex items-center justify-center">
                <img
                  src={getSpriteUrl(pokemon.id, isCaught && isShiny)}
                  alt={isCaught ? pokemon.name : '???'}
                  className="w-full h-full object-contain"
                  style={{
                    imageRendering: 'pixelated',
                    filter: isCaught ? 'none' : 'brightness(0) opacity(0.3)'
                  }}
                />
              </div>
              {isShiny && <span className="text-xs">✨</span>}
            </button>
          );
        })}
      </div>

      {/* Pokemon Detail Modal */}
      {selectedPokemon && selectedData && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0, 0, 0, 0.6)' }}
          onClick={() => setSelectedPokemon(null)}
        >
          <div
            className="w-full max-w-sm p-6 rounded-3xl"
            style={{
              background: 'white',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div className="text-center">
              <div className="w-32 h-32 mx-auto mb-4">
                <img
                  src={getSpriteUrl(selectedPokemon, shinyIds.has(selectedPokemon))}
                  alt={getPokemonName(selectedPokemon)}
                  className="w-full h-full object-contain"
                  style={{ imageRendering: 'pixelated' }}
                />
              </div>
              <h3 style={{
                fontFamily: 'Fredoka, sans-serif',
                fontSize: '24px',
                fontWeight: '700',
                color: 'var(--text)'
              }}>
                {getPokemonName(selectedPokemon)}
              </h3>
              <p style={{
                fontSize: '14px',
                color: 'var(--text-muted)',
                marginBottom: '16px'
              }}>
                #{selectedPokemon.toString().padStart(3, '0')}
              </p>

              <div className="space-y-2 text-left">
                <div className="p-3 rounded-xl" style={{ background: 'var(--bg-secondary)' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Times Caught</div>
                  <div style={{ fontFamily: 'Fredoka, sans-serif', fontSize: '18px', fontWeight: '700' }}>
                    {selectedData.length}
                  </div>
                </div>

                {shinyIds.has(selectedPokemon) && (
                  <div className="p-3 rounded-xl" style={{
                    background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                    color: 'white'
                  }}>
                    <div style={{ fontSize: '12px', opacity: 0.9 }}>✨ Shiny Variant</div>
                    <div style={{ fontFamily: 'Fredoka, sans-serif', fontSize: '18px', fontWeight: '700' }}>
                      Caught!
                    </div>
                  </div>
                )}

                <div className="p-3 rounded-xl" style={{ background: 'var(--bg-secondary)' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>First Caught In</div>
                  <div style={{ fontFamily: 'Fredoka, sans-serif', fontSize: '14px', fontWeight: '600' }}>
                    {selectedData[0]?.odZone || 'Unknown Zone'}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedPokemon(null)}
                className="w-full mt-4 p-4 rounded-2xl transition-all transform hover:scale-105"
                style={{
                  background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
                  color: 'white',
                  fontFamily: 'Fredoka, sans-serif',
                  fontSize: '16px',
                  fontWeight: '700',
                  border: 'none'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface FilterButtonProps {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
  color: string;
}

function FilterButton({ label, count, active, onClick, color }: FilterButtonProps) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-2 rounded-full flex items-center gap-2 transition-all whitespace-nowrap"
      style={{
        background: active ? color : 'white',
        color: active ? 'white' : 'var(--text)',
        fontFamily: 'Fredoka, sans-serif',
        fontSize: '14px',
        fontWeight: '600',
        boxShadow: active ? `0 4px 12px ${color}40` : '0 2px 8px rgba(0, 0, 0, 0.1)'
      }}
    >
      {label}
      <span style={{
        background: active ? 'rgba(255,255,255,0.3)' : 'var(--bg-secondary)',
        padding: '2px 8px',
        borderRadius: '12px',
        fontSize: '12px'
      }}>
        {count}
      </span>
    </button>
  );
}
