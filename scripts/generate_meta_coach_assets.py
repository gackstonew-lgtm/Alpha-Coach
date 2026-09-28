#!/usr/bin/env python3
"""
Meta Coach Asset Generator
Generates clean, scalable SVG logos, favicons, and PWA icon PNGs
matching the uploaded Meta Coach brand design (dark shield with gold candlesticks and wordmark).
"""

import os
from PIL import Image, ImageDraw

def generate_svgs():
    # 1. Standalone Icon SVG (Shield + Gold Candlesticks + Swoosh)
    icon_svg = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 400" fill="none">
  <defs>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F7D89C"/>
      <stop offset="50%" stop-color="#D5AB5A"/>
      <stop offset="100%" stop-color="#B28532"/>
    </linearGradient>
    <linearGradient id="swooshGrad" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#B28532"/>
      <stop offset="50%" stop-color="#E2B766"/>
      <stop offset="100%" stop-color="#FCE1A8"/>
    </linearGradient>
  </defs>

  <!-- Outer Shield Facets (3D Bevel) -->
  <!-- Top-Left Bevel -->
  <path d="M 160 16 L 20 84 L 48 112 L 160 56 Z" fill="#4B515A"/>
  <!-- Top-Right Bevel -->
  <path d="M 160 16 L 300 84 L 272 112 L 160 56 Z" fill="#262A30"/>
  <!-- Left-Side Bevel -->
  <path d="M 20 84 L 20 240 L 48 228 L 48 112 Z" fill="#3E434B"/>
  <!-- Right-Side Bevel -->
  <path d="M 300 84 L 300 240 L 272 228 L 272 112 Z" fill="#32363E"/>
  <!-- Bottom-Left Bevel -->
  <path d="M 20 240 L 160 396 L 160 356 L 48 228 Z" fill="#2D3239"/>
  <!-- Bottom-Right Bevel -->
  <path d="M 300 240 L 160 396 L 160 356 L 272 228 Z" fill="#1A1E24"/>

  <!-- Inner Shield Face (Two-Tone Split) -->
  <!-- Left Inner Face -->
  <path d="M 160 56 L 48 112 L 48 228 L 160 356 Z" fill="#24282F"/>
  <!-- Right Inner Face -->
  <path d="M 160 56 L 272 112 L 272 228 L 160 356 Z" fill="#16191E"/>

  <!-- Candlesticks (Institutional Bullish Uptrend) -->
  <!-- Candle 1 (Left) -->
  <line x1="108" y1="174" x2="108" y2="224" stroke="url(#goldGrad)" stroke-width="4.5" stroke-linecap="square"/>
  <polygon points="93,224 123,224 123,242 93,270" fill="url(#goldGrad)"/>
  <line x1="108" y1="256" x2="108" y2="304" stroke="url(#goldGrad)" stroke-width="4.5" stroke-linecap="square"/>

  <!-- Candle 2 (Middle) -->
  <line x1="160" y1="142" x2="160" y2="186" stroke="url(#goldGrad)" stroke-width="4.5" stroke-linecap="square"/>
  <polygon points="145,186 175,186 175,234 145,262" fill="url(#goldGrad)"/>
  <line x1="160" y1="248" x2="160" y2="294" stroke="url(#goldGrad)" stroke-width="4.5" stroke-linecap="square"/>

  <!-- Candle 3 (Right) -->
  <line x1="212" y1="106" x2="212" y2="148" stroke="url(#goldGrad)" stroke-width="4.5" stroke-linecap="square"/>
  <polygon points="197,148 227,148 227,196 197,224" fill="url(#goldGrad)"/>
  <line x1="212" y1="210" x2="212" y2="254" stroke="url(#goldGrad)" stroke-width="4.5" stroke-linecap="square"/>

  <!-- Golden Swoosh Curve -->
  <path d="M 160 356 Q 226 344 266 214 Q 228 312 160 342 Z" fill="url(#swooshGrad)"/>
</svg>'''

    # 2. Full Logo SVG (Shield Icon + "META COACH" Geometric Wordmark)
    full_svg = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 700 520" fill="none">
  <defs>
    <linearGradient id="fullGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F7D89C"/>
      <stop offset="50%" stop-color="#D5AB5A"/>
      <stop offset="100%" stop-color="#B28532"/>
    </linearGradient>
    <linearGradient id="fullSwooshGrad" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#B28532"/>
      <stop offset="50%" stop-color="#E2B766"/>
      <stop offset="100%" stop-color="#FCE1A8"/>
    </linearGradient>
  </defs>

  <!-- Centered Shield Icon (scaled down to fit 700x520 canvas) -->
  <g transform="translate(190, 20) scale(1)">
    <!-- Outer Shield Facets (3D Bevel) -->
    <!-- Top-Left Bevel -->
    <path d="M 160 16 L 20 84 L 48 112 L 160 56 Z" fill="#4B515A"/>
    <!-- Top-Right Bevel -->
    <path d="M 160 16 L 300 84 L 272 112 L 160 56 Z" fill="#262A30"/>
    <!-- Left-Side Bevel -->
    <path d="M 20 84 L 20 240 L 48 228 L 48 112 Z" fill="#3E434B"/>
    <!-- Right-Side Bevel -->
    <path d="M 300 84 L 300 240 L 272 228 L 272 112 Z" fill="#32363E"/>
    <!-- Bottom-Left Bevel -->
    <path d="M 20 240 L 160 396 L 160 356 L 48 228 Z" fill="#2D3239"/>
    <!-- Bottom-Right Bevel -->
    <path d="M 300 240 L 160 396 L 160 356 L 272 228 Z" fill="#1A1E24"/>

    <!-- Inner Shield Face (Two-Tone Split) -->
    <!-- Left Inner Face -->
    <path d="M 160 56 L 48 112 L 48 228 L 160 356 Z" fill="#24282F"/>
    <!-- Right Inner Face -->
    <path d="M 160 56 L 272 112 L 272 228 L 160 356 Z" fill="#16191E"/>

    <!-- Candlesticks -->
    <!-- Candle 1 (Left) -->
    <line x1="108" y1="174" x2="108" y2="224" stroke="url(#fullGoldGrad)" stroke-width="4.5" stroke-linecap="square"/>
    <polygon points="93,224 123,224 123,242 93,270" fill="url(#fullGoldGrad)"/>
    <line x1="108" y1="256" x2="108" y2="304" stroke="url(#fullGoldGrad)" stroke-width="4.5" stroke-linecap="square"/>

    <!-- Candle 2 (Middle) -->
    <line x1="160" y1="142" x2="160" y2="186" stroke="url(#fullGoldGrad)" stroke-width="4.5" stroke-linecap="square"/>
    <polygon points="145,186 175,186 175,234 145,262" fill="url(#fullGoldGrad)"/>
    <line x1="160" y1="248" x2="160" y2="294" stroke="url(#fullGoldGrad)" stroke-width="4.5" stroke-linecap="square"/>

    <!-- Candle 3 (Right) -->
    <line x1="212" y1="106" x2="212" y2="148" stroke="url(#fullGoldGrad)" stroke-width="4.5" stroke-linecap="square"/>
    <polygon points="197,148 227,148 227,196 197,224" fill="url(#fullGoldGrad)"/>
    <line x1="212" y1="210" x2="212" y2="254" stroke="url(#fullGoldGrad)" stroke-width="4.5" stroke-linecap="square"/>

    <!-- Golden Swoosh Curve -->
    <path d="M 160 356 Q 226 344 266 214 Q 228 312 160 342 Z" fill="url(#fullSwooshGrad)"/>
  </g>

  <!-- Wordmark "META COACH" (Stylized Geometric Caps) -->
  <g transform="translate(42, 440)" fill="currentColor" class="text-slate-900 dark:text-white">
    <!-- M -->
    <path d="M 0 0 L 11 0 L 11 26 L 24 38 L 29.5 38 L 42.5 26 L 42.5 0 L 53.5 0 L 53.5 44 L 43.5 44 L 43.5 16 L 31.5 28 L 22 28 L 10 16 L 10 44 L 0 44 Z" />
    
    <!-- E -->
    <path d="M 75 0 L 115 0 L 115 9 L 86 9 L 86 18 L 111 18 L 111 26 L 86 26 L 86 35 L 116 35 L 116 44 L 75 44 Z" />

    <!-- T -->
    <path d="M 134 0 L 178 0 L 178 9 L 161 9 L 161 44 L 151 44 L 151 9 L 134 9 Z" />

    <!-- A (Lambda/Chevron) -->
    <path d="M 213 0 L 223 0 L 248 44 L 237 44 L 218 10 L 199 44 L 188 44 Z" />

    <!-- C -->
    <path d="M 292 4 C 298 4 303 6 307 9 L 302 16 C 299 13 296 12 291 12 C 283 12 278 17 278 26 C 278 35 283 40 291 40 C 296 40 299 39 302 36 L 307 43 C 303 46 298 48 292 48 C 278 48 268 38 268 26 C 268 14 278 4 292 4 Z" transform="translate(42, -4)" />

    <!-- O -->
    <path d="M 390 0 C 404 0 414 10 414 22 C 414 34 404 44 390 44 C 376 44 366 34 366 22 C 366 10 376 0 390 0 Z M 390 9 C 382 9 376 15 376 22 C 376 29 382 35 390 35 C 398 35 404 29 404 22 C 404 15 398 9 390 9 Z" />

    <!-- A (Lambda/Chevron) -->
    <path d="M 451 0 L 461 0 L 486 44 L 475 44 L 456 10 L 437 44 L 426 44 Z" />

    <!-- C -->
    <path d="M 292 4 C 298 4 303 6 307 9 L 302 16 C 299 13 296 12 291 12 C 283 12 278 17 278 26 C 278 35 283 40 291 40 C 296 40 299 39 302 36 L 307 43 C 303 46 298 48 292 48 C 278 48 268 38 268 26 C 268 14 278 4 292 4 Z" transform="translate(242, -4)" />

    <!-- H -->
    <path d="M 568 0 L 579 0 L 579 17.5 L 602 17.5 L 602 0 L 613 0 L 613 44 L 602 44 L 602 26.5 L 579 26.5 L 579 44 L 568 44 Z" />
  </g>
</svg>'''

    # Write SVGs
    with open('frontend/public/meta-coach-icon.svg', 'w', encoding='utf-8') as f:
        f.write(icon_svg)
    with open('frontend/public/favicon.svg', 'w', encoding='utf-8') as f:
        f.write(icon_svg)
    with open('frontend/public/logo.svg', 'w', encoding='utf-8') as f:
        f.write(full_svg)
    with open('frontend/public/meta-coach-logo.svg', 'w', encoding='utf-8') as f:
        f.write(full_svg)

    print('[OK] Generated SVG files.')

def draw_shield_icon(size, padding_pct=0.08, bg_color=None):
    """
    Renders the Meta Coach shield icon at the given pixel resolution using Pillow.
    Uses multi-sampling (4x) for ultra-sharp anti-aliased edges.
    """
    scale = 4
    canvas_w = size * scale
    canvas_h = size * scale
    
    img = Image.new('RGBA', (canvas_w, canvas_h), (0, 0, 0, 0) if not bg_color else bg_color)
    draw = ImageDraw.Draw(img)

    pad_x = canvas_w * padding_pct
    pad_y = canvas_h * padding_pct
    avail_w = canvas_w - (pad_x * 2)
    avail_h = canvas_h - (pad_y * 2)

    # Base coordinates in 320x400 viewBox
    def tx(x):
        return pad_x + (x / 320.0) * avail_w
    def ty(y):
        return pad_y + (y / 400.0) * avail_h

    # Colors
    c_tl_bevel = (75, 81, 90, 255)
    c_tr_bevel = (38, 42, 48, 255)
    c_l_bevel  = (62, 67, 75, 255)
    c_r_bevel  = (50, 54, 62, 255)
    c_bl_bevel = (45, 50, 57, 255)
    c_br_bevel = (26, 30, 36, 255)
    c_inner_l  = (36, 40, 47, 255)
    c_inner_r  = (22, 25, 30, 255)
    c_gold     = (225, 185, 105, 255)
    c_gold_light = (248, 218, 155, 255)

    # 1. Bevel facets
    draw.polygon([(tx(160), ty(16)), (tx(20), ty(84)), (tx(48), ty(112)), (tx(160), ty(56))], fill=c_tl_bevel)
    draw.polygon([(tx(160), ty(16)), (tx(300), ty(84)), (tx(272), ty(112)), (tx(160), ty(56))], fill=c_tr_bevel)
    draw.polygon([(tx(20), ty(84)), (tx(20), ty(240)), (tx(48), ty(228)), (tx(48), ty(112))], fill=c_l_bevel)
    draw.polygon([(tx(300), ty(84)), (tx(300), ty(240)), (tx(272), ty(228)), (tx(272), ty(112))], fill=c_r_bevel)
    draw.polygon([(tx(20), ty(240)), (tx(160), ty(396)), (tx(160), ty(356)), (tx(48), ty(228))], fill=c_bl_bevel)
    draw.polygon([(tx(300), ty(240)), (tx(160), ty(396)), (tx(160), ty(356)), (tx(272), ty(228))], fill=c_br_bevel)

    # 2. Inner Face
    draw.polygon([(tx(160), ty(56)), (tx(48), ty(112)), (tx(48), ty(228)), (tx(160), ty(356))], fill=c_inner_l)
    draw.polygon([(tx(160), ty(56)), (tx(272), ty(112)), (tx(272), ty(228)), (tx(160), ty(356))], fill=c_inner_r)

    wick_w = max(1, int(4.5 * (avail_w / 320.0)))

    # 3. Candle 1
    draw.line([(tx(108), ty(174)), (tx(108), ty(224))], fill=c_gold_light, width=wick_w)
    draw.polygon([(tx(93), ty(224)), (tx(123), ty(224)), (tx(123), ty(242)), (tx(93), ty(270))], fill=c_gold)
    draw.line([(tx(108), ty(256)), (tx(108), ty(304))], fill=c_gold, width=wick_w)

    # 4. Candle 2
    draw.line([(tx(160), ty(142)), (tx(160), ty(186))], fill=c_gold_light, width=wick_w)
    draw.polygon([(tx(145), ty(186)), (tx(175), ty(186)), (tx(175), ty(234)), (tx(145), ty(262))], fill=c_gold)
    draw.line([(tx(160), ty(248)), (tx(160), ty(294))], fill=c_gold, width=wick_w)

    # 5. Candle 3
    draw.line([(tx(212), ty(106)), (tx(212), ty(148))], fill=c_gold_light, width=wick_w)
    draw.polygon([(tx(197), ty(148)), (tx(227), ty(148)), (tx(227), ty(196)), (tx(197), ty(224))], fill=c_gold)
    draw.line([(tx(212), ty(210)), (tx(212), ty(254))], fill=c_gold, width=wick_w)

    # 6. Swoosh Curve (polygon approx)
    swoosh_pts = []
    # Bottom to top curve
    for t in range(0, 21):
        s = t / 20.0
        # Quadratic bezier from (160, 356) through control (226, 344) to (266, 214)
        bx = (1 - s)**2 * 160 + 2 * (1 - s) * s * 226 + s**2 * 266
        by = (1 - s)**2 * 356 + 2 * (1 - s) * s * 344 + s**2 * 214
        swoosh_pts.append((tx(bx), ty(by)))
    # Top back to bottom inner curve
    for t in range(20, -1, -1):
        s = t / 20.0
        # Control (228, 312) to (160, 342)
        bx = (1 - s)**2 * 160 + 2 * (1 - s) * s * 228 + s**2 * 266
        by = (1 - s)**2 * 342 + 2 * (1 - s) * s * 312 + s**2 * 214
        swoosh_pts.append((tx(bx), ty(by)))
    draw.polygon(swoosh_pts, fill=c_gold_light)

    # Downsample with high quality Lanczos filter
    final_img = img.resize((size, size), Image.Resampling.LANCZOS)
    return final_img

def generate_raster_assets():
    pub_dir = 'frontend/public'
    os.makedirs(pub_dir, exist_ok=True)

    # 1. PWA 192x192
    pwa192 = draw_shield_icon(192, padding_pct=0.08)
    pwa192.save(os.path.join(pub_dir, 'pwa-192x192.png'), 'PNG')

    # 2. PWA 512x512
    pwa512 = draw_shield_icon(512, padding_pct=0.08)
    pwa512.save(os.path.join(pub_dir, 'pwa-512x512.png'), 'PNG')

    # 3. PWA Maskable 512x512 (with dark background and safe area ~20% padding)
    maskable = draw_shield_icon(512, padding_pct=0.18, bg_color=(5, 6, 8, 255))
    maskable.save(os.path.join(pub_dir, 'pwa-maskable-512x512.png'), 'PNG')

    # 4. Apple Touch Icon 180x180
    apple_icon = draw_shield_icon(180, padding_pct=0.10, bg_color=(5, 6, 8, 255))
    apple_icon.save(os.path.join(pub_dir, 'apple-touch-icon.png'), 'PNG')

    # 5. Favicon PNG (32x32)
    fav32 = draw_shield_icon(32, padding_pct=0.05)
    fav32.save(os.path.join(pub_dir, 'favicon.png'), 'PNG')

    # 6. Favicon ICO (Multi-resolution: 16, 32, 48)
    fav16 = draw_shield_icon(16, padding_pct=0.04)
    fav48 = draw_shield_icon(48, padding_pct=0.05)
    fav32.save(os.path.join(pub_dir, 'favicon.ico'), format='ICO', sizes=[(16, 16), (32, 32), (48, 48)], append_images=[fav16, fav48])

    # 7. logo.png & alpha_coach_logo.png
    pwa512.save(os.path.join(pub_dir, 'logo.png'), 'PNG')
    pwa512.save(os.path.join(pub_dir, 'alpha_coach_logo.png'), 'PNG')

    # 8. OG Image 1200x630
    generate_og_image(pub_dir)

    print('[OK] Generated all raster icon assets.')

def generate_og_image(pub_dir):
    from PIL import ImageFont
    width, height = 1200, 630
    img = Image.new('RGBA', (width, height), (5, 6, 8, 255))
    draw = ImageDraw.Draw(img)

    for r in range(400, 0, -5):
        alpha = int(18 * (1 - r/400))
        draw.ellipse([(150 - r, 315 - r), (150 + r, 315 + r)], fill=(37, 99, 235, alpha))

    draw.rounded_rectangle([(16, 16), (width - 16, height - 16)], radius=24, outline=(23, 29, 41, 255), width=2)

    pwa512_path = os.path.join(pub_dir, 'pwa-512x512.png')
    if os.path.exists(pwa512_path):
        icon = Image.open(pwa512_path).convert('RGBA')
        icon_resized = icon.resize((270, 270), Image.Resampling.LANCZOS)
        img.paste(icon_resized, (90, int((height - 270) / 2)), icon_resized)

    try:
        font_title = ImageFont.truetype('C:\\Windows\\Fonts\\arialbd.ttf', 60)
        font_sub = ImageFont.truetype('C:\\Windows\\Fonts\\segoeui.ttf', 24)
        font_pill = ImageFont.truetype('C:\\Windows\\Fonts\\arialbd.ttf', 16)
    except Exception:
        font_title = ImageFont.load_default()
        font_sub = ImageFont.load_default()
        font_pill = ImageFont.load_default()

    text_x = 400
    draw.text((text_x, 180), 'META COACH', fill=(255, 255, 255, 255), font=font_title)
    draw.text((text_x, 260), 'Automated MT5 Trading Journal & Performance OS', fill=(148, 163, 184, 255), font=font_sub)
    draw.text((text_x, 305), 'Empirical analytics, rule discipline, and zero broker passwords.', fill=(100, 116, 139, 255), font=font_sub)

    pills = ['0 Passwords Stored', 'Official MT5 API', 'Mathematical Expectancy', 'Institutional OLED']
    pill_x = text_x
    pill_y = 380
    for p in pills:
        try:
            bbox = font_pill.getbbox(p)
            pw = bbox[2] - bbox[0] + 28
        except Exception:
            pw = 140
        draw.rounded_rectangle([(pill_x, pill_y), (pill_x + pw, pill_y + 36)], radius=12, fill=(16, 20, 28, 255), outline=(35, 44, 61, 255), width=1)
        draw.text((pill_x + 14, pill_y + 8), p, fill=(213, 171, 90, 255), font=font_pill)
        pill_x += pw + 12

    og_path = os.path.join(pub_dir, 'meta-coach-og.png')
    img.save(og_path, 'PNG')

if __name__ == '__main__':
    generate_svgs()
    generate_raster_assets()
