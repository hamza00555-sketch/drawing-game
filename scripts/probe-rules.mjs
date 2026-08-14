#!/usr/bin/env node
/**
 * Run the client's real write sequence against a real Firebase project.
 *
 * WHY THIS EXISTS: the emulator is not a faithful oracle for security rules.
 * Three separate rules refused ordinary gameplay in production while six clean
 * playthroughs against the emulator passed — it does not enforce a child
 * `.validate` on a parent write the way the real engine does. Every one of the
 * three failures reached a player as "permission denied" with no clue which
 * rule refused.
 *
 * So this walks the exact sequence `createRoom` and `joinRoomById` perform, in
 * order, over the REST API with a real anonymous ID token, and reports which
 * step a rule turned away. It writes under a `probe-*` room id and deletes what
 * it can afterwards.
 *
 * Usage:
 *   node scripts/probe-rules.mjs --db <databaseURL> --key <apiKey>
 *
 * Both values are the public web config — the same ones the browser bundle
 * carries. Nothing secret is needed, and nothing secret is printed.
 */

const args = new Map();
for (let i = 2; i < process.argv.length; i += 2) {
  args.set(process.argv[i]?.replace(/^--/, ''), process.argv[i + 1]);
}

const DB = (args.get('db') ?? process.env.VITE_FIREBASE_DATABASE_URL ?? '').replace(/\/$/, '');
const KEY = args.get('key') ?? process.env.VITE_FIREBASE_API_KEY ?? '';

if (!DB || !KEY) {
  console.error('Usage: node scripts/probe-rules.mjs --db <databaseURL> --key <apiKey>');
  process.exit(2);
}

const signUp = await fetch(
  `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${KEY}`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ returnSecureToken: true }),
  },
);

if (!signUp.ok) {
  const body = await signUp.text();
  console.error('Anonymous sign-in failed. Is Authentication → Anonymous enabled?');
  console.error(body.slice(0, 300));
  process.exit(1);
}

const { idToken, localId: uid } = await signUp.json();
const roomId = `probe-${Date.now()}`;
const code = 'PROBE';

/** One write, exactly as the client makes it. */
async function write(label, path, body, method = 'PUT') {
  const response = await fetch(`${DB}/${path}.json?auth=${idToken}`, {
    method,
    body: JSON.stringify(body),
  });

  const text = await response.text();
  const denied = text.includes('Permission denied');
  results.push({ label, ok: response.ok && !denied });

  console.log(`${response.ok && !denied ? 'ok  ' : 'FAIL'}  ${label}`);
  if (denied) console.log(`      ${path}`);
  return response.ok && !denied;
}

const results = [];
const now = { '.sv': 'timestamp' };

console.log(`probing ${DB}\n`);

// createRoom()
await write('create the room', `rooms/${roomId}`, {
  id: roomId,
  code: '',
  hostId: uid,
  status: 'lobby',
  createdAt: now,
});
await write('claim the join code', `roomCodes/${code}`, roomId);
await write('write the code onto the room', `rooms/${roomId}`, { code }, 'PATCH');
await write('write room settings', `rooms/${roomId}/settings`, { room: { minPlayers: 3 } });

// joinRoomById()
await write('reserve a character', `roomCharacters/${roomId}/artist`, uid);
await write(
  'write the player record',
  `roomPlayers/${roomId}/${uid}`,
  { id: uid, name: 'probe', characterId: 'artist', variant: 'default', ready: false, joinedAt: now },
  'PATCH',
);
await write('mark ready', `roomPlayers/${roomId}/${uid}/ready`, true);

// presence
await write('announce presence', `presence/${roomId}/${uid}`, { connected: true, lastSeen: now });

// mode selection
await write('choose a mode', `rooms/${roomId}/currentMode`, 'mozawwer');

/*
 * Not probed: strokes, votes, guesses and chain links. Every one of those rules
 * reads `games/{roomId}/current`, which only trusted logic can create, so they
 * cannot be exercised without a live round. They are the next thing to cover
 * once Cloud Functions are deployed.
 */

for (const path of [
  `presence/${roomId}`,
  `roomPlayers/${roomId}`,
  `roomCharacters/${roomId}`,
  `roomCodes/${code}`,
]) {
  await fetch(`${DB}/${path}.json?auth=${idToken}`, { method: 'DELETE' });
}

const failed = results.filter((r) => !r.ok);
console.log(
  failed.length === 0
    ? `\nAll ${results.length} writes accepted.`
    : `\n${failed.length} of ${results.length} writes refused by a rule.`,
);

// The room itself is not deletable by a client — by design, rooms are not
// client-removable — so probe rooms accumulate. They are harmless and obvious.
process.exit(failed.length === 0 ? 0 : 1);
