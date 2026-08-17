# وش ذا؟ — Art Bible

The binding visual specification. Every asset in this game is generated with
**Higgsfield** against this document. If a generated asset contradicts anything
below, it is regenerated — never hand-corrected, never patched in code.

The goal is that a player who sees any single screen out of context knows
immediately which game it belongs to.

---

## 0. Canon — reset

**The direction below replaces everything before it.** The previous canon —
warm-paper "ugly-cute" ink cartoons, `art-reference/style_anchor_cast.webp`,
the six original character renders — is retired. Nothing from the old world is
passed as a reference for new generations; the roster's *names, personalities
and roles* carry over (§12), the *drawings* do not.

This reset happened for a concrete reason: the old brief explicitly banned
"flat vector mascots, tidy geometry, SaaS illustration style" as its primary
failure mode. The new direction is deliberately closer to that — a clean,
modern, sticker/marker-illustration language, moved from a printed-comic world
to an app-native one. That is the point, not a drift to correct.

A **new Master Style Anchor** is generated first (§19) and becomes the binding
reference for every asset after it, exactly as the old one was — pass it, plus
the specific character's own canon image once one exists, to every new
generation. "Same world as the anchor" is still the acceptance bar; the world
itself changed.

---

## 1. The one-line brief

> A modern Arabic app drawn like a confident marker sketch in a clean grid
> notebook — bold black outlines, one strong blue, one yellow spark, white
> space that breathes, doodles living in the margins instead of on the stage.

Two failure modes to hold in mind at all times:

- **Too sterile.** Perfect vector shapes with no hand in them at all, a
  generic SaaS dashboard wearing a mascot. If it could be reskinned for a
  budgeting app with no other changes, it has failed.
- **Too messy.** Doodle debris crowding the actual UI, sketch lines fighting
  the content for attention, a page that reads as noisy rather than playful.

The target sits between them: **confident, legible, warm through personality
and colour rather than through texture — a notebook that a design team kept,
not a napkin sketch.**

---

## 2. Line

- **Uniform, confident black outlines** — `#151515`, not a warm brown, not a
  soft grey. This is the single biggest shift from the old system: black
  outlines are now correct, not a mistake to avoid.
- Weight is **consistent per asset**, chosen by size: heavier on hero
  illustrations and the logo, lighter (but still solid, never hairline) on
  small UI-scale character crops and icons.
- A little hand felt at the edges — a corner overshoots very slightly, a curve
  is not a perfect Bézier — but far subtler than the old "wobbling contour"
  rule. The line should read as *drawn with a good marker and a steady hand*,
  not as a shaky sketch.
- **Doodle linework** (stars, arrows, swirls, question marks, motion lines) is
  a **separate, thinner register** from the character/UI outline weight, and
  lives in the page margins around content — never laid over a card, a canvas,
  or a character's own silhouette.

## 3. Shape language

- **Simplified, iconic silhouettes** — closer to a well-cut sticker than to a
  loose cartoon blob. A body reads as one or two clear geometric masses (a
  rounded marker/pen barrel, an egg, a dome) rather than an organic wobble.
- Each character keeps **one signature silhouette idea** carried over from the
  old cast (the artist is a tall marker-shaped form, the critic is a wide low
  mass, and so on — see §12) — reinterpreted in the new simplified shape
  language, not copied stroke for stroke.
- Limbs and clothing are now **legible as limbs and clothing** — arms, hands,
  a thobe, a hijab, a ghutra with visible drape — rather than rubber-hose
  abstractions. This is the other major shift: the cast reads as *small
  people in costume* now, not as odd creatures.
- Silhouette still matters, but the acceptance bar changes with the shape
  language: a character must be nameable from **outline + one signature prop
  or garment** (the beret, the ghutra, the hijab, the magnifying glass), not
  from silhouette alone the way the old blob-cast required.

## 4. Proportion

- **Large heads on compact bodies**, roughly 40–50% of total height — slightly
  less extreme than the old cast, because clothing and limbs now carry some of
  the visual weight the oversized head used to carry alone.
- Bodies are **short and simple**: a marker/pen barrel, a rounded torso, an
  egg — never a long or wandering shape.
- **Real arms and hands**, sleeves and all where clothing calls for them.
  Simple three-to-four-finger hands, expressive enough to hold a pencil, cross
  in judgement, or point in accusation clearly.
- **Small simple feet or shoes**, enough to plant a pose, not anatomical.
- Proportions still **vary between characters** — the flame-tall drama queen
  and the flattened, low "الهادي" stay proportionally distinct from the rest
  of the cast; simplifying the shape language must not flatten the *variety*.

## 5. Faces

- **Eyes carry the acting**, as before — bold circles or ovals, solid pupils,
  size and spacing doing most emotional work. Under the new line system they
  read as clean shapes, not sketchy scribbles.
- **Eyebrows are the fastest emotional read** and stay a separate stroke
  floating above the eye, exactly as before — critical for المزوّر's
  suspicion and doubt.
- **Mouths are bold single shapes.** Simpler under the new system: a curve, a
  wide open smile, a flat worried line — teeth only as a simple block when a
  laugh or shock calls for it.
- Expressions stay **exaggerated past realism** — the shift is in linework and
  proportion, not in how hard a face is allowed to react.

## 6. Colour

Ground, ink and the two brand colours come from `src/design/tokens.css` and
never vary:

| Role | Value |
|---|---|
| Page ground | `#FFFFFF` white, or the grid surface (§9) in the margin zone |
| Ink (all outlines, body text) | `#151515` near-black |
| Brand primary | `#2954E8` royal blue |
| Brand accent | `#FFC53D` warm yellow |

Character body colours — kept close to the old cast's identity colours so the
roster stays recognisable through the reset, pushed toward flatter, more
saturated sticker tones:

`#FF5A3C` red (الفنان) · `#FFC53D` yellow (الناقد, shared with the brand
accent) · `#2EBD6B` green (الملخبط) · `#2954E8` blue (المتحمس, shared with the
brand primary — deliberate: the excited character and the brand share one
blue) · `#F472A8` pink (البريء) · `#7B6FC9` purple (المحقق)

Rules:

- **Blue and yellow are structural** — UI chrome, the logo, primary actions.
  They are not "just two more accents" among the character colours.
- Each character keeps **one dominant body colour**, flat, with at most one
  small accent (a scarf, a sash) — no multi-colour costumes.
- **No gradients, no neon, no pastel wash.** Flat, confident, saturated fills.
- Colour is reinforced by **silhouette + signature prop**, never the only
  thing separating two characters (§3).

## 7. Shading

- **Flat fills**, optionally one soft shadow tone for grounding (a character
  standing on a surface, a card lifted off the page) — lighter-handed than the
  old system's loose misregistered shadow, closer to a clean flat drop shadow
  or none at all.
- **No airbrush, no glow, no rim light, no ambient occlusion, no 3D render.**
- No paper-grain or dry-brush texture — that belonged to the warm-paper world
  and reads as dated against a clean white/grid ground.

## 8. Detail level

Low. Read at **48px** first: silhouette, signature prop and expression must
survive. Interior detail is minimal by design — this is a sticker language,
not an illustration one. Character assets ship on a **transparent**
background unless the asset is explicitly a scene or a UI mockup.

## 9. Backgrounds and the grid system

- **Two zones, not one wash.** The actual UI surface (cards, the canvas, form
  fields) is clean white — the grid never runs behind live content, it would
  fight legibility. The **margin/page zone** around and behind the UI carries
  a **light blue grid-paper pattern**: thin, low-contrast graph-paper lines on
  white, evoking a notebook page without competing with anything on it.
- Doodles (§2) live in that same margin zone, never inside a card or on the
  canvas.
- Scene illustrations (hero art, mode scenes) sit on **plain white**, cut out
  and composited by the app onto whichever zone they land in — never
  generated with the grid baked into the character art itself.
- **Flat, straight-on staging** for any scene with multiple characters. No
  dramatic camera angles, no vanishing points, no built environments — a
  floor line and a prop or two is enough.

## 10. Motion (applied in code, planned in art)

Unchanged in principle: assets are generated as stills, motion is Framer
Motion in code — squash, stretch, anticipation, overshoot, stagger. The
simplified new shapes make this *easier*, not harder: a marker-barrel body or
an egg squashes cleanly with no loose limbs to break the illusion.

---

## 11. Forbidden

Any of these means regenerate:

- Photorealism, 3D render, Pixar-style CG, clay render
- Anime or manga styling
- Watercolour, oil paint, loose pencil-sketch rendering
- Gradient meshes, glassmorphism, neon glow, chrome
- Realistic human beings
- Preschool primary palettes and nursery motifs (this is a confident sticker
  language, not a toddler one — see §1)
- Text or lettering baked into character/scene artwork (the logo is the one
  deliberate exception, §19)
- Watermarks, signatures, borders, frames
- Emoji, or anything derived from emoji design language
- Generic stock-illustration mascots
- Doodle marks drawn **over** a character's own body or a UI surface (§2, §9)

---

## 12. The cast — canon

**Ten characters, split into two tiers.**

- **Main cast (6)** — `mainCast: true`. The faces of وش ذا؟: Home hero, splash,
  mode scenes, tutorials, empty states, reactions, share art, marketing.
  Anything representing the game itself uses ONLY these six.
- **Player-only cast (4)** — `mainCast: false`. Added so a full room of ten
  players can each be someone different. Fully playable and shown wherever
  their player appears, but they never carry the identity, and **no existing
  scene is regenerated to include them.**

Colour identifies them in prose; form identifies them on screen.

### Main cast

| Colour | Character | Personality | Locked form (new shape language) |
|---|---|---|---|
| Red | **الفنان المتفلسف** | Confident, self-important, treats catastrophic drawings as masterpieces | A tall marker/pen-barrel body; **the black beret is core identity and never comes off**; holds a brush or palette |
| Yellow | **الناقد** | Low energy, permanently unimpressed; sarcastic and judgmental | Wide, low, egg-shaped; a scarf or shemagh wrap; arms crossed by default; heavy flat brow |
| Green | **الملخبط** | Always visibly trying to work out what is happening | Round, soft, slightly slouched thobe-like silhouette; a puzzled tilt to the head; wide-set unfocused eyes |
| Blue | **المتحمس** | Enormous energy; fast, exaggerated, physical | Compact and spiky-haired; caped or wrapped in motion lines; poses mid-motion, fist raised |
| Pink | **البريء المشبوه** | Sweet and guileless to a degree that becomes funny under suspicion | Small, neat, rounded silhouette in a simple hijab; hands clasped; oversized guileless eyes |
| Purple | **المحقق** | Cold, reserved, watches everyone with quiet suspicion | Tall and narrow in a full thobe and ghutra with igal; holds a magnifying glass; narrowed eyes |

### Player-only cast

Designed to fill silhouette gaps the main cast leaves, not to repeat its
personalities. None of them wears Saudi clothing: the two costume variants in
the main cast already carry that representation, and adding more "for balance"
is the costume-theme failure §13 forbids.

| Colour | Character | Personality | Locked form (new shape language) |
|---|---|---|---|
| Lime | **الواثق زيادة** | Certain he has the answer, consistently wrong | Barrel-chested with a comically small head; hands on hips, wide planted stance |
| Ember | **الدرامي** | Every minor event is a catastrophe | Tall and narrow, a dramatic scarf or collar flaring behind; arms flung overhead |
| Slate | **الهادي** | Minimal reactions amid total chaos | The smallest and lowest of the ten: a wide flattened dome, barely any limbs showing |
| Cocoa | **المشاغب** | Enjoys wrecking it more than winning | Lopsided posture, one shoulder higher than the other, hands hidden behind the back |

The closest silhouette pair in the full ten is **الناقد** and **الواثق زيادة**,
both wide masses. They separate on the triangular negative space under the
hands-on-hips stance, and on the critic's forward hunch. Verified by compositing
an actual silhouette lineup, not by eye on the colour versions.

### What must survive every generation

Head shape · body shape · head-to-body ratio · limb length · hand and foot
shape · eyes · eyebrows · mouth · signature garment or prop (beret, ghutra,
hijab, magnifying glass, spiky hair) · base colour · silhouette.

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

**A costumed character is the same character.** Clothing is added *onto* the
canon design — it is never an excuse to redraw the character.

### What a costume may never change

The face · the eyes · the expression · the base colour · the personality ·
the visual age.

These five are the identity test. If a player can still name the character from
them at a glance, the variant is valid.

### Silhouette: important, but not absolute

Preserving the original silhouette matters and is the default goal. It is
**not** a hard requirement for costume variants.

Clothing is allowed to change the outer shape when the result is visually
stronger, so long as the character stays recognisable by the five properties
above. **Do not reject a successful variant merely because it altered the base
outline.**

The approved pink hijab variant is the reference case: the long hijab covers
most of the body and clearly changes the egg silhouette, and it is canon
anyway — the face, the oversized eyes, the innocent expression, the pink and
the personality all survive intact, and the result reads better than the
head-only alternative.

The one failure mode still worth rejecting on sight is a costume that looks
**pasted on top** rather than following the character's actual form. The purple
detective's ghutra drapes over his tall narrow angular head and stays
recognisably his; that is the standard.

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

## 19. Master Style Anchor & logo

The reset (§0) needs a new binding reference before anything else is
regenerated against it.

### Master Style Anchor

A single image establishing the new world: two or three cast members
reinterpreted in the new shape language (§3–§5), on plain white, generated
first and reviewed against the acceptance checklist (§21) before anything
else is produced. Every subsequent character or scene generation passes this
image as a reference alongside that character's own canon art once it exists.

### Logo

The logo is the one place text is allowed baked into generated art (§11) —
everywhere else, the game name is set in the app's own Arabic type, never as
an image.

Requirements:

- **«وش ذا؟» in Arabic**, hand-lettered with the same confident marker feel
  as the line system (§2) — thick, slightly imperfect letterforms, not a
  digital font.
- Ink black `#151515` primary letterforms, with the brand blue `#2954E8` and
  yellow `#FFC53D` (§6) used the way the reference uses them: one word or
  stroke picked out in colour, not a rainbow treatment.
- Reads clearly at icon scale (down to 32px) as well as full lockup scale.
- Generated in the required set: full lockup (with the "لعبة الرسم
  والتخمين" tagline ribbon), wide/horizontal lockup, icon-only mark (for
  favicon/app-icon use), a version staged on the grid background (§9), and a
  version staged inside the app UI (a card or splash screen).
- The mark may be surrounded by the same margin-zone doodles as any other
  screen (§2, §9) — stars, a pencil, question marks — but the wordmark itself
  stays legible as the focal point, never crowded.

## 20. Prompt template

Every generation starts from this. Fill the bracketed slots; never drop the
style block.

```
[SUBJECT AND ACTION — one clear sentence, e.g.
 "a confident cartoon character in a black beret, holding a paintbrush,
  looking proudly at a terrible drawing"]

STYLE: modern hand-drawn marker/sticker illustration, confident uniform black
outlines (#151515), minimal hand-drawn imperfection — a steady marker, not a
shaky sketch — flat colour fills with at most one soft grounding shadow,
simplified iconic silhouettes (a rounded body mass, real legible limbs and
clothing, not rubber-hose abstraction), large head on a compact body, bold
readable silhouette at small sizes.

PALETTE: plain white background, one dominant body colour from [#FF5A3C red /
#FFC53D yellow / #2EBD6B green / #2954E8 blue / #F472A8 pink / #7B6FC9 purple]
with at most one small accent (a scarf, a sash) — never a multi-colour
costume.

COMPOSITION: [full body / bust], flat straight-on view, centred, generous
margin, plain flat solid white background.

NEGATIVE: photorealistic, 3d render, cgi, pixar, clay, anime, manga,
watercolour, oil painting, loose pencil sketch, gradient mesh, glassmorphism,
neon glow, chrome, realistic human, preschool primary colours, nursery
decoration, text, letters, words, watermark, signature, frame, border, emoji,
sticker pack, stock illustration, rubber-hose limbs, warm paper texture.
```

### Never ask a model for a transparent background

Writing "transparent background" in a prompt does not produce an alpha channel.
The model **paints the checkerboard pattern** it has seen in a million training
images, and the result arrives as an opaque grey grid.

Always ask for a *plain flat solid* background, then cut it out afterwards with
the background-removal tool. This cost a full batch of mode scenes once; it does
not need to happen twice.

(Some models expose a real `remove_bg` parameter — that one is genuine and is
fine to use. It is the prompt wording that fails.)

---

## 21. Acceptance checklist

An asset ships only if every line is true:

1. Same world as the new Master Style Anchor — could sit beside it on one
   screen.
2. Silhouette + signature prop/garment together identify the character (§3).
3. Readable at 48px.
4. Ink is near-black `#151515`, uniform weight, not a wobbling sketch line.
5. Palette is on-spec: white ground, one dominant flat body colour, blue/
   yellow reserved for brand and المتحمس.
6. Shading is flat, at most one soft grounding shadow. No render effects, no
   paper-grain texture.
7. No text, watermark, frame or signature (except the logo itself, §19).
8. Transparent background where required; grid/doodles are never baked into
   character art (§9).
9. Expression is exaggerated enough to read instantly.
10. Limbs and clothing read as real limbs and clothing, not rubber-hose
    abstraction.

Fail any line, regenerate. Do not fix art by hand or in code.
