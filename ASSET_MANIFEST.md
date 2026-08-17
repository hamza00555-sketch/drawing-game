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

## Batch 7 — Style reset (current direction)

ART_BIBLE.md §0 retired the warm-paper direction. These are the assets in the
**new** grid-notebook / coloured-pencil sticker language, generated with
**GPT Image 2** (`gpt_image_2`) — chosen over the previous model because it
holds the reference style and renders Arabic letterforms correctly.

Every character generation passes `art-reference/style_anchor_v2.webp` as an
image reference, which is what keeps the ten of them in one world.

| id | purpose | size | transparent | status | file |
|---|---|---|---|---|---|
| `style_anchor_v2` | **Master Style Anchor** — the six-character line-up establishing line, pencil texture, sticker border and palette. Reference only, never bundled. | 1800×1018 | no | shipped | `art-reference/style_anchor_v2.webp` |
| `logo_wordmark` | The «وش ذا؟» lockup with tagline ribbon. The one asset that legitimately carries text (ART_BIBLE.md §19). | 1198×1200 | yes | shipped | `src/assets/generated/logo_wordmark.webp` |
| `artist_default_idle` | الفنان — paint-splattered thobe, beret, brush and palette | 459×900 | yes | shipped | `src/assets/generated/artist_default_idle.webp` |
| `critic_default_idle` | الناقد — brown shemagh, arms crossed | 418×900 | yes | shipped | `src/assets/generated/critic_default_idle.webp` |
| `confused_default_idle` | الملخبط — white taqiyah, hand on chin | 411×900 | yes | shipped | `src/assets/generated/confused_default_idle.webp` |
| `excited_default_idle` | المتحمس — gold-trimmed vest, sneakers, mid-jump | 488×900 | yes | shipped | `src/assets/generated/excited_default_idle.webp` |
| `innocent_default_idle` | البريء — pink hijab, hands clasped | 401×900 | yes | shipped | `src/assets/generated/innocent_default_idle.webp` |
| `detective_default_idle` | المحقق — ghutra and igal, magnifying glass | 406×900 | yes | shipped | `src/assets/generated/detective_default_idle.webp` |
| `confident_default_idle` | الواثق زيادة — barrel chest, tiny head, hands on hips | 662×900 | yes | shipped | `src/assets/generated/confident_default_idle.webp` |
| `dramatic_default_idle` | الدرامي — flaring orange scarf, arms flung overhead | 641×900 | yes | shipped | `src/assets/generated/dramatic_default_idle.webp` |
| `calm_default_idle` | الهادي — low wide dome, entirely unbothered | 900×694 | yes | shipped | `src/assets/generated/calm_default_idle.webp` |
| `trickster_default_idle` | المشاغب — lopsided, hands behind back, smirking | 455×900 | yes | shipped | `src/assets/generated/trickster_default_idle.webp` |
| `hero_home_confused_group` | Home hero: all six around one unidentifiable scribble, six different reactions | 1400×768 | yes | shipped | `src/assets/generated/hero_home_confused_group.webp` |
| `splash_backdrop` | Splash: the six clustered and peering forward, open space at the top for the wordmark | 960×1000 | yes | shipped | `src/assets/generated/splash_backdrop.webp` |
| `mode_scene_mozawwer` | Three drawing confidently, a fourth sweating and faking it | 700×386 | yes | shipped | `src/assets/generated/mode_scene_mozawwer.webp` |
| `mode_scene_mamnou3at` | Straining at an easel beside three crossed-out icons | 700×442 | yes | shipped | `src/assets/generated/mode_scene_mamnou3at.webp` |
| `mode_scene_mushtarak` | Two on one sheet, a red half and a blue half that do not match | 700×483 | yes | shipped | `src/assets/generated/mode_scene_mushtarak.webp` |
| `mode_scene_kammil` | Four passing a sheet down the line at speed, panicking | 700×291 | yes | shipped | `src/assets/generated/mode_scene_kammil.webp` |
| `mode_scene_kanat_esh` | A chain of four, the drawing degrading from a clear cat to a scribble | 700×386 | yes | shipped | `src/assets/generated/mode_scene_kanat_esh.webp` |
| `app_icon` | The artist holding up a pencil beside the puzzled green one, chest-up and bold enough to read at 16px | 2044×2044 source | no (favicons render on unpredictable chrome) | shipped | `public/icon-512.png`, `icon-192.png`, `apple-touch-icon.png`, `favicon-32.png`, `favicon-16.png` |

**Batch 7 notes.**

- The **costume variants are now redundant.** `innocent_hijab_idle` and
  `detective_saudi_idle` exist only because the old base designs wore no Saudi
  clothing; in the new direction the base designs already do (ART_BIBLE.md
  §13). Their files currently duplicate the base art so the registry keeps
  resolving; the ids are retired once nothing references them.
- Character files were **replaced in place under their existing ids**, so every
  screen picked up the new art with no code change. Only the `width`/`height`
  in `registry.ts` moved. The same applies to the mode scenes, the hero, the
  splash backdrop and the app icon.
- `splash_backdrop` is exported at a lower quality (q82, 1000px) than the rest:
  it is on screen for 1.6 seconds and was 752 KB at the standard settings.
- **Batches 1–4 and 6 are now fully superseded.** Every id they listed has been
  regenerated in the new direction. They are kept as the record of what the
  game looked like before the reset, not as live rows.

## Batch 8 — Owner-drawn cast (current direction)

The generated cast was rejected by the owner ("الشخصيات مو حلوه"), who supplied
ten hand-made pose sheets instead. **These are not Higgsfield output** — they
are the owner's own artwork, and they are the canon designs now. The sheets live
in `art-reference/character-sheets/` and are the source of truth; the shipped
WebPs are cut from them by `scripts/cut-character-sheet.py` and should be
regenerated by re-running it, never edited by hand.

Each sheet carries nine poses: three full-body turns, three head expressions,
and three more bodies of which one wears the character's accessory. Poses are
detected by connected component rather than sliced from a grid, because the
sheets do not share one layout — المسرحي stacks its faces in a narrow fourth
column and الهادئ runs four uneven rows. `--contact` renders the detected poses
numbered; the `POSES` table in the script records which number fills which role,
chosen by eye.

The `saudi` variant id was renamed to **`costume`**. Only four of the ten
accessories are Saudi dress (thobe, ghutra, shemagh, hijab) — the rest are a
nightcap, a fez, a beanie, a scarf, a bandana and a headband — so a single
`saudi` label was wrong for most of the cast. Each character now carries its own
Arabic label for its own garment.

| id | character — pose | sheet index | size | file |
|---|---|---|---|---|
| `artist_default_idle` | الفنان المتفلسف — وقفة محايدة | 8 | 341×900 | `src/assets/generated/artist_default_idle.webp` |
| `artist_default_face` | الفنان المتفلسف — تعبير الوجه | 5 | 420×398 | `src/assets/generated/artist_default_face.webp` |
| `artist_default_action` | الفنان المتفلسف — وضع متحرك | 7 | 506×900 | `src/assets/generated/artist_default_action.webp` |
| `artist_costume_idle` | الفنان المتفلسف — بالثوب | 6 | 349×900 | `src/assets/generated/artist_costume_idle.webp` |
| `critic_default_idle` | الناقد — وقفة محايدة | 8 | 686×900 | `src/assets/generated/critic_default_idle.webp` |
| `critic_default_face` | الناقد — تعبير الوجه | 4 | 420×386 | `src/assets/generated/critic_default_face.webp` |
| `critic_default_action` | الناقد — وضع متحرك | 7 | 854×900 | `src/assets/generated/critic_default_action.webp` |
| `critic_costume_idle` | الناقد — بالوشاح | 6 | 680×900 | `src/assets/generated/critic_costume_idle.webp` |
| `confused_default_idle` | الملخبط — وقفة محايدة | 8 | 518×900 | `src/assets/generated/confused_default_idle.webp` |
| `confused_default_face` | الملخبط — تعبير الوجه | 4 | 373×420 | `src/assets/generated/confused_default_face.webp` |
| `confused_default_action` | الملخبط — وضع متحرك | 7 | 786×900 | `src/assets/generated/confused_default_action.webp` |
| `confused_costume_idle` | الملخبط — بالطاقية | 6 | 534×900 | `src/assets/generated/confused_costume_idle.webp` |
| `excited_default_idle` | المتحمس — وقفة محايدة | 8 | 663×900 | `src/assets/generated/excited_default_idle.webp` |
| `excited_default_face` | المتحمس — تعبير الوجه | 3 | 420×405 | `src/assets/generated/excited_default_face.webp` |
| `excited_default_action` | المتحمس — وضع متحرك | 6 | 900×751 | `src/assets/generated/excited_default_action.webp` |
| `excited_costume_idle` | المتحمس — بعصابة الرأس | 7 | 649×900 | `src/assets/generated/excited_costume_idle.webp` |
| `innocent_default_idle` | البريء المشبوه — وقفة محايدة | 8 | 549×900 | `src/assets/generated/innocent_default_idle.webp` |
| `innocent_default_face` | البريء المشبوه — تعبير الوجه | 5 | 420×404 | `src/assets/generated/innocent_default_face.webp` |
| `innocent_default_action` | البريء المشبوه — وضع متحرك | 7 | 788×900 | `src/assets/generated/innocent_default_action.webp` |
| `innocent_costume_idle` | البريء المشبوه — بالحجاب | 6 | 569×900 | `src/assets/generated/innocent_costume_idle.webp` |
| `detective_default_idle` | المحقق — وقفة محايدة | 8 | 323×900 | `src/assets/generated/detective_default_idle.webp` |
| `detective_default_face` | المحقق — تعبير الوجه | 4 | 343×420 | `src/assets/generated/detective_default_face.webp` |
| `detective_default_action` | المحقق — وضع متحرك | 7 | 342×900 | `src/assets/generated/detective_default_action.webp` |
| `detective_costume_idle` | المحقق — بالغترة | 6 | 427×900 | `src/assets/generated/detective_costume_idle.webp` |
| `confident_default_idle` | الواثق زيادة — وقفة محايدة | 8 | 763×900 | `src/assets/generated/confident_default_idle.webp` |
| `confident_default_face` | الواثق زيادة — تعبير الوجه | 5 | 420×333 | `src/assets/generated/confident_default_face.webp` |
| `confident_default_action` | الواثق زيادة — وضع متحرك | 7 | 692×900 | `src/assets/generated/confident_default_action.webp` |
| `confident_costume_idle` | الواثق زيادة — بالشماغ | 6 | 786×900 | `src/assets/generated/confident_costume_idle.webp` |
| `dramatic_default_idle` | الدرامي — وقفة محايدة | 8 | 313×900 | `src/assets/generated/dramatic_default_idle.webp` |
| `dramatic_default_face` | الدرامي — تعبير الوجه | 4 | 290×420 | `src/assets/generated/dramatic_default_face.webp` |
| `dramatic_default_action` | الدرامي — وضع متحرك | 3 | 475×900 | `src/assets/generated/dramatic_default_action.webp` |
| `dramatic_costume_idle` | الدرامي — بالطربوش | 6 | 596×900 | `src/assets/generated/dramatic_costume_idle.webp` |
| `calm_default_idle` | الهادي — وقفة محايدة | 7 | 900×541 | `src/assets/generated/calm_default_idle.webp` |
| `calm_default_face` | الهادي — تعبير الوجه | 4 | 420×361 | `src/assets/generated/calm_default_face.webp` |
| `calm_default_action` | الهادي — وضع متحرك | 6 | 900×478 | `src/assets/generated/calm_default_action.webp` |
| `calm_costume_idle` | الهادي — بطاقية النوم | 8 | 900×613 | `src/assets/generated/calm_costume_idle.webp` |
| `trickster_default_idle` | المشاغب — وقفة محايدة | 8 | 479×900 | `src/assets/generated/trickster_default_idle.webp` |
| `trickster_default_face` | المشاغب — تعبير الوجه | 5 | 417×420 | `src/assets/generated/trickster_default_face.webp` |
| `trickster_default_action` | المشاغب — وضع متحرك | 7 | 534×900 | `src/assets/generated/trickster_default_action.webp` |
| `trickster_costume_idle` | المشاغب — بالبندانة | 6 | 519×900 | `src/assets/generated/trickster_costume_idle.webp` |

**Batch 8 notes.**

- Every file is transparent, cut to content bounds with an 8px margin, 900px on
  the long edge (420px for the head-only faces), WebP q90.
- Files were **replaced in place under their existing ids**, so screens picked
  up the new cast with no code change beyond `width`/`height` in `registry.ts`
  and the `saudi` → `costume` rename.
- `innocent_hijab_idle` is **retired**: البريء's hijab pose is now
  `innocent_costume_idle`, on the same footing as every other costume.
- One known artifact: where a hanging arm leaves a narrow paper channel against
  the torso, that channel comes out an opaque cream sliver instead of
  transparent. It is kept deliberately — the channel cannot be told apart from
  eye whites or the white thobe by colour, area or shape (all measured), and a
  faint sliver on the app's near-white ground is far less visible than
  transparent eyes would be.
- **Batch 7's character rows are superseded**; its scenes, logo, splash and app
  icon still stand. Those composite scenes still show the generated cast, so
  they are the remaining inconsistency with this batch.

## Batch 9 — Scenes composed from the owner's cast (current direction)

Batch 7's hero, splash and mode scenes still showed the rejected generated
cast even after Batch 8 replaced the character art itself — those composites
were the one inconsistency Batch 8 left standing. Fixing them is not a
generation problem: a generated group shot would put the rejected cast right
back on the app's most visible screens. Instead they are COMPOSED, by
`scripts/build-scene.py`, out of the same pose cutouts Batch 8 produced —
extended to the full nine-pose set per character via `--all`, since a scene
needs poses beyond the four that ship as character art — plus a handful of
generated props for the one thing no character sheet supplies: paper, an
easel, the forbidden-item cards.

Each scene is a small JSON placement list in `art-reference/scenes.json`:
which cutout, where its ground point sits on the stage (0..1), how tall it is
as a fraction of stage height, and whether it is mirrored. Figures overlap by
design — that is what reads as a group rather than a row of stickers.

| id | size | file |
|---|---|---|
| `hero_home_confused_group` | 1400×644 | `src/assets/generated/hero_home_confused_group.webp` |
| `splash_backdrop` | 960×711 | `src/assets/generated/splash_backdrop.webp` |
| `mode_scene_mozawwer` | 615×400 | `src/assets/generated/mode_scene_mozawwer.webp` |
| `mode_scene_kammil` | 700×348 | `src/assets/generated/mode_scene_kammil.webp` |
| `mode_scene_mamnou3at` | 668×440 | `src/assets/generated/mode_scene_mamnou3at.webp` |
| `mode_scene_mushtarak` | 678×480 | `src/assets/generated/mode_scene_mushtarak.webp` |
| `mode_scene_kanat_esh` | 700×382 | `src/assets/generated/mode_scene_kanat_esh.webp` |

**Props** (generated, `gpt_image_2`, style image = `artist_sheet.png` so line
weight and colouring match the cut cast; background removed the same way as
the character sheets — outline defines the object, enclosed white fills in,
background white does not, which handles a white sheet of paper on a white
field where no brightness threshold could):

| id | size | file |
|---|---|---|
| `scribble_sheet` | 900×778 | `art-reference/props/scribble_sheet.webp` |
| `cat_sheet` | 852×900 | `art-reference/props/cat_sheet.webp` |
| `half_sheet` | 900×793 | `art-reference/props/half_sheet.webp` |
| `two_color_sheet` | 900×889 | `art-reference/props/two_color_sheet.webp` |
| `easel` | 562×900 | `art-reference/props/easel.webp` |
| `forbidden_cards` | 329×900 | `art-reference/props/forbidden_cards.webp` |
| `blank_sheet` | 800×900 | `art-reference/props/blank_sheet.webp` |
| `pencil` | 884×900 | `art-reference/props/pencil.webp` |

**Batch 9 notes.**

- The full pose library (`art-reference/pose-library/`, 9 poses × 10
  characters) is committed alongside the 4-per-character shipped set, because
  `scenes.json` references specific pose indices from it and a scene rebuild
  needs them without re-running the cutter.
- Files were **replaced in place under their existing ids** — no code change
  beyond `width`/`height` in `registry.ts`, since a composed scene's aspect
  ratio isn't chosen up front the way a generated one's was.
- To change a scene: edit its entry in `scenes.json` and re-run
  `scripts/build-scene.py art-reference/scenes.json src/assets/generated
  --only <scene_id>`.
- **Batch 7 is now fully superseded** for character-bearing assets. Its
  `logo_wordmark` still stands — it shows no character. Its `app_icon` was
  later superseded too, by Batch 11.

## Batch 10 — Hero regenerated as one Higgsfield illustration (current direction)

Batch 9's `hero_home_confused_group` was a composite of six separate pose
cutouts pasted onto one canvas. It read as pasted-together — each figure's own
lighting and ground shadow, no shared light source, no natural overlap where
one character leans into another. Requested explicitly: regenerate it with
Higgsfield and make it better.

Composing was the right call for the mode scenes (Batch 9's reasoning still
holds: a generated scene would put the once-rejected characters back on
screen). The hero is different — by now the OWNER'S OWN characters are the
approved design, so a single Higgsfield illustration referencing all six as
image inputs draws them interacting naturally in one pass, with one light
source and one shadow, which no amount of compositing individual cutouts can
produce.

Two things mattered for a correct result with `gpt_image_2`:

- **Reference images must be single-pose, not the full 3x3 sheet.** An early
  attempt passed the raw character sheets (nine poses each, including a
  costumed variant) as references, and the model read the sheet's own
  costume pose as a second character — one generation dropped الفنان
  entirely, another duplicated الناقد once with his scarf and once without.
  Switching to the plain `_default_idle` cutout per character (already
  produced by Batch 8) as the reference fixed it: six references in, exactly
  six characters out, on both attempts.
- **The prompt named each character's colour and one identifying feature**
  (the beret, the antenna, the spikes) and said explicitly not to invent or
  omit one. Belt-and-suspenders alongside the single-pose fix above, but it
  is cheap insurance against exactly the failure mode above.

Background removed with `remove_background`, trimmed to content with an
8px margin.

| id | size | file |
|---|---|---|
| `hero_home_confused_group` | 1262×698 | `src/assets/generated/hero_home_confused_group.webp` |

**Batch 10 notes.**

- Regenerating is a manual step, not something `build-scene.py` does — there
  is no script here, just the prompt above and the six Batch 8 idle cutouts as
  reference. Re-run by hand if the hero needs revisiting again.
- The splash backdrop and the five mode scenes are still Batch 9 composites.
  They were not requested to change, but the same one-shot-generation approach
  would likely improve them the same way if that's ever wanted.

## Batch 11 — Every remaining generated asset moved to Higgsfield (current direction)

Requested explicitly, following Batch 10: "ابا كل الرسومات المولدة تصير بهيقزفيلد في
كل الاقسام" — every generated graphic, in every section, should be built the
Batch 10 way. Two different problems were in scope, not one:

- **Batch 9's mode scenes and splash backdrop** were composites of pose
  cutouts, same as the old hero — pasted-together lighting, no natural
  overlap. Batch 10's fix (one `gpt_image_2` generation, single-pose idle
  cutouts as references, not the full pose sheet) applies directly.
- **Batch 7's `accusation_group`, the impostor mask art, the countdown
  creature and the app icon** were never touched by Batch 8 or 9 at all —
  they were still flat-vector generations from before the owner's own
  characters became canon, so they clashed with the current cast outright (one
  even used the wrong colour for a character) or, for the icon, showed a
  character design that no longer exists. These needed the style fix as much
  as the characters did, whether or not they show a character.

**Splash and mode scenes** — six references or fewer per scene (the exact
cast the scene needs), single-pose idle cutouts, same coloured-pencil prompt
header as Batch 10:

| id | size | file |
|---|---|---|
| `splash_backdrop` | 1028×972 | `src/assets/generated/splash_backdrop.webp` |
| `mode_scene_mozawwer` | 1341×658 | `src/assets/generated/mode_scene_mozawwer.webp` |
| `mode_scene_kammil` | 1346×624 | `src/assets/generated/mode_scene_kammil.webp` |
| `mode_scene_mamnou3at` | 1049×756 | `src/assets/generated/mode_scene_mamnou3at.webp` |
| `mode_scene_mushtarak` | 1049×739 | `src/assets/generated/mode_scene_mushtarak.webp` |
| `mode_scene_kanat_esh` | 1333×698 | `src/assets/generated/mode_scene_kanat_esh.webp` |

**المزوّر art** — `accusation_group` reuses three idle cutouts (الفنان،
الناقد، الملخبط) pointing at the unmasked impostor. The mask art is
deliberately not tied to any character (ART_BIBLE.md, unchanged from Batch 4)
so it carries no character reference, only a style one:

| id | size | file |
|---|---|---|
| `accusation_group` | 1086×837 | `src/assets/generated/accusation_group.webp` |
| `reveal_role_impostor` | 951×641 | `src/assets/generated/reveal_role_impostor.webp` |
| `unmask_impostor` | 1113×851 | `src/assets/generated/unmask_impostor.webp` |

**Countdown creature** — a nameless one-eyed character, not one of the ten
(unchanged from Batch 4). Generated as a CHAIN, not three independent
generations: beat 3 was generated first from a style reference only, then its
own job output was passed as the character reference for beats 2 and 1. That
is what keeps it the same creature across all three beats — three independent
generations of "a nameless one-eyed creature" would not agree with each other
on what it looks like.

| id | size | file |
|---|---|---|
| `countdown_3_surprised` | 1048×645 | `src/assets/generated/countdown_3_surprised.webp` |
| `countdown_2_grabs_pen` | 1115×630 | `src/assets/generated/countdown_2_grabs_pen.webp` |
| `countdown_1_ready` | 773×713 | `src/assets/generated/countdown_1_ready.webp` |

**App icon** — الفنان and الملخبط, chest-up, high contrast, regenerated
because the old icon showed a moustached character and a taqiyah-wearing
green character that match nothing in the current cast:

| id | size | file |
|---|---|---|
| `app_icon` | 1142×1142 source, exported at 512/192/180/32/16 | `public/icon-512.png`, `icon-192.png`, `apple-touch-icon.png`, `favicon-32.png`, `favicon-16.png` |

**Batch 11 notes.**

- Same background-removal step throughout: `remove_background`, trimmed to
  content, small padding, WebP q90 for the illustrations. The icon is the one
  exception — exported onto a solid paper background, not transparent, per the
  existing rule that favicons render on unpredictable browser chrome.
- At 16×16 the icon reads as two colour blocks, not two characters — an
  inherent limit of any detailed art at that size, not specific to this
  generation. 32px and up read clearly.
- **Batches 4, 6, 7 and 9 are now fully superseded** — nothing in this
  document past Batch 8 (the owner's cast) still describes a shipped asset.
  They are kept as the historical record of how the art direction got here.

## Batch 12 — Hand-drawn UI chrome (current direction)

Requested explicitly: "يكون لون الfill تبعه يكون سكرابل والحدود تكون كأنها
مرسومة بالقلم واي حدود في الاطبيق يكون كأنه مرسوم بالقلم" — button fills should
read as pencil scribble, and every border in the app should look pen-drawn.
This is UI CHROME, not illustration content — same boundary GameButton.tsx
already draws ("the shape is built in code — that is functional UI. Anything
illustrative inside one comes from Higgsfield") — so the two assets below are
Higgsfield output, wired in globally through `src/index.css`, not new
per-component artwork.

| id | purpose | size | file |
|---|---|---|---|
| `ui_border_sketch` | A single wobbly hand-inked rounded-rect loop, used as a `border-image` 9-slice | 941×941, transparent | `src/assets/generated/ui_border_sketch.webp` |
| `ui_scribble_fill` | A tileable pencil-hatch alpha texture, layered over each brand colour's flat fill | 512×512, transparent | `src/assets/generated/ui_scribble_fill.webp` |

**Why CSS wiring, not a new component.** Every bordered element in the app —
buttons, cards, mode tiles, the character picker, text fields — already shares
the same Tailwind border-WIDTH utility classes (`.border-hair/-thin/-bold
/-heavy`) and the same brand-colour `bg-*` classes. Two rules added once in
`src/index.css`, keyed to those exact class names, reach every one of them
with zero per-component changes: `border-image` swaps the flat CSS line for
the pen-drawn ring wherever a border-width class appears, and a background
layer overlays the scribble texture wherever a brand colour appears as a fill.

**Two rounds to get the border right.**

- The first `ui_border_sketch` generation had a stroke only ~2% of the canvas
  width. Once sliced into a 9-slice corner region and scaled down to a
  realistic border width (10-18px), that stroke was crushed to sub-pixel and
  read as a plain thin line — no wobble, no ink texture, indistinguishable
  from the CSS border it replaced. Measuring the asset confirmed it: an
  18px-thick stroke inside a 280px slice, scaled to an 18px destination width,
  renders at under 2px.
- Regenerated with an explicitly thick stroke (~9% of canvas) and a smaller
  corner radius (~8%, versus the first pass's ~45%, which had left almost no
  straight edge to use as the repeating middle tile). The corrected asset
  measures a 44px stroke inside a 941px canvas with the corner arc flattening
  into a straight run at ~230px — slicing there keeps enough of the stroke's
  own thickness relative to the slice for it to survive scaling down to a
  normal UI border width and still read as pencil-and-ink.

**One regression caught and fixed before shipping.** `border-image` ignores
`border-color` entirely. Several screens (the character picker, colour
swatches, mode tiles, vote chips) distinguish selected from unselected ONLY by
switching between the `border-ink` and `border-ink-hairline` color classes at
the same width class — painting both with the same thick inked ring would have
silently erased that signal app-wide. Fixed by excluding `.border-ink-hairline`
from the border-image rule with `:not()`, so a hairline stays a plain quiet
line. This also reads correctly on its own terms: a confident pen ring for
something chosen or emphasised, a faint pencil guideline for a structural
divider or an option not taken.

**Scribble fill is scoped to actual brand colours** (`bg-cobalt`, `bg-mustard`,
`bg-tomato`, `bg-teal`, `bg-grape`, `bg-rose`, `bg-ink`, and their `-deep`
variants) and deliberately excludes the neutral `bg-paper*` surfaces — texturing
a whole screen's white background would read as dirt on the page, not a
scribbled object.

**Batch 12 notes.**

- The texture tiles seamlessly: generated as a plain edge-to-edge hatch swatch,
  then made to wrap using the standard offset-and-heal technique (roll by half
  the tile size, blend the resulting centre seam against a mirrored copy in a
  soft feathered band). Verified by rendering a 3×3 tiled grid before shipping.
- `background-blend-mode: soft-light` blends the texture against whatever
  `background-color` Tailwind's own utility already set — the two rules never
  touch the same CSS property, so layer order between `@layer components` and
  Tailwind's `utilities` layer doesn't matter here.

## Batch 13 — Dedicated button assets (current direction)

Requested explicitly: review every button in the app and replace them with
Higgsfield-generated button assets instead of the generic ring+texture system
(Batch 12), which "imitated" the hand-drawn look with two effects layered by
CSS. Buttons are the highest-visibility UI in the app, so they get a stronger
treatment — the ring and the marker fill are ONE piece of art per tone,
drawn together, not simulated as two separate layers. The generic Batch 12
system stays exactly as it was for everything that is not a button (cards,
mode tiles, the character picker frame) — that distinction is deliberate, not
an oversight.

Naming: this batch renamed `GameButton`'s tones to match the brief exactly.
The old `secondary` (mustard/yellow) is now `accent`; the old `quiet`
(white) is now `secondary`; `primary` and `danger` are unchanged. Six call
sites across the app were updated to match.

| id | tone | size | file |
|---|---|---|---|
| `btn_primary` | Primary — cobalt blue | 700×310 | `src/assets/generated/btn_primary.webp` |
| `btn_secondary` | Secondary — white/paper, faint scribble | 700×341 | `src/assets/generated/btn_secondary.webp` |
| `btn_accent` | Accent — mustard yellow | 700×301 | `src/assets/generated/btn_accent.webp` |
| `btn_danger` | Danger — tomato red | 700×300 | `src/assets/generated/btn_danger.webp` |
| `btn_ink` | Ink — near-black, used for the "selected" state (drawing tools, chips) | 700×383 | `src/assets/generated/btn_ink.webp` |
| `btn_chip_ink` | Ink, pill/stadium shape — selected chip fill | 700×335 | `src/assets/generated/btn_chip_ink.webp` |

Each source is a single rounded-rect (or, for the chip, a stadium) swatch:
ring and marker-scribble fill drawn together in one Higgsfield generation,
nothing else on the canvas. Applied app-wide as a 9-slice `border-image` in
`src/index.css`, keyed to new `.wt-btn-*` / `.wt-chip-ink` classes rather than
generic Tailwind utilities, so each tone gets its own artwork.

**Getting the scaling right took a wrong turn.** The first read of the
generated art measured a ring only ~2.4% of the canvas height (13px on a
548px-tall source) and, reasoning from Batch 12's fix, that looked headed for
the same crushing problem. It wasn't: Batch 12's asset was a RING ONLY, so
its "slice" region was mostly empty transparency around a thin line, making
the ring a small fraction of the slice and vulnerable to scaling. These
assets bake the ring INSIDE a filled shape — the slice region is mostly
correct-looking fill either way — so a modest `border-image-width`
(12-18px, not the button's full height) is enough for the ring to survive:
the corner slice, containing ring-plus-adjacent-fill, downscales into a small
destination corner and still reads as ink, while `border-image`'s `fill`
keyword stretches the same source's flat/scribbled middle to cover the rest
of the button. Verified with a local 9-slice simulator
(`scripts/` — not committed, one-off diagnostic) before touching the browser,
since round-tripping every width value through Playwright would have been
far slower than simulating it directly in PIL.

**One regression caught before shipping, same shape as Batch 12's.** The
selected chip (`.wt-chip-ink`) silently rendered as a plain square with no
fill at all. Cause: the chip's JSX carried BOTH `wt-chip-ink` and Tailwind's
`border-thin` utility class. Batch 12's generic rule
(`.border-thin:not(.border-ink-hairline)`) still matches `border-thin`, and at
two classes plus a `:not()` its selector specificity (0,2,0) beats
`.wt-chip-ink` alone (0,1,0) — so Batch 12's ring-only asset silently won over
this batch's filled pill, regardless of which rule appeared later in the
file. Fixed by dropping `border-thin` from the selected branch entirely
(`.wt-chip-ink` supplies its own `border-width`); a codebase-wide grep
confirmed no other element pairs a `wt-btn-*`/`wt-chip-ink` class with a
Tailwind border-width utility.

**Reviewed before shipping app-wide**, per the brief: a `?preview=buttons`
dev-only style sheet (`src/dev/ButtonStyleSheet.tsx`) renders all four tones
across all three sizes, the disabled state, a block button, the drawing-tool
selected/unselected pair, and the chip selected/unselected pair, in one page —
checked visually before replacing the tone classes everywhere they're used.

**States, and what did and didn't need new art.**

- **Default** — the asset as generated, one per tone.
- **Pressed** — no separate asset. The existing squash-and-shadow-swap tactile
  effect stays (transform only, so it never costs a frame during live
  drawing), plus `active:brightness-90` dims the SAME artwork. This is a
  standard interactive affordance on an image, not an attempt to fake the art
  itself with CSS.
- **Disabled** — no separate asset; `opacity-50`, unchanged from before.
- **Selected** — `btn_ink` / `btn_chip_ink`, a genuinely different fill, used
  by the drawing-tool buttons and the character variant chip.

**Scope decisions, stated rather than silent.**

- **Pen-colour swatches are out of scope.** Each is one player's arbitrary
  hex colour (`style={{ backgroundColor }}`), so a baked-in fill per colour
  isn't meaningful — ten players, ten hexes, not a fixed tone. They keep
  Batch 12's ring-only treatment (a hand-drawn outline, flat colour fill).
- **"Icon buttons" have no current instance.** Grepped the app for an
  icon-only button and found none — `DrawingTools.tsx`'s own docstring already
  flags this as pending, text standing in until icon assets exist. Nothing to
  replace, and nothing was invented to replace it with; ART_BIBLE.md's own
  workflow rule is not to bulk-generate speculative assets ahead of a real
  screen needing them.
- **Card/tile surfaces (mode cards, character tiles, vote options) keep
  Batch 12.** They're selectable content, not buttons in the sense the brief
  used the word, and Batch 12's generic system already gives them a
  consistent hand-drawn frame.

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
