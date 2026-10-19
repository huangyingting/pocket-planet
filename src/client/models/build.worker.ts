/// <reference lib="webworker" />
import type { ModelRecipe } from '../../shared/data/types.ts';
import { buildFresh, whenModelReady } from './kit.ts';
import { packModel } from './pack.ts';

// Builds and bakes models off the main thread; replies with a transferable PackedModel (see pack.ts).
const sent = new Set<string>();
self.onmessage = async (e: MessageEvent<{ id: number; recipe: ModelRecipe }>) => {
  const { id, recipe } = e.data;
  try {
    await whenModelReady(recipe);
    const t0 = performance.now();
    const { model, transfer } = packModel(buildFresh(recipe), sent);
    (self as unknown as DedicatedWorkerGlobalScope).postMessage({ id, ok: true, model, ms: performance.now() - t0 }, transfer);
  } catch (err) {
    (self as unknown as DedicatedWorkerGlobalScope).postMessage({ id, ok: false, err: String(err) });
  }
};
