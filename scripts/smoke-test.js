#!/usr/bin/env node
/**
 * End-to-end smoke test over real sockets.
 *
 * Boots server.js on a throwaway port with a throwaway DATA_DIR, then drives the
 * login, chat, queue, display, DM, drink, profile and Popcorn Emergency flows the
 * way phones and the Slides overlay do. Exits non-zero on the first failure.
 *
 *   npm test
 */

const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const { io } = require(path.join(ROOT, 'client', 'node_modules', 'socket.io-client'));

const PORT = 3999;
const BASE = `http://127.0.0.1:${PORT}`;
const ADMIN_CODE = 'smoke-admin';
const DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'otychat-smoke-'));

let server;
let failures = 0;
const sockets = [];

function log(msg) { console.log(`  ${msg}`); }
function pass(name) { console.log(`\x1b[32mPASS\x1b[0m ${name}`); }
function fail(name, err) {
  failures++;
  console.log(`\x1b[31mFAIL\x1b[0m ${name}\n     ${err && err.stack ? err.stack.split('\n')[0] : err}`);
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function connect() {
  const s = io(BASE, { transports: ['websocket'], forceNew: true });
  sockets.push(s);
  return s;
}

/** Resolve with the first payload of `event` that satisfies `pred` (default: any). */
function waitFor(socket, event, pred = () => true, timeoutMs = 3000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      socket.off(event, handler);
      reject(new Error(`timeout waiting for '${event}'`));
    }, timeoutMs);
    function handler(payload) {
      if (!pred(payload)) return;
      clearTimeout(timer);
      socket.off(event, handler);
      resolve(payload);
    }
    socket.on(event, handler);
  });
}

/** Reject if `event` arrives within the window. */
function expectSilence(socket, event, ms = 700) {
  return new Promise((resolve, reject) => {
    const handler = (p) => {
      clearTimeout(timer);
      socket.off(event, handler);
      reject(new Error(`unexpected '${event}': ${JSON.stringify(p).slice(0, 120)}`));
    };
    const timer = setTimeout(() => { socket.off(event, handler); resolve(); }, ms);
    socket.on(event, handler);
  });
}

async function joinAs(username, password) {
  const s = connect();
  await waitFor(s, 'connect');
  const stats = waitFor(s, 'trainer-stats');
  s.emit('join', { username, password });
  await stats;
  return s;
}

async function test(name, fn) {
  try {
    await fn();
    pass(name);
  } catch (err) {
    fail(name, err);
  }
}

async function startServer() {
  server = spawn(process.execPath, ['server.js'], {
    cwd: ROOT,
    env: { ...process.env, PORT: String(PORT), DATA_DIR, ADMIN_CODE, NODE_ENV: 'test' },
    stdio: ['ignore', 'pipe', 'pipe']
  });
  const serverLog = [];
  server.stdout.on('data', d => serverLog.push(d.toString()));
  server.stderr.on('data', d => serverLog.push(d.toString()));
  server.on('exit', code => {
    if (code !== null && code !== 0) {
      console.log(serverLog.join(''));
    }
  });

  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${BASE}/api/health`);
      if (res.ok) return;
    } catch (_) { /* not up yet */ }
    await new Promise(r => setTimeout(r, 200));
  }
  console.log(serverLog.join(''));
  throw new Error('server did not come up');
}

async function main() {
  await startServer();
  log(`server up on ${BASE}, data in ${DATA_DIR}`);

  let alice, bob, display;
  let chatId, queueId;

  await test('health route answers', async () => {
    const res = await fetch(`${BASE}/api/health`);
    const body = await res.json();
    assert(body.ok === true, 'health body');
  });

  await test('test routes reject without admin code', async () => {
    const res = await fetch(`${BASE}/api/test/spawn`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: '{"username":"x"}'
    });
    assert(res.status === 403, `expected 403, got ${res.status}`);
  });

  await test('new user without a password is refused', async () => {
    const s = connect();
    await waitFor(s, 'connect');
    const err = waitFor(s, 'join-error');
    s.emit('join', { username: 'nopass', password: '' });
    const e = await err;
    assert(e.code === 'PASSWORD_REQUIRED', `code ${e.code}`);
    s.disconnect();
  });

  await test('new user with a password joins and gets the sync bundle', async () => {
    const s = connect();
    await waitFor(s, 'connect');
    const bundle = Promise.all([
      waitFor(s, 'trainer-stats'),
      waitFor(s, 'chat-sync'),
      waitFor(s, 'queue-sync'),
      waitFor(s, 'dm-history'),
      waitFor(s, 'unread-dm-count'),
      waitFor(s, 'online-users', users => users.some(u => u.odName === 'alice')),
      waitFor(s, 'pokedex-data'),
      waitFor(s, 'achievements-list'),
      waitFor(s, 'shop-items'),
      waitFor(s, 'zones-data')
    ]);
    s.emit('join', { username: 'alice', password: 'pw-a' });
    const [stats, chat, queue, dms, unread, online, pokedex, ach, shop, zones] = await bundle;
    assert(stats.level === 1, 'level 1');
    assert(typeof stats.id === 'number' && stats.username === 'alice', 'stats carry id and username');
    assert(typeof stats.xpForCurrentLevel === 'number' && typeof stats.xpForNextLevel === 'number', 'xp thresholds');
    assert(Array.isArray(pokedex) && pokedex.length === 0, 'empty pokedex');
    assert(ach.achievements.length > 10 && Array.isArray(ach.unlocked) && ach.progress.reactions, 'achievement catalogue');
    assert(shop.great_ball_5 && shop.great_ball_5.price === 200, 'shop items');
    assert(zones.zones && zones.zones.meadow, 'zones');
    assert(Array.isArray(chat) && chat.length === 0, 'empty chat');
    assert(Array.isArray(queue) && queue.length === 0, 'empty queue');
    assert(Array.isArray(dms) && dms.length === 0, 'empty dms');
    assert(unread === 0, 'unread 0');
    assert(online.length === 1, 'one online');
    alice = s;
  });

  await test('wrong password is refused', async () => {
    const s = connect();
    await waitFor(s, 'connect');
    const err = waitFor(s, 'join-error');
    s.emit('join', { username: 'alice', password: 'nope' });
    const e = await err;
    assert(e.code === 'WRONG_PASSWORD', `code ${e.code}`);
    s.disconnect();
  });

  await test('forgot password returns the stored password', async () => {
    const s = connect();
    await waitFor(s, 'connect');
    const r = waitFor(s, 'forgot-password-result');
    s.emit('forgot-password', { username: 'alice' });
    const res = await r;
    assert(res.success && res.password === 'pw-a', JSON.stringify(res));
    s.disconnect();
  });

  await test('second user joins; first user sees them online with real profile', async () => {
    const seen = waitFor(alice, 'online-users', users => users.some(u => u.odName === 'bob'));
    bob = await joinAs('bob', 'pw-b');
    const users = await seen;
    const b = users.find(u => u.odName === 'bob');
    // Joining with few people online unlocks Early Bird, which sets the title.
    // Before the fix this always read 'Newcomer' because the lookup used a wrong key.
    assert(b.odTitle === 'Early Bird', `title from db, got ${b.odTitle}`);
  });

  await test('display overlay registers', async () => {
    display = connect();
    await waitFor(display, 'connect');
    display.emit('join-display');
    await waitFor(display, 'user-count');
  });

  await test('chat message reaches everyone', async () => {
    const got = waitFor(bob, 'chat-message-added', m => m.text === 'hello room');
    alice.emit('send-chat', { text: 'hello room', type: 'text' });
    const m = await got;
    assert(m.username === 'alice', 'author');
    assert(m.in_queue === 0, 'not queued');
    chatId = m.id;
  });

  await test('queue message lands in chat and queue', async () => {
    const chat = waitFor(bob, 'chat-message-added', m => m.text === 'a real question');
    const q = waitFor(alice, 'queue-item-added', m => m.text === 'a real question');
    alice.emit('send-to-queue', { text: 'a real question', type: 'text' });
    const [m, qi] = await Promise.all([chat, q]);
    assert(m.in_queue === 1, 'in queue');
    queueId = qi.id;
  });

  await test('upvote increments once and is broadcast', async () => {
    const up = waitFor(alice, 'chat-upvoted', u => String(u.messageId) === String(queueId));
    bob.emit('upvote-chat', { messageId: queueId });
    const u = await up;
    assert(u.votes === 1, `votes ${u.votes}`);
    // second upvote by the same user must not fire again
    await Promise.all([
      expectSilence(alice, 'chat-upvoted'),
      (async () => bob.emit('upvote-chat', { messageId: queueId }))()
    ]);
  });

  await test('show on display reaches the overlay and every phone', async () => {
    const shown = waitFor(display, 'show-question', q => String(q.id) === String(queueId));
    const changed = waitFor(bob, 'display-question-changed', d => String(d.messageId) === String(queueId));
    alice.emit('show-on-display', { messageId: queueId });
    const [q] = await Promise.all([shown, changed]);
    assert(q.text === 'a real question' && q.username === 'alice', JSON.stringify(q));
  });

  await test('a late-joining phone learns what is on the display', async () => {
    const s = connect();
    await waitFor(s, 'connect');
    const changed = waitFor(s, 'display-question-changed', d => String(d.messageId) === String(queueId));
    s.emit('join', { username: 'carol', password: 'pw-c' });
    await changed;
    s.disconnect();
  });

  await test('hide from display clears the overlay', async () => {
    const hidden = waitFor(display, 'hide-question');
    const changed = waitFor(alice, 'display-question-changed', d => d.messageId === null);
    bob.emit('hide-from-display');
    await Promise.all([hidden, changed]);
  });

  await test('dismissing a displayed item also hides it', async () => {
    alice.emit('show-on-display', { messageId: queueId });
    await waitFor(display, 'show-question');
    const hidden = waitFor(display, 'hide-question');
    const dismissed = waitFor(bob, 'queue-item-dismissed', d => String(d.messageId) === String(queueId));
    alice.emit('dismiss-from-queue', { messageId: queueId });
    await Promise.all([hidden, dismissed]);
  });

  await test('DM is delivered to both parties', async () => {
    const toBob = waitFor(bob, 'dm-received', d => d.odContent === 'psst');
    const echo = waitFor(alice, 'dm-received', d => d.odContent === 'psst');
    alice.emit('send-dm', { toUsername: 'bob', content: 'psst' });
    const [d] = await Promise.all([toBob, echo]);
    assert(d.odFromName === 'alice' && d.odToName === 'bob', JSON.stringify(d));
  });

  await test('DM persists and counts as unread after a reconnect', async () => {
    bob.disconnect();
    const s = connect();
    await waitFor(s, 'connect');
    const hist = waitFor(s, 'dm-history');
    const unread = waitFor(s, 'unread-dm-count');
    s.emit('join', { username: 'bob', password: 'pw-b' });
    const [h, u] = await Promise.all([hist, unread]);
    assert(h.length === 1 && h[0].odContent === 'psst', 'history');
    assert(u === 1, `unread ${u}`);
    bob = s;
  });

  await test('marking DMs read clears the unread count', async () => {
    bob.emit('mark-dms-read', { fromUsername: 'alice' });
    await new Promise(r => setTimeout(r, 200));
    bob.disconnect();
    const s = connect();
    await waitFor(s, 'connect');
    const unread = waitFor(s, 'unread-dm-count');
    s.emit('join', { username: 'bob', password: 'pw-b' });
    assert((await unread) === 0, 'unread 0 after read');
    bob = s;
  });

  await test('drink log and undo work on a fresh database', async () => {
    const one = waitFor(alice, 'drink-logged', d => d.tonight === 1);
    alice.emit('log-drink');
    await one;
    const zero = waitFor(alice, 'drink-logged', d => d.tonight === 0);
    alice.emit('unlog-drink');
    await zero;
  });

  await test('a spawned Pokemon can be thrown at until caught or fled', async () => {
    const spawned = waitFor(alice, 'pokemon-spawn');
    const res = await fetch(`${BASE}/api/test/spawn`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-admin-code': ADMIN_CODE },
      body: JSON.stringify({ username: 'alice', pokemonId: 25 })
    });
    assert(res.ok, `spawn route ${res.status}`);
    const spawn = await spawned;
    assert(spawn.odId && spawn.pokemonName === 'Pikachu' && typeof spawn.sprite === 'string', JSON.stringify(spawn));
    assert(typeof spawn.expiresAt === 'number' && spawn.expiresAt > Date.now(), 'expiry in future');

    let outcome = null;
    for (let attempt = 0; attempt < 3 && !outcome; attempt++) {
      const caught = waitFor(alice, 'pokemon-caught');
      const failed = waitFor(alice, 'catch-failed');
      const balls = waitFor(alice, 'balls-updated');
      // pokedex-data follows pokemon-caught in the same tick, so listen before throwing
      const dex = waitFor(alice, 'pokedex-data', d => d.length === 1).catch(() => null);
      alice.emit('catch-pokemon', { odId: spawn.odId, ballType: 'pokeball' });
      const result = await Promise.race([caught.then(p => ({ kind: 'caught', p })), failed.then(p => ({ kind: 'failed', p }))]);
      await balls;
      if (result.kind === 'caught') {
        assert(result.p.pokemonName === 'Pikachu' && result.p.rewards.xp > 0 && result.p.sprite, JSON.stringify(result.p));
        const list = await dex;
        assert(list && list[0].odPokemonId === 25 && list[0].odSpriteUrl, 'pokedex updated');
        outcome = 'caught';
      } else {
        assert(typeof result.p.message === 'string', 'failure message');
        if (result.p.fled) outcome = 'fled';
        else assert(result.p.attemptsRemaining === 2 - attempt, `attempts left ${result.p.attemptsRemaining}`);
      }
    }
    assert(outcome === 'caught' || outcome === 'fled', `outcome ${outcome}`);
  });

  await test('buying from the shop updates coins and inventory', async () => {
    // Early Bird + drinks earned some coins; give a guaranteed balance via the test route.
    const grant = await fetch(`${BASE}/api/test/grant-pokemon`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-admin-code': ADMIN_CODE },
      body: JSON.stringify({ username: 'alice' })
    });
    assert(grant.ok, `grant ${grant.status}`);
    // grant-pokemon refreshes nothing on its own; rejoin to read the new balance
    alice.disconnect();
    const s2 = connect();
    await waitFor(s2, 'connect');
    const rejoined = waitFor(s2, 'trainer-stats');
    s2.emit('join', { username: 'alice', password: 'pw-a' });
    const before = await rejoined;
    alice = s2;
    assert(before.balls.great === 10, `granted balls ${before.balls.great}`);
    const purchase = waitFor(alice, 'shop-purchase');
    const stats = waitFor(alice, 'trainer-stats', s => s.balls.great === 15);
    alice.emit('buy-item', { itemId: 'great_ball_5' });
    const [p, s] = await Promise.all([purchase, stats]);
    assert(p.newBalance === before.coins - 200, `balance ${p.newBalance} vs ${before.coins - 200}`);
    assert(s.coins === p.newBalance, 'stats agree with purchase');
  });

  await test('user profile lookup returns real data', async () => {
    const p = waitFor(alice, 'user-profile', p => p.username === 'bob');
    alice.emit('get-user-profile', { username: 'bob' });
    const profile = await p;
    assert(profile.level === 1 && profile.title === 'Early Bird', JSON.stringify(profile));
    assert(typeof profile.joinedAt === 'string', 'joinedAt');
    assert(Array.isArray(profile.recentPokemon), 'recentPokemon list');
  });

  await test('popcorn emergency to everyone: invite, response, end', async () => {
    const invite = waitFor(bob, 'popcorn-emergency-invite');
    const onDisplay = waitFor(display, 'popcorn-emergency-start');
    const hostView = waitFor(alice, 'popcorn-emergency-status');
    alice.emit('popcorn-emergency', { invitees: 'all' });
    const [inv, disp, status] = await Promise.all([invite, onDisplay, hostView]);
    assert(inv.hostUsername === 'alice', 'host');
    assert(disp.invitees.some(i => i.username === 'bob'), 'display invitee list');
    assert(status.invitees.find(i => i.username === 'bob').status === 'pending', 'host sees pending');

    const hostSees = waitFor(alice, 'popcorn-emergency-response', r => r.username === 'bob');
    const displaySees = waitFor(display, 'popcorn-emergency-response', r => r.username === 'bob');
    bob.emit('popcorn-emergency-respond', { accepted: true });
    const [r] = await Promise.all([hostSees, displaySees]);
    assert(r.status === 'accepted', 'accepted');

    const ended = waitFor(bob, 'popcorn-emergency-ended');
    const displayEnd = waitFor(display, 'popcorn-emergency-end');
    alice.emit('popcorn-emergency-end');
    await Promise.all([ended, displayEnd]);
  });

  await test('popcorn emergency to one person does not hit the display', async () => {
    const invite = waitFor(bob, 'popcorn-emergency-invite');
    const quiet = expectSilence(display, 'popcorn-emergency-start');
    alice.emit('popcorn-emergency', { invitees: ['bob'] });
    await Promise.all([invite, quiet]);
    const ended = waitFor(bob, 'popcorn-emergency-ended');
    alice.emit('popcorn-emergency-end');
    await ended;
  });

  await test('host disconnecting ends the emergency', async () => {
    const invite = waitFor(bob, 'popcorn-emergency-invite');
    alice.emit('popcorn-emergency', { invitees: ['bob'] });
    await invite;
    const ended = waitFor(bob, 'popcorn-emergency-ended');
    alice.disconnect();
    await ended;
  });

  await test('asset upload lands in the data volume', async () => {
    const res = await fetch(`${BASE}/api/admin/assets/emojis/test.png`, {
      method: 'PUT',
      headers: { 'x-admin-code': ADMIN_CODE, 'content-type': 'application/octet-stream' },
      body: Buffer.from([0x89, 0x50, 0x4e, 0x47])
    });
    assert(res.ok, `upload ${res.status}`);
    const served = await fetch(`${BASE}/emojis/test.png`);
    assert(served.ok, `serve ${served.status}`);
  });

  await test('deep links fall back to the React app when it is built', async () => {
    const res = await fetch(`${BASE}/some/deep/link`);
    const built = fs.existsSync(path.join(ROOT, 'public-react', 'index.html'));
    if (built) {
      assert(res.ok && (res.headers.get('content-type') || '').includes('text/html'), `status ${res.status}`);
    } else {
      assert(res.status === 404, 'no build, no fallback');
    }
  });

  for (const s of sockets) s.disconnect();
  server.kill();
  fs.rmSync(DATA_DIR, { recursive: true, force: true });

  console.log(failures === 0 ? '\nall smoke tests passed' : `\n${failures} smoke test(s) failed`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch(err => {
  console.error(err);
  if (server) server.kill();
  process.exit(1);
});
