/**
 * OtyChat Pokemon System
 * Zone-based spawning with ~200 curated fan-favorite Pokemon
 */

// ============================================
// POKEMON DATA (Curated ~200 from Gen 1-3)
// ============================================

const POKEMON_DATA = {
  // Gen 1 Starters & Evolutions
  1: { name: 'Bulbasaur', types: ['grass', 'poison'] },
  2: { name: 'Ivysaur', types: ['grass', 'poison'] },
  3: { name: 'Venusaur', types: ['grass', 'poison'] },
  4: { name: 'Charmander', types: ['fire'] },
  5: { name: 'Charmeleon', types: ['fire'] },
  6: { name: 'Charizard', types: ['fire', 'flying'] },
  7: { name: 'Squirtle', types: ['water'] },
  8: { name: 'Wartortle', types: ['water'] },
  9: { name: 'Blastoise', types: ['water'] },

  // Gen 1 Bug/Flying
  10: { name: 'Caterpie', types: ['bug'] },
  11: { name: 'Metapod', types: ['bug'] },
  12: { name: 'Butterfree', types: ['bug', 'flying'] },
  13: { name: 'Weedle', types: ['bug', 'poison'] },
  14: { name: 'Kakuna', types: ['bug', 'poison'] },
  15: { name: 'Beedrill', types: ['bug', 'poison'] },
  16: { name: 'Pidgey', types: ['normal', 'flying'] },
  17: { name: 'Pidgeotto', types: ['normal', 'flying'] },
  18: { name: 'Pidgeot', types: ['normal', 'flying'] },
  19: { name: 'Rattata', types: ['normal'] },
  20: { name: 'Raticate', types: ['normal'] },
  21: { name: 'Spearow', types: ['normal', 'flying'] },
  22: { name: 'Fearow', types: ['normal', 'flying'] },
  23: { name: 'Ekans', types: ['poison'] },
  24: { name: 'Arbok', types: ['poison'] },

  // Pikachu line
  25: { name: 'Pikachu', types: ['electric'] },
  26: { name: 'Raichu', types: ['electric'] },

  // Ground types
  27: { name: 'Sandshrew', types: ['ground'] },
  28: { name: 'Sandslash', types: ['ground'] },
  29: { name: 'Nidoran♀', types: ['poison'] },
  30: { name: 'Nidorina', types: ['poison'] },
  31: { name: 'Nidoqueen', types: ['poison', 'ground'] },
  32: { name: 'Nidoran♂', types: ['poison'] },
  33: { name: 'Nidorino', types: ['poison'] },
  34: { name: 'Nidoking', types: ['poison', 'ground'] },

  // Fairy-like
  35: { name: 'Clefairy', types: ['fairy'] },
  36: { name: 'Clefable', types: ['fairy'] },
  37: { name: 'Vulpix', types: ['fire'] },
  38: { name: 'Ninetales', types: ['fire'] },
  39: { name: 'Jigglypuff', types: ['normal', 'fairy'] },
  40: { name: 'Wigglytuff', types: ['normal', 'fairy'] },
  41: { name: 'Zubat', types: ['poison', 'flying'] },
  42: { name: 'Golbat', types: ['poison', 'flying'] },

  // Grass types
  43: { name: 'Oddish', types: ['grass', 'poison'] },
  44: { name: 'Gloom', types: ['grass', 'poison'] },
  45: { name: 'Vileplume', types: ['grass', 'poison'] },
  46: { name: 'Paras', types: ['bug', 'grass'] },
  47: { name: 'Parasect', types: ['bug', 'grass'] },
  48: { name: 'Venonat', types: ['bug', 'poison'] },
  49: { name: 'Venomoth', types: ['bug', 'poison'] },
  50: { name: 'Diglett', types: ['ground'] },
  51: { name: 'Dugtrio', types: ['ground'] },
  52: { name: 'Meowth', types: ['normal'] },
  53: { name: 'Persian', types: ['normal'] },
  54: { name: 'Psyduck', types: ['water'] },
  55: { name: 'Golduck', types: ['water'] },
  56: { name: 'Mankey', types: ['fighting'] },
  57: { name: 'Primeape', types: ['fighting'] },
  58: { name: 'Growlithe', types: ['fire'] },
  59: { name: 'Arcanine', types: ['fire'] },
  60: { name: 'Poliwag', types: ['water'] },
  61: { name: 'Poliwhirl', types: ['water'] },
  62: { name: 'Poliwrath', types: ['water', 'fighting'] },
  63: { name: 'Abra', types: ['psychic'] },
  64: { name: 'Kadabra', types: ['psychic'] },
  65: { name: 'Alakazam', types: ['psychic'] },
  66: { name: 'Machop', types: ['fighting'] },
  67: { name: 'Machoke', types: ['fighting'] },
  68: { name: 'Machamp', types: ['fighting'] },
  69: { name: 'Bellsprout', types: ['grass', 'poison'] },
  70: { name: 'Weepinbell', types: ['grass', 'poison'] },
  71: { name: 'Victreebel', types: ['grass', 'poison'] },
  72: { name: 'Tentacool', types: ['water', 'poison'] },
  73: { name: 'Tentacruel', types: ['water', 'poison'] },
  74: { name: 'Geodude', types: ['rock', 'ground'] },
  75: { name: 'Graveler', types: ['rock', 'ground'] },
  76: { name: 'Golem', types: ['rock', 'ground'] },
  77: { name: 'Ponyta', types: ['fire'] },
  78: { name: 'Rapidash', types: ['fire'] },
  79: { name: 'Slowpoke', types: ['water', 'psychic'] },
  80: { name: 'Slowbro', types: ['water', 'psychic'] },
  81: { name: 'Magnemite', types: ['electric', 'steel'] },
  82: { name: 'Magneton', types: ['electric', 'steel'] },
  83: { name: 'Farfetch\'d', types: ['normal', 'flying'] },
  84: { name: 'Doduo', types: ['normal', 'flying'] },
  85: { name: 'Dodrio', types: ['normal', 'flying'] },
  86: { name: 'Seel', types: ['water'] },
  87: { name: 'Dewgong', types: ['water', 'ice'] },
  88: { name: 'Grimer', types: ['poison'] },
  89: { name: 'Muk', types: ['poison'] },
  90: { name: 'Shellder', types: ['water'] },
  91: { name: 'Cloyster', types: ['water', 'ice'] },
  92: { name: 'Gastly', types: ['ghost', 'poison'] },
  93: { name: 'Haunter', types: ['ghost', 'poison'] },
  94: { name: 'Gengar', types: ['ghost', 'poison'] },
  95: { name: 'Onix', types: ['rock', 'ground'] },
  96: { name: 'Drowzee', types: ['psychic'] },
  97: { name: 'Hypno', types: ['psychic'] },
  98: { name: 'Krabby', types: ['water'] },
  99: { name: 'Kingler', types: ['water'] },
  100: { name: 'Voltorb', types: ['electric'] },
  101: { name: 'Electrode', types: ['electric'] },
  102: { name: 'Exeggcute', types: ['grass', 'psychic'] },
  103: { name: 'Exeggutor', types: ['grass', 'psychic'] },
  104: { name: 'Cubone', types: ['ground'] },
  105: { name: 'Marowak', types: ['ground'] },
  106: { name: 'Hitmonlee', types: ['fighting'] },
  107: { name: 'Hitmonchan', types: ['fighting'] },
  108: { name: 'Lickitung', types: ['normal'] },
  109: { name: 'Koffing', types: ['poison'] },
  110: { name: 'Weezing', types: ['poison'] },
  111: { name: 'Rhyhorn', types: ['ground', 'rock'] },
  112: { name: 'Rhydon', types: ['ground', 'rock'] },
  113: { name: 'Chansey', types: ['normal'] },
  114: { name: 'Tangela', types: ['grass'] },
  115: { name: 'Kangaskhan', types: ['normal'] },
  116: { name: 'Horsea', types: ['water'] },
  117: { name: 'Seadra', types: ['water'] },
  118: { name: 'Goldeen', types: ['water'] },
  119: { name: 'Seaking', types: ['water'] },
  120: { name: 'Staryu', types: ['water'] },
  121: { name: 'Starmie', types: ['water', 'psychic'] },
  122: { name: 'Mr. Mime', types: ['psychic', 'fairy'] },
  123: { name: 'Scyther', types: ['bug', 'flying'] },
  124: { name: 'Jynx', types: ['ice', 'psychic'] },
  125: { name: 'Electabuzz', types: ['electric'] },
  126: { name: 'Magmar', types: ['fire'] },
  127: { name: 'Pinsir', types: ['bug'] },
  128: { name: 'Tauros', types: ['normal'] },
  129: { name: 'Magikarp', types: ['water'] },
  130: { name: 'Gyarados', types: ['water', 'flying'] },
  131: { name: 'Lapras', types: ['water', 'ice'] },
  132: { name: 'Ditto', types: ['normal'] },
  133: { name: 'Eevee', types: ['normal'] },
  134: { name: 'Vaporeon', types: ['water'] },
  135: { name: 'Jolteon', types: ['electric'] },
  136: { name: 'Flareon', types: ['fire'] },
  137: { name: 'Porygon', types: ['normal'] },
  138: { name: 'Omanyte', types: ['rock', 'water'] },
  139: { name: 'Omastar', types: ['rock', 'water'] },
  140: { name: 'Kabuto', types: ['rock', 'water'] },
  141: { name: 'Kabutops', types: ['rock', 'water'] },
  142: { name: 'Aerodactyl', types: ['rock', 'flying'] },
  143: { name: 'Snorlax', types: ['normal'] },
  144: { name: 'Articuno', types: ['ice', 'flying'] },
  145: { name: 'Zapdos', types: ['electric', 'flying'] },
  146: { name: 'Moltres', types: ['fire', 'flying'] },
  147: { name: 'Dratini', types: ['dragon'] },
  148: { name: 'Dragonair', types: ['dragon'] },
  149: { name: 'Dragonite', types: ['dragon', 'flying'] },
  150: { name: 'Mewtwo', types: ['psychic'] },
  151: { name: 'Mew', types: ['psychic'] },

  // Gen 2
  152: { name: 'Chikorita', types: ['grass'] },
  153: { name: 'Bayleef', types: ['grass'] },
  154: { name: 'Meganium', types: ['grass'] },
  155: { name: 'Cyndaquil', types: ['fire'] },
  156: { name: 'Quilava', types: ['fire'] },
  157: { name: 'Typhlosion', types: ['fire'] },
  158: { name: 'Totodile', types: ['water'] },
  159: { name: 'Croconaw', types: ['water'] },
  160: { name: 'Feraligatr', types: ['water'] },
  161: { name: 'Sentret', types: ['normal'] },
  162: { name: 'Furret', types: ['normal'] },
  163: { name: 'Hoothoot', types: ['normal', 'flying'] },
  164: { name: 'Noctowl', types: ['normal', 'flying'] },
  165: { name: 'Ledyba', types: ['bug', 'flying'] },
  166: { name: 'Ledian', types: ['bug', 'flying'] },
  167: { name: 'Spinarak', types: ['bug', 'poison'] },
  168: { name: 'Ariados', types: ['bug', 'poison'] },
  169: { name: 'Crobat', types: ['poison', 'flying'] },
  170: { name: 'Chinchou', types: ['water', 'electric'] },
  171: { name: 'Lanturn', types: ['water', 'electric'] },
  172: { name: 'Pichu', types: ['electric'] },
  173: { name: 'Cleffa', types: ['fairy'] },
  174: { name: 'Igglybuff', types: ['normal', 'fairy'] },
  175: { name: 'Togepi', types: ['fairy'] },
  176: { name: 'Togetic', types: ['fairy', 'flying'] },
  177: { name: 'Natu', types: ['psychic', 'flying'] },
  178: { name: 'Xatu', types: ['psychic', 'flying'] },
  179: { name: 'Mareep', types: ['electric'] },
  180: { name: 'Flaaffy', types: ['electric'] },
  181: { name: 'Ampharos', types: ['electric'] },
  182: { name: 'Bellossom', types: ['grass'] },
  183: { name: 'Marill', types: ['water', 'fairy'] },
  184: { name: 'Azumarill', types: ['water', 'fairy'] },
  185: { name: 'Sudowoodo', types: ['rock'] },
  186: { name: 'Politoed', types: ['water'] },
  187: { name: 'Hoppip', types: ['grass', 'flying'] },
  188: { name: 'Skiploom', types: ['grass', 'flying'] },
  189: { name: 'Jumpluff', types: ['grass', 'flying'] },
  190: { name: 'Aipom', types: ['normal'] },
  191: { name: 'Sunkern', types: ['grass'] },
  192: { name: 'Sunflora', types: ['grass'] },
  193: { name: 'Yanma', types: ['bug', 'flying'] },
  194: { name: 'Wooper', types: ['water', 'ground'] },
  195: { name: 'Quagsire', types: ['water', 'ground'] },
  196: { name: 'Espeon', types: ['psychic'] },
  197: { name: 'Umbreon', types: ['dark'] },
  198: { name: 'Murkrow', types: ['dark', 'flying'] },
  199: { name: 'Slowking', types: ['water', 'psychic'] },
  200: { name: 'Misdreavus', types: ['ghost'] },
  201: { name: 'Unown', types: ['psychic'] },
  202: { name: 'Wobbuffet', types: ['psychic'] },
  203: { name: 'Girafarig', types: ['normal', 'psychic'] },
  204: { name: 'Pineco', types: ['bug'] },
  205: { name: 'Forretress', types: ['bug', 'steel'] },
  206: { name: 'Dunsparce', types: ['normal'] },
  207: { name: 'Gligar', types: ['ground', 'flying'] },
  208: { name: 'Steelix', types: ['steel', 'ground'] },
  209: { name: 'Snubbull', types: ['fairy'] },
  210: { name: 'Granbull', types: ['fairy'] },
  211: { name: 'Qwilfish', types: ['water', 'poison'] },
  212: { name: 'Scizor', types: ['bug', 'steel'] },
  213: { name: 'Shuckle', types: ['bug', 'rock'] },
  214: { name: 'Heracross', types: ['bug', 'fighting'] },
  215: { name: 'Sneasel', types: ['dark', 'ice'] },
  216: { name: 'Teddiursa', types: ['normal'] },
  217: { name: 'Ursaring', types: ['normal'] },
  218: { name: 'Slugma', types: ['fire'] },
  219: { name: 'Magcargo', types: ['fire', 'rock'] },
  220: { name: 'Swinub', types: ['ice', 'ground'] },
  221: { name: 'Piloswine', types: ['ice', 'ground'] },
  222: { name: 'Corsola', types: ['water', 'rock'] },
  223: { name: 'Remoraid', types: ['water'] },
  224: { name: 'Octillery', types: ['water'] },
  225: { name: 'Delibird', types: ['ice', 'flying'] },
  226: { name: 'Mantine', types: ['water', 'flying'] },
  227: { name: 'Skarmory', types: ['steel', 'flying'] },
  228: { name: 'Houndour', types: ['dark', 'fire'] },
  229: { name: 'Houndoom', types: ['dark', 'fire'] },
  230: { name: 'Kingdra', types: ['water', 'dragon'] },
  231: { name: 'Phanpy', types: ['ground'] },
  232: { name: 'Donphan', types: ['ground'] },
  233: { name: 'Porygon2', types: ['normal'] },
  234: { name: 'Stantler', types: ['normal'] },
  235: { name: 'Smeargle', types: ['normal'] },
  236: { name: 'Tyrogue', types: ['fighting'] },
  237: { name: 'Hitmontop', types: ['fighting'] },
  238: { name: 'Smoochum', types: ['ice', 'psychic'] },
  239: { name: 'Elekid', types: ['electric'] },
  240: { name: 'Magby', types: ['fire'] },
  241: { name: 'Miltank', types: ['normal'] },
  242: { name: 'Blissey', types: ['normal'] },
  243: { name: 'Raikou', types: ['electric'] },
  244: { name: 'Entei', types: ['fire'] },
  245: { name: 'Suicune', types: ['water'] },
  246: { name: 'Larvitar', types: ['rock', 'ground'] },
  247: { name: 'Pupitar', types: ['rock', 'ground'] },
  248: { name: 'Tyranitar', types: ['rock', 'dark'] },
  249: { name: 'Lugia', types: ['psychic', 'flying'] },
  250: { name: 'Ho-Oh', types: ['fire', 'flying'] },
  251: { name: 'Celebi', types: ['psychic', 'grass'] },

  // Gen 3
  252: { name: 'Treecko', types: ['grass'] },
  253: { name: 'Grovyle', types: ['grass'] },
  254: { name: 'Sceptile', types: ['grass'] },
  255: { name: 'Torchic', types: ['fire'] },
  256: { name: 'Combusken', types: ['fire', 'fighting'] },
  257: { name: 'Blaziken', types: ['fire', 'fighting'] },
  258: { name: 'Mudkip', types: ['water'] },
  259: { name: 'Marshtomp', types: ['water', 'ground'] },
  260: { name: 'Swampert', types: ['water', 'ground'] },
  261: { name: 'Poochyena', types: ['dark'] },
  262: { name: 'Mightyena', types: ['dark'] },
  263: { name: 'Zigzagoon', types: ['normal'] },
  264: { name: 'Linoone', types: ['normal'] },
  265: { name: 'Wurmple', types: ['bug'] },
  266: { name: 'Silcoon', types: ['bug'] },
  267: { name: 'Beautifly', types: ['bug', 'flying'] },
  268: { name: 'Cascoon', types: ['bug'] },
  269: { name: 'Dustox', types: ['bug', 'poison'] },
  270: { name: 'Lotad', types: ['water', 'grass'] },
  271: { name: 'Lombre', types: ['water', 'grass'] },
  272: { name: 'Ludicolo', types: ['water', 'grass'] },
  273: { name: 'Seedot', types: ['grass'] },
  274: { name: 'Nuzleaf', types: ['grass', 'dark'] },
  275: { name: 'Shiftry', types: ['grass', 'dark'] },
  276: { name: 'Taillow', types: ['normal', 'flying'] },
  277: { name: 'Swellow', types: ['normal', 'flying'] },
  278: { name: 'Wingull', types: ['water', 'flying'] },
  279: { name: 'Pelipper', types: ['water', 'flying'] },
  280: { name: 'Ralts', types: ['psychic', 'fairy'] },
  281: { name: 'Kirlia', types: ['psychic', 'fairy'] },
  282: { name: 'Gardevoir', types: ['psychic', 'fairy'] },
  283: { name: 'Surskit', types: ['bug', 'water'] },
  284: { name: 'Masquerain', types: ['bug', 'flying'] },
  285: { name: 'Shroomish', types: ['grass'] },
  286: { name: 'Breloom', types: ['grass', 'fighting'] },
  287: { name: 'Slakoth', types: ['normal'] },
  288: { name: 'Vigoroth', types: ['normal'] },
  289: { name: 'Slaking', types: ['normal'] },
  290: { name: 'Nincada', types: ['bug', 'ground'] },
  291: { name: 'Ninjask', types: ['bug', 'flying'] },
  292: { name: 'Shedinja', types: ['bug', 'ghost'] },
  293: { name: 'Whismur', types: ['normal'] },
  294: { name: 'Loudred', types: ['normal'] },
  295: { name: 'Exploud', types: ['normal'] },
  296: { name: 'Makuhita', types: ['fighting'] },
  297: { name: 'Hariyama', types: ['fighting'] },
  298: { name: 'Azurill', types: ['normal', 'fairy'] },
  299: { name: 'Nosepass', types: ['rock'] },
  300: { name: 'Skitty', types: ['normal'] },
  301: { name: 'Delcatty', types: ['normal'] },
  302: { name: 'Sableye', types: ['dark', 'ghost'] },
  303: { name: 'Mawile', types: ['steel', 'fairy'] },
  304: { name: 'Aron', types: ['steel', 'rock'] },
  305: { name: 'Lairon', types: ['steel', 'rock'] },
  306: { name: 'Aggron', types: ['steel', 'rock'] },
  307: { name: 'Meditite', types: ['fighting', 'psychic'] },
  308: { name: 'Medicham', types: ['fighting', 'psychic'] },
  309: { name: 'Electrike', types: ['electric'] },
  310: { name: 'Manectric', types: ['electric'] },
  311: { name: 'Plusle', types: ['electric'] },
  312: { name: 'Minun', types: ['electric'] },
  313: { name: 'Volbeat', types: ['bug'] },
  314: { name: 'Illumise', types: ['bug'] },
  315: { name: 'Roselia', types: ['grass', 'poison'] },
  316: { name: 'Gulpin', types: ['poison'] },
  317: { name: 'Swalot', types: ['poison'] },
  318: { name: 'Carvanha', types: ['water', 'dark'] },
  319: { name: 'Sharpedo', types: ['water', 'dark'] },
  320: { name: 'Wailmer', types: ['water'] },
  321: { name: 'Wailord', types: ['water'] },
  322: { name: 'Numel', types: ['fire', 'ground'] },
  323: { name: 'Camerupt', types: ['fire', 'ground'] },
  324: { name: 'Torkoal', types: ['fire'] },
  325: { name: 'Spoink', types: ['psychic'] },
  326: { name: 'Grumpig', types: ['psychic'] },
  327: { name: 'Spinda', types: ['normal'] },
  328: { name: 'Trapinch', types: ['ground'] },
  329: { name: 'Vibrava', types: ['ground', 'dragon'] },
  330: { name: 'Flygon', types: ['ground', 'dragon'] },
  331: { name: 'Cacnea', types: ['grass'] },
  332: { name: 'Cacturne', types: ['grass', 'dark'] },
  333: { name: 'Swablu', types: ['normal', 'flying'] },
  334: { name: 'Altaria', types: ['dragon', 'flying'] },
  335: { name: 'Zangoose', types: ['normal'] },
  336: { name: 'Seviper', types: ['poison'] },
  337: { name: 'Lunatone', types: ['rock', 'psychic'] },
  338: { name: 'Solrock', types: ['rock', 'psychic'] },
  339: { name: 'Barboach', types: ['water', 'ground'] },
  340: { name: 'Whiscash', types: ['water', 'ground'] },
  341: { name: 'Corphish', types: ['water'] },
  342: { name: 'Crawdaunt', types: ['water', 'dark'] },
  343: { name: 'Baltoy', types: ['ground', 'psychic'] },
  344: { name: 'Claydol', types: ['ground', 'psychic'] },
  345: { name: 'Lileep', types: ['rock', 'grass'] },
  346: { name: 'Cradily', types: ['rock', 'grass'] },
  347: { name: 'Anorith', types: ['rock', 'bug'] },
  348: { name: 'Armaldo', types: ['rock', 'bug'] },
  349: { name: 'Feebas', types: ['water'] },
  350: { name: 'Milotic', types: ['water'] },
  351: { name: 'Castform', types: ['normal'] },
  352: { name: 'Kecleon', types: ['normal'] },
  353: { name: 'Shuppet', types: ['ghost'] },
  354: { name: 'Banette', types: ['ghost'] },
  355: { name: 'Duskull', types: ['ghost'] },
  356: { name: 'Dusclops', types: ['ghost'] },
  357: { name: 'Tropius', types: ['grass', 'flying'] },
  358: { name: 'Chimecho', types: ['psychic'] },
  359: { name: 'Absol', types: ['dark'] },
  360: { name: 'Wynaut', types: ['psychic'] },
  361: { name: 'Snorunt', types: ['ice'] },
  362: { name: 'Glalie', types: ['ice'] },
  363: { name: 'Spheal', types: ['ice', 'water'] },
  364: { name: 'Sealeo', types: ['ice', 'water'] },
  365: { name: 'Walrein', types: ['ice', 'water'] },
  366: { name: 'Clamperl', types: ['water'] },
  367: { name: 'Huntail', types: ['water'] },
  368: { name: 'Gorebyss', types: ['water'] },
  369: { name: 'Relicanth', types: ['water', 'rock'] },
  370: { name: 'Luvdisc', types: ['water'] },
  371: { name: 'Bagon', types: ['dragon'] },
  372: { name: 'Shelgon', types: ['dragon'] },
  373: { name: 'Salamence', types: ['dragon', 'flying'] },
  374: { name: 'Beldum', types: ['steel', 'psychic'] },
  375: { name: 'Metang', types: ['steel', 'psychic'] },
  376: { name: 'Metagross', types: ['steel', 'psychic'] },
  377: { name: 'Regirock', types: ['rock'] },
  378: { name: 'Regice', types: ['ice'] },
  379: { name: 'Registeel', types: ['steel'] },
  380: { name: 'Latias', types: ['dragon', 'psychic'] },
  381: { name: 'Latios', types: ['dragon', 'psychic'] },
  382: { name: 'Kyogre', types: ['water'] },
  383: { name: 'Groudon', types: ['ground'] },
  384: { name: 'Rayquaza', types: ['dragon', 'flying'] },
  385: { name: 'Jirachi', types: ['steel', 'psychic'] },
  386: { name: 'Deoxys', types: ['psychic'] }
};

// ============================================
// ZONE DEFINITIONS
// ============================================

const ZONES = {
  meadow: {
    name: 'Starter Meadow',
    description: 'A peaceful meadow perfect for beginners',
    levelRequired: 1,
    pokemon: {
      common: [1, 4, 7, 10, 13, 16, 19, 21, 23, 29, 32, 35, 39, 41, 43, 46, 48, 52, 54, 56, 60, 63, 69, 74, 77, 84, 92, 96, 98, 100, 109, 114, 116, 118, 120, 129, 152, 155, 158, 161, 163, 165, 167, 172, 173, 174, 175, 177, 179, 183, 187, 191, 194, 198, 209, 216, 220, 231, 234, 252, 255, 258, 261, 263, 265, 270, 273, 276, 278, 283, 285, 287, 290, 293, 298, 300, 304, 309, 311, 312, 316, 322, 325, 327, 331, 333, 339, 341, 352, 353, 355, 363],
      uncommon: [2, 5, 8, 25, 37, 58, 66, 79, 81, 83, 104, 108, 111, 122, 124, 125, 126, 128, 133, 137, 147, 190, 193, 203, 206, 213, 215, 218, 223, 225, 228, 238, 239, 240, 280, 296, 318, 328, 337, 338, 343, 345, 347, 349, 351, 361],
      rare: [3, 6, 9, 26, 113, 115, 123, 127, 131, 132, 142, 143, 149, 201, 212, 214, 222, 226, 227, 230, 241, 242, 248, 282, 288, 289, 291, 292, 306, 319, 334, 344, 346, 348, 350, 354, 356, 357, 358, 359, 362, 365]
    }
  },
  forest: {
    name: 'Verdant Forest',
    description: 'A dense forest teeming with Bug and Grass types',
    levelRequired: 5,
    pokemon: {
      common: [1, 2, 10, 11, 13, 14, 43, 44, 46, 47, 69, 70, 102, 114, 152, 153, 165, 166, 167, 168, 182, 187, 188, 191, 192, 204, 252, 253, 265, 266, 268, 270, 271, 273, 274, 283, 285, 286, 290, 313, 314, 315, 331, 332],
      uncommon: [3, 12, 15, 45, 71, 103, 123, 127, 154, 189, 193, 205, 212, 214, 254, 267, 269, 272, 275, 284, 291, 292, 301, 357],
      rare: [251]
    }
  },
  mountain: {
    name: 'Volcanic Mountain',
    description: 'A fiery mountain home to Fire and Rock types',
    levelRequired: 10,
    pokemon: {
      common: [4, 5, 27, 28, 50, 51, 66, 67, 74, 75, 95, 104, 105, 155, 156, 194, 195, 218, 219, 231, 232, 246, 255, 256, 296, 322, 323, 324, 328, 343],
      uncommon: [6, 37, 38, 58, 59, 68, 76, 77, 78, 106, 107, 111, 112, 126, 157, 207, 208, 217, 229, 240, 247, 257, 297, 303, 304, 305, 306, 310, 329, 330, 338, 340, 344],
      rare: [142, 248, 324, 377],
      legendary: [146, 244, 383]
    }
  },
  ocean: {
    name: 'Deep Ocean',
    description: 'The vast ocean filled with Water and Ice types',
    levelRequired: 15,
    pokemon: {
      common: [7, 8, 54, 55, 60, 61, 72, 79, 86, 90, 98, 99, 116, 118, 119, 120, 129, 158, 159, 170, 194, 195, 211, 222, 223, 258, 259, 270, 271, 278, 279, 283, 318, 320, 339, 341, 363, 364, 366, 367, 368, 369, 370],
      uncommon: [9, 62, 73, 80, 87, 91, 117, 121, 130, 131, 134, 160, 171, 186, 199, 224, 226, 230, 260, 272, 284, 319, 321, 340, 342, 349, 365],
      rare: [131, 350, 369],
      legendary: [144, 245, 382]
    }
  },
  sky: {
    name: 'Sky Temple',
    description: 'A mystical temple in the clouds for Psychic and Dragon types',
    levelRequired: 20,
    pokemon: {
      common: [63, 64, 92, 93, 147, 148, 177, 178, 196, 197, 201, 280, 281, 325, 326, 329, 337, 355, 360, 371, 372, 374, 375],
      uncommon: [65, 94, 122, 149, 178, 199, 200, 202, 203, 282, 302, 326, 334, 337, 338, 344, 353, 354, 356, 358, 376],
      rare: [149, 248, 282, 289, 306, 330, 334, 348, 359, 362, 373, 376],
      legendary: [150, 249, 250, 377, 378, 379, 380, 381, 384]
    }
  },
  mystery: {
    name: '???',
    description: 'A mysterious realm where only mythical Pokemon dwell',
    levelRequired: 25,
    pokemon: {
      legendary: [151, 251, 385, 386]
    }
  }
};

// ============================================
// RARITY AND CATCH RATES
// ============================================

const RARITY_WEIGHTS = {
  meadow:   { common: 70, uncommon: 25, rare: 5 },
  forest:   { common: 60, uncommon: 30, rare: 10 },
  mountain: { common: 55, uncommon: 30, rare: 12, legendary: 3 },
  ocean:    { common: 50, uncommon: 30, rare: 15, legendary: 5 },
  sky:      { common: 40, uncommon: 30, rare: 20, legendary: 10 },
  mystery:  { legendary: 100 }
};

const BASE_CATCH_RATES = {
  common: 0.90,
  uncommon: 0.70,
  rare: 0.40,
  legendary: 0.15
};

const BALL_MODIFIERS = {
  pokeball: 1.0,
  great: 1.5,
  ultra: 2.0,
  master: Infinity
};

const QUICK_CATCH_BONUS = 0.10; // +10% if caught within 5 seconds

// Shiny rates
const SHINY_CHANCE = 100;       // 1 in 100 (1%)
const SHINY_CHARM_CHANCE = 50;  // 1 in 50 (2%)

// Timing
const MIN_SPAWN_INTERVAL = 2 * 60 * 1000;  // 2 minutes
const MAX_SPAWN_INTERVAL = 5 * 60 * 1000;  // 5 minutes
const CATCH_WINDOW = 60 * 1000;            // 60 seconds
const QUICK_CATCH_WINDOW = 5 * 1000;       // 5 seconds for bonus

// ============================================
// EVOLUTION DATA
// ============================================

const STONE_EVOLUTIONS = {
  fire_stone: {
    37: { to: 38, name: 'Ninetales' },
    58: { to: 59, name: 'Arcanine' },
    133: { to: 136, name: 'Flareon' },
    240: { to: 126, name: 'Magmar' }
  },
  water_stone: {
    61: { to: 62, name: 'Poliwrath' },
    90: { to: 91, name: 'Cloyster' },
    120: { to: 121, name: 'Starmie' },
    133: { to: 134, name: 'Vaporeon' },
    349: { to: 350, name: 'Milotic' }
  },
  thunder_stone: {
    25: { to: 26, name: 'Raichu' },
    133: { to: 135, name: 'Jolteon' },
    239: { to: 125, name: 'Electabuzz' }
  },
  leaf_stone: {
    44: { to: 45, name: 'Vileplume' },
    70: { to: 71, name: 'Victreebel' },
    102: { to: 103, name: 'Exeggutor' }
  },
  moon_stone: {
    30: { to: 31, name: 'Nidoqueen' },
    33: { to: 34, name: 'Nidoking' },
    35: { to: 36, name: 'Clefable' },
    39: { to: 40, name: 'Wigglytuff' }
  },
  sun_stone: {
    44: { to: 182, name: 'Bellossom' },
    191: { to: 192, name: 'Sunflora' }
  },
  dragon_scale: {
    117: { to: 230, name: 'Kingdra' }
  }
};

// Trainer level evolutions (reach trainer level to evolve)
const LEVEL_EVOLUTIONS = {
  129: { to: 130, trainerLevel: 10, name: 'Gyarados' },
  147: { to: 148, trainerLevel: 8, name: 'Dragonair' },
  148: { to: 149, trainerLevel: 15, name: 'Dragonite' },
  246: { to: 247, trainerLevel: 10, name: 'Pupitar' },
  247: { to: 248, trainerLevel: 18, name: 'Tyranitar' },
  371: { to: 372, trainerLevel: 12, name: 'Shelgon' },
  372: { to: 373, trainerLevel: 20, name: 'Salamence' },
  374: { to: 375, trainerLevel: 10, name: 'Metang' },
  375: { to: 376, trainerLevel: 18, name: 'Metagross' }
};

// ============================================
// SPAWN STATE (per-user spawns)
// ============================================

// Map of odId -> spawn data
const activeSpawns = new Map();

// Global spawn timer
let spawnTimer = null;

// ============================================
// HELPER FUNCTIONS
// ============================================

function getPokemonData(id) {
  return POKEMON_DATA[id] ? { id, ...POKEMON_DATA[id] } : null;
}

function getPokemonById(id) {
  return getPokemonData(id);
}

function getZoneData(zone) {
  return ZONES[zone] || ZONES.meadow;
}

function getRarityForPokemon(pokemonId, zone) {
  const zoneData = getZoneData(zone);
  for (const [rarity, ids] of Object.entries(zoneData.pokemon)) {
    if (ids && ids.includes(pokemonId)) {
      return rarity;
    }
  }
  return 'common';
}

function generateSpawnId() {
  return `spawn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function rollShiny(hasShinyCharm = false) {
  const chance = hasShinyCharm ? SHINY_CHARM_CHANCE : SHINY_CHANCE;
  return Math.random() < (1 / chance);
}

// ============================================
// ZONE-BASED SPAWNING
// ============================================

/**
 * Get a random Pokemon for a specific zone
 */
function getRandomPokemonForZone(zone) {
  const zoneData = getZoneData(zone);
  const weights = RARITY_WEIGHTS[zone] || RARITY_WEIGHTS.meadow;

  // Build weighted pool
  const weightedPool = [];

  for (const [rarity, pokemonIds] of Object.entries(zoneData.pokemon)) {
    const weight = weights[rarity] || 0;
    if (weight > 0 && pokemonIds && pokemonIds.length > 0) {
      for (let i = 0; i < weight; i++) {
        const randomId = pokemonIds[Math.floor(Math.random() * pokemonIds.length)];
        weightedPool.push({ id: randomId, rarity });
      }
    }
  }

  if (weightedPool.length === 0) {
    // Fallback to first common Pokemon
    const commonIds = zoneData.pokemon.common || [1];
    return { id: commonIds[0], rarity: 'common' };
  }

  const selected = weightedPool[Math.floor(Math.random() * weightedPool.length)];
  return selected;
}

/**
 * Create a spawn for a specific user/zone
 */
function createSpawnForUser(userId, zone, hasShinyCharm = false) {
  const { id: pokemonId, rarity } = getRandomPokemonForZone(zone);
  const pokemon = getPokemonData(pokemonId);

  if (!pokemon) return null;

  const isShiny = rollShiny(hasShinyCharm);

  const spawn = {
    odId: generateSpawnId(),
    userId,
    pokemon: { ...pokemon, rarity },
    isShiny,
    zone,
    spawnedAt: Date.now(),
    expiresAt: Date.now() + CATCH_WINDOW
  };

  activeSpawns.set(spawn.odId, spawn);

  return spawn;
}

/**
 * Clean up expired spawns
 */
function cleanupExpiredSpawns() {
  const now = Date.now();
  for (const [odId, spawn] of activeSpawns.entries()) {
    if (spawn.expiresAt <= now) {
      activeSpawns.delete(odId);
    }
  }
}

// ============================================
// CATCH MECHANICS
// ============================================

/**
 * Calculate catch chance
 */
function calculateCatchChance(pokemon, ballType = 'pokeball', spawnedAt = null) {
  const rarity = pokemon.rarity || 'common';
  let chance = BASE_CATCH_RATES[rarity] || BASE_CATCH_RATES.common;

  const ballMod = BALL_MODIFIERS[ballType] || 1.0;
  if (ballMod === Infinity) return 1.0; // Master Ball

  chance *= ballMod;

  // Quick catch bonus
  if (spawnedAt && (Date.now() - spawnedAt) <= QUICK_CATCH_WINDOW) {
    chance += QUICK_CATCH_BONUS;
  }

  return Math.min(chance, 1.0);
}

/**
 * Attempt to catch a Pokemon
 */
function attemptCatch(odId, ballType = 'pokeball') {
  cleanupExpiredSpawns();

  const spawn = activeSpawns.get(odId);
  if (!spawn) {
    return { success: false, reason: 'escaped' };
  }

  const catchChance = calculateCatchChance(spawn.pokemon, ballType, spawn.spawnedAt);
  const roll = Math.random();
  const isQuickCatch = (Date.now() - spawn.spawnedAt) <= QUICK_CATCH_WINDOW;

  if (roll < catchChance) {
    // Caught!
    activeSpawns.delete(odId);
    return {
      success: true,
      pokemon: spawn.pokemon,
      isShiny: spawn.isShiny,
      zone: spawn.zone,
      isQuickCatch,
      catchChance
    };
  } else {
    // Failed - Pokemon stays for retry (unless expired)
    return {
      success: false,
      reason: 'broke_free',
      pokemon: spawn.pokemon,
      catchChance
    };
  }
}

/**
 * Force catch (for admin or special cases)
 */
function forceCatch(odId) {
  const spawn = activeSpawns.get(odId);
  if (!spawn) return null;

  activeSpawns.delete(odId);
  return {
    success: true,
    pokemon: spawn.pokemon,
    isShiny: spawn.isShiny,
    zone: spawn.zone
  };
}

// ============================================
// AUTO-SPAWN SYSTEM
// ============================================

/**
 * Get random spawn interval
 */
function getRandomSpawnInterval() {
  return MIN_SPAWN_INTERVAL + Math.random() * (MAX_SPAWN_INTERVAL - MIN_SPAWN_INTERVAL);
}

/**
 * Trigger a global spawn event (server calls this, creates per-user spawns)
 */
function triggerGlobalSpawn(onSpawnForUser) {
  cleanupExpiredSpawns();
  // Server handles creating per-user spawns
  if (onSpawnForUser) {
    onSpawnForUser();
  }
}

/**
 * Start auto-spawn timer
 */
function startAutoSpawn(onGlobalSpawn) {
  // Idempotent: boot and the admin page can both call this.
  if (spawnTimer) {
    clearTimeout(spawnTimer);
    spawnTimer = null;
  }

  const scheduleNext = () => {
    const interval = getRandomSpawnInterval();
    console.log(`[Pokemon] Next spawn in ${Math.round(interval / 1000 / 60)} minutes`);

    spawnTimer = setTimeout(() => {
      onGlobalSpawn();
      scheduleNext();
    }, interval);
  };

  scheduleNext();
}

/**
 * Stop auto-spawn
 */
function stopAutoSpawn() {
  if (spawnTimer) {
    clearTimeout(spawnTimer);
    spawnTimer = null;
  }
  activeSpawns.clear();
}

/**
 * Manual spawn for admin
 */
function adminSpawn(userId, zone, forcePokemonId = null, forceShiny = false, hasShinyCharm = false) {
  let pokemon, rarity;

  if (forcePokemonId) {
    pokemon = getPokemonData(forcePokemonId);
    rarity = getRarityForPokemon(forcePokemonId, zone);
  } else {
    const result = getRandomPokemonForZone(zone);
    pokemon = getPokemonData(result.id);
    rarity = result.rarity;
  }

  if (!pokemon) return null;

  const isShiny = forceShiny || rollShiny(hasShinyCharm);

  const spawn = {
    odId: generateSpawnId(),
    userId,
    pokemon: { ...pokemon, rarity },
    isShiny,
    zone,
    spawnedAt: Date.now(),
    expiresAt: Date.now() + CATCH_WINDOW
  };

  activeSpawns.set(spawn.odId, spawn);
  return spawn;
}

// ============================================
// REWARDS
// ============================================

const XP_REWARDS = {
  catch: 25,
  shiny_catch: 100,
  legendary_catch: 50,
  quick_catch_bonus: 10
};

const COIN_REWARDS = {
  common: 5,
  uncommon: 10,
  rare: 20,
  legendary: 50
};

function getCatchReward(pokemon, isShiny, isQuickCatch = false) {
  const rarity = pokemon.rarity || 'common';
  let coins = COIN_REWARDS[rarity] || 5;
  let xp = XP_REWARDS.catch;

  if (isShiny) {
    coins *= 5;
    xp = XP_REWARDS.shiny_catch;
  }

  if (rarity === 'legendary') {
    xp += XP_REWARDS.legendary_catch;
  }

  if (isQuickCatch) {
    xp += XP_REWARDS.quick_catch_bonus;
  }

  return { coins, xp };
}

// ============================================
// EVOLUTION
// ============================================

function canEvolveWithStone(pokemonId, stoneType) {
  const stoneEvos = STONE_EVOLUTIONS[stoneType];
  return stoneEvos && stoneEvos[pokemonId];
}

function getStoneEvolution(pokemonId, stoneType) {
  const stoneEvos = STONE_EVOLUTIONS[stoneType];
  return stoneEvos ? stoneEvos[pokemonId] : null;
}

function canEvolveWithLevel(pokemonId, trainerLevel) {
  const evo = LEVEL_EVOLUTIONS[pokemonId];
  return evo && trainerLevel >= evo.trainerLevel;
}

function getLevelEvolution(pokemonId) {
  return LEVEL_EVOLUTIONS[pokemonId] || null;
}

function getAvailableEvolutions(pokemonId, trainerLevel, stones = {}) {
  const evolutions = [];

  // Check level evolution
  const levelEvo = LEVEL_EVOLUTIONS[pokemonId];
  if (levelEvo && trainerLevel >= levelEvo.trainerLevel) {
    evolutions.push({
      type: 'level',
      to: levelEvo.to,
      name: levelEvo.name,
      requirement: `Trainer Level ${levelEvo.trainerLevel}`
    });
  }

  // Check stone evolutions
  for (const [stone, evos] of Object.entries(STONE_EVOLUTIONS)) {
    if (evos[pokemonId] && stones[stone] > 0) {
      evolutions.push({
        type: 'stone',
        stone,
        to: evos[pokemonId].to,
        name: evos[pokemonId].name,
        requirement: stone.replace('_', ' ')
      });
    }
  }

  return evolutions;
}

// ============================================
// SPRITE URLS
// ============================================

const SPRITE_BASE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon';

function getSpriteUrl(pokemonId, isShiny = false) {
  if (isShiny) {
    return `${SPRITE_BASE}/shiny/${pokemonId}.png`;
  }
  return `${SPRITE_BASE}/${pokemonId}.png`;
}

function getAnimatedSpriteUrl(pokemonId, isShiny = false) {
  // Gen 5 animated sprites (works for Gen 1-5)
  const shinyPath = isShiny ? 'shiny/' : '';
  return `${SPRITE_BASE}/versions/generation-v/black-white/animated/${shinyPath}${pokemonId}.gif`;
}

function getOfficialArtworkUrl(pokemonId) {
  return `${SPRITE_BASE}/other/official-artwork/${pokemonId}.png`;
}

// ============================================
// EXPORTS
// ============================================

module.exports = {
  // Data
  POKEMON_DATA,
  ZONES,
  ZONE_REQUIREMENTS: Object.fromEntries(
    Object.entries(ZONES).map(([k, v]) => [k, v.levelRequired])
  ),
  RARITY_WEIGHTS,
  BASE_CATCH_RATES,
  BALL_MODIFIERS,
  STONE_EVOLUTIONS,
  LEVEL_EVOLUTIONS,
  XP_REWARDS,
  COIN_REWARDS,
  CATCH_WINDOW,
  QUICK_CATCH_WINDOW,

  // Pokemon functions
  getPokemonById,
  getPokemonData,
  getZoneData,
  getRarityForPokemon,
  getRandomPokemonForZone,

  // Spawn functions
  createSpawnForUser,
  triggerGlobalSpawn,
  startAutoSpawn,
  stopAutoSpawn,
  adminSpawn,
  cleanupExpiredSpawns,

  // Catch functions
  calculateCatchChance,
  attemptCatch,
  forceCatch,
  rollShiny,

  // Rewards
  getCatchReward,

  // Evolution
  canEvolveWithStone,
  getStoneEvolution,
  canEvolveWithLevel,
  getLevelEvolution,
  getAvailableEvolutions,

  // Sprites
  getSpriteUrl,
  getAnimatedSpriteUrl,
  getOfficialArtworkUrl
};
