/** Sky theatre entry (lazy-loaded): eclipses, meteor showers, Moon phases, planets and seasons, played out in 3D. */
import './sky.css';
import { Theatre, type TheatreOpts } from './theatre.ts';

let open: Theatre | null = null;

export function openSky(host: HTMLElement, opts: TheatreOpts): Theatre {
  if (open) {
    open.close();
    open = null;
  }
  const t = new Theatre(host, { ...opts, onClose: () => { if (open === t) open = null; opts.onClose(); } });
  open = t;
  (window as unknown as { __sky?: Theatre }).__sky = t;
  return t;
}

export const skyOpen = () => open !== null;
