"""Build a dark QA sheet for registered catalog sources, optionally over a base."""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image, ImageDraw


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--base", type=Path)
    args = parser.parse_args()

    paths = sorted(args.root.glob("*/source/source.png"))
    columns, tile_width, tile_height = 5, 360, 430
    rows = (len(paths) + columns - 1) // columns
    sheet = Image.new("RGB", (columns * tile_width, rows * tile_height), "#171923")
    draw = ImageDraw.Draw(sheet)

    base = Image.open(args.base).convert("RGBA") if args.base else None
    try:
        for index, path in enumerate(paths):
            with Image.open(path).convert("RGBA") as source:
                if base:
                    composed = Image.new("RGBA", source.size)
                    composed.alpha_composite(base.resize(source.size, Image.Resampling.LANCZOS))
                    composed.alpha_composite(source)
                    source = composed
                source.thumbnail((tile_width - 24, tile_height - 48), Image.Resampling.LANCZOS)
                x = index % columns * tile_width + (tile_width - source.width) // 2
                y = index // columns * tile_height + 30
                sheet.paste(source, (x, y), source)
            draw.text((index % columns * tile_width + 10, index // columns * tile_height + 8), path.parents[1].name, fill="white")
    finally:
        if base:
            base.close()
    sheet.save(args.output)


if __name__ == "__main__":
    main()
