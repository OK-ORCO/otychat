/**
 * 18x18 line icons. Stroke follows currentColor, crisp edges, no fills.
 * Add a name here rather than reaching for an emoji.
 */
const PATHS: Record<string, string> = {
  home: 'M3 15 V7 l6 -4 l6 4 v8 z M7 15 v-5 h4 v5',
  chat: 'M2 3 h14 v9 H7 l-4 3 v-3 H2 z',
  mail: 'M2 4 h14 v10 H2 z M2 4 l7 6 l7 -6',
  star: 'M9 2 l2 5 l5 0 l-4 3 l2 5 l-5 -3 l-5 3 l2 -5 l-4 -3 l5 0 z',
  person: 'M9 3 a3 3 0 1 1 0 6 a3 3 0 1 1 0 -6 M3 16 c0 -5 12 -5 12 0',
  pokeball: 'M9 2 a7 7 0 1 1 0 14 a7 7 0 1 1 0 -14 M2 9 h14 M9 7 a2 2 0 0 1 0 4 a2 2 0 0 1 0 -4',
  pencil: 'M3 15 L13 5 L15 7 L5 17 Z M12 4 L15 7 M3 15 l0 2 l2 0',
  text: 'M4 4 h10 M9 4 v10 M6 14 h6',
  lines: 'M4 5 h10 M4 9 h10 M4 13 h10',
  camera: 'M3 6 h3 l1 -2 h4 l1 2 h3 v8 H3 z M9 8 a2 2 0 1 1 0 4 a2 2 0 1 1 0 -4',
  image: 'M3 4 h12 v10 H3 z M3 12 l4 -4 l3 3 l2 -2 l3 3',
  send: 'M2 4 h14 v10 H2 z M2 4 l7 6 l7 -6',
  trash: 'M4 5 h10 M7 5 V3 h4 v2 M5 5 l1 10 h6 l1 -10 M8 8 v5 M10 8 v5',
  back: 'M11 3 L5 9 L11 15 M5 9 h10',
  check: 'M3 9 l4 4 l8 -8',
  x: 'M4 4 l10 10 M14 4 L4 14',
  tv: 'M2 4 h14 v9 H2 z M6 16 h6 M9 13 v3',
  bell: 'M9 2 c3 0 4 2 4 5 v3 l2 3 H3 l2 -3 V7 c0 -3 1 -5 4 -5 z M7 15 c0 2 4 2 4 0',
  cog: 'M9 5 a4 4 0 1 1 0 8 a4 4 0 1 1 0 -8 M9 1 v3 M9 14 v3 M1 9 h3 M14 9 h3 M3.5 3.5 l2 2 M12.5 12.5 l2 2 M14.5 3.5 l-2 2 M5.5 12.5 l-2 2',
  shop: 'M3 6 h12 l-1 9 H4 z M6 6 c0 -4 6 -4 6 0',
  trophy: 'M5 3 h8 v5 c0 2 -2 4 -4 4 c-2 0 -4 -2 -4 -4 z M5 4 H2 v2 c0 2 3 3 3 3 M13 4 h3 v2 c0 2 -3 3 -3 3 M9 12 v3 M6 15 h6',
  drink: 'M5 3 h8 l-1 12 H6 z M5 7 h8',
  plus: 'M9 3 v12 M3 9 h12',
  minus: 'M3 9 h12',
  key: 'M6 6 a3 3 0 1 1 0 6 a3 3 0 1 1 0 -6 M9 9 h7 M13 9 v3 M15.5 9 v2',
  search: 'M8 3 a5 5 0 1 1 0 10 a5 5 0 1 1 0 -10 M12 12 l4 4',
  heart: 'M9 15 L3 9 a3 3 0 0 1 6 -3 a3 3 0 0 1 6 3 z',
  fire: 'M9 2 c1 3 4 4 4 8 a4 4 0 0 1 -8 0 c0 -2 1 -3 2 -4 c0 2 1 3 2 3 c0 -3 -1 -5 0 -7 z',
  question: 'M6 6 a3 3 0 1 1 5 2 c-1 1 -2 1 -2 3 M9 14 v1',
  moon: 'M12 3 a6 6 0 1 0 3 10 a5 5 0 0 1 -3 -10 z',
  play: 'M5 3 l10 6 l-10 6 z',
  eye: 'M2 9 c3 -5 11 -5 14 0 c-3 5 -11 5 -14 0 z M9 7 a2 2 0 1 1 0 4 a2 2 0 1 1 0 -4',
  map: 'M2 5 l5 -2 l4 2 l5 -2 v10 l-5 2 l-4 -2 l-5 2 z M7 3 v10 M11 5 v10',
  book: 'M3 3 h5 c1 0 1 1 1 1 v11 c0 -1 -1 -1 -1 -1 H3 z M15 3 h-5 c-1 0 -1 1 -1 1 v11 c0 -1 1 -1 1 -1 h5 z',
  list: 'M4 5 h1 M7 5 h7 M4 9 h1 M7 9 h7 M4 13 h1 M7 13 h7',
  sparkle: 'M9 2 v14 M2 9 h14 M5 5 l8 8 M13 5 l-8 8',
  megaphone: 'M3 7 h3 l7 -4 v12 l-7 -4 H3 z M6 11 v4 h2 v-3',
  popcorn: 'M4 6 h10 l-1 10 H5 z M4 6 c0 -3 3 -3 3 -1 c0 -2 4 -2 4 0 c0 -2 3 -2 3 1 M7 6 v10 M11 6 v10',
  dice: 'M3 3 h12 v12 H3 z M6 6 h1 M11 6 h1 M6 12 h1 M11 12 h1 M8.5 9 h1',
  logout: 'M7 3 H3 v12 h4 M10 6 l4 3 l-4 3 M6 9 h8',
  palette: 'M9 2 a7 7 0 0 0 0 14 c2 0 1 -2 3 -2 h2 a2 2 0 0 0 0 -4 c-1 -5 -3 -8 -5 -8 z M6 7 h1 M9 5 h1 M12 7 h1',
  refresh: 'M15 8 a6 6 0 1 0 -1 5 M15 3 v5 h-5',
  info: 'M9 2 a7 7 0 1 1 0 14 a7 7 0 1 1 0 -14 M9 8 v5 M9 5 v1',
  clock: 'M9 2 a7 7 0 1 1 0 14 a7 7 0 1 1 0 -14 M9 5 v4 l3 2',
  users: 'M6 4 a2.5 2.5 0 1 1 0 5 a2.5 2.5 0 1 1 0 -5 M12 5 a2 2 0 1 1 0 4 a2 2 0 1 1 0 -4 M1 15 c0 -4 10 -4 10 0 M11 12 c3 0 5 1 5 3',
  coin: 'M9 2 a7 7 0 1 1 0 14 a7 7 0 1 1 0 -14 M9 5 v8 M7 7 h3 a1.5 1.5 0 0 1 0 3 H7 M7 10 h4 a1.5 1.5 0 0 1 0 3 H7',
  level: 'M3 15 h12 M4 15 v-4 h3 v4 M8 15 v-8 h3 v8 M12 15 v-11 h3 v11',
  dots: 'M4 9 h1 M9 9 h1 M14 9 h1',
  edit: 'M11 3 l4 4 l-8 8 H3 v-4 z M9 5 l4 4',
  broom: 'M12 2 l4 4 l-6 6 l-4 -4 z M6 8 l-4 4 l2 4 l4 -2 l2 -2',
  smile: 'M9 2 a7 7 0 1 1 0 14 a7 7 0 1 1 0 -14 M6 7 h1 M11 7 h1 M6 11 c1 1.5 5 1.5 6 0',
};

interface IconProps {
  name: keyof typeof PATHS | string;
  size?: number;
  className?: string;
  title?: string;
}

export default function Icon({ name, size = 18, className, title }: IconProps) {
  const d = PATHS[name] || PATHS.question;
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 18 18"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="square"
      strokeLinejoin="miter"
      shapeRendering="crispEdges"
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
    >
      {title && <title>{title}</title>}
      <path d={d} />
    </svg>
  );
}

export const ICON_NAMES = Object.keys(PATHS);
