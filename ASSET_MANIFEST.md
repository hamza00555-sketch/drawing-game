# وش ذا؟ — Asset Manifest

Every visual asset in the game, generated or queued. Nothing renders in the app
that is not listed here.

**Workflow for any new asset**

1. Read `ART_BIBLE.md`.
2. Define what the asset must communicate.
3. Write the prompt from the §13 template.
4. Generate with **Higgsfield**.
5. Check against the §14 acceptance checklist.
6. If it fails, regenerate — never hand-fix, never redraw in code.
7. Add the row here and register it in `src/assets/registry.ts`.

**Status values:** `queued` · `generating` · `review` · `shipped` · `rejected`

---

## Batch 1 — Style anchor and cast

The style anchor is generated first and used as the visual reference for every
subsequent generation, so the whole game stays in one world.

| id | purpose | character | expression | size | transparent | screens | status | file |
|---|---|---|---|---|---|---|---|---|
| `style_anchor_cast` | Master style reference: several characters together, establishes line, palette, shading | all | mixed | 2048×1152 | no | none (reference only) | queued | — |
| `char_artist_idle` | الفنان المتفلسف, neutral | artist | idle | 1024×1024 | yes | Lobby, Avatar | queued | — |
| `char_detective_idle` | المحقق, neutral | detective | idle | 1024×1024 | yes | Lobby, Avatar | queued | — |
| `char_confused_idle` | الملخبط, neutral | confused | idle | 1024×1024 | yes | Lobby, Avatar | queued | — |
| `char_excited_idle` | المتحمس, neutral | excited | idle | 1024×1024 | yes | Lobby, Avatar | queued | — |
| `char_innocent_idle` | البريء المشبوه, neutral | innocent | idle | 1024×1024 | yes | Lobby, Avatar | queued | — |
| `char_critic_idle` | الناقد, neutral | critic | idle | 1024×1024 | yes | Lobby, Avatar | queued | — |

## Batch 2 — Entry screens

| id | purpose | character | expression | size | transparent | screens | status | file |
|---|---|---|---|---|---|---|---|---|
| `hero_home_confused_group` | Home hero: a group squinting at one baffling drawing — the moment the game is named after | group | confused | 1600×1200 | yes | Home | queued | — |
| `splash_backdrop` | Splash artwork behind the wordmark | group | mixed | 1200×1600 | no | Splash | queued | — |

## Batch 3 — Mode selection scenes

Each mode is sold by a mini cartoon scene that explains the idea visually.
Not an icon in a grid.

| id | purpose | size | transparent | screens | status | file |
|---|---|---|---|---|---|---|
| `mode_scene_mozawwer` | One creature bluffing while others draw confidently | 800×600 | yes | Mode Selection | queued | — |
| `mode_scene_mamnou3at` | An artist straining not to draw the obvious thing | 800×600 | yes | Mode Selection | queued | — |
| `mode_scene_mushtarak` | Two creatures drawing on one canvas, pulling in different directions | 800×600 | yes | Mode Selection | queued | — |
| `mode_scene_kammil` | A drawing passed hand to hand, growing stranger | 800×600 | yes | Mode Selection | queued | — |
| `mode_scene_kanat_esh` | A chain of misunderstanding, word to drawing to word | 800×600 | yes | Mode Selection | queued | — |

## Batch 4 — Gameplay moments

Generated alongside the screens that use them.

| id | purpose | screens | status |
|---|---|---|---|
| `reveal_role_artist` | "ارسم" role card art | Role Reveal | queued |
| `reveal_role_impostor` | "أنت المزوّر" role card art | Role Reveal | queued |
| `countdown_3_surprised` | Countdown beat 3: sees the drawing, startled | كمّل رسمتي | queued |
| `countdown_2_grabs_pen` | Countdown beat 2: grabs the pen | كمّل رسمتي | queued |
| `countdown_1_ready` | Countdown beat 1: braced to draw | كمّل رسمتي | queued |
| `reaction_correct` | Celebration on a correct guess | all modes | queued |
| `reaction_wrong` | Baffled stare on a wrong guess | all modes | queued |
| `reaction_timer_panic` | Rising panic as time runs out | all modes | queued |
| `reaction_pen_dropped` | Pen lost the instant time expires | كمّل رسمتي | queued |
| `unmask_impostor` | The mask comes off — dramatic reveal | المزوّر | queued |
| `accusation_group` | Everyone pointing at the unmasked impostor | المزوّر | queued |
| `poster_frame_decor` | Decorative border elements for the share poster | كانت إيش؟ | queued |

## Batch 5 — Functional icons

Only generated once the tool UI is settled. Until then the drawing tools use
Arabic text labels, which is the sanctioned temporary fallback — never an emoji
and never an icon-pack glyph.

| id | purpose | screens | status |
|---|---|---|---|
| `icon_pen` | Pen tool | Drawing | queued |
| `icon_eraser` | Eraser tool | Drawing | queued |
| `icon_undo` | Undo | Drawing | queued |
| `symbol_got_you` | The "فهمتك" signal | الرسم المشترك | queued |

---

## Notes

- Nothing is `shipped` yet. Every `<AssetSlot />` in the app currently renders a
  neutral `[ASSET: id]` placeholder, which is intended and reviewable.
- Character expression variants beyond `idle` are generated on demand with the
  screen that needs them, to avoid spending credits on poses that may be cut.
- Sizes are generation targets; final files are exported at 2× the largest
  on-screen size and compressed.
