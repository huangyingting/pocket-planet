import { fmtNum } from '../lib/i18n.ts';
import type { Lang } from '../../shared/data/types.ts';

/** "4.2 light-years" / "250 万光年" / "13.8 billion light-years". */
export function fmtLy(ly: number, l: Lang): string {
  const n = (v: number, d: number) => fmtNum(+v.toFixed(d), l);
  if (l === 'zh') {
    if (ly < 1e4) return `${n(ly, ly < 10 ? 1 : 0)} 光年`;
    if (ly < 1e8) return `${n(ly / 1e4, ly < 1e5 ? 1 : 0)} 万光年`;
    return `${n(ly / 1e8, ly < 1e9 ? 1 : 0)} 亿光年`;
  }
  if (ly < 1e6) return `${n(ly, ly < 10 ? 1 : 0)} light-years`;
  if (ly < 1e9) return `${n(ly / 1e6, ly < 1e7 ? 1 : 0)} million light-years`;
  return `${n(ly / 1e9, 1)} billion light-years`;
}
