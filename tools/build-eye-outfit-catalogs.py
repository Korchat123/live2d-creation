"""Build registered semantic eye and outfit layers from keyed generated sources."""

from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter


CANVAS = 2048


def region_mask(box: tuple[int, int, int, int], feather: int = 4) -> Image.Image:
    mask = Image.new("L", (CANVAS, CANVAS), 0)
    ImageDraw.Draw(mask).rectangle(box, fill=255)
    return mask.filter(ImageFilter.GaussianBlur(feather))


def save_layer(source: Image.Image, mask: Image.Image, output: Path) -> None:
    layer = source.copy()
    layer.putalpha(ImageChops.multiply(source.getchannel("A"), mask))
    output.parent.mkdir(parents=True, exist_ok=True)
    layer.save(output, compress_level=3)


def build_eye_parts(source: Image.Image, target: Path) -> dict[str, dict[str, object]]:
    alpha = source.getchannel("A")
    parts: dict[str, dict[str, object]] = {}
    for side, x_range in (("left", (0, CANVAS // 2)), ("right", (CANVAS // 2, CANVAS))):
        half = Image.new("L", source.size)
        ImageDraw.Draw(half).rectangle((x_range[0], 0, x_range[1], CANVAS), fill=255)
        bbox = ImageChops.multiply(alpha, half).getbbox()
        if bbox is None:
            raise ValueError(f"No {side} eye artwork found")
        x1, y1, x2, y2 = bbox
        height = y2 - y1
        brow_bottom = y1 + round(height * 0.34)
        eye_top = y1 + round(height * 0.28)
        eye_mid = eye_top + round((y2 - eye_top) * 0.52)
        eye_width = x2 - x1
        iris_x1 = x1 + round(eye_width * 0.31)
        iris_x2 = x2 - round(eye_width * 0.31)
        pupil_x1 = x1 + round(eye_width * 0.41)
        pupil_x2 = x2 - round(eye_width * 0.41)
        boxes = {
            f"brows/brow-{side}": (x1, y1, x2, brow_bottom),
            f"eye-whites/eye-white-{side}": (x1, eye_top, x2, y2),
            f"irises/iris-{side}": (iris_x1, eye_top, iris_x2, y2),
            f"pupils/pupil-{side}": (pupil_x1, eye_top, pupil_x2, y2),
            f"upper-lashes/upper-lash-{side}": (x1, eye_top, x2, eye_mid),
            f"lower-lashes/lower-lash-{side}": (x1, eye_mid, x2, y2),
            f"highlights/highlight-{side}": (iris_x1, eye_top, iris_x2, eye_mid),
        }
        for name, box in boxes.items():
            output = target / f"{name}.png"
            save_layer(source, region_mask(box), output)
            parts[name] = {"file": f"{name}.png", "region": list(box)}
    return parts


def build_outfit_parts(source: Image.Image, target: Path) -> dict[str, dict[str, object]]:
    boxes = {
        "collar/collar": (0.4, 0.12, 0.6, 0.3),
        "upper-body/upper-body": (0.34, 0.17, 0.66, 0.48),
        "waist/waist": (0.34, 0.38, 0.66, 0.57),
        "lower-garment/lower-garment": (0.29, 0.47, 0.71, 0.82),
        "sleeves/sleeve-left": (0.02, 0.14, 0.43, 0.36),
        "sleeves/sleeve-right": (0.57, 0.14, 0.98, 0.36),
        "cuffs/cuff-left": (0.06, 0.14, 0.2, 0.36),
        "cuffs/cuff-right": (0.8, 0.14, 0.94, 0.36),
        "legwear/legwear-left": (0.31, 0.52, 0.505, 0.94),
        "legwear/legwear-right": (0.495, 0.52, 0.69, 0.94),
        "footwear/footwear-left": (0.28, 0.83, 0.505, 1.0),
        "footwear/footwear-right": (0.495, 0.83, 0.72, 1.0),
        "other/center-detail": (0.39, 0.16, 0.61, 0.68),
    }
    parts: dict[str, dict[str, object]] = {}
    for name, normalized in boxes.items():
        box = tuple(round(value * CANVAS) for value in normalized)
        mask = region_mask(box, 5)
        if ImageChops.multiply(source.getchannel("A"), mask).getbbox() is None:
            continue
        save_layer(source, mask, target / f"{name}.png")
        parts[name] = {"file": f"{name}.png", "region": list(normalized)}
    return parts


def process(assignments: list[dict[str, str]], root: Path, helper: Path, kind: str) -> None:
    for assignment in assignments:
        style = assignment["style"]
        target = root / style
        source_dir = target / "source"
        source_dir.mkdir(parents=True, exist_ok=True)
        keyed = source_dir / "source-keyed.png"
        native = source_dir / "source-native.png"
        registered = source_dir / "source.png"
        shutil.copy2(assignment["source"], keyed)
        subprocess.run([
            sys.executable, str(helper), "--input", str(keyed), "--out", str(native),
            "--auto-key", "border", "--soft-matte", "--transparent-threshold", "12",
            "--opaque-threshold", "220", "--despill", "--edge-contract", "1", "--force",
        ], check=True)
        with Image.open(native).convert("RGBA") as image:
            source = image.resize((CANVAS, CANVAS), Image.Resampling.LANCZOS)
        native.unlink()
        source.save(registered, compress_level=3)
        parts = build_eye_parts(source, target) if kind == "eyes" else build_outfit_parts(source, target)
        manifest = {
            "version": 1,
            "kind": kind,
            "style": style,
            "name": assignment["name"],
            "canvas": [CANVAS, CANVAS],
            "source": "source/source.png",
            "parts": parts,
        }
        (target / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--eyes-map", required=True, type=Path)
    parser.add_argument("--outfits-map", required=True, type=Path)
    parser.add_argument("--eyes-root", required=True, type=Path)
    parser.add_argument("--outfits-root", required=True, type=Path)
    parser.add_argument("--chroma-helper", required=True, type=Path)
    args = parser.parse_args()
    process(json.loads(args.eyes_map.read_text(encoding="utf-8")), args.eyes_root, args.chroma_helper, "eyes")
    process(json.loads(args.outfits_map.read_text(encoding="utf-8")), args.outfits_root, args.chroma_helper, "outfits")


if __name__ == "__main__":
    main()
