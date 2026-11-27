"""把 ChatGPT 生的美術包（Guihangji_Art_Pack_v2）轉成遊戲和 Threads 用的檔。

用法：python3 app/tools/art.py <解壓後的美術包資料夾>
輸出：
  app/public/art/shadows/<look>.webp   十二隻劫影，512×512
  app/public/art/badges/<id>.webp      八枚勳章，從一張圖切開，256×256
  app/public/art/people/<who>.webp     孟拓、馬凱、費民的設定稿，寬 960
  app/public/art/scenes/<name>.webp    公會大廳、病室、航海圖，寬 1280
  social/art/base.jpg                  Threads 圖卡的無字底圖，1080×1350
原始 PNG 很大（整包約 45 MB），不進 git；換圖就換掉美術包、重跑這個指令。
"""
import sys
from pathlib import Path
from PIL import Image

SRC = Path(sys.argv[1])
ROOT = Path(__file__).resolve().parents[2]
ART = ROOT / 'app/public/art'
SHADOWS = ['moth', 'frog', 'crab', 'newt', 'bird', 'tortoise', 'heron', 'puffer', 'otter', 'squid', 'mouse', 'eel']
BADGES = ['four-lamps', 'no-trap-3', 'graduate', 'first-pass', 'calm-80', 'week', 'twelve', 'master']


def save(im, path, size=None, width=None, quality=80):
    path.parent.mkdir(parents=True, exist_ok=True)
    im = im.convert('RGB')
    if size:
        im = im.resize(size, Image.LANCZOS)
    elif width and im.width > width:
        im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
    if path.suffix == '.jpg':
        im.save(path, quality=88, optimize=True)
    else:
        im.save(path, 'WEBP', quality=quality, method=6)
    print(path.relative_to(ROOT), im.size, round(path.stat().st_size / 1024), 'KB')


shadow_files = sorted((SRC / '02_劫影').glob('*.png'))
assert len(shadow_files) == 12, shadow_files
for look, f in zip(SHADOWS, shadow_files):
    save(Image.open(f), ART / 'shadows' / (look + '.webp'), size=(512, 512))

sheet = Image.open(SRC / '05_勳章/八枚勳章.png')
w, h = sheet.size
for i, bid in enumerate(BADGES):
    c, r = i % 4, i // 4
    cell = sheet.crop((c * w // 4, r * h // 2, (c + 1) * w // 4, (r + 1) * h // 2))
    side = min(cell.size)
    left, top = (cell.width - side) // 2, (cell.height - side) // 2
    save(cell.crop((left, top, left + side, top + side)), ART / 'badges' / (bid + '.webp'), size=(256, 256), quality=82)

for who, name in [('meng', '01_孟拓'), ('ma', '02_馬凱'), ('fei', '03_費民')]:
    save(Image.open(SRC / '01_角色' / (name + '.png')), ART / 'people' / (who + '.webp'), width=960)

for key, name in [('hall', '01_公會大廳'), ('ward', '02_病室'), ('chart', '03_航海圖')]:
    save(Image.open(SRC / '03_場景' / (name + '.png')), ART / 'scenes' / (key + '.webp'), width=1280)

save(Image.open(SRC / '04_Threads/Threads_無字底圖.png'), ROOT / 'social/art/base.jpg', size=(1080, 1350))
