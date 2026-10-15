# Prepara a arte dos personagens e dos fundos (ARTE-PERSONAGENS.md), de codigo/arte/originais/ para codigo/imagens/:
#   retrato-*.png -> retrato-*.webp, 512 x 512
#   corpo-*.png   -> corpo-*.webp, recortado do fundo magenta, 640 de altura
#   fundo-*.png   -> fundo-*.webp, 1280 de largura
# Uso: ..\guardioes-da-fogueira-site\.venv\Scripts\python codigo\arte\preparar-personagens.py [nomes sem extensão...]
#      sem nomes, prepara tudo o que estiver em originais/
import os, sys
from PIL import Image
AQUI = os.path.dirname(os.path.abspath(__file__)); ORIG = os.path.join(AQUI, 'originais'); IMG = os.path.join(AQUI, '..', 'imagens')
pedidos = set(sys.argv[1:])
def sem_magenta(im):
    im = im.convert('RGBA'); px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            m = min(r, b) - g                     # quanto parece magenta
            if m > 60: px[x, y] = (r, g, b, 0)
            elif m > 25: px[x, y] = (min(r, 200), g, min(b, 200), int(a * (60 - m) / 35))   # borda: meio transparente, sem rosa
    return im.crop(im.getchannel('A').point(lambda v: 255 if v > 20 else 0).getbbox())
for f in sorted(os.listdir(ORIG)):
    nome, ext = os.path.splitext(f)
    if ext.lower() not in ('.png', '.jpg', '.webp') or (pedidos and nome not in pedidos): continue
    im = Image.open(os.path.join(ORIG, f))
    if nome.startswith('retrato-'): im = im.convert('RGB').resize((512, 512), Image.LANCZOS); q = 82
    elif nome.startswith('corpo-'): im = sem_magenta(im); im = im.resize((round(640 * im.width / im.height), 640), Image.LANCZOS); q = 84
    elif nome.startswith('fundo-'): im = im.convert('RGB').resize((1280, round(1280 * im.height / im.width)), Image.LANCZOS); q = 72
    else: continue
    saida = os.path.join(IMG, nome + '.webp'); im.save(saida, 'WEBP', quality=q, method=6)
    print(nome, im.size, os.path.getsize(saida) // 1024, 'KB')
