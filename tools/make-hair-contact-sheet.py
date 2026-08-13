"""Build dark-background source or layer contact sheets for hair QA."""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image, ImageDraw


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--style")
    parser.add_argument("--face", type=Path)
    args = parser.parse_args()

    if args.style:
        paths = sorted(path for path in (args.root / args.style).rglob("*.png") if "source" not in path.parts)
        columns, tile_width, tile_height = 4, 420, 430
        labels = [path.relative_to(args.root / args.style).with_suffix("").as_posix() for path in paths]
    else:
        paths = sorted(args.root.glob("*/source/source.png"))
        columns, tile_width, tile_height = 5, 360, 430
        labels = [path.parents[1].name for path in paths]

    rows = (len(paths) + columns - 1) // columns
    sheet = Image.new("RGB", (tile_width * columns, tile_height * rows), "#171923")
    draw = ImageDraw.Draw(sheet)
    for index, (path, label) in enumerate(zip(paths, labels)):
        with Image.open(path).convert("RGBA") as source:
            if args.face and not args.style:
                with Image.open(args.face).convert("RGBA") as face:
                    composite = Image.new("RGBA", source.size)
                    composite.alpha_composite(face.resize(source.size, Image.Resampling.LANCZOS))
                    composite.alpha_composite(source)
                    source = composite
            source.thumbnail((tile_width - 24, tile_height - 48), Image.Resampling.LANCZOS)
            x = index % columns * tile_width + (tile_width - source.width) // 2
            y = index // columns * tile_height + 30
            sheet.paste(source, (x, y), source)
        draw.text((index % columns * tile_width + 10, index // columns * tile_height + 8), label, fill="white")
    sheet.save(args.output)


if __name__ == "__main__":
    main()
