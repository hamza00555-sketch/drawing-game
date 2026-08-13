import { useEffect, useState, type FormEvent } from 'react';
import { GameButton } from '../design/components/GameButton';
import { CharacterPicker } from '../design/components/CharacterPicker';
import { Screen } from '../design/components/Screen';
import { TextField } from '../design/components/TextField';
import { ROOM } from '../config/balance';
import { CHARACTERS, availableCharacters } from '../content/characters';
import { normalizeRoomCode } from '../engine/room';
import { useSession } from '../app/session';

/**
 * Create / Join.
 *
 * One screen serves both, because both need the same thing first — a name and a
 * character — and splitting them would make a player enter their identity twice
 * on a game night where rooms get remade constantly.
 *
 * The room code field is forced LTR: the codes are Latin and numeric, and
 * inside an RTL page an auto-directional field reorders them on screen, so a
 * player reads the code back to the room in the wrong order.
 */

export interface JoinScreenProps {
  intent: 'create' | 'join';
  onSubmit: (input: { name: string; characterId: string; variant: string; code: string }) => void;
  onBack: () => void;
  busy?: boolean;
  error?: string;
  /** Characters already taken, when joining a known room. */
  takenIds?: readonly string[];
}

export function JoinScreen({
  intent,
  onSubmit,
  onBack,
  busy = false,
  error,
  takenIds = [],
}: JoinScreenProps) {
  const session = useSession();

  const [name, setName] = useState(session.name);
  const [characterId, setCharacterId] = useState(
    session.characterId || (CHARACTERS[0]?.id ?? ''),
  );
  const [variant, setVariant] = useState(session.variant);
  const [code, setCode] = useState('');

  /*
   * The remembered character — or the first in the list — may already be taken
   * by the time this player opens the screen. Without this the picker shows a
   * dimmed, unselectable tile as the current selection and the join button
   * submits a character that will be rejected. Move to the first free one.
   */
  useEffect(() => {
    if (!takenIds.includes(characterId)) return;

    const free = availableCharacters(takenIds)[0];
    if (free) {
      setCharacterId(free.id);
      setVariant('default');
    }
  }, [takenIds, characterId]);

  const joining = intent === 'join';
  const codeReady = !joining || normalizeRoomCode(code).length === ROOM.codeLength;
  const canSubmit = name.trim().length > 0 && characterId.length > 0 && codeReady && !busy;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;

    session.setIdentity({ name, characterId, variant });
    onSubmit({ name, characterId, variant, code: normalizeRoomCode(code) });
  }

  return (
    <form onSubmit={handleSubmit} className="contents">
      <Screen
        footer={
          <>
            <GameButton tone="primary" size="lg" block type="submit" disabled={!canSubmit}>
              {busy ? 'لحظة...' : joining ? 'انضم' : 'أنشئ الغرفة'}
            </GameButton>
            <button
              type="button"
              onClick={onBack}
              className="min-h-tap font-body text-sm text-ink-faint underline underline-offset-4"
            >
              رجوع
            </button>
          </>
        }
      >
        <div className="flex flex-col gap-5 py-4">
          <h1 className="font-display text-2xl text-ink">
            {joining ? 'انضم بكود' : 'غرفة جديدة'}
          </h1>

          {joining && (
            <TextField
              label="كود الغرفة"
              code
              dir="ltr"
              inputMode="text"
              autoCapitalize="characters"
              autoComplete="off"
              spellCheck={false}
              maxLength={ROOM.codeLength}
              value={code}
              onChange={(event) => setCode(normalizeRoomCode(event.target.value))}
              placeholder={' '.repeat(ROOM.codeLength)}
            />
          )}

          <TextField
            label="اسمك"
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={16}
            placeholder="وش نناديك؟"
            autoComplete="nickname"
          />

          <div className="flex flex-col gap-2">
            <p className="font-body text-sm text-ink-soft">اختر شخصيتك</p>
            <CharacterPicker
              selectedId={characterId}
              selectedVariant={variant}
              takenIds={takenIds}
              onSelect={(nextId, nextVariant) => {
                setCharacterId(nextId);
                setVariant(nextVariant);
              }}
            />
          </div>

          {error && (
            <p role="alert" className="font-body text-sm text-tomato-deep">
              {error}
            </p>
          )}
        </div>
      </Screen>
    </form>
  );
}
