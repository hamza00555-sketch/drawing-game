# وش ذا؟ — Architecture

> Backend: **Firebase**. There is no Postgres, no SQL, no row-level security and
> no Supabase anywhere in this project. If you find a reference to any of those,
> it is stale and should be deleted.

---

## 1. Stack

| Layer | Choice |
|---|---|
| UI | React 18 + TypeScript, Vite |
| Styling | Tailwind bound to custom tokens (`src/design/tokens.css`) |
| Client state | Zustand |
| Motion | Framer Motion |
| Auth | Firebase **Anonymous Authentication** |
| Live state | Firebase **Realtime Database** |
| Trusted logic | Firebase **Cloud Functions**, used sparingly |
| Files | Firebase Storage — exported posters only |
| Hosting | **Vercel** (Firebase Hosting is not used) |

**Why Realtime Database and not Firestore.** This game's traffic is a stream of
small, hot, ordered writes: stroke chunks, phase flips, turn handoffs, votes.
RTDB is built for exactly that — one persistent socket, sub-100ms fan-out, cheap
partial updates at a path. Firestore's document/query model, higher per-op
latency and per-document write ceiling all work against a mode whose entire turn
lasts two seconds. Firestore is not banned; it is simply not the default. It
would need a concrete reason tied to a specific data shape.

---

## 2. Data model

The tree is split into small sibling subtrees on purpose. There is **no single
fat game-state object**. A stroke arriving must not wake the scoreboard
listener, and a score change must not re-deliver the player list. Every listener
subscribes to the narrowest path that answers its question.

```
roomCodes/{code}                       -> roomId          (join lookup)

rooms/{roomId}
  code  hostId  status  currentMode  createdAt
  settings/                                                (live balance)

roomPlayers/{roomId}/{playerId}
  name  characterId  ready  joinedAt

playerScores/{roomId}/{playerId}                           (server-written only)

presence/{roomId}/{playerId}
  connected  lastSeen                                      (onDisconnect)

games/{roomId}/current                                     (member-readable)
  gameId  mode  phase  phaseEndsAt  currentPlayerId
  turnOrder/  activeDrawers/  round

gameSecrets/{roomId}/{gameId}                              (readable by NOBODY)
  word?  impostorId?  forbidden/?  partA?  partB?  full?  seed?

playerSecrets/{roomId}/{gameId}/{playerId}
  role  word?                                              (owner-readable only)

strokes/{roomId}/{gameId}/{strokeId}                       (one shared canvas)
linkStrokes/{roomId}/{gameId}/{index}/{strokeId}           (كانت إيش؟ only)
votes/{roomId}/{gameId}/{voterId}                          (sealed until reveal)
voteMarks/{roomId}/{gameId}/{voterId}                      (who voted, not for whom)
guesses/{roomId}/{gameId}/{guessId}
chains/{roomId}/{gameId}/{index}
```

Paths are never written as string literals in app code — they are built in
`src/engine/paths.ts`, so a rename cannot silently desync the client from the
rules file.

Note `playerScores` sits outside `roomPlayers`. That separation is what lets a
player own and write their own profile node while being structurally unable to
touch their own score.

---

## 3. Secrecy — the impostor never receives the word

This is the single most important invariant in the codebase.

A naive implementation sends every client the same payload and hides part of it
in the UI:

```ts
// NEVER. The word is on the impostor's device; DevTools reveals it instantly.
{ word: 'فيل', isImpostor: true }
```

Instead, each player reads only their own node under `playerSecrets`:

```jsonc
// artist
{ "role": "artist", "word": "فيل" }

// impostor — the `word` key does not exist
{ "role": "impostor" }
```

Enforced by one rule:

```json
"playerSecrets": {
  "$roomId": { "$gameId": { "$playerId": {
    ".read": "auth != null && auth.uid === $playerId",
    ".write": false
  }}}
}
```

The impostor cannot read another player's node, and their own node has nothing
to leak. Listening to the raw path, inspecting network frames or pausing the
debugger all return the same thing: no word. Secrecy is a property of the data
model, not of a conditional in a component.

The same pattern makes كانت إيش؟ blind: a player may read only the chain link
that feeds their turn, until the phase reaches reveal.

### The corollary: nothing secret may sit on the game node

`games/{roomId}/current` is readable by every member of the room, because
phases, deadlines and turn order have to be. Read rules in Realtime Database
**cascade downwards and cannot be revoked further down the tree**, so a `word`
child hanging off that node would be world-readable to the room regardless of
any rule written beneath it.

So a round's private facts live in a sibling subtree, `gameSecrets`, which is
`.read: false` and `.write: false` for everyone. Only the Admin SDK sees it:

| mode | what it holds |
|---|---|
| المزوّر | `word`, `impostorId` |
| كمّل رسمتي | `word` |
| الممنوعات | `word`, `forbidden` |
| الرسم المشترك | `partA`, `partB`, `full` |
| كانت إيش؟ | `seed` |

When a round ends, whatever the room has earned the right to know is **copied**
into the public node — `revealedWord`, `impostorId`, `full`, `seed`. Revealing
is an explicit act, never the absence of one.

`src/engine/roundSecrecy.test.ts` fails the build if a secret key reappears in
a setup payload. That mistake is invisible in play — the game works perfectly
and the impostor simply reads the answer — so it needs a test, not a review.

### Two subtrees that exist purely for secrecy

**`linkStrokes`** — كانت إيش؟ draws into one bucket per link, not the shared
`strokes` node. Sharing it would put every drawing in the chain behind one
member-readable path, and a player could read backwards to the sentence the
room started from. Each link's strokes sit behind the same `visibleTo` grant
that gates the link text, so a player can read exactly two things: the link
feeding their turn, and the one they are drawing now.

**`voteMarks`** — `votes` stays sealed until the reveal, which is right: a
running tally would let the room watch an accusation build and pile on. But a
voting screen with no sign of progress reads as broken, so each voter drops a
separate mark carrying one fact — "this player is done" — which is safe to
share.

---

## 4. Authority

Client-authoritative state is limited to things a player legitimately owns:
their profile, their presence, their vote, their guess, their strokes during
their own turn.

Everything that decides an outcome is server-authoritative and `".write": false`
for clients:

- who the impostor is, and which word was chosen
- turn order and the current player
- phase transitions and `phaseEndsAt`
- score calculation
- guess correctness and rank

**Cloud Functions are used where rules genuinely cannot express the logic** —
role/word assignment, scoring, and phase advancement — and nowhere else. The
guiding constraint is latency: a mode with a two-second turn cannot afford a
cold start on its critical path, so structure and rules do as much work as
possible before a Function is reached for.

### Host migration without a Function

Losing the host must never end the party. Rather than a Function watching for
disconnects, one narrow rule allows a connected member to claim `hostId` **only
while the current host is provably disconnected**:

```
".write": "root.child('presence')...child(data.val()).child('connected').val() === false
        && root.child('presence')...child(auth.uid).child('connected').val() === true"
```

Clients independently pick the oldest connected player by `joinedAt`, so they
agree without coordinating. If two claim simultaneously, last-write-wins is
harmless — every candidate was a valid host. The host cannot be stolen while
they are online.

---

## 5. Presence

`presence/{roomId}/{playerId}` is driven by `.info/connected` plus
`onDisconnect().update({ connected: false, lastSeen: ServerValue.TIMESTAMP })`,
registered **before** marking online so a mid-registration drop still cleans up.
Disconnected players keep their seat and score for
`ROOM.reconnectGraceMs` — dropping off the bus should not wipe your points.

---

## 6. Time

No gameplay timer reads `Date.now()`. An ESLint rule enforces this.

Deadlines are written server-side as `ServerValue.TIMESTAMP` into `phaseEndsAt`.
Clients subscribe to `.info/serverTimeOffset` and read the corrected clock
through `serverNow()` / `msUntil()` in `src/engine/clock.ts`.

This matters most in كمّل رسمتي: a 3-second countdown followed by as little as
2 seconds of drawing. A device whose clock is half a second fast would silently
rob its player of a fifth of their turn. Device clocks are routinely minutes off.

---

## 7. Drawing

### Data, not pixels

No PNG exists during play. A stroke is:

```ts
{ id, roundId, playerId, seq, tool: 'pen' | 'eraser',
  color, width, points: [{ x, y, t }], startedAt }
```

Coordinates are **normalized 0..1**, never pixels, so the same stroke rebuilds
identically on a 320px phone and a tablet. Storing vectors plus author and order
is what makes replay, undo, per-player contribution colouring, reconnect rebuild
and poster export all fall out of one representation.

### Local-first

The pen must never feel like the network.

1. Pointer event renders to the local canvas immediately.
2. Points accumulate in a buffer.
3. The buffer flushes as a chunk roughly every 50ms.
4. The completed stroke is committed once, at stroke end.

There is **no database write per pointer event**. A slow connection degrades how
quickly others see your line, never how your own pen feels.

---

## 8. Engine / mode split

`src/engine/` owns everything multiplayer: rooms, presence, clock, networking,
canvas, FSM, scoring primitives. It knows nothing about any specific mode.

`src/modes/{mode}/` owns only:

- `machine.ts` — states and transitions
- `rules.ts` — permissions: who draws, who sees what
- `screens/` — round-specific UI
- `content.ts` — words, prompts, combinations
- `{Mode}Game.tsx` — the container that maps live state onto those screens

Multiplayer logic is never duplicated into a mode. Adding a sixth mode should
mean adding a folder and one line in `src/app/GameRouter.tsx`, not touching the
engine.

A container is a translator and nothing more: subscriptions in, screen props
out, and calls to trusted logic for anything that decides an outcome. If a
container starts deciding something, it is in the wrong file — that belongs in
`rules.ts` beside it, or in `functions/`. The shared pieces every container uses
(`usePlayerSecret`, `useDeadline`, the props contract) live in
`src/modes/liveRound.ts`.

---

## 9. Balance

Every tunable number lives in `src/config/balance.ts` and is copied into
`rooms/{roomId}/settings` at creation, so a live playtest can be re-tuned from
the host device without a redeploy. No component or Function may hardcode a
duration or a score.

Rules, not just numbers, are configurable where the design is genuinely
uncertain. `readyToVoteRule` (`any_player | host_only | majority`) is the
example: `any_player` is the fun default, but it hands the impostor a possible
exploit — ending the drawing early before their weak contribution is exposed.
The alternative is a settings change, not a code change.

---

## 10. Art pipeline

Every visual element is generated with **Higgsfield** per `ART_BIBLE.md` and
recorded in `ASSET_MANIFEST.md`. Artwork enters the UI through exactly one
component, `<AssetSlot />`, which renders a neutral `[ASSET: id]` box when a file
has not landed yet.

Forbidden, and checked automatically by `npm run check:purity`:
emoji, inline `<svg>` illustration, CSS-drawn characters, procedural doodles,
and icon libraries used as identity.

Functional UI — buttons, panels, inputs, layout, the canvas itself — is built in
code as normal. The line is: the moment an element becomes an illustration,
icon, character or decorative graphic, it comes from Higgsfield.

---

## 11. Performance

The canvas is a separate layer from character animation. Drawing runs in one
`requestAnimationFrame` loop. Character motion is restricted to `transform` and
`opacity` so it stays on the compositor, and is suspended entirely while a pen
is active. Network sends are batched, never per-event. Target: 60fps while
drawing on a mid-range phone.

---

## 12. Audio

Not produced yet, but the seams exist: `AUDIO_CUES` in `src/config/balance.ts`
enumerates every hook (button, stroke, timer, countdown, correct, wrong, reveal,
vote, suspense, win, lose, character reaction) so adding sound later is wiring,
not surgery.

---

## 13. Shared logic

`shared/` is compiled into **both** the client bundle and the Cloud Functions
build. It holds anything the server must decide and the client must predict
identically: mode balance constants, word banks, vote tallying, guess
normalisation and scoring.

A copy inside `functions/` would be free to drift, and a scoring rule that
differs between the screen and the server reads to players as the game lying to
them. `functions/tsconfig.json` therefore sets `rootDir` to the repo root and
includes `../shared`, which is why its build output lands at
`lib/functions/src/index.js`.

Keep `shared/` dependency-free: it is consumed by an ES module bundler and by a
CommonJS Node build, so it must not reach for anything from either side.

## 14. What the Cloud Functions own

Only what rules cannot express:

- `startMozawwerRound` — picks the word, the impostor and a shuffled turn order,
  and writes each player's secret to their own node. The impostor's node has no
  `word` key at all.
- `advanceMozawwer` — every phase transition, in one place: begin drawing, end a
  turn, honour the ready-to-vote rule, close voting and tally, stage the reveal,
  run the impostor's last guess, and award points.
- `startKammilRound` / `advanceKammil`, `startMamnouRound` / `beginMamnouDrawing`
  / `submitMamnouGuess` / `endMamnouRound`, `startMushtarakRound` /
  `advanceMushtarak`, `startKanatEshRound` / `submitKanatEshLink` /
  `kanatEshToResult` — the same shape for the other four modes.
- `returnToLobby` — clears `games/{roomId}/current`. Not housekeeping: the rule
  on `currentMode` refuses while a game exists, so a finished round left in
  place would lock the room into one mode forever.

### Who tells the server that a deadline passed

Deadlines are the server's, but something has to announce that the moment
arrived. The rule throughout is **one owner, one shadow**:

- the player the phase belongs to — the artist whose turn it is, the author of
  the current chain link — closes their own deadline;
- the host shadows it, so a player who puts their phone down cannot freeze the
  room.

Both may fire in the same instant, so each call carries what it believes it is
ending (`turnIndex`) or is accepted only after the deadline has genuinely
passed (`closeGuess`, `closeImpostorGuess`, a timed-out chain link). Without
that, artist and host firing together would skip an entire turn.

Everything else — strokes, presence, votes, guesses, character reservations — is
written directly by clients under security rules, because a Cloud Function on a
latency-sensitive path costs a cold start this game cannot afford.

Scores are written **only** inside `finishRound`. That is what makes
`playerScores` safe to leave `".write": false` for every client.

---

## 15. The five modes

All five share the engine, the canvas, the room model and the design system.
Each contributes only its rules, its phases, its content and its round UI.

| Mode | Shape | What is secret | Replay |
|---|---|---|---|
| **المزوّر** | Turn-based shared canvas → vote → reveal | The word, from one player | Optional |
| **كمّل رسمتي** | Locked countdown → 2–5s turns → blind guess | The word, from the guesser | Yes — the point |
| **الممنوعات** | One artist, simultaneous guessing | The word and its forbidden list | No |
| **الرسم المشترك** | Two artists at once on one canvas | Each artist's half of the prompt | Yes |
| **كانت إيش؟** | Blind chain: text → drawing → text | Every link but the one feeding your turn | No — the poster is the payoff |

Their shared logic lives in `shared/mozawwer.ts`, `shared/kammil.ts`,
`shared/mamnou3at.ts`, `shared/mushtarak.ts` and `shared/kanatEsh.ts` — each
compiled into both the client bundle and the Cloud Functions build.

### Two structures worth knowing about

**`activeDrawers`** exists for الرسم المشترك alone. Every other mode gates
strokes on `currentPlayerId`; that mode is the only one where two players may
write strokes at the same moment, and the stroke rule checks both.

**`visibleTo`** exists for كانت إيش؟ alone. It is a per-link map of which player
may read which chain link, replaced wholesale on every turn so the previous
player's grant is revoked. The `chains` security rule checks exactly that node,
and `canReadLink()` in the mode mirrors it — either alone would be a single
point of failure for the only secret that mode has.

### One thing deliberately not automated

كانت إيش؟ does not judge whether a link was interpreted "faithfully". Deciding
whether a drawing matched a sentence is a human call, and a bad automatic
verdict would hand out points the room disagrees with. Every player is scored
for completing the chain; the faithful-link bonus is left for a future vote.
