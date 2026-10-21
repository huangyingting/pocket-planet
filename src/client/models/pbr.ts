import * as THREE from 'three';

/**
 * Per-vertex surface response for merged models: a normalized `pbr` attribute (x = roughness, y = metalness) keeps
 * every part's own material (glossy water, brushed steel, matte stone) after many parts are merged into one mesh.
 */
export const PBR_ATTR = 'pbr';

export function useVertexPbr(m: THREE.MeshStandardMaterial): THREE.MeshStandardMaterial {
  m.onBeforeCompile = sh => {
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', `#include <common>\nattribute vec2 ${PBR_ATTR};\nvarying vec2 vPbr;`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>\nvPbr = ${PBR_ATTR};`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec2 vPbr;')
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = max(vPbr.x, 0.04);')
      .replace('#include <metalnessmap_fragment>', '#include <metalnessmap_fragment>\nmetalnessFactor = vPbr.y;');
  };
  m.customProgramCacheKey = () => 'vertex-pbr';
  m.userData.vertexPbr = true;
  return m;
}

const variants = new WeakMap<THREE.Material, THREE.MeshStandardMaterial>();
/** The vertex-PBR twin of a material (for meshes rebuilt from a worker, where shader hooks do not travel). */
export function vertexPbrOf(m: THREE.Material): THREE.Material {
  if (!(m as THREE.MeshStandardMaterial).isMeshStandardMaterial || m.userData.vertexPbr) return m;
  let v = variants.get(m);
  if (!v) { v = useVertexPbr((m as THREE.MeshStandardMaterial).clone()); variants.set(m, v); }
  return v;
}
