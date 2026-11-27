"""把 ChatGPT 生的分層素材（提示詞 v3：會動的畫面）轉成遊戲用的檔，並更新 src/art/live-manifest.js。

用法：python3 app/tools/live.py <放 PNG 的資料夾>
檔名就是代號：room-ward.png、patient-lin-a.png、meng-b.png、hero-cheng-a.png、ma-c.png、shadow-moth.png…
  room-*      背景（不去背），寬 1600，記下邊緣的平均色（畫面比圖寬的時候拿來補）
  其他        去背的角色和劫影。同一個角色的 a/b/c 用同一個框裁切，切換表情時才不會跳；高最多 640
輸出 app/public/art/live/<代號>.webp。manifest 裡手調的欄位（width、height、foot、head、rect、spots）重跑會留著。
"""
import json
import re
import sys
from pathlib import Path
from PIL import Image

SRC = Path(sys.argv[1])
ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'app/public/art/live'
MANIFEST = ROOT / 'app/src/art/live-manifest.js'
MARK_A, MARK_B = '// ── sprites 開始（art/live.py 產生）──', '// ── sprites 結束 ──'
# 沒有手調之前的預設大小（場景單位，跟程式畫的一樣大）
DEFAULT = [('patient-', {'width': 200}), ('meng-', {'height': 150}), ('ma-', {'height': 152}), ('hero-', {'height': 128}), ('mo-', {'height': 120}), ('shadow-', {'height': 92})]
KEEP = ['width', 'height', 'foot', 'head', 'rect', 'spots']


def read_manifest():
    text = MANIFEST.read_text(encoding='utf-8')
    if MARK_A in text:
        return json.loads(text.split(MARK_A)[1].split(MARK_B)[0].strip().removeprefix('sprites:').rstrip().rstrip(','))
    return {}


def write_manifest(sprites):
    body = json.dumps(sprites, ensure_ascii=False, indent=2)
    MANIFEST.write_text(
        '// 會動的畫面的插圖清單。app/tools/live.py <資料夾> 會改寫下面那一段（位置、大小這些手調的欄位會留著）。\n'
        '// 空的時候，所有場景都照舊用程式畫。\n'
        'export default {\n' + MARK_A + '\nsprites: ' + body + ',\n' + MARK_B + '\n};\n', encoding='utf-8')


def webp(im, path, quality=84):
    path.parent.mkdir(parents=True, exist_ok=True)
    im.save(path, 'WEBP', quality=quality, method=6)
    print(path.relative_to(ROOT), im.size, round(path.stat().st_size / 1024), 'KB')


old = read_manifest()
sprites = {}
files = {f.stem: f for f in sorted(SRC.rglob('*.png'))}
if not files:
    sys.exit('資料夾裡沒有 PNG：' + str(SRC))

# 背景
for name, f in files.items():
    if not name.startswith('room-') and name not in ('hall', 'title'):
        continue
    im = Image.open(f).convert('RGB')
    if im.width > 1600:
        im = im.resize((1600, round(im.height * 1600 / im.width)), Image.LANCZOS)
    webp(im, OUT / (name + '.webp'), 80)
    edge = [im.getpixel((x, y)) for x in range(0, im.width, 16) for y in (0, im.height - 1)] + [im.getpixel((x, y)) for y in range(0, im.height, 16) for x in (0, im.width - 1)]
    avg = tuple(sum(c[i] for c in edge) // len(edge) for i in range(3))
    sprites[name] = {'src': 'art/live/' + name + '.webp', 'fill': '#%02x%02x%02x' % avg}

# 角色和劫影：同一組（去掉 -a/-b/-c）用聯集的框裁切
groups = {}
for name, f in files.items():
    if name in sprites:
        continue
    groups.setdefault(re.sub(r'-[abc]$', '', name), []).append(name)
bad = []
for base, names in groups.items():
    ims = {n: Image.open(files[n]).convert('RGBA') for n in names}
    sizes = {im.size for im in ims.values()}
    if len(sizes) > 1:
        bad.append(base + '：同一組的圖大小不一樣 ' + str(sizes)); continue
    boxes = []
    for n, im in ims.items():
        a = im.getchannel('A')
        if a.getextrema()[0] > 200:
            bad.append(n + '：背景不是透明的'); break
        boxes.append(a.point(lambda v: 255 if v > 24 else 0).getbbox())
    else:
        l, t = min(b[0] for b in boxes), min(b[1] for b in boxes)
        r, btm = max(b[2] for b in boxes), max(b[3] for b in boxes)
        pad = 6
        box = (max(0, l - pad), max(0, t - pad), min(ims[names[0]].width, r + pad), min(ims[names[0]].height, btm + pad))
        limit = 512 if base.startswith('shadow-') else 640
        for n, im in ims.items():
            c = im.crop(box)
            if c.height > limit:
                c = c.resize((round(c.width * limit / c.height), limit), Image.LANCZOS)
            webp(c, OUT / (n + '.webp'))
            entry = {'src': 'art/live/' + n + '.webp'}
            for pre, d in DEFAULT:
                if n.startswith(pre):
                    entry.update(d)
            sprites[n] = entry

# 手調的欄位留著
for n, e in sprites.items():
    for k in KEEP:
        if k in old.get(n, {}):
            e[k] = old[n][k]
# 這一次沒有給、之前就有的，照留
for n, e in old.items():
    sprites.setdefault(n, e)
write_manifest(dict(sorted(sprites.items())))
print('manifest：', len(sprites), '張')
if bad:
    print('\n沒有轉的：'); [print('  ' + b) for b in bad]
    sys.exit(1)
