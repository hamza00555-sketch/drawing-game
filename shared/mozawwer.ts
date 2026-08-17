/**
 * وش ذا؟ — المزوّر shared logic.
 *
 * Compiled into BOTH the client bundle and the Cloud Functions build.
 *
 * Anything the server must decide and the client must predict lives here:
 * balance constants, the word bank, vote tallying, guess normalisation and
 * scoring. Duplicating these into functions/ would let the two implementations
 * drift — and a scoring rule that differs between the screen and the server is
 * a bug players would experience as the game lying to them.
 *
 * Keep this file dependency-free. It is imported by an ES module bundler and by
 * a CommonJS Node build, so it must not reach for anything from either side.
 */

export type ReadyToVoteRule = 'any_player' | 'host_only' | 'majority';

export const MOZAWWER = {
  /** Passes around the shared canvas before "الرسمة جاهزة" is even offered. */
  minTurnsBeforeReady: 2,
  /** Hard ceiling so a room cannot stall forever. */
  maxTurns: 12,
  turnMs: 20_000,
  readyToVoteRule: 'any_player' as ReadyToVoteRule,
  votingMs: 30_000,
  /** The impostor's last chance to name the word after being unmasked. */
  impostorGuessMs: 20_000,
  scores: {
    /** Each non-impostor who voted for the actual impostor. */
    correctVote: 2,
    /** To the impostor, if the vote failed to identify them. */
    impostorSurvived: 5,
    /** To the impostor for naming the word after being caught. */
    impostorGuessedWord: 3,
    /** Split among non-impostors when the impostor is caught. */
    groupCaughtImpostor: 1,
  },
} as const;

export interface WordEntry {
  word: string;
  /** 1 = anyone can draw it, 3 = takes some thought. */
  difficulty: 1 | 2 | 3;
}

export const MOZAWWER_WORDS: readonly WordEntry[] = [
  // ---- Home and hospitality ----
  { word: 'دلة', difficulty: 1 },
  { word: 'فنجال', difficulty: 1 },
  { word: 'ترمس قهوة', difficulty: 2 },
  { word: 'صينية', difficulty: 1 },
  { word: 'مسبحة', difficulty: 2 },
  { word: 'مخدة', difficulty: 1 },
  { word: 'مكيف', difficulty: 2 },
  { word: 'سجادة', difficulty: 1 },
  { word: 'إبريق شاي', difficulty: 1 },

  // ---- Food ----
  { word: 'سمبوسة', difficulty: 1 },
  { word: 'تمر', difficulty: 1 },
  { word: 'شاورما', difficulty: 2 },
  { word: 'برجر', difficulty: 1 },
  { word: 'بيتزا', difficulty: 1 },
  { word: 'كنافة', difficulty: 3 },
  { word: 'بطيخ', difficulty: 1 },
  { word: 'آيس كريم', difficulty: 1 },
  { word: 'دجاجة', difficulty: 1 },

  // ---- Clothing ----
  { word: 'شماغ', difficulty: 2 },
  { word: 'عقال', difficulty: 2 },
  { word: 'ثوب', difficulty: 2 },
  { word: 'نظارة', difficulty: 1 },
  { word: 'حذاء', difficulty: 1 },
  { word: 'ساعة يد', difficulty: 2 },

  // ---- Animals ----
  { word: 'جمل', difficulty: 2 },
  { word: 'قطة', difficulty: 1 },
  { word: 'فيل', difficulty: 1 },
  { word: 'سمكة', difficulty: 1 },
  { word: 'عصفور', difficulty: 1 },
  { word: 'زرافة', difficulty: 2 },
  { word: 'أخطبوط', difficulty: 2 },
  { word: 'صقر', difficulty: 3 },

  // ---- Places and things outside ----
  { word: 'نخلة', difficulty: 1 },
  { word: 'مسجد', difficulty: 2 },
  { word: 'سيارة', difficulty: 1 },
  { word: 'طيارة', difficulty: 1 },
  { word: 'استراحة', difficulty: 3 },
  { word: 'محطة بنزين', difficulty: 3 },
  { word: 'إشارة مرور', difficulty: 2 },
  { word: 'خيمة', difficulty: 1 },
  { word: 'شمس', difficulty: 1 },
  { word: 'مطر', difficulty: 2 },

  // ---- Objects ----
  { word: 'جوال', difficulty: 1 },
  { word: 'مفتاح', difficulty: 1 },
  { word: 'مقص', difficulty: 1 },
  { word: 'كرسي', difficulty: 1 },
  { word: 'باب', difficulty: 1 },
  { word: 'مظلة', difficulty: 1 },
  { word: 'سلم', difficulty: 1 },
  { word: 'ساعة منبه', difficulty: 2 },
  { word: 'كرة قدم', difficulty: 1 },
  { word: 'قلم', difficulty: 1 },
] as const;

/**
 * Pick a word, avoiding ones this room has already used.
 *
 * `random` is injectable so tests are deterministic and so the Cloud Function
 * can supply its own source. Falls back to the full list once a long session
 * has exhausted it — repeating late is better than refusing to start a round.
 */
export function pickWord(
  usedWords: readonly string[] = [],
  random: () => number = Math.random,
): WordEntry {
  const used = new Set(usedWords);
  const pool = MOZAWWER_WORDS.filter((entry) => !used.has(entry.word));
  const source = pool.length > 0 ? pool : MOZAWWER_WORDS;

  const index = Math.floor(random() * source.length);
  return source[Math.min(index, source.length - 1)] as WordEntry;
}

/**
 * Who the room voted for.
 *
 * A tie means nobody is accused — the room failed to agree, which counts as the
 * impostor surviving. Picking a "winner" from a tie would punish a player the
 * room did not actually choose.
 */
export function tallyVotes(votes: Record<string, string>): {
  accusedId: string | undefined;
  counts: Record<string, number>;
  tied: boolean;
} {
  const counts: Record<string, number> = {};
  for (const target of Object.values(votes)) {
    counts[target] = (counts[target] ?? 0) + 1;
  }

  const entries = Object.entries(counts);
  if (entries.length === 0) return { accusedId: undefined, counts, tied: false };

  const top = Math.max(...entries.map(([, n]) => n));
  const leaders = entries.filter(([, n]) => n === top);

  if (leaders.length > 1) return { accusedId: undefined, counts, tied: true };

  return { accusedId: leaders[0]?.[0], counts, tied: false };
}

/**
 * Normalise a guess before comparing. Arabic needs this: أ/إ/آ and ا are typed
 * interchangeably, ة and ه are confused constantly, and diacritics are optional.
 * Without it, a correct answer gets rejected for a keyboard habit.
 */
export function normalizeGuess(input: string): string {
  return input
    .trim()
    .replace(/[ً-ْٰ]/g, '') // harakat
    .replace(/ـ/g, '') // tatweel
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/[ؤئ]/g, 'ء')
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

/** Edit distance, for typo tolerance. Short words get none — at 3 letters or
 * fewer, one edit is usually a different word ("قطة" → "قلة"), not a typo. */
function levenshtein(a: string, b: string): number {
  const rows = a.length;
  const cols = b.length;
  if (rows === 0) return cols;
  if (cols === 0) return rows;

  let previous = Array.from({ length: cols + 1 }, (_, j) => j);
  for (let i = 1; i <= rows; i += 1) {
    const current = [i];
    for (let j = 1; j <= cols; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      current[j] = Math.min(
        (current[j - 1] ?? 0) + 1,
        (previous[j] ?? 0) + 1,
        (previous[j - 1] ?? 0) + cost,
      );
    }
    previous = current;
  }
  return previous[cols] as number;
}

function typoTolerance(wordLength: number): number {
  if (wordLength <= 3) return 0;
  if (wordLength <= 6) return 1;
  return 2;
}

/**
 * A guess counts as correct if it names the word — not only if it types the
 * word and nothing else.
 *
 * Two allowances beyond exact match, both aimed at "the player clearly meant
 * this word", not at accepting a different one:
 *   - the word appears as a whole word inside a longer guess ("قطة سوداء" for
 *     "قطة" — describing it further should not fail it);
 *   - a small edit-distance tolerance absorbs a typo, scaled down to zero for
 *     short words where one edit is usually a genuinely different word.
 *
 * This does not resolve true synonyms (a different word with the same
 * meaning) — that needs a per-word list of accepted answers in the content
 * itself, not a string-comparison rule.
 */
export function isCorrectGuess(guess: string, word: string): boolean {
  const normGuess = normalizeGuess(guess);
  const normWord = normalizeGuess(word);
  if (!normGuess || !normWord) return false;
  if (normGuess === normWord) return true;

  const guessWords = normGuess.split(' ').filter(Boolean);
  if (guessWords.length > 1 && guessWords.includes(normWord)) return true;

  return levenshtein(normGuess, normWord) <= typoTolerance(normWord.length);
}

export interface MozawwerRoundInput {
  impostorId: string;
  /** voterId -> targetId. Missing voters simply did not vote. */
  votes: Record<string, string>;
  /** Everyone still in the round, impostor included. */
  playerIds: readonly string[];
  /** Whether the vote actually landed on the impostor. */
  caught: boolean;
  /** Whether a caught impostor then named the word. */
  impostorGuessedWord: boolean;
}

export type ScoreDelta = Record<string, number>;

export function scoreMozawwerRound(input: MozawwerRoundInput): ScoreDelta {
  const { impostorId, votes, playerIds, caught, impostorGuessedWord } = input;
  const scores = MOZAWWER.scores;

  const delta: ScoreDelta = {};
  const add = (playerId: string, points: number) => {
    if (points === 0) return;
    delta[playerId] = (delta[playerId] ?? 0) + points;
  };

  // Individually correct votes pay out whether or not the room as a whole
  // caught the impostor — being right should never be worthless because others
  // were wrong.
  for (const [voterId, targetId] of Object.entries(votes)) {
    if (voterId === impostorId) continue;
    if (targetId === impostorId) add(voterId, scores.correctVote);
  }

  if (caught) {
    for (const playerId of playerIds) {
      if (playerId !== impostorId) add(playerId, scores.groupCaughtImpostor);
    }
    if (impostorGuessedWord) add(impostorId, scores.impostorGuessedWord);
  } else {
    add(impostorId, scores.impostorSurvived);
  }

  return delta;
}

/** Apply a delta to a running scoreboard. */
export function applyScores(
  current: Record<string, number>,
  delta: ScoreDelta,
): Record<string, number> {
  const next = { ...current };
  for (const [playerId, points] of Object.entries(delta)) {
    next[playerId] = (next[playerId] ?? 0) + points;
  }
  return next;
}
