import { feature, mesh, neighbors } from 'topojson-client';
import type { Topology, GeometryCollection } from 'topojson-specification';
import type { Feature, MultiPolygon, Polygon, Position } from 'geojson';
import { ISO, type Continent } from '../../shared/data/iso.ts';

export interface CountryInfo { id: string; a2: string; continent: Continent; name: string; lat: number; lon: number; area: number; feature: Feature<Polygon | MultiPolygon> }

const PALETTE = ['#f7c95c', '#f29a76', '#a8d672', '#86c5e8', '#d7a6e8', '#f5e17a', '#7fd6b8', '#f2b5c8'];

export function loadCountries(topo: Topology): CountryInfo[] {
  const obj = topo.objects.countries as GeometryCollection;
  const fc = feature(topo, obj) as unknown as { features: Feature<Polygon | MultiPolygon>[] };
  return fc.features.map((f, i) => {
    const id = String(f.id ?? (f.properties as { name: string }).name);
    const name = (f.properties as { name: string }).name;
    const [a2, continent] = ISO[id] ?? ISO[name] ?? ['', 'asia'];
    const { lat, lon, area } = labelPoint(f);
    return { id: id + ':' + i, a2, continent, name, lat, lon, area, feature: f };
  });
}

function ringArea(r: Position[]): number {
  let a = 0;
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) a += (r[j][0] + r[i][0]) * (r[j][1] - r[i][1]);
  return Math.abs(a / 2);
}

/** Centroid of the largest polygon, plus total area in deg² (cos-lat weighted) for label priority. */
function labelPoint(f: Feature<Polygon | MultiPolygon>): { lat: number; lon: number; area: number } {
  const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
  let best = polys[0], bestA = -1, total = 0;
  for (const p of polys) {
    const a = ringArea(p[0]) * Math.cos(((p[0][0][1] ?? 0) * Math.PI) / 180);
    total += a;
    if (a > bestA) { bestA = a; best = p; }
  }
  // unwrap longitudes so rings that touch the antimeridian (Fiji, Russia) get a sensible centroid
  const r: Position[] = [];
  let prev = best[0][0][0];
  for (const [x0, y] of best[0]) { let x = x0; while (x - prev > 180) x -= 360; while (prev - x > 180) x += 360; r.push([x, y]); prev = x; }
  let cx = 0, cy = 0, a = 0;
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
    const k = r[j][0] * r[i][1] - r[i][0] * r[j][1];
    a += k; cx += (r[j][0] + r[i][0]) * k; cy += (r[j][1] + r[i][1]) * k;
  }
  if (Math.abs(a) < 1e-9) return { lon: r[0][0], lat: r[0][1], area: total };
  const lon = ((cx / (3 * a) + 540) % 360) - 180;
  return { lon, lat: cy / (3 * a), area: total };
}

export interface PaintOpts { terrain: boolean; borders: boolean; width: number }

// Simple deterministic value-noise for terrain colour variation.
function hash(x: number, y: number): number {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}
function noise(x: number, y: number): number {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

function terrainColour(lat: number, lon: number): [number, number, number] {
  const al = Math.abs(lat);
  const n = noise(lon / 9, lat / 9) * 0.6 + noise(lon / 3, lat / 3) * 0.4;
  if (al > 66 || lat < -58) return [240, 244, 248];
  const desert = (al > 14 && al < 34 && n > 0.38) || (lat > 36 && lat < 50 && lon > 50 && lon < 110 && n > 0.45);
  if (desert) return [226 - n * 30, 200 - n * 30, 140 - n * 20];
  if (al > 55) return [150 + n * 40, 160 + n * 30, 120 + n * 20];
  if (al < 12) return [60 + n * 40, 140 + n * 40, 60 + n * 20];
  return [110 + n * 60, 160 + n * 40, 80 + n * 30];
}

export function paintEarth(topo: Topology, countries: CountryInfo[], opts: PaintOpts): HTMLCanvasElement {
  const W = opts.width, H = W / 2;
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d')!;
  const X = (lon: number) => ((lon + 180) / 360) * W;
  const Y = (lat: number) => ((90 - lat) / 180) * H;

  // Ocean: latitude gradient.
  const grd = ctx.createLinearGradient(0, 0, 0, H);
  grd.addColorStop(0, '#2b5a8f'); grd.addColorStop(0.5, '#1f4f8c'); grd.addColorStop(1, '#2b5a8f');
  ctx.fillStyle = grd; ctx.fillRect(0, 0, W, H);

  const path = (f: Feature<Polygon | MultiPolygon>) => {
    const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
    ctx.beginPath();
    for (const poly of polys) for (const ring of poly) {
      ring.forEach(([lon, lat], i) => (i ? ctx.lineTo(X(lon), Y(lat)) : ctx.moveTo(X(lon), Y(lat))));
      ctx.closePath();
    }
  };

  // Shallow-water glow around coasts.
  ctx.lineJoin = 'round';
  for (const [w, c] of [[W / 160, 'rgba(90,170,220,0.35)'], [W / 400, 'rgba(120,200,235,0.55)']] as const) {
    ctx.strokeStyle = c; ctx.lineWidth = w;
    for (const c2 of countries) { path(c2.feature); ctx.stroke(); }
  }

  // Political fill with greedy colouring so neighbours differ.
  const obj = topo.objects.countries as GeometryCollection;
  const nb = neighbors(obj.geometries as never);
  const colourIdx: number[] = [];
  countries.forEach((_, i) => {
    const used = new Set(nb[i].map(j => colourIdx[j]).filter(x => x !== undefined));
    let k = (i * 3) % PALETTE.length;
    for (let t = 0; t < PALETTE.length && used.has(k); t++) k = (k + 1) % PALETTE.length;
    colourIdx[i] = k;
  });

  if (opts.terrain) {
    // Build land mask, then fill with procedural biome colours via pixel pass.
    ctx.save();
    ctx.fillStyle = '#000';
    const mask = document.createElement('canvas'); mask.width = W; mask.height = H;
    const mctx = mask.getContext('2d')!;
    mctx.fillStyle = '#fff';
    for (const c of countries) {
      const polys = c.feature.geometry.type === 'Polygon' ? [c.feature.geometry.coordinates] : c.feature.geometry.coordinates;
      mctx.beginPath();
      for (const poly of polys) for (const ring of poly) { ring.forEach(([lon, lat], i) => (i ? mctx.lineTo(X(lon), Y(lat)) : mctx.moveTo(X(lon), Y(lat)))); mctx.closePath(); }
      mctx.fill('evenodd');
    }
    const md = mctx.getImageData(0, 0, W, H).data;
    const img = ctx.getImageData(0, 0, W, H);
    const d = img.data;
    for (let y = 0; y < H; y++) {
      const lat = 90 - (y / H) * 180;
      for (let x = 0; x < W; x++) {
        const o = (y * W + x) * 4;
        if (md[o] < 128) continue;
        const [r, g, b] = terrainColour(lat, (x / W) * 360 - 180);
        d[o] = r; d[o + 1] = g; d[o + 2] = b;
      }
    }
    ctx.putImageData(img, 0, 0);
    ctx.restore();
  } else {
    countries.forEach((c, i) => {
      path(c.feature);
      ctx.fillStyle = c.a2 === 'AQ' ? '#eef3f8' : PALETTE[colourIdx[i]];
      ctx.fill('evenodd');
    });
  }

  if (opts.borders) {
    // Graticule every 15°, tropics/equator dashed gold.
    ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = Math.max(1, W / 2048);
    for (let lon = -180; lon <= 180; lon += 15) { ctx.beginPath(); ctx.moveTo(X(lon), 0); ctx.lineTo(X(lon), H); ctx.stroke(); }
    for (let lat = -75; lat <= 75; lat += 15) { ctx.beginPath(); ctx.moveTo(0, Y(lat)); ctx.lineTo(W, Y(lat)); ctx.stroke(); }
    ctx.setLineDash([W / 300, W / 400]); ctx.strokeStyle = 'rgba(255,214,106,0.55)'; ctx.lineWidth = Math.max(1, W / 1500);
    for (const lat of [0, 23.44, -23.44]) { ctx.beginPath(); ctx.moveTo(0, Y(lat)); ctx.lineTo(W, Y(lat)); ctx.stroke(); }
    ctx.setLineDash([]);
    const m = mesh(topo, obj as never, (a, b) => a !== b);
    ctx.strokeStyle = opts.terrain ? 'rgba(60,50,40,0.55)' : 'rgba(80,60,40,0.6)';
    ctx.lineWidth = Math.max(1, W / 1800);
    for (const line of m.coordinates) {
      ctx.beginPath();
      let prev: number | null = null;
      line.forEach(([lon, lat]) => {
        const x = X(lon), y = Y(lat);
        if (prev === null || Math.abs(prev - x) > W / 2) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        prev = x;
      });
      ctx.stroke();
    }
  }
  return cv;
}
