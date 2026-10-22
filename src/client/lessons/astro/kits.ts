/** The kits, each loaded on first use (a lesson only pays for the models it shows). */
import type { KitFactory, KitId } from './types.ts';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Mod = Promise<{ default: KitFactory<any> }>;
export const KITS: Record<KitId, () => Mod> = {
  model: () => import('./k-model.ts'),
  projection: () => import('./k-projection.ts'),
  orrery: () => import('./k-orrery.ts'),
  compare: () => import('./k-compare.ts'),
  tides: () => import('./k-tides.ts'),
  sky: () => import('./k-sky.ts'),
  galaxy: () => import('./k-galaxy.ts'),
  ladder: () => import('./k-ladder.ts'),
  kepler: () => import('./k-kepler.ts'),
  cannon: () => import('./k-cannon.ts'),
  satellites: () => import('./k-satellites.ts'),
  retro: () => import('./k-retro.ts'),
  sun: () => import('./k-sun.ts'),
  stars: () => import('./k-stars.ts'),
  life: () => import('./k-life.ts'),
  compact: () => import('./k-compact.ts'),
  expand: () => import('./k-expand.ts'),
  transit: () => import('./k-transit.ts'),
  rays: () => import('./k-rays.ts'),
};
