"""Render a mixed-parts character for a fast visual integration check."""

from pathlib import Path
from PIL import Image, ImageChops, ImageColor, ImageDraw, ImageOps


ROOT = Path(__file__).resolve().parents[1]
CANVAS = 2048


def open_rgba(relative: str) -> Image.Image:
    return Image.open(ROOT / relative).convert("RGBA")


def tint_hair(layer: Image.Image, color: str) -> Image.Image:
    red, green, blue = ImageColor.getrgb(color)
    shadow = (round(red * 0.22), round(green * 0.22), round(blue * 0.22))
    light = tuple(round(value + (255 - value) * 0.45) for value in (red, green, blue))
    tinted = ImageOps.colorize(ImageOps.grayscale(layer), shadow, light).convert("RGBA")
    tinted.putalpha(layer.getchannel("A"))
    return tinted


def scale_hair_canvas(layer: Image.Image, scale: float = 1.2) -> Image.Image:
    resized = layer.resize((round(CANVAS * scale), round(CANVAS * scale)), Image.Resampling.LANCZOS)
    anchor = (CANVAS * .5, CANVAS * .45)
    offset = (round(anchor[0] - anchor[0] * scale), round(anchor[1] - anchor[1] * scale))
    canvas = Image.new("RGBA", (CANVAS, CANVAS))
    canvas.alpha_composite(resized, offset)
    resized.close()
    return canvas


def composite_paths(target: Image.Image, paths: list[str], color: str) -> None:
    for path in paths:
        with open_rgba(path) as source:
            tinted = tint_hair(source, color)
            fitted = scale_hair_canvas(tinted)
            target.alpha_composite(fitted)
            fitted.close()
            tinted.close()


def apply_eye_color(target: Image.Image, style: str, channel: str, color: str, opacity: float) -> None:
    with open_rgba(f"assets/parts/eyes/{style}/color-masks/{channel}.png") as mask_source:
        alpha = mask_source.getchannel("A").point(lambda value: round(value * opacity))
        tint = Image.new("RGBA", target.size, color)
        tint.putalpha(alpha)
        target.alpha_composite(tint)
        tint.close()
        alpha.close()


def fit_head(layer: Image.Image) -> Image.Image:
    return layer.resize((round(CANVAS * 0.1388), round(CANVAS * 0.1625)), Image.Resampling.LANCZOS)


def scale_from_anchor(layer: Image.Image, offset: tuple[int, int], anchor: tuple[int, int], scale_y: float, width_factor: float) -> tuple[Image.Image, tuple[int, int]]:
    scale_x = scale_y * width_factor
    resized = layer.resize((round(layer.width * scale_x), round(layer.height * scale_y)), Image.Resampling.LANCZOS)
    local_anchor = (anchor[0] - offset[0], anchor[1] - offset[1])
    placed = (round(anchor[0] - local_anchor[0] * scale_x), round(anchor[1] - local_anchor[1] * scale_y))
    return resized, placed


def clip_face_neck(face: Image.Image) -> None:
    width, height = face.size
    points = [(0, 0), (width, 0), (width, height * .82), (width * .65, height * .82),
              (width * .62, height), (width * .38, height), (width * .35, height * .82), (0, height * .82)]
    shape = Image.new("L", face.size)
    ImageDraw.Draw(shape).polygon(points, fill=255)
    face.putalpha(ImageChops.multiply(face.getchannel("A"), shape))
    shape.close()


def add_anime_face_overlays(target: Image.Image) -> None:
    """Add soft cheek blush, delicate nose bridge, and expressive eyebrows for anime aesthetics."""
    # Cheek blush layer
    blush_layer = Image.new("RGBA", target.size, (0, 0, 0, 0))
    blush_draw = ImageDraw.Draw(blush_layer)
    blush_draw.ellipse([850, 1070, 950, 1130], fill=(255, 120, 150, 120))
    blush_draw.ellipse([1098, 1070, 1198, 1130], fill=(255, 120, 150, 120))
    target.alpha_composite(blush_layer)
    blush_layer.close()

    draw = ImageDraw.Draw(target)

    # Eyebrows
    brow_color = (41, 38, 45, 230)
    draw.arc([880, 940, 960, 990], start=190, end=350, fill=brow_color, width=6)
    draw.arc([1088, 940, 1168, 990], start=190, end=350, fill=brow_color, width=6)

    # Nose tip & bridge shadow
    draw.line([(1022, 1085), (1026, 1098), (1020, 1102)], fill=(160, 90, 80, 190), width=3)


def clip_half(layer: Image.Image, side: str) -> Image.Image:
    clipped = layer.copy()
    alpha = clipped.getchannel("A")
    if side == "left":
        alpha.paste(0, (CANVAS // 2, 0, CANVAS, CANVAS))
    else:
        alpha.paste(0, (0, 0, CANVAS // 2, CANVAS))
    clipped.putalpha(alpha)
    alpha.close()
    return clipped


def main() -> None:
    outfit = open_rgba("assets/parts/outfits/academy-blazer/source/source.png")
    hands = open_rgba("assets/anatomy/idol-balanced/androgynous/hands/hands-registered.png")
    face = open_rgba("assets/parts/face-base/idol-balanced/androgynous.png")
    clip_face_neck(face)
    eyes = open_rgba("assets/parts/eyes/classic-blue/source/source.png")
    mouth = open_rgba("assets/parts/mouth/gentle-smile/source/source.png")

    back_head = Image.new("RGBA", (CANVAS, CANVAS))
    front_head = Image.new("RGBA", (CANVAS, CANVAS))
    back_paths = [
        *(f"assets/parts/hair/long-straight/back-hair/back-{part}.png" for part in ("left", "center", "right")),
        *(f"assets/parts/hair/long-straight/nape/nape-{part}.png" for part in ("left", "right")),
    ]
    front_paths = [
        *(f"assets/parts/hair/long-straight/side-locks/side-lock-{part}.png" for part in ("left", "right")),
        *(f"assets/parts/hair/long-straight/front-hair/front-{part}.png" for part in ("left", "center", "right")),
        "assets/parts/hair/long-straight/other/crown.png",
    ]
    composite_paths(back_head, back_paths, "#29262d")
    with open_rgba("assets/parts/hair/long-straight/source/source.png") as scalp:
        scalp_alpha = scalp.getchannel("A")
        scalp_alpha.paste(0, (0, round(CANVAS * .58), CANVAS, CANVAS))
        scalp.putalpha(scalp_alpha)
        tinted_scalp = tint_hair(scalp, "#29262d")
        fitted_scalp = scale_hair_canvas(tinted_scalp)
        front_head.alpha_composite(fitted_scalp)
        fitted_scalp.close()
        tinted_scalp.close()
        scalp_alpha.close()

    front_head.alpha_composite(eyes)
    apply_eye_color(front_head, "classic-blue", "sclera", "#fff7fa", 0.8)
    apply_eye_color(front_head, "classic-blue", "iris", "#43c984", 0.72)
    apply_eye_color(front_head, "classic-blue", "pupil", "#321454", 0.82)
    front_head.alpha_composite(mouth)

    # Add anime facial features (eyebrows, nose, blush)
    add_anime_face_overlays(front_head)

    composite_paths(front_head, front_paths, "#29262d")

    back_head_fitted = fit_head(back_head)
    front_head_fitted = fit_head(front_head)
    head_offset = (round(CANVAS * 0.4306), round(CANVAS * 0.0118))
    face_offset = (922, 41)
    head_anchor = (1024, 328)
    back_head_scaled, back_offset = scale_from_anchor(back_head_fitted, head_offset, head_anchor, 1.08, 1.05)
    front_head_scaled, front_offset = scale_from_anchor(front_head_fitted, head_offset, head_anchor, 1.08, 1.05)
    face_scaled, scaled_face_offset = scale_from_anchor(face, face_offset, head_anchor, 1.08, 1.05)

    left_hand = clip_half(hands, "left")
    right_hand = clip_half(hands, "right")
    # Natural hand placement near sleeve cuffs
    left_hand_scaled, left_hand_offset = scale_from_anchor(left_hand, (0, 0), (344, 440), .84, 0.95)
    right_hand_scaled, right_hand_offset = scale_from_anchor(right_hand, (0, 0), (1704, 440), .84, 0.95)

    composed = Image.new("RGBA", (CANVAS, CANVAS))
    composed.alpha_composite(back_head_scaled, back_offset)
    composed.alpha_composite(left_hand_scaled, left_hand_offset)
    composed.alpha_composite(right_hand_scaled, right_hand_offset)
    composed.alpha_composite(outfit)
    composed.alpha_composite(face_scaled, scaled_face_offset)
    composed.alpha_composite(front_head_scaled, front_offset)

    background = Image.new("RGBA", (CANVAS, CANVAS), "#f5f0eb")
    background.alpha_composite(composed)
    output = ROOT / "final-product-preview.png"
    background.convert("RGB").save(output, quality=95)

    for image in (outfit, hands, left_hand, right_hand, left_hand_scaled, right_hand_scaled, face, eyes, mouth, back_head, front_head, back_head_fitted, front_head_fitted, back_head_scaled, front_head_scaled, face_scaled, composed, background):
        image.close()
    print(output)


if __name__ == "__main__":
    main()
