/**
 * وش ذا؟ — كانت إيش؟ shared logic.
 *
 * Broken telephone, drawn. A sentence becomes a drawing, that drawing becomes
 * someone's written interpretation, that sentence becomes another drawing, and
 * so on:
 *
 *   text → drawing → text → drawing → text
 *
 * THE RULE THE WHOLE MODE DEPENDS ON: each player sees only the ONE link that
 * feeds their turn. Never the chain, never the original sentence. If any player
 * can see two links, they can reason backwards and the drift stops being
 * genuine — and the drift is the entire game.
 *
 * Compiled into both the client and the Cloud Functions build.
 * Keep dependency-free.
 */

export const KANAT_ESH = {
  drawMs: 45_000,
  writeMs: 35_000,
  /** Chain length is derived from the room but clamped so a round stays short. */
  minLinks: 4,
  maxLinks: 10,
  scores: {
    /** Per link, to both its author and the player who read it faithfully. */
    faithfulLink: 2,
    /** Everyone gets something — surviving the chain is the participation. */
    completedChain: 1,
  },
} as const;

export type LinkType = 'text' | 'drawing';

export interface ChainLink {
  index: number;
  type: LinkType;
  playerId: string;
  /** A sentence, or a serialised drawing reference. */
  content: string;
}

export const SEED_SENTENCES: readonly string[] = [
  'دجاجة تهرب من مطعم بروست',
  'جمل يشرب قهوة في المجلس',
  'واحد حاجز مكانه بالشماغ',
  'قطة تسوق سيارة بالليل',
  'ولد ياكل آخر حبة سمبوسة',
  'رجل ضايع في الاستراحة',
  'مندوب توصيل يدور العنوان',
  'واحد يفتح المكيف والباب مفتوح',
  'الدلة فاضية والضيوف واصلين',
  'طفل يرسم على الجدار',
  'عصفور يسرق تمرة',
  'واحد نايم وجواله يرن',
  'سمكة تحاول تطلع من الحوض',
  'رجل يحمل عشر أكياس مرة وحدة',
  'قرد يقلد جده',
  'واحد يجري وراء الباص',
] as const;

export function pickSeed(
  used: readonly string[] = [],
  random: () => number = Math.random,
): string {
  const seen = new Set(used);
  const pool = SEED_SENTENCES.filter((s) => !seen.has(s));
  const source = pool.length > 0 ? pool : SEED_SENTENCES;

  const index = Math.floor(random() * source.length);
  return source[Math.min(index, source.length - 1)] as string;
}

/**
 * How many links this room plays.
 *
 * One per player, clamped. Longer than the room means someone takes two turns
 * and could see their own earlier link, which breaks the blindness rule.
 */
export function chainLength(playerCount: number): number {
  return Math.max(KANAT_ESH.minLinks, Math.min(KANAT_ESH.maxLinks, playerCount));
}

/**
 * What kind of link sits at each position.
 *
 * Index 0 is the seed sentence (given, not authored). From there it alternates
 * drawing, text, drawing, text… so every player either draws what they read or
 * writes what they see.
 */
export function linkTypeAt(index: number): LinkType {
  if (index === 0) return 'text';
  return index % 2 === 1 ? 'drawing' : 'text';
}

/**
 * Which player authors each link.
 *
 * Rotated so that consecutive links are always different people — reading your
 * own drawing back would make the round trivially accurate.
 */
export function chainAssignments(
  playerIds: readonly string[],
  links: number,
): string[] {
  if (playerIds.length < 3) {
    throw new Error('كانت إيش؟ يحتاج 3 لاعبين على الأقل.');
  }

  const out: string[] = [];
  for (let i = 1; i < links; i += 1) {
    out.push(playerIds[(i - 1) % playerIds.length] as string);
  }
  return out;
}

/**
 * Which link index a given player is allowed to READ for their turn.
 *
 * Exactly one: the link immediately before theirs. This is the function the
 * blindness rule is built on, and the security rules mirror it.
 */
export function readableLinkIndex(authoringIndex: number): number {
  return Math.max(0, authoringIndex - 1);
}

export interface KanatEshRoundInput {
  /** Author per link index (index 0 is the seed and has no author). */
  authorByIndex: Record<number, string>;
  /** Link indices judged to have been interpreted faithfully. */
  faithfulIndices: readonly number[];
  playerIds: readonly string[];
}

export type KanatEshScoreDelta = Record<string, number>;

/**
 * Scoring is deliberately gentle. The mode's pleasure is the reveal, not the
 * competition, and heavily rewarding accuracy would push players toward safe,
 * literal drawings — which is precisely what makes a broken-telephone round
 * boring.
 */
export function scoreKanatEshRound(input: KanatEshRoundInput): KanatEshScoreDelta {
  const { authorByIndex, faithfulIndices, playerIds } = input;
  const delta: KanatEshScoreDelta = {};

  for (const playerId of playerIds) {
    delta[playerId] = KANAT_ESH.scores.completedChain;
  }

  for (const index of faithfulIndices) {
    // Both the author of the link and whoever read it correctly are rewarded:
    // a faithful hand-off takes two people doing their job.
    for (const id of [authorByIndex[index], authorByIndex[index + 1]]) {
      if (!id) continue;
      delta[id] = (delta[id] ?? 0) + KANAT_ESH.scores.faithfulLink;
    }
  }

  return delta;
}
