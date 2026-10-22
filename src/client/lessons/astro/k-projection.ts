/**
 * Kit "projection": the Earth's skin unrolled into a flat map. The textured surface, the graticule, Tissot's circles
 * (equal little circles on the globe that show how a projection stretches) and highlighted countries all go through
 * one (longitude, latitude) → position mapping, so they morph together: a cylindrical map wraps onto a cylinder and
 * unrolls, an azimuthal one flattens out from the pole, and one projection can turn into another.
 */
import * as THREE from 'three';
import { tracePath } from '../../globe/painter.ts';
import type { Continent } from '../../../shared/data/iso.ts';
import { D2R, canvasTex, clamp, dirLight, ease, lerp } from './draw.ts';
import type { KitFactory, Label, Pair } from './types.ts';

export type Proj = 'plate' | 'mercator' | 'peters' | 'mollweide' | 'polar';
export interface Opts {
  /** the map it becomes */
  to: Proj;
  /** what it starts as (default: the globe) */
  from?: Proj | 'globe';
  /** Tissot's circles: same-size circles on the globe, drawn at every 30° */
  tissot?: boolean;
  /** graticule step in degrees (default 30; 0: none) */
  grid?: number;
  /** central meridian (default 10°E) */
  lon0?: number;
  /** countries (ISO a2) and/or a continent, filled in a colour, with an optional label at `at` [lat, lon] */
  regions?: { a2?: string[]; continent?: Continent; c: string; label?: Pair; at?: [number, number] }[];
}

const NAMES: Record<Proj, Pair> = {
  plate: ['Equirectangular projection', '等距圆柱投影'],
  mercator: ['Mercator projection', '墨卡托投影'],
  peters: ['Gall–Peters projection', '高尔—彼得斯投影'],
  mollweide: ['Mollweide projection', '摩尔威德投影'],
  polar: ['Polar azimuthal projection', '极地方位投影'],
};
const CYL: Partial<Record<Proj, number>> = { plate: 1, mercator: 1, peters: Math.SQRT1_2 };
const MERC_MAX = 84 * D2R;
/** Width and height of each flat map (Earth radius 1), for framing. */
const SIZE: Record<Proj, [number, number]> = {
  plate: [2 * Math.PI, Math.PI], mercator: [2 * Math.PI, 2 * Math.log(Math.tan(Math.PI / 4 + MERC_MAX / 2))],
  peters: [Math.SQRT2 * Math.PI, 2 * Math.SQRT2], mollweide: [4 * Math.SQRT2, 2 * Math.SQRT2], polar: [5.2, 5.2],
};
const CONTINENT_TINT: Record<Continent, string> = {
  africa: '#8a8a52', europe: '#6f9160', asia: '#7f9a5c', 'north-america': '#6e955f', 'south-america': '#5f9459', oceania: '#9a8a5a', antarctica: '#e6edf2',
};
const SQ2 = Math.SQRT2;

/** Mollweide's auxiliary angle: 2θ + sin 2θ = π sin φ. */
function mollTheta(phi: number): number {
  if (Math.abs(phi) > 1.5707) return Math.sign(phi) * Math.PI / 2;
  let t = phi;
  for (let i = 0; i < 12; i++) {
    const f = 2 * t + Math.sin(2 * t) - Math.PI * Math.sin(phi);
    t -= f / (2 + 2 * Math.cos(2 * t));
  }
  return t;
}

/** Flat-map position (the Earth's radius is 1). Wall maps stand at y = −1 facing the camera; the polar map lies on the North Pole's tangent plane. */
function mapPos(p: Proj, a: number, phi: number, out: THREE.Vector3): THREE.Vector3 {
  switch (p) {
    case 'plate': return out.set(a, -1, phi);
    case 'mercator': return out.set(a, -1, Math.log(Math.tan(Math.PI / 4 + clamp(phi, -MERC_MAX, MERC_MAX) / 2)));
    case 'peters': return out.set(a * Math.SQRT1_2, -Math.SQRT1_2, SQ2 * Math.sin(phi));
    case 'mollweide': { const t = mollTheta(phi); return out.set((2 * SQ2 / Math.PI) * a * Math.cos(t), -1, SQ2 * Math.sin(t)); }
    case 'polar': { const r = Math.PI / 2 - phi; return out.set(r * Math.sin(a), -r * Math.cos(a), 1); }
  }
}
const spherePos = (a: number, phi: number, out: THREE.Vector3) => out.set(Math.cos(phi) * Math.sin(a), -Math.cos(phi) * Math.cos(a), Math.sin(phi));

/** On the way from the globe, `s` (0…1) of the way: wrap onto a cylinder then unroll it, or open out from the pole, or straight morph. */
function fromGlobe(p: Proj, a: number, phi: number, s: number, out: THREE.Vector3, tmp: THREE.Vector3): THREE.Vector3 {
  const sx = CYL[p];
  if (sx) {
    const y = mapPos(p, a, phi, tmp).z;
    if (s < 0.4) {
      const k = ease(s / 0.4);
      spherePos(a, phi, out);
      return out.set(lerp(out.x, sx * Math.sin(a), k), lerp(out.y, -sx * Math.cos(a), k), lerp(out.z, y, k));
    }
    // a cylinder of radius sx whose curvature relaxes to 0, the front meridian staying put
    const c = (1 - ease((s - 0.4) / 0.6)) / sx, u = sx * a;
    if (c < 1e-4) return out.set(u, -sx, y);
    return out.set(Math.sin(c * u) / c, -Math.cos(c * u) / c + 1 / c - sx, y);
  }
  if (p === 'polar') {
    // a ball tangent at the North Pole that swells until it is flat: arcs from the pole keep their length
    const k = ease(s), R = 1 / Math.max(1 - k, 1e-4), b = (Math.PI / 2 - phi) / R;
    if (R > 1e3) return mapPos(p, a, phi, out);
    return out.set(R * Math.sin(b) * Math.sin(a), -R * Math.sin(b) * Math.cos(a), 1 - R + R * Math.cos(b));
  }
  // others: unroll to the plain cylindrical map first, then reshape it
  if (s < 0.6) return fromGlobe('plate', a, phi, s / 0.6, out, tmp);
  mapPos('plate', a, phi, out);
  mapPos(p, a, phi, tmp);
  return out.lerp(tmp, ease((s - 0.6) / 0.4));
}

const kit: KitFactory<Opts> = (ctx, o) => {
  const clocked = !!(o as { clock?: unknown }).clock;
  const to = o.to, from = o.from ?? 'globe', lon0 = (o.lon0 ?? 10) * D2R, step = o.grid ?? 30;
  const tA = new THREE.Vector3(), tB = new THREE.Vector3(), tC = new THREE.Vector3();
  /** Where (a, φ) is at morph `s`; `a` is the longitude from the central meridian, both in radians. */
  const place = (a: number, phi: number, s: number, out: THREE.Vector3) => {
    if (from === 'globe') return fromGlobe(to, a, phi, s, out, tA);
    mapPos(from, a, phi, out);
    // map → map: shrink or grow along the way so both maps fill the frame
    const e = ease(s);
    return out.lerp(mapPos(to, a, phi, tB), e).multiplyScalar(fit(to) / (fit(from) + (fit(to) - fit(from)) * e));
  };
  /** Camera distance that frames a map (16:10 screen, 40° field of view). */
  const fit = (p: Proj | 'globe') => (p === 'globe' ? 2.4 : Math.max(SIZE[p][0] / 1.6, SIZE[p][1])) * 1.55;
  const rel = (lon: number) => { let a = lon * D2R - lon0; while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; };

  ctx.root.add(dirLight([-0.35, -1, 0.9], 1.5, 1.1));

  // the surface: a (longitude × latitude) grid cut along the antimeridian, so it can open up
  // the polar map stops at 60°S like the UN emblem (further out it is all stretched Antarctica)
  const latMin = (to === 'polar' || from === 'polar' ? -60 : -90) * D2R;
  const NX = ctx.low ? 128 : 220, NY = ctx.low ? 64 : 110;
  const geo = new THREE.BufferGeometry();
  const ap = new Float32Array((NX + 1) * (NY + 1) * 2), pos = new Float32Array((NX + 1) * (NY + 1) * 3), uv = new Float32Array((NX + 1) * (NY + 1) * 2);
  const idx: number[] = [];
  for (let j = 0; j <= NY; j++) for (let i = 0; i <= NX; i++) {
    const k = j * (NX + 1) + i, a = -Math.PI + (2 * Math.PI * i) / NX, phi = latMin + ((Math.PI / 2 - latMin) * j) / NY;
    ap[k * 2] = a; ap[k * 2 + 1] = phi;
    uv[k * 2] = (a + lon0 + Math.PI) / (2 * Math.PI); uv[k * 2 + 1] = (phi + Math.PI / 2) / Math.PI;
    if (i < NX && j < NY) { const n = k + NX + 1; idx.push(k, k + 1, n, k + 1, n + 1, n); }
  }
  geo.setIndex(idx);
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  const mat = new THREE.MeshStandardMaterial({ color: '#215582', roughness: 0.95, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: 2, polygonOffsetUnits: 2 });
  const surf = new THREE.Mesh(geo, mat);
  surf.userData.keepMap = true;
  ctx.root.add(surf);

  // an atlas-style base map from the country shapes: sea, land tinted by continent, borders, coastlines
  const W = ctx.low ? 1024 : 2048;
  let based = false;
  const paintBase = () => {
    const shapes = ctx.countries();
    if (based || !shapes.length) return;
    based = true;
    const tex = canvasTex(W, W / 2, c => {
      const g = c.createLinearGradient(0, 0, 0, W / 2);
      g.addColorStop(0, '#1d4466'); g.addColorStop(0.5, '#215582'); g.addColorStop(1, '#1d4466');
      c.fillStyle = g; c.fillRect(0, 0, W, W / 2);
      for (const sh of shapes) { c.fillStyle = CONTINENT_TINT[sh.continent]; tracePath(c, sh.feature, W, sh.a2 === 'AQ'); c.fill('evenodd'); }
      c.strokeStyle = 'rgba(20, 32, 24, .45)'; c.lineWidth = W / 2048;
      for (const sh of shapes) { tracePath(c, sh.feature, W, sh.a2 === 'AQ'); c.stroke(); }
    });
    tex.wrapS = THREE.RepeatWrapping;
    tex.anisotropy = 4;
    mat.map = tex; mat.color.set(0xffffff); mat.needsUpdate = true;
  };
  paintBase();

  // highlighted countries: painted on an overlay that rides on the same surface
  let overlay: THREE.Mesh | null = null;
  const paintRegions = () => {
    const shapes = ctx.countries();
    if (!o.regions?.length || overlay || !shapes.length) return;
    const tex = canvasTex(W, W / 2, c => {
      for (const r of o.regions!) {
        const set = r.a2 ? new Set(r.a2) : null;
        c.fillStyle = r.c; c.strokeStyle = r.c; c.lineWidth = W / 1024;
        for (const s of shapes) if ((!set || set.has(s.a2)) && (!r.continent || s.continent === r.continent)) {
          c.globalAlpha = 0.55; tracePath(c, s.feature, W, s.a2 === 'AQ'); c.fill('evenodd');
          c.globalAlpha = 1; c.stroke();
        }
      }
    });
    tex.wrapS = THREE.RepeatWrapping;
    overlay = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide, depthWrite: false, depthFunc: THREE.LessEqualDepth }));
    overlay.renderOrder = 1;
    ctx.root.add(overlay);
  };
  paintRegions();

  // graticule: parallels and meridians, with the equator and the central meridian picked out
  type Poly = { pts: [number, number][]; obj: THREE.Line };
  const polys: Poly[] = [];
  const addLine = (pts: [number, number][], c: string, op: number) => {
    const g = new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(new Float32Array(pts.length * 3), 3));
    const l = new THREE.Line(g, new THREE.LineBasicMaterial({ color: c, transparent: true, opacity: op, depthFunc: THREE.LessEqualDepth }));
    l.renderOrder = 2;
    ctx.root.add(l);
    polys.push({ pts, obj: l });
  };
  if (step > 0) {
    for (let la = -90 + step; la < 90; la += step) {
      if (la * D2R < latMin) continue;
      const pts: [number, number][] = [];
      for (let i = 0; i <= 180; i++) pts.push([-Math.PI + (2 * Math.PI * i) / 180, la * D2R]);
      addLine(pts, la === 0 ? '#ffd24a' : '#e9f2ff', la === 0 ? 0.95 : 0.35);
    }
    for (let lo = -180; lo <= 180; lo += step) {
      const a = lo * D2R, pts: [number, number][] = [];
      for (let j = 0; j <= 90; j++) pts.push([a, latMin + ((Math.PI / 2 - latMin) * j) / 90]);
      addLine(pts, lo === 0 ? '#ffd24a' : '#e9f2ff', lo === 0 ? 0.8 : 0.35);
    }
  }

  // Tissot's circles: 6° in radius on the globe; the map shows what becomes of them
  const circles: { pts: [number, number][]; mesh: THREE.Mesh }[] = [];
  if (o.tissot) {
    const rad = 6 * D2R, N = 28;
    const cmat = new THREE.MeshBasicMaterial({ color: '#ff6b6b', transparent: true, opacity: 0.6, side: THREE.DoubleSide, depthWrite: false, depthFunc: THREE.LessEqualDepth });
    for (let la = -60; la <= 60; la += 30) for (let ao = -150; ao <= 150; ao += 30) {
      const p0 = la * D2R, pts: [number, number][] = [[ao * D2R, p0]];
      for (let i = 0; i <= N; i++) {
        const b = (2 * Math.PI * i) / N;
        const p = Math.asin(Math.sin(p0) * Math.cos(rad) + Math.cos(p0) * Math.sin(rad) * Math.cos(b));
        pts.push([ao * D2R + Math.atan2(Math.sin(b) * Math.sin(rad) * Math.cos(p0), Math.cos(rad) - Math.sin(p0) * Math.sin(p)), p]);
      }
      const g = new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(new Float32Array(pts.length * 3), 3));
      const ix: number[] = [];
      for (let i = 1; i <= N; i++) ix.push(0, i, i + 1);
      g.setIndex(ix);
      const m = new THREE.Mesh(g, cmat);
      m.renderOrder = 3;
      ctx.root.add(m);
      circles.push({ pts, mesh: m });
    }
  }

  // labels that ride on the surface
  const labels: { a: number; phi: number; l: Label }[] = [];
  for (const r of o.regions ?? []) if (r.label && r.at) labels.push({ a: rel(r.at[1]), phi: r.at[0] * D2R, l: ctx.label(new THREE.Vector3(), r.label, { c: r.c, big: true, t: 0.4 }) });

  const flat = to === 'polar';
  ctx.view(flat ? [0, -0.45, 1] : [0, -1, 0.08], from === 'globe' ? Math.max(fit(to), fit(from)) : fit(to), flat ? [0, 0, 0.8] : [0, -0.6, 0], true);

  const lift = new THREE.Vector3();
  let last = -1, tick = 0;
  const morph = (s: number) => {
    for (let k = 0; k < ap.length / 2; k++) {
      place(ap[k * 2], ap[k * 2 + 1], s, tC);
      pos[k * 3] = tC.x; pos[k * 3 + 1] = tC.y; pos[k * 3 + 2] = tC.z;
    }
    geo.attributes.position.needsUpdate = true;
    geo.computeVertexNormals();
    geo.computeBoundingSphere();
    const write = (pts: [number, number][], g: THREE.BufferGeometry) => {
      const arr = g.attributes.position.array as Float32Array;
      pts.forEach(([a, phi], i) => { place(a, phi, s, tC); arr[i * 3] = tC.x; arr[i * 3 + 1] = tC.y; arr[i * 3 + 2] = tC.z; });
      g.attributes.position.needsUpdate = true;
      g.computeBoundingSphere();
    };
    for (const p of polys) write(p.pts, p.obj.geometry);
    for (const c of circles) write(c.pts, c.mesh.geometry);
    for (const x of labels) {
      place(x.a, x.phi, s, x.l.pos);
      // nudge toward the viewer so the label is not hidden in the surface
      x.l.pos.add(lift.copy(ctx.camera.position).sub(x.l.pos).normalize().multiplyScalar(0.05));
    }
  };

  return {
    update(v, dt, el) {
      // with a clock (0…100 %) the user can scrub; without one it plays once
      const s = clocked ? clamp(v / 100) : ease((el - 0.8) / 4);
      if ((tick += dt) > 1) { tick = 0; paintBase(); paintRegions(); }
      if (Math.abs(s - last) > 1e-4) { last = s; morph(s); }
    },
    readout: () => NAMES[to],
  };
};
export default kit;
