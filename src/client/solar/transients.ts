/**
 * Transient sky events in the deep scenes: supernovae, novae, Sgr A* flares, kilonovae, tidal disruptions and
 * gamma-ray bursts. Each flash follows its kind's real light-curve shape and colour evolution (time sped up like
 * everything else out here) and carries a short-lived name tag. Rates are relative: a Milky Way supernova is ~2 per
 * century, an Andromeda nova ~65 a year, a detectable GRB ~1 a day — so novae come more often than supernovae, etc.
 */
import * as THREE from 'three';
import { tr, type Lang } from '../../shared/data/types.ts';
import { glowCanvas } from './cosmos-paint.ts';
import { textW, underUI } from '../ui/occluders.ts';

type Bi = Record<Lang, string>;
const SIM: Bi = { en: 'simulated', zh: '模拟演示' };
export interface TransientKind {
  name: Bi;
  /** Peak size on screen, CSS px. */
  px: number;
  /** Seconds: rise to peak, then a plateau, then e-folding decay. */
  rise: number; hold: number; decay: number;
  /** A late, slow tail (GRB afterglow, Ia's secondary hump) as a fraction of peak, with its own e-fold. */
  tail?: [number, number];
  /** Colour at peak and late on (supernovae redden as they cool; novae turn H-alpha red). */
  hot: [number, number, number]; cool: [number, number, number];
  /** Narrow twin beams (relativistic jets), drawn as a streak. */
  jets?: boolean;
}

export const KINDS = {
  snII: { name: { en: 'Supernova · Type II', zh: '超新星 · II 型' }, px: 26, rise: 0.7, hold: 2.6, decay: 1.8, hot: [0.72, 0.84, 1], cool: [1, 0.66, 0.42] },
  snIa: { name: { en: 'Supernova · Type Ia', zh: '超新星 · Ia 型' }, px: 30, rise: 1.1, hold: 0.2, decay: 1.5, tail: [0.18, 3.5], hot: [0.95, 0.95, 1], cool: [1, 0.78, 0.5] },
  nova: { name: { en: 'Nova', zh: '新星' }, px: 13, rise: 0.25, hold: 0.1, decay: 1.2, hot: [1, 0.94, 0.9], cool: [1, 0.5, 0.58] },
  sgrA: { name: { en: 'Sgr A* flare', zh: '人马座 A* 耀发' }, px: 22, rise: 0.35, hold: 0.15, decay: 0.9, hot: [1, 0.85, 0.6], cool: [1, 0.62, 0.35] },
  kilonova: { name: { en: 'Kilonova (neutron stars merge)', zh: '千新星（中子星并合）' }, px: 18, rise: 0.25, hold: 0, decay: 1.1, hot: [0.75, 0.85, 1], cool: [1, 0.35, 0.22] },
  tde: { name: { en: 'Star torn apart by a black hole', zh: '潮汐瓦解事件' }, px: 20, rise: 1.4, hold: 0.4, decay: 2.6, hot: [0.7, 0.84, 1], cool: [0.85, 0.9, 1] },
  grb: { name: { en: 'Gamma-ray burst', zh: '伽马射线暴' }, px: 46, rise: 0.05, hold: 0.05, decay: 0.32, tail: [0.12, 2.2], hot: [0.82, 0.9, 1], cool: [0.9, 0.85, 1], jets: true },
} satisfies Record<string, TransientKind>;

/** One kind of event at a level: where it can happen (root-local coordinates) and its mean interval (s). */
export interface TransientSource { kind: TransientKind; site: () => THREE.Vector3; every: number }

interface Live { k: TransientKind; t: number; sprite: THREE.Sprite; tag: HTMLElement; spin: number }

let jetCv: HTMLCanvasElement | null = null;
/** A bright core with two thin opposite beams. */
function jetCanvas(): HTMLCanvasElement {
  if (jetCv) return jetCv;
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const x = c.getContext('2d')!;
  x.drawImage(glowCanvas(), 0, 0, 128, 128);
  const g = x.createLinearGradient(0, 0, 128, 0);
  g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,0.9)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g;
  x.fillRect(0, 62, 128, 4);
  return (jetCv = c);
}

export class Transients {
  private live: Live[] = [];
  private next: number[];
  private glow = new THREE.CanvasTexture(glowCanvas());
  private jet = new THREE.CanvasTexture(jetCanvas());
  private tmp = new THREE.Vector3();
  private col = new THREE.Color();

  constructor(private parent: THREE.Object3D, private tags: HTMLElement, private sources: TransientSource[], private max = 4) {
    // The first ones come soon after arriving, so the sky is seen to be alive.
    this.next = sources.map(s => s.every * (0.15 + Math.random() * 0.5));
  }

  update(sec: number): void {
    for (let i = 0; i < this.sources.length; i++) {
      this.next[i] -= sec;
      if (this.next[i] > 0) continue;
      const s = this.sources[i];
      this.next[i] = -Math.log(1 - Math.random() * 0.95) * s.every;
      if (this.live.length < this.max) this.spawn(s);
    }
    for (const e of this.live) e.t += sec;
    this.live = this.live.filter(e => {
      if (this.level(e) > 0.004 || e.t < e.k.rise) return true;
      this.parent.remove(e.sprite);
      (e.sprite.material as THREE.Material).dispose();
      e.tag.remove();
      return false;
    });
  }

  private spawn(s: TransientSource): void {
    const k = s.kind;
    const m = new THREE.SpriteMaterial({ map: k.jets ? this.jet : this.glow, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false });
    const spin = Math.random() * Math.PI;
    m.rotation = spin;
    const sprite = new THREE.Sprite(m);
    sprite.position.copy(s.site());
    this.parent.add(sprite);
    const tag = document.createElement('span');
    tag.className = 'dl-event';
    tag.hidden = true;
    this.tags.append(tag);
    this.live.push({ k, t: 0, sprite, tag, spin });
  }

  /** Brightness 0..1 along the light curve. */
  private level(e: Live): number {
    const { rise, hold, decay, tail } = e.k, t = e.t;
    if (t < rise) { const f = t / rise; return f * f * (3 - 2 * f); }
    const d = t - rise - hold;
    const main = d < 0 ? 1 - 0.12 * (t - rise) / Math.max(hold, 1e-3) : 0.88 * Math.exp(-d / decay);
    return tail ? Math.max(main, tail[0] * Math.exp(-Math.max(0, d) / tail[1])) : main;
  }

  /** Sizes the flashes for this camera (constant on-screen size, like a star) and fades them with the level. */
  frame(cam: THREE.PerspectiveCamera, H: number, fade: number): void {
    const k = 2 * Math.tan((cam.fov * Math.PI) / 360) / H;
    for (const e of this.live) {
      const a = this.level(e);
      const age = Math.min(1, e.t / (e.k.rise + e.k.hold + e.k.decay * 2.5));
      const [h, c] = [e.k.hot, e.k.cool];
      this.col.setRGB(h[0] + (c[0] - h[0]) * age, h[1] + (c[1] - h[1]) * age, h[2] + (c[2] - h[2]) * age);
      const m = e.sprite.material as THREE.SpriteMaterial;
      m.color.copy(this.col);
      m.opacity = Math.min(1, a * 1.15) * fade;
      e.sprite.getWorldPosition(this.tmp);
      const px = e.k.px * (0.35 + 0.65 * Math.sqrt(a));
      e.sprite.scale.setScalar(Math.max(1e-6, px * k * this.tmp.distanceTo(cam.position)));
    }
  }

  /** Places the name tags next to their flashes (only while bright, never on the chrome or another label). */
  tagsAt(cam: THREE.PerspectiveCamera, W: number, H: number, l: Lang, boxes: [number, number, number][]): void {
    for (const e of this.live) {
      e.sprite.getWorldPosition(this.tmp).project(cam);
      const a = this.level(e), p = this.tmp;
      let show = a > 0.25 && p.z < 1 && Math.abs(p.x) < 1 && Math.abs(p.y) < 1;
      if (show) {
        // procedurally timed and sped up, not a live observation: say so on the tag itself
        const nm = `${tr(e.k.name, l)} · ${tr(SIM, l)}`;
        if (e.tag.textContent !== nm) e.tag.textContent = nm;
        const x = (p.x + 1) / 2 * W + 10, y = (1 - p.y) / 2 * H - 22, w = textW(e.tag.textContent, 7) + 14;
        show = x + w < W - 4 && y > 4 && !underUI(x, y, w, 18) && !boxes.some(([bx, by, bw]) => x < bx + bw && x + w > bx && Math.abs(by - y - 9) < 18);
        if (show) {
          boxes.push([x, y + 9, w]);
          e.tag.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
          e.tag.style.opacity = Math.min(1, (a - 0.25) * 3).toFixed(2);
        }
      }
      e.tag.hidden = !show;
    }
  }

  /** Clears the sky (leaving the level). */
  clear(): void {
    for (const e of this.live) { this.parent.remove(e.sprite); (e.sprite.material as THREE.Material).dispose(); e.tag.remove(); }
    this.live = [];
  }

  get count(): number { return this.live.length; }
}
