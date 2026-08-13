# وش ذا؟ — Art Bible

The binding visual specification. Every asset in this game is generated with
**Higgsfield** against this document. If a generated asset contradicts anything
below, it is regenerated — never hand-corrected, never patched in code.

The goal is that a player who sees any single screen out of context knows
immediately which game it belongs to.

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

## 12. The cast

Six characters ship first. Each must pass the silhouette test.

| Character | Personality | Distinguishing form |
|---|---|---|
| **الفنان المتفلسف** | Absolute confidence in catastrophic art | Tall, thin, lanky; oversized beret-like head shape; long drooping arms |
| **المحقق** | Permanently suspicious of everyone | Squat and wide; heavy brow ridge; hunched forward silhouette |
| **الملخبط** | Visibly understands nothing | Round, soft, slightly deflated; drooping antenna; wide-set unfocused eyes |
| **المتحمس** | Too much energy, always | Compact and springy; spiky outline; permanently mid-bounce |
| **البريء المشبوه** | Innocent face, suspiciously so | Small, neat, egg-shaped; tiny body; oversized guileless eyes |
| **الناقد** | Treats every doodle as a gallery piece | Angular and elongated; narrow head; arms crossed as a default pose |

Required states per character (generated as needed, not all upfront):

`idle` · `thinking` · `confused` · `suspicious` · `shocked` · `excited` ·
`celebrating` · `losing` · `drawing` · `waiting` · `nervous` · `proud` ·
`embarrassed` · `accusing` · `being_accused`

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
