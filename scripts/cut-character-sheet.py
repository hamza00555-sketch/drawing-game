#!/usr/bin/env python3
"""
Cut individual poses out of an owner-supplied character sheet.

The sheets are hand-made pose grids on cream graph paper. Their layout is NOT
uniform — most are a 3x3 grid, but المسرحي puts three stacked faces in a narrow
fourth column and الهادئ runs four uneven rows — so poses are DETECTED rather
than sliced out of an assumed grid.

Three things make a naive "everything that isn't the background" mask wrong:

  - The sheets are decorated with light-blue pencil doodles (stars, swirls,
    arrows) scattered through the margins. They are part of the sheet, not part
    of any character.
  - المتحمس is himself blue, so the doodles cannot be filtered by hue.
  - Each pose stands on a scribbled pencil ground-shadow that touches its feet,
    so it is neither a separate component nor a separable colour — measured on
    the sheets, shadow and body blue overlap in both brightness and hue.

So a figure is found by MASS. Everything drawn is masked by colour, that mask is
opened to erase anything wispy, and each surviving blob above an area threshold
is one pose. The doodles and the ground-shadows are thin and fall away; the
poses are solid and do not. Filling the blob then recovers the whole figure
including any pale interior the colour test missed.

Detected poses are numbered in reading order (right-to-left, matching the way
the sheets are laid out). `--contact` renders them numbered so the mapping in
POSES below can be checked by eye; which pose plays which role is a judgement
call, so it is written down rather than guessed at.
"""

import argparse
import os

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

# A component smaller than this fraction of the sheet is decoration, not a pose.
MIN_AREA_FRACTION = 0.004

# Which detected pose fills which role, per character. Indices are the numbers
# `--contact` draws. Chosen by eye from the contact sheets: `idle` is the
# neutral front-facing stand, `face` the clearest head-only expression,
# `action` the most animated full-body pose, and `costume` the one wearing the
# character's accessory.
POSES: dict[str, dict[str, int]] = {
    "artist": {"idle": 8, "face": 5, "action": 7, "costume": 6},
    "calm": {"idle": 7, "face": 4, "action": 6, "costume": 8},
    "confident": {"idle": 8, "face": 5, "action": 7, "costume": 6},
    "confused": {"idle": 8, "face": 4, "action": 7, "costume": 6},
    "critic": {"idle": 8, "face": 4, "action": 7, "costume": 6},
    "detective": {"idle": 8, "face": 4, "action": 7, "costume": 6},
    "dramatic": {"idle": 8, "face": 4, "action": 3, "costume": 6},
    "excited": {"idle": 8, "face": 3, "action": 6, "costume": 7},
    "innocent": {"idle": 8, "face": 5, "action": 7, "costume": 6},
    "trickster": {"idle": 8, "face": 5, "action": 7, "costume": 6},
}


def ink_mask(rgb: np.ndarray) -> np.ndarray:
    """True on the dark outline ink.

    Every character is drawn with a closed dark contour. The pencil doodles and
    the ground-shadow under each pose are not outlined at all, which is what
    makes this mask — not colour — the reliable way to tell them apart: the
    body blue and the shadow blue overlap in both brightness and hue, so no
    threshold on colour separates them.
    """
    return rgb.max(axis=2).astype(int) < 165


def build_mask(rgb: np.ndarray) -> np.ndarray:
    """True where a pixel belongs to drawn artwork rather than the paper."""
    mx = rgb.max(axis=2).astype(int)
    sat = mx - rgb.min(axis=2).astype(int)

    # Saturated fill: the character's body colour. The paper is near-neutral
    # (sat well under 30) and the grid lines are only slightly blue, so a
    # threshold here separates body from page without touching either.
    strong = (sat > 55) & (mx < 250)

    return ink_mask(rgb) | strong


def find_poses(mask: np.ndarray, ink: np.ndarray) -> list[np.ndarray]:
    """Filled silhouettes of every pose on the sheet, in reading order."""
    # A pose in pale costume — the white thobe — has no saturated fill at all,
    # so the colour mask holds only its thin outline, which the opening below
    # would erase and lose the pose entirely. Sealing and filling the ink first
    # turns any outlined figure into a solid mass, whatever colour it is.
    mask = mask | ndimage.binary_fill_holes(
        ndimage.binary_closing(ink, structure=np.ones((7, 7)))
    )

    # The pencil ground-shadow is dark enough to register as ink and saturated
    # enough to register as fill, and it fuses to the outline at the feet, so
    # neither colour nor connectivity alone separates it. What does separate it
    # is density: a pose is a solid mass, the shadow a speckly wisp, and an
    # opening erases the wisp. Note this runs on the full mask, not the outline
    # alone — a filled body tolerates a 5x5 erosion, whereas the same erosion
    # severs a thin outline and drops half the poses on المسرحي's sheet.
    solid = ndimage.binary_opening(mask, structure=np.ones((5, 5)))

    # Then close small gaps: the art is drawn with a textured brush and can be
    # a pixel thin in places, which would split one figure into several
    # components and lose an arm.
    body = ndimage.binary_closing(solid, structure=np.ones((7, 7)))

    labels, count = ndimage.label(body, structure=np.ones((3, 3)))
    if count == 0:
        return []

    floor = mask.size * MIN_AREA_FRACTION
    found = []
    for label in range(1, count + 1):
        blob = labels == label
        if blob.sum() < floor:
            continue
        found.append(ndimage.binary_fill_holes(blob))

    # Reading order: top to bottom, then right to left within a band. Poses on
    # one row are never perfectly aligned, so rows are banded by a fraction of
    # the sheet height rather than by exact centroid.
    band = mask.shape[0] / 12

    def order(blob):
        ys, xs = np.where(blob)
        return (round(ys.mean() / band), -xs.mean())

    return sorted(found, key=order)


def cutout(rgb: np.ndarray, mask: np.ndarray, silhouette: np.ndarray) -> Image.Image:
    """Trim one pose to a transparent RGBA image."""
    # Let the silhouette breathe by a couple of pixels so the outline's own soft
    # edge is not shaved off, then keep the drawn pixels inside it.
    region = ndimage.binary_dilation(silhouette, structure=np.ones((5, 5)))
    local = mask & region

    # Fill from the figure's OWN outline, with no closing first: the silhouette
    # was sealed with a 7x7 closing to survive component labelling, and that
    # closing spans gaps the drawing does not have.
    #
    # This fills every enclosed pocket, which is right for eye whites, teeth and
    # the white thobe, and wrong for the narrow paper channel between a hanging
    # arm and the torso — that comes out an opaque cream sliver. The two cannot
    # be told apart: measured across the sheets they overlap on hole colour
    # (eye whites sit CLOSER to the paper colour than the thobe does), on area,
    # and on max inscribed radius. Filling everything is the safe direction of
    # error, since a cream sliver on the app's near-white ground is far less
    # visible than a character with transparent eyes would be.
    keep = ndimage.binary_fill_holes(local)

    ys, xs = np.where(keep)
    pad = 8
    top, bottom = max(0, ys.min() - pad), min(keep.shape[0], ys.max() + 1 + pad)
    left, right = max(0, xs.min() - pad), min(keep.shape[1], xs.max() + 1 + pad)

    alpha = (keep * 255).astype(np.uint8)
    rgba = np.dstack([rgb, alpha])[top:bottom, left:right]
    return Image.fromarray(rgba, "RGBA")


def fit(im: Image.Image, long_edge: int) -> Image.Image:
    scale = long_edge / max(im.size)
    return im.resize(
        (max(1, round(im.width * scale)), max(1, round(im.height * scale))),
        Image.LANCZOS,
    )


def load(sheet_path: str):
    rgb = np.asarray(Image.open(sheet_path).convert("RGB"))
    mask = build_mask(rgb)
    return rgb, mask, find_poses(mask, ink_mask(rgb))


def contact(sheet_path: str, out_path: str) -> None:
    """Render every detected pose, numbered, so the POSES table can be checked."""
    rgb, mask, poses = load(sheet_path)

    cell = 260
    cols = 5
    rows = (len(poses) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * cell, rows * cell), (128, 128, 128))
    draw = ImageDraw.Draw(sheet)

    for i, silhouette in enumerate(poses):
        im = fit(cutout(rgb, mask, silhouette), cell - 40)
        r, c = divmod(i, cols)
        x, y = c * cell, r * cell
        sheet.paste(im, (x + (cell - im.width) // 2, y + (cell - im.height) // 2), im)
        draw.text((x + 6, y + 6), str(i), fill=(255, 255, 0))

    sheet.save(out_path)
    print(f"{os.path.basename(sheet_path)}: {len(poses)} poses -> {out_path}")


def cut(sheet_path: str, out_dir: str, character: str) -> None:
    rgb, mask, poses = load(sheet_path)
    picks = POSES.get(character)
    if not picks:
        raise SystemExit(f"no POSES entry for {character}; run --contact first")

    os.makedirs(out_dir, exist_ok=True)
    for role, index in picks.items():
        if index >= len(poses):
            raise SystemExit(
                f"{character}: pose {index} for {role} but only "
                f"{len(poses)} detected"
            )
        im = fit(cutout(rgb, mask, poses[index]), 420 if role == "face" else 900)
        # Asset ids are `{character}_{variant}_{pose}`. The costume is a variant
        # in the idle pose, not a pose of its own.
        name = (
            f"{character}_costume_idle.webp"
            if role == "costume"
            else f"{character}_default_{role}.webp"
        )
        path = os.path.join(out_dir, name)
        im.save(path, "WEBP", quality=90)
        print(f"  {name:34} {str(im.size):12} {os.path.getsize(path) // 1024:>4} KB")


def cut_all(sheet_path: str, out_dir: str, character: str) -> None:
    """Export every detected pose as `{character}_{index}.webp`.

    The shipped art uses four poses per character, but the scenes are composed
    from the owner's real cutouts rather than from anything generated, so the
    other five need to exist somewhere. This writes the full library; it is a
    working set, not shipped art.
    """
    rgb, mask, poses = load(sheet_path)
    os.makedirs(out_dir, exist_ok=True)
    for i, silhouette in enumerate(poses):
        im = fit(cutout(rgb, mask, silhouette), 900)
        im.save(os.path.join(out_dir, f"{character}_{i}.webp"), "WEBP", quality=92)
    print(f"  {character}: {len(poses)} poses")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("sheet")
    ap.add_argument("out")
    ap.add_argument("character")
    ap.add_argument("--contact", action="store_true", help="render numbered poses")
    ap.add_argument("--all", action="store_true", help="export every pose")
    args = ap.parse_args()

    if args.contact:
        contact(args.sheet, args.out)
    elif args.all:
        cut_all(args.sheet, args.out, args.character)
    else:
        cut(args.sheet, args.out, args.character)
