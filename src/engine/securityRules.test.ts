import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * Guard tests for `firebase/database.rules.json`.
 *
 * These do not exercise a database — that is what `firebase emulators:exec` is
 * for. They protect the handful of structural properties that, if quietly
 * changed, would break a secret rather than a feature, and so would not show up
 * in play at all. A leaked word looks exactly like a working game.
 */

const RULES_PATH = fileURLToPath(new URL('../../firebase/database.rules.json', import.meta.url));

/** The rules file is JSON with // comments, which Firebase accepts and JSON.parse does not. */
function loadRules(): Record<string, unknown> {
  const source = readFileSync(RULES_PATH, 'utf8')
    .split('\n')
    .filter((line) => !line.trim().startsWith('//'))
    .join('\n');

  return (JSON.parse(source) as { rules: Record<string, unknown> }).rules;
}

const rules = loadRules();

function at(path: string): unknown {
  return path.split('/').reduce<unknown>((node, key) => {
    if (node === null || typeof node !== 'object') return undefined;
    return (node as Record<string, unknown>)[key];
  }, rules);
}

describe('root', () => {
  it('denies everything by default', () => {
    // Every readable path below is an explicit, reviewed exception.
    expect(rules['.read']).toBe(false);
    expect(rules['.write']).toBe(false);
  });
});

describe('gameSecrets', () => {
  it('is readable by nobody', () => {
    // The word, the impostor, the split prompt and the seed sentence live here.
    // Only the Admin SDK, which bypasses rules, may touch them.
    expect(at('gameSecrets/.read')).toBe(false);
    expect(at('gameSecrets/.write')).toBe(false);
  });

  it('is a sibling of games, not a child of it', () => {
    // Read rules cascade downwards and cannot be revoked further down, so a
    // secrets node nested inside the readable `games` subtree would be readable
    // by every member of the room no matter what rule sat on it.
    expect(at('games/gameSecrets')).toBeUndefined();
  });
});

describe('playerSecrets', () => {
  it('lets a player read only their own payload', () => {
    expect(at('playerSecrets/$roomId/$gameId/$playerId/.read')).toBe(
      'auth != null && auth.uid === $playerId',
    );
  });

  it('is never client-writable', () => {
    expect(at('playerSecrets/$roomId/$gameId/$playerId/.write')).toBe(false);
  });
});

describe('hostId', () => {
  const validate = String(at('rooms/$roomId/hostId/.validate'));

  it('allows the first write, when no player record can exist yet', () => {
    /*
     * A room is created before anyone is a player in it — the player record is
     * written afterwards — so requiring membership unconditionally rejected
     * every room at creation, with PERMISSION_DENIED and no clue as to which
     * rule refused. The emulator does not enforce this the way production does,
     * which is exactly why it needs a test rather than a playthrough.
     */
    expect(validate).toContain('!data.exists()');
  });

  it('still requires membership when the host changes', () => {
    expect(validate).toContain("root.child('roomPlayers').child($roomId).child(newData.val()).exists()");
  });

  it('only lets a connected player take over from an offline host', () => {
    const write = String(at('rooms/$roomId/hostId/.write'));
    expect(write).toContain("child(data.val()).child('connected').val() === false");
    expect(write).toContain("child(auth.uid).child('connected').val() === true");
  });
});

describe('scores', () => {
  it('cannot be written by a client', () => {
    // The one rule that stops a player awarding themselves the round.
    expect(at('playerScores/$roomId/.write')).toBe(false);
  });
});

describe('strokes', () => {
  const write = String(at('strokes/$roomId/$gameId/$strokeId/.write'));

  it('accepts the appends a live stroke is actually made of', () => {
    // A stroke is a header, then point chunks every ~50ms, then `done`. A bare
    // `!data.exists()` guard would allow the header and silently reject every
    // chunk after it, leaving remote viewers watching a line that never grows.
    // Existing nodes must stay writable — by their own author only.
    expect(write).toContain("(!data.exists() || data.child('playerId').val() === auth.uid)");
    expect(at('strokes/$roomId/$gameId/$strokeId/done')).toBeDefined();
  });

  it('still refuses to let one player append to another player s line', () => {
    expect(write).toContain("data.child('playerId').val() === auth.uid");
    expect(write).toContain("newData.child('playerId').val() === auth.uid");
  });

  it('only allows drawing during a drawing phase, by whoever holds the pen', () => {
    // Covers every mode's own name for "pen is live": مزوّر/الممنوعات/الرسم
    // المشترك use `draw`, كمّل رسمتي uses `turn`, and its Duo ruleset adds one
    // short bonus window named `extend`.
    expect(write).toContain("child('phase').val().matches(/^(draw|turn|extend)/)");
    expect(write).toContain("child('currentPlayerId').val() === auth.uid");
    // الرسم المشترك is the one mode where two pens are live at once.
    expect(write).toContain("child('activeDrawers').child(auth.uid).exists()");
  });

  it('lets the stroke\'s own author delete it — what "تراجع" needs to sync', () => {
    // Without this branch, undo only ever cleared the local canvas: the wire
    // still had the stroke, so every other viewer kept seeing it.
    expect(write).toContain('!newData.exists() && data.exists()');
    expect(write).toContain("data.child('playerId').val() === auth.uid");
  });
});

describe('linkStrokes — كانت إيش؟', () => {
  const read = String(at('linkStrokes/$roomId/$gameId/$index/.read'));
  const write = String(at('linkStrokes/$roomId/$gameId/$index/$strokeId/.write'));

  it('is a separate subtree from the shared canvas', () => {
    // Sharing `strokes` would put every link of the chain in one bucket that
    // every member can read, which is exactly the blindness the mode needs.
    expect(at('linkStrokes')).toBeDefined();
  });

  it('gates reading a link on the same visibleTo grant as the link text', () => {
    expect(read).toContain("child('visibleTo').child($index).child(auth.uid).exists()");
  });

  it('lets the current author see the link they are drawing', () => {
    expect(read).toContain("child('currentIndexKey').val() === $index");
  });

  it('opens everything at the reveal', () => {
    expect(read).toContain("matches(/^(reveal|result)/)");
  });

  it('confines writing to the current player and the current link', () => {
    expect(write).toContain("child('currentPlayerId').val() === auth.uid");
    expect(write).toContain("child('currentIndexKey').val() === $index");
    expect(write).toContain("child('phase').val() === 'turn'");
  });

  it('lets the author keep writing to a stroke that already exists', () => {
    // A bare `!data.exists()` guard — as this rule used to read — accepts the
    // header and then rejects every point chunk and the `done` flag after it,
    // since those are later writes to the same, now-existing node. Every
    // كانت إيش؟ drawing link would render as an empty canvas.
    expect(write).toContain("(!data.exists() || data.child('playerId').val() === auth.uid)");
  });

  it('lets the stroke\'s own author delete it, same as the shared canvas', () => {
    expect(write).toContain('!newData.exists() && data.exists()');
  });
});

describe('duoChains — كانت إيش؟ Duo', () => {
  const read = String(at('duoChains/$roomId/$gameId/$track/$index/.read'));
  const write = String(at('duoChains/$roomId/$gameId/$track/$index/.write'));

  it('is a fully separate subtree from the single-chain version', () => {
    // Kept apart deliberately: one wildcard cannot tell "this is a track
    // segment" from "this is a link index" from within the group ruleset's
    // own `chains` rule, so merging the shapes risked loosening it by
    // accident. See the comment above this block in the rules file.
    expect(at('duoChains')).toBeDefined();
    expect(at('chains')).toBeDefined();
  });

  it('gates reading a link on a per-track visibleTo grant', () => {
    expect(read).toContain("child('visibleTo').child($track).child($index).child(auth.uid).exists()");
  });

  it('opens everything at the reveal, same as the group version', () => {
    expect(read).toContain('matches(/^(reveal|result)/)');
  });

  it('confines writing to whoever is that TRACK\'s current author', () => {
    expect(write).toContain("child('tracks').child($track).child('currentPlayerId').val() === auth.uid");
    expect(write).toContain('!data.exists()');
  });
});

describe('duoLinkStrokes — كانت إيش؟ Duo', () => {
  const read = String(at('duoLinkStrokes/$roomId/$gameId/$track/$index/.read'));
  const write = String(at('duoLinkStrokes/$roomId/$gameId/$track/$index/$strokeId/.write'));

  it('confines writing to the current author of that track and that link', () => {
    expect(write).toContain("child('tracks').child($track).child('currentPlayerId').val() === auth.uid");
    expect(write).toContain("child('tracks').child($track).child('currentIndexKey').val() === $index");
    expect(write).toContain("child('phase').val() === 'turn'");
  });

  it('lets the current author see the link they are drawing, per track', () => {
    expect(read).toContain("child('tracks').child($track).child('currentIndexKey').val() === $index");
  });

  it('lets the author keep writing to a stroke that already exists', () => {
    expect(write).toContain("(!data.exists() || data.child('playerId').val() === auth.uid)");
  });

  it('lets the stroke\'s own author delete it, same as the shared canvas', () => {
    expect(write).toContain('!newData.exists() && data.exists()');
  });
});

describe('votes', () => {
  const write = String(at('votes/$roomId/$gameId/$voterId/.write'));

  it('lets a player cast only their own vote, once', () => {
    expect(write).toContain('auth.uid === $voterId');
    expect(write).toContain('!data.exists()');
    expect(write).toContain("child('phase').val() === 'vote'");
  });

  it('keeps the tally sealed until the reveal', () => {
    expect(String(at('votes/$roomId/$gameId/.read'))).toContain('matches(/^(reveal|result)/)');
  });
});

describe('guesses', () => {
  it('never lets a client mark its own guess correct', () => {
    // Correctness requires the word, which guessers do not have. It is decided
    // server-side, so the client is refused both the claim and the rank.
    expect(at('guesses/$roomId/$gameId/$guessId/correct/.validate')).toBe(false);
    expect(at('guesses/$roomId/$gameId/$guessId/rank/.validate')).toBe(false);
  });
});

describe('chains', () => {
  it('mirrors the blindness rule the client also enforces', () => {
    const read = String(at('chains/$roomId/$gameId/$index/.read'));
    expect(read).toContain("child('visibleTo').child($index).child(auth.uid).exists()");
    expect(read).toContain('matches(/^(reveal|result)/)');
  });
});
