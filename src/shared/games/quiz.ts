import type { CatalogueItem, I18n, Lang } from '../data/types.ts';
import { tr } from '../data/types.ts';
import { shuffle, pick } from '../lib/rng.ts';
import { CITIES } from '../data/cities.ts';

export type QuizSet = 'mixed' | 'animals' | 'geo' | 'landmarks' | 'secrets';
export type QuizLevel = 'easy' | 'normal' | 'hard';
export const LEVEL_OPTIONS: Record<QuizLevel, number> = { easy: 2, normal: 3, hard: 5 };
export const QUIZ_SETS: QuizSet[] = ['mixed', 'animals', 'geo', 'landmarks', 'secrets'];

export interface Question {
  id: string;
  set: Exclude<QuizSet, 'mixed'>;
  prompt: I18n;
  options: string[];
  answer: number;
  focus?: { lat: number; lon: number };
}

interface Ctx { items: CatalogueItem[]; lang: Lang; rnd: () => number; nOpts: number; country: (a2: string) => string }

type Template = { id: string; set: Question['set']; make: (c: Ctx) => Question | null };

function build(id: string, set: Question['set'], prompt: I18n, correct: string, wrongPool: string[], c: Ctx, focus?: Question['focus']): Question | null {
  const wrong = shuffle([...new Set(wrongPool.filter(w => w && w !== correct))], c.rnd).slice(0, c.nOpts - 1);
  if (wrong.length < c.nOpts - 1) return null;
  const options = shuffle([correct, ...wrong], c.rnd);
  return { id, set, prompt, options, answer: options.indexOf(correct), focus };
}

const by = (c: Ctx, type: CatalogueItem['type']) => c.items.filter(i => i.type === type);
const nm = (c: Ctx, i: CatalogueItem) => tr(i.name, c.lang);

const TEMPLATES: Template[] = [
  { id: 'lm_country', set: 'landmarks', make: c => {
    const lms = by(c, 'landmark').filter(i => i.country); const it = pick(lms, c.rnd);
    return build('lm_country', 'landmarks', { en: `In which country is ${tr(it.name, 'en')}?`, ko: `${tr(it.name, 'ko')}은(는) 어느 나라에 있을까요?` },
      c.country(it.country!), lms.map(l => c.country(l.country!)), c, it);
  } },
  { id: 'lm_tallest', set: 'landmarks', make: c => {
    const lms = shuffle(by(c, 'landmark').filter(i => i.facts?.heightM && i.sub !== 'mountain' && i.sub !== 'volcano'), c.rnd).slice(0, c.nOpts);
    if (lms.length < c.nOpts) return null;
    const top = lms.reduce((a, b) => (a.facts!.heightM! >= b.facts!.heightM! ? a : b));
    return build('lm_tallest', 'landmarks', { en: 'Which of these is the tallest?', ko: '이 중에서 가장 높은 것은?' }, nm(c, top), lms.map(l => nm(c, l)), c);
  } },
  { id: 'lm_oldest', set: 'landmarks', make: c => {
    const lms = shuffle(by(c, 'landmark').filter(i => i.facts?.built !== undefined), c.rnd).slice(0, c.nOpts);
    if (lms.length < c.nOpts) return null;
    const old = lms.reduce((a, b) => (a.facts!.built! <= b.facts!.built! ? a : b));
    return build('lm_oldest', 'landmarks', { en: 'Which of these was built first?', ko: '이 중에서 가장 먼저 지어진 것은?' }, nm(c, old), lms.map(l => nm(c, l)), c);
  } },
  { id: 'an_diet', set: 'animals', make: c => {
    if (c.nOpts > 3) return null;
    const an = by(c, 'animal'); const it = pick(an, c.rnd); const diets = ['carnivore', 'herbivore', 'omnivore'];
    const label = (d: string) => ({ carnivore: { en: 'Meat-eater', ko: '육식' }, herbivore: { en: 'Plant-eater', ko: '초식' }, omnivore: { en: 'Eats everything', ko: '잡식' } } as Record<string, I18n>)[d];
    return build('an_diet', 'animals', { en: `What does the ${tr(it.name, 'en').toLowerCase()} eat?`, ko: `${tr(it.name, 'ko')}은(는) 무엇을 먹을까요?` },
      tr(label(it.diet!), c.lang), diets.map(d => tr(label(d), c.lang)), c, it);
  } },
  { id: 'an_endangered', set: 'animals', make: c => {
    const an = by(c, 'animal'); const risky = an.filter(a => a.status === 'EN' || a.status === 'CR'); const safe = an.filter(a => a.status === 'LC');
    const it = pick(risky, c.rnd);
    return build('an_endangered', 'animals', { en: 'Which animal is endangered?', ko: '멸종 위기에 처한 동물은?' }, nm(c, it), safe.map(a => nm(c, a)), c);
  } },
  { id: 'an_heaviest', set: 'animals', make: c => {
    const an = shuffle(by(c, 'animal').filter(a => a.facts?.weightKg), c.rnd).slice(0, c.nOpts);
    if (an.length < c.nOpts) return null;
    const top = an.reduce((a, b) => (a.facts!.weightKg! >= b.facts!.weightKg! ? a : b));
    return build('an_heaviest', 'animals', { en: 'Which animal is the heaviest?', ko: '가장 무거운 동물은?' }, nm(c, top), an.map(a => nm(c, a)), c);
  } },
  { id: 'an_where', set: 'animals', make: c => {
    const an = by(c, 'animal').filter(a => a.continent !== 'ocean' && a.continent !== 'antarctica'); const it = pick(an, c.rnd);
    const conts = ['africa', 'europe', 'asia', 'north-america', 'south-america', 'oceania'];
    const label = (k: string) => ({ africa: 'Africa', europe: 'Europe', asia: 'Asia', 'north-america': 'North America', 'south-america': 'South America', oceania: 'Oceania' } as Record<string, string>)[k];
    return build('an_where', 'animals', { en: `On which continent can you find the wild ${tr(it.name, 'en').toLowerCase()} on our globe?`, ko: `지구본에서 야생 ${tr(it.name, 'ko')}은(는) 어느 대륙에 있을까요?` },
      label(it.continent), conts.map(label), c, it);
  } },
  { id: 'geo_capital', set: 'geo', make: c => {
    const caps = CITIES.filter(x => x[5]); const it = pick(caps, c.rnd);
    return build('geo_capital', 'geo', { en: `What is the capital of ${c.country(it[1])}?`, ko: `${c.country(it[1])}의 수도는?` }, it[0], caps.map(x => x[0]), c, { lat: it[2], lon: it[3] });
  } },
  { id: 'geo_northmost', set: 'geo', make: c => {
    const cs = shuffle(CITIES, c.rnd).slice(0, c.nOpts); const top = cs.reduce((a, b) => (a[2] >= b[2] ? a : b));
    return build('geo_northmost', 'geo', { en: 'Which city is furthest north?', ko: '가장 북쪽에 있는 도시는?' }, top[0], cs.map(x => x[0]), c);
  } },
  { id: 'geo_southmost', set: 'geo', make: c => {
    const cs = shuffle(CITIES, c.rnd).slice(0, c.nOpts); const top = cs.reduce((a, b) => (a[2] <= b[2] ? a : b));
    return build('geo_southmost', 'geo', { en: 'Which city is furthest south?', ko: '가장 남쪽에 있는 도시는?' }, top[0], cs.map(x => x[0]), c);
  } },
  { id: 'geo_equator', set: 'geo', make: c => {
    const cs = shuffle(CITIES, c.rnd).slice(0, c.nOpts); const top = cs.reduce((a, b) => (Math.abs(a[2]) <= Math.abs(b[2]) ? a : b));
    return build('geo_equator', 'geo', { en: 'Which city is closest to the equator?', ko: '적도에 가장 가까운 도시는?' }, top[0], cs.map(x => x[0]), c);
  } },
  { id: 'sec_kind', set: 'secrets', make: c => {
    const ds = by(c, 'discovery'); const it = pick(ds, c.rnd);
    const kinds: Record<string, I18n> = { wreck: { en: 'A shipwreck', ko: '난파선' }, mystery: { en: 'A mystery', ko: '미스터리' }, cryptid: { en: 'A legendary creature', ko: '전설의 생물' }, deepsea: { en: 'A deep-sea place', ko: '심해' }, extreme: { en: 'An extreme place', ko: '극한의 장소' }, restricted: { en: 'A secret base', ko: '비밀 기지' } };
    if (!kinds[it.sub]) return null;
    return build('sec_kind', 'secrets', { en: `What is “${tr(it.name, 'en')}”?`, ko: `‘${tr(it.name, 'ko')}’은(는) 무엇일까요?` },
      tr(kinds[it.sub], c.lang), Object.values(kinds).map(k => tr(k, c.lang)), c, it);
  } },
  { id: 'sec_deepest', set: 'secrets', make: c => {
    const ds = shuffle(by(c, 'discovery').filter(d => d.facts?.depthM), c.rnd).slice(0, c.nOpts);
    if (ds.length < c.nOpts) return null;
    const top = ds.reduce((a, b) => (a.facts!.depthM! >= b.facts!.depthM! ? a : b));
    return build('sec_deepest', 'secrets', { en: 'Which of these lies deepest underwater?', ko: '가장 깊은 바닷속에 있는 것은?' }, nm(c, top), ds.map(d => nm(c, d)), c);
  } },
];

export function generateQuiz(items: CatalogueItem[], set: QuizSet, level: QuizLevel, n: number, lang: Lang,
  country: (a2: string) => string, rnd: () => number = Math.random): Question[] {
  const c: Ctx = { items, lang, rnd, nOpts: LEVEL_OPTIONS[level], country };
  const tpls = TEMPLATES.filter(t => set === 'mixed' || t.set === set);
  const out: Question[] = [];
  const seen = new Set<string>();
  for (let tries = 0; out.length < n && tries < n * 30; tries++) {
    const q = pick(tpls, rnd).make(c);
    if (!q) continue;
    const sig = q.prompt.en + '|' + q.options[q.answer];
    if (seen.has(sig)) continue;
    seen.add(sig);
    out.push(q);
  }
  return out;
}

export interface PlayerScore { name: string; score: number; streak: number; bestStreak: number }
export function applyAnswer(p: PlayerScore, correct: boolean): PlayerScore {
  const streak = correct ? p.streak + 1 : 0;
  return { ...p, score: p.score + (correct ? 1 : 0), streak, bestStreak: Math.max(p.bestStreak, streak) };
}
export function ranking(players: PlayerScore[]): PlayerScore[] {
  return players.slice().sort((a, b) => b.score - a.score || b.bestStreak - a.bestStreak);
}
