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

function ensureRenderer(w: number, hPx: number): THREE.WebGLRenderer | null {
  if (sharedFailed) return null;
  if (!sharedRenderer) {
    try {
      sharedRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
      sharedRenderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
      sharedRenderer.outputColorSpace = THREE.SRGBColorSpace;
      sharedScene = new THREE.Scene();
      sharedCamera = new THREE.PerspectiveCamera(34, w / hPx, 0.05, 20);
      const key = new THREE.DirectionalLight(0xffffff, 2.5);
      key.position.set(2.5, 4.0, 3.2);
      const fill = new THREE.DirectionalLight(0x38bdf8, 1.1);
      fill.position.set(-3.0, 1.5, -2.0);
      const amb = new THREE.HemisphereLight(0xe0f2fe, 0x0f172a, 1.25);
      sharedRoot = new THREE.Group();
      sharedScene.add(key, fill, amb, sharedRoot);
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
  const padColor = isWater ? '#1e4e79' : isSnow ? '#dbeafe' : isDesert ? '#c9a675' : item.type === 'discovery' ? '#312e81' : '#2d5a43';
  const rimColor = item.type === 'landmark' ? '#38bdf8' : item.type === 'animal' ? '#34d399' : '#f59e0b';

  // Scenic turntable pedestal
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.62, 0.68, 0.08, 28).translate(0, -0.04, 0),
    mat(padColor, { flat: false, rough: 0.8 })
  );
  const rim = new THREE.Mesh(
    new THREE.RingGeometry(0.63, 0.69, 32).rotateX(-Math.PI / 2).translate(0, 0.002, 0),
    new THREE.MeshBasicMaterial({ color: rimColor, transparent: true, opacity: 0.65, side: THREE.DoubleSide })
  );
  const model = buildModel(item.model);

  // Auto-center & normalize bounding box so tall skyscrapers and wide bridges both frame nicely
  const box = new THREE.Box3().setFromObject(model);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);
  const maxDim = Math.max(0.4, size.x, size.y, size.z);
  const scale = 0.88 / maxDim;
  model.scale.setScalar(scale);
  model.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale);

  wrap.add(base, rim, model);
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
    sharedCamera.position.set(0, 0.72, 1.95);
    sharedCamera.lookAt(0, 0.28, 0);
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
