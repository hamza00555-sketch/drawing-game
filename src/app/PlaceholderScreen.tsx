import { AssetSlot } from '../assets/AssetSlot';

/**
 * Temporary landing state for a correctly configured install, until Phase 2
 * delivers Splash / Home / Lobby. It doubles as a live check that the token
 * layer, the RTL shell and <AssetSlot /> placeholders all render correctly.
 */
export function PlaceholderScreen() {
  return (
    <main className="wt-screen wt-paper-ground">
      <div className="mx-auto flex w-full max-w-content flex-1 flex-col items-center justify-center gap-5 text-center">
        <h1 className="font-display text-3xl text-ink">وش ذا؟</h1>

        <AssetSlot id="hero_home_confused_group" className="w-full max-w-[20rem]" />

        <p className="font-body text-base text-ink-soft">
          الأساس جاهز. الشاشات تُبنى في المرحلة الثانية.
        </p>
      </div>
    </main>
  );
}
