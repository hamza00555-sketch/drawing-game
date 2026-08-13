import { StaticDrawing } from '../../../design/components/StaticDrawing';
import type { Stroke } from '../../../engine/canvas/strokes';
import type { RoomPlayer } from '../../../engine/presence';

/**
 * The Final Journey Poster.
 *
 * The whole chain in order: the seed sentence, then every drawing and every
 * interpretation, each captioned with who made it. This is the payoff of the
 * mode and the thing people actually screenshot, so it is built as a document
 * rather than a results list.
 *
 * Two rules drive the layout:
 *
 *   1. **Never shrink the drawings to fit.** A ten-link chain gets a long
 *      scrolling poster, not ten thumbnails. If the drawings are too small to
 *      read, the poster has failed at the only thing it exists to do.
 *   2. **Start and end are called out explicitly.** "بدأنا بـ / وانتهينا بـ"
 *      is the punchline — the distance between them is the joke, and burying
 *      the first and last links in the middle of a list loses it.
 */

export interface JourneyLink {
  index: number;
  type: 'text' | 'drawing';
  playerId: string;
  /** Sentence for text links. */
  text?: string;
  /** Strokes for drawing links. */
  strokes?: readonly Stroke[];
}

export interface JourneyPosterProps {
  seed: string;
  links: readonly JourneyLink[];
  players: Record<string, RoomPlayer>;
  /** Rendered for export: removes interactive chrome and fixes the width. */
  forExport?: boolean;
}

export function JourneyPoster({ seed, links, players, forExport = false }: JourneyPosterProps) {
  const lastText = [...links].reverse().find((link) => link.type === 'text');

  return (
    <article
      className={[
        'wt-paper-ground flex flex-col gap-4 rounded-lg border-bold border-ink p-4',
        forExport ? 'w-[36rem]' : 'w-full',
      ].join(' ')}
    >
      <header className="text-center">
        <h2 className="font-display text-2xl text-ink">وش ذا؟</h2>
        <p className="font-body text-xs text-ink-faint">كانت إيش؟</p>
      </header>

      <section className="rounded-md border-bold border-ink bg-paper-raised p-3">
        <p className="font-body text-sm text-ink-soft">بدأنا بـ</p>
        <p className="mt-1 font-display text-lg text-ink">{seed}</p>
      </section>

      <ol className="flex list-none flex-col gap-4 p-0">
        {links.map((link) => {
          const player = players[link.playerId];

          return (
            <li key={link.index} className="flex flex-col gap-1">
              {link.type === 'drawing' ? (
                /*
                 * A fixed aspect box, not a thumbnail. Drawings keep a readable
                 * size however long the chain gets — the poster scrolls instead.
                 */
                <div className="relative aspect-[4/3] w-full rounded-md border-bold border-ink">
                  <StaticDrawing strokes={link.strokes ?? []} />
                </div>
              ) : (
                <div className="rounded-md border-thin border-ink-hairline bg-paper p-3">
                  <p className="font-body text-base text-ink">{link.text}</p>
                </div>
              )}

              <p className="text-center font-body text-xs text-ink-faint">
                {link.type === 'drawing' ? 'رسمها' : 'كتبها'} {player?.name ?? '...'}
              </p>
            </li>
          );
        })}
      </ol>

      {lastText && (
        <section className="rounded-md border-bold border-tomato bg-paper-raised p-3">
          <p className="font-body text-sm text-ink-soft">وانتهينا بـ</p>
          <p className="mt-1 font-display text-lg text-ink">{lastText.text}</p>
        </section>
      )}

      {/*
       * Branding, once, small, at the bottom. The poster should be worth
       * sharing on its own terms — a large watermark would make it read as an
       * advert rather than as the room's own artefact.
       */}
      <footer className="text-center">
        <p className="font-body text-xs text-ink-faint">وش ذا؟ — لعبة رسم وتخمين</p>
      </footer>
    </article>
  );
}
