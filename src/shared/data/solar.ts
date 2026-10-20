/**
 * Solar-system bodies: physical data, orbits and look hints. Surface features live in `solar-features.ts`,
 * descriptive text in `solar-text.ts`. Longitudes everywhere are planetocentric, east-positive, in -180..180,
 * with the same texture convention as Earth (lon 0 at the texture centre, lat +90 at the top row).
 */
import type { I18n } from './types.ts';

export type BodyId =
  | 'sun' | 'mercury' | 'venus' | 'earth' | 'moon' | 'mars' | 'ceres'
  | 'jupiter' | 'io' | 'europa' | 'ganymede' | 'callisto'
  | 'saturn' | 'enceladus' | 'titan' | 'uranus' | 'neptune' | 'triton' | 'pluto' | 'charon';

export type BodyKind = 'star' | 'planet' | 'dwarf' | 'moon';

/** JPL "Approximate Positions of the Planets" elements (J2000 ecliptic, 1800–2050) with per-century rates. */
export interface Kepler {
  a: [number, number]; e: [number, number]; i: [number, number];
  L: [number, number]; peri: [number, number]; node: [number, number];
}

/** Moons: circular orbit in the parent's equatorial plane. */
export interface MoonOrbit { aKm: number; periodD: number; L0: number }

export interface SolarBody {
  id: BodyId;
  kind: BodyKind;
  name: I18n;
  emoji: string;
  wiki: string;
  parent?: BodyId;
  radiusKm: number;
  /** Sidereal rotation period in hours; negative = retrograde. */
  rotationH: number;
  /**
   * Angle of the IAU north pole from ecliptic north (deg), from the IAU pole RA/Dec. Planets use the pole on the north
   * side of the invariable plane (so Venus and Uranus spin retrograde about it); dwarf planets use the right-hand pole.
   * Moons other than ours orbit and spin about their planet's pole, so theirs is ignored.
   */
  tilt: number;
  /** Ecliptic longitude the north pole leans toward (deg); Earth's leans toward 90° (June solstice). */
  poleLon?: number;
  /** Keeps the same face (lon 0) toward its parent (Pluto: toward Charon). */
  locked?: boolean;
  kepler?: Kepler;
  moon?: MoonOrbit;
  /** Ring radii in body radii. */
  rings?: [inner: number, outer: number];
  /** Rim/atmosphere glow colour, if any. */
  glow?: string;
  /** Has solid relief worth bump-mapping. */
  solid: boolean;
  /** Facts shown on the card. */
  facts: { gravity?: number; tempC?: [number, number]; moons?: number; yearD?: number; dayH?: number };
}

const K = (a: [number, number], e: [number, number], i: [number, number], L: [number, number], peri: [number, number], node: [number, number]): Kepler =>
  ({ a, e, i, L, peri, node });

export const BODIES: SolarBody[] = [
  { id: 'sun', kind: 'star', name: { en: 'Sun', zh: '太阳' }, emoji: '☀️', wiki: 'Sun', radiusKm: 695700, rotationH: 609.12, tilt: 7.25, poleLon: 345.8,
    solid: false, glow: '#ffb347', facts: { gravity: 27.9, tempC: [5500, 5500], moons: 0 } },
  { id: 'mercury', kind: 'planet', name: { en: 'Mercury', zh: '水星' }, emoji: '🪨', wiki: 'Mercury (planet)', radiusKm: 2439.7, rotationH: 1407.6, tilt: 7.04, poleLon: 318.2,
    kepler: K([0.38709927, 0.00000037], [0.20563593, 0.00001906], [7.00497902, -0.00594749], [252.2503235, 149472.67411175], [77.45779628, 0.16047689], [48.33076593, -0.12534081]),
    solid: true, facts: { gravity: 0.38, tempC: [-173, 427], moons: 0, yearD: 88, dayH: 4222.6 } },
  { id: 'venus', kind: 'planet', name: { en: 'Venus', zh: '金星' }, emoji: '🌕', wiki: 'Venus', radiusKm: 6051.8, rotationH: -5832.5, tilt: 1.24, poleLon: 30.2,
    kepler: K([0.72333566, 0.0000039], [0.00677672, -0.00004107], [3.39467605, -0.0007889], [181.9790995, 58517.81538729], [131.60246718, 0.00268329], [76.67984255, -0.27769418]),
    solid: false, glow: '#f5d9a0', facts: { gravity: 0.91, tempC: [464, 464], moons: 0, yearD: 224.7, dayH: 2802 } },
  { id: 'earth', kind: 'planet', name: { en: 'Earth', zh: '地球' }, emoji: '🌍', wiki: 'Earth', radiusKm: 6371, rotationH: 23.9345, tilt: 23.44, poleLon: 90,
    kepler: K([1.00000261, 0.00000562], [0.01671123, -0.00004392], [-0.00001531, -0.01294668], [100.46457166, 35999.37244981], [102.93768193, 0.32327364], [0, 0]),
    solid: true, glow: '#6cb8ff', facts: { gravity: 1, tempC: [-89, 57], moons: 1, yearD: 365.25, dayH: 24 } },
  { id: 'moon', kind: 'moon', parent: 'earth', name: { en: 'Moon', zh: '月球' }, emoji: '🌙', wiki: 'Moon', radiusKm: 1737.4, rotationH: 655.72, tilt: 1.54, poleLon: 214.5,
    locked: true, moon: { aKm: 384400, periodD: 27.3217, L0: 218.316 }, solid: true, facts: { gravity: 0.17, tempC: [-173, 127], dayH: 708.7 } },
  { id: 'mars', kind: 'planet', name: { en: 'Mars', zh: '火星' }, emoji: '🔴', wiki: 'Mars', radiusKm: 3389.5, rotationH: 24.6229, tilt: 25.4, poleLon: 354.8,
    kepler: K([1.52371034, 0.00001847], [0.0933941, 0.00007882], [1.84969142, -0.00813131], [-4.55343205, 19140.30268499], [-23.94362959, 0.44441088], [49.55953891, -0.29257343]),
    solid: true, glow: '#e8a27a', facts: { gravity: 0.38, tempC: [-125, 20], moons: 2, yearD: 687, dayH: 24.66 } },
  { id: 'ceres', kind: 'dwarf', name: { en: 'Ceres', zh: '谷神星' }, emoji: '🪨', wiki: 'Ceres (dwarf planet)', radiusKm: 469.7, rotationH: 9.074, tilt: 8.45, poleLon: 11.2,
    kepler: K([2.7675, 0], [0.0785, 0], [10.59, 0], [153.5, 7826.8], [153.9, 0], [80.3, 0]),
    solid: true, facts: { gravity: 0.03, tempC: [-143, -38], moons: 0, yearD: 1680, dayH: 9.07 } },
  { id: 'jupiter', kind: 'planet', name: { en: 'Jupiter', zh: '木星' }, emoji: '🟠', wiki: 'Jupiter', radiusKm: 69911, rotationH: 9.925, tilt: 2.22, poleLon: 247.8,
    kepler: K([5.202887, -0.00011607], [0.04838624, -0.00013253], [1.30439695, -0.00183714], [34.39644051, 3034.74612775], [14.72847983, 0.21252668], [100.47390909, 0.20469106]),
    solid: false, glow: '#e9c79a', facts: { gravity: 2.53, tempC: [-145, -145], moons: 97, yearD: 4333, dayH: 9.93 } },
  { id: 'io', kind: 'moon', parent: 'jupiter', name: { en: 'Io', zh: '木卫一' }, emoji: '🌋', wiki: 'Io (moon)', radiusKm: 1821.6, rotationH: 42.46, tilt: 0,
    locked: true, moon: { aKm: 421700, periodD: 1.769, L0: 200 }, solid: true, facts: { gravity: 0.18, tempC: [-163, 1600] } },
  { id: 'europa', kind: 'moon', parent: 'jupiter', name: { en: 'Europa', zh: '木卫二' }, emoji: '🧊', wiki: 'Europa (moon)', radiusKm: 1560.8, rotationH: 85.23, tilt: 0.1,
    locked: true, moon: { aKm: 671034, periodD: 3.551, L0: 70 }, solid: true, facts: { gravity: 0.13, tempC: [-220, -160] } },
  { id: 'ganymede', kind: 'moon', parent: 'jupiter', name: { en: 'Ganymede', zh: '木卫三' }, emoji: '🪐', wiki: 'Ganymede (moon)', radiusKm: 2634.1, rotationH: 171.7, tilt: 0.3,
    locked: true, moon: { aKm: 1070412, periodD: 7.155, L0: 320 }, solid: true, facts: { gravity: 0.15, tempC: [-203, -121] } },
  { id: 'callisto', kind: 'moon', parent: 'jupiter', name: { en: 'Callisto', zh: '木卫四' }, emoji: '🌑', wiki: 'Callisto (moon)', radiusKm: 2410.3, rotationH: 400.5, tilt: 0,
    locked: true, moon: { aKm: 1882709, periodD: 16.689, L0: 150 }, solid: true, facts: { gravity: 0.13, tempC: [-193, -108] } },
  { id: 'saturn', kind: 'planet', name: { en: 'Saturn', zh: '土星' }, emoji: '🪐', wiki: 'Saturn', radiusKm: 58232, rotationH: 10.561, tilt: 28.05, poleLon: 79.5,
    kepler: K([9.53667594, -0.0012506], [0.05386179, -0.00050991], [2.48599187, 0.00193609], [49.95424423, 1222.49362201], [92.59887831, -0.41897216], [113.66242448, -0.28867794]),
    rings: [1.28, 2.35], solid: false, glow: '#f0dca8', facts: { gravity: 1.07, tempC: [-178, -178], moons: 274, yearD: 10759, dayH: 10.56 } },
  { id: 'enceladus', kind: 'moon', parent: 'saturn', name: { en: 'Enceladus', zh: '土卫二' }, emoji: '❄️', wiki: 'Enceladus', radiusKm: 252.1, rotationH: 32.9, tilt: 0,
    locked: true, moon: { aKm: 237948, periodD: 1.37, L0: 30 }, solid: true, facts: { gravity: 0.01, tempC: [-240, -128] } },
  { id: 'titan', kind: 'moon', parent: 'saturn', name: { en: 'Titan', zh: '土卫六' }, emoji: '🟡', wiki: 'Titan (moon)', radiusKm: 2574.7, rotationH: 382.7, tilt: 0.3,
    locked: true, moon: { aKm: 1221870, periodD: 15.945, L0: 260 }, solid: true, glow: '#e8b25a', facts: { gravity: 0.14, tempC: [-179, -179] } },
  { id: 'uranus', kind: 'planet', name: { en: 'Uranus', zh: '天王星' }, emoji: '🔵', wiki: 'Uranus', radiusKm: 25362, rotationH: -17.24, tilt: 82.28, poleLon: 257.6,
    kepler: K([19.18916464, -0.00196176], [0.04725744, -0.00004397], [0.77263783, -0.00242939], [313.23810451, 428.48202785], [170.9542763, 0.40805281], [74.01692503, 0.04240589]),
    rings: [1.65, 2.02], solid: false, glow: '#a6e3ea', facts: { gravity: 0.89, tempC: [-224, -224], moons: 29, yearD: 30687, dayH: 17.24 } },
  { id: 'neptune', kind: 'planet', name: { en: 'Neptune', zh: '海王星' }, emoji: '🔵', wiki: 'Neptune', radiusKm: 24622, rotationH: 16.11, tilt: 28.03, poleLon: 319.2,
    kepler: K([30.06992276, 0.00026291], [0.00859048, 0.00005105], [1.77004347, 0.00035372], [-55.12002969, 218.45945325], [44.96476227, -0.32241464], [131.78422574, -0.00508664]),
    solid: false, glow: '#6f8cff', facts: { gravity: 1.14, tempC: [-214, -214], moons: 16, yearD: 60190, dayH: 16.11 } },
  { id: 'triton', kind: 'moon', parent: 'neptune', name: { en: 'Triton', zh: '海卫一' }, emoji: '🧊', wiki: 'Triton (moon)', radiusKm: 1353.4, rotationH: -141.04, tilt: 0,
    locked: true, moon: { aKm: 354759, periodD: -5.877, L0: 90 }, solid: true, facts: { gravity: 0.08, tempC: [-235, -235] } },
  { id: 'pluto', kind: 'dwarf', name: { en: 'Pluto', zh: '冥王星' }, emoji: '🤍', wiki: 'Pluto', radiusKm: 1188.3, rotationH: 153.29, tilt: 112.82, poleLon: 137.4, locked: true,
    kepler: K([39.48211675, -0.00031596], [0.2488273, 0.0000517], [17.14001206, 0.00004818], [238.92903833, 145.20780515], [224.06891629, -0.04062942], [110.30393684, -0.01183482]),
    solid: true, glow: '#c9d6ff', facts: { gravity: 0.06, tempC: [-240, -218], moons: 5, yearD: 90560, dayH: 153.3 } },
  { id: 'charon', kind: 'moon', parent: 'pluto', name: { en: 'Charon', zh: '冥卫一' }, emoji: '🌑', wiki: 'Charon (moon)', radiusKm: 606, rotationH: 153.29, tilt: 0,
    locked: true, moon: { aKm: 19591, periodD: 6.387, L0: 0 }, solid: true, facts: { gravity: 0.03, tempC: [-220, -220] } },
];

export const BODY: Record<BodyId, SolarBody> = Object.fromEntries(BODIES.map(b => [b.id, b])) as Record<BodyId, SolarBody>;

export type FeatureKind =
  | 'crater' | 'basin' | 'mare' | 'mountain' | 'volcano' | 'canyon' | 'plain' | 'cap' | 'storm' | 'landing'
  | 'rift' | 'lake' | 'region' | 'geyser' | 'ridge' | 'cliff' | 'spot' | 'ring';

export interface SolarFeature {
  key: string;
  body: BodyId;
  kind: FeatureKind;
  name: I18n;
  emoji: string;
  lat: number;
  lon: number;
  /** Rough diameter / length, for label priority and zoom. */
  sizeKm?: number;
  desc: I18n;
  funFact?: I18n;
  wiki: string;
}
