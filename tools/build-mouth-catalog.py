"""Split a generated 4x2 mouth sheet into registered Live2D draft assets."""

import json
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SHEET = ROOT / "assets/parts/mouth/source/expressions.png"
OUTPUT = ROOT / "assets/parts/mouth"
CANVAS = 2048
MOUTH_Y = 1390

STYLES = [
    ("neutral-closed", "Neutral closed", 300, 80),
    ("gentle-smile", "Gentle smile", 320, 100),
    ("small-open", "Small open", 260, 180),
    ("wide-happy", "Wide happy", 360, 260),
    ("surprised-o", "Surprised O", 170, 230),
    ("frown", "Frown", 300, 110),
    ("teeth-smile", "Teeth smile", 340, 160),
    ("tongue-smile", "Tongue smile", 350, 230),
]


def color_layer(source: Image.Image, predicate) -> Image.Image:
    result = Image.new("RGBA", source.size)
    source_pixels = source.load()
    target_pixels = result.load()
    for y in range(source.height):
        for x in range(source.width):
            red, green, blue, alpha = source_pixels[x, y]
            if alpha and predicate(red, green, blue):
                target_pixels[x, y] = (red, green, blue, alpha)
    return result


def main() -> None:
    with Image.open(SHEET).convert("RGBA") as sheet:
        cell_width = sheet.width // 4
        cell_height = sheet.height // 2
        catalog = []
        for index, (style, name, max_width, max_height) in enumerate(STYLES):
            column, row = index % 4, index // 4
            cell = sheet.crop((column * cell_width, row * cell_height, (column + 1) * cell_width, (row + 1) * cell_height))
            bbox = cell.getchannel("A").getbbox()
            if bbox is None:
                raise ValueError(f"No mouth artwork in cell {index}")
            cropped = cell.crop(bbox)
            scale = min(max_width / cropped.width, max_height / cropped.height)
            size = (max(1, round(cropped.width * scale)), max(1, round(cropped.height * scale)))
            mouth = cropped.resize(size, Image.Resampling.LANCZOS)
            registered = Image.new("RGBA", (CANVAS, CANVAS))
            offset = ((CANVAS - size[0]) // 2, MOUTH_Y - size[1] // 2)
            registered.alpha_composite(mouth, offset)

            style_root = OUTPUT / style
            source_path = style_root / "source/source.png"
            source_path.parent.mkdir(parents=True, exist_ok=True)
            registered.save(source_path, compress_level=3)
            predicates = {
                "line": lambda r, g, b: max(r, g, b) < 135,
                "inside": lambda r, g, b: r > g * 1.15 and r < 190 and b < 150,
                "teeth": lambda r, g, b: min(r, g, b) > 205,
                "tongue": lambda r, g, b: r > 170 and g > 70 and g < 205 and b > 80,
            }
            parts = {}
            for part, predicate in predicates.items():
                layer = color_layer(registered, predicate)
                if layer.getchannel("A").getbbox():
                    path = style_root / f"layers/{part}.png"
                    path.parent.mkdir(parents=True, exist_ok=True)
                    layer.save(path, compress_level=3)
                    parts[part] = f"layers/{part}.png"
                layer.close()
            manifest = {
                "version": 1,
                "kind": "mouth",
                "style": style,
                "name": name,
                "canvas": [CANVAS, CANVAS],
                "registration": {"target": "anime-neutral-v3", "center": [1024, MOUTH_Y]},
                "source": "source/source.png",
                "parts": parts,
            }
            (style_root / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
            catalog.append({"style": style, "name": name})
            for image in (cell, cropped, mouth, registered):
                image.close()
        (OUTPUT / "catalog.json").write_text(json.dumps(catalog, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
