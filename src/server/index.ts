import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { openDb } from './db.ts';
import { createApp } from './app.ts';

const root = fileURLToPath(new URL('../..', import.meta.url));
const port = Number(process.env.PORT ?? 8787);
const prod = process.env.NODE_ENV === 'production';
const db = openDb(process.env.DB_PATH ?? join(root, 'data', 'pocket-planet.db'));
const app = createApp({
  db,
  devLogin: !prod || process.env.DEV_LOGIN === '1',
  baseUrl: process.env.BASE_URL ?? `http://localhost:${port}`,
  secureCookies: prod && process.env.INSECURE_COOKIES !== '1',
  staticDir: join(root, 'dist'),
  sendMail: async (to, link) => { if (!prod) console.log(`[mail] sign-in link for ${to.replace(/(.).*@/, '$1***@')}: ${link}`); },
});
app.listen(port, () => console.log(`Pocket Planet server on http://localhost:${port}`));
