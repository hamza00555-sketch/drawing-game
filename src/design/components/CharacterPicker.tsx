import { AssetSlot } from '../../assets/AssetSlot';
import { characterAsset } from '../../assets/registry';
import { CHARACTERS } from '../../content/characters';

/**
 * Character picker.
 *
 * Shows the full body, not a cropped head: silhouette is how these characters
 * are told apart, so the choice is only meaningful at full height.
 *
 * Characters already claimed by someone in the room are dimmed and
 * unselectable rather than hidden, so a player who wanted one can see it is
 * taken instead of wondering where it went.
 */

export interface CharacterPickerProps {
  selectedId: string;
  selectedVariant: string;
  onSelect: (characterId: string, variant: string) => void;
  /** Character ids already claimed by other players in the room. */
  takenIds?: readonly string[];
}

export function CharacterPicker({
  selectedId,
  selectedVariant,
  onSelect,
  takenIds = [],
}: CharacterPickerProps) {
  const taken = new Set(takenIds);
  const selected = CHARACTERS.find((character) => character.id === selectedId);

  return (
    <div className="flex flex-col gap-3">
      <ul className="grid list-none grid-cols-3 gap-2 p-0">
        {CHARACTERS.map((character) => {
          const isTaken = taken.has(character.id);
          const isSelected = character.id === selectedId;
          const variant = isSelected ? selectedVariant : 'default';

          return (
            <li key={character.id}>
              <button
                type="button"
                disabled={isTaken}
                onClick={() => onSelect(character.id, 'default')}
                aria-pressed={isSelected}
                className={[
                  'flex min-h-tap w-full flex-col items-center gap-1 rounded-md border-bold p-2',
                  'transition-[transform,box-shadow] duration-instant ease-bounce',
                  isSelected
                    ? 'border-ink bg-paper-raised shadow-2'
                    : 'border-ink-hairline bg-paper',
                  isTaken ? 'cursor-not-allowed opacity-35' : 'active:translate-y-[2px]',
                ].join(' ')}
              >
                <AssetSlot
                  id={characterAsset(character.id, 'idle', variant)}
                  alt={character.name}
                  className="h-20 w-auto object-contain"
                />
                <span className="font-body text-xs leading-tight text-ink">
                  {character.name}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

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
