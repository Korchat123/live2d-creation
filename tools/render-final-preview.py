"""Render the default layered character for a fast visual integration check."""

from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
CANVAS = 2048


def open_rgba(relative: str) -> Image.Image:
    return Image.open(ROOT / relative).convert("RGBA")


def main() -> None:
    outfit = open_rgba("assets/parts/outfits/academy-blazer/source/source.png")
    hands = open_rgba("assets/anatomy/idol-balanced/androgynous/hands/hands-registered.png")
    face = open_rgba("assets/parts/face-base/anime-neutral-v3.png")
    eyes = open_rgba("assets/parts/eyes/classic-blue/source/source.png")
    hair = open_rgba("assets/parts/hair/long-straight/source/source.png")

    composed = Image.new("RGBA", (CANVAS, CANVAS))
    for layer in (outfit, hands):
        composed.alpha_composite(layer)

    head = Image.new("RGBA", (CANVAS, CANVAS))
    for layer in (face, eyes, hair):
        head.alpha_composite(layer)
    head_width = round(CANVAS * 0.13)
    head = head.resize((head_width, head_width), Image.Resampling.LANCZOS)
    composed.alpha_composite(head, (round(CANVAS * 0.435), round(CANVAS * 0.004)))

    background = Image.new("RGBA", (CANVAS, CANVAS), "#f2eee9")
    background.alpha_composite(composed)
    output = ROOT / "final-product-preview.png"
    background.convert("RGB").save(output, quality=94)

    for image in (outfit, hands, face, eyes, hair, head, composed, background):
        image.close()
    print(output)


if __name__ == "__main__":
    main()
