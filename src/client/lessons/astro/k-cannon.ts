/**
 * Kit "cannon": Newton's cannon. A cannon on a mountain fires horizontally; the path is the exact conic for the
 * launch speed (r = p / (1 + e cos θ) from r₀ and v₀): it falls back, circles at 7.9 km/s (first cosmic speed),
 * follows an ellipse between, and escapes at 11.2 km/s (second). `solar` zooms out to the Sun and Earth's orbit:
 * from 16.7 km/s (third cosmic speed) the probe leaves the Solar System.
 * - `shots`: fire the listed speeds one after another; each path stays, labelled with its speed.
 * - `speed`: one path for the clock's speed (unit `kms`, or `v`); `marks` adds faint reference paths.
 * - `solar`: Sun, planets' orbits and the probe's path around the Sun for a launch speed (clock `kms` or `v`).
 */
import * as THREE from 'three';
import { body, clamp, glow, line, ramp, star, starfield, sunLight, dirLight, circlePts } from './draw.ts';
import type { AstroClock, KitCtx, KitFactory, KitRun, Pair } from './types.ts';
import { C } from '../kit.ts';

export type Opts =
  | { mode: 'shots'; /** launch speeds (km/s), fired in order */ v: number[] }
  | { mode: 'speed'; /** launch speed without a clock */ v?: number; /** faint reference paths at these speeds */ marks?: number[] }
  | { mode: 'solar'; /** launch speed from Earth without a clock (default 16.7) */ v?: number };

const LEAD = 0.9;
const V1 = 7.9, V2 = 11.2, V3 = 16.7, VE = 29.8;
/** launch radius (Earth radii): the top of the (much exaggerated) mountain */
const R0 = 1.055;
const RMAX = 7.2;
const NMAX = 721;

/** What a launch speed does (from the Earth's surface). */
export function result(v: number): Pair {
  if (v >= V3 - 1e-6) return ['escapes the Solar System', '逃离太阳系'];
  if (v >= V2 - 1e-6) return ['escapes the Earth', '逃离地球'];
  if (Math.abs(v - V1) < 0.051) return ['circles the Earth', '环绕地球（圆轨道）'];
  if (v > V1) return ['orbits on an ellipse', '环绕地球（椭圆轨道）'];
  return ['falls back to the ground', '落回地面'];
}

/** A conic path in the xz plane from the top point (0, 0, r0), launched toward +x. */
class Path {
  readonly pos = new Float32Array(NMAX * 3);
  readonly t = new Float32Array(NMAX);
  n = 0;
  closed = false;
  hits = false;
  /** `k` = (v / v_circ)², `ground` = radius that stops the path, `rmax` = where the drawing stops; times scaled so a circular orbit takes `tc` s */
  compute(k: number, r0: number, ground: number, rmax: number, tc: number): this {
    const e = k - 1, p = k * r0, dth = (Math.PI * 2) / (NMAX - 1);
    // dθ/dt = h / r², h = r0 v; with a circle's period = tc: h = 2π r0² / tc · √k
    const h = ((2 * Math.PI * r0 * r0) / tc) * Math.sqrt(k);
    let time = 0, i = 0, prevR = r0;
    this.hits = false; this.closed = false;
    for (; i < NMAX; i++) {
      const th = i * dth, den = 1 + e * Math.cos(th);
      let r = den > 1e-3 ? p / den : Infinity;
      if (i > 0) time += ((prevR * prevR + Math.min(r, rmax * 2) ** 2) / 2) * dth / h;
      if (r < ground) {
        // land: back up to the ground along the last step
        const f = (prevR - ground) / Math.max(1e-6, prevR - r);
        const th2 = (i - 1 + f) * dth;
        r = ground;
        this.pos.set([r * Math.sin(th2), 0, r * Math.cos(th2)], i * 3);
        this.t[i] = time;
        this.hits = true; i++;
        break;
      }
      if (r > rmax) break;
      this.pos.set([r * Math.sin(th), 0, r * Math.cos(th)], i * 3);
      this.t[i] = time;
      prevR = r;
    }
    this.n = i;
    this.closed = i >= NMAX;
    return this;
  }
  /** index reached at time `s` (s) */
  at(s: number): number {
    let lo = 0, hi = this.n - 1;
    if (s >= this.t[hi]) return hi;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (this.t[m] <= s) lo = m; else hi = m; }
    return lo;
  }
  get dur(): number { return this.n ? this.t[this.n - 1] : 0; }
  /** copy into a line (same buffer size) */
  into(l: THREE.Line): void {
    const a = l.geometry.getAttribute('position') as THREE.BufferAttribute;
    (a.array as Float32Array).set(this.pos);
    a.needsUpdate = true;
    l.geometry.setDrawRange(0, this.n);
    l.geometry.computeBoundingSphere();
  }
  point(i: number, out: THREE.Vector3): THREE.Vector3 { return out.fromArray(this.pos, Math.min(i, Math.max(0, this.n - 1)) * 3); }
}

function pathLine(c: string, opacity: number): THREE.Line {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(NMAX * 3), 3));
  const l = new THREE.Line(g, new THREE.LineBasicMaterial({ color: c, transparent: true, opacity, depthWrite: false }));
  l.frustumCulled = false;
  return l;
}
function projectile(): THREE.Group {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.SphereGeometry(0.028, 12, 6), new THREE.MeshBasicMaterial({ color: '#ffffff' })), glow('#fff3c4', 0.32, 0.9));
  return g;
}
const colorOf = (v: number) => (v >= V2 ? C.red : v > V1 + 0.05 ? C.violet : Math.abs(v - V1) <= 0.05 ? C.green : C.gold);
const speedOf = (o: { v?: number }, clock: AstroClock | undefined, v: number, dflt: number) => (clock?.unit === 'kms' ? v : o.v ?? dflt);

const kit: KitFactory<Opts & { clock?: AstroClock }> = (ctx, o) => {
  ctx.root.add(starfield(ctx.low ? 1200 : 2500));
  return o.mode === 'solar' ? solar(ctx, o, o.clock) : earthScene(ctx, o, o.clock);
};
export default kit;

// ------------------------------------------------------------------------------------------------ the Earth and the mountain

/** Frame the Earth and the paths for these speeds (camera looks along +y: screen x = x, screen y ≈ z). */
function frame(ctx: KitCtx, speeds: number[]): void {
  let x0 = -1.15, x1 = 1.15, z0 = -1.15, z1 = 1.25;
  const p = new Path(), v = new THREE.Vector3();
  for (const s of speeds) {
    p.compute((s / V1) ** 2, R0, 1, RMAX, 7);
    for (let i = 0; i < p.n; i += 4) {
      p.point(i, v);
      x0 = Math.min(x0, v.x); x1 = Math.max(x1, v.x); z0 = Math.min(z0, v.z); z1 = Math.max(z1, v.z);
    }
  }
  const hw = (x1 - x0) / 2, hh = (z1 - z0) / 2;
  ctx.view([0, -1, 0.12], 1.9 * Math.max(hh / 0.59, hw / 0.62), [(x0 + x1) / 2, 0, (z0 + z1) / 2], true);
}

function earthScene(ctx: KitCtx, o: Extract<Opts, { mode: 'shots' | 'speed' }>, clock?: AstroClock): KitRun {
  ctx.root.add(dirLight([-3, -4, 3], 2.4, 0.16));
  const tilt = new THREE.Group();
  tilt.rotation.x = -1.0;
  const earth = body('earth', 1, '#4b77a8');
  tilt.add(earth);
  ctx.root.add(tilt, glow('#6fb6ff', 2.7, 0.22));
  const mount = new THREE.Mesh(new THREE.ConeGeometry(0.075, 0.07, 24), new THREE.MeshStandardMaterial({ color: '#8c7b6b', roughness: 1 }));
  mount.rotation.x = Math.PI / 2; mount.position.set(0, 0, 0.995 + 0.035);
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.01, 0.05, 10), new THREE.MeshStandardMaterial({ color: '#d0d4d8', roughness: 0.5 }));
  barrel.rotation.z = -Math.PI / 2; barrel.position.set(0.02, 0, R0);
  ctx.root.add(mount, barrel);
  ctx.label(new THREE.Vector3(0, 0, R0), ['Newton’s cannon', '牛顿的大炮'], { dy: -20, dx: -40 });
  const TC = 7;
  const tmp = new THREE.Vector3();
  frame(ctx, o.mode === 'shots' ? o.v : [...(o.marks ?? []), o.v ?? V1, ...(clock?.unit === 'kms' ? [clock.from, clock.to] : [])]);
  const zh = ctx.zh();
  const fmt = (v: number) => (zh ? `${v.toFixed(1)} 千米/秒` : `${v.toFixed(1)} km/s`);

  if (o.mode === 'shots') {
    const shots = o.v.map(v => {
      const path = new Path().compute((v / V1) ** 2, R0, 1, RMAX, TC);
      const l = pathLine(colorOf(v), 0.9);
      path.into(l);
      l.geometry.setDrawRange(0, 0);
      const pr = projectile();
      pr.visible = false;
      ctx.root.add(l, pr);
      // label where the path ends (or a quarter round a closed orbit)
      const li = path.closed ? Math.round(NMAX * 0.62) : Math.max(0, path.n - 1);
      const lb = ctx.label(path.point(li, new THREE.Vector3()), fmt(v), { c: colorOf(v), dy: path.hits ? -14 : 14 });
      lb.on = false;
      return { v, path, l, pr, lb, dur: Math.min(path.dur, 7.5) };
    });
    let acc = LEAD;
    const starts = shots.map(s => { const t0 = acc; acc += s.dur + 0.5; return t0; });
    return {
      update(_v, _dt, el) {
        shots.forEach((s, i) => {
          const t = el - starts[i];
          if (t < 0) { s.l.geometry.setDrawRange(0, 0); s.pr.visible = false; s.lb.on = false; return; }
          const done = t >= s.dur;
          const tt = s.path.closed ? t % s.path.dur : Math.min(t, s.dur);
          const k = s.path.at(tt);
          s.l.geometry.setDrawRange(0, done && s.path.closed ? s.path.n : k + 1);
          s.pr.visible = !(done && !s.path.closed && !s.path.hits) || s.path.hits;
          s.pr.position.copy(s.path.point(k, tmp));
          s.lb.on = done || t > 2.5;
        });
      },
    };
  }

  // one path for the current speed
  const ghosts = (o.marks ?? []).map(v => {
    const path = new Path().compute((v / V1) ** 2, R0, 1, RMAX, TC);
    const l = pathLine(colorOf(v), 0.28);
    path.into(l);
    ctx.root.add(l);
    const li = path.closed ? Math.round(NMAX * 0.62) : Math.max(0, path.n - 1);
    ctx.label(path.point(li, new THREE.Vector3()), fmt(v), { c: colorOf(v), dy: path.hits ? -14 : 14, t: 0.5 });
    return l;
  });
  void ghosts;
  const path = new Path();
  const full = pathLine('#ffffff', 0.22), trail = pathLine(C.gold, 0.95), pr = projectile();
  ctx.root.add(full, trail, pr);
  let lastV = NaN, t0 = 0;
  return {
    update(v, _dt, el) {
      const sp = speedOf(o, clock, v, V1);
      if (Math.abs(sp - lastV) > 1e-4) {
        lastV = sp;
        path.compute((sp / V1) ** 2, R0, 1, RMAX, TC);
        path.into(full); path.into(trail);
        (trail.material as THREE.LineBasicMaterial).color.set(colorOf(sp));
        t0 = el;
      }
      const t = Math.max(0, el - Math.max(t0, LEAD));
      const span = Math.min(path.dur, 7.5) + 0.8;
      const tt = path.closed ? t % path.dur : t % span;
      const k = path.at(tt);
      trail.geometry.setDrawRange(0, path.closed && t > path.dur ? path.n : k + 1);
      pr.position.copy(path.point(k, tmp));
      const f = ramp(el, 0, 0.6);
      (full.material as THREE.LineBasicMaterial).opacity = 0.22 * f;
    },
    readout(v) {
      const r = result(clamp(speedOf(o, clock, v, V1), 0, 100));
      return r;
    },
  };
}

// ------------------------------------------------------------------------------------------------ around the Sun

function solar(ctx: KitCtx, o: Extract<Opts, { mode: 'solar' }>, clock?: AstroClock): KitRun {
  const AU = 2.2, TE = 12;
  ctx.root.add(star(0.3, '#ffd27a', 5), sunLight([0, 0, 0], 2.6, 0.15));
  ctx.label(new THREE.Vector3(0, 0, 0), ['Sun', '太阳'], { c: C.gold, dy: 24 });
  const orbits: [number, string, Pair][] = [[1, '#6fa8ff', ['Earth’s orbit', '地球轨道']], [1.524, '#e07a52', ['Mars', '火星轨道']], [5.203, '#d9b38c', ['Jupiter’s orbit', '木星轨道']]];
  for (const [a, c, n] of orbits) {
    const pts = circlePts(a * AU, 160).map(p => new THREE.Vector3(p.x, 0, p.y));
    ctx.root.add(line(pts, c, { opacity: a === 1 ? 0.6 : 0.3 }));
    if (a !== 1.524) ctx.label(new THREE.Vector3(-a * AU * 0.71, 0, -a * AU * 0.71), n, { c, t: 0.6 });
  }
  const earth = body('earth', 0.14, '#4b77a8');
  ctx.root.add(earth);
  ctx.label(earth, ['Earth', '地球'], { c: '#8fc0ff', dy: -16 });
  const path = new Path(), trail = pathLine(C.red, 0.95), full = pathLine('#ffffff', 0.2), pr = projectile();
  pr.scale.setScalar(1.6);
  ctx.root.add(full, trail, pr);
  ctx.view([0, -1, 0.35], 30, [0, 0, 2.5], true);
  const tmp = new THREE.Vector3();
  let lastV = NaN, t0 = 0, bound = false;
  const helio = (v: number) => VE + Math.sqrt(Math.max(0, v * v - V2 * V2));
  return {
    update(v, _dt, el) {
      const sp = speedOf(o, clock, v, V3);
      if (Math.abs(sp - lastV) > 1e-4) {
        lastV = sp;
        bound = sp < V2;
        path.compute((helio(sp) / VE) ** 2, AU, 0, 18, TE);
        path.into(full); path.into(trail);
        (trail.material as THREE.LineBasicMaterial).color.set(sp >= V3 - 1e-6 ? C.red : C.violet);
        t0 = el;
      }
      const t = Math.max(0, el - Math.max(t0, LEAD));
      // the Earth goes round with the probe's start at the top
      const a = Math.PI / 2 - (t / TE) * Math.PI * 2;
      earth.position.set(AU * Math.cos(a), 0, AU * Math.sin(a));
      earth.rotation.y = t * 3;
      full.visible = trail.visible = !bound;
      if (bound) { pr.position.copy(earth.position); return; }
      const span = Math.min(path.dur, 14) + 1;
      const tt = path.closed ? t % path.dur : t % span;
      const k = path.at(tt);
      trail.geometry.setDrawRange(0, path.closed && t > path.dur ? path.n : k + 1);
      pr.position.copy(path.point(k, tmp));
    },
    readout(v) {
      const sp = speedOf(o, clock, v, V3);
      const r = result(sp);
      if (sp < V2) return r;
      const h = helio(sp).toFixed(1);
      return [`${r[0]} · ${h} km/s around the Sun`, `${r[1]} · 相对太阳 ${h} km/s`];
    },
  };
}
