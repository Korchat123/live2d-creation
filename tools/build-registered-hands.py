"""Create full-canvas hand layers for dressed character composition."""

import json
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1] / "assets" / "anatomy"


def main() -> None:
    for manifest_path in sorted(ROOT.glob("*/*/manifest.json")):
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        canvas = Image.new("RGBA", tuple(manifest["canvas"]))
        for side in ("left", "right"):
            part = manifest["parts"][f"hands/hand-{side}"]
            with Image.open(manifest_path.parent / part["file"]).convert("RGBA") as hand:
                canvas.alpha_composite(hand, tuple(part["offset"]))
        output = manifest_path.parent / "hands" / "hands-registered.png"
        output.parent.mkdir(parents=True, exist_ok=True)
        canvas.save(output, compress_level=3)
        canvas.close()
        manifest["dressed_preview"] = {"hands": "hands/hands-registered.png"}
        manifest_path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
        print(manifest_path.parent.relative_to(ROOT))


if __name__ == "__main__":
    main()
