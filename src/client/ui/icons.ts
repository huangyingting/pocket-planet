// Minimal 24px line icons (stroke = currentColor) for the app chrome.
const P: Record<string, string> = {
  search: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/>',
  shuffle: '<path d="M4 7h3.5c4 0 5 10 9 10H20"/><path d="M4 17h3.5c1.6 0 2.7-1.6 3.6-3.5"/><path d="M13 9.5c.9-1.4 1.9-2.5 3.5-2.5H20"/><path d="m17.5 4.5 2.5 2.5-2.5 2.5M17.5 14.5l2.5 2.5-2.5 2.5"/>',
  camera: '<path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2l1.5-2h6l1.5 2h2A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5z"/><circle cx="12" cy="12.5" r="3.5"/>',
  collection: '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>',
  game: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1" fill="currentColor"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  expand: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
  help: '<circle cx="12" cy="12" r="8.5"/><path d="M9.6 9.5a2.5 2.5 0 0 1 4.9.6c0 1.7-2.5 2.2-2.5 3.6"/><circle cx="12" cy="16.8" r=".6" fill="currentColor"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  heart: '<path d="M12 19.5s-7.5-4.4-7.5-10A4 4 0 0 1 12 7.3a4 4 0 0 1 7.5 2.2c0 5.6-7.5 10-7.5 10z"/>',
  pin: '<path d="M12 21s6.5-5.6 6.5-11a6.5 6.5 0 0 0-13 0c0 5.4 6.5 11 6.5 11z"/><circle cx="12" cy="10" r="2.3"/>',
  flag: '<path d="M5 21V4"/><path d="M5 4.5h11l-2 3.5 2 3.5H5"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  zoom: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4M11 8.5v5M8.5 11h5"/>',
  chevron: '<path d="m9 6 6 6-6 6"/>',
  ride: '<path d="M3 17c3-6 6-9 9-9s6 3 9 9"/><circle cx="12" cy="8" r="2"/><path d="M6 17v3M18 17v3"/>',
  mountain: '<path d="m3 19 6.5-11 4 6.5 2-3L21 19z"/><path d="m7.6 11.2 1.9 1.3 1.6-1.2"/>',
  tag: '<path d="M4 4h7.5l8.5 8.5-7.5 7.5L4 11.5z"/><circle cx="8.5" cy="8.5" r="1.3"/>',
  globe: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.4 2.4 3.5 5.2 3.5 8.5s-1.1 6.1-3.5 8.5c-2.4-2.4-3.5-5.2-3.5-8.5s1.1-6.1 3.5-8.5z"/>',
  contrast: '<circle cx="12" cy="12" r="8.5"/><path d="M12 3.5v17a8.5 8.5 0 0 0 0-17z" fill="currentColor"/>',
  landmark: '<path d="M3.5 9 12 4l8.5 5zM5 20h14M6.5 10.5v7M10 10.5v7M14 10.5v7M17.5 10.5v7"/>',
  paw: '<circle cx="7" cy="10" r="1.6"/><circle cx="10.3" cy="6.3" r="1.6"/><circle cx="13.7" cy="6.3" r="1.6"/><circle cx="17" cy="10" r="1.6"/><path d="M12 11.5c-2.6 0-5 3.6-5 5.7 0 1.6 1.4 2.3 2.8 2.3 1 0 1.5-.5 2.2-.5s1.2.5 2.2.5c1.4 0 2.8-.7 2.8-2.3 0-2.1-2.4-5.7-5-5.7z"/>',
  compass: '<circle cx="12" cy="12" r="8.5"/><path d="m15.5 8.5-2 5-5 2 2-5z"/>',
  ship: '<path d="M3.5 15.5h17l-2.5 4h-12z"/><path d="M6 15.5V11h12v4.5M9 11V7h5v4M11.5 7V4"/>',
  sound: '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/>',
  music: '<path d="M9 18V6l10-2v12"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="16.5" cy="16" r="2.5"/>',
  language: '<path d="M4 6h9M8.5 4v2c0 4-2 7-4.5 8.5M6.5 10c1 2 3 3.6 5 4.5"/><path d="m12.5 20 4-9 4 9M14 16.8h5"/>',
  reset: '<path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3L4.5 9"/><path d="M4.5 4.5V9H9"/>',
  user: '<circle cx="12" cy="8.5" r="3.5"/><path d="M5 20c.8-3.5 3.6-5.5 7-5.5s6.2 2 7 5.5"/>',
  chat: '<path d="M4.5 6.5A2 2 0 0 1 6.5 4.5h11a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H10l-4.5 3.5v-3.5h-1z"/>',
  calendar: '<rect x="4" y="5.5" width="16" height="14.5" rx="2"/><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4"/><circle cx="12" cy="15" r="1.2" fill="currentColor"/>',
  brain: '<path d="M12 5.5a3 3 0 0 0-5.6-1.2A3 3 0 0 0 4.5 9a3.2 3.2 0 0 0 .3 5.4A3 3 0 0 0 9 19a3 3 0 0 0 3-1.5zM12 5.5a3 3 0 0 1 5.6-1.2A3 3 0 0 1 19.5 9a3.2 3.2 0 0 1-.3 5.4A3 3 0 0 1 15 19a3 3 0 0 1-3-1.5z"/><path d="M12 5.5v12"/>',
  sparkle: '<path d="M12 3.5 13.8 10 20.5 12 13.8 14 12 20.5 10.2 14 3.5 12 10.2 10z"/>',
};

export type IconName = keyof typeof P;

export function icon(name: IconName, size = 18): string {
  return `<svg class="ico" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[name]}</svg>`;
}
