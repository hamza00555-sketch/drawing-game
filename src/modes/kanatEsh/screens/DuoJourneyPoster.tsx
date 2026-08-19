import { JourneyPoster, type JourneyLink } from './JourneyPoster';
import type { RoomPlayer } from '../../../engine/presence';

/**
 * كانت إيش؟ Duo — two Final Journey Posters side by side.
 *
 * Each track is a complete, independent chain, so this reuses `JourneyPoster`
 * unchanged, twice — one call per track — rather than teaching that
 * component a second layout. The group ruleset's single-chain poster stays
 * exactly what it always was.
 */

export interface DuoJourneyPosterProps {
  seedA: string;
  seedB: string;
  linksA: readonly JourneyLink[];
  linksB: readonly JourneyLink[];
  players: Record<string, RoomPlayer>;
}

export function DuoJourneyPoster({
  seedA,
  seedB,
  linksA,
  linksB,
  players,
}: DuoJourneyPosterProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <JourneyPoster seed={seedA} links={linksA} players={players} />
      <JourneyPoster seed={seedB} links={linksB} players={players} />
    </div>
  );
}
