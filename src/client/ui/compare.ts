/** The compare bench modal: one measure per group, true scale or clearly-marked enlarged view. */
import { h, openModal } from './dom.ts';
import { icon } from './icons.ts';
import { t, lang, fmtNum } from '../lib/i18n.ts';
import { tr } from '../../shared/data/types.ts';
import { sfx } from '../lib/sfx.ts';
import { compareGroups, groupOf, ratio, drawn, type Group, type Thing } from '../lib/compare.ts';

const SVG = 'http://www.w3.org/2000/svg';
const W = 520, H = 250, BASE = 228, MAX = 200;
const COL = ['#ffb347', '#6cc6ff'];

function s<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number>, text?: string): SVGElementTagNameMap[K] {
  const el = document.createElementNS(SVG, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  if (text !== undefined) el.textContent = text;
  return el;
}

export function openCompare(start?: string): void {
  const groups = compareGroups();
  let g: Group = (start && groupOf(start)) || groups[0];
  let pair: [string, string] = start && groupOf(start) ? [start, g.pair[0] === start ? g.pair[1] : g.pair[0]] : [...g.pair];
  let scale: 'true' | 'zoom' = 'true';

  const fmt = (th: Thing) => fmtNum(th.size) + (g.unit === 'km' ? (lang() === 'zh' ? ' 公里' : ' km') : g.unit === 'kmh' ? (lang() === 'zh' ? ' 公里/时' : ' km/h') : (lang() === 'zh' ? ' 米' : ' m'));
  const bars = () => g.id === 'long' || g.id === 'fast';
  const tabs = h('div', { class: 'cmp-tabs', role: 'group', 'aria-label': t('compare') });
  const pickers = h('div', { class: 'cmp-picks' });
  const scales = h('div', { class: 'cmp-scale', role: 'group' });
  const stage = s('svg', { viewBox: `0 0 ${W} ${H}`, class: 'cmp-stage', role: 'img', 'data-testid': 'cmp-stage' });
  const ratioP = h('p', { class: 'cmp-ratio', 'data-testid': 'cmp-ratio', 'aria-live': 'polite' });
  const note = h('p', { class: 'cmp-note', 'data-testid': 'cmp-note' });

  const render = () => {
    tabs.replaceChildren(...groups.map(x => h('button', { class: 'pill pill-sm' + (x === g ? ' active' : ''), 'aria-pressed': String(x === g), 'data-testid': 'cmp-g-' + x.id,
      onclick: () => { if (x !== g) { sfx.tap(); g = x; pair = [...x.pair]; render(); } } }, t('cmp_' + x.id))));
    pickers.replaceChildren(...[0, 1].map(i => h('label', { class: 'cmp-pick' },
      h('span', { class: 'dot', style: `background:${COL[i]}` }), h('span', { class: 'muted small' }, t(i ? 'cmpPickB' : 'cmpPickA')),
      h('select', { 'data-testid': 'cmp-pick-' + i, onchange: (e: Event) => { pair[i] = (e.target as HTMLSelectElement).value; render(); } },
        ...g.things.map(th => h('option', { value: th.id, selected: th.id === pair[i] }, `${th.emoji} ${tr(th.name, lang())} · ${fmt(th)}`))))));
    scales.replaceChildren(...(['true', 'zoom'] as const).map(m => h('button', { class: 'pill pill-sm' + (m === scale ? ' active' : ''), 'aria-pressed': String(m === scale), 'data-testid': 'cmp-' + m,
      onclick: () => { scale = m; render(); } }, t(m === 'true' ? 'cmpTrue' : 'cmpZoom'))));

    const [a, b] = pair.map(id => g.things.find(x => x.id === id)!);
    const name = (x: Thing) => tr(x.name, lang());
    const m = t('cmpM_' + g.id);
    const r = ratio(a.size, b.size);
    ratioP.textContent = r.times < 1.05 ? t('cmpSame', { m }) : t('cmpRatio', { m, a: name(r.big ? b : a), b: name(r.big ? a : b), n: fmtNum(r.times) });
    const d = drawn(a.size, b.size, bars() ? 440 : MAX, scale);
    const small = r.big ? a : b;
    const tiny = d.tiny[0] ? a : d.tiny[1] ? b : null;
    note.className = 'cmp-note' + (scale === 'zoom' ? ' warn' : '');
    note.textContent = scale === 'zoom' && a.size !== b.size ? t('cmpZoomNote', { name: name(small), n: fmtNum(r.times) })
      : tiny ? t('cmpTrueNote') + (lang() === 'zh' ? '' : ' ') + t('cmpTiny', { name: name(tiny) }) : t('cmpTrueNote');
    stage.setAttribute('aria-label', `${ratioP.textContent} ${note.textContent}`);
    stage.setAttribute('data-scale', scale);

    const kids: SVGElement[] = bars() ? [] : [s('line', { x1: 10, x2: W - 10, y1: BASE, y2: BASE, class: 'cmp-ground' })];
    const label = (x: number, y: number, th: Thing, i: number, anchor = 'middle') =>
      kids.push(s('text', { x, y, 'text-anchor': anchor, class: 'cmp-lbl', fill: COL[i] }, `${th.emoji} ${name(th)} · ${fmt(th)}`));
    [a, b].forEach((th, i) => {
      const px = Math.max(d.px[i], 2);
      const dashed: Record<string, string> = scale === 'zoom' && th === small && a.size !== b.size ? { 'stroke-dasharray': '6 4' } : {};
      if (g.id === 'bodies') {
        const cx = W * (i ? 0.73 : 0.27);
        kids.push(s('circle', { cx, cy: BASE - px / 2, r: px / 2, fill: COL[i], 'fill-opacity': 0.85, stroke: COL[i], 'stroke-width': 2, ...dashed }));
        label(cx, Math.min(BASE - px - 8, BASE - 12), th, i);
      } else if (g.id === 'tall') {
        const x = W * (i ? 0.62 : 0.3), w = 54;
        kids.push(s('rect', { x, y: BASE - px, width: w, height: px, rx: 3, fill: COL[i], 'fill-opacity': 0.85, stroke: COL[i], 'stroke-width': 2, ...dashed }));
        label(x + w / 2, Math.max(BASE - px - 8, 14), th, i);
      } else {
        const y = i ? 150 : 70;
        kids.push(s('rect', { x: 40, y, width: px, height: 30, rx: 6, fill: COL[i], 'fill-opacity': 0.85, stroke: COL[i], 'stroke-width': 2, ...dashed }));
        label(40, y - 10, th, i, 'start');
      }
      if (scale === 'zoom' && th === small && a.size !== b.size) {
        const [x, y] = g.id === 'bodies' ? [W * (i ? 0.73 : 0.27), BASE - px / 2 + 6] : g.id === 'tall' ? [W * (i ? 0.62 : 0.3) + 27, BASE - px / 2] : [40 + px / 2, (i ? 150 : 70) + 20];
        kids.push(s('text', { x, y, 'text-anchor': 'middle', class: 'cmp-x' }, '×' + fmtNum(r.times)));
      }
    });
    if (scale === 'zoom') kids.push(s('text', { x: W - 12, y: H - 6, 'text-anchor': 'end', class: 'cmp-badge' }, t('cmpZoom')));
    stage.replaceChildren(...kids);
  };
  render();
  openModal('compare', t('compare'), h('div', { class: 'cmp', 'data-testid': 'compare' },
    h('p', { class: 'muted' }, t('cmpIntro')), tabs, pickers, scales, stage, ratioP, note,
    h('p', { class: 'muted small cmp-src' }, h('span', { html: icon('ruler', 13) }), h('span', {}, t('cmpSource')))), { wide: true });
}
