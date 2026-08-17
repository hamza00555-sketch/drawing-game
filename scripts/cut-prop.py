#!/usr/bin/env python3
"""
Cut a generated prop out of its flat white background.

Not the same problem as removing a background from a photo. Most of these props
ARE white — a sheet of paper, a blank canvas — on a white field, so no
brightness threshold separates object from background. What does separate them
is the outline: every prop is drawn with a dark contour, so the background is
whatever white is reachable from the image border, and the paper's own white is
white that is enclosed.

Multiple objects are kept, not just the largest, because one prop is three
stacked cards.
"""

import argparse
import os

import numpy as np
from PIL import Image
from scipy import ndimage

# Anything at least this far off the flat white field counts as drawn.
INK_MAX = 244
INK_SAT = 14

# Components below this fraction of the frame are JPEG-ish speckle, not a prop.
MIN_AREA_FRACTION = 0.0008


def cut(path: str, out_path: str, long_edge: int) -> None:
    rgb = np.asarray(Image.open(path).convert("RGB"))
    mx = rgb.max(axis=2).astype(int)
    sat = mx - rgb.min(axis=2).astype(int)
    drawn = (mx < INK_MAX) | (sat > INK_SAT)

    # Seal one-pixel breaks in the contour so the fill cannot leak out through
    # them, then fill: enclosed white becomes part of the prop, and the white
    # connected to the border stays background.
    sealed = ndimage.binary_closing(drawn, structure=np.ones((3, 3)))
    solid = ndimage.binary_fill_holes(sealed)

    labels, count = ndimage.label(solid, structure=np.ones((3, 3)))
    keep = np.zeros_like(solid)
    floor = solid.size * MIN_AREA_FRACTION
    for label in range(1, count + 1):
        blob = labels == label
        if blob.sum() >= floor:
            keep |= blob

    if not keep.any():
        raise SystemExit(f"nothing found in {path}")

    ys, xs = np.where(keep)
    pad = 4
    top, bottom = max(0, ys.min() - pad), min(keep.shape[0], ys.max() + 1 + pad)
    left, right = max(0, xs.min() - pad), min(keep.shape[1], xs.max() + 1 + pad)

    rgba = np.dstack([rgb, (keep * 255).astype(np.uint8)])[top:bottom, left:right]
    im = Image.fromarray(rgba, "RGBA")

    scale = long_edge / max(im.size)
    im = im.resize(
        (max(1, round(im.width * scale)), max(1, round(im.height * scale))),
        Image.LANCZOS,
    )
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    im.save(out_path, "WEBP", quality=90, method=6)
    print(f"  {os.path.basename(out_path):26} {str(im.size):12} "
          f"{os.path.getsize(out_path) // 1024:>4} KB")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("src")
    ap.add_argument("out")
    ap.add_argument("--long-edge", type=int, default=900)
    args = ap.parse_args()
    cut(args.src, args.out, args.long_edge)
