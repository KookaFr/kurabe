"""Réduit la police BIZ UDPGothic aux caractères de l'application (4,4 Mo -> ~0,3 Mo), et écrit dans
kurabe.css les @font-face avec leur unicode-range.

Les polices complètes sont dans polices/complet/ : le navigateur ne les télécharge que si un kanji absent
de la police réduite apparaît (nom d'une photo ou texte d'aide écrit par les parents).
À relancer après avoir ajouté des textes avec de nouveaux kanji :
    pip install fonttools brotli
    python3 outils/police.py
"""
import glob
import os
import subprocess
import tempfile

RACINE = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
os.chdir(RACINE)

import re

fichiers = glob.glob('src/**/*.js', recursive=True) + ['index.html', 'kurabe.css', 'manifest.webmanifest']
caracteres = set()
for f in fichiers:
    with open(f, encoding='utf8') as fh:
        texte = fh.read()
    # Le bloc des @font-face (écrit plus bas) ne compte pas : il ne contient que des codes.
    caracteres |= set(re.sub(r'/\* police:debut \*/.*?/\* police:fin \*/', '', texte, flags=re.S))
# Plages entières : ASCII et latin, ponctuation, flèches et formes, kana, pleine chasse.
for debut, fin in [(0x20, 0x7E), (0xA0, 0xFF), (0x2010, 0x2027), (0x2190, 0x21FF), (0x2460, 0x24FF),
                   (0x25A0, 0x25FF), (0x2600, 0x26FF), (0x3000, 0x303F), (0x3040, 0x309F), (0x30A0, 0x30FF),
                   (0xFF00, 0xFFEF)]:
    caracteres |= {chr(c) for c in range(debut, fin + 1)}
caracteres -= set('\n\r\t')

with tempfile.NamedTemporaryFile('w', encoding='utf8', suffix='.txt', delete=False) as t:
    t.write(''.join(sorted(caracteres)))
    liste = t.name
kanji = sum(1 for c in caracteres if 0x4E00 <= ord(c) <= 0x9FFF)
for graisse in ('Regular', 'Bold'):
    sortie = f'polices/BIZUDPGothic-{graisse}.woff2'
    subprocess.run(['pyftsubset', f'polices/complet/BIZUDPGothic-{graisse}.woff2', f'--text-file={liste}',
                    '--flavor=woff2', "--layout-features=*", f'--output-file={sortie}'], check=True)
    print(f'{sortie} : {os.path.getsize(sortie) // 1024} Ko')
os.unlink(liste)

# unicode-range de la police réduite : les caractères qu'elle contient vraiment, en plages compactes.
from fontTools.ttLib import TTFont
codes = sorted(TTFont('polices/BIZUDPGothic-Regular.woff2').getBestCmap().keys())
plages = []
for c in codes:
    if plages and c == plages[-1][1] + 1:
        plages[-1][1] = c
    else:
        plages.append([c, c])
portee = ', '.join(f'U+{a:X}' if a == b else f'U+{a:X}-{b:X}' for a, b in plages)
bloc = ['/* police:debut */']
for graisse, poids in (('Regular', 400), ('Bold', 700)):
    # D'abord la police complète, pour les kanji seulement (sinon un emoji suffirait à la faire télécharger) ;
    # puis la réduite, qui passe devant pour sa portée.
    bloc.append(f'@font-face {{ font-family: "BIZ UDPGothic"; font-style: normal; font-weight: {poids}; font-display: swap; '
                f'src: url("polices/complet/BIZUDPGothic-{graisse}.woff2") format("woff2"); unicode-range: U+3400-4DBF, U+4E00-9FFF, U+F900-FAFF; }}')
    bloc.append(f'@font-face {{ font-family: "BIZ UDPGothic"; font-style: normal; font-weight: {poids}; font-display: swap; '
                f'src: url("polices/BIZUDPGothic-{graisse}.woff2") format("woff2"); unicode-range: {portee}; }}')
bloc.append('/* police:fin */')
with open('kurabe.css', encoding='utf8') as fh:
    css = fh.read()
css, n = re.subn(r'/\* police:debut \*/.*?/\* police:fin \*/', lambda m: '\n'.join(bloc), css, flags=re.S)
assert n == 1, 'kurabe.css : repères police:debut / police:fin introuvables'
with open('kurabe.css', 'w', encoding='utf8') as fh:
    fh.write(css)
print(f'{len(caracteres)} caractères, dont {kanji} kanji. kurabe.css : {len(plages)} plages unicode.')
