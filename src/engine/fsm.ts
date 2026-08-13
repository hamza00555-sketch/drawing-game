/**
 * A tiny typed finite state machine.
 *
 * Every mode declares its phases and legal transitions here rather than
 * accumulating boolean flags (`isDrawing`, `hasVoted`, `showingResult`...).
 * Flags multiply into states nobody enumerated; a machine makes the illegal
 * ones unrepresentable and the legal ones reviewable in one place.
 *
 * This is deliberately ~80 lines instead of a dependency. The engine needs
 * exactly two things — "is this transition legal" and "what does this phase
 * permit" — and a full statechart library would ship interpreters, actors and
 * history states we would never use.
 */

export interface PhaseDefinition<TPhase extends string> {
  /** Phases reachable from here. An empty list marks a terminal phase. */
  next: readonly TPhase[];
  /**
   * Whether this phase is time-boxed. Timed phases must have a server-stamped
   * `phaseEndsAt`; untimed ones advance on an explicit action.
   */
  timed: boolean;
  /** Human-readable purpose, surfaced in dev tooling and logs. */
  describe: string;
}

export type MachineDefinition<TPhase extends string> = {
  readonly initial: TPhase;
  readonly phases: Readonly<Record<TPhase, PhaseDefinition<TPhase>>>;
};

export class StateMachine<TPhase extends string> {
  readonly definition: MachineDefinition<TPhase>;

  constructor(definition: MachineDefinition<TPhase>) {
    this.definition = definition;
  }

  get initial(): TPhase {
    return this.definition.initial;
  }

  phase(phase: TPhase): PhaseDefinition<TPhase> {
    const found = this.definition.phases[phase];
    if (!found) {
      throw new Error(`Unknown phase "${phase}"`);
    }
    return found;
  }

  canTransition(from: TPhase, to: TPhase): boolean {
    return this.definition.phases[from]?.next.includes(to) ?? false;
  }

  /**
   * Throws on an illegal transition. Used by trusted logic so a bug surfaces
   * loudly at the point of corruption rather than as a confusing UI state
   * three screens later.
   */
  assertTransition(from: TPhase, to: TPhase): void {
    if (!this.canTransition(from, to)) {
      throw new Error(
        `Illegal transition ${String(from)} -> ${String(to)}. ` +
          `Allowed: ${this.phase(from).next.join(', ') || '(terminal)'}`,
      );
    }
  }

  isTimed(phase: TPhase): boolean {
    return this.phase(phase).timed;
  }

  isTerminal(phase: TPhase): boolean {
    return this.phase(phase).next.length === 0;
  }

  /** All phases, for exhaustiveness checks and dev tooling. */
  allPhases(): TPhase[] {
    return Object.keys(this.definition.phases) as TPhase[];
  }

  /**
   * Verifies every declared transition target exists and that every phase is
   * reachable from the initial one. Called in tests so a typo in a mode's
   * machine fails the suite instead of stranding players mid-game.
   */
  validate(): void {
    const all = new Set(this.allPhases());

    for (const from of all) {
      for (const to of this.phase(from).next) {
        if (!all.has(to)) {
          throw new Error(`Phase "${from}" points at unknown phase "${to}"`);
        }
      }
    }

    const reachable = new Set<TPhase>([this.initial]);
    const queue: TPhase[] = [this.initial];
    while (queue.length > 0) {
      const current = queue.shift() as TPhase;
      for (const to of this.phase(current).next) {
        if (!reachable.has(to)) {
          reachable.add(to);
          queue.push(to);
        }
      }
    }

    const orphans = [...all].filter((phase) => !reachable.has(phase));
    if (orphans.length > 0) {
      throw new Error(`Unreachable phase(s): ${orphans.join(', ')}`);
    }
  }
}

export function defineMachine<TPhase extends string>(
  definition: MachineDefinition<TPhase>,
): StateMachine<TPhase> {
  return new StateMachine(definition);
}
