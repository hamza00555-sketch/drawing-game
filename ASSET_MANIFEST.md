# وش ذا؟ — Asset Manifest

Every visual asset in the game, generated or queued. Nothing renders in the app
that is not listed here.

> **Style reset in progress.** ART_BIBLE.md §0 replaced the warm-paper "ugly-cute
> ink" direction with a modern grid-notebook/marker-sticker one. Batches 1–6
> below are the **old** direction and are being superseded asset by asset as
> the new cast, scenes and screens are generated — see **Batch 7** for the new
> Master Style Anchor and the current state of the reset. An old row is not
> removed from this file until its replacement has shipped and been wired in,
> so the registry never points at a missing file mid-transition.

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
3. Write the prompt from the §20 template.
4. Generate with **Higgsfield**, passing **two** references for character art:
   the Master Style Anchor (`art-reference/style_anchor_v2.webp`) for the
   world, and that character's own new-style image for its identity once one
   exists. The anchor alone drifts the character.
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
| `detective_saudi_idle` | المحقق | ghutra + igal | 380×900 | yes | shipped | `src/assets/generated/detective_saudi_idle.webp` |
| `innocent_hijab_idle` | البريء المشبوه | full-length hijab | 575×900 | yes | shipped | `src/assets/generated/innocent_hijab_idle.webp` |

Generated with the character's own image as the primary reference plus the style
anchor, so identity is carried by the character and world by the anchor.

**Note on the hijab variant.** The shipped version is the full-length hijab that
covers most of the body and visibly changes the egg silhouette. A head-only
alternative was generated and set aside; the long version was chosen as the
stronger image. This is the reference case for ART_BIBLE.md §14: silhouette
preservation is the default goal, not an absolute veto, because the face, eyes,
expression, colour and personality all survive.

The beige/taupe hijab colour is approved and deliberate — it sits outside the
token accent palette so it does not compete with the pink body, and neutral
cloth reads as cloth.

The remaining characters deliberately have **no** Saudi variant. Adding one to
each "for balance" is exactly the costume-theme failure ART_BIBLE.md §13 forbids.

## Batch 1c — Player-only cast

Four characters added so a full ten-player room can each pick someone different.
`mainCast: false` — playable, but never used for identity artwork, and no
existing scene was regenerated to include them.

| id | character | colour | size | transparent | status | file |
|---|---|---|---|---|---|---|
| `confident_default_idle` | الواثق زيادة | lime | 900×859 | yes | shipped | `src/assets/generated/confident_default_idle.webp` |
| `dramatic_default_idle` | الدرامي | ember | 673×900 | yes | shipped | `src/assets/generated/dramatic_default_idle.webp` |
| `calm_default_idle` | الهادي | slate | 900×441 | yes | shipped | `src/assets/generated/calm_default_idle.webp` |
| `trickster_default_idle` | المشاغب | cocoa | 625×900 | yes | shipped | `src/assets/generated/trickster_default_idle.webp` |

Generated on Seedream 5.0 Pro with the style anchor as reference, all four on the
first attempt. Each was briefed to fill a silhouette gap rather than repeat an
existing body: inverted head-to-body proportion, a legless flame shape, the
lowest and widest form in the cast, and a deliberately asymmetric lean.

Verified with a ten-character silhouette lineup. The closest pair is الناقد and
الواثق زيادة — both wide masses — separated by the hands-on-hips negative space
and the critic's forward hunch.

Only `idle` exists for these four. Reaction poses are generated on demand if a
player picks one and a mode needs it.

## Batch 2 — Entry screens

| id | purpose | character | expression | size | transparent | screens | status | file |
|---|---|---|---|---|---|---|---|---|
| `hero_home_confused_group` | Home hero: the whole main cast around one baffling scribble — one proud, one unimpressed, one baffled, one bouncing, one innocently pleased, one eyeing a neighbour. Explains «وش ذا؟» with no copy. | main cast | mixed | 1400×1000 | yes | Home | shipped | `src/assets/generated/hero_home_confused_group.webp` |
| `splash_backdrop` | Splash artwork behind the wordmark: five cast members huddled, staring down at something surprising, wide open margin at top for the wordmark | main cast | mixed | 1600×1578 | yes | Splash | shipped | `src/assets/generated/splash_backdrop.webp` |

## Batch 3 — Mode selection scenes

Each mode is sold by a mini cartoon scene that explains the idea visually.
Not an icon in a grid.

| id | purpose | size | transparent | screens | status | file |
|---|---|---|---|---|---|---|
| `mode_scene_mozawwer` | Three drawing confidently while a fourth sweats and fakes it | 700×410 | yes | Mode Selection | shipped | `src/assets/generated/mode_scene_mozawwer.webp` |
| `mode_scene_mamnou3at` | An artist straining, with crossed-out marks for what is forbidden | 700×511 | yes | Mode Selection | shipped | `src/assets/generated/mode_scene_mamnou3at.webp` |
| `mode_scene_mushtarak` | Two creatures on one sheet with different coloured pens, pulling apart | 700×419 | yes | Mode Selection | shipped | `src/assets/generated/mode_scene_mushtarak.webp` |
| `mode_scene_kammil` | A sheet passed down a panicking line at speed, with motion lines | 700×279 | yes | Mode Selection | shipped | `src/assets/generated/mode_scene_kammil.webp` |
| `mode_scene_kanat_esh` | A chain of four, the drawing mutating from a cat to a scribble | 700×328 | yes | Mode Selection | shipped | `src/assets/generated/mode_scene_kanat_esh.webp` |

**Batch 3 generation note.** The first pass asked for a "transparent background"
in the prompt. Models do not produce alpha from that instruction — they paint the
checkerboard. One scene came back with the grid painted BETWEEN the characters,
which survived background removal as opaque patches inside the artwork and could
not be fixed without drawing. Regenerated with a plain solid background and cut
out afterwards. See ART_BIBLE.md §20.

## Batch 4 — Gameplay moments

Generated alongside the screens that use them.

| id | purpose | screens | status |
|---|---|---|---|
| `reveal_role_artist` | "ارسم" role card art | Role Reveal | queued |
| `reveal_role_impostor` | "أنت المزوّر" role card art — a sneaky black domino mask, not a specific character (the impostor can be anyone) | Role Reveal | shipped |
| `countdown_3_surprised` | Countdown beat 3: a nameless one-eyed creature sees the drawing, startled | كمّل رسمتي | shipped |
| `countdown_2_grabs_pen` | Countdown beat 2: the same creature dives for the pen | كمّل رسمتي | shipped |
| `countdown_1_ready` | Countdown beat 1: the same creature braced, pen in hand | كمّل رسمتي | shipped |
| `reaction_correct` | Celebration on a correct guess | all modes | queued |
| `reaction_wrong` | Baffled stare on a wrong guess | all modes | queued |
| `reaction_timer_panic` | Rising panic as time runs out | all modes | queued |
| `reaction_pen_dropped` | Pen lost the instant time expires | كمّل رسمتي | queued |
| `unmask_impostor` | The mask comes off — dramatic reveal, same mask prop flying off in a burst | المزوّر | shipped |
| `accusation_group` | Three cast members pointing accusingly at the unmasked impostor | المزوّر | shipped |
| `poster_frame_decor` | Decorative border elements for the share poster | كانت إيش؟ | queued |

**Batch 4 generation notes.**

- `reveal_role_impostor` / `unmask_impostor` — deliberately not tied to any one
  character, since any player can be the impostor. A generic domino-mask prop
  in the established ink-line style instead, generated once and referenced
  again (not re-described from scratch) for the "coming off" beat so the two
  read as the same object at two moments.
- `countdown_1/2/3` — a new nameless one-eyed round creature, not one of the
  ten cast members, for the same reason: the countdown fires for whoever's
  turn it is. Described identically across all three prompts (single mustard
  body, one antenna, one eye) rather than chained via identity reference,
  since each beat is shown alone for one second — minor cross-frame drift is
  invisible in practice.
- `accusation_group` — generated with the artist, critic and confused
  character references alongside the style anchor; reads clearly as three of
  the established cast, not generic figures.
- All seven generated with Nano Banana (image-reference mode), backgrounds
  cut with the background remover tool, trimmed to content bounds and resized
  to 600–1600px long edge depending on on-screen size, WebP q88.

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

## Batch 6 — App icon

The browser tab / home-screen icon. Referenced directly from `index.html` as
platform `<link rel="icon">` / `<link rel="apple-touch-icon">` tags rather
than through `<AssetSlot />`, since it is a platform-level asset outside any
in-game screen — but it is still Higgsfield-generated against this same art
direction, never hand-drawn.

| id | purpose | size | transparent | status | file |
|---|---|---|---|---|---|
| `app_icon` | The artist and confused characters together, pencil raised, looking at a scribble — reads as "characters + drawing" even at 16px | 2048×2048 source, exported at 512/192/180/32/16 | no (solid paper background — favicons render on inconsistent chrome, transparency there looks broken) | shipped | `public/icon-512.png`, `icon-192.png`, `apple-touch-icon.png`, `favicon-32.png`, `favicon-16.png` |

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
