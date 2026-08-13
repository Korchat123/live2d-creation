"""Fit generated eye artwork to the approved 2048px face registration."""

import json
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1] / "assets" / "parts" / "eyes"
CANVAS = 2048
SCALE = 0.58
INWARD_SHIFT = 100


def centered_fit(image: Image.Image) -> Image.Image:
    size = round(CANVAS * SCALE)
    fitted = image.resize((size, size), Image.Resampling.LANCZOS)
    result = Image.new("RGBA", (CANVAS, CANVAS))
    offset = (CANVAS - size) // 2
    result.alpha_composite(fitted, (offset, offset))
    fitted.close()
    return result


def transform_region(region: list[int]) -> list[int]:
    offset = (CANVAS - round(CANVAS * SCALE)) // 2
    return [round(value * SCALE + offset) for value in region]


def shift_layer(path: Path, direction: int | None) -> None:
    with Image.open(path).convert("RGBA") as image:
        result = Image.new("RGBA", (CANVAS, CANVAS))
        if direction is None:
            left = image.crop((0, 0, CANVAS // 2, CANVAS))
            right = image.crop((CANVAS // 2, 0, CANVAS, CANVAS))
            result.alpha_composite(left, (INWARD_SHIFT, 0))
            result.alpha_composite(right, (CANVAS // 2 - INWARD_SHIFT, 0))
            left.close()
            right.close()
        else:
            result.alpha_composite(image, (direction * INWARD_SHIFT, 0))
        result.save(path, compress_level=3)
        result.close()


def main() -> None:
    for manifest_path in sorted(ROOT.glob("*/manifest.json")):
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        style_root = manifest_path.parent
        registration = manifest.get("registration", {})
        if registration.get("face_scale") != SCALE:
            paths = [style_root / manifest["source"]]
            paths.extend(style_root / part["file"] for part in manifest["parts"].values())
            for path in paths:
                with Image.open(path).convert("RGBA") as image:
                    fitted = centered_fit(image)
                    fitted.save(path, compress_level=3)
                    fitted.close()
            for part in manifest["parts"].values():
                part["region"] = transform_region(part["region"])
        if registration.get("inward_shift") != INWARD_SHIFT:
            shift_layer(style_root / manifest["source"], None)
            for name, part in manifest["parts"].items():
                direction = 1 if name.endswith("-left") else -1
                shift_layer(style_root / part["file"], direction)
                part["region"][0] += direction * INWARD_SHIFT
                part["region"][2] += direction * INWARD_SHIFT
        manifest["registration"] = {
            "target": "anime-neutral-v3",
            "face_scale": SCALE,
            "origin": [0.5, 0.5],
            "inward_shift": INWARD_SHIFT,
        }
        manifest_path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
        print(manifest_path.parent.name)


if __name__ == "__main__":
    main()
