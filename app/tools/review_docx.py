#!/usr/bin/env python3
"""把審查清單轉成一份 Word 檔，給臨床老師列印或直接在上面批改。

用法（在 app/ 底下）：
    python3 tools/review_docx.py 審查清單.docx

需要先裝 pandoc。這支程式會自己跑 `node tools/review.ts`，不會動 docs/review/。
做的事：把四份 Markdown 接成一份、每一位病人從新的一頁開始、紙張改成橫的 A4、表格加上格線。
"""
import re
import subprocess
import sys
import tempfile
import zipfile
from pathlib import Path

APP = Path(__file__).resolve().parent.parent
# 用 pandoc 自己的 Markdown 讀：這樣表格的欄寬才會照分隔線的長度分配。關掉會誤判內文的幾個延伸語法
READER = "markdown-superscript-subscript-citations-tex_math_dollars-raw_tex-smart-yaml_metadata_block-fancy_lists-example_lists"
BORDERS = "".join(
    f'<w:{side} w:val="single" w:sz="4" w:space="0" w:color="808080"/>'
    for side in ("top", "left", "bottom", "right", "insideH", "insideV")
)


def bundle(src: Path) -> str:
    """接成一份。每一位病人的標題升一級，這樣在 Word 裡會從新的一頁開始"""
    names = (src / "ORDER").read_text(encoding="utf8").split()
    parts = []
    for name in names:
        text = (src / name).read_text(encoding="utf8")
        text = re.sub(r"^## (C\d\d[A-Z]｜)", r"# \1", text, flags=re.M)
        text = re.sub(r"<details><summary>(.*?)</summary>", r"\1", text).replace("</details>", "")
        text = re.sub(r"\[([^\]]+)\]\([a-zA-Z-]+\.md\)", r"\1", text)  # 檔案之間的連結在 Word 裡沒有用
        text = re.sub(r"^---$", "", text, flags=re.M)
        parts.append(text)
    return "\n\n".join(parts)


def reference_doc(path: Path) -> None:
    """從 pandoc 內建的範本改：橫的 A4、字小一點、中文字型、表格格線、大標題換頁"""
    raw = subprocess.run(["pandoc", "--print-default-data-file", "reference.docx"], check=True, capture_output=True).stdout
    base = path.with_suffix(".base.docx")
    base.write_bytes(raw)
    with zipfile.ZipFile(base) as zin, zipfile.ZipFile(path, "w", zipfile.ZIP_DEFLATED) as zout:
        for item in zin.infolist():
            data = zin.read(item.filename)
            if item.filename == "word/styles.xml":
                x = data.decode("utf8")
                x = re.sub(r"<w:rFonts [^>]*/>", '<w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:eastAsia="Microsoft JhengHei" w:cs="Calibri"/>', x, count=1)
                x = re.sub(r'(<w:rPrDefault>.*?<w:sz w:val=")\d+(")', r"\g<1>19\2", x, count=1, flags=re.S)
                x = re.sub(r'(<w:rPrDefault>.*?<w:szCs w:val=")\d+(")', r"\g<1>19\2", x, count=1, flags=re.S)
                x = re.sub(r'(<w:style [^>]*w:styleId="Heading1"[^>]*>.*?<w:pPr>)', r"\1<w:pageBreakBefore/>", x, count=1, flags=re.S)
                x = re.sub(r'(<w:style [^>]*w:styleId="Table"[^>]*>.*?<w:tblPr>)', r"\1<w:tblBorders>" + BORDERS + "</w:tblBorders>", x, count=1, flags=re.S)
                data = x.encode("utf8")
            if item.filename == "word/document.xml":
                x = data.decode("utf8")
                x = re.sub(r"<w:sectPr[^>]*>.*?</w:sectPr>|<w:sectPr[^>]*/>", '<w:sectPr><w:pgSz w:w="16838" w:h="11906" w:orient="landscape"/><w:pgMar w:top="850" w:right="850" w:bottom="850" w:left="850" w:header="400" w:footer="400" w:gutter="0"/></w:sectPr>', x, count=1, flags=re.S)
                data = x.encode("utf8")
            zout.writestr(item, data)
    base.unlink()


def main() -> int:
    if len(sys.argv) != 2:
        print(__doc__)
        return 2
    out = Path(sys.argv[1]).resolve()
    with tempfile.TemporaryDirectory() as tmp:
        tmp_path = Path(tmp)
        subprocess.run(["node", "tools/review.ts", "--bundle", str(tmp_path / "md")], check=True, cwd=APP, stdout=subprocess.DEVNULL)
        (tmp_path / "all.md").write_text(bundle(tmp_path / "md"), encoding="utf8")
        reference_doc(tmp_path / "ref.docx")
        subprocess.run(["pandoc", "-f", READER, "--columns=20", str(tmp_path / "all.md"), "--reference-doc", str(tmp_path / "ref.docx"), "-o", str(out)], check=True)
    print("寫好：" + str(out))
    return 0


if __name__ == "__main__":
    sys.exit(main())
