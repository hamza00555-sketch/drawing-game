import { MozawwerGame } from '../modes/mozawwer/MozawwerGame';
import { KammilGame } from '../modes/kammil/KammilGame';
import { MamnouGame } from '../modes/mamnou3at/MamnouGame';
import { MushtarakGame } from '../modes/mushtarak/MushtarakGame';
import { KanatEshGame } from '../modes/kanatEsh/KanatEshGame';
import type { LiveRoundProps } from '../modes/liveRound';

/**
 * Which mode is on screen.
 *
 * The engine has no idea what a mode is, and a mode has no idea how rooms,
 * presence or strokes work. This file is the seam, and it is deliberately the
 * only place that knows the full list — adding a sixth mode should mean one new
 * container and one new line here.
 */
export function GameRouter(props: LiveRoundProps) {
  switch (props.game.mode) {
    case 'mozawwer':
      return <MozawwerGame {...props} />;
    case 'kammil':
      return <KammilGame {...props} />;
    case 'mamnou3at':
      return <MamnouGame {...props} />;
    case 'mushtarak':
      return <MushtarakGame {...props} />;
    case 'kanatEsh':
      return <KanatEshGame {...props} />;

    default:
      // A round started by a newer build than this device is running. Saying so
      // beats a blank screen the player cannot explain.
      return (
        <div className="wt-screen wt-paper-ground items-center justify-center p-6 text-center">
          <p className="font-body text-base text-ink-soft">
            هذي الجولة تحتاج نسخة أحدث من اللعبة.
          </p>
        </div>
      );
  }
}
