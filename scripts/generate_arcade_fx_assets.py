#!/usr/bin/env python3
"""
scripts/generate_arcade_fx_assets.py

Deterministic asset generation pipeline for Arcade Fx.
Processes source images in design/brand/source/ and generates:
- Wordmark (transparent + native) at 1x, 2x, 3x (PNG + WebP)
- Candlestick Mark at 1x, 2x (PNG + WebP)
- Circular Badge (PNG + WebP)
- Favicon (.ico, .png, -16x16.png)
- Apple Touch Icon (180x180)
- PWA Icons (192x192, 512x512, maskable 512x512)
- Social OG Share Card (1200x630)
"""

import os
from PIL import Image, ImageDraw, ImageFilter

SOURCE_DIR = 'design/brand/source'
PUBLIC_DIR = 'frontend/public'
BRAND_DIR = os.path.join(PUBLIC_DIR, 'brand')

os.makedirs(BRAND_DIR, exist_ok=True)

wordmark_src_path = os.path.join(SOURCE_DIR, 'arcade_fx_wordmark_original.png')
badge_src_path = os.path.join(SOURCE_DIR, 'arcade_fx_badge_original.png')

im_wm = Image.open(wordmark_src_path).convert('RGBA')
im_badge = Image.open(badge_src_path).convert('RGBA')

# -----------------------------------------------------------------------------
# 1. Circular Badge: Apply smooth circular mask to remove black outer corners
# -----------------------------------------------------------------------------
print("Generating circular badge...")
badge_w, badge_h = im_badge.size
center_x, center_y = badge_w // 2, badge_h // 2
radius = 482

circle_mask = Image.new('L', (badge_w, badge_h), 0)
draw = ImageDraw.Draw(circle_mask)
draw.ellipse((center_x - radius, center_y - radius, center_x + radius, center_y + radius), fill=255)

# Smooth edges slightly
circle_mask = circle_mask.filter(ImageFilter.GaussianBlur(1.0))

masked_badge = Image.new('RGBA', (badge_w, badge_h), (0, 0, 0, 0))
masked_badge.paste(im_badge, (0, 0), circle_mask)

# Save master badge
masked_badge.save(os.path.join(BRAND_DIR, 'arcade-fx-badge.png'), 'PNG')
masked_badge.save(os.path.join(BRAND_DIR, 'arcade-fx-badge.webp'), 'WEBP')

# -----------------------------------------------------------------------------
# 2. Wordmark: Tight crop & transparent extraction
# -----------------------------------------------------------------------------
print("Generating wordmark derivatives...")
# Find bounding box where pixel has brightness
bg = Image.new('RGBA', im_wm.size, (0, 0, 0, 255))
diff = Image.new('L', im_wm.size, 0)
for y in range(im_wm.height):
    for x in range(im_wm.width):
        r, g, b, _ = im_wm.getpixel((x, y))
        diff.putpixel((x, y), max(r, g, b))

# Get bounding box with 15px threshold
bbox = None
for y in range(im_wm.height):
    for x in range(im_wm.width):
        if diff.getpixel((x, y)) > 15:
            if bbox is None:
                bbox = [x, y, x, y]
            else:
                bbox[0] = min(bbox[0], x)
                bbox[1] = min(bbox[1], y)
                bbox[2] = max(bbox[2], x)
                bbox[3] = max(bbox[3], y)

pad = 12
crop_box = (
    max(0, bbox[0] - pad),
    max(0, bbox[1] - pad),
    min(im_wm.width, bbox[2] + pad),
    min(im_wm.height, bbox[3] + pad)
)

cropped_wm = im_wm.crop(crop_box)

# Create transparent version by keying black background smoothly
trans_wm = cropped_wm.copy()
wm_data = trans_wm.getdata()
new_wm_data = []
for r, g, b, a in wm_data:
    brightness = max(r, g, b)
    if brightness < 12:
        new_wm_data.append((0, 0, 0, 0))
    elif brightness < 40:
        # Smooth alpha ramp for ambient glow
        alpha = int(((brightness - 12) / 28) * 255)
        new_wm_data.append((r, g, b, min(a, alpha)))
    else:
        new_wm_data.append((r, g, b, a))

trans_wm.putdata(new_wm_data)

# Save Master Wordmarks
trans_wm.save(os.path.join(BRAND_DIR, 'arcade-fx-wordmark.png'), 'PNG')
trans_wm.save(os.path.join(BRAND_DIR, 'arcade-fx-wordmark.webp'), 'WEBP')

# Save 1x, 2x, 3x for responsive srcset
base_height = 48
aspect = trans_wm.width / trans_wm.height

for scale in (1, 2, 3):
    h = base_height * scale
    w = int(h * aspect)
    scaled = trans_wm.resize((w, h), Image.Resampling.LANCZOS)
    suffix = '' if scale == 1 else f'@{scale}x'
    scaled.save(os.path.join(BRAND_DIR, f'arcade-fx-wordmark{suffix}.png'), 'PNG')
    scaled.save(os.path.join(BRAND_DIR, f'arcade-fx-wordmark{suffix}.webp'), 'WEBP')

# -----------------------------------------------------------------------------
# 3. Mark Only (Candlesticks Cluster)
# -----------------------------------------------------------------------------
print("Generating candlestick mark...")
# Crop candlestick center region
candlestick_box = (400, crop_box[1], 860, crop_box[3])
mark_img = trans_wm.crop((400 - crop_box[0], 0, 860 - crop_box[0], trans_wm.height))

# Trim transparent edges of mark
mark_bbox = mark_img.getbbox()
if mark_bbox:
    mark_img = mark_img.crop(mark_bbox)

mark_img.save(os.path.join(BRAND_DIR, 'arcade-fx-mark.png'), 'PNG')
mark_img.save(os.path.join(BRAND_DIR, 'arcade-fx-mark.webp'), 'WEBP')

# Scaled mark
for s in (36, 64, 128):
    aspect_m = mark_img.width / mark_img.height
    mw = int(s * aspect_m)
    sm = mark_img.resize((mw, s), Image.Resampling.LANCZOS)
    sm.save(os.path.join(BRAND_DIR, f'arcade-fx-mark-{s}.png'), 'PNG')
    sm.save(os.path.join(BRAND_DIR, f'arcade-fx-mark-{s}.webp'), 'WEBP')

# -----------------------------------------------------------------------------
# 4. Favicon, Apple Touch Icon, and PWA Icons from Circular Badge
# -----------------------------------------------------------------------------
print("Generating PWA icons and favicons...")
# Favicon ICO
ico_sizes = [(16, 16), (32, 32), (48, 48)]
masked_badge.save(os.path.join(PUBLIC_DIR, 'favicon.ico'), format='ICO', sizes=ico_sizes)

# Favicon PNG
f32 = masked_badge.resize((32, 32), Image.Resampling.LANCZOS)
f32.save(os.path.join(PUBLIC_DIR, 'favicon.png'), 'PNG')
f16 = masked_badge.resize((16, 16), Image.Resampling.LANCZOS)
f16.save(os.path.join(PUBLIC_DIR, 'favicon-16x16.png'), 'PNG')

# Apple Touch Icon
apple_icon = masked_badge.resize((180, 180), Image.Resampling.LANCZOS)
apple_icon.save(os.path.join(PUBLIC_DIR, 'apple-touch-icon.png'), 'PNG')

# PWA 192 and 512 standard
pwa_192 = masked_badge.resize((192, 192), Image.Resampling.LANCZOS)
pwa_192.save(os.path.join(PUBLIC_DIR, 'pwa-192x192.png'), 'PNG')

pwa_512 = masked_badge.resize((512, 512), Image.Resampling.LANCZOS)
pwa_512.save(os.path.join(PUBLIC_DIR, 'pwa-512x512.png'), 'PNG')

# PWA 512 Maskable (add 10% safe zone margin on dark canvas #0b1628)
maskable = Image.new('RGBA', (512, 512), (11, 22, 40, 255))
badge_scaled = masked_badge.resize((410, 410), Image.Resampling.LANCZOS)
offset = (512 - 410) // 2
maskable.paste(badge_scaled, (offset, offset), badge_scaled)
maskable.save(os.path.join(PUBLIC_DIR, 'pwa-maskable-512x512.png'), 'PNG')

# -----------------------------------------------------------------------------
# 5. Social Open Graph Share Image (1200 x 630)
# -----------------------------------------------------------------------------
print("Generating OpenGraph social preview image (1200x630)...")
og_img = Image.new('RGBA', (1200, 630), (5, 6, 8, 255))
og_draw = ImageDraw.Draw(og_img)

# Radial subtle glow in center
center_x, center_y = 600, 315
for r in range(300, 0, -10):
    alpha = int((1 - (r / 300)) * 25)
    og_draw.ellipse(
        (center_x - r * 1.5, center_y - r, center_x + r * 1.5, center_y + r),
        fill=(30, 58, 138, alpha)
    )

# Paste circular badge on left, wordmark on right or centered wordmark
# Center wordmark cleanly at 760px width
wm_target_w = 720
wm_target_h = int(wm_target_w / aspect)
wm_og = trans_wm.resize((wm_target_w, wm_target_h), Image.Resampling.LANCZOS)

wm_pos = ((1200 - wm_target_w) // 2, (630 - wm_target_h) // 2 - 20)
og_img.paste(wm_og, wm_pos, wm_og)

og_img.save(os.path.join(PUBLIC_DIR, 'arcade-fx-og.png'), 'PNG')
print("All Arcade Fx brand assets generated successfully!")
