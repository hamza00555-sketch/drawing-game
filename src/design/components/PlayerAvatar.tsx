import { AssetSlot } from '../../assets/AssetSlot';
import { characterAsset } from '../../assets/registry';
import { getCharacter } from '../../content/characters';

/**
 * A player, represented by their character.
 *
 * Status is carried by ink and opacity rather than by badges and glyphs: a
 * disconnected player fades and desaturates, a ready player gets a solid ink
 * outline. Where a label is genuinely needed it is Arabic text — never an icon
 * font and never an emoji.
 *
 * The character art is cropped to the head area, because at avatar sizes a full
 * body reduces to an unreadable smudge while the face still carries the
 * personality.
 */

export type PlayerStatus = 'idle' | 'ready' | 'active' | 'disconnected';

export interface PlayerAvatarProps {
  characterId: string;
  name: string;
  variant?: string;
  /** The pose to show. Lobby idles; gameplay may pass a reactive pose. */
  pose?: string;
  status?: PlayerStatus;
  isHost?: boolean;
  size?: 'sm' | 'md' | 'lg';
  /** Score badge, shown during and after a game. */
  score?: number;
  /**
   * Whether to render the name under the portrait. Off when the surrounding
   * layout already names the player — a row that prints the name beside the
   * avatar should not print it twice.
   */
  showName?: boolean;
}

const SIZE = {
  sm: { box: 'h-14 w-14', text: 'text-xs' },
  md: { box: 'h-20 w-20', text: 'text-sm' },
  lg: { box: 'h-28 w-28', text: 'text-base' },
} as const;

export function PlayerAvatar({
  characterId,
  name,
  variant = 'default',
  pose = 'idle',
  status = 'idle',
  isHost = false,
  size = 'md',
  score,
  showName = true,
}: PlayerAvatarProps) {
  const character = getCharacter(characterId);
  const dimensions = SIZE[size];
  const disconnected = status === 'disconnected';

  return (
    /*
     * w-full + min-w-0 so a long name cannot set the column width and overflow
     * its neighbours in a grid. max-w + shrink-0 so the same component does not
     * stretch to fill a horizontal flex row, which would push the row's other
     * content off the end.
     */
    <div className="flex w-full min-w-0 shrink-0 flex-col items-center gap-1 max-w-[7rem]">
      <div
        className={[
          'relative flex items-start justify-center overflow-hidden rounded-lg border-bold bg-paper-raised',
          dimensions.box,
          status === 'active'
            ? 'border-tomato shadow-2'
            : status === 'ready'
              ? 'border-ink shadow-1'
              : 'border-ink-hairline',
          disconnected ? 'opacity-40 grayscale' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {/*
         * The source art is full-body with the head at the top, so the frame
         * shows the top portion scaled up: `items-start` on the parent plus a
         * tall image means the head fills the box and the legs overflow below.
         * Anchoring to the bottom instead crops the face off entirely, which
         * defeats the whole point — these characters are read by their faces.
         */}
        <AssetSlot
          // fallbackToIdle: a missing reaction pose must not turn a roster or a
          // voting grid into a wall of placeholder boxes.
          id={characterAsset(characterId, pose, variant, true)}
          alt={character?.name ?? name}
          className="h-[165%] w-auto max-w-none -translate-y-[4%] object-contain object-top"
        />

        {typeof score === 'number' && (
          <span className="absolute bottom-0 left-0 rounded-tr-sm bg-ink px-1.5 font-display text-xs text-paper">
            {score}
          </span>
        )}
      </div>

      {/*
       * `w-full min-w-0` is what makes truncate actually work inside a grid
       * cell: without it the name sets the column's intrinsic width and a long
       * one ("عبدالرحمن الشمري") spills across its neighbours.
       */}
      {showName && (
        <>
          <p
            className={[
              'w-full min-w-0 truncate text-center font-body',
              dimensions.text,
              disconnected ? 'text-ink-faint' : 'text-ink',
            ].join(' ')}
            title={name}
          >
            {name}
          </p>

          {/*
           * Reserved height even when empty, so avatars with a status label do
           * not push their row out of alignment with those without one.
           */}
          <span className="min-h-4 font-body text-xs text-ink-faint">
            {disconnected ? 'غير متصل' : isHost ? 'المضيف' : ''}
          </span>
        </>
      )}
    </div>
  );
}
