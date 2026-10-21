import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { inferPbr, PBR_ATTR } from '../../src/client/models/pbr.ts';
import { bakeStaticMeshes } from '../../src/client/models/kit.ts';
import { box, mat, add, BOX } from '../../src/client/models/prims.ts';

const pbr = (hex: string) => inferPbr(new THREE.Color(hex));

describe('inferPbr', () => {
  it('keeps foliage and earth matte, water glossy and gold metallic', () => {
    expect(pbr('#16a34a')[0]).toBeGreaterThan(0.8);
    expect(pbr('#8a6a4a')[0]).toBeGreaterThan(0.8);
    expect(pbr('#38bdf8')[0]).toBeLessThan(0.25);
    expect(pbr('#eab308')[1]).toBeGreaterThan(0.3);
    expect(pbr('#16a34a')[1]).toBe(0);
  });
});

describe('bakeStaticMeshes', () => {
  it('stores inferred finishes per vertex but honours explicit ones', () => {
    const gp = new THREE.Group();
    box(gp, '#16a34a', 0, 0, 0, 1, 1, 1);
    add(gp, BOX(), mat('#16a34a', { rough: 0.1, metal: 0.9 }), 2, 0, 0, 1, 1, 1);
    bakeStaticMeshes(gp);
    const meshes = gp.children.filter(c => (c as THREE.Mesh).isMesh) as THREE.Mesh[];
    expect(meshes).toHaveLength(1);
    const a = meshes[0].geometry.getAttribute(PBR_ATTR);
    const vals = new Set<string>();
    for (let i = 0; i < a.count; i++) vals.add(`${a.getX(i).toFixed(2)},${a.getY(i).toFixed(2)}`);
    expect(vals).toContain('0.86,0.00');
    expect(vals).toContain('0.10,0.90');
  });
});
