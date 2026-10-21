import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { openDb } from './db.ts';
import { createApp } from './app.ts';
import { mailerFromEnv, type SendMail } from './mail.ts';

const root = fileURLToPath(new URL('../..', import.meta.url));
const port = Number(process.env.PORT ?? 8787);
const prod = process.env.NODE_ENV === 'production';
const devLogin = !prod || process.env.DEV_LOGIN === '1';
const mailer = mailerFromEnv(process.env);
let sendMail: SendMail | undefined;
if ('send' in mailer) sendMail = mailer.send;
else if (!prod) sendMail = async (to, link) => { console.log(`[mail] sign-in link for ${to.replace(/(.).*@/, '$1***@')}: ${link}`); };
else console.error(`[mail] email sign-in is OFF: ${mailer.error}`);
const db = openDb(process.env.DB_PATH ?? join(root, 'data', 'terrastra.db'));
const app = createApp({
  db,
  devLogin,
  baseUrl: process.env.BASE_URL ?? `http://localhost:${port}`,
  secureCookies: prod && process.env.INSECURE_COOKIES !== '1',
  staticDir: join(root, 'dist'),
  sendMail,
});
app.listen(port, () => console.log(`Terrastra server on http://localhost:${port}`));
