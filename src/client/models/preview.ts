import * as THREE from 'three';
import type { CatalogueItem } from '../../shared/data/types.ts';
import { buildModel, mat } from './kit.ts';
import { h } from '../ui/dom.ts';

interface ActivePreview {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D | null;
  item: CatalogueItem;
  group: THREE.Group;
  yaw: number;
  pitch: number;
  dragging: boolean;
  clock: number;
}

let sharedRenderer: THREE.WebGLRenderer | null = null;
let sharedFailed = false;
let sharedScene: THREE.Scene | null = null;
let sharedCamera: THREE.PerspectiveCamera | null = null;
let sharedRoot: THREE.Group | null = null;
let rafId = 0;
const activePreviews = new Set<ActivePreview>();

/** Configures the shared 3-point studio lighting rig used by every miniature turntable preview. */
export function setupStudio(renderer: THREE.WebGLRenderer, scene: THREE.Scene): void {
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const key = new THREE.DirectionalLight(0xfffbeb, 2.75);
  key.position.set(2.8, 4.2, 3.4);
  const fill = new THREE.DirectionalLight(0x38bdf8, 1.25);
  fill.position.set(-3.2, 1.8, -2.0);
  const rimLight = new THREE.DirectionalLight(0xfde68a, 0.9);
  rimLight.position.set(0.5, 2.5, -3.5);
  const amb = new THREE.HemisphereLight(0xe0f2fe, 0x0f172a, 1.3);
  scene.add(key, fill, rimLight, amb);
}

function ensureRenderer(w: number, hPx: number): THREE.WebGLRenderer | null {
  if (sharedFailed) return null;
  if (!sharedRenderer) {
    try {
      sharedRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
      sharedRenderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
      sharedScene = new THREE.Scene();
      sharedCamera = new THREE.PerspectiveCamera(28, w / hPx, 0.05, 20);
      setupStudio(sharedRenderer, sharedScene);
      sharedRoot = new THREE.Group();
      sharedScene.add(sharedRoot);
    } catch {
      sharedFailed = true;
      return null;
    }
  }
  sharedRenderer.setSize(w, hPx, false);
  if (sharedCamera) {
    sharedCamera.aspect = w / hPx;
    sharedCamera.updateProjectionMatrix();
  }
  return sharedRenderer;
}

function buildPreviewScene(item: CatalogueItem): THREE.Group {
  const wrap = new THREE.Group();
  const isWater = ['waterfall', 'reef', 'bridge', 'wreck', 'deepsea'].includes(item.sub) || item.continent === 'ocean';
  const isDesert = ['pyramid', 'carved', 'rock', 'canyon'].includes(item.model.kind);
  const isSnow = Boolean(item.model.snow) || item.continent === 'antarctica';
  const padColor = isWater ? '#0f2942' : isSnow ? '#cbd5e1' : isDesert ? '#785a3c' : item.type === 'discovery' ? '#1e1b4b' : '#1e293b';
  const rimColor = item.type === 'landmark' ? '#38bdf8' : item.type === 'animal' ? '#34d399' : '#f59e0b';

  // Sleek architectural studio turntable stage
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.58, 0.62, 0.04, 36).translate(0, -0.02, 0),
    mat(padColor, { flat: false, rough: 0.75 })
  );
  const rim = new THREE.Mesh(
    new THREE.RingGeometry(0.57, 0.60, 40).rotateX(-Math.PI / 2).translate(0, 0.002, 0),
    new THREE.MeshBasicMaterial({ color: rimColor, transparent: true, opacity: 0.72, side: THREE.DoubleSide })
  );
  const innerRim = new THREE.Mesh(
    new THREE.RingGeometry(0.44, 0.452, 36).rotateX(-Math.PI / 2).translate(0, 0.002, 0),
    new THREE.MeshBasicMaterial({ color: rimColor, transparent: true, opacity: 0.28, side: THREE.DoubleSide })
  );
  const model = buildModel(item.model);

  // Auto-center & tightly frame bounding box so architectural landmarks fill the studio stage
  const box = new THREE.Box3().setFromObject(model);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);
  const maxDim = Math.max(0.38, size.x * 0.92, size.y, size.z * 0.92);
  const scale = 1.06 / maxDim;
  model.scale.setScalar(scale);
  model.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale);

  wrap.add(base, rim, innerRim, model);
  return wrap;
}

const isLowFx = () => typeof location !== 'undefined' && new URLSearchParams(location.search).has('lowfx');

function renderOne(p: ActivePreview): void {
  p.group.rotation.y = p.yaw;
  p.group.rotation.x = p.pitch;
  const w = p.canvas.width || 220;
  const hPx = p.canvas.height || 140;
  const renderer = ensureRenderer(w / 2, hPx / 2);
  if (renderer && sharedScene && sharedCamera && sharedRoot && p.ctx) {
    sharedRoot.clear();
    sharedRoot.add(p.group);
    sharedCamera.position.set(0, 0.60, 1.76);
    sharedCamera.lookAt(0, 0.34, 0);
    renderer.render(sharedScene, sharedCamera);
    p.ctx.clearRect(0, 0, w, hPx);
    p.ctx.drawImage(renderer.domElement, 0, 0, w, hPx);
  }
}

let lastTime = performance.now();
function tick(): void {
  rafId = 0;
  if (isLowFx()) return;
  const now = performance.now();
  const dt = Math.min(64, now - lastTime);
  lastTime = now;

  for (const p of [...activePreviews]) {
    if (!p.canvas.isConnected) {
      activePreviews.delete(p);
      continue;
    }
    p.clock += dt;
    if (!p.dragging) {
      p.yaw += dt * 0.00085;
    }
    p.group.traverse(o => {
      if (o.name === 'spin') o.rotation.z += dt * 0.0025;
      if (o.name === 'flap') o.rotation.z = Math.sin(p.clock * 0.005) * 0.22;
    });
    renderOne(p);
  }

  if (activePreviews.size > 0) {
    rafId = requestAnimationFrame(tick);
  }
}

/** Creates an interactive 3D turntable preview widget (like myearthtoy.com's #info-preview / #placeit-preview). */
export function createModelPreview(item: CatalogueItem, opts: { width?: number; height?: number; id?: string } = {}): HTMLElement {
  const w = opts.width ?? 220;
  const hPx = opts.height ?? 132;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const canvas = h('canvas', {
    class: 'model-preview-canvas',
    width: String(Math.round(w * dpr)),
    height: String(Math.round(hPx * dpr)),
    ...(opts.id ? { id: opts.id } : {}),
  }) as HTMLCanvasElement;
  canvas.style.width = `${w}px`;
  canvas.style.height = `${hPx}px`;

  const ctx = canvas.getContext('2d');
  const preview: ActivePreview = {
    canvas,
    ctx,
    item,
    group: buildPreviewScene(item),
    yaw: 0.45,
    pitch: 0.08,
    dragging: false,
    clock: 0,
  };

  let lastX = 0;
  let lastY = 0;
  canvas.addEventListener('pointerdown', e => {
    preview.dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', e => {
    if (!preview.dragging) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
    preview.yaw += dx * 0.014;
    preview.pitch = Math.max(-0.25, Math.min(0.45, preview.pitch + dy * 0.008));
    if (isLowFx()) renderOne(preview);
  });
  const stopDrag = () => { preview.dragging = false; };
  canvas.addEventListener('pointerup', stopDrag);
  canvas.addEventListener('pointercancel', stopDrag);

  renderOne(preview);
  if (!isLowFx()) {
    activePreviews.add(preview);
    if (!rafId) {
      lastTime = performance.now();
      rafId = requestAnimationFrame(tick);
    }
  }

  return h('div', { class: 'model-stage' },
    canvas,
    h('span', { class: 'model-stage-badge' }, item.emoji),
    h('span', { class: 'model-stage-hint' }, '3D · 360°'),
  );
}
