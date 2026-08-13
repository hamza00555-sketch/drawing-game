import { motion, useReducedMotion } from 'framer-motion';
import { AssetSlot } from '../../assets/AssetSlot';
import { characterAsset } from '../../assets/registry';
import { CHARACTERS } from '../../content/characters';

/**
 * Character picker — ten options, one per possible player.
 *
 * Shows the full body, not a cropped head: silhouette is how this cast is told
 * apart, so the choice is only meaningful at full height. The tile is sized so
 * ten fit on a phone without the grid turning into a wall of thumbnails, and
 * each tile stays a comfortable touch target.
 *
 * Characters already reserved by someone else are dimmed and unselectable
 * rather than hidden: a player who wanted one should see that it is taken, not
 * wonder where it went. `takenIds` comes from the room's reservation index, so
 * this reflects the actual database state and not local guesswork.
 */

export interface CharacterPickerProps {
  selectedId: string;
  selectedVariant: string;
  onSelect: (characterId: string, variant: string) => void;
  /** Character ids reserved by OTHER players in the room. */
  takenIds?: readonly string[];
  /** Shown when a claim lost a race. */
  error?: string;
}

export function CharacterPicker({
  selectedId,
  selectedVariant,
  onSelect,
  takenIds = [],
  error,
}: CharacterPickerProps) {
  const reduceMotion = useReducedMotion();
  const taken = new Set(takenIds);
  const selected = CHARACTERS.find((character) => character.id === selectedId);

  return (
    <div className="flex flex-col gap-3">
      <ul className="grid list-none grid-cols-4 gap-2 p-0 sm:grid-cols-5">
        {CHARACTERS.map((character) => {
          const isTaken = taken.has(character.id);
          const isSelected = character.id === selectedId;
          const variant = isSelected ? selectedVariant : 'default';

          return (
            <li key={character.id} className="min-w-0">
              <button
                type="button"
                disabled={isTaken}
                onClick={() => onSelect(character.id, 'default')}
                aria-pressed={isSelected}
                aria-label={isTaken ? `${character.name} — مأخوذة` : character.name}
                className={[
                  'flex min-h-tap w-full flex-col items-center gap-1 rounded-md border-bold p-1.5',
                  'transition-[transform,box-shadow] duration-instant ease-bounce',
                  isSelected
                    ? 'border-ink bg-paper-raised shadow-2'
                    : 'border-ink-hairline bg-paper',
                  isTaken ? 'cursor-not-allowed opacity-40' : 'active:translate-y-[2px]',
                ].join(' ')}
              >
                {/*
                 * A small squash-and-settle on selection: the one moment the
                 * character acknowledges being picked. Suppressed under
                 * reduced-motion, where the border and shadow still carry it.
                 */}
                <motion.span
                  className="flex h-14 w-full items-end justify-center"
                  animate={
                    reduceMotion || !isSelected
                      ? { scale: 1, y: 0 }
                      : { scale: [1, 1.18, 0.94, 1.04, 1], y: [0, -4, 1, 0, 0] }
                  }
                  transition={{ duration: 0.45, ease: 'easeOut' }}
                >
                  <AssetSlot
                    id={characterAsset(character.id, 'idle', variant)}
                    alt=""
                    decorative
                    className="max-h-full w-auto object-contain"
                  />
                </motion.span>

                {/* shortName, not name: a tile is ~66px wide at 320px, where
                    "الفنان المتفلسف" truncates to an unreadable stub. */}
                <span className="w-full min-w-0 truncate text-center font-body text-xs leading-tight text-ink">
                  {character.shortName}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {error && (
        <p role="alert" className="font-body text-sm text-tomato-deep">
          {error}
        </p>
      )}

      {selected && (
        <div className="rounded-md border-thin border-ink-hairline bg-paper-raised p-3">
          <p className="font-body text-sm text-ink-soft">{selected.blurb}</p>

          {selected.variants.length > 1 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {selected.variants.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => onSelect(selected.id, option.id)}
                  aria-pressed={option.id === selectedVariant}
                  className={[
                    'min-h-tap rounded-pill border-thin px-3 font-body text-sm',
                    'transition-colors duration-fast',
                    option.id === selectedVariant
                      ? 'border-ink bg-ink text-paper'
                      : 'border-ink-hairline text-ink-soft',
                  ].join(' ')}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
