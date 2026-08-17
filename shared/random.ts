/**
 * Fisher-Yates shuffle, shared by every mode that needs an unbiased random
 * order — turn order, author rotation, role assignment. Kept in one place so
 * "random" means the same thing everywhere instead of each mode reinventing
 * (and occasionally forgetting) it.
 */
export function shuffle<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.min(Math.floor(random() * (i + 1)), i);
    [out[i], out[j]] = [out[j] as T, out[i] as T];
  }
  return out;
}
