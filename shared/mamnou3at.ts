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
  minPlayers: 2,
  drawMs: 75_000,
  /** How long the artist gets to read the word and the forbidden list. */
  briefMs: 8_000,
  /** How many forbidden elements the artist is shown. */
  forbiddenCount: 3,
  scores: {
    /** Ordered payout for the first correct guessers. */
    guessRank: [3, 2, 1],
    /** The artist earns this per player who got it — their drawing worked. */
    artistPerCorrectGuess: 1,
  },
  /**
   * Two players: one artist, one guesser, then they swap next round. Shorter
   * than the group version — there is only one guesser to wait on, so the
   * group's 75-second ceiling is mostly dead air here.
   */
  duo: {
    briefMs: 5_000,
    drawMs: 35_000,
    scores: {
      /** Payout for a correct guess landing right at the buzzer. */
      minGuesserPoints: 1,
      /** Payout for a correct guess landing the instant drawing starts. */
      maxGuesserPoints: 4,
      artistPointsOnCorrect: 3,
      artistPointsOnFail: 0,
    },
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
  { word: 'أسد', forbidden: ['اللبدة', 'الأنياب', 'الذيل بخصلة'] },
  { word: 'حمار', forbidden: ['الأذنين الطويلتين', 'الذيل', 'الحوافر'] },
  { word: 'بطة', forbidden: ['المنقار المسطح', 'الأقدام المكففة', 'الريش'] },
  { word: 'ضفدع', forbidden: ['العينين البارزتين', 'الأرجل الخلفية القوية', 'الجلد الأخضر'] },
  { word: 'نحلة', forbidden: ['الخطوط الصفراء والسوداء', 'الجناحين', 'الإبرة'] },
  { word: 'فراشة', forbidden: ['الأجنحة الملونة', 'قرون الاستشعار', 'الأنماط المتماثلة'] },
  { word: 'حصان', forbidden: ['العرف', 'الحوافر', 'الذيل الطويل'] },
  { word: 'دجاجة', forbidden: ['العرف الأحمر', 'المنقار', 'الريش'] },
  { word: 'تمساح', forbidden: ['الفك الطويل', 'الأسنان الحادة', 'الذيل'] },
  { word: 'سلحفاة', forbidden: ['الصدفة', 'الرأس الصغيرة', 'الأرجل القصيرة'] },
  { word: 'قوس قزح', forbidden: ['الألوان السبعة', 'الشكل المقوس', 'السحاب'] },
  { word: 'ثلاجة', forbidden: ['الباب المستطيل', 'المقبض', 'الرفوف'] },
  { word: 'غسالة', forbidden: ['الباب الدائري', 'الأزرار', 'الفقاعات'] },
  { word: 'تلفزيون', forbidden: ['الشاشة المستطيلة', 'الريموت', 'القاعدة'] },
  { word: 'دراجة هوائية', forbidden: ['العجلتين', 'المقود', 'البدالات'] },
  { word: 'مروحة', forbidden: ['الريش الدوارة', 'القاعدة', 'الشبكة'] },
  { word: 'شمعة', forbidden: ['اللهب', 'الفتيلة', 'الشكل الأسطواني'] },
  { word: 'جرس', forbidden: ['الشكل المخروطي', 'اللسان الداخلي', 'الحلقة العلوية'] },
  { word: 'سلم', forbidden: ['الدرجات', 'القائمين الجانبيين', 'الشكل الطويل'] },
  { word: 'حقيبة مدرسية', forbidden: ['الحمالات', 'السحاب', 'الجيوب'] },
  { word: 'نظارة شمسية', forbidden: ['العدسات الداكنة', 'الإطار', 'الذراعين'] },
  { word: 'غيتار', forbidden: ['الأوتار', 'الشكل المنحني', 'المقبض الطويل'] },
  { word: 'طبل', forbidden: ['الشكل الدائري', 'العصي', 'الجلد المشدود'] },
  { word: 'مكنسة', forbidden: ['الشعيرات', 'العصا الطويلة', 'شكلها المثلث بالأسفل'] },
  { word: 'مطرقة', forbidden: ['الرأس المعدني', 'المقبض', 'الشكل T'] },
  { word: 'منشار', forbidden: ['الأسنان الحادة', 'المقبض', 'الشفرة المستقيمة'] },
  { word: 'زهرة', forbidden: ['البتلات', 'الساق الخضراء', 'الأوراق'] },
  { word: 'فطر', forbidden: ['القبعة الدائرية', 'الساق', 'البقع'] },
  { word: 'حذاء رياضي', forbidden: ['الرباط', 'النعل', 'الفتحات الجانبية'] },
  { word: 'ساندويتش', forbidden: ['الخبز', 'الحشوة الظاهرة', 'الشكل المثلث أو المربع'] },
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

export interface MamnouDuoRoundInput {
  artistId: string;
  guesserId: string;
  correct: boolean;
  /** Elapsed ms from the start of the draw phase to the correct guess. */
  guessedAtMs: number | null;
  /** The draw phase's total length — the denominator for the speed bonus. */
  drawMs: number;
}

/**
 * Duo scoring: the ranked payout in `scoreMamnouRound` degenerates to a flat
 * value with only one guesser, so speed has to be rewarded directly instead —
 * linear between `minGuesserPoints` (guessed right at the buzzer) and
 * `maxGuesserPoints` (guessed the instant drawing started).
 */
export function scoreMamnouDuoRound(input: MamnouDuoRoundInput): MamnouScoreDelta {
  const { artistId, guesserId, correct, guessedAtMs, drawMs } = input;
  const { minGuesserPoints, maxGuesserPoints, artistPointsOnCorrect, artistPointsOnFail } =
    MAMNOU3AT.duo.scores;

  if (!correct || guessedAtMs === null) {
    return artistPointsOnFail > 0 ? { [artistId]: artistPointsOnFail } : {};
  }

  const remainingFraction = Math.max(0, Math.min(1, 1 - guessedAtMs / drawMs));
  const points = Math.round(
    minGuesserPoints + remainingFraction * (maxGuesserPoints - minGuesserPoints),
  );

  return { [guesserId]: points, [artistId]: artistPointsOnCorrect };
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
