"""Réduit la police BIZ UDPGothic aux caractères de l'application (4,4 Mo -> ~0,3 Mo).

Les polices complètes sont dans polices/complet/ (elles ne sont jamais téléchargées par l'app).
À relancer après avoir ajouté des textes avec de nouveaux kanji :
    pip install fonttools brotli
    python3 outils/police.py
Un caractère absent de la police réduite s'affiche quand même, avec la police du système
(Hiragino, Yu Gothic, Noto...) : par exemple dans le nom d'une photo tapé par les parents.
"""
import glob
import os
import subprocess
import tempfile

RACINE = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
os.chdir(RACINE)

fichiers = glob.glob('src/**/*.js', recursive=True) + ['index.html', 'kurabe.css', 'manifest.webmanifest']
caracteres = set()
for f in fichiers:
    with open(f, encoding='utf8') as fh:
        caracteres |= set(fh.read())
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
print(f'{len(caracteres)} caractères, dont {kanji} kanji.')
