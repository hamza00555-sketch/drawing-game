/**
 * المزوّر — word bank.
 *
 * Lives in shared/mozawwer.ts so the Cloud Function that picks the word draws
 * from exactly the same list. Selection criteria and the list itself are
 * documented there.
 */

export { MOZAWWER_WORDS, pickWord } from '../../../shared/mozawwer';
export type { WordEntry } from '../../../shared/mozawwer';
