# Gera o ícone e a tela de abertura dos aplicativos (APK e Windows) a partir de codigo/arte/originais/icone-app.png
# (a mochila estufada com a espada). Uso: ..\guardioes-da-fogueira-site\.venv\Scripts\python codigo\arte\gerar-icone-app.py
import os
from PIL import Image, ImageDraw
AQUI = os.path.dirname(os.path.abspath(__file__)); RAIZ = os.path.join(AQUI, '..', '..')
RES = os.path.join(RAIZ, '3-app', 'android', 'app', 'src', 'main', 'res')
base = Image.open(os.path.join(AQUI, 'originais', 'icone-app.png')).convert('RGBA').resize((1024, 1024), Image.LANCZOS)
os.makedirs(os.path.join(RAIZ, '4-pc', 'build'), exist_ok=True)
base.convert('RGB').save(os.path.join(RAIZ, '4-pc', 'build', 'icone-1024.png'))
base.save(os.path.join(RAIZ, '4-pc', 'build', 'icon.ico'), sizes=[(s, s) for s in (16, 24, 32, 48, 64, 128, 256)])
for pasta, n in (('mdpi', 48), ('hdpi', 72), ('xhdpi', 96), ('xxhdpi', 144), ('xxxhdpi', 192)):
    d = os.path.join(RES, 'mipmap-' + pasta)
    base.resize((n, n), Image.LANCZOS).convert('RGB').save(os.path.join(d, 'ic_launcher.png'))
    redondo = base.resize((n, n), Image.LANCZOS); m = Image.new('L', (n * 4, n * 4), 0)
    ImageDraw.Draw(m).ellipse((0, 0, n * 4 - 1, n * 4 - 1), fill=255); redondo.putalpha(m.resize((n, n), Image.LANCZOS)); redondo.save(os.path.join(d, 'ic_launcher_round.png'))
    f = int(n * 2.25); base.resize((f, f), Image.LANCZOS).save(os.path.join(d, 'ic_launcher_foreground.png'))
for nome in os.listdir(RES):
    p = os.path.join(RES, nome, 'splash.png')
    if os.path.exists(p):
        w, h = Image.open(p).size; im = Image.new('RGBA', (w, h), (18, 17, 23, 255)); s = int(min(w, h) * .55)
        im.alpha_composite(base.resize((s, s), Image.LANCZOS), ((w - s) // 2, (h - s) // 2)); im.convert('RGB').save(p)
print('ok')
