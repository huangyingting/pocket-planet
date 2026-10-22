/**
 * Geography class: the lesson picker, the step card (with the lesson clock) and the quiz. The drawing is done by
 * `LessonStage`; this file only sequences steps and talks to the user. Like a tour, the card is not modal: the globe
 * stays live, so the user can turn it, zoom in and open the models while a lesson runs.
 */
import { h, openModal, closeModal, confetti, toast } from '../ui/dom.ts';
import { Select } from '../ui/select.ts';
import { icon } from '../ui/icons.ts';
import { t, lang, onLang } from '../lib/i18n.ts';
import { load, save } from '../lib/storage.ts';
import { classroomLink } from '../lib/classroom.ts';
import { haversineKm } from '../../shared/lib/geo.ts';
import { skyEvents } from '../../shared/lib/astro/events.ts';
import type { Globe } from '../globe/scene.ts';
import { LessonStage } from './stage.ts';
import { VIEWS, course, lessonById, nextLesson, type Lesson, type Quiz, type View } from './data.ts';
import { renderFig, type Fig } from './figs.ts';
import type { LL, Pair } from './kit.ts';

const L = (p: Pair) => (lang() === 'zh' ? p[1] : p[0]);
const DAY = 864e5;

export interface LessonHost {
  globe: Globe;
  low: boolean;
  /** Leave the Solar System / sky theatre / an open item card, then run `then` on the globe. */
  toEarth(then: () => void): void;
  /** Open the sky theatre's model view on an event. */
  sky(id: string | undefined): void;
  /** A game is running: lessons wait. */
  blocked(): boolean;
}

const done = () => new Set(load<string[]>('lessonsDone', []));
/** The curriculum picked in the lesson list; Chinese readers start with the Chinese textbook. */
const view = (): View => { const v = load<string>('lessonTrack', ''); return v in VIEWS ? v as View : lang() === 'zh' ? 'cn' : 'all'; };
const figure = (f: Fig | undefined) => f ? h('figure', { class: 'lesson-fig', 'data-testid': 'lesson-fig', html: renderFig(f, L) }) : '';

let active: { stop: () => void } | null = null;
export const lessoning = () => active !== null;
export function stopLesson(): void { active?.stop(); }

export function startLesson(id: string, host: LessonHost): void {
  const lesson = lessonById(id);
  if (!lesson || host.blocked()) return;
  stopLesson();
  document.querySelector('.tutorial')?.remove();
  host.toEarth(() => run(lesson, host));
}

function run(lesson: Lesson, host: LessonHost): void {
  stopLesson();
  const g = host.globe;
  const stage = new LessonStage(g, { low: host.low, lang, frame: () => freeArea(card) });
  // for the end-to-end tests: what the stage drew
  (window as { __lesson?: LessonStage | null }).__lesson = stage;
  const steps = lesson.steps, quiz = lesson.quiz;
  /** 0 … steps-1 are steps; steps … steps+quiz-1 are questions; steps+quiz is the score card. */
  let i = 0;
  const answers: (boolean | null)[] = quiz.map(() => null);
  /** The last answer to the current question: the option picked, or the tap and its distance. */
  let picked: number | null = null;
  let tap: { ll: LL; km: number } | null = null;

  const card = h('section', { class: 'tour-card lesson-card', 'data-occludes': true, 'data-testid': 'lesson', 'aria-labelledby': 'lesson-title' });
  const root = h('div', { class: 'tour lesson' }, card);

  const clockRow = () => {
    const c = stage.clock;
    if (!c) return '';
    const read = h('span', { class: 'lesson-time', 'data-testid': 'lesson-time' }, stage.clockText());
    if (!c.rate) return h('div', { class: 'lesson-clock' }, h('span', { class: 'lesson-ico', html: icon('calendar', 14) }), read);
    const btn = h('button', { class: 'icon-btn', 'data-testid': 'lesson-play', 'aria-label': t(stage.playing ? 'lessonPause' : 'lessonPlay'), html: icon(stage.playing ? 'pause' : 'play', 16) });
    const range = h('input', { type: 'range', min: '0', max: '1000', value: String(Math.round(stage.frac * 1000)), 'aria-label': t('lessonClock'), 'data-testid': 'lesson-range' }) as HTMLInputElement;
    btn.onclick = () => {
      stage.playing = !stage.playing;
      btn.innerHTML = icon(stage.playing ? 'pause' : 'play', 16);
      btn.setAttribute('aria-label', t(stage.playing ? 'lessonPause' : 'lessonPlay'));
      g.markDirty();
    };
    range.oninput = () => { stage.playing = false; btn.innerHTML = icon('play', 16); stage.seek(+range.value / 1000); };
    stage.onClock = () => {
      read.textContent = stage.clockText();
      if (document.activeElement !== range) range.value = String(Math.round(stage.frac * 1000));
    };
    return h('div', { class: 'lesson-clock' }, btn, range, read);
  };

  const head = (sub: string) => h('header', { class: 'tour-head' },
    h('span', { class: 'tour-kicker', html: icon(lesson.icon, 14) }, h('span', {}, `${L(lesson.title)} · ${sub}`)),
    h('button', { class: 'icon-btn tour-x', 'aria-label': t('lessonExit'), 'data-testid': 'lesson-exit', html: icon('close', 16), onclick: () => stop() }));

  const nav = (back: (() => void) | null, next: () => void, label: string, nextOff = false) => h('div', { class: 'row' },
    h('button', { class: 'pill', 'data-testid': 'lesson-back', disabled: !back, onclick: () => back?.() }, t('tourBack')),
    h('button', { class: 'cta', 'data-testid': 'lesson-next', disabled: nextOff, onclick: next }, label));

  const renderStep = () => {
    const st = steps[i];
    stage.onClock = null;
    card.replaceChildren(
      head(t('tutStep', { i: i + 1, n: steps.length })),
      h('h2', { id: 'lesson-title' }, L(st.title)),
      st.sketch ? h('p', { class: 'tour-track tour-sketch', 'data-testid': 'lesson-sketch', html: icon('sparkle', 14) }, h('span', {}, t('lessonSketch'))) : '',
      h('p', { class: 'tour-body', 'aria-live': 'polite' }, L(st.body)),
      figure(st.fig),
      clockRow(),
      st.sky ? h('button', { class: 'pill pill-sm lesson-sky', 'data-testid': 'lesson-sky', html: icon('telescope', 14), onclick: () => host.sky(nextSolstice()) }, h('span', {}, t('lessonSky'))) : '',
      h('div', { class: 'dots', 'aria-hidden': 'true' }, ...steps.map((_, j) => h('span', { class: j === i ? 'on' : '' }))),
      nav(i > 0 ? () => go(i - 1) : null, () => go(i + 1), i === steps.length - 1 ? t('lessonQuiz') : t('next')));
  };

  const renderQuiz = () => {
    const k = i - steps.length, q = quiz[k], ans = answers[k];
    stage.onClock = null;
    const why = ans === null ? '' : h('p', { class: 'lesson-why ' + (ans ? 'ok' : 'no'), 'aria-live': 'polite', 'data-testid': 'lesson-why' },
      h('strong', {}, t(ans ? 'lessonRight' : 'lessonWrong') + ' '), tap ? t('lessonKm', { km: Math.round(tap.km).toLocaleString() }) + ' ' : '', L(q.why));
    const body = q.options
      ? h('div', { class: 'lesson-opts' }, ...order(q, k).map(j => h('button', {
        class: 'pill lesson-opt' + (ans !== null && j === q.answer ? ' right' : '') + (ans !== null && j === picked && j !== q.answer ? ' wrong' : ''),
        'data-testid': 'lesson-opt', 'data-right': String(j === q.answer), disabled: ans !== null,
        onclick: () => { picked = j; answers[k] = j === q.answer; renderQuiz(); },
      }, L(q.options![j]))))
      : h('p', { class: 'lesson-tap', html: icon('pin', 14) }, h('span', {}, ans === null ? t('lessonTap') : ''));
    card.replaceChildren(
      head(t('lessonQuiz')),
      h('p', { class: 'tour-when' }, t('lessonQ', { i: k + 1, n: quiz.length })),
      h('h2', { id: 'lesson-title' }, L(q.q)),
      figure(q.fig),
      body, why,
      nav(() => go(i - 1), () => go(i + 1), k === quiz.length - 1 ? t('tourFinish') : t('next'), ans === null));
  };

  const renderScore = () => {
    const s = answers.filter(Boolean).length;
    const v = view(), nx = nextLesson(lesson.id, v) ?? (v === 'all' ? undefined : nextLesson(lesson.id, 'all'));
    card.replaceChildren(
      head(t('lessonQuiz')),
      h('h2', { id: 'lesson-title', 'data-testid': 'lesson-score' }, t('lessonScore', { s, n: quiz.length })),
      h('p', { class: 'lesson-keys-h' }, t('lessonKeys')),
      h('ul', { class: 'lesson-keys', 'data-testid': 'lesson-keys' }, ...lesson.keys.map(k => h('li', {}, L(k)))),
      h('div', { class: 'row' },
        h('button', { class: 'pill', 'data-testid': 'lesson-more', onclick: () => { stop(); openLessons(host); } }, t('lessonMore')),
        h('button', { class: 'pill', 'data-testid': 'lesson-again', onclick: () => { answers.fill(null); go(0); } }, t('lessonAgain')),
        nx ? h('button', { class: 'cta', 'data-testid': 'lesson-nextlesson', title: L(nx.title), onclick: () => { stop(); startLesson(nx.id, host); } }, t('lessonNextOne'))
          : h('button', { class: 'cta', 'data-testid': 'lesson-done', onclick: () => stop() }, t('tourFinish'))));
  };

  const render = () => (i < steps.length ? renderStep() : i < steps.length + quiz.length ? renderQuiz() : renderScore());

  /** Quiz scenes: a plain globe, the answer region in view for "find it" questions (but not centred). */
  const quizScene = (q: Quiz) => {
    if (!q.at) { stage.show({ cam: [g.lat, g.lon, Math.max(g.h, 3)] }); return; }
    stage.show({ cam: [Math.max(-60, Math.min(60, q.at[0] * 0.6)), q.at[1] + 32, 4.2] });
  };
  const listen = (k: number) => {
    const q = quiz[k];
    g.captureTaps = !!q.at && answers[k] === null;
    g.ev.onGlobeTap = g.captureTaps ? (lat, lon) => {
      if (answers[k] !== null || !q.at) return;
      const km = haversineKm(lat, lon, q.at[0], q.at[1]);
      tap = { ll: [lat, lon], km };
      answers[k] = km <= (q.tolKm ?? 500);
      g.captureTaps = false;
      g.ev.onGlobeTap = undefined;
      stage.show({
        cam: [q.at[0], q.at[1], 2.6],
        lines: km > 30 ? [{ pts: [[lat, lon], q.at], c: '#f1f3f5', dur: 1 }] : [],
        marks: [{ ll: [lat, lon], text: ['Your tap', '你点的位置'], dot: true, c: answers[k] ? '#51cf66' : '#ff6b6b' },
          { ll: q.at, text: ['Answer', '正确位置'], dot: true, big: true, c: '#ffd24a', t: 0.8 }],
      });
      renderQuiz();
    } : undefined;
  };

  const go = (k: number) => {
    if (k < 0 || k > steps.length + quiz.length) return;
    i = k;
    picked = null; tap = null;
    g.captureTaps = false; g.ev.onGlobeTap = undefined;
    if (i < steps.length) stage.show(steps[i]);
    else if (i < steps.length + quiz.length) {
      const q = quiz[i - steps.length];
      quizScene(q);
      listen(i - steps.length);
    } else finish();
    render();
    (card.querySelector('[data-testid="lesson-next"]:not([disabled]), .lesson-opt:not([disabled]), [data-testid="lesson-done"], [data-testid="lesson-nextlesson"]') as HTMLElement | null)?.focus({ preventScroll: true });
  };

  const finish = () => {
    stage.show({ cam: [g.lat, g.lon, Math.max(g.h, 3)] });
    save('lessonsDone', [...done().add(lesson.id)]);
    if (answers.filter(Boolean).length >= quiz.length - 1) confetti(40);
  };

  const stop = () => {
    offLang();
    g.captureTaps = false; g.ev.onGlobeTap = undefined;
    stage.dispose();
    (window as { __lesson?: LessonStage | null }).__lesson = null;
    root.remove();
    document.body.classList.remove('lessoning');
    if (active === self) active = null;
  };
  const offLang = onLang(() => { stage.relabel(); render(); });
  const self = { stop };
  active = self;
  document.body.append(root);
  document.body.classList.add('lessoning');
  go(0);
}

/** The biggest clear part of the screen beside the card (below the top bar, above the bottom controls). */
function freeArea(card: HTMLElement): { left: number; top: number; width: number; height: number } | null {
  const r = card.getBoundingClientRect();
  if (!r.width) return null;
  const W = innerWidth, top = 70, bottom = innerHeight - 56, gap = 12, side = 64;
  const cands = [
    { left: r.right + gap, top, width: W - side - r.right - gap, height: bottom - top },
    { left: side, top, width: r.left - gap - side, height: bottom - top },
    { left: 0, top, width: W, height: Math.min(bottom, r.top - gap) - top },
  ];
  return cands.reduce((b, c) => (c.width > 0 && c.height > 0 && c.width * c.height > b.width * b.height ? c : b), { left: 0, top: 0, width: 0, height: 0 });
}

/** Options in a stable shuffled order (the right answer is written first in the data). */
function order(q: Quiz, k: number): number[] {
  const n = q.options!.length, idx = [...Array(n).keys()];
  let seed = (q.q[0].length * 31 + k * 17) >>> 0;
  for (let j = n - 1; j > 0; j--) {
    seed = (seed * 1103515245 + 12345) >>> 0;
    const r = seed % (j + 1);
    [idx[j], idx[r]] = [idx[r], idx[j]];
  }
  return idx;
}

function nextSolstice(): string | undefined {
  const now = Date.now();
  return skyEvents(now, now + 400 * DAY, { kinds: ['solstice'] })[0]?.id;
}

/** The lesson picker: pick a curriculum, then its lessons in groups (textbook volumes, or themes). */
export function openLessons(host: LessonHost): void {
  const seen = done();
  const list = h('div', { class: 'tour-list lesson-list', 'data-testid': 'lesson-list' });
  const note = h('p', { class: 'muted small' });
  const fill = (v: View) => {
    note.textContent = L(VIEWS[v].note);
    const groups = course(v).map(gr => h('section', { class: 'lesson-group' },
      h('h3', { class: 'lesson-grade' }, h('span', {}, L(gr.name)), h('small', {}, `${gr.lessons.filter(x => seen.has(x.id)).length}/${gr.lessons.length}`)),
      ...gr.lessons.map(x => h('div', { class: 'tour-row' },
        h('button', { class: 'tour-pick', 'data-testid': 'lesson-' + x.id, onclick: () => { closeModal('lessons'); startLesson(x.id, host); } },
          h('span', { class: 'tile', html: icon(x.icon, 22) }),
          h('span', { class: 'grow' }, h('strong', {}, L(x.title)), h('span', { class: 'muted small' }, `${L(x.unit)} · ${L(x.blurb)}`)),
          h('span', { class: 'meta' }, (seen.has(x.id) ? '✓ ' : '') + t('minutesN', { n: x.minutes }))),
        h('button', { class: 'icon-btn tour-link', 'aria-label': t('classLink'), title: t('classLink'), html: icon('share', 16),
          onclick: () => void copyLink(classroomLink(x.id, 'lesson')) })))));
    list.replaceChildren(...groups);
  };
  const sel = new Select({ label: t('lessonTrack'), testid: 'lesson-track', icon: 'book', value: view(),
    options: (Object.keys(VIEWS) as View[]).map(v => ({ value: v, label: L(VIEWS[v].name) })),
    onChange: v => { save('lessonTrack', v); fill(v as View); } });
  fill(view());
  openModal('lessons', t('lessons'), h('div', { class: 'lesson-pickwrap' }, h('p', { class: 'muted' }, t('lessonsIntro')),
    h('div', { class: 'lesson-track' }, sel.el, note), list));
}

async function copyLink(link: string): Promise<void> {
  try { await navigator.clipboard.writeText(link); toast(t('classLinkCopied')); }
  catch { prompt(t('classLink'), link); }
}
