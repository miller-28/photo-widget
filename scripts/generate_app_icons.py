from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
ICON_DIR = ROOT / "src-tauri" / "icons"

PNG_SIZES = {
    "32x32.png": 32,
    "128x128.png": 128,
    "128x128@2x.png": 256,
    "icon.png": 512,
    "Square30x30Logo.png": 30,
    "Square44x44Logo.png": 44,
    "StoreLogo.png": 50,
    "Square71x71Logo.png": 71,
    "Square89x89Logo.png": 89,
    "Square107x107Logo.png": 107,
    "Square142x142Logo.png": 142,
    "Square150x150Logo.png": 150,
    "Square284x284Logo.png": 284,
    "Square310x310Logo.png": 310,
}


def rounded_rect(draw: ImageDraw.ImageDraw, box: tuple[int, int, int, int], radius: int, fill, outline=None, width=1):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def draw_card(draw: ImageDraw.ImageDraw, box: tuple[int, int, int, int], radius: int, scale: int):
    x1, y1, x2, y2 = box
    rounded_rect(draw, box, radius, (244, 250, 255, 255), (255, 255, 255, 210), max(4 * scale, 1))

    inner = (x1 + 22 * scale, y1 + 22 * scale, x2 - 22 * scale, y2 - 22 * scale)
    ix1, iy1, ix2, iy2 = inner
    rounded_rect(draw, inner, max(18 * scale, 2), (32, 112, 174, 255))

    sky_top = (ix1, iy1, ix2, iy1 + (iy2 - iy1) // 2)
    for y in range(sky_top[1], sky_top[3]):
        t = (y - sky_top[1]) / max(sky_top[3] - sky_top[1], 1)
        color = (
            int(72 + 18 * t),
            int(188 + 24 * t),
            int(240 + 5 * t),
            255,
        )
        draw.line((ix1, y, ix2, y), fill=color)

    sun_r = 28 * scale
    sun_c = (ix2 - 58 * scale, iy1 + 58 * scale)
    draw.ellipse(
        (sun_c[0] - sun_r, sun_c[1] - sun_r, sun_c[0] + sun_r, sun_c[1] + sun_r),
        fill=(255, 214, 93, 255),
    )

    draw.polygon(
        [
            (ix1 + 6 * scale, iy2 - 12 * scale),
            (ix1 + 124 * scale, iy1 + 116 * scale),
            (ix1 + 214 * scale, iy2 - 12 * scale),
        ],
        fill=(54, 170, 126, 255),
    )
    draw.polygon(
        [
            (ix1 + 118 * scale, iy2 - 12 * scale),
            (ix2 - 48 * scale, iy1 + 96 * scale),
            (ix2 - 4 * scale, iy2 - 12 * scale),
        ],
        fill=(28, 132, 112, 255),
    )
    draw.polygon(
        [
            (ix1 + 124 * scale, iy1 + 116 * scale),
            (ix1 + 154 * scale, iy1 + 154 * scale),
            (ix1 + 100 * scale, iy1 + 154 * scale),
        ],
        fill=(232, 247, 248, 245),
    )


def make_icon(size: int) -> Image.Image:
    scale = 4
    canvas_size = size * scale
    image = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)

    pad = int(canvas_size * 0.09)
    radius = int(canvas_size * 0.22)

    shadow = Image.new("RGBA", image.size, (0, 0, 0, 0))
    shadow_draw = ImageDraw.Draw(shadow)
    rounded_rect(
        shadow_draw,
        (pad, pad + int(canvas_size * 0.03), canvas_size - pad, canvas_size - pad + int(canvas_size * 0.03)),
        radius,
        (0, 0, 0, 135),
    )
    image.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(int(canvas_size * 0.035))))

    for y in range(pad, canvas_size - pad):
        t = (y - pad) / max(canvas_size - 2 * pad, 1)
        fill = (
            int(24 + 18 * t),
            int(31 + 24 * t),
            int(44 + 42 * t),
            255,
        )
        draw.line((pad, y, canvas_size - pad, y), fill=fill)
    mask = Image.new("L", image.size, 0)
    mask_draw = ImageDraw.Draw(mask)
    rounded_rect(mask_draw, (pad, pad, canvas_size - pad, canvas_size - pad), radius, 255)
    clipped = Image.new("RGBA", image.size, (0, 0, 0, 0))
    clipped.alpha_composite(image)
    image = Image.composite(clipped, Image.new("RGBA", image.size, (0, 0, 0, 0)), mask)
    draw = ImageDraw.Draw(image)

    rounded_rect(
        draw,
        (pad, pad, canvas_size - pad, canvas_size - pad),
        radius,
        None,
        (255, 255, 255, 46),
        max(5 * scale, 1),
    )

    # Back card.
    back = Image.new("RGBA", image.size, (0, 0, 0, 0))
    back_draw = ImageDraw.Draw(back)
    back_box = (
        int(canvas_size * 0.24),
        int(canvas_size * 0.25),
        int(canvas_size * 0.76),
        int(canvas_size * 0.68),
    )
    rounded_rect(back_draw, back_box, int(canvas_size * 0.05), (224, 238, 251, 230), (255, 255, 255, 170), 4 * scale)
    back = back.rotate(-10, resample=Image.Resampling.BICUBIC, center=(canvas_size // 2, canvas_size // 2))
    image.alpha_composite(back)

    # Front card.
    card_box = (
        int(canvas_size * 0.20),
        int(canvas_size * 0.28),
        int(canvas_size * 0.80),
        int(canvas_size * 0.74),
    )
    draw_card(draw, card_box, int(canvas_size * 0.06), scale)

    # Small slideshow dot.
    accent_r = int(canvas_size * 0.055)
    accent_c = (int(canvas_size * 0.72), int(canvas_size * 0.75))
    draw.ellipse(
        (
            accent_c[0] - accent_r,
            accent_c[1] - accent_r,
            accent_c[0] + accent_r,
            accent_c[1] + accent_r,
        ),
        fill=(96, 205, 255, 255),
        outline=(222, 248, 255, 210),
        width=max(4 * scale, 1),
    )

    return image.resize((size, size), Image.Resampling.LANCZOS)


def main() -> None:
    ICON_DIR.mkdir(parents=True, exist_ok=True)
    master = make_icon(1024)

    for filename, size in PNG_SIZES.items():
        master.resize((size, size), Image.Resampling.LANCZOS).save(ICON_DIR / filename)

    ico_sizes = [(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
    master.save(ICON_DIR / "icon.ico", sizes=ico_sizes)
    master.resize((512, 512), Image.Resampling.LANCZOS).save(ICON_DIR / "icon.icns")


if __name__ == "__main__":
    main()
