#!/usr/bin/env python3
"""Create responsive WebP derivatives without modifying the supplied originals."""

from pathlib import Path
from PIL import Image, ImageOps


ASSETS_DIR = Path(__file__).resolve().parents[1] / "public" / "assets"
TARGET_WIDTHS = (320, 480, 640, 1200)


def main() -> None:
    for source in sorted(ASSETS_DIR.glob("monkey[1-4].webp")):
        with Image.open(source) as opened:
            original = ImageOps.exif_transpose(opened)
            for width in TARGET_WIDTHS:
                image = original.copy()
                if image.width <= width:
                    continue
                image.thumbnail((width, width), Image.Resampling.LANCZOS)
                mode = "RGBA" if "A" in image.getbands() else "RGB"
                image = image.convert(mode)
                output = source.with_name(f"{source.stem}-{width}.webp")
                image.save(output, format="WEBP", quality=84, method=6)
                print(f"{source.name} -> {output.name}: {image.width}x{image.height}, {output.stat().st_size} bytes")


if __name__ == "__main__":
    main()
