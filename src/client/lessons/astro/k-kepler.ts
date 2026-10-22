/**
 * Kit "kepler": a planet on a Keplerian ellipse with the Sun at one focus.
 * - `law1`: the ellipse with both foci, the semi-axes a and b and the string-and-pins construction (r₁ + r₂ = 2a);
 *   a clock with unit `x` drives the eccentricity.
 * - `law2`: equal areas in equal times: wedges swept in equal times fill in as the planet goes; the speed arrow is
 *   longest at perihelion. A clock (unit `x`) can drive the phase in periods.
 * - `law3`: several planets on their real orbits, periods T = a^1.5 years (clock unit `year`).
 * - `gravity`: velocity and gravity arrows on a planet in a circular orbit; then gravity switches off and the planet
 *   flies off in a straight line along its velocity.
 */
import * as THREE from 'three';
import { Arrow, body, clamp, D2R, ellipsePts, glow, keplerE, line, orbitPos, ramp, star, starfield, sunLight } from './draw.ts';
import type { BodyId } from '../../../shared/data/solar.ts';
import type { AstroClock, KitCtx, KitFactory, KitRun, Pair } from './types.ts';
import { C } from '../kit.ts';

export type Opts =
  | { mode: 'law1'; /** eccentricity without a clock (default 0.5) */ e?: number; /** the string and pins (default true) */ string?: boolean; /** the a and b semi-axes (default true) */ axes?: boolean }
  | { mode: 'law2'; e?: number; /** number of equal-time wedges (default 8) */ sectors?: number }
  | { mode: 'law3'; planets?: BodyId[] }
  | { mode: 'gravity'; /** laps before gravity switches off; 0 = never (default 1.25) */ cut?: number };

type Ctx = KitCtx;
type Run = KitRun;
/** seconds before el-driven motion starts (the camera settles first) */
const LEAD = 0.9;

const kit: KitFactory<Opts & { clock?: AstroClock }> = (ctx, o) => {
  ctx.root.add(starfield(ctx.low ? 1200 : 2500));
  switch (o.mode) {
    case 'law2': return law2(ctx, o, o.clock);
    case 'law3': return law3(ctx, o, !!o.clock);
    case 'gravity': return gravity(ctx, o);
    default: return law1(ctx, o as Extract<Opts, { mode: 'law1' }>, o.clock);
  }
};
export default kit;

/** A small flat-shaded marker (foci, centre). */
function dot(r: number, c: string): THREE.Mesh {
  return new THREE.Mesh(new THREE.SphereGeometry(r, 16, 8), new THREE.MeshBasicMaterial({ color: c }));
}
/** Write an ellipse (focus at the origin) into an existing line's buffer. */
function writeEllipse(l: THREE.Line, a: number, e: number): void {
  const p = l.geometry.getAttribute('position') as THREE.BufferAttribute, n = p.count - 1, b = a * Math.sqrt(1 - e * e);
  for (let i = 0; i <= n; i++) { const E = (i / n) * Math.PI * 2; p.setXYZ(i, a * (Math.cos(E) - e), b * Math.sin(E), 0); }
  p.needsUpdate = true;
  l.geometry.computeBoundingSphere();
  if (l.material instanceof THREE.LineDashedMaterial) l.computeLineDistances();
}
function seg(l: THREE.Line, a: THREE.Vector3, b: THREE.Vector3): void {
  const p = l.geometry.getAttribute('position') as THREE.BufferAttribute;
  p.setXYZ(0, a.x, a.y, a.z); p.setXYZ(1, b.x, b.y, b.z); p.needsUpdate = true;
  l.geometry.computeBoundingSphere();
  if (l.material instanceof THREE.LineDashedMaterial) l.computeLineDistances();
}
function sun(ctx: Ctx, r = 0.38): THREE.Group {
  const s = star(r, '#ffd27a', 5);
  ctx.root.add(s, sunLight([0, 0, 0], 2.8, 0.14));
  return s;
}

// ------------------------------------------------------------------------------------------------ law 1

function law1(ctx: Ctx, o: Extract<Opts, { mode: 'law1' }>, clock?: AstroClock): Run {
  const A = 4, P = 10;
  const driven = clock?.unit === 'x';
  let e = -1;
  const S = sun(ctx);
  ctx.label(S, ['Sun · focus F₁', '太阳 · 焦点 F₁'], { c: C.gold, dy: -26 });
  const orbit = line(ellipsePts(A, 0.5, 180), '#8fb8ff', { opacity: 0.75 });
  const major = line([[0, 0, 0], [1, 0, 0]], '#ffffff', { opacity: 0.22, dashed: true, dash: 0.15 });
  const aLine = line([[0, 0, 0], [1, 0, 0]], C.gold, { opacity: 0.95 });
  const bLine = line([[0, 0, 0], [0, 1, 0]], C.teal, { opacity: 0.95 });
  const s1 = line([[0, 0, 0], [1, 0, 0]], C.orange, { opacity: 0.9 });
  const s2 = line([[0, 0, 0], [1, 0, 0]], C.pink, { opacity: 0.9 });
  const f2 = dot(0.08, '#dfe6ee'), centre = dot(0.045, '#9aa7b4');
  const planet = body('earth', 0.22);
  const halo = glow('#8fc7ff', 0.9, 0.35);
  ctx.root.add(orbit, major, f2, centre, planet, halo);
  const showAxes = o.axes ?? true, showString = o.string ?? true;
  if (showAxes) ctx.root.add(aLine, bLine);
  if (showString) ctx.root.add(s1, s2);
  const lf2 = ctx.label(new THREE.Vector3(), ['focus F₂', '焦点 F₂'], { dy: 18 });
  const la = showAxes ? ctx.label(new THREE.Vector3(), ['a', 'a'], { c: C.gold, dy: -12, t: 0.8 }) : null;
  const lb = showAxes ? ctx.label(new THREE.Vector3(), ['b', 'b'], { c: C.teal, dx: -12, t: 1.1 }) : null;
  const lq = ctx.label(new THREE.Vector3(), ['perihelion', '近日点'], { dy: 16, t: 1.4 });
  const lQ = ctx.label(new THREE.Vector3(), ['aphelion', '远日点'], { dy: 16, t: 1.4 });
  const lr1 = showString ? ctx.label(new THREE.Vector3(), ['r₁', 'r₁'], { c: C.orange, t: 1.6 }) : null;
  const lr2 = showString ? ctx.label(new THREE.Vector3(), ['r₂', 'r₂'], { c: C.pink, t: 1.6 }) : null;
  const pos = new THREE.Vector3(), F2 = new THREE.Vector3(), Cn = new THREE.Vector3(), tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3();
  ctx.view([0, -0.62, 1], 14, [-1.4, 0, 0], true);

  const setE = (ne: number) => {
    e = ne;
    writeEllipse(orbit, A, e);
    const b = A * Math.sqrt(1 - e * e);
    F2.set(-2 * A * e, 0, 0); Cn.set(-A * e, 0, 0);
    f2.position.copy(F2); centre.position.copy(Cn);
    seg(major, tmp.set(-A * (1 + e), 0, 0), tmp2.set(A * (1 - e), 0, 0));
    seg(aLine, Cn, tmp.set(A * (1 - e), 0, 0));
    seg(bLine, Cn, tmp.set(-A * e, b, 0));
    lf2.pos.copy(F2); lf2.on = e > 0.04;
    la?.pos.set(A * (0.5 - e), 0, 0);
    lb?.pos.set(-A * e, b * 0.5, 0);
    lq.pos.set(A * (1 - e), 0, 0); lQ.pos.set(-A * (1 + e), 0, 0);
  };
  return {
    update(v, _dt, el) {
      const ne = clamp(driven ? v : o.e ?? 0.5, 0, 0.95);
      if (Math.abs(ne - e) > 1e-4) setE(ne);
      const f = ramp(el, 0, 1.2);
      orbit.geometry.setDrawRange(0, Math.round(181 * f));
      orbitPos(A, e, Math.max(0, el - LEAD) / P, pos);
      planet.position.copy(pos); halo.position.copy(pos);
      planet.rotation.y = el * 0.6;
      if (showString) {
        seg(s1, tmp.set(0, 0, 0), pos); seg(s2, F2, pos);
        lr1!.pos.copy(pos).multiplyScalar(0.5);
        lr2!.pos.copy(pos).add(F2).multiplyScalar(0.5);
        s1.visible = s2.visible = el > 1.2;
      }
    },
    readout(v) {
      const ee = clamp(driven ? v : o.e ?? 0.5, 0, 0.95), ba = Math.sqrt(1 - ee * ee).toFixed(2);
      return showString ? [`r₁ + r₂ = 2a · b/a = ${ba}`, `r₁ + r₂ = 2a · b/a = ${ba}`] : [`b/a = ${ba}`, `b/a = ${ba}`];
    },
  };
}

// ------------------------------------------------------------------------------------------------ law 2

function law2(ctx: Ctx, o: Extract<Opts, { mode: 'law2' }>, clock?: AstroClock): Run {
  const A = 4, e = o.e ?? 0.6, N = o.sectors ?? 8, K = 24, P = 12, b = A * Math.sqrt(1 - e * e);
  const driven = !!clock;
  sun(ctx);
  ctx.root.add(line(ellipsePts(A, e, 200), '#8fb8ff', { opacity: 0.6 }));
  const fans: THREE.Mesh[] = [];
  const p = new THREE.Vector3();
  for (let i = 0; i < N; i++) {
    const pos = new Float32Array((K + 2) * 3), idx: number[] = [];
    for (let j = 0; j <= K; j++) { orbitPos(A, e, (i + j / K) / N, p); pos.set([p.x, p.y, 0], (j + 1) * 3); }
    for (let j = 0; j < K; j++) idx.push(0, j + 1, j + 2);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setIndex(idx);
    const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: i % 2 ? C.blue : C.gold, transparent: true, opacity: 0.32, side: THREE.DoubleSide, depthWrite: false }));
    m.position.z = -0.01;
    g.setDrawRange(0, 0);
    fans.push(m);
    ctx.root.add(m);
    // the wedge's edges
    const edge = line([[0, 0, 0], [p.x, p.y, 0]], i % 2 ? C.blue : C.gold, { opacity: 0.35 });
    ctx.root.add(edge);
  }
  const planet = body('earth', 0.22), halo = glow('#8fc7ff', 0.9, 0.35);
  const vArrow = new Arrow(C.green, 0.035);
  ctx.root.add(planet, halo, vArrow);
  ctx.label(new THREE.Vector3(A * (1 - e), 0, 0), ['perihelion: fastest', '近日点：最快'], { c: C.green, dy: 22, t: 0.6 });
  ctx.label(new THREE.Vector3(-A * (1 + e), 0, 0), ['aphelion: slowest', '远日点：最慢'], { dy: 22, t: 0.8 });
  ctx.label(new THREE.Vector3(-A * e, b * 1.12, 0), ['Equal times → equal areas', '相等时间 → 扫过相等面积'], { big: true, t: 1.2 });
  const lv = ctx.label(new THREE.Vector3(), ['speed', '速度'], { c: C.green, t: 1.5 });
  const vel = new THREE.Vector3(), mu = (2 * Math.PI) ** 2 * A ** 3 / P ** 2;
  const vScale = 1.1 / Math.sqrt(mu / A);
  ctx.view([0, -0.55, 1], 14, [-A * e, 0, 0], true);
  const phase = (v: number, el: number) => (driven ? v : Math.max(0, el - LEAD) / P);
  return {
    update(v, _dt, el) {
      const ph = phase(v, el), f = ((ph % 1) + 1) % 1;
      const cur = Math.floor(f * N), part = f * N - cur;
      for (let i = 0; i < N; i++) fans[i].geometry.setDrawRange(0, i < cur ? K * 3 : i === cur ? Math.floor(part * K + 1e-6) * 3 : 0);
      orbitPos(A, e, f, p);
      planet.position.copy(p); halo.position.copy(p);
      planet.rotation.y = el * 0.6;
      const E = keplerE(f * Math.PI * 2, e), r = p.length();
      vel.set(-A * Math.sin(E), b * Math.cos(E), 0).normalize().multiplyScalar(Math.sqrt(mu * (2 / r - 1 / A)) * vScale);
      vArrow.set(p, vel);
      lv.pos.copy(p).add(vel).addScaledVector(vel, 0.25 / vel.length());
    },
    readout(v) {
      const f = ((v % 1) + 1) % 1;
      orbitPos(A, e, f, p);
      const r = p.length(), s = Math.sqrt(2 / r - 1 / A) / Math.sqrt(1 / A);
      return [`speed ×${s.toFixed(2)} of average`, `速度是平均速度的 ${s.toFixed(2)} 倍`];
    },
  };
}

// ------------------------------------------------------------------------------------------------ law 3

const PL: Partial<Record<BodyId, { a: number; e: number; w: number; r: number; name: Pair; c: string }>> = {
  mercury: { a: 0.387, e: 0.206, w: 77, r: 0.1, name: ['Mercury', '水星'], c: '#b8b0a6' },
  venus: { a: 0.723, e: 0.007, w: 131, r: 0.15, name: ['Venus', '金星'], c: '#e8cf9a' },
  earth: { a: 1, e: 0.017, w: 103, r: 0.16, name: ['Earth', '地球'], c: '#6fa8ff' },
  mars: { a: 1.524, e: 0.093, w: 336, r: 0.12, name: ['Mars', '火星'], c: '#e07a52' },
  jupiter: { a: 5.203, e: 0.049, w: 14, r: 0.36, name: ['Jupiter', '木星'], c: '#d9b38c' },
  saturn: { a: 9.537, e: 0.057, w: 93, r: 0.3, name: ['Saturn', '土星'], c: '#e6cf98' },
};

function law3(ctx: Ctx, o: Extract<Opts, { mode: 'law3' }>, clocked: boolean): Run {
  const ids = (o.planets ?? ['mercury', 'venus', 'earth', 'mars', 'jupiter']).filter(id => PL[id]);
  const S = 1.35;
  // with the giants in, distances are squeezed (a^0.6) so the inner planets stay readable; the periods stay true
  const squeeze = Math.max(...ids.map(id => PL[id]!.a)) > 2;
  const sc = (a: number) => (squeeze ? S * 1.4 * a ** 0.6 : S * a);
  sun(ctx, 0.26);
  const fmtT = (t: number) => (t < 10 ? t.toFixed(2) : t.toFixed(1));
  const items = ids.map((id, i) => {
    const d = PL[id]!, T = d.a ** 1.5;
    const g = new THREE.Group();
    g.rotation.z = d.w * D2R;
    g.add(line(ellipsePts(sc(d.a), d.e, 200), d.c, { opacity: 0.45 }));
    const m = body(id, d.r, d.c);
    g.add(m);
    ctx.root.add(g);
    const lb = ctx.label(m, [`${d.name[0]} · T = ${fmtT(T)} yr`, `${d.name[1]} · T = ${fmtT(T)} 年`], { c: d.c, dy: (i % 2 ? 1 : -1) * (16 + d.r * 20), t: 0.3 + i * 0.25 });
    return { d, T, m, lb, p0: (i * 0.37) % 1 };
  });
  const maxA = sc(Math.max(...items.map(x => x.d.a)));
  ctx.view([0, -0.5, 1], maxA * 2.5 + 3, [0, 0, 0], true);
  const p = new THREE.Vector3();
  return {
    update(v, _dt, el) {
      // v in years (clock) or 1 year per 4 s
      const t = clocked ? v : Math.max(0, el - LEAD) / 4;
      for (const it of items) {
        orbitPos(sc(it.d.a), it.d.e, it.p0 + t / it.T, p);
        it.m.position.copy(p);
        it.m.rotation.y = t * 6;
      }
    },
    readout() { return ['T² / a³ = 1 yr²/AU³ for every planet', '每颗行星的 T² / a³ 都等于 1 年²/AU³']; },
  };
}

// ------------------------------------------------------------------------------------------------ gravity on / off

function gravity(ctx: Ctx, o: Extract<Opts, { mode: 'gravity' }>): Run {
  const R = 4, P = 8, cut = o.cut ?? 1.25, fly = 4.5, hold = 1.2;
  const loop = cut > 0 ? cut * P + fly + hold : 0;
  sun(ctx, 0.45);
  ctx.root.add(line(ellipsePts(R, 0, 180), '#8fb8ff', { opacity: 0.4, dashed: true, dash: 0.2 }));
  const planet = body('earth', 0.3), halo = glow('#8fc7ff', 1.1, 0.35);
  const vA = new Arrow(C.green, 0.045), gA = new Arrow(C.orange, 0.045);
  const path = line([[0, 0, 0], [1, 0, 0]], C.green, { opacity: 0.8, dashed: true, dash: 0.18 });
  path.visible = false;
  ctx.root.add(planet, halo, vA, gA, path);
  const lv = ctx.label(new THREE.Vector3(), ['velocity', '速度'], { c: C.green, t: 0.6 });
  const lg = ctx.label(new THREE.Vector3(), ['gravity (pull of the Sun)', '引力（太阳的吸引）'], { c: C.orange, t: 1 });
  const loff = ctx.label(new THREE.Vector3(), ['Gravity off: a straight line!', '引力消失：沿直线飞走！'], { c: C.red, big: true });
  loff.on = false;
  ctx.label(new THREE.Vector3(0, 0, 0), ['Sun', '太阳'], { c: C.gold, dy: 30 });
  ctx.view([0, -0.5, 1], 15, [0, 0, 0], true);
  const p = new THREE.Vector3(), vel = new THREE.Vector3(), g = new THREE.Vector3(), pc = new THREE.Vector3(), vc = new THREE.Vector3(), end = new THREE.Vector3();
  const w = (2 * Math.PI) / P, speed = w * R, aLen = 1.7;
  const at = (t: number, out: THREE.Vector3, ov: THREE.Vector3) => {
    const a = w * t + Math.PI * 0.75;
    out.set(R * Math.cos(a), R * Math.sin(a), 0);
    ov.set(-Math.sin(a), Math.cos(a), 0);
  };
  return {
    update(_v, _dt, el) {
      let t = Math.max(0, el - LEAD);
      if (loop) t %= loop;
      const off = cut > 0 && t > cut * P;
      if (!off) {
        at(t, p, vel);
        g.copy(p).normalize().multiplyScalar(-aLen * 0.8);
        gA.visible = true;
        gA.set(p, g);
        path.visible = false;
      } else {
        at(cut * P, pc, vc);
        const dt = t - cut * P;
        p.copy(pc).addScaledVector(vc, speed * Math.min(dt, fly));
        vel.copy(vc);
        gA.visible = false;
        path.visible = true;
        // the straight path ahead, drawn in
        end.copy(pc).addScaledVector(vc, speed * fly);
        seg(path, pc, end);
        path.geometry.setDrawRange(0, 2);
        loff.pos.copy(pc).addScaledVector(vc, 1.6).addScaledVector(pc, 0.18);
      }
      loff.on = off;
      lg.on = !off;
      planet.position.copy(p); halo.position.copy(p);
      planet.rotation.y = el * 0.8;
      vel.multiplyScalar(aLen);
      vA.set(p, vel);
      lv.pos.copy(p).addScaledVector(vel, 1.25);
      lg.pos.copy(p).addScaledVector(g, 0.55);
    },
  };
}

