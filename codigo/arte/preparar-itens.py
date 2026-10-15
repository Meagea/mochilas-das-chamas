# Prepara as pinturas dos itens (ARTE-ITENS.md): codigo/arte/originais/itens/item-*.png -> codigo/imagens/item-*.webp,
# recortadas do fundo magenta e reduzidas para 256 px (o maior lado). Uso: ..\guardioes-da-fogueira-site\.venv\Scripts\python codigo\arte\preparar-itens.py
import os
from PIL import Image
AQUI = os.path.dirname(os.path.abspath(__file__)); ENT = os.path.join(AQUI, 'originais', 'itens'); IMG = os.path.join(AQUI, '..', 'imagens')
os.makedirs(ENT, exist_ok=True); n = 0
for f in sorted(os.listdir(ENT)):
    nome, ext = os.path.splitext(f)
    if not nome.startswith('item-') or ext.lower() not in ('.png', '.jpg', '.webp'): continue
    im = Image.open(os.path.join(ENT, f)).convert('RGBA'); px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]; m = min(r, b) - g
            if m > 60: px[x, y] = (r, g, b, 0)
            elif m > 25: px[x, y] = (min(r, 200), g, min(b, 200), int(a * (60 - m) / 35))
    im = im.crop(im.getchannel('A').point(lambda v: 255 if v > 20 else 0).getbbox()); im.thumbnail((256, 256), Image.LANCZOS)
    im.save(os.path.join(IMG, nome + '.webp'), 'WEBP', quality=82, method=6); n += 1
print('ok ·', n, 'itens')
