import { many } from '../make.ts';

// Original text written for Pocket Planet; every item carries English and Chinese side by side.
// Famous people: thinkers, scientists and inventors, placed where they were born or did their great work.
export const PEOPLE_A = many('person', [
  { key: 'pp_confucius', slug: 'confucius', name: ['Confucius', '孔子'], lat: 35.6, lon: 116.99, continent: 'asia', country: 'CN',
    tier: 1, emoji: '📜', sub: 'thinker', model: { kind: 'person', hero: 'people-a/pp_confucius' }, wiki: 'Confucius',
    facts: { born: -551, died: -479 },
    desc: ['A teacher from Qufu in ancient China who taught that people should be kind, honest, respect their families and never stop learning.',
      '中国古代曲阜的一位老师。他教导人们要仁爱、诚实、孝敬家人，并且要一辈子坚持学习。'],
    fun: ['His students wrote down his sayings in a book called the Analects, which is still read today, about 2,500 years later.', '他的学生把他说过的话记录成《论语》，大约2500年后的今天，人们仍然在读这本书。'] },
]);
