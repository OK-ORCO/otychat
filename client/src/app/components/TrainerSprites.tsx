import { useState } from 'react';
import { Bar, Key, Icon } from './ds';

interface TrainerSpritesProps {
  onBack: () => void;
  onSelect: (sprite: string) => void;
  current?: string;
}

// Pokemon Showdown trainer sprite base URL
const SPRITE_BASE = 'https://play.pokemonshowdown.com/sprites/trainers';

// Curated list of popular trainer sprites organized by category
const TRAINER_CATEGORIES = {
  'Protagonists': [
    { name: 'red', label: 'Red' },
    { name: 'leaf-gen3', label: 'Leaf' },
    { name: 'blue', label: 'Blue' },
    { name: 'ethan', label: 'Ethan' },
    { name: 'lyra', label: 'Lyra' },
    { name: 'brendan', label: 'Brendan' },
    { name: 'may', label: 'May' },
    { name: 'lucas', label: 'Lucas' },
    { name: 'dawn', label: 'Dawn' },
    { name: 'hilbert', label: 'Hilbert' },
    { name: 'hilda', label: 'Hilda' },
    { name: 'nate', label: 'Nate' },
    { name: 'rosa', label: 'Rosa' },
    { name: 'calem', label: 'Calem' },
    { name: 'serena', label: 'Serena' },
    { name: 'elio', label: 'Elio' },
    { name: 'selene', label: 'Selene' },
    { name: 'victor', label: 'Victor' },
    { name: 'gloria', label: 'Gloria' },
  ],
  'Anime': [
    { name: 'ash', label: 'Ash' },
    { name: 'ash-alola', label: 'Ash (Alola)' },
    { name: 'ash-hoenn', label: 'Ash (Hoenn)' },
    { name: 'misty', label: 'Misty' },
    { name: 'brock', label: 'Brock' },
    { name: 'dawn-contest', label: 'Dawn' },
    { name: 'may-contest', label: 'May' },
    { name: 'serena-anime', label: 'Serena' },
    { name: 'jessiejames-gen1', label: 'Jessie & James' },
    { name: 'cynthia-anime', label: 'Cynthia' },
  ],
  'Gym Leaders': [
    { name: 'brock-gen1', label: 'Brock' },
    { name: 'misty-gen1', label: 'Misty' },
    { name: 'ltsurge', label: 'Lt. Surge' },
    { name: 'erika-gen1', label: 'Erika' },
    { name: 'sabrina-gen1', label: 'Sabrina' },
    { name: 'koga-gen1', label: 'Koga' },
    { name: 'blaine-gen1', label: 'Blaine' },
    { name: 'giovanni-gen1', label: 'Giovanni' },
    { name: 'whitney', label: 'Whitney' },
    { name: 'clair', label: 'Clair' },
    { name: 'roxanne', label: 'Roxanne' },
    { name: 'flannery', label: 'Flannery' },
    { name: 'elesa', label: 'Elesa' },
    { name: 'skyla', label: 'Skyla' },
    { name: 'korrina', label: 'Korrina' },
    { name: 'raihan', label: 'Raihan' },
    { name: 'nessa', label: 'Nessa' },
    { name: 'marnie', label: 'Marnie' },
  ],
  'Champions & Elite 4': [
    { name: 'lance', label: 'Lance' },
    { name: 'cynthia', label: 'Cynthia' },
    { name: 'steven', label: 'Steven' },
    { name: 'wallace', label: 'Wallace' },
    { name: 'alder', label: 'Alder' },
    { name: 'iris-gen5bw2', label: 'Iris' },
    { name: 'diantha', label: 'Diantha' },
    { name: 'leon', label: 'Leon' },
    { name: 'lorelei-gen3', label: 'Lorelei' },
    { name: 'bruno', label: 'Bruno' },
    { name: 'agatha-gen3', label: 'Agatha' },
    { name: 'karen', label: 'Karen' },
    { name: 'phoebe-gen3', label: 'Phoebe' },
    { name: 'flint', label: 'Flint' },
    { name: 'caitlin', label: 'Caitlin' },
    { name: 'grimsley', label: 'Grimsley' },
  ],
  'Rivals': [
    { name: 'blue-gen1', label: 'Blue' },
    { name: 'silver', label: 'Silver' },
    { name: 'wally', label: 'Wally' },
    { name: 'barry', label: 'Barry' },
    { name: 'cheren', label: 'Cheren' },
    { name: 'bianca', label: 'Bianca' },
    { name: 'hugh', label: 'Hugh' },
    { name: 'shauna', label: 'Shauna' },
    { name: 'hau', label: 'Hau' },
    { name: 'gladion', label: 'Gladion' },
    { name: 'hop', label: 'Hop' },
    { name: 'bede', label: 'Bede' },
  ],
  'Team Villains': [
    { name: 'rocketgrunt', label: 'Rocket Grunt' },
    { name: 'magmagrunt', label: 'Magma Grunt' },
    { name: 'aquagrunt', label: 'Aqua Grunt' },
    { name: 'galacticgrunt', label: 'Galactic Grunt' },
    { name: 'plasmagrunt', label: 'Plasma Grunt' },
    { name: 'flaregrunt', label: 'Flare Grunt' },
    { name: 'skullgrunt', label: 'Skull Grunt' },
    { name: 'giovanni', label: 'Giovanni' },
    { name: 'archie-gen6', label: 'Archie' },
    { name: 'maxie-gen6', label: 'Maxie' },
    { name: 'cyrus', label: 'Cyrus' },
    { name: 'ghetsis', label: 'Ghetsis' },
    { name: 'lysandre', label: 'Lysandre' },
    { name: 'guzma', label: 'Guzma' },
    { name: 'lusamine', label: 'Lusamine' },
  ],
  'Trainer Classes': [
    { name: 'acetrainer', label: 'Ace Trainer' },
    { name: 'acetrainerf', label: 'Ace Trainer F' },
    { name: 'youngster-gen4', label: 'Youngster' },
    { name: 'lass-gen4', label: 'Lass' },
    { name: 'hiker', label: 'Hiker' },
    { name: 'swimmer', label: 'Swimmer' },
    { name: 'swimmerf', label: 'Swimmer F' },
    { name: 'beauty', label: 'Beauty' },
    { name: 'scientist', label: 'Scientist' },
    { name: 'pokemonbreeder', label: 'Breeder' },
    { name: 'pokemonbreederf', label: 'Breeder F' },
    { name: 'pokemonranger', label: 'Ranger' },
    { name: 'pokemonrangerf', label: 'Ranger F' },
    { name: 'sailor', label: 'Sailor' },
    { name: 'fisherman', label: 'Fisherman' },
    { name: 'blackbelt', label: 'Black Belt' },
    { name: 'psychic-gen4', label: 'Psychic' },
    { name: 'guitarist', label: 'Guitarist' },
  ],
  'Special': [
    { name: 'oak', label: 'Prof. Oak' },
    { name: 'elm', label: 'Prof. Elm' },
    { name: 'birch', label: 'Prof. Birch' },
    { name: 'rowan', label: 'Prof. Rowan' },
    { name: 'juniper', label: 'Prof. Juniper' },
    { name: 'sycamore', label: 'Prof. Sycamore' },
    { name: 'kukui', label: 'Prof. Kukui' },
    { name: 'nurse', label: 'Nurse Joy' },
    { name: 'pokemoncenterlady', label: 'Poké Mart Lady' },
    { name: 'n', label: 'N' },
    { name: 'colress', label: 'Colress' },
    { name: 'zinnia', label: 'Zinnia' },
    { name: 'lillie', label: 'Lillie' },
    { name: 'lillie-z', label: 'Lillie Z' },
  ],
};

type Category = keyof typeof TRAINER_CATEGORIES;

export default function TrainerSprites({ onBack, onSelect, current }: TrainerSpritesProps) {
  const [selectedCategory, setSelectedCategory] = useState<Category>('Protagonists');
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  const handleImageLoad = (name: string) => {
    setLoadedImages(prev => new Set(prev).add(name));
  };

  const handleImageError = (name: string) => {
    setFailedImages(prev => new Set(prev).add(name));
  };

  const src = (spriteName: string) => `${SPRITE_BASE}/${spriteName}.png`;

  const handleSelect = (spriteName: string) => {
    // Return the full URL so it can be used as profile pic
    onSelect(src(spriteName));
  };

  const categories = Object.keys(TRAINER_CATEGORIES) as Category[];
  const trainers = TRAINER_CATEGORIES[selectedCategory];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Bar
        left={<button onClick={onBack} title="Back"><Icon name="back" size={16} /></button>}
        title="Trainer sprites"
      />

      <div className="ds-scroll" style={{ flex: 'none', display: 'flex', gap: 6, padding: '6px 8px', overflowX: 'auto', background: 'var(--ds-panel)', borderBottom: '2px solid var(--ds-line)' }}>
        {categories.map((category) => (
          <Key
            key={category}
            on={selectedCategory === category}
            onClick={() => setSelectedCategory(category)}
            style={{ flex: 'none', minHeight: 28, fontSize: 12, whiteSpace: 'nowrap' }}
          >
            {category}
          </Key>
        ))}
      </div>

      <div className="ds-lcd ds-scroll" style={{ flex: 1, minHeight: 0, padding: 10 }}>
        <div className="ds-small ds-muted" style={{ textAlign: 'center', marginBottom: 8 }}>Tap a trainer to use it as your picture.</div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {trainers.map((trainer) => {
            const hasLoaded = loadedImages.has(trainer.name);
            const hasFailed = failedImages.has(trainer.name);
            const selected = current === src(trainer.name);

            return (
              <button
                key={trainer.name}
                onClick={() => !hasFailed && handleSelect(trainer.name)}
                disabled={hasFailed}
                title={trainer.label}
                style={{
                  aspectRatio: '1',
                  width: '100%',
                  padding: 4,
                  border: '1px solid var(--ds-line)',
                  outline: selected ? '2px solid var(--ds-ink)' : undefined,
                  outlineOffset: selected ? 1 : undefined,
                  background: 'var(--ds-paper)',
                  opacity: hasFailed ? 0.4 : 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 2,
                  overflow: 'hidden'
                }}
              >
                <div style={{ flex: 1, minHeight: 0, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img
                    className="px"
                    src={src(trainer.name)}
                    alt={trainer.label}
                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', opacity: hasLoaded ? 1 : 0 }}
                    onLoad={() => handleImageLoad(trainer.name)}
                    onError={() => handleImageError(trainer.name)}
                  />
                </div>
                <span className="ds-muted" style={{ fontSize: 10, lineHeight: 1.1, width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {trainer.label}
                </span>
              </button>
            );
          })}
        </div>

        <div className="ds-small ds-faint" style={{ textAlign: 'center', marginTop: 12 }}>
          Sprites from Pokémon Showdown
        </div>
      </div>
    </div>
  );
}
