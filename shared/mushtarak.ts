/**
 * وش ذا؟ — الرسم المشترك shared logic.
 *
 * Two artists draw on ONE canvas at the same time, and each holds only half
 * the idea: one is told "ديناصور", the other "يلبس فستان عرس". Neither knows
 * the other's half. Everyone else has to name the combined thing.
 *
 * The comedy comes from the collision — two people confidently drawing toward
 * different pictures on the same sheet — so the prompt is deliberately split
 * into halves that are each drawable alone but absurd together.
 *
 * Compiled into both the client and the Cloud Functions build.
 * Keep dependency-free.
 */

export const MUSHTARAK = {
  minPlayers: 2,
  drawMs: 60_000,
  /** How long each artist gets to read their half before the pens open. */
  briefMs: 6_000,
  guessMs: 30_000,
  /** "فهمتك" — the one limited signal an artist may send per round. */
  gotYouUsesPerArtist: 1,
  scores: {
    guesserCorrect: 3,
    /** Both artists, when someone names the combination. */
    artistsOnSuccess: 2,
  },
  replay: {
    msPerContribution: 700,
  },
  /**
   * Two players: no secret split (there is nobody left to guess), and no
   * simultaneous drawing either — instead they alternate short turns on the
   * same canvas, aiming for something fast and chaotic rather than a careful
   * drawing session.
   */
  duo: {
    briefMs: 4_000,
    turnMs: 2_500,
    /** "6-8 تبديلات تقريبًا" — the midpoint. */
    totalSwaps: 7,
    scores: {
      /** Flat, to both players — there is no guess to judge, only participation. */
      participation: 2,
    },
    replay: {
      msPerContribution: 400,
    },
  },
} as const;

/**
 * A prompt is two halves plus the full phrase used to judge guesses.
 *
 * `categories` documents the combination shape so the bank can be extended
 * deliberately rather than by adding more of whatever is already there.
 */
export interface ComboPrompt {
  /** Shown only to artist A. */
  partA: string;
  /** Shown only to artist B. */
  partB: string;
  /** The whole thing. Guesses are compared against this. */
  full: string;
  category: 'object+action' | 'character+costume' | 'animal+situation' | 'person+problem';
}

export const COMBO_PROMPTS: readonly ComboPrompt[] = [
  { partA: 'ديناصور', partB: 'يلبس فستان عرس', full: 'ديناصور يلبس فستان عرس', category: 'character+costume' },
  { partA: 'جمل', partB: 'يسوق سيارة', full: 'جمل يسوق سيارة', category: 'animal+situation' },
  { partA: 'قطة', partB: 'تشرب قهوة', full: 'قطة تشرب قهوة', category: 'animal+situation' },
  { partA: 'دجاجة', partB: 'تهرب من مطعم', full: 'دجاجة تهرب من مطعم', category: 'animal+situation' },
  { partA: 'روبوت', partB: 'يصلي', full: 'روبوت يصلي', category: 'character+costume' },
  { partA: 'سمكة', partB: 'تلبس نظارة', full: 'سمكة تلبس نظارة', category: 'animal+situation' },
  { partA: 'فيل', partB: 'على دراجة', full: 'فيل على دراجة', category: 'animal+situation' },
  { partA: 'معلم', partB: 'نايم في الفصل', full: 'معلم نايم في الفصل', category: 'person+problem' },
  { partA: 'طباخ', partB: 'يحترق أكله', full: 'طباخ يحترق أكله', category: 'person+problem' },
  { partA: 'دلة', partB: 'تطير', full: 'دلة تطير', category: 'object+action' },
  { partA: 'سيارة', partB: 'تحت المطر', full: 'سيارة تحت المطر', category: 'object+action' },
  { partA: 'نخلة', partB: 'تلبس شماغ', full: 'نخلة تلبس شماغ', category: 'object+action' },
  { partA: 'أخطبوط', partB: 'يلعب كرة', full: 'أخطبوط يلعب كرة', category: 'animal+situation' },
  { partA: 'مندوب توصيل', partB: 'ضايع', full: 'مندوب توصيل ضايع', category: 'person+problem' },
  { partA: 'قرد', partB: 'يقص شعره', full: 'قرد يقص شعره', category: 'animal+situation' },
  { partA: 'ساعة', partB: 'تجري', full: 'ساعة تجري', category: 'object+action' },
  { partA: 'بطة', partB: 'تلبس عباءة', full: 'بطة تلبس عباءة', category: 'character+costume' },
  { partA: 'حمار', partB: 'يقرأ جريدة', full: 'حمار يقرأ جريدة', category: 'animal+situation' },
  { partA: 'أسد', partB: 'يخاف من فأر', full: 'أسد يخاف من فأر', category: 'animal+situation' },
  { partA: 'دب', partB: 'يرقص بالليل', full: 'دب يرقص بالليل', category: 'animal+situation' },
  { partA: 'ثعبان', partB: 'يلعب جمباز', full: 'ثعبان يلعب جمباز', category: 'animal+situation' },
  { partA: 'شرطي', partB: 'ضايع بالطريق', full: 'شرطي ضايع بالطريق', category: 'person+problem' },
  { partA: 'طبيب', partB: 'خايف من الإبرة', full: 'طبيب خايف من الإبرة', category: 'person+problem' },
  { partA: 'عروسة', partB: 'تلعب كرة قدم', full: 'عروسة تلعب كرة قدم', category: 'character+costume' },
  { partA: 'حارس مرمى', partB: 'نايم بالمرمى', full: 'حارس مرمى نايم بالمرمى', category: 'person+problem' },
  { partA: 'خيمة', partB: 'تطير بالهوا', full: 'خيمة تطير بالهوا', category: 'object+action' },
  { partA: 'مظلة', partB: 'تنقلب مع الريح', full: 'مظلة تنقلب مع الريح', category: 'object+action' },
  { partA: 'مروحة', partB: 'تطفي الشموع', full: 'مروحة تطفي الشموع', category: 'object+action' },
  { partA: 'ثلاجة', partB: 'مليانة فواكه غريبة', full: 'ثلاجة مليانة فواكه غريبة', category: 'object+action' },
  { partA: 'جوال', partB: 'يرن بمنتصف الاجتماع', full: 'جوال يرن بمنتصف الاجتماع', category: 'object+action' },
  { partA: 'كرسي', partB: 'ينكسر فجأة', full: 'كرسي ينكسر فجأة', category: 'object+action' },
  { partA: 'باب', partB: 'يصرّ بالليل', full: 'باب يصرّ بالليل', category: 'object+action' },
  { partA: 'مصباح', partB: 'يومض لحاله', full: 'مصباح يومض لحاله', category: 'object+action' },
  { partA: 'محقق', partB: 'يضيع دليله', full: 'محقق يضيع دليله', category: 'person+problem' },
  { partA: 'نجار', partB: 'يدق إصبعه', full: 'نجار يدق إصبعه', category: 'person+problem' },
  { partA: 'خباز', partB: 'يحرق الكيك', full: 'خباز يحرق الكيك', category: 'person+problem' },
  { partA: 'سباح', partB: 'خايف من الماء', full: 'سباح خايف من الماء', category: 'person+problem' },
  { partA: 'راعي غنم', partB: 'يضيع خرافه', full: 'راعي غنم يضيع خرافه', category: 'person+problem' },
  { partA: 'زرافة', partB: 'تلبس طوق', full: 'زرافة تلبس طوق', category: 'character+costume' },
  { partA: 'بطريق', partB: 'يلبس نظارة شمس', full: 'بطريق يلبس نظارة شمس', category: 'character+costume' },
  { partA: 'صقر', partB: 'يلبس عقال', full: 'صقر يلبس عقال', category: 'character+costume' },
  { partA: 'أرنب', partB: 'يسابق سلحفاة', full: 'أرنب يسابق سلحفاة', category: 'animal+situation' },
  { partA: 'قطة', partB: 'تطارد ليزر', full: 'قطة تطارد ليزر', category: 'animal+situation' },
  { partA: 'كلب', partB: 'يحرس دجاجة', full: 'كلب يحرس دجاجة', category: 'animal+situation' },
  { partA: 'ذئب', partB: 'يخاف من الظلام', full: 'ذئب يخاف من الظلام', category: 'animal+situation' },
  { partA: 'روبوت', partB: 'يطبخ عشاء', full: 'روبوت يطبخ عشاء', category: 'character+costume' },
  { partA: 'شبح', partB: 'خايف من الظلام', full: 'شبح خايف من الظلام', category: 'character+costume' },
  { partA: 'ساحر', partB: 'ينسى تعويذته', full: 'ساحر ينسى تعويذته', category: 'character+costume' },
  { partA: 'فارس', partB: 'يخاف من حصانه', full: 'فارس يخاف من حصانه', category: 'character+costume' },
  { partA: 'دراجة هوائية', partB: 'تطلع فوق الجبل', full: 'دراجة هوائية تطلع فوق الجبل', category: 'object+action' },
] as const;

export function pickCombo(
  usedPrompts: readonly string[] = [],
  random: () => number = Math.random,
): ComboPrompt {
  const used = new Set(usedPrompts);
  const pool = COMBO_PROMPTS.filter((entry) => !used.has(entry.full));
  const source = pool.length > 0 ? pool : COMBO_PROMPTS;

  const index = Math.floor(random() * source.length);
  return source[Math.min(index, source.length - 1)] as ComboPrompt;
}

/**
 * Pick the two artists.
 *
 * Rotates away from whoever drew last, so the same pair does not draw every
 * round of a long session.
 */
export function pickArtistPair(
  playerIds: readonly string[],
  previousArtistIds: readonly string[] = [],
  random: () => number = Math.random,
): { artistIds: [string, string]; guesserIds: string[] } {
  if (playerIds.length < 3) {
    throw new Error('الرسم المشترك يحتاج 3 لاعبين على الأقل.');
  }

  const previous = new Set(previousArtistIds);
  const fresh = playerIds.filter((id) => !previous.has(id));
  // Fall back to the whole room once everyone has had a turn.
  const pool = fresh.length >= 2 ? fresh : [...playerIds];

  const first = Math.min(Math.floor(random() * pool.length), pool.length - 1);
  const a = pool[first] as string;

  const rest = pool.filter((id) => id !== a);
  const second = Math.min(Math.floor(random() * rest.length), rest.length - 1);
  const b = rest[second] as string;

  return {
    artistIds: [a, b],
    guesserIds: playerIds.filter((id) => id !== a && id !== b),
  };
}

export interface MushtarakRoundInput {
  artistIds: readonly string[];
  /** Guessers who named the full combination. */
  correctGuesserIds: readonly string[];
}

export type MushtarakScoreDelta = Record<string, number>;

/**
 * Duo scoring: both players already knew the prompt, so there is no guess to
 * reward — a flat award to each keeps the scoreboard moving without judging a
 * round that was never a contest.
 */
export function scoreMushtarakDuoRound(artistIds: readonly [string, string]): MushtarakScoreDelta {
  const { participation } = MUSHTARAK.duo.scores;
  return { [artistIds[0]]: participation, [artistIds[1]]: participation };
}

export function scoreMushtarakRound(input: MushtarakRoundInput): MushtarakScoreDelta {
  const { artistIds, correctGuesserIds } = input;
  const delta: MushtarakScoreDelta = {};

  for (const playerId of correctGuesserIds) {
    delta[playerId] = (delta[playerId] ?? 0) + MUSHTARAK.scores.guesserCorrect;
  }

  // Both artists are paid together: neither drew the whole idea, so rewarding
  // them individually would misrepresent what happened.
  if (correctGuesserIds.length > 0) {
    for (const artistId of artistIds) {
      delta[artistId] = (delta[artistId] ?? 0) + MUSHTARAK.scores.artistsOnSuccess;
    }
  }

  return delta;
}
