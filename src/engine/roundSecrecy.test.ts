import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * The leak this test exists to prevent.
 *
 * Reads `server/`, which is where the trusted logic lives regardless of who
 * hosts it — a Vercel function in production, the Firebase emulator locally.
 *
 * `games/{roomId}/current` is readable by every member of the room. A round's
 * private facts — the word, the impostor, the taboo list, the split prompt, the
 * seed sentence — must therefore never be written into it at setup, no matter
 * how convenient it is to keep them beside the phase.
 *
 * That mistake is invisible in play. The game works perfectly; the impostor
 * simply opens DevTools and reads the answer. Nothing about the round looks
 * wrong, which is exactly why it needs a test rather than a review.
 *
 * Publishing the same values LATER is correct and expected: `revealedWord`,
 * `impostorId`, `partA/partB/full` and `seed` are written at the reveal, once
 * the room is entitled to them. This test only guards the setup payload.
 */

const MODE_FILES = [
  'index.ts',
  'kammil.ts',
  'mamnou3at.ts',
  'mushtarak.ts',
  'kanatEsh.ts',
] as const;

/** Keys that identify the answer, in any mode. */
const SECRET_KEYS = ['word', 'forbidden', 'impostorId', 'partA', 'partB', 'full', 'seed', 'hint'];

function source(file: string): string {
  return readFileSync(
    fileURLToPath(new URL(`../../server/${file}`, import.meta.url)),
    'utf8',
  );
}

/**
 * The object literal written to the public game node at round setup.
 *
 * Brace-matched rather than regexed to the end of a line, because the literal
 * spans many lines and contains nested objects of its own.
 */
function initialGamePayloads(text: string): string[] {
  const marker = 'current`]: {';
  const payloads: string[] = [];

  let from = 0;
  for (;;) {
    const start = text.indexOf(marker, from);
    if (start === -1) break;

    let depth = 0;
    let i = start + marker.length - 1;
    for (; i < text.length; i += 1) {
      if (text[i] === '{') depth += 1;
      else if (text[i] === '}') {
        depth -= 1;
        if (depth === 0) break;
      }
    }

    payloads.push(text.slice(start + marker.length, i));
    from = i;
  }

  return payloads;
}

/** Top-level keys of an object literal body, ignoring nested ones. */
function topLevelKeys(body: string): string[] {
  const keys: string[] = [];
  let depth = 0;
  let line = '';

  for (const char of body) {
    if (char === '\n') {
      const match = depth === 0 ? /^\s*([A-Za-z_][\w]*)\s*:/.exec(line) : null;
      if (match?.[1]) keys.push(match[1]);
      line = '';
      continue;
    }

    if (depth === 0) line += char;
    if (char === '{' || char === '[') depth += 1;
    if (char === '}' || char === ']') depth -= 1;
  }

  return keys;
}

describe('the public game node', () => {
  for (const file of MODE_FILES) {
    it(`carries no round secret at setup — ${file}`, () => {
      const payloads = initialGamePayloads(source(file));
      expect(payloads.length).toBeGreaterThan(0);

      for (const payload of payloads) {
        for (const key of topLevelKeys(payload)) {
          expect(SECRET_KEYS).not.toContain(key);
        }
      }
    });
  }
});

describe('every mode', () => {
  for (const file of MODE_FILES) {
    it(`puts its private facts in gameSecrets — ${file}`, () => {
      // Not merely "absent from the game node": absent because it was written
      // somewhere unreadable instead.
      expect(source(file)).toContain('gameSecretPath(roomId, gameId)');
    });
  }
});

describe('per-player secrets', () => {
  it('never gives the impostor a word key', () => {
    // The payload shape IS the secret: `{ role: 'impostor' }` with no `word`.
    // A `word: undefined` would serialise to nothing in Realtime Database, but
    // writing it explicitly invites someone to later "fix" it to an empty
    // string, which reads on the wire as a key the impostor was sent.
    const text = source('index.ts');
    expect(text).toContain("{ role: 'impostor' }");
    expect(text).not.toContain("role: 'impostor', word");
  });

  it('never gives the كمّل رسمتي guesser a word key', () => {
    expect(source('kammil.ts')).toContain("{ role: 'guesser' }");
  });

  it('gives الممنوعات guessers a letter count instead of the word', () => {
    const text = source('mamnou3at.ts');
    expect(text).toContain("{ role: 'guesser', hint: letterHint(entry.word) }");
  });

  it('gives each الرسم المشترك artist one half and never both', () => {
    const text = source('mushtarak.ts');
    expect(text).toContain("{ role: 'artist', part: combo.partA }");
    expect(text).toContain("{ role: 'artist', part: combo.partB }");
    expect(text).not.toContain('part: combo.full');
  });
});
