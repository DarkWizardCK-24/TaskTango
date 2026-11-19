"""Compose the 1920x1080 promo thumbnails in docs/thumbnails/.

    python tool/make_thumbnails.py

Needs docs/screenshots/*.png, public/logo.svg and the app's own fonts
(Plus Jakarta Sans + Inter, copied from @fontsource-variable into docs/fonts/).
Pages are plain HTML rendered with Playwright Chromium, with every image and
font embedded as a data URI, so the output is reproducible.
Writes tasktango-thumb-1-hero.png, -2-devices.png, -3-gallery.png.
"""
import base64
import glob
import io
import os

from PIL import Image
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SHOTS = os.path.join(ROOT, 'docs', 'screenshots')
OUT = os.path.join(ROOT, 'docs', 'thumbnails')

TAGLINE = 'Tasks with rhythm.'
BLURB = ('A fast, beautiful to-do app that understands &ldquo;Call mum tomorrow 5pm !high&rdquo; '
         'and keeps every device in sync.')
PILLS = ['Natural quick add', 'Subtasks &amp; streaks', 'Real-time sync', 'Works offline']

# Tango palette, straight from src/app/globals.css
CRIMSON, CORAL, TANGERINE = '#d4143a', '#ff5c47', '#ff9a1f'
INK, MUTED, IVORY = '#2b1a14', '#7d6357', '#fff8f1'
TANGO = f'linear-gradient(135deg,{CRIMSON},{CORAL} 55%,{TANGERINE})'


def size_of(name):
    with Image.open(os.path.join(SHOTS, name + '.png')) as im:
        return im.size


def data_uri(path, max_w=1000, fmt='JPEG'):
    """Downscale + embed an image (keeps the HTML small)."""
    with Image.open(path) as im:
        im = im.convert('RGB')
        if im.width > max_w:
            im = im.resize((max_w, round(im.height * max_w / im.width)), Image.LANCZOS)
        buf = io.BytesIO()
        im.save(buf, fmt, quality=95, subsampling=0)
    mime = 'image/jpeg' if fmt == 'JPEG' else 'image/png'
    return f'data:{mime};base64,' + base64.b64encode(buf.getvalue()).decode()


def logo_uri():
    with open(os.path.join(ROOT, 'public', 'logo.svg'), 'rb') as f:
        return 'data:image/svg+xml;base64,' + base64.b64encode(f.read()).decode()


def font_face(family, rel, weight='100 900'):
    with open(os.path.join(ROOT, rel), 'rb') as f:
        b64 = base64.b64encode(f.read()).decode()
    return (f"@font-face{{font-family:'{family}';font-weight:{weight};"
            f"src:url(data:font/woff2;base64,{b64}) format('woff2');}}")


def shot(name, **kw):
    return data_uri(os.path.join(SHOTS, name + '.png'), **kw)


CSS = f'''
* {{ box-sizing: border-box; margin: 0; }}
html, body {{ width: 1920px; height: 1080px; overflow: hidden; }}
body {{
  font-family: Inter, "Segoe UI", Arial, sans-serif; color: {INK}; position: relative;
  background:
    radial-gradient(1000px 760px at 82% 28%, rgba(255,154,31,0.30), transparent 62%),
    radial-gradient(820px 640px at 4% 0%, rgba(255,128,56,0.20), transparent 60%),
    radial-gradient(760px 560px at 30% 112%, rgba(212,20,58,0.12), transparent 60%),
    linear-gradient(160deg, #fffaf4 0%, {IVORY} 45%, #ffefe0 100%);
}}
/* faint dotted grid, like ruled task paper */
body::before {{
  content: ""; position: absolute; inset: 0;
  background-image: radial-gradient(rgba(122,64,32,0.13) 1.6px, transparent 1.8px);
  background-size: 36px 36px;
  -webkit-mask-image: linear-gradient(120deg, transparent 10%, #000 60%, #000 100%);
  mask-image: linear-gradient(120deg, transparent 10%, #000 60%, #000 100%);
}}
.abs {{ position: absolute; }}
.glow {{ position: absolute; border-radius: 50%; filter: blur(30px); pointer-events: none; }}
.spark {{ position: absolute; width: 56px; height: 56px; }}
.confetti {{ position: absolute; width: 26px; height: 14px; border-radius: 5px; }}
.ribbon {{ position: absolute; pointer-events: none; }}
.logo {{ filter: drop-shadow(0 18px 34px rgba(170,40,20,.35)); }}
h1 {{ font-family: "Plus Jakarta Sans", "Segoe UI", sans-serif; font-weight: 800; letter-spacing: -4px; line-height: 1; color: {INK}; }}
h1 b {{ font-weight: 800; background: {TANGO};
  -webkit-background-clip: text; background-clip: text; color: transparent; padding-right: 8px; }}
.tag {{ font-family: "Plus Jakarta Sans", sans-serif; font-weight: 800; letter-spacing: -1px;
  background: linear-gradient(90deg,{CRIMSON},{CORAL} 60%,#f07a10);
  -webkit-background-clip: text; background-clip: text; color: transparent; }}
.blurb {{ color: {MUTED}; line-height: 1.42; }}
.pills {{ display: flex; flex-wrap: wrap; gap: 14px; width: 760px; }}
.pill {{
  display: inline-flex; align-items: center; gap: 12px; padding: 10px 22px;
  border-radius: 999px; border: 2px solid rgba(122,64,32,.16);
  background: rgba(255,255,255,.78); font-size: 26px; font-weight: 600; color: {INK};
  box-shadow: 0 8px 22px -12px rgba(170,60,20,.35);
}}
.pill i {{ width: 12px; height: 12px; border-radius: 50%; background: {TANGO}; display: block; }}
.chip {{ display: inline-flex; align-items: center; gap: 12px; padding: 12px 26px;
  border-radius: 999px; background: {TANGO}; color: #fff; font-weight: 800; font-size: 26px; white-space: nowrap;
  box-shadow: 0 14px 30px -12px rgba(212,20,58,.6); }}
.chip i {{ width: 12px; height: 12px; border-radius: 50%; background: #fff; display: block; }}
.plat {{ white-space: nowrap; font-size: 25px; font-weight: 600; color: {MUTED}; letter-spacing: .3px; }}
.phone {{
  position: absolute; background: #1d1310; border-radius: 64px; padding: 14px;
  box-shadow: 0 0 0 3px #5a4038, 0 40px 80px -10px rgba(120,40,10,.45), 0 0 0 1px #000 inset;
}}
.phone .scr {{ position: relative; border-radius: 50px; overflow: hidden; background: #fff4ea; width: 100%; height: 100%; padding-top: 40px; }}
.phone .scr.dark {{ background: #17100d; }}
.phone img {{ width: 100%; height: 100%; object-fit: contain; object-position: top; display: block; }}
.phone .notch {{ position: absolute; top: 12px; left: 50%; transform: translateX(-50%);
  width: 30%; height: 24px; background: #000; border-radius: 99px; z-index: 2; }}
.laptop-screen {{
  position: absolute; background: #1d1310; border-radius: 26px; padding: 14px;
  box-shadow: 0 0 0 3px #5a4038, 0 40px 90px -10px rgba(120,40,10,.45);
}}
.laptop-screen img {{ width: 100%; height: 100%; object-fit: contain; display: block; border-radius: 12px; }}
.laptop-base {{ position: absolute; height: 24px; border-radius: 0 0 28px 28px;
  background: linear-gradient(#d9c8bd, #9b857a); box-shadow: 0 30px 50px -10px rgba(120,40,10,.4); }}
.laptop-base::after {{ content: ""; position: absolute; left: 50%; top: 0; transform: translateX(-50%);
  width: 160px; height: 8px; border-radius: 0 0 10px 10px; background: rgba(60,30,20,.25); }}
.card {{
  position: absolute; display: flex; align-items: center; gap: 22px; padding: 22px 34px 22px 22px;
  border-radius: 28px; background: rgba(255,253,249,.96); border: 2px solid rgba(122,64,32,.13);
  box-shadow: 0 28px 60px -18px rgba(140,40,10,.45); z-index: 5;
}}
.card .ic {{ width: 78px; height: 78px; border-radius: 22px; display: grid; place-items: center; flex: none; }}
.card small {{ display: block; font-size: 25px; color: {MUTED}; letter-spacing: .3px; }}
.card strong {{ display: block; font-family: "Plus Jakarta Sans", sans-serif; font-size: 40px; font-weight: 800;
  letter-spacing: -.8px; white-space: nowrap; color: {INK}; }}
'''

SPARK = ('<svg class="spark" style="{s}" viewBox="0 0 100 100"><path d="M50 2 C54 38 62 46 98 50 '
         'C62 54 54 62 50 98 C46 62 38 54 2 50 C38 46 46 38 50 2 Z" fill="' + TANGERINE + '" opacity=".95"/></svg>')


def confetti(x, y, color, rot):
    return f'<div class="confetti" style="left:{x}px;top:{y}px;background:{color};transform:rotate({rot}deg)"></div>'


def ribbon(style, w, h, d, width=14, opacity=.85):
    return (f'<svg class="ribbon" style="{style}" width="{w}" height="{h}" viewBox="0 0 {w} {h}">'
            f'<defs><linearGradient id="rg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="{CRIMSON}"/>'
            f'<stop offset=".55" stop-color="{CORAL}"/><stop offset="1" stop-color="{TANGERINE}"/></linearGradient></defs>'
            f'<path d="{d}" fill="none" stroke="url(#rg)" stroke-width="{width}" stroke-linecap="round" opacity="{opacity}"/></svg>')


def icon(path, stroke='#fff', size=44):
    return (f'<svg width="{size}" height="{size}" viewBox="0 0 24 24" fill="none" stroke="{stroke}" stroke-width="2.4" '
            f'stroke-linecap="round" stroke-linejoin="round">{path}</svg>')


# lucide-style glyphs (the app uses lucide-react)
ICON_SEND = icon('<path d="M12 19V5M5 12l7-7 7 7"/>')
ICON_SYNC = icon('<path d="M21 12a9 9 0 0 1-15.5 6.2L3 16"/><path d="M3 21v-5h5"/><path d="M3 12a9 9 0 0 1 15.5-6.2L21 8"/><path d="M21 3v5h-5"/>')
ICON_FLAME = icon('<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.4-.5-2-1-3-1.1-2.1-.2-4.1 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.2.4-2.3 1-3.3.5 1.3 1.5 2.3 2.5 2.8z"/>')
ICON_KEY = icon('<rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M8 14h8"/>')


def card(style, ic, small, strong, bg=TANGO):
    return (f'<div class="card" style="{style}"><div class="ic" style="background:{bg}">{ic}</div>'
            f'<div><small>{small}</small><strong>{strong}</strong></div></div>')


def phone(name, left, top, w, rot=0, z=1):
    """Phone whose screen keeps the screenshot's real aspect ratio (plus a status strip for the notch)."""
    sw, sh = size_of(name)
    inner_w = w - 28
    h = round(inner_w * sh / sw) + 40 + 28
    dark = ' dark' if 'dark' in name else ''
    return (f'<div class="phone" style="left:{left}px;top:{top}px;width:{w}px;height:{h}px;'
            f'transform:rotate({rot}deg);z-index:{z}"><div class="scr{dark}"><div class="notch"></div>'
            f'<img src="{shot(name, max_w=900)}"></div></div>')


def phone_h(name, w):
    sw, sh = size_of(name)
    return round((w - 28) * sh / sw) + 40 + 28


def laptop(name, left, top, inner_w):
    sw, sh = size_of(name)
    inner_h = round(inner_w * sh / sw)
    w, h = inner_w + 28, inner_h + 28
    return (f'<div class="laptop-screen" style="left:{left}px;top:{top}px;width:{w}px;height:{h}px">'
            f'<img src="{shot(name, max_w=1440)}"></div>'
            f'<div class="laptop-base" style="left:{left - 50}px;top:{top + h}px;width:{w + 100}px"></div>')


def left_block(t):
    pills = ''.join(f'<span class="pill"><i></i>{p}</span>' for p in PILLS)
    return f'''
  <img class="logo abs" src="{logo_uri()}" style="left:110px;top:{t}px;width:160px;height:160px">
  <h1 class="abs" style="left:104px;top:{t + 195}px;font-size:136px;white-space:nowrap">Task<b>Tango</b></h1>
  <div class="tag abs" style="left:110px;top:{t + 358}px;font-size:56px;white-space:nowrap">{TAGLINE}</div>
  <div class="blurb abs" style="left:110px;top:{t + 448}px;width:860px;font-size:31px">{BLURB}</div>
  <div class="pills abs" style="left:110px;top:{t + 600}px">{pills}</div>
  <div class="abs" style="left:110px;top:{t + 770}px;display:flex;align-items:center;gap:24px">
    <span class="chip"><i></i>Built with Next.js</span>
    <span class="plat">Web &nbsp;&middot;&nbsp; Installable PWA &nbsp;&middot;&nbsp; Phone &amp; desktop</span>
  </div>'''


def hero():
    return (
        '<div class="glow" style="left:1060px;top:120px;width:800px;height:800px;background:radial-gradient(circle,rgba(255,120,60,.30),transparent 65%)"></div>'
        + ribbon('left:960px;top:820px', 900, 260, 'M20 200 C160 60 300 250 470 150 C620 60 700 120 860 40', width=16, opacity=.55)
        + left_block(60)
        + SPARK.format(s='left:900px;top:300px;width:46px;height:46px')
        + SPARK.format(s='left:1838px;top:250px;width:50px;height:50px')
        + SPARK.format(s='left:1010px;top:960px;width:38px;height:38px')
        + confetti(1010, 150, CRIMSON, 20) + confetti(1860, 620, CORAL, -30)
        + confetti(1840, 1010, '#f2b01e', 45) + confetti(935, 560, TANGERINE, -20)
        + phone('mobile-stats', 1000, 300, 340, rot=-8, z=1)
        + phone('mobile-upcoming', 1520, 290, 340, rot=8, z=1)
        + phone('mobile-today', 1235, 150, 410, rot=0, z=3)
        + card('left:930px;top:40px', ICON_SEND, 'Type it naturally', '&ldquo;tomorrow 5pm !high&rdquo;')
        + card('left:1410px;top:920px', ICON_SYNC, 'Guest or account', 'Real-time sync')
    )


def devices():
    return (
        ribbon('left:1000px;top:0px', 900, 200, 'M20 170 C200 40 360 180 520 90 C660 10 760 60 880 20', width=14, opacity=.5)
        + left_block(60)
        + SPARK.format(s='left:880px;top:170px;width:44px;height:44px')
        + SPARK.format(s='left:1850px;top:150px;width:50px;height:50px')
        + confetti(1840, 900, CRIMSON, 30) + confetti(960, 1000, TANGERINE, -25)
        + laptop('desktop-today', 980, 230, 800)
        + phone('mobile-today-dark', 1580, 380, 280, rot=0, z=3)
        + card('left:1000px;top:800px', ICON_KEY, 'Keyboard first', 'N &middot; / &middot; ? &middot; Ctrl+Z')
        + card('left:1180px;top:70px', ICON_FLAME, 'Stay motivated', 'Streaks &amp; progress rings')
    )


def gallery():
    w_small, w_mid, w_big = 320, 340, 380
    base = 1080 - 40  # bottoms sit just below the canvas edge for a "rising" row
    specs = [
        ('mobile-welcome', 95, w_small, 120),
        ('mobile-quick-add', 445, w_mid, 60),
        ('mobile-today', 770, w_big, 0),
        ('mobile-stats', 1135, w_mid, 60),
        ('mobile-today-dark', 1505, w_small, 120),
    ]
    phones = ''.join(phone(n, x, 330 + dy, w, z=3 if dy == 0 else 1) for n, x, w, dy in specs)
    return f'''
  <div class="abs" style="left:0;top:58px;width:1920px;display:flex;justify-content:center;align-items:center;gap:34px">
    <img class="logo" src="{logo_uri()}" style="width:132px;height:132px">
    <h1 style="font-size:136px;white-space:nowrap">Task<b>Tango</b></h1>
  </div>
  <div class="tag abs" style="left:0;top:222px;width:1920px;text-align:center;font-size:56px">{TAGLINE}</div>
  {ribbon('left:-20px;top:200px', 420, 160, 'M20 130 C110 20 220 140 300 70 C350 30 380 40 400 20', width=12, opacity=.6)}
  {ribbon('left:1520px;top:200px', 420, 160, 'M20 20 C80 90 160 10 240 80 C310 140 360 120 400 110', width=12, opacity=.6)}
  {SPARK.format(s='left:120px;top:70px;')}
  {SPARK.format(s='left:1760px;top:60px;width:46px;height:46px')}
  {confetti(520, 120, CRIMSON, 25)}{confetti(1400, 110, TANGERINE, -35)}{confetti(1830, 330, CORAL, 40)}{confetti(60, 360, '#f2b01e', -20)}
  {phones}'''


PAGES = {
    'tasktango-thumb-1-hero.png': hero,
    'tasktango-thumb-2-devices.png': devices,
    'tasktango-thumb-3-gallery.png': gallery,
}


def main():
    os.makedirs(OUT, exist_ok=True)
    css = (font_face('Plus Jakarta Sans', 'docs/fonts/PlusJakartaSans.woff2', '200 800')
           + font_face('Inter', 'docs/fonts/Inter.woff2') + CSS)
    with sync_playwright() as p:
        try:
            browser = p.chromium.launch()
        except Exception:
            exe = sorted(glob.glob(os.path.join(os.environ.get('LOCALAPPDATA', ''), 'ms-playwright',
                                                'chromium-*', 'chrome-win*', 'chrome.exe')))[-1]
            browser = p.chromium.launch(executable_path=exe)
        page = browser.new_page(viewport={'width': 1920, 'height': 1080})
        for name, build in PAGES.items():
            page.set_content(f'<html><head><meta charset="utf-8"><style>{css}</style></head><body>{build()}</body></html>')
            page.evaluate('document.fonts.ready')
            page.wait_for_timeout(700)
            path = os.path.join(OUT, name)
            page.screenshot(path=path)
            with Image.open(path) as im:
                assert im.size == (1920, 1080), im.size
            print('saved', path)
        browser.close()


if __name__ == '__main__':
    main()
