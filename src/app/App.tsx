import { isFirebaseConfigured } from '../engine/firebase';
import { SetupNeededScreen } from './SetupNeededScreen';
import { PlaceholderScreen } from './PlaceholderScreen';

/**
 * App shell.
 *
 * Phase 0 boots into one of two states: a setup screen when Firebase config is
 * missing, or a placeholder for the real screens that arrive in Phase 2. The
 * router and providers land with those screens — wiring them now would be
 * scaffolding with nothing to route to.
 */
export function App() {
  if (!isFirebaseConfigured()) {
    return <SetupNeededScreen />;
  }

  return <PlaceholderScreen />;
}
