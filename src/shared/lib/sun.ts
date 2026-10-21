/**
 * Sub-solar point (where the Sun is straight overhead) from a UTC instant, with the equation of time.
 * NOAA's low-precision fit: about ±0.3° in latitude, good enough for a globe and for lessons on the seasons.
 */
export function subsolar(ms: number): [lat: number, lon: number] {
  const now = new Date(ms);
  const doy = (ms - Date.UTC(now.getUTCFullYear(), 0, 0)) / 864e5;
  const g = ((2 * Math.PI) / 365) * (doy - 1);
  const decl = 0.006918 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g) - 0.006758 * Math.cos(2 * g) + 0.000907 * Math.sin(2 * g)
    - 0.002697 * Math.cos(3 * g) + 0.00148 * Math.sin(3 * g);
  const eqTime = 229.18 * (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g) - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g));
  const utcMins = now.getUTCHours() * 60 + now.getUTCMinutes() + now.getUTCSeconds() / 60;
  let lon = (720 - utcMins - eqTime) / 4;
  lon = ((lon + 540) % 360) - 180;
  return [(decl * 180) / Math.PI, lon];
}
