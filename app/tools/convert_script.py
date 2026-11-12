#!/usr/bin/env python3
"""把一份 OSCE 教案（.docx 或 .txt）轉成遊戲病例的底稿。

用法（在 app/ 底下）：

    python3 tools/convert_script.py 教案.docx --id c02a
    python3 tools/convert_script.py 教案資料夾/ --report        # 只看對照結果，不寫檔

它做的事：
  1. 讀出教案的四段：開場、主訴（OLD CARTS）、個人與過去病史（含系統回顧）、身體評估。
  2. 把每一個問句對到遊戲的問題代號（src/data/skeleton.ts 那一套），把身體評估的發現對到評估代號。
  3. 寫出一份 CaseSpec 的底稿到 drafts/<id>.draft.ts：病人的回答和評估結果先放教案的原文，
     推理的部分（每條線索指向哪個診斷、安全行動、摘要、回報、說明、文獻）留成 TODO。

它不做的事：
  - 不改寫文字。底稿裡是教案的原文，只能當底稿：進專案之前，每一句都要用自己的話重寫。
  - 不判斷臨床內容。線索指向哪個診斷、哪些算安全行動，要由寫病例的人決定、由臨床老師審查。

drafts/ 不進版本控制。教案是別人的著作，原文不要 commit、不要放進遊戲。
只用 Python 內建的模組。教案當成不可信的資料處理：只取文字，不執行裡面的任何東西。
"""
from __future__ import annotations

import argparse
import html
import json
import re
import sys
import zipfile
from pathlib import Path

MAX_XML = 8 * 1024 * 1024  # 教案的文字不會超過這個大小；超過就不讀

# ── 遊戲這一邊的代號（要和 src/data/skeleton.ts 一致）──
OPEN = ['q-wash', 'q-intro', 'q-explain']
CC = ['q-cc', 'q-onset', 'q-location', 'q-duration', 'q-character', 'q-assoc', 'q-factors', 'q-radiate', 'q-treat', 'q-severity']
HX = ['q-pmh', 'q-family', 'q-surgery', 'q-meds', 'q-habits', 'q-work', 'q-life', 'q-concern']
ROS = ['q-ros-gen', 'q-ros-cp', 'q-ros-gi', 'q-ros-limb']
EXAMS = ['x-look', 'x-head', 'x-jvp', 'x-chest-touch', 'x-chest-listen', 'x-heart', 'x-botharms', 'x-abd', 'x-perfusion', 'x-legs']
TESTS = ['t-ecg', 't-blood', 't-cxr', 't-glucose']
LABEL = {
    'q-wash': '洗手', 'q-intro': '介紹與核對', 'q-explain': '說明流程',
    'q-cc': '怎麼不舒服', 'q-onset': '何時開始', 'q-location': '位置', 'q-duration': '持續多久', 'q-character': '性質',
    'q-assoc': '伴隨症狀', 'q-factors': '加重與緩解', 'q-radiate': '會傳到哪', 'q-treat': '處理過嗎', 'q-severity': '幾分',
    'q-pmh': '慢性病與控制', 'q-family': '家族史', 'q-surgery': '住院手術外傷', 'q-meds': '用藥與過敏', 'q-habits': '菸酒檳榔',
    'q-work': '工作與接觸史', 'q-life': '飲食睡眠壓力', 'q-concern': '擔心什麼',
    'q-ros-gen': '全身與頭頸', 'q-ros-cp': '心肺', 'q-ros-gi': '腸胃與泌尿', 'q-ros-limb': '四肢',
    'x-look': '整體外觀', 'x-head': '眼口與淋巴結', 'x-jvp': '頸靜脈與氣管', 'x-chest-touch': '胸廓與按壓', 'x-chest-listen': '叩診與聽診',
    'x-heart': '心臟聽診', 'x-botharms': '兩手血壓脈搏', 'x-abd': '腹部', 'x-perfusion': '末梢與指甲', 'x-legs': '小腿與水腫',
}

# 問句 → 代號。每一段只在自己的代號裡找；一條規則是（代號, 關鍵字），先中的先算。
RULES = {
    'open': [
        ('q-wash', ['洗手', '夾弓']),
        ('q-intro', ['名字', '姓名', '出生', '手圈']),
        ('q-explain', ['病史詢問', '身體評估', '隱私', '床簾', '回報']),
    ],
    'cc': [
        ('q-severity', ['幾分', '0到10', '0-10', '零到十', '嚴重程度', '多嚴重']),
        ('q-treat', ['看醫生', '就醫', '拿藥', '吃藥', '處理']),
        ('q-radiate', ['轉移', '傳到', '放射', '延伸']),
        ('q-factors', ['緩解', '加重', '比較好', '更嚴重', '更痛']),
        ('q-assoc', ['伴隨', '其他不舒服', '其他症狀']),
        ('q-character', ['性質', '怎麼樣的', '什麼樣的', '形容']),
        ('q-duration', ['持續', '多久一次', '頻率', '多久']),
        ('q-location', ['位置', '哪個地方', '指出', '哪一邊', '哪裡痛']),
        ('q-onset', ['什麼時候', '何時', '開始']),
        ('q-cc', ['怎麼不舒服', '哪裡不舒服', '什麼問題', '怎麼了']),
    ],
    'hx': [
        ('q-concern', ['擔心', '害怕', '期待']),
        ('q-habits', ['抽菸', '吸菸', '喝酒', '檳榔']),
        ('q-family', ['家族', '家人', '家裡']),
        ('q-pmh', ['慢性病', '過去病史', '定期', '追蹤', '控制', '健康檢查']),
        ('q-surgery', ['住院', '手術', '開刀', '外傷']),
        ('q-meds', ['過敏', '保健', '中藥', '草藥', '管制', '安眠', '止痛', '用藥', '藥物']),
        ('q-work', ['旅遊', '出國', '職業', '工作', '接觸', '禽', '鳥', '群聚', '寵物']),
        ('q-life', ['結婚', '婚姻', '伴侶', '性行為', '壓力', '飲食', '睡眠', '運動', '同住']),
    ],
    # 系統回顧：教案常常一句問兩個系統，所以中了幾題就放幾題
    'ros': [
        ('q-ros-gen', ['發燒', '體重', '疲憊', '疲倦', '盜汗', '頭痛', '頭暈', '視力', '耳鳴', '喉嚨', '吞嚥', '聲音', '脖子']),
        ('q-ros-cp', ['咳', '痰', '心悸', '心臟', '心跳', '胸悶', '端坐', '平躺', '喘醒']),
        ('q-ros-gi', ['腹瀉', '噁心', '嘔吐', '腹痛', '排便', '黑便', '血便', '尿尿', '解尿', '小便']),
        ('q-ros-limb', ['四肢', '手腳', '麻', '水腫', '關節', '肌肉', '小腿', '大腿']),
    ],
}
# 身體評估：先看落在哪個模組，再用關鍵字分到模組裡的項目。分不出來的放模組的第一項。
MODULE_EXAMS = {'頭頸': ['x-head', 'x-jvp'], '胸部': ['x-chest-touch', 'x-chest-listen'], '心臟': ['x-heart', 'x-botharms'], '腹部': ['x-abd'], '四肢': ['x-perfusion', 'x-legs']}
# 一行常常寫了好幾個部位，所以同一個模組裡中了幾項就放幾項。頸靜脈不管寫在哪個模組，都歸到 x-jvp。
EXAM_RULES = [
    ('x-jvp', ['頸靜脈', '氣管']),
    ('x-chest-listen', ['叩診', '聽診', '呼吸音', '囉音', '喘鳴', '濁音']),
    ('x-chest-touch', ['視診', '觸診', '壓痛', '胸廓']),
    ('x-botharms', ['血壓', '橈動脈', '頸動脈']),
    ('x-heart', ['心音', '心尖', '雜音']),
    ('x-legs', ['水腫', '小腿', '下肢', '足背', '雙腳']),
    ('x-perfusion', ['杵狀', '指甲', '微血管', '末梢', '發紺', '冰冷', '濕冷', '雙手']),
]
ANYWHERE = ['x-jvp']
NAME = re.compile(r'(我叫|我是)([^，。、！？\s]{2,4})(?=[，。！？\s])')
VITALS = [('bp', r'(?:血壓|BP)[^0-9]{0,6}(\d{2,3}\s*/\s*\d{2,3})'), ('hr', r'(?:心跳|脈搏|HR|PR)[^0-9]{0,6}(\d{2,3})'), ('rr', r'(?:呼吸|RR)[^0-9]{0,6}(\d{1,2})'),
          ('spo2', r'(?:血氧|SpO2|SPO2)[^0-9]{0,6}(\d{2,3})'), ('bt', r'(?:體溫|BT)[^0-9]{0,6}(\d{2}(?:\.\d)?)')]


def read_text(path: Path) -> list[str]:
    """讀出一行一行的文字。docx 只取 word/document.xml 裡的文字，不解析其他東西。"""
    if path.suffix.lower() != '.docx':
        return [ln.strip() for ln in path.read_text(encoding='utf-8').splitlines() if ln.strip()]
    with zipfile.ZipFile(path) as z:
        info = z.getinfo('word/document.xml')
        if info.file_size > MAX_XML:
            raise ValueError('檔案太大，不像一份教案：' + path.name)
        xml = z.read(info).decode('utf-8', 'replace')
    lines = []
    for para in re.split(r'</w:p>', xml):
        para = re.sub(r'<w:(?:br|cr)\b[^>]*/>', '\n', para)
        text = ''.join(html.unescape(t) for t in re.findall(r'<w:t(?:\s[^>]*)?>([^<]*)</w:t>', para))
        lines += [ln.strip() for ln in text.split('\n') if ln.strip()]
    return lines


def section_of(line: str) -> str | None:
    """這一行是不是段落的標題。"""
    if line.startswith(('NP', '病人', '【')) or len(line) > 24:
        return None
    if '開場' in line:
        return 'open'
    if 'OLD' in line.upper() or '現在病史' in line or '主訴' in line:
        return 'cc'
    if '病史' in line or '系統回顧' in line or '系統性回顧' in line:
        return 'hx'
    if '身體評估' in line or '身體檢查' in line or '理學檢查' in line:
        return 'pe'
    return None


def match(rules, text: str) -> str | None:
    for qid, words in rules:
        if any(w in text for w in words):
            return qid
    return None


def match_all(rules, text: str) -> list[str]:
    return [qid for qid, words in rules if any(w in text for w in words)]


def redact(text: str) -> str:
    """教案裡扮演專科護理師的人會報自己的名字。名字不進底稿。"""
    return NAME.sub(lambda m: m.group(0) if m.group(2).startswith(('照顧', '今天', '負責', '你的', '您的', '專科')) else m.group(1) + '（姓名）', text)


def parse(lines: list[str]) -> dict:
    """把教案拆成：標題、問答（照段落）、身體評估（照模組）、最後的計畫、生命徵象。"""
    out = {'title': lines[0] if lines else '', 'qa': [], 'pe': [], 'plan': '', 'vitals': {}, 'loose': []}
    sec, module, last = None, None, None
    for ln in lines[1:]:
        s = section_of(ln)
        if s:
            sec, module, last = s, None, None
            if s == 'open' and re.search(r'洗手', ln):   # 有的教案把洗手寫在標題上
                out['qa'].append({'sec': 'open', 'q': ln, 'a': ''})
            continue
        ln = redact(ln)
        who, _, body = ln.partition('：')
        if sec == 'pe':
            if who.strip() == '病人':
                continue
            m = re.match(r'【(.+?)模組】', ln)
            if m:
                module = m.group(1)
                ln = ln[m.end():].strip()
                if not ln:
                    continue
            if who.strip() == 'NP' and module is None:
                out['plan'] = body.strip() if '結束' in body or not out['pe'] else out['plan']
                continue
            if who.strip() == 'NP' and ('結束' in body or '計畫' in body or '安排' in body):
                out['plan'] = body.strip()
                continue
            for part in re.split(r'(?=舉牌[:：])', ln):
                part = part.strip()
                if part:
                    out['pe'].append({'module': module or '整體', 'text': part, 'abnormal': part.startswith('舉牌')})
            continue
        if who.strip() == 'NP':
            last = {'sec': sec or 'open', 'q': body.strip(), 'a': ''}
            out['qa'].append(last)
        elif who.strip() == '病人' and last is not None:
            last['a'] = (last['a'] + ' ' + body.strip()).strip()
        else:
            out['loose'].append(ln)
    joined = ' '.join(lines)
    for key, pat in VITALS:
        m = re.search(pat, joined)
        if m:
            out['vitals'][key] = m.group(1).replace(' ', '')
    return out


def assign(doc: dict) -> dict:
    """把問答和評估對到遊戲的代號。回傳 {代號: [來源...]}，和對不上的。"""
    got: dict[str, list] = {k: [] for k in OPEN + CC + HX + ROS + EXAMS}
    missed = []
    for qa in doc['qa']:
        sec = qa['sec'] if qa['sec'] in RULES else 'hx'
        qid = match(RULES[sec], qa['q'])
        ids = [qid] if qid else match_all(RULES['ros'], qa['q']) if sec == 'hx' else []
        for i in ids:
            got[i].append(qa)
        if not ids and qa['a']:   # 沒有回答的多半只是過場的話，不算對不上
            missed.append(qa)
    for pe in doc['pe']:
        ids = MODULE_EXAMS.get(pe['module'], ['x-look'])
        hit = match_all([(i, w) for i, w in EXAM_RULES if i in ids or i in ANYWHERE], pe['text'])
        if len(hit) > 1 and any(i in ANYWHERE for i in hit) and pe['module'] != '頭頸':
            hit = [i for i in hit if i in ANYWHERE or i in ids]
        for i in hit or ids[:1]:
            got[i].append(pe)
    return {'got': got, 'missed': missed}


def ts(s: str) -> str:
    return json.dumps(s, ensure_ascii=False)


def comment(prefix: str, text: str) -> str:
    return '    // ' + prefix + text.replace('\n', ' ')


def draft(doc: dict, a: dict, case_id: str, complaint: str, src: str) -> str:
    got = a['got']
    L = []
    w = L.append
    w('// ' + '=' * 70)
    w('// 底稿：由 tools/convert_script.py 從教案轉出來的，還不能用。')
    w('// 來源：' + src)
    w('// 教案標題：' + doc['title'])
    w('//')
    w('// 這份檔案裡的回答和評估結果是教案的原文，只能當底稿。')
    w('// 進專案之前，每一句都要用自己的話重寫；不要把原文 commit 或放進遊戲。')
    w('// 要補的地方都標了 TODO。全部補完、搬到 src/data/ 之後，跑 npm run cases 檢查。')
    w('// ' + '=' * 70)
    w("import type { CaseSpec } from '../core/module.ts';")
    w("import { REVIEW_NOTE } from './shared.ts';")
    w('')
    w('export const ' + case_id.upper().replace('-', '_') + ': CaseSpec = {')
    w('  format: 3,')
    w('  id: ' + ts(case_id) + ',')
    w('  complaint: ' + ts(complaint) + ',   // TODO：屬於哪個主訴模組。新的主訴要先寫模組（四個診斷、主訴那一段的問法、檢查）')
    w("  kind: '變體',   // TODO：示範／變體／遷移")
    w("  title: 'TODO 委託的標題',")
    w("  review: { state: '未審查', note: REVIEW_NOTE },")
    w("  patient: { name: 'TODO', age: 0, sex: 'TODO', job: 'TODO', look: 'lin', pronoun: '他' },   // TODO：重新設計一位病人，不要沿用教案的人物")
    w("  reading: { lines: ['TODO 閱題卡三行字'], prompts: ['最危險的可能是什麼？', '最常見的可能是什麼？', 'TODO 這一關要想的第三件事'] },")
    v = doc['vitals']
    if len(v) >= 4:
        w('  vitals: { base: { bp: %s, hr: %s, rr: %s, spo2: %s, bt: %s }, clue: { text: \'TODO 生命徵象的一句話\', kind: \'info\', key: true } },   // 從教案裡抓到的數字，要核對'
          % (ts(v.get('bp', 'TODO')), v.get('hr', 0), v.get('rr', 0), v.get('spo2', 0), v.get('bt', 0)))
    else:
        w("  vitals: { base: { bp: 'TODO', hr: 0, rr: 0, spo2: 0, bt: 0 }, clue: { text: 'TODO 生命徵象的一句話', kind: 'info', key: true } },   // 教案裡沒有寫生命徵象，要自己訂")
    w('')
    w('  // 每一題的回答。有意義的回答後面掛一條線索；要玩家解讀的線索再加 tell 和 why：')
    w("  //   clue: { text: '顯示在畫面上的短句', kind: 'pos'｜'neg'｜'info', key: true, tell: { form: '診斷代號', dir: 1 或 -1 }, why: '岑禾的一句話' }")
    w('  answers: {')
    for group, ids in (('開場', OPEN), ('主訴', CC), ('個人與過去病史', HX), ('系統回顧', ROS)):
        w('    // ── ' + group + ' ──')
        for qid in ids:
            src_qa = got[qid]
            for qa in src_qa:
                w(comment('教案問：', qa['q']))
            answer = ' ／ '.join(qa['a'] for qa in src_qa if qa['a'])
            if not src_qa:
                w("    %s: { say: 'TODO：教案沒有這一題（%s），要自己寫回答' }," % (ts(qid), LABEL[qid]))
            elif qid in OPEN:
                w('    %s: { say: %s },' % (ts(qid), ts('TODO 重寫：' + (answer or '（病人的反應）'))))
            else:
                w("    %s: { say: %s, clue: { text: 'TODO 線索', kind: 'info' } },   // TODO：要不要讓玩家解讀？指向哪個診斷？"
                  % (ts(qid), ts('TODO 重寫：' + (answer or '（教案沒有寫回答）'))))
        w('')
    w('  },')
    w('  // 每一項評估的結果。教案裡「舉牌」的異常發現放在對應的項目；沒寫到的要自己填正常的結果')
    w('  findings: {')
    for xid in EXAMS:
        src_pe = got[xid]
        abnormal = [p['text'] for p in src_pe if p['abnormal']]
        for p in src_pe:
            if not p['abnormal']:
                w(comment('教案（' + p['module'] + '）：', p['text']))
        if abnormal:
            w("    %s: { say: %s, clue: { text: 'TODO 線索', kind: 'pos', key: true } },   // TODO：異常發現，多半要讓玩家解讀" % (ts(xid), ts('TODO 重寫：' + ' ／ '.join(abnormal))))
        else:
            w("    %s: { say: 'TODO：%s的結果（教案沒有寫異常）', clue: { text: 'TODO 線索', kind: 'neg' } }," % (ts(xid), LABEL[xid]))
    w('  },')
    w('  // 檢查的結果。教案最後的計畫：' + (doc['plan'] or '（沒有找到）'))
    w('  results: {')
    for tid in TESTS:
        w("    %s: { say: 'TODO 結果的文字（要註明是訓練用的文字結果，由醫師判讀）', clue: { text: 'TODO 線索', kind: 'neg' } },   // 這一關等不到結果的，改成 { pending: '說明' }" % ts(tid))
    w('  },')
    w('')
    w('  // ── 以下是推理的部分，轉換工具不會幫你寫 ──')
    w("  answer: { truth: 'TODO 診斷代號', exclude: { 'TODO 要排除的診斷': 2 } },")
    w('  summaries: [   // 四句問題摘要：一句完整的（5 分）、一句少了關鍵的（3 分）、一句太模糊的、一句太早下結論的（0 分）')
    w("    { id: 's-best', text: 'TODO', score: 5, note: 'TODO 為什麼好' },")
    w("    { id: 's-ok', text: 'TODO', score: 3, note: 'TODO 少了什麼' },")
    w("    { id: 's-vague', text: 'TODO', score: 0, note: 'TODO' },")
    w("    { id: 's-anchor', text: 'TODO', score: 0, note: 'TODO' },")
    w('  ],')
    w('  sbar: {')
    w("    assessments: [{ id: 'a-best', text: 'TODO', score: 2, note: 'TODO' }, { id: 'a-unknown', text: 'TODO', score: 1, note: 'TODO' }, { id: 'a-wrong', text: 'TODO', score: 0, note: 'TODO' }],")
    w("    requests: [{ id: 'r-1', text: 'TODO', ok: true, note: 'TODO' }, { id: 'r-2', text: 'TODO', ok: true, note: 'TODO' }, { id: 'r-bad', text: 'TODO', ok: false, note: 'TODO' }],   // 選了等於提出某項檢查的，加 orders: 't-...'")
    w('  },')
    w('  explain: [   // 至少三句適合的、一句回應病人擔心的（concern）、兩句不適合的')
    w("    { id: 'e-why', text: 'TODO', ok: true, note: 'TODO' },")
    w("    { id: 'e-plan', text: 'TODO', ok: true, note: 'TODO' },")
    w("    { id: 'e-warn', text: 'TODO 什麼情況要馬上回來', ok: true, note: 'TODO' },")
    w("    { id: 'e-concern', text: 'TODO', ok: true, concern: true, needsClue: 'c-concern', note: 'TODO' },")
    w("    { id: 'e-false', text: 'TODO 沒有根據的保證', ok: false, note: 'TODO' },")
    w("    { id: 'e-jargon', text: 'TODO 病人聽不懂、或搶著說診斷', ok: false, note: 'TODO' },")
    w('  ],')
    w('  timeline: { doctorDelay: 90 },   // 會變差的病人加 worsenAfter、stepInAfter（從下診斷算起的秒數）')
    w("  safety: [{ type: 'order', test: 'TODO t-...', within: 300, points: 3 }, { type: 'exclude', forms: ['TODO'], points: 3 }, { type: 'explain', id: 'e-warn', points: 2 }, { type: 'calm', points: 1 }],   // 加起來要 9 分")
    w('  readsNeeded: 6,')
    w('  lines: {')
    for key in ('watch', 'called', 'doctorArrives', 'reportGood', 'reportWeak', 'explainOk', 'explainConcern', 'explainBad', 'closing', 'hintNoExplain'):
        w("    %s: 'TODO'," % key)
    w("    opening: ['TODO 岑禾進門的第一句話'],")
    w('  },')
    w("  debrief: { alternatives: ['TODO 其他也可以的做法'], teaching: [{ text: 'TODO 教學重點', ref: 'TODO' }], references: [] },   // 每一條重點都要對到一篇查過的文獻")
    w('};')
    if a['missed']:
        w('')
        w('// ── 對不上遊戲代號的問句（看要併到哪一題，或是這個主訴需要新的題目）──')
        for qa in a['missed']:
            w('// [' + qa['sec'] + '] 問：' + qa['q'])
            if qa['a']:
                w('//        答：' + qa['a'])
    return '\n'.join(L) + '\n'


def report(doc: dict, a: dict) -> str:
    got = a['got']
    empty = [LABEL[k] for k in OPEN + CC + HX + ROS if not got[k]]
    abnormal = sum(1 for p in doc['pe'] if p['abnormal'])
    return ('問答 %d 組，對上 %d 組，對不上 %d 組；評估 %d 行（異常 %d 項）；沒有來源的題目：%s'
            % (len(doc['qa']), len(doc['qa']) - len(a['missed']), len(a['missed']), len(doc['pe']), abnormal, '、'.join(empty) or '無'))


def main() -> int:
    ap = argparse.ArgumentParser(description='把一份 OSCE 教案轉成遊戲病例的底稿')
    ap.add_argument('source', help='教案檔（.docx 或 .txt），或是放教案的資料夾')
    ap.add_argument('--id', help='病例代號，例如 c02a（預設用檔名）')
    ap.add_argument('--complaint', default='chest-pain', help='主訴模組的代號（預設 chest-pain）')
    ap.add_argument('--out', default='drafts', help='底稿要寫到哪個資料夾（預設 drafts/，不進版本控制）')
    ap.add_argument('--report', action='store_true', help='只印對照的結果，不寫檔')
    args = ap.parse_args()

    src = Path(args.source)
    files = sorted(p for p in src.iterdir() if p.suffix.lower() in ('.docx', '.txt')) if src.is_dir() else [src]
    if not files:
        print('找不到教案檔', file=sys.stderr)
        return 1
    out_dir = Path(args.out)
    for i, f in enumerate(files, 1):
        doc = parse(read_text(f))
        a = assign(doc)
        case_id = args.id if args.id and len(files) == 1 else 'draft-%02d' % i
        print('%s\n    %s' % (f.name, report(doc, a)))
        if args.report:
            continue
        out_dir.mkdir(parents=True, exist_ok=True)
        target = out_dir / (case_id + '.draft.ts')
        target.write_text(draft(doc, a, case_id, args.complaint, f.name), encoding='utf-8')
        print('    → ' + str(target))
    return 0


if __name__ == '__main__':
    sys.exit(main())
