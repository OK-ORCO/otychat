/*
  DS Lite colourways and LCD patterns. A theme recolours the plastic shell only
  (see the html[data-theme] blocks in styles/ds.css); paper and ink never change.
  Both choices live in localStorage and are applied to <html> before first render.
*/

export type ThemeId = 'white' | 'onyx' | 'ice' | 'coral' | 'lime' | 'cobalt' | 'crimson';
export type ScreenId = 'lines' | 'dots' | 'grid' | 'plain';

export const THEMES: { id: ThemeId; name: string; swatch: { bg: string; accent: string } }[] = [
  { id: 'white', name: 'Polar White', swatch: { bg: '#d9dde3', accent: '#3b62c4' } },
  { id: 'onyx', name: 'Onyx', swatch: { bg: '#2f333a', accent: '#3b62c4' } },
  { id: 'ice', name: 'Ice Blue', swatch: { bg: '#cfe0ef', accent: '#2b6cb0' } },
  { id: 'coral', name: 'Coral Pink', swatch: { bg: '#f1d4d9', accent: '#c94d78' } },
  { id: 'lime', name: 'Lime Green', swatch: { bg: '#dbe6c3', accent: '#4f8a2c' } },
  { id: 'cobalt', name: 'Cobalt Black', swatch: { bg: '#22262e', accent: '#1f4fd6' } },
  { id: 'crimson', name: 'Crimson', swatch: { bg: '#b8323a', accent: '#7a1d24' } },
];

export const SCREENS: { id: ScreenId; name: string }[] = [
  { id: 'lines', name: 'Lines' },
  { id: 'dots', name: 'Dots' },
  { id: 'grid', name: 'Grid' },
  { id: 'plain', name: 'Plain' },
];

const THEME_KEY = 'otychat.theme';
const SCREEN_KEY = 'otychat.screen';
const DEFAULT_THEME: ThemeId = 'white';
const DEFAULT_SCREEN: ScreenId = 'lines';

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // private mode or storage full; the choice still applies for this session
  }
}

export function loadTheme(): ThemeId {
  const stored = read(THEME_KEY);
  return THEMES.some(t => t.id === stored) ? (stored as ThemeId) : DEFAULT_THEME;
}

export function loadScreen(): ScreenId {
  const stored = read(SCREEN_KEY);
  return SCREENS.some(s => s.id === stored) ? (stored as ScreenId) : DEFAULT_SCREEN;
}

export function applyTheme(id: ThemeId) {
  document.documentElement.setAttribute('data-theme', id);
  write(THEME_KEY, id);
}

export function applyScreen(id: ScreenId) {
  document.documentElement.setAttribute('data-screen', id);
  write(SCREEN_KEY, id);
}

export function initTheme() {
  document.documentElement.setAttribute('data-theme', loadTheme());
  document.documentElement.setAttribute('data-screen', loadScreen());
}
