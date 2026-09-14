#!/usr/bin/env node
/**
 * Push the third-party art (Discord emojis, avatars) from client/public/ to a
 * hosted OtyChat server's data volume. These files are gitignored, so a Railway
 * build has none of them until this runs once.
 *
 *   ADMIN_CODE=xxxx node scripts/push-assets.js https://your-app.up.railway.app
 */

const fs = require('fs');
const path = require('path');

const serverUrl = (process.argv[2] || '').replace(/\/$/, '');
const adminCode = process.env.ADMIN_CODE;

if (!serverUrl || !adminCode) {
  console.error('Usage: ADMIN_CODE=<code> node scripts/push-assets.js <server-url>');
  process.exit(1);
}

const ROOT = path.join(__dirname, '..', 'client', 'public');
const KINDS = ['emojis', 'avatars'];

async function pushKind(kind) {
  const dir = path.join(ROOT, kind);
  if (!fs.existsSync(dir)) {
    console.warn(`[skip] ${dir} does not exist`);
    return 0;
  }
  const files = fs.readdirSync(dir).filter(f => /\.(png|jpg|jpeg|gif|webp)$/i.test(f));
  let sent = 0;
  for (const file of files) {
    const body = fs.readFileSync(path.join(dir, file));
    const res = await fetch(`${serverUrl}/api/admin/assets/${kind}/${encodeURIComponent(file)}`, {
      method: 'PUT',
      headers: { 'x-admin-code': adminCode, 'content-type': 'application/octet-stream' },
      body
    });
    if (!res.ok) {
      console.error(`[fail] ${kind}/${file}: ${res.status} ${await res.text()}`);
      continue;
    }
    sent++;
  }
  console.log(`[ok] ${kind}: ${sent}/${files.length} uploaded`);
  return sent;
}

(async () => {
  for (const kind of KINDS) await pushKind(kind);
  const res = await fetch(`${serverUrl}/api/admin/assets`, { headers: { 'x-admin-code': adminCode } });
  console.log('[server]', await res.json());
})().catch(err => {
  console.error(err);
  process.exit(1);
});
