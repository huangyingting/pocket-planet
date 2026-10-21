/**
 * On-demand narration with the browser's own speech engine: nothing leaves the device. One utterance per sentence, so
 * the on-screen text can follow along (and Chrome does not cut long utterances short).
 */
export function narrationSupported(): boolean {
  return typeof speechSynthesis !== 'undefined' && typeof SpeechSynthesisUtterance !== 'undefined';
}

/** Sentences for reading and highlighting; keeps the end punctuation with each sentence. */
export function splitSentences(text: string): string[] {
  return (text.match(/(?:[^。！？!?.]|\.(?=\d))+(?:[。！？!?]+|\.+|$)\s*/g) ?? []).map(s => s.trim()).filter(Boolean);
}

export interface Narration { stop(): void }
let current: { stop(): void } | null = null;

export function stopNarration(): void { current?.stop(); }

export function narrate(sentences: string[], lang: 'en' | 'zh', on: { sentence: (i: number) => void; end: (finished: boolean) => void }): Narration | null {
  if (!narrationSupported() || !sentences.length) return null;
  stopNarration();
  const code = lang === 'zh' ? 'zh-CN' : 'en-US';
  const voices = speechSynthesis.getVoices();
  const voice = voices.find(v => v.lang.replace('_', '-').toLowerCase() === code.toLowerCase()) ?? voices.find(v => v.lang.toLowerCase().startsWith(lang));
  let live = true;
  const finish = (finished: boolean) => { if (!live) return; live = false; if (current === me) current = null; on.end(finished); };
  const me: Narration = { stop: () => { if (!live) return; finish(false); speechSynthesis.cancel(); } };
  speechSynthesis.cancel();
  sentences.forEach((s, i) => {
    const u = new SpeechSynthesisUtterance(s);
    u.lang = code; u.rate = lang === 'zh' ? 0.95 : 0.92;
    if (voice) u.voice = voice;
    u.onstart = () => { if (live) on.sentence(i); };
    u.onend = () => { if (i === sentences.length - 1) finish(true); };
    u.onerror = () => finish(false);
    speechSynthesis.speak(u);
  });
  current = me;
  return me;
}
