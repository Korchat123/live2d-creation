"""Build a dark-background contact sheet for anatomy asset review."""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image, ImageDraw


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--asset", default="source/source.png")
    parser.add_argument("--kit")
    parser.add_argument("--gender")
    args = parser.parse_args()

    if args.kit:
        kit = args.root / args.kit
        if args.gender:
            kit /= args.gender
        make_part_sheet(kit, args.output)
        return

    kits = sorted(
        gender
        for style in args.root.iterdir()
        if style.is_dir()
        for gender in style.iterdir()
        if gender.is_dir() and gender.name in {"female", "male", "androgynous"}
    )
    tile_width, tile_height = 300, 390
    columns = 6
    rows = (len(kits) + columns - 1) // columns
    sheet = Image.new("RGB", (tile_width * columns, tile_height * rows), "#171923")
    draw = ImageDraw.Draw(sheet)

    for index, kit in enumerate(kits):
        path = kit / args.asset
        if not path.exists():
            continue
        with Image.open(path).convert("RGBA") as source:
            source.thumbnail((330, 380), Image.Resampling.LANCZOS)
            x = index % columns * tile_width + (tile_width - source.width) // 2
            y = index // columns * tile_height + 28
            sheet.paste(source, (x, y), source)
        label = f"{kit.parent.name} · {kit.name}"
        draw.text((index % columns * tile_width + 12, index // columns * tile_height + 8), label, fill="white")

    args.output.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(args.output)


def make_part_sheet(kit: Path, output: Path) -> None:
    paths = sorted(
        path
        for path in kit.rglob("*.png")
        if "source" not in path.parts
    )
    tile_width, tile_height = 260, 250
    columns = 7
    rows = (len(paths) + columns - 1) // columns
    sheet = Image.new("RGB", (tile_width * columns, tile_height * rows), "#171923")
    draw = ImageDraw.Draw(sheet)

    for index, path in enumerate(paths):
        with Image.open(path).convert("RGBA") as source:
            source.thumbnail((230, 205), Image.Resampling.LANCZOS)
            x = index % columns * tile_width + (tile_width - source.width) // 2
            y = index // columns * tile_height + 30
            sheet.paste(source, (x, y), source)
        label = path.relative_to(kit).with_suffix("").as_posix()
        draw.text((index % columns * tile_width + 8, index // columns * tile_height + 8), label, fill="white")

    output.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(output)


if __name__ == "__main__":
    main()
