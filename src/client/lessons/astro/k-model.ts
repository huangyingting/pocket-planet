/**
 * Kit "model": the sky theatre's how-it-works model (Sun, Earth and Moon with real positions) on the lesson board.
 * Moon phases, solar and lunar eclipses with their shadow cones, the seasons, planets with lines of sight, meteor
 * streams. Event-centred scenes find a real event (`event`) so the geometry is the true one.
 */
import '../../sky/sky.css';
import { ModelScene, type ModelKind } from '../../sky/model.ts';
import { skyEvents } from '../../../shared/lib/astro/events.ts';
import type { SkyEventKind } from '../../../shared/lib/astro/types.ts';
import type { PlanetId } from '../../../shared/lib/astro/index.ts';
import { SHOWERS } from '../../../shared/data/showers.ts';
import { BODY } from '../../../shared/data/solar.ts';
import type { KitFactory } from './types.ts';

export interface Opts {
  kind: ModelKind;
  /** the moment shown (UTC ms); default: the event found by `event`, else 2025-01-01 */
  t?: number;
  /** centre on the first event of this kind after `t` (or after 2025-01-01) */
  event?: SkyEventKind;
  /** planets to show (`planets` kind) */
  planets?: PlanetId[];
  /** lines of sight from Earth to these (planet ids or 'sun') */
  sight?: string[];
  /** angle at Earth between the Sun and this planet */
  arc?: PlanetId;
  /** perigee / apogee on the Moon's orbit */
  apsides?: boolean;
  /** meteor shower key (`meteors` kind), e.g. 'perseids' */
  shower?: string;
}

const DAY = 864e5, H = 36e5;
const T0 = Date.UTC(2025, 0, 1);

const kit: KitFactory<Opts & { clock?: { unit: string } }> = (ctx, o) => {
  let t0 = o.t ?? T0;
  let shower = o.shower ? SHOWERS.find(s => s.key === o.shower) : undefined;
  if (o.event) {
    const ev = skyEvents(t0, t0 + 3 * 365 * DAY, { kinds: [o.event] }).find(e => !o.shower || e.shower === o.shower);
    if (ev) { t0 = ev.t; if (ev.shower) shower ??= SHOWERS.find(s => s.key === ev.shower); }
  }
  const m = new ModelScene();
  const zh = ctx.zh();
  const nm = (id: string) => (BODY[id as keyof typeof BODY]?.name[zh ? 'zh' : 'en']) ?? id;
  const names: Record<string, string> = { earth: nm('earth'), moon: nm('moon'), sun: nm('sun') };
  for (const id of [...(o.planets ?? []), ...(o.sight ?? [])]) names[id] = nm(id);
  m.configure({ kind: o.kind, t: t0, planets: o.planets, sight: o.sight, arc: o.arc, apsides: o.apsides, shower, lowfx: ctx.low }, names);
  // the model's scene renders inside the board's; its labels go over the board
  ctx.root.add(m.scene);
  m.labelHost.classList.add('astro-mlabels');
  document.body.append(m.labelHost);
  const unit = o.clock?.unit;
  /** clock value → instant: absolute for dates, else hours / days / years from the event */
  const at = (v: number) => unit === 'date' ? v : unit === 'hour' ? t0 + v * H : unit === 'year' ? t0 + v * 365.25 * DAY : unit === 'day' ? t0 + v * DAY : t0;
  // frame as for a 16:10 screen; the board scales the distance to the free area
  m.camera.aspect = 1.6;
  m.aim(ctx.orbit, at(0), true);
  // the theatre's framing assumes a full screen: scale it to the free area like every kit
  ctx.view(ctx.camera.position.clone().sub(ctx.orbit.target).normalize().toArray() as [number, number, number], ctx.orbit.dist, ctx.orbit.target.toArray() as [number, number, number], true);
  let last = 0;
  return {
    update(v, dt) {
      const ms = at(v);
      m.update(ms, dt);
      m.camera.copy(ctx.camera, false);
      m.camera.matrixWorld.copy(ctx.camera.matrixWorld);
      const card = document.querySelector('.lesson-card')?.getBoundingClientRect();
      if (performance.now() - last > 30) { m.placeLabels(innerWidth, innerHeight, card ? [card as DOMRect] : []); last = performance.now(); }
    },
    dispose() { ctx.root.remove(m.scene); m.dispose(); },
  };
};
export default kit;
