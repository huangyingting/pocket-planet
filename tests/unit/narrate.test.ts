import { describe, it, expect } from 'vitest';
import { splitSentences } from '../../src/client/lib/narrate.ts';

describe('narration sentences', () => {
  it('splits English and Chinese at sentence ends, not inside numbers', () => {
    expect(splitSentences('It is 3.5 m tall. Wow! Really?')).toEqual(['It is 3.5 m tall.', 'Wow!', 'Really?']);
    expect(splitSentences('高 828 米。是世界最高的楼！你知道吗？')).toEqual(['高 828 米。', '是世界最高的楼！', '你知道吗？']);
    expect(splitSentences('No full stop')).toEqual(['No full stop']);
  });
});
