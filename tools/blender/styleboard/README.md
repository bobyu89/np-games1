# 風格候選的製作方法

這個資料夾是用來做 [`docs/ART-v2.md`](../../../docs/ART-v2.md) 裡那兩張比較圖的工具。風格還沒定案，所以**外部素材沒有放進 repo**，要重現請先自己下載。

## 素材（都是 CC0）

| 檔案 | 下載 |
|---|---|
| Universal Animation Library（Standard） | <https://opengameart.org/content/universal-animation-library> |
| Ultimate Animated Character Pack | <https://opengameart.org/content/animated-characters-pack> |

## 候選 B：把通用人形穿成醫療團隊

```bash
python tools/blender/styleboard/dress_mannequin.py "<解壓縮路徑>/Godot/AnimationLibrary_Godot_Standard.glb" out/ np,rn_lactate,attending,surgeon
```

每個角色輸出一個 `b_<角色>.glb`，帶骨架和 8 個動畫。腳本做三件事：

1. 沿袖口、領口、下襬切出乾淨的邊線，再依骨頭分區上色（上衣、褲子、皮膚、鞋）。
2. 布料區域平滑後往外推一點，蓋掉假人的肌肉線條。
3. 頭髮、聽診器、識別證、手持物、白袍下襬另外建模，綁在對應的骨頭上。

角色的配色和配件寫在腳本最上面的 `SPECS`。

## 候選 A：轉檔

```bash
python tools/blender/styleboard/fbx_to_glb.py "<解壓縮路徑>/FBX" out/ Doctor_Female_Young,Casual_Female
```

轉出來的材質透明度是 0（看不見），要在載入時設回不透明；皮膚材質原本是黑色，也要換成膚色。

## 注意

- 外部檔案只匯入模型、骨架和動畫，腳本已關閉自動執行內嵌腳本。
- 需要 Blender 4.2 以上，或 `pip install bpy`。
