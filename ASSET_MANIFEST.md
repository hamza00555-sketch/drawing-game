# وش ذا؟ — Asset Manifest

Every visual asset in the game, generated or queued. Nothing renders in the app
that is not listed here.

## Naming

Character art is `{character}_{variant}_{pose}`:

```
artist_default_idle
detective_saudi_suspicious
innocent_hijab_confused
```

The variant slot exists so a costume is a swap, never a second character. Code
calls `characterAsset(id, pose, variant)`, which falls back to the `default`
variant when a costume lacks that pose — so a variant never has to be generated
in every pose before it can be used.

Non-character art keeps a descriptive id: `hero_home_confused_group`,
`mode_scene_mozawwer`.

## Workflow for any new asset

1. Read `ART_BIBLE.md`.
2. Define what the asset must communicate.
3. Write the prompt from the §13 template.
4. Generate with **Higgsfield**, passing **two** references for character art:
   the Master Style Anchor (`art-reference/style_anchor_cast.webp`) for the
   world, and that character's own image for its identity. The anchor alone
   drifts the character.
5. Check against the acceptance checklist at the end of this file.
6. If it fails, regenerate — never hand-fix, never redraw in code.
7. Add the row here and register it in `src/assets/registry.ts`.

**Do not bulk-generate.** Assets are produced per screen, as that screen is
built — not as a speculative library.

**Status values:** `queued` · `generating` · `review` · `shipped` · `rejected`

---

## Batch 1 — Style anchor and cast

The style anchor is generated first and used as the visual reference for every
subsequent generation, so the whole game stays in one world.

**CANON — locked.** These designs are final and are passed as identity
references for every future pose of that character.

| id | character | colour | size | transparent | status | file |
|---|---|---|---|---|---|---|
| `style_anchor_cast` | **Master Style Anchor** — the six-character lineup establishing line, palette and shading. Reference only, never bundled. | — | 1800×1005 | no | shipped | `art-reference/style_anchor_cast.webp` |
| `artist_default_idle` | الفنان المتفلسف | red | 394×900 | yes | shipped | `src/assets/generated/artist_default_idle.webp` |
| `critic_default_idle` | الناقد | yellow | 858×900 | yes | shipped | `src/assets/generated/critic_default_idle.webp` |
| `confused_default_idle` | الملخبط | teal | 588×900 | yes | shipped | `src/assets/generated/confused_default_idle.webp` |
| `excited_default_idle` | المتحمس | blue | 900×889 | yes | shipped | `src/assets/generated/excited_default_idle.webp` |
| `innocent_default_idle` | البريء المشبوه | pink | 564×900 | yes | shipped | `src/assets/generated/innocent_default_idle.webp` |
| `detective_default_idle` | المحقق | purple | 320×900 | yes | shipped | `src/assets/generated/detective_default_idle.webp` |

**Batch 1 generation notes**

- `style_anchor_cast` — Nano Banana Pro, 16:9, 2k, text-only, first attempt accepted.
- All six characters — Seedream 5.0 Pro, 1:1, 2k, with the style anchor passed as
  an image reference so the cast stays in one world. The artist failed twice on
  Seedream and was regenerated on Nano Banana Pro, then cut out with the
  background remover.
- Post-processing: trimmed to artwork bounds, resized so the long edge is 900px
  (2× the largest on-screen use), converted to WebP q88. Total shipped character
  art: **501 KB** for all six.
- Silhouette test: all six pass. The pair at highest risk of confusion (الناقد
  and الملخبط, both rounded masses) separates on the antenna and leg length.
- **Role correction:** yellow and purple were initially registered with each
  other's personalities. Yellow is الناقد, purple is المحقق. Files and ids were
  renamed accordingly.

## Batch 1b — Saudi variants

Costume variants only. Same characters, per ART_BIBLE.md §13–14.

| id | character | costume | size | transparent | status | file |
|---|---|---|---|---|---|---|
| `detective_saudi_idle` | المحقق | ghutra + igal | 900 long edge | yes | shipped | `src/assets/generated/detective_saudi_idle.webp` |
| `innocent_hijab_idle` | البريء المشبوه | hijab | 900 long edge | yes | shipped | `src/assets/generated/innocent_hijab_idle.webp` |

Generated with the character's own image as the primary reference plus the style
anchor, so identity is carried by the character and world by the anchor.

**The first hijab attempt was rejected.** The scarf draped over the entire body,
turning the distinctive egg silhouette into a generic dome and hiding the pink
body — a direct failure of the §14 rule against silhouette loss. Regenerated
with the covering explicitly restricted to the head.

The remaining four characters deliberately have **no** Saudi variant. Adding one
to each "for balance" is exactly the costume-theme failure ART_BIBLE.md §13
forbids.

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

---

## Acceptance checklist

Every new asset must pass all eight before it is registered:

1. Does it look like it came from the Master Style Anchor's world?
2. Is the character still instantly recognisable?
3. Is the silhouette preserved?
4. Is the expression clear on a phone screen?
5. Can the pose be read without any text?
6. Does it suit a party game rather than a children's app?
7. Do clothing and props look like a natural part of the character, not pasted on?
8. Was anything drawn in code instead of Higgsfield?

Fail any meaningful point → regenerate. Never hand-fix, never redraw in code.

## Notes

- Character poses beyond `idle` are generated on demand with the screen that
  needs them, never as a speculative library.
- Sizes are generation targets; final files are exported at 2× the largest
  on-screen size and compressed to WebP.
- If the motion can be achieved in code with position, rotation, scale, squash,
  stretch, bounce or opacity, do not generate a new pose for it.
