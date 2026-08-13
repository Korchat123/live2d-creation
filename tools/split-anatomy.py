"""Split a registered transparent T-pose anatomy source into full-canvas layers."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from PIL import Image


def build_parts(profile: dict[str, object], gender: str) -> dict[str, tuple[float, float, float, float]]:
    head = profile["head"]
    ears = profile["ears"]
    arm_y1, arm_y2 = profile["arm_band"]
    body_x1, body_y1, body_x2, body_y2 = profile["body"]
    torso_split = profile["torso_split"]
    hip_y, knee_y, ankle_y, foot_y = profile["leg_joints"]
    leg_left = profile["leg_left"]
    leg_right = profile["leg_right"]
    left_outer, left_wrist, left_elbow, left_shoulder = profile["arm_left"]
    right_shoulder, right_elbow, right_wrist, right_outer = profile["arm_right"]
    joint_pad_x = 0.018
    joint_pad_y = 0.026

    parts = {
        "facebase/facebase": tuple(head),
        "ears/ear-left": tuple(ears[0]),
        "ears/ear-right": tuple(ears[1]),
        "upper-body/upper-body": (body_x1, body_y1, body_x2, torso_split + 0.03),
        "lower-body/lower-body": (body_x1 - 0.015, torso_split - 0.03, body_x2 + 0.015, body_y2),
        "shoulders/shoulder-left": (left_shoulder - 0.055, arm_y1 - 0.025, body_x1 + 0.04, arm_y2 + 0.025),
        "shoulders/shoulder-right": (body_x2 - 0.04, arm_y1 - 0.025, right_shoulder + 0.055, arm_y2 + 0.025),
        "upper-arms/upper-arm-left": (left_elbow - joint_pad_x, arm_y1, left_shoulder + joint_pad_x, arm_y2),
        "upper-arms/upper-arm-right": (right_shoulder - joint_pad_x, arm_y1, right_elbow + joint_pad_x, arm_y2),
        "elbows/elbow-left": (left_elbow - 0.035, arm_y1 - 0.015, left_elbow + 0.035, arm_y2 + 0.015),
        "elbows/elbow-right": (right_elbow - 0.035, arm_y1 - 0.015, right_elbow + 0.035, arm_y2 + 0.015),
        "lower-arms/lower-arm-left": (left_wrist - joint_pad_x, arm_y1, left_elbow + joint_pad_x, arm_y2),
        "lower-arms/lower-arm-right": (right_elbow - joint_pad_x, arm_y1, right_wrist + joint_pad_x, arm_y2),
        "wrists/wrist-left": (left_wrist - 0.028, arm_y1 - 0.012, left_wrist + 0.028, arm_y2 + 0.012),
        "wrists/wrist-right": (right_wrist - 0.028, arm_y1 - 0.012, right_wrist + 0.028, arm_y2 + 0.012),
        "hands/hand-left": (left_outer, arm_y1 - 0.035, left_wrist + joint_pad_x, arm_y2 + 0.035),
        "hands/hand-right": (right_wrist - joint_pad_x, arm_y1 - 0.035, right_outer, arm_y2 + 0.035),
        "upper-legs/upper-leg-left": (leg_left[0], hip_y - joint_pad_y, leg_left[1], knee_y + joint_pad_y),
        "upper-legs/upper-leg-right": (leg_right[0], hip_y - joint_pad_y, leg_right[1], knee_y + joint_pad_y),
        "knees/knee-left": (leg_left[0], knee_y - 0.04, leg_left[1], knee_y + 0.04),
        "knees/knee-right": (leg_right[0], knee_y - 0.04, leg_right[1], knee_y + 0.04),
        "lower-legs/lower-leg-left": (leg_left[0], knee_y - joint_pad_y, leg_left[1], ankle_y + joint_pad_y),
        "lower-legs/lower-leg-right": (leg_right[0], knee_y - joint_pad_y, leg_right[1], ankle_y + joint_pad_y),
        "ankles/ankle-left": (leg_left[0] - 0.01, ankle_y - 0.035, leg_left[1] + 0.01, ankle_y + 0.035),
        "ankles/ankle-right": (leg_right[0] - 0.01, ankle_y - 0.035, leg_right[1] + 0.01, ankle_y + 0.035),
        "feet/foot-left": (leg_left[0] - 0.025, ankle_y - joint_pad_y, leg_left[1], foot_y),
        "feet/foot-right": (leg_right[0], ankle_y - joint_pad_y, leg_right[1] + 0.025, foot_y),
        "other/neck": (0.43, head[3] - 0.025, 0.57, body_y1 + 0.055),
    }
    if gender == "female":
        parts["bust/bust"] = (
            body_x1 + 0.035,
            body_y1 + 0.07,
            body_x2 - 0.035,
            min(torso_split + 0.005, body_y1 + 0.18),
        )
    return parts


def normalized_box(box: tuple[float, float, float, float], size: tuple[int, int]) -> tuple[int, int, int, int]:
    width, height = size
    return tuple(round(value * (width if index % 2 == 0 else height)) for index, value in enumerate(box))


def extract(source: Image.Image, box: tuple[int, int, int, int]) -> Image.Image:
    return source.crop(box)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", required=True, type=Path)
    parser.add_argument("--kit", required=True, type=Path)
    parser.add_argument("--layouts", required=True, type=Path)
    parser.add_argument("--profile", required=True)
    parser.add_argument("--gender", required=True, choices=("female", "male", "androgynous"))
    args = parser.parse_args()

    source = Image.open(args.source).convert("RGBA")
    if source.size != (2048, 2048):
        raise ValueError(f"Expected a 2048x2048 source, received {source.size}")

    layouts = json.loads(args.layouts.read_text(encoding="utf-8"))
    if args.profile not in layouts:
        raise ValueError(f"Unknown anatomy profile: {args.profile}")
    parts = build_parts(layouts[args.profile], args.gender)

    manifest = {
        "canvas": [2048, 2048],
        "profile": args.profile,
        "gender": args.gender,
        "source": args.source.name,
        "parts": {},
    }
    for name, relative_box in parts.items():
        output = args.kit / f"{name}.png"
        output.parent.mkdir(parents=True, exist_ok=True)
        pixel_box = normalized_box(relative_box, source.size)
        extract(source, pixel_box).save(output, compress_level=3)
        manifest["parts"][name] = {
            "file": str(output.relative_to(args.kit)).replace("\\", "/"),
            "crop": pixel_box,
            "offset": pixel_box[:2],
            "size": [pixel_box[2] - pixel_box[0], pixel_box[3] - pixel_box[1]],
        }

    (args.kit / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
