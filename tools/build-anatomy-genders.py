"""Build gender variants from keyed anime anatomy sources."""

from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
from pathlib import Path

from PIL import Image


def run(command: list[str]) -> None:
    subprocess.run(command, check=True)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--map", required=True, type=Path)
    parser.add_argument("--root", required=True, type=Path)
    parser.add_argument("--layouts", required=True, type=Path)
    parser.add_argument("--chroma-helper", required=True, type=Path)
    parser.add_argument("--splitter", required=True, type=Path)
    args = parser.parse_args()

    assignments = json.loads(args.map.read_text(encoding="utf-8"))
    for assignment in assignments:
        style = assignment["style"]
        gender = assignment["gender"]
        source_path = Path(assignment["source"])
        target = args.root / style / gender
        source_dir = target / "source"
        source_dir.mkdir(parents=True, exist_ok=True)
        keyed = source_dir / "source-keyed.png"
        native = source_dir / "source-native.png"
        registered = source_dir / "source.png"
        shutil.copy2(source_path, keyed)

        run([
            sys.executable,
            str(args.chroma_helper),
            "--input", str(keyed),
            "--out", str(native),
            "--auto-key", "border",
            "--soft-matte",
            "--transparent-threshold", "12",
            "--opaque-threshold", "220",
            "--despill",
            "--force",
        ])
        with Image.open(native).convert("RGBA") as source:
            source.resize((2048, 2048), Image.Resampling.LANCZOS).save(registered, compress_level=3)
        native.unlink()

        run([
            sys.executable,
            str(args.splitter),
            "--source", str(registered),
            "--kit", str(target),
            "--layouts", str(args.layouts),
            "--profile", style,
            "--gender", gender,
        ])


if __name__ == "__main__":
    main()
