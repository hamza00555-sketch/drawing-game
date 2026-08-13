import { AssetSlot } from '../assets/AssetSlot';
import { CHARACTERS } from '../content/characters';

/**
 * Temporary landing state for a correctly configured install, until Phase 2
 * delivers Splash / Home / Lobby.
 *
 * It doubles as a live check on the pieces that are easy to get quietly wrong:
 * the token layer, the RTL shell, real artwork through <AssetSlot />, and the
 * labelled placeholder for art that has not been generated yet.
 */
export function PlaceholderScreen() {
  return (
    <main className="wt-screen wt-paper-ground">
      <div className="mx-auto flex w-full max-w-content flex-1 flex-col gap-6 py-6">
        <header className="text-center">
          <h1 className="font-display text-3xl text-ink">وش ذا؟</h1>
          <p className="mt-2 font-body text-base text-ink-soft">
            الأساس والشخصيات جاهزة. الشاشات تُبنى في المرحلة الثانية.
          </p>
        </header>

        <section>
          <h2 className="font-display text-lg text-ink">الشخصيات</h2>
          <ul className="mt-3 grid list-none grid-cols-2 gap-3 p-0">
            {CHARACTERS.map((character) => (
              <li
                key={character.id}
                className="flex flex-col items-center rounded-md border-thin border-ink-hairline bg-paper-raised p-3 text-center"
              >
                <AssetSlot
                  id={character.idleAsset}
                  alt={character.name}
                  className="h-28 w-auto object-contain"
                />
                <h3 className="mt-2 font-display text-base text-ink">{character.name}</h3>
                <p className="font-body text-xs leading-snug text-ink-soft">
                  {character.blurb}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="font-display text-lg text-ink">في انتظار التوليد</h2>
          <AssetSlot id="hero_home_confused_group" className="mt-3 w-full" />
        </section>
      </div>
    </main>
  );
}
