#!/usr/bin/env python3
"""
Compose a scene out of the owner's real cutouts.

The hero, the splash backdrop and the five mode scenes each show several
characters in a situation. They are NOT generated: the owner rejected the
generated cast, so a generated group shot would put rejected characters back on
the most visible screens in the app. Instead each scene is assembled from the
actual poses cut off the owner's sheets, plus a few generated non-character
props (a sheet of paper, an easel), which is the only part of a scene that no
sheet supplies.

A scene is a list of placements against a normalised stage:

    x, y      where the piece's anchor sits, 0..1 across the stage
    h         the piece's height as a fraction of stage height
    anchor    which point of the piece x/y refers to; defaults to bottom-centre
              so figures line up on a common ground line rather than by their
              bounding boxes, which differ wildly between a standing المحقق and
              a crouching الهادئ
    flip      mirror horizontally, so a row of characters can face inward

Pieces are drawn in list order, so later entries overlap earlier ones. Overlap
is what makes a group read as one group rather than a row of stickers, so the
scenes deliberately tuck figures behind each other.
"""

import argparse
import json
import os

from PIL import Image

POSES = "art-reference/pose-library"
PROPS = "art-reference/props"


def load_piece(name: str) -> Image.Image:
    """Find a piece by name in the pose library or the prop folder."""
    for folder in (POSES, PROPS):
        path = os.path.join(folder, f"{name}.webp")
        if os.path.exists(path):
            return Image.open(path).convert("RGBA")
    raise SystemExit(f"no such piece: {name}")


def place(stage: Image.Image, spec: dict, sw: int, sh: int, bleed: int) -> None:
    """Draw one piece. `sw`/`sh` are the nominal stage; `bleed` is the margin."""
    piece = load_piece(spec["piece"])

    target_h = round(sh * spec["h"])
    scale = target_h / piece.height
    piece = piece.resize(
        (max(1, round(piece.width * scale)), target_h), Image.LANCZOS
    )
    if spec.get("flip"):
        piece = piece.transpose(Image.FLIP_LEFT_RIGHT)

    x = round(sw * spec["x"]) + bleed
    y = round(sh * spec["y"]) + bleed
    anchor = spec.get("anchor", "bottom-center")
    if anchor == "bottom-center":
        x -= piece.width // 2
        y -= piece.height
    elif anchor == "center":
        x -= piece.width // 2
        y -= piece.height // 2
    else:
        raise SystemExit(f"unknown anchor: {anchor}")

    stage.alpha_composite(piece, (x, y))


def build(scene: dict, out_path: str) -> None:
    # Compose at 2x and downsample. The pieces are cut from photographs of
    # pencil art, so their edges carry real texture; scaling each one straight
    # to final size makes that edge crawl, while one downsample at the end
    # resolves it evenly across the whole scene.
    w, h = scene["width"], scene["height"]

    # Bleed. Placements are given against the nominal stage, but a wide piece
    # near x=0.08 extends past the left edge and would be clipped before the
    # trim below ever runs. Since the scene is trimmed to its content anyway,
    # the working canvas can be generously larger at no cost — x/y stay
    # relative to the nominal stage, which is what the numbers in the spec
    # describe.
    bleed = max(w, h)
    stage = Image.new("RGBA", (w * 2 + bleed * 2, h * 2 + bleed * 2), (0, 0, 0, 0))

    for spec in scene["pieces"]:
        place(stage, spec, w * 2, h * 2, bleed)

    # Trim to what was actually drawn, so a scene has no dead margin to centre
    # against later.
    box = stage.getbbox()
    if box:
        stage = stage.crop(box)

    scale = min(w / stage.width, h / stage.height)
    stage = stage.resize(
        (max(1, round(stage.width * scale)), max(1, round(stage.height * scale))),
        Image.LANCZOS,
    )

    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    stage.save(out_path, "WEBP", quality=88, method=6)
    size = os.path.getsize(out_path) // 1024
    print(f"  {os.path.basename(out_path):38} {str(stage.size):12} {size:>4} KB")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("spec", help="JSON file of scene definitions")
    ap.add_argument("out_dir")
    ap.add_argument("--only", help="build just this one scene")
    args = ap.parse_args()

    with open(args.spec, encoding="utf-8") as fh:
        scenes = json.load(fh)

    for name, scene in scenes.items():
        if args.only and name != args.only:
            continue
        build(scene, os.path.join(args.out_dir, f"{name}.webp"))
