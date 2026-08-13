# وش ذا؟ — Art Bible

The binding visual specification. Every asset in this game is generated with
**Higgsfield** against this document. If a generated asset contradicts anything
below, it is regenerated — never hand-corrected, never patched in code.

The goal is that a player who sees any single screen out of context knows
immediately which game it belongs to.

---

## 0. Canon — locked

**The art direction is approved and closed.** Two artefacts are now binding:

1. **`art-reference/style_anchor_cast.webp` — the Master Style Anchor.** Passed
   as an image reference to every character or world asset from here on.
2. **The six generated character designs — canon.** They are not redesigned and
   not reinterpreted per generation.

Nothing new may drift toward: more 3D, more photorealistic, flatter, more
childish, more geometrically clean, a different line weight, or a different
shading approach. Every asset must look like it came out of the same world.

When generating a new pose for a character, pass **both** references: the Master
Style Anchor (for the world) and that character's own image (for its identity).
The anchor alone is not enough — it will drift the character.

---

## 1. The one-line brief

> An expressive, hand-drawn cartoon party world of odd creatures who behave like
> people — drawn with a thick, slightly imperfect ink line on warm paper.

Two failure modes to hold in mind at all times:

- **Too corporate.** Flat vector mascots, even shapes, tidy geometry, SaaS
  illustration style. Dead on arrival.
- **Too childish.** Preschool primaries, rounded-everything, baby faces, nursery
  decoration. This is a game adults play at a game night. It is *funny*, not
  *cute for toddlers*.

The target sits between them: **comedic, a bit ugly on purpose, warm, alive**.

---

## 2. Line

- **Thick, confident outlines** with visible pressure variation — thicker at the
  bottom of forms and where shapes overlap, thinner at the top.
- The line is **ink brown `#2A211C`**, never pure black.
- Contours are **slightly imperfect**: a circle wobbles, a straight edge drifts.
  Perfect curves read as vector and kill the hand-drawn feel.
- Lines **overshoot at corners** occasionally, like a marker sketch.
- Line weight is consistent across assets: heavy on the silhouette, medium on
  major internal forms, light on interior detail. Never hairline.

## 3. Shape language

- **Rounded, organic silhouettes.** Blobby, tapered, asymmetric.
- Asymmetry is required. Both sides of a face or body should differ slightly.
- **Big simple masses** with a few small sharp details for contrast — a tiny
  tooth, a bent antenna, a crooked pupil.
- Silhouette is king: every character must be identifiable as a **black shape
  alone**. This is a hard acceptance test, not a guideline.

## 4. Proportion

- **Large expressive heads**, roughly 45–60% of total height.
- **Small bodies**, short torsos.
- **Merged head-and-body blobs are an accepted variant** — several of the
  established cast are a single mass carrying the face, with no neck. Use this
  to widen silhouette variety, not as the default for every character.
- **Flexible rubber-hose arms** — no elbows, no joints, they curve.
- **Simple mitten or three-finger hands.** No detailed anatomy.
- **Small feet**, often just a rounded stub or a simple shoe shape.
- Proportions **vary between characters**. A cast where every body is the same
  blob in a different colour is a failed cast.

## 5. Faces

- **Eyes** carry all the acting. Solid ink pupils on white; size, spacing and
  pupil position change dramatically with emotion. Eyes may be different sizes
  on the same face.
- **Eyebrows** are separate floating ink strokes — the fastest read for
  suspicion, doubt and outrage. Essential for المزوّر.
- **Mouths** are bold single shapes: a wide open smile, a wobbling line, a tight
  small circle. Teeth appear only as simple blocks.
- **No noses** on most characters, or a tiny simple one on a few — one more way
  to make faces distinguishable.
- Expressions are **exaggerated past realism**. Shock means the whole face
  rearranges.

## 6. Colour

Ground and ink come from `src/design/tokens.css` and never vary:

| Role | Value |
|---|---|
| Paper ground | `#FDF6E8` warm off-white |
| Raised paper | `#FFFCF5` |
| Ink (all lines) | `#2A211C` |

Accents — bold and saturated, but earthy rather than fluorescent:

`#E2503A` tomato · `#F0B03A` mustard · `#2B9E92` teal · `#3A68CF` cobalt ·
`#7F57C9` grape · `#DD6491` rose

Rules:

- Each character gets **one dominant body colour** plus at most **two accents**.
- **No gradients as a style.** At most one soft internal shading pass.
- **No neon, no pastel wash, no primary red/blue/yellow triads** (that is the
  preschool trap).
- Colour must never be the only thing distinguishing two characters — see §4.

## 7. Shading

- **Flat fills** plus a **single shadow tone** — one darker value of the fill
  colour, applied loosely, offset consistently as if lit from the upper left.
- Shadow edges may miss the outline slightly. Misregistration reads as print
  and is desirable.
- **No airbrush, no glow, no rim light, no ambient occlusion, no 3D render.**
- Optional: a light dry-brush or paper grain texture, kept subtle.

## 8. Detail level

Low to medium. Read at **48px** first: silhouette and expression must survive.
Interior detail exists to reward a closer look, never to carry the read.
Backgrounds in character assets are **transparent** unless the asset is
explicitly a scene.

## 9. Backgrounds and scenes

- Backgrounds stay **light and low-contrast** so they never compete with
  gameplay or with a drawing on the canvas.
- Environments are **suggested, not built**: a floor line, a single prop, a
  loose shape of colour. No detailed rooms, no perspective grids.
- **Flat, straight-on staging.** No dramatic camera angles, no vanishing points.

## 10. Motion (applied in code, planned in art)

Assets are generated as stills; motion is applied in code with Framer Motion
using squash & stretch, anticipation, overshoot and stagger. Character art
should therefore be drawn with **clear pivot logic** — a body that can
plausibly squash vertically and stretch horizontally without breaking.

---

## 11. Forbidden

Any of these means regenerate:

- Photorealism, 3D render, Pixar-style CG, clay render
- Anime or manga styling
- Watercolour, oil paint, pencil-sketch rendering
- Flat corporate vector (Corporate Memphis / Alegria)
- Gradient meshes, glassmorphism, neon glow, chrome
- Realistic human beings
- Clean geometric perfection
- Preschool primary palettes and nursery motifs
- Text or lettering baked into the artwork
- Watermarks, signatures, borders, frames
- Emoji, or anything derived from emoji design language
- Generic stock-illustration mascots

---

## 12. The cast — canon

Six characters, all generated and locked. Colour identifies them in prose; form
identifies them on screen.

| Colour | Character | Personality | Locked form |
|---|---|---|---|
| Red | **الفنان المتفلسف** | Confident, self-important, treats catastrophic drawings as masterpieces | Tall, thin, lanky; **the beret is core identity and never comes off**; long drooping arms |
| Yellow | **الناقد** | Low energy, permanently unimpressed; sarcastic and judgmental | Squat and wide; heavy brow ridge; hunched forward |
| Teal | **الملخبط** | Always visibly trying to work out what is happening | Round, soft, slightly deflated; drooping antenna; wide-set unfocused eyes |
| Blue | **المتحمس** | Enormous energy; fast, exaggerated, physical | Compact and springy; spiky outline; poses should be mid-motion |
| Pink | **البريء المشبوه** | Sweet and guileless to a degree that becomes funny under suspicion | Small, neat, egg-shaped; tiny body; oversized guileless eyes |
| Purple | **المحقق** | Cold, reserved, watches everyone with quiet suspicion | Angular and elongated; narrow head; arms crossed by default |

### What must survive every generation

Head shape · body shape · head-to-body ratio · limb length · hand and foot
shape · eyes · eyebrows · mouth · special features (antenna, spikes, beret) ·
base colour · silhouette.

A player must recognise the character instantly even when the **pose**,
**expression**, **clothing** or **body angle** changes.

### Pose library

Needed as the game grows, generated **only when a screen actually needs one**:

`idle` · `drawing` · `thinking` · `confused` · `suspicious` · `accusing` ·
`shocked` · `nervous` · `celebrating` · `losing` · `proud` · `waiting` ·
`embarrassed` · `looking_at_player` · `looking_at_drawing`

Gameplay-critical poses by mode:

- **المزوّر** — suspicious, nervous, pretending_to_understand, accusing,
  being_accused, revealed, escaping, confident_bluff
- **كمّل رسمتي** — looking_at_drawing, shocked, getting_ready, holding_pen,
  drawing_fast, panic, time_finished
- **الممنوعات** — thinking, struggling, frustrated, proud, celebrating
- **الرسم المشترك** — drawing_together, looking_at_partner, confused_by_partner,
  understanding_partner, celebrating_together
- **كانت إيش؟** — looking_at_strange_drawing, confused, writing, shocked_reveal,
  reacting_to_result

### Animation readiness

If the motion can be done in code with position, rotation, scale, squash,
stretch, bounce or opacity, **one asset is enough** — do not generate a variant.
Generate a separate asset only when the motion genuinely requires a different
drawn pose.

---

## 13. Saudi identity

The world of وش ذا؟ should read as **contemporary Saudi**, naturally — not as a
costume theme bolted onto everyone.

**Hard rule: not every character wears Saudi clothing.** A cast where everyone
is in thobe and shemagh is a failure. The target is a varied, odd, funny,
contemporary cast that is *partly and clearly* Saudi.

### Clothing, by character

| Character | Treatment |
|---|---|
| Purple — المحقق | **Ghutra/shemagh with igal**, shaped to follow his tall narrow head |
| Pink — البريء | **Hijab**, simple and cartoon, face and big eyes fully preserved |
| Red — الفنان | Keeps the beret. It is his identity. |
| Yellow, Teal, Blue | Base design unchanged. **Do not add Saudi clothing for balance.** |

A costume variant may be added later if gameplay or story gives a reason. None
is needed now.

### Identity beyond clothing

Saudi character should also come from environment, props, content, words,
situations and game-night culture: dallah, finjan, coffee thermos, misbaha,
floor seating, majlis cushions, serving trays, hospitality objects, familiar
household things, local social situations.

But: **do not turn every screen into a collection of heritage symbols.** The
target is a *Saudi contemporary playful world*, not a *heritage festival visual
theme*.

Content carries this too. The flavour to aim for, as examples of tone only —
not a content list to implement now: someone reserving a seat with their
shemagh, the last samosa, the dallah being empty, someone lost at the
istiraha, a delivery driver who cannot find the place, someone saying "أنا
بالطريق" from their living room.

---

## 14. Variants are costumes, never redesigns

Asset ids are `{character}_{variant}_{pose}` — `detective_saudi_suspicious`,
`innocent_hijab_confused`, `artist_default_idle`.

**A costumed character is the same character.** A generation may never change
the face, body, size, visual age, eye shape, personality or core silhouette.
Clothing is added *onto* the canon design.

Two specific failure modes to reject on sight:

- A headdress that looks **pasted on top** rather than following the character's
  actual head shape. The purple detective's ghutra must drape over a tall narrow
  angular head and stay recognisably his.
- A hijab that **shrinks or hides the eyes**, or flattens the egg-shaped body
  into a generic rounded blob. The pink character's oversized eyes and thin legs
  must stay fully readable.

The `default` variant always exists and is canon. A pose missing in a costume
falls back to `default` in code rather than blocking on new art.

---

## 15. Props

Any prop in the world is generated to the same anchor: pen, eraser, paper,
dallah, finjan, misbaha, the impostor's mask, the critic's scorecard, the
artist's tools, accusation marks, game-night props.

No clipart. No stock assets. No icon packs.

---

## 16. Characters are not decoration

Never place a character in a corner just to prove the game has characters.
Every appearance needs a reason. A character may look at the canvas, react to
the player, point, brace, celebrate, suspect, wait, get nervous, or mock the
result — each placement must serve **gameplay, emotion or comedy**.

---

## 17. Comedy direction

Comedy comes from expressions, timing, reactions, awkward pauses, the contrast
between total confidence and a terrible drawing, misunderstanding, the reveal,
and personality.

It does **not** come from memes, emoji, or piles of text trying to be funny. The
drawing, the situation and the cast do the work.

---

## 18. Scenes that must be situations, not portraits

**Hero (Home).** Not characters standing and smiling at camera. A *situation*:
several characters looking at one very strange drawing — one confident, one
baffled, one suspicious of another, one proud of a catastrophe. The scene must
explain the phrase «وش ذا؟» without a word of copy.

**Mode selection.** Each mode gets a mini scene, never an icon:

| Mode | Scene |
|---|---|
| المزوّر | A group drawing while one character nervously tries to blend in |
| الممنوعات | A character straining to draw something with parts of it forbidden |
| الرسم المشترك | Two characters drawing the same thing, chaotically |
| كمّل رسمتي | Characters passing a drawing between them at speed |
| كانت إيش؟ | One drawing travelling through several characters, changing as it goes |

---

## 13. Prompt template

Every generation starts from this. Fill the bracketed slots; never drop the
style block.

```
[SUBJECT AND ACTION — one clear sentence, e.g.
 "a squat suspicious cartoon creature leaning forward, eyes narrowed,
  one eyebrow raised, pointing an accusing finger"]

STYLE: expressive hand-drawn cartoon illustration, thick uneven ink outlines
with visible pressure variation, dark warm brown line art (#2A211C) never pure
black, slightly imperfect wobbling contours, flat colour fills with a single
soft shadow tone, rounded organic asymmetric shapes, large expressive head on a
small body, rubber-hose arms without joints, mitten hands, exaggerated cartoon
facial expression, bold readable silhouette.

PALETTE: warm off-white paper background (#FDF6E8), one dominant body colour
from [#E2503A tomato / #F0B03A mustard / #2B9E92 teal / #3A68CF cobalt /
#7F57C9 grape / #DD6491 rose] with at most two accent colours.

COMPOSITION: [full body / bust] , flat straight-on view, centred, generous
margin, [transparent background | plain warm paper background].

NEGATIVE: photorealistic, 3d render, cgi, pixar, clay, anime, manga,
watercolour, oil painting, pencil sketch, flat corporate vector, corporate
memphis, gradient mesh, glassmorphism, neon glow, chrome, realistic human,
geometric perfection, preschool primary colours, text, letters, words,
watermark, signature, frame, border, emoji, sticker pack, stock illustration.
```

---

## 14. Acceptance checklist

An asset ships only if every line is true:

1. Same world as the existing assets — could sit beside them on one screen.
2. Silhouette test passes: recognisable as a solid black shape.
3. Readable at 48px.
4. Ink is warm brown, not pure black.
5. Line has visible weight variation and is not geometrically perfect.
6. Palette is on-spec; not preschool, not neon.
7. Shading is flat plus one shadow tone. No render effects.
8. No text, watermark, frame or signature.
9. Transparent background where required.
10. Expression is exaggerated enough to read instantly.

Fail any line, regenerate. Do not fix art by hand or in code.
