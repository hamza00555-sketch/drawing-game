/**
 * وش ذا؟ — الممنوعات shared logic.
 *
 * One artist draws a thing while forbidden from drawing its most obvious
 * parts. Everyone else sees only how many letters the answer has, and guesses
 * freely against the clock.
 *
 * The forbidden list is what makes the mode: without it, "قطة" is two ears and
 * whiskers and the round is over in four seconds. Taking those away forces the
 * artist to find another route to the same idea, and watching them fail is the
 * entertainment.
 *
 * Compiled into both the client and the Cloud Functions build.
 * Keep dependency-free.
 */

export const MAMNOU3AT = {
  drawMs: 75_000,
  /** How many forbidden elements the artist is shown. */
  forbiddenCount: 3,
  scores: {
    /** Ordered payout for the first correct guessers. */
    guessRank: [3, 2, 1],
    /** The artist earns this per player who got it — their drawing worked. */
    artistPerCorrectGuess: 1,
  },
} as const;

export interface TabooEntry {
  word: string;
  /** The obvious features. The artist must avoid these. */
  forbidden: readonly string[];
}

/**
 * Every entry's forbidden list is the set of features a person would reach for
 * FIRST. A list of obscure details would not constrain anyone.
 */
export const TABOO_WORDS: readonly TabooEntry[] = [
  { word: 'قطة', forbidden: ['الشوارب', 'الذيل', 'الأذن المثلثة'] },
  { word: 'جمل', forbidden: ['السنام', 'الرقبة الطويلة', 'الصحراء'] },
  { word: 'نخلة', forbidden: ['السعف', 'التمر', 'الجذع الطويل'] },
  { word: 'سيارة', forbidden: ['العجلات', 'الزجاج الأمامي', 'الأبواب'] },
  { word: 'دلة', forbidden: ['الفوهة', 'المقبض', 'الفنجال'] },
  { word: 'ساعة', forbidden: ['العقارب', 'الأرقام', 'الدائرة'] },
  { word: 'شمس', forbidden: ['الأشعة', 'الدائرة', 'اللون الأصفر'] },
  { word: 'سمكة', forbidden: ['الزعانف', 'الذيل', 'الماء'] },
  { word: 'بيت', forbidden: ['السقف المثلث', 'الباب', 'النوافذ'] },
  { word: 'طيارة', forbidden: ['الأجنحة', 'الذيل', 'السحاب'] },
  { word: 'شجرة', forbidden: ['الجذع', 'الأوراق', 'الفروع'] },
  { word: 'كتاب', forbidden: ['الصفحات', 'الغلاف', 'السطور'] },
  { word: 'مفتاح', forbidden: ['الأسنان', 'الحلقة', 'القفل'] },
  { word: 'مظلة', forbidden: ['المقبض', 'الأضلاع', 'المطر'] },
  { word: 'برجر', forbidden: ['الخبز', 'اللحم', 'الخس'] },
  { word: 'قهوة', forbidden: ['الفنجال', 'البخار', 'اللون البني'] },
  { word: 'جوال', forbidden: ['الشاشة', 'المستطيل', 'الأزرار'] },
  { word: 'كرة قدم', forbidden: ['المسدسات', 'الدائرة', 'المرمى'] },
  { word: 'عصفور', forbidden: ['المنقار', 'الأجنحة', 'الريش'] },
  { word: 'فيل', forbidden: ['الخرطوم', 'الأذنين الكبيرتين', 'الأنياب'] },
] as const;

export function pickTaboo(
  usedWords: readonly string[] = [],
  random: () => number = Math.random,
): TabooEntry {
  const used = new Set(usedWords);
  const pool = TABOO_WORDS.filter((entry) => !used.has(entry.word));
  const source = pool.length > 0 ? pool : TABOO_WORDS;

  const index = Math.floor(random() * source.length);
  return source[Math.min(index, source.length - 1)] as TabooEntry;
}

/**
 * The hint guessers see: one slot per letter, spaces preserved.
 *
 * Letter COUNT only — never the letters themselves. It narrows the field
 * enough to make guessing feel directed, without giving the answer away to
 * anyone who thinks alphabetically instead of visually.
 */
export function letterHint(word: string): string {
  return word
    .split(' ')
    .map((part) => Array.from(part).fill('_').join(' '))
    .join('   ');
}

export interface MamnouRoundInput {
  artistId: string;
  /** Correct guessers, in the order they got it right. */
  correctGuesserIds: readonly string[];
}

export type MamnouScoreDelta = Record<string, number>;

export function scoreMamnouRound(input: MamnouRoundInput): MamnouScoreDelta {
  const { artistId, correctGuesserIds } = input;
  const delta: MamnouScoreDelta = {};

  correctGuesserIds.forEach((playerId, rank) => {
    // Beyond the ranked payouts, later correct guesses score the last tier
    // rather than nothing — being slow should not be worth zero.
    const points =
      MAMNOU3AT.scores.guessRank[rank] ??
      MAMNOU3AT.scores.guessRank[MAMNOU3AT.scores.guessRank.length - 1] ??
      0;
    delta[playerId] = (delta[playerId] ?? 0) + points;
  });

  if (correctGuesserIds.length > 0) {
    delta[artistId] =
      (delta[artistId] ?? 0) +
      correctGuesserIds.length * MAMNOU3AT.scores.artistPerCorrectGuess;
  }

  return delta;
}
