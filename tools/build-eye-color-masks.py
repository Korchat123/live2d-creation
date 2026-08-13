"""Extract precise sclera, iris, and pupil tint masks from registered eye sources."""

import json
from pathlib import Path

from PIL import Image, ImageFilter


ROOT = Path(__file__).resolve().parents[1] / "assets" / "parts" / "eyes"


def channel_mask(source: Image.Image, channel: str, boxes: list[list[int]]) -> Image.Image:
    pixels = source.load()
    mask = Image.new("L", source.size)
    output = mask.load()
    for x1, y1, x2, y2 in boxes:
      for y in range(y1, y2):
        for x in range(x1, x2):
            red, green, blue, alpha = pixels[x, y]
            if alpha < 16:
                continue
            high, low = max(red, green, blue), min(red, green, blue)
            selected = (
                channel == "sclera" and high - low < 42 and high > 174
                or channel == "iris" and high - low > 55 and high > 56
                or channel == "pupil" and high < 72
            )
            if selected:
                output[x, y] = alpha
    return mask.filter(ImageFilter.GaussianBlur(0.7))


def main() -> None:
    for manifest_path in sorted(ROOT.glob("*/manifest.json")):
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        with Image.open(manifest_path.parent / manifest["source"]).convert("RGBA") as source:
            directory = manifest_path.parent / "color-masks"
            directory.mkdir(exist_ok=True)
            for channel in ("sclera", "iris", "pupil"):
                part_group = {"sclera": "eye-whites", "iris": "irises", "pupil": "pupils"}[channel]
                boxes = [part["region"] for name, part in manifest["parts"].items() if name.startswith(f"{part_group}/")]
                mask = channel_mask(source, channel, boxes)
                rgba = Image.new("RGBA", source.size, "white")
                rgba.putalpha(mask)
                rgba.save(directory / f"{channel}.png", compress_level=3)
                mask.close()
                rgba.close()
        manifest["color_masks"] = {channel: f"color-masks/{channel}.png" for channel in ("sclera", "iris", "pupil")}
        manifest_path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
        print(manifest_path.parent.name)


if __name__ == "__main__":
    main()
