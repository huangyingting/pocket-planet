/** The major annual meteor showers (International Meteor Organization calendar). Solar longitudes are J2000.0. */
export interface MeteorShower {
  key: string;
  name: { en: string; zh: string };
  /** Solar longitude (J2000) of the peak, degrees. */
  solarLon: number;
  /** Zenithal hourly rate at the peak. */
  zhr: number;
  /** Radiant (deg). */
  ra: number;
  dec: number;
  /** Atmospheric entry speed (km/s). */
  speedKms: number;
  /** The comet or asteroid whose debris makes the shower. */
  parent: { en: string; zh: string };
  /** Activity window, e.g. 'Jul 17'. */
  activeFrom: string;
  activeTo: string;
  /** IAU three-letter abbreviation of the radiant's constellation. */
  constellation: string;
  /** English Wikipedia title. */
  wiki: string;
}

export const SHOWERS: MeteorShower[] = [
  {
    key: 'quadrantids', name: { en: 'Quadrantids', zh: '象限仪座流星雨' }, solarLon: 283.15, zhr: 110, ra: 230, dec: 49, speedKms: 41,
    parent: { en: 'asteroid 2003 EH1', zh: '小行星2003 EH1' }, activeFrom: 'Dec 28', activeTo: 'Jan 12', constellation: 'Boo', wiki: 'Quadrantids',
  },
  {
    key: 'lyrids', name: { en: 'Lyrids', zh: '天琴座流星雨' }, solarLon: 32.32, zhr: 18, ra: 271, dec: 34, speedKms: 49,
    parent: { en: 'Comet C/1861 G1 (Thatcher)', zh: '撒切尔彗星（C/1861 G1）' }, activeFrom: 'Apr 14', activeTo: 'Apr 30', constellation: 'Lyr', wiki: 'Lyrids',
  },
  {
    key: 'eta-aquariids', name: { en: 'Eta Aquariids', zh: '宝瓶座η流星雨' }, solarLon: 45.5, zhr: 50, ra: 338, dec: -1, speedKms: 66,
    parent: { en: 'Comet 1P/Halley', zh: '哈雷彗星' }, activeFrom: 'Apr 19', activeTo: 'May 28', constellation: 'Aqr', wiki: 'Eta Aquariids',
  },
  {
    key: 'southern-delta-aquariids', name: { en: 'Southern Delta Aquariids', zh: '南宝瓶座δ流星雨' }, solarLon: 125, zhr: 25, ra: 340, dec: -16, speedKms: 41,
    parent: { en: 'Comet 96P/Machholz', zh: '马克霍尔兹彗星（96P）' }, activeFrom: 'Jul 12', activeTo: 'Aug 23', constellation: 'Aqr', wiki: 'Southern Delta Aquariids',
  },
  {
    key: 'perseids', name: { en: 'Perseids', zh: '英仙座流星雨' }, solarLon: 140.0, zhr: 100, ra: 48, dec: 58, speedKms: 59,
    parent: { en: 'Comet 109P/Swift–Tuttle', zh: '斯威夫特-塔特尔彗星' }, activeFrom: 'Jul 17', activeTo: 'Aug 24', constellation: 'Per', wiki: 'Perseids',
  },
  {
    key: 'draconids', name: { en: 'Draconids', zh: '天龙座流星雨' }, solarLon: 195.4, zhr: 10, ra: 262, dec: 54, speedKms: 20,
    parent: { en: 'Comet 21P/Giacobini–Zinner', zh: '贾科比尼-津纳彗星' }, activeFrom: 'Oct 6', activeTo: 'Oct 10', constellation: 'Dra', wiki: 'Draconids',
  },
  {
    key: 'orionids', name: { en: 'Orionids', zh: '猎户座流星雨' }, solarLon: 208, zhr: 20, ra: 95, dec: 16, speedKms: 66,
    parent: { en: 'Comet 1P/Halley', zh: '哈雷彗星' }, activeFrom: 'Oct 2', activeTo: 'Nov 7', constellation: 'Ori', wiki: 'Orionids',
  },
  {
    key: 'leonids', name: { en: 'Leonids', zh: '狮子座流星雨' }, solarLon: 235.27, zhr: 15, ra: 152, dec: 22, speedKms: 71,
    parent: { en: 'Comet 55P/Tempel–Tuttle', zh: '坦普尔-塔特尔彗星' }, activeFrom: 'Nov 6', activeTo: 'Nov 30', constellation: 'Leo', wiki: 'Leonids',
  },
  {
    key: 'geminids', name: { en: 'Geminids', zh: '双子座流星雨' }, solarLon: 262.2, zhr: 150, ra: 112, dec: 33, speedKms: 35,
    parent: { en: 'asteroid 3200 Phaethon', zh: '法厄同小行星' }, activeFrom: 'Dec 4', activeTo: 'Dec 20', constellation: 'Gem', wiki: 'Geminids',
  },
  {
    key: 'ursids', name: { en: 'Ursids', zh: '小熊座流星雨' }, solarLon: 270.7, zhr: 10, ra: 217, dec: 76, speedKms: 33,
    parent: { en: 'Comet 8P/Tuttle', zh: '塔特尔彗星' }, activeFrom: 'Dec 17', activeTo: 'Dec 26', constellation: 'UMi', wiki: 'Ursids',
  },
];
