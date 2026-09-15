// The host types the party code into a few places (room controls, awards,
// password resets). Remember it on this phone so it is typed once a night.
const KEY = 'otychat.partyCode';

export function loadPartyCode(): string {
  try {
    return localStorage.getItem(KEY) || '';
  } catch {
    return '';
  }
}

export function savePartyCode(code: string) {
  try {
    if (code) localStorage.setItem(KEY, code);
    else localStorage.removeItem(KEY);
  } catch {
    // private mode or storage full; the field just starts empty next time
  }
}
