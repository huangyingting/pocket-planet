import type { Builder } from '../prims.ts';
import { box, cyl, shade } from '../prims.ts';
import { figure, figureBase } from '../figure.ts';

export const H_PEOPLE_A: Record<string, Builder> = {
  pp_confucius: gp => {
    const y = figureBase(gp, '#cdbb98', '#6b5640');
    const a = figure(gp, {
      y, top: '#7c2d12', accent: '#d6b25e', outfit: 'robe', wideSleeves: true, hair: '#3a3a3a', hairStyle: 'topknot', hat: 'scholar',
      beard: 'long', beardColor: '#d4d4d4', armL: { fwd: 0.9, side: 0.1, bend: 0.5, inward: 0.5 }, armR: { fwd: 0.9, side: 0.1, bend: 0.5, inward: 0.5 },
    });
    // bamboo scroll held in both hands
    const [lx, ly, lz] = a.handL, [rx] = a.handR;
    for (let i = 0; i < 9; i++) box(gp, shade('#c9a86a', (i % 2) * 0.06), lx + (rx - lx) * (i / 8), ly, lz + 0.02, 0.012, 0.11, 0.006);
    cyl(gp, '#8b5a2b', 0.28, y, -0.18, 0.06, 0.02);
  },
};
