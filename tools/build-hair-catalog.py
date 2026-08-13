"""Convert keyed anime hairstyles into registered semantic Live2D draft layers."""

from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter


CANVAS = 2048


def rectangle_mask(box: tuple[float, float, float, float], feather: int = 5) -> Image.Image:
    mask = Image.new("L", (CANVAS, CANVAS), 0)
    draw = ImageDraw.Draw(mask)
    draw.rectangle(tuple(round(value * CANVAS) for value in box), fill=255)
    return mask.filter(ImageFilter.GaussianBlur(feather)) if feather else mask


def save_layer(source: Image.Image, alpha: Image.Image, output: Path) -> None:
    layer = source.copy()
    layer.putalpha(ImageChops.multiply(source.getchannel("A"), alpha))
    output.parent.mkdir(parents=True, exist_ok=True)
    layer.save(output, compress_level=3)


def build_parts(style: str, source: Image.Image) -> dict[str, dict[str, str]]:
    optional = {
        "messy-ahoge": {"ahoge/ahoge": (0.39, 0.0, 0.61, 0.2)},
        "double-bun": {
            "buns/bun-left": (0.05, 0.02, 0.38, 0.35),
            "buns/bun-right": (0.62, 0.02, 0.95, 0.35),
        },
        "side-braid": {"braids/braid-left": (0.0, 0.34, 0.43, 1.0)},
        "high-ponytail": {"ponytails/ponytail": (0.15, 0.02, 0.85, 0.92)},
        "twin-tails": {
            "twin-tails/twin-tail-left": (0.0, 0.2, 0.34, 0.95),
            "twin-tails/twin-tail-right": (0.66, 0.2, 1.0, 0.95),
        },
    }
    boxes = {
        "back-hair/back-left": (0.0, 0.08, 0.43, 1.0),
        "back-hair/back-center": (0.39, 0.03, 0.61, 1.0),
        "back-hair/back-right": (0.57, 0.08, 1.0, 1.0),
        "front-hair/front-left": (0.2, 0.08, 0.46, 0.56),
        "front-hair/front-center": (0.42, 0.05, 0.58, 0.58),
        "front-hair/front-right": (0.54, 0.08, 0.8, 0.56),
        "side-locks/side-lock-left": (0.12, 0.28, 0.39, 0.82),
        "side-locks/side-lock-right": (0.61, 0.28, 0.88, 0.82),
        "nape/nape-left": (0.18, 0.58, 0.5, 1.0),
        "nape/nape-right": (0.5, 0.58, 0.82, 1.0),
        "other/crown": (0.22, 0.0, 0.78, 0.36),
        **optional.get(style, {}),
    }

    parts: dict[str, dict[str, str]] = {}
    for name, box in boxes.items():
        mask = rectangle_mask(box)
        masked_alpha = ImageChops.multiply(source.getchannel("A"), mask)
        if masked_alpha.getbbox() is None:
            continue
        relative = Path(name + ".png")
        save_layer(source, mask, relative)
        parts[name] = {"file": relative.as_posix(), "region": list(box)}
    return parts


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--map", required=True, type=Path)
    parser.add_argument("--root", required=True, type=Path)
    parser.add_argument("--chroma-helper", required=True, type=Path)
    args = parser.parse_args()

    assignments = json.loads(args.map.read_text(encoding="utf-8"))
    for assignment in assignments:
        style = assignment["style"]
        target = args.root / style
        source_dir = target / "source"
        source_dir.mkdir(parents=True, exist_ok=True)
        keyed = source_dir / "source-keyed.png"
        native = source_dir / "source-native.png"
        registered = source_dir / "source.png"
        shutil.copy2(assignment["source"], keyed)
        subprocess.run([
            sys.executable, str(args.chroma_helper),
            "--input", str(keyed), "--out", str(native),
            "--auto-key", "border", "--soft-matte",
            "--transparent-threshold", "12", "--opaque-threshold", "220",
            "--despill", "--edge-contract", "1", "--force",
        ], check=True)
        with Image.open(native).convert("RGBA") as image:
            source = image.resize((CANVAS, CANVAS), Image.Resampling.LANCZOS)
        native.unlink()
        source.save(registered, compress_level=3)

        current = Path.cwd()
        try:
            # build_parts writes relative paths so every manifest remains portable.
            import os
            os.chdir(target)
            parts = build_parts(style, source)
        finally:
            os.chdir(current)
        manifest = {
            "version": 1,
            "style": style,
            "name": assignment["name"],
            "canvas": [CANVAS, CANVAS],
            "source": "source/source.png",
            "parts": parts,
        }
        (target / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
