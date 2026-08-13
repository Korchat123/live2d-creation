"""Derive registered adjustable face and covered bust layers from approved anatomy art."""

from __future__ import annotations

import json
import shutil
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
ANATOMY = ROOT / "assets" / "anatomy"
PARTS = ROOT / "assets" / "parts"
STYLES = (
    "shojo-grace", "shonen-athletic", "chibi-pop", "bishonen-sleek", "seinen-heroic",
    "josei-elegant", "genki-compact", "idol-balanced", "fantasy-elfin", "retro-90s",
)
GENDERS = ("female", "male", "androgynous")


def build_bust(style: str) -> dict[str, object]:
    kit = ANATOMY / style / "female"
    manifest = json.loads((kit / "manifest.json").read_text(encoding="utf-8"))
    bust = manifest["parts"]["bust/bust"]
    crop = tuple(bust["crop"])
    with Image.open(kit / bust["file"]).convert("RGBA") as chest:
        width, height = chest.size
        mask = Image.new("L", chest.size, 0)
        draw = ImageDraw.Draw(mask)
        overlap = max(3, round(width * 0.035))
        top = round(-height * 0.2)
        bottom = round(height * 1.2)
        draw.ellipse((-overlap, top, width // 2 + overlap, bottom), fill=255)
        draw.ellipse((width // 2 - overlap, top, width + overlap, bottom), fill=255)
        mask = mask.filter(ImageFilter.GaussianBlur(max(3, round(width * 0.018))))
        vertical = Image.new("L", chest.size, 0)
        vertical_pixels = vertical.load()
        for y in range(height):
            position = y / max(1, height - 1)
            if position < 0.22:
                alpha = round(255 * position / 0.22)
            elif position > 0.84:
                alpha = round(255 * (1 - position) / 0.16)
            else:
                alpha = 255
            for x in range(width):
                vertical_pixels[x, y] = max(0, min(255, alpha))
        mask = ImageChops.multiply(mask, vertical)
        mask = ImageChops.multiply(chest.getchannel("A"), mask)
        chest.putalpha(mask)

        output_dir = PARTS / "bust" / style
        output_dir.mkdir(parents=True, exist_ok=True)
        center = width // 2
        full_layer = Image.new("RGBA", (2048, 2048))
        full_layer.alpha_composite(chest, (crop[0], crop[1]))
        full_layer.save(output_dir / "bust-full.png", compress_level=3)
        for side, bounds in (("left", (0, 0, center + overlap, height)), ("right", (center - overlap, 0, width, height))):
            layer = Image.new("RGBA", (2048, 2048))
            piece = chest.crop(bounds)
            x = crop[0] + bounds[0]
            layer.alpha_composite(piece, (x, crop[1]))
            layer.save(output_dir / f"bust-{side}.png", compress_level=3)

    return {
        "style": style,
        "anchor": [1024, round((crop[1] + crop[3]) / 2)],
        "sourceCrop": list(crop),
        "left": f"./assets/parts/bust/{style}/bust-left.png",
        "right": f"./assets/parts/bust/{style}/bust-right.png",
        "thumbnail": f"./assets/parts/bust/{style}/bust-full.png",
    }


def build_faces() -> list[dict[str, object]]:
    faces = []
    for style in STYLES:
        for gender in GENDERS:
            kit = ANATOMY / style / gender
            manifest = json.loads((kit / "manifest.json").read_text(encoding="utf-8"))
            face = manifest["parts"]["facebase/facebase"]
            target = PARTS / "face-base" / style / f"{gender}.png"
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(kit / face["file"], target)
            faces.append({
                "style": style,
                "gender": gender,
                "asset": f"./assets/parts/face-base/{style}/{gender}.png",
                "sourceCrop": face["crop"],
            })
    return faces


def main() -> None:
    busts = [build_bust(style) for style in STYLES]
    faces = build_faces()
    contract = {
        "version": 1,
        "parameters": {
            "bustSize": {"min": 0, "default": 1, "max": 1.65, "step": 0.05},
            "bustSpacing": {"min": 0.9, "default": 1, "max": 1.12, "step": 0.01},
            "bustHeight": {"min": -0.03, "default": 0, "max": 0.03, "step": 0.005},
            "faceScale": {"min": 0.92, "default": 1, "max": 1.08, "step": 0.01},
            "headWidth": {"min": 0.92, "default": 1, "max": 1.08, "step": 0.01},
            "jawWidth": {"min": 0.88, "default": 1, "max": 1.12, "step": 0.01},
            "jawLength": {"min": 0.94, "default": 1, "max": 1.06, "step": 0.01}
        },
        "busts": busts,
        "faces": faces,
    }
    (PARTS / "adjustment-contract.json").write_text(json.dumps(contract, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
