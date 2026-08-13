"""Resize a transparent anatomy source to the fixed registration canvas."""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--size", default=2048, type=int)
    args = parser.parse_args()

    with Image.open(args.input).convert("RGBA") as source:
        resized = source.resize((args.size, args.size), Image.Resampling.LANCZOS)
        args.output.parent.mkdir(parents=True, exist_ok=True)
        resized.save(args.output, compress_level=3)


if __name__ == "__main__":
    main()
