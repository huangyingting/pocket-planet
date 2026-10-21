import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { Server } from 'node:http';
import { openDb } from '../../src/server/db.ts';
import { createApp, cleanText, isBlocked, HANDLE_RE } from '../../src/server/app.ts';
import { emptyProgress } from '../../src/shared/lib/progress.ts';

let server: Server, base = '';
beforeAll(async () => {
  const app = createApp({ db: openDb(':memory:'), devLogin: true, baseUrl: 'http://test', secureCookies: false });
  await new Promise<void>(r => { server = app.listen(0, () => r()); });
  const a = server.address();
  base = `http://127.0.0.1:${typeof a === 'object' && a ? a.port : 0}`;
});
afterAll(() => server.close());

const jar = new Map<string, string>();
async function call(method: string, path: string, body?: unknown, extra: Record<string, string> = {}) {
  const res = await fetch(base + path, {
    method, redirect: 'manual',
    headers: { ...(body !== undefined ? { 'content-type': 'application/json' } : {}), cookie: [...jar].map(([k, v]) => `${k}=${v}`).join('; '), ...extra },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  for (const c of res.headers.getSetCookie()) { const [kv] = c.split(';'); const [k, v] = kv.split('='); if (v) jar.set(k, v); else jar.delete(k); }
  const text = await res.text();
  let json: any = null; try { json = JSON.parse(text); } catch { /* not json */ }
  return { status: res.status, json, location: res.headers.get('location') };
}

describe('auth', () => {
  it('rejects bad email, non-JSON and cross-origin writes', async () => {
    expect((await call('POST', '/api/auth/request', { email: 'nope' })).status).toBe(400);
    const r = await fetch(base + '/api/auth/request', { method: 'POST', headers: { 'content-type': 'text/plain' }, body: 'x' });
    expect(r.status).toBe(415);
    expect((await call('POST', '/api/auth/request', { email: 'a@b.co' }, { origin: 'https://evil.example' })).status).toBe(403);
    expect((await call('POST', '/api/auth/request', { email: 'a@b.co' }, { origin: 'null' })).status).toBe(403);
  });
  it('requires a session for private endpoints', async () => {
    expect((await call('GET', '/api/progress')).status).toBe(401);
    expect((await call('POST', '/api/guestbook', { body: 'hi' })).status).toBe(401);
    expect((await call('GET', '/api/me')).json).toEqual({ user: null });
  });
  it('magic link signs in once; token cannot be reused', async () => {
    const r = await call('POST', '/api/auth/request', { email: 'Kid@Example.com' });
    expect(r.status).toBe(200);
    const path = new URL(r.json.devLink).pathname + new URL(r.json.devLink).search;
    const v = await call('GET', path);
    expect(v.status).toBe(302); expect(v.location).toBe('/#signed-in');
    expect((await call('GET', '/api/me')).json.user.email).toBe('kid@example.com');
    const again = await fetch(base + path, { redirect: 'manual' });
    expect(again.headers.get('location')).toBe('/#auth-error');
    expect((await fetch(base + '/api/auth/verify?token=garbage', { redirect: 'manual' })).headers.get('location')).toBe('/#auth-error');
  });
});

describe('profile, progress, reactions, guestbook', () => {
  it('validates nickname', async () => {
    expect((await call('PUT', '/api/profile', { handle: 'x' })).status).toBe(400);
    expect((await call('PUT', '/api/profile', { handle: 'idiot99' })).status).toBe(400);
    const ok = await call('PUT', '/api/profile', { handle: '探险家_01' });
    expect(ok.status).toBe(200); expect(ok.json.user.handle).toBe('探险家_01');
  });
  it('merges progress on PUT', async () => {
    const p1 = emptyProgress(); p1.dex = { an_lion: 100 }; p1.updatedAt = 1;
    expect((await call('PUT', '/api/progress', { progress: p1 })).json.progress.dex).toEqual({ an_lion: 100 });
    const p2 = emptyProgress(); p2.dex = { an_panda: 200, an_lion: 50 }; p2.updatedAt = 2;
    const r = await call('PUT', '/api/progress', { progress: p2 });
    expect(r.json.progress.dex).toEqual({ an_lion: 50, an_panda: 200 });
    expect((await call('GET', '/api/progress')).json.progress.dex).toEqual({ an_lion: 50, an_panda: 200 });
    expect((await call('PUT', '/api/progress', { progress: { v: 9 } })).status).toBe(400);
  });
  it('reactions are idempotent per visitor and validated', async () => {
    expect((await call('POST', '/api/reactions', { key: 'eiffel', kind: 'like', on: true })).json).toEqual({ like: 1, visited: 0 });
    expect((await call('POST', '/api/reactions', { key: 'eiffel', kind: 'like', on: true })).json).toEqual({ like: 1, visited: 0 });
    expect((await call('POST', '/api/reactions', { key: 'eiffel', kind: 'like', on: false })).json).toEqual({ like: 0, visited: 0 });
    expect((await call('POST', '/api/reactions', { key: 'nope', kind: 'like', on: true })).status).toBe(400);
    expect((await call('POST', '/api/reactions', { key: 'eiffel', kind: 'love', on: true })).status).toBe(400);
  });
  it('guestbook cleans links, blocks unkind words, hides after 3 reports', async () => {
    const r = await call('POST', '/api/guestbook', { body: 'Hello <b>world</b> https://x.example/y' });
    expect(r.status).toBe(201);
    expect(r.json.entry.body).toBe('Hello <b>world</b> 🔗');
    expect(r.json.entry.handle).toBe('探险家_01');
    expect((await call('POST', '/api/guestbook', { body: 'you are dumb' })).status).toBe(400);
    expect((await call('POST', '/api/guestbook', { body: '   ' })).status).toBe(400);
    const id = r.json.entry.id;
    for (let i = 0; i < 3; i++) {
      const vid = `${String(i).repeat(32)}`.slice(0, 32).replace(/[^a-f0-9]/g, 'a');
      await fetch(base + `/api/guestbook/${id}/report`, { method: 'POST', headers: { 'content-type': 'application/json', cookie: `pp_vid=${vid}` }, body: '{}' });
    }
    expect((await call('GET', '/api/guestbook')).json.entries.find((e: any) => e.id === id)).toBeUndefined();
  });
  it('rate limits guestbook posts', async () => {
    const codes: number[] = [];
    for (let i = 0; i < 6; i++) codes.push((await call('POST', '/api/guestbook', { body: 'hi ' + i })).status);
    expect(codes).toContain(429);
  });
  it('logout and account deletion', async () => {
    expect((await call('DELETE', '/api/me')).status).toBe(200);
    expect((await call('GET', '/api/me')).json.user).toBeNull();
  });
});

describe('helpers', () => {
  it('cleanText / isBlocked / HANDLE_RE', () => {
    expect(cleanText('a\u0000b   www.x.com  c')).toBe('a b 🔗 c');
    expect(isBlocked('I HATE this')).toBe(true);
    expect(HANDLE_RE.test('ok_name')).toBe(true);
    expect(HANDLE_RE.test('bad name')).toBe(false);
  });
});

describe('sign-in mail', async () => {
  const { mailerFromEnv } = await import('../../src/server/mail.ts');
  const { createServer } = await import('node:net');

  it('explains a missing or invalid transport', () => {
    expect('error' in mailerFromEnv({})).toBe(true);
    expect('error' in mailerFromEnv({ SMTP_URL: 'smtp://h' })).toBe(true);
    expect('error' in mailerFromEnv({ SMTP_URL: 'http://h', MAIL_FROM: 'a@b.co' })).toBe(true);
    expect('send' in mailerFromEnv({ MAIL_API_URL: 'https://x', MAIL_FROM: 'a@b.co' })).toBe(true);
  });

  it('speaks SMTP with STARTTLS and AUTH to deliver one message', async () => {
    const { execFileSync } = await import('node:child_process');
    const { mkdtempSync, readFileSync, writeFileSync } = await import('node:fs');
    const { tmpdir } = await import('node:os');
    const { join } = await import('node:path');
    const { TLSSocket, createSecureContext } = await import('node:tls');
    const dir = mkdtempSync(join(tmpdir(), 'pp-smtp-'));
    try {
      execFileSync('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-days', '1', '-subj', '/CN=localhost', '-addext', 'subjectAltName=DNS:localhost',
        '-keyout', join(dir, 'k.pem'), '-out', join(dir, 'c.pem')], { stdio: 'ignore' });
    } catch { return; /* no openssl: skip */ }
    const ctx = createSecureContext({ key: readFileSync(join(dir, 'k.pem')), cert: readFileSync(join(dir, 'c.pem')) });
    const seen: string[] = [];
    const srv = createServer(raw => {
      let s: import('node:net').Socket = raw, buf = '', data = false;
      const onData = (d: Buffer) => {
        buf += d.toString();
        let i;
        while ((i = buf.indexOf('\r\n')) >= 0) {
          const line = buf.slice(0, i); buf = buf.slice(i + 2);
          if (data) { if (line === '.') { data = false; s.write('250 queued\r\n'); } else seen.push(line); continue; }
          seen.push(line.startsWith('AUTH') ? 'AUTH' : line);
          if (line.startsWith('EHLO')) s.write(s === raw ? '250-hi\r\n250 STARTTLS\r\n' : '250-hi\r\n250 AUTH PLAIN\r\n');
          else if (line === 'STARTTLS') {
            s.write('220 go\r\n'); raw.removeAllListeners('data');
            s = new TLSSocket(raw, { isServer: true, secureContext: ctx }); s.on('data', onData);
          } else if (line.startsWith('AUTH')) s.write('235 ok\r\n');
          else if (line === 'DATA') { data = true; s.write('354 go\r\n'); }
          else if (line === 'QUIT') { s.write('221 bye\r\n'); s.end(); }
          else s.write('250 ok\r\n');
        }
      };
      raw.on('data', onData);
      raw.write('220 hi\r\n');
    });
    await new Promise<void>(r => srv.listen(0, '127.0.0.1', () => r()));
    const port = (srv.address() as { port: number }).port;
    writeFileSync(join(dir, 'ca.pem'), readFileSync(join(dir, 'c.pem')));
    const m = mailerFromEnv({ SMTP_URL: `smtp://u:p@localhost:${port}`, MAIL_FROM: 'Pocket <pp@b.co>', SMTP_CA_FILE: join(dir, 'ca.pem') });
    if (!('send' in m)) throw new Error(m.error);
    await m.send('kid@b.co', 'http://x/verify?token=1');
    srv.close();
    expect(seen).toEqual(expect.arrayContaining(['STARTTLS', 'AUTH', 'MAIL FROM:<pp@b.co>', 'RCPT TO:<kid@b.co>', 'DATA']));
    const body = Buffer.from(seen.slice(seen.indexOf('') + 1).join(''), 'base64').toString();
    expect(body).toContain('http://x/verify?token=1');
  });

  it('reports a failed send instead of claiming the link went out', async () => {
    const db = openDb(':memory:');
    const app = createApp({ db, devLogin: false, baseUrl: 'http://t', secureCookies: false, sendMail: async () => { throw new Error('down'); } });
    const s: Server = await new Promise(r => { const x = app.listen(0, () => r(x)); });
    const port = (s.address() as { port: number }).port;
    const res = await fetch(`http://127.0.0.1:${port}/api/auth/request`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'a@b.co' }) });
    expect(res.status).toBe(502);
    expect((db.prepare('SELECT COUNT(*) AS n FROM login_tokens').get() as { n: number }).n).toBe(0);
    const off = createApp({ db, devLogin: false, baseUrl: 'http://t', secureCookies: false });
    const s2: Server = await new Promise(r => { const x = off.listen(0, () => r(x)); });
    const r2 = await fetch(`http://127.0.0.1:${(s2.address() as { port: number }).port}/api/auth/request`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'a@b.co' }) });
    expect(r2.status).toBe(503);
    s.close(); s2.close();
  });
});
