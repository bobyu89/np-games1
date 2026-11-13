# 3D 模型產生器

`build_models.py` 用 Blender 的 Python 介面把所有模型「寫」出來，匯出成一個 GLB 檔。不需要打開 Blender 的視窗。

## 重新產生模型

有安裝 Blender（4.2 以上）：

```bash
blender --background --python tools/blender/build_models.py -- --out prototypes/sepsis-3d/assets/models.glb
```

沒有安裝 Blender，用 Python 套件也可以（這個 repo 的模型是用 `bpy` 5.3 產生的）：

```bash
pip install bpy
```

```bash
python tools/blender/build_models.py --out prototypes/sepsis-3d/assets/models.glb
```

產生後跑一次測試，確認模型和遊戲資料對得上：

```bash
node --test prototypes/sepsis-3d/assets.test.js
```

## 想在 Blender 裡手修

加上 `--blend` 會另存一份 `.blend`：

```bash
python tools/blender/build_models.py --out prototypes/sepsis-3d/assets/models.glb --blend models.blend
```

打開 `models.blend` 修改後，用「檔案 → 匯出 → glTF 2.0」存成 `.glb` 蓋掉原檔。匯出時「頂點色」要選「材質」，並維持 +Y 朝上。

注意：之後如果又重跑腳本，手修的內容會被蓋掉。確定要手修的模型，建議把腳本裡對應的那一段拿掉，改成維護 `.blend`。

## 命名規則（遊戲靠名稱找模型）

| 名稱 | 用途 |
|---|---|
| `unit_<角色 id>` | 角色的根節點，id 和 `data.js` 的 `UNITS` 相同 |
| `<角色 id>__body`、`__head`、`__hand_L`、`__hand_R` | 角色的四個可動部位。手持物做在 `hand_R` 裡，會跟著手動 |
| `enemy_<種類>`、`enemy_<種類>__body` | 敵人，種類和 `data.js` 的 `ENEMIES[].kind` 相同 |
| `enemy_hypotension__needle` | 血壓計的指針（會晃動） |
| `enemy_pathogen__bud_1`、`_2`；`enemy_lactate__bub_1`–`3`；`enemy_mods__orb_*` | 會各自飄動或繞行的小零件 |
| `tile_hex` | 六角格（顏色由遊戲套上） |
| `env_bed`、`env_monitor`、`env_ivpole`、`env_rail`、`env_cart` | 場景道具 |
| `env_monitor__screen` | 空物件，標出監視器螢幕的位置（畫面由遊戲即時繪製） |

## 建模慣例

- Blender 裡 Z 朝上、角色面向 −Y；匯出時自動轉成 glTF 的 Y 朝上。
- 一個單位大約是一個六角格的半徑。角色身高約 1.9。
- 顏色寫在頂點色（屬性名稱 `Col`），所有部位共用一個材質 `clay`。只有會發光的小零件（螢幕、MODS 的眼睛）用 `glow_*` 材質。
- 每個可動部位是一個獨立的 mesh，原點放在關節上（頭的原點在脖子、手的原點在手心）。

所有造型都是原創的職類原型，不對應真實人物，也不取自任何現有遊戲。
