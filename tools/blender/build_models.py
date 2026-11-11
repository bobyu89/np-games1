#!/usr/bin/env python3
"""
《黃金一小時》3D 模型產生器：用 Blender Python 程序化建模，匯出成一個 GLB。

執行方式（二選一）：
  blender --background --python tools/blender/build_models.py -- --out prototypes/sepsis-3d/assets/models.glb
  python tools/blender/build_models.py --out prototypes/sepsis-3d/assets/models.glb     # 需要 pip install bpy

加 --blend models.blend 可以另存 .blend，在 Blender 裡手動修模型。
手修後只要節點名稱不變（unit_<id>、<id>__head、<id>__hand_R…），重新匯出就能直接替換。

風格：低多邊形公仔（大頭、浮空手套手、手持物辨識職類），顏色寫在頂點色，一個共用材質。
座標：Blender Z 朝上、角色面向 −Y；匯出時轉成 glTF 的 Y 朝上（角色面向 +Z）。
所有造型都是原創的職類原型，不對應真實人物，也不取自任何現有遊戲。
"""
import argparse
import json
import math
import os
import struct
import sys
import warnings

import bpy  # 一定要先 import bpy，bmesh 和 mathutils 才找得到
import bmesh
from mathutils import Euler, Matrix, Vector

PI = math.pi


# ───────────────────────── 顏色 ─────────────────────────
def _lin(c):
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def hexcol(h):
    h = h.lstrip('#')
    return tuple(_lin(int(h[i:i + 2], 16) / 255) for i in (0, 2, 4)) + (1.0,)


P = {k: hexcol(v) for k, v in {
    # 膚色、頭髮、臉
    'skin1': '#f7d6ba', 'skin2': '#e8b790', 'skin3': '#c48d63', 'skin4': '#94613f',
    'hair_black': '#22252b', 'hair_brown': '#6b4630', 'hair_dbrown': '#3d2b21',
    'hair_grey': '#b4b9bf', 'hair_auburn': '#8f4324',
    'eye': '#14171b', 'white': '#ffffff', 'blush': '#f29aa3', 'mouth': '#a34d52',
    # 服裝
    'teal': '#2bb3a6', 'teal_d': '#1f8a80', 'sky': '#58a8ea', 'sky_d': '#3d82c0',
    'lav': '#a99bea', 'lav_d': '#7f71c4', 'mint': '#8fd6b4', 'slate': '#4a5663',
    'blue': '#4f86d9', 'blue_d': '#3a66ad', 'indigo': '#6a63d6', 'indigo_d': '#4b46a3',
    'rose': '#e2578f', 'rose_d': '#b53d6e', 'plum': '#a063c9', 'plum_d': '#7a479c',
    'shirt': '#9cc4ee', 'tie': '#c9413b', 'surg': '#35a783', 'surg_d': '#267a60',
    'coat': '#f6f9fa', 'coat_s': '#dbe4e9', 'gown_y': '#f4d35a', 'gown_y_d': '#d4ae2f',
    'mask': '#a9d8ee', 'shoe_w': '#f1f3f4', 'shoe_d': '#2c333b',
    # 器材
    'metal': '#cdd5da', 'metal_d': '#5d6770', 'dark': '#262c33', 'glass': '#d7ecf5',
    'purple': '#8b5fd0', 'cap_grey': '#9aa3ad', 'amber': '#d98a2b', 'cap_blue': '#3b7fd4',
    'cap_purple': '#8a4fc0', 'orange': '#f08a3c', 'ivblue': '#bfe3f4', 'yellowliq': '#f2dc7a',
    'ambu': '#3f8fd6', 'board': '#a8794c', 'paper': '#fbfbf6', 'pump': '#e4e9ec',
    'screen': '#7fd0f0', 'red': '#d94a43', 'red_d': '#a8322d',
    # 敵人
    'germ': '#8fd43a', 'germ_d': '#5fa01f', 'germ_l': '#c6ef7d',
    'dial': '#fbf4e2', 'dial_rim': '#b6322d', 'dial_low': '#5a8fd9', 'needle': '#e23b33',
    'lac': '#9a6be0', 'lac_d': '#6e45b5', 'lac_l': '#c9a9f5',
    'mods': '#3a3350', 'mods_d': '#262138', 'lung': '#f0a3b4', 'kidney': '#b3523f',
    'liver': '#8c3a33', 'heart': '#d83a45', 'brain': '#e7b7c6', 'sick': '#4a4458',
    # 場景
    'tile_rim': '#ffffff', 'tile_in': '#cfd5d9',
    'bed': '#dfe5e9', 'bed_d': '#9aa5ae', 'sheet': '#f7fafb', 'blanket': '#7fb2e6',
    'blanket_l': '#b6d3f2', 'o2': '#9fe0cf', 'gas_g': '#3fae5f', 'gas_y': '#e9c63b',
}.items()}

MATS = {}
COLL = None


def make_materials():
    def base(name):
        m = bpy.data.materials.new(name)
        with warnings.catch_warnings():
            warnings.simplefilter('ignore')
            m.use_nodes = True
        m.use_backface_culling = True
        nt = m.node_tree
        bsdf = next(n for n in nt.nodes if n.type == 'BSDF_PRINCIPLED')
        return m, nt, bsdf

    m, nt, bsdf = base('clay')
    vc = nt.nodes.new('ShaderNodeVertexColor')
    vc.layer_name = 'Col'
    nt.links.new(vc.outputs['Color'], bsdf.inputs['Base Color'])
    bsdf.inputs['Roughness'].default_value = 0.62
    bsdf.inputs['Metallic'].default_value = 0.0
    MATS['clay'] = m

    for name, hexv, strength in (('glow_red', '#ff5a3c', 2.0), ('glow_green', '#5dff9a', 1.6),
                                 ('glow_cyan', '#6fe3ff', 1.6), ('glow_violet', '#c79bff', 1.4)):
        m, nt, bsdf = base(name)
        c = hexcol(hexv)
        bsdf.inputs['Base Color'].default_value = (c[0] * 0.25, c[1] * 0.25, c[2] * 0.25, 1)
        bsdf.inputs['Roughness'].default_value = 0.4
        bsdf.inputs['Emission Color'].default_value = c
        bsdf.inputs['Emission Strength'].default_value = strength
        MATS[name] = m


# ───────────────────────── 建模工具 ─────────────────────────
class Part:
    """一個可動部位：把多個基本形狀放進同一個 mesh，顏色寫在頂點色。"""

    def __init__(self):
        self.bm = bmesh.new()
        self.col = self.bm.loops.layers.float_color.new('Col')
        self.slots = []

    def _M(self, loc, rot, scale):
        return Matrix.Translation(loc) @ Euler(rot).to_matrix().to_4x4() @ Matrix.Diagonal((*scale, 1.0))

    def _finish(self, before, color, smooth, mat):
        if mat not in self.slots:
            self.slots.append(mat)
        si = self.slots.index(mat)
        rgba = P[color] if isinstance(color, str) else color
        new = [f for f in self.bm.faces if f not in before]
        for f in new:
            f.smooth = smooth
            f.material_index = si
            for loop in f.loops:
                loop[self.col] = rgba
        return new

    def _cut(self, verts, co, no):
        """只切這次新增的形狀：保留法線指向的那一側。"""
        vs = set(verts)
        geom = list(vs)
        geom += [e for e in self.bm.edges if e.verts[0] in vs and e.verts[1] in vs]
        geom += [f for f in self.bm.faces if all(v in vs for v in f.verts)]
        bmesh.ops.bisect_plane(self.bm, geom=geom, dist=1e-5, plane_co=Vector(co),
                               plane_no=Vector(no).normalized(), clear_inner=True, clear_outer=False)

    def sphere(self, color, loc, r=1.0, scale=(1, 1, 1), rot=(0, 0, 0), seg=14, rings=9,
               smooth=True, mat='clay', cut=None):
        before = set(self.bm.faces)
        ret = bmesh.ops.create_uvsphere(self.bm, u_segments=seg, v_segments=rings, radius=r,
                                        matrix=self._M(loc, rot, scale), calc_uvs=False)
        if cut:
            self._cut(ret['verts'], *cut)
        return self._finish(before, color, smooth, mat)

    def ico(self, color, loc, r=1.0, scale=(1, 1, 1), rot=(0, 0, 0), sub=2, smooth=False, mat='clay'):
        before = set(self.bm.faces)
        bmesh.ops.create_icosphere(self.bm, subdivisions=sub, radius=r,
                                   matrix=self._M(loc, rot, scale), calc_uvs=False)
        return self._finish(before, color, smooth, mat)

    def cone(self, color, loc, r1, r2, h, rot=(0, 0, 0), seg=12, smooth=True, mat='clay', caps=True):
        before = set(self.bm.faces)
        bmesh.ops.create_cone(self.bm, cap_ends=caps, cap_tris=False, segments=seg, radius1=r1,
                              radius2=r2, depth=h, matrix=self._M(loc, rot, (1, 1, 1)), calc_uvs=False)
        return self._finish(before, color, smooth, mat)

    def box(self, color, loc, size, rot=(0, 0, 0), bevel=0.0, bseg=2, smooth=False, mat='clay'):
        before = set(self.bm.faces)
        ret = bmesh.ops.create_cube(self.bm, size=1.0, matrix=self._M(loc, rot, size), calc_uvs=False)
        if bevel > 0:
            vs = set(ret['verts'])
            edges = [e for e in self.bm.edges if e.verts[0] in vs and e.verts[1] in vs]
            bmesh.ops.bevel(self.bm, geom=edges, offset=bevel, offset_type='OFFSET', segments=bseg,
                            profile=0.5, affect='EDGES', clamp_overlap=True)
        return self._finish(before, color, smooth, mat)

    def torus(self, color, loc, R, r, rot=(0, 0, 0), seg=18, tube=6, arc=1.0, smooth=True, mat='clay'):
        bm = self.bm
        before = set(bm.faces)
        M = self._M(loc, rot, (1, 1, 1))
        full = arc >= 0.999
        n = seg if full else max(3, int(round(seg * arc)) + 1)
        rings = []
        for i in range(n):
            a = 2 * PI * (i / seg if full else arc * i / (n - 1))
            ring = []
            for j in range(tube):
                b = 2 * PI * j / tube
                co = Vector(((R + r * math.cos(b)) * math.cos(a), (R + r * math.cos(b)) * math.sin(a), r * math.sin(b)))
                ring.append(bm.verts.new(M @ co))
            rings.append(ring)
        for i in range(n if full else n - 1):
            a, b = rings[i], rings[(i + 1) % n]
            for j in range(tube):
                k = (j + 1) % tube
                bm.faces.new((a[j], b[j], b[k], a[k]))
        new = [f for f in bm.faces if f not in before]
        bmesh.ops.recalc_face_normals(bm, faces=new)
        return self._finish(before, color, smooth, mat)

    def build(self, name, parent, pivot=(0, 0, 0)):
        bm = self.bm
        bmesh.ops.translate(bm, verts=bm.verts[:], vec=-Vector(pivot))
        bm.normal_update()
        me = bpy.data.meshes.new(name)
        bm.to_mesh(me)
        bm.free()
        for m in self.slots:
            me.materials.append(MATS[m])
        try:
            me.set_sharp_from_angle(angle=math.radians(50))
        except Exception:
            pass
        ob = bpy.data.objects.new(name, me)
        COLL.objects.link(ob)
        ob.parent = parent
        ob.location = pivot
        return ob


def empty(name, at=(0, 0, 0), parent=None):
    ob = bpy.data.objects.new(name, None)
    ob.empty_display_size = 0.2
    COLL.objects.link(ob)
    ob.location = at
    ob.parent = parent
    return ob


# ───────────────────────── 醫療團隊 ─────────────────────────
HEAD = (0.0, 0.0, 1.42)
HAND_R = (0.52, -0.08, 0.74)
HAND_L = (-0.52, -0.08, 0.74)


def add_hair(h, style, color):
    x, y, z = HEAD
    short = ((0, -0.30, 1.56), (0, 0.55, 1.0))
    if style == 'buzz':
        h.sphere(color, (x, y + 0.01, z + 0.01), r=0.478, scale=(1, 0.96, 0.95), seg=18, rings=12,
                 cut=((0, -0.30, 1.63), (0, 0.45, 1.0)))
        return
    if style == 'cap':  # 手術帽
        h.sphere(color, (x, y + 0.02, z + 0.05), r=0.51, scale=(1.0, 0.98, 1.0), seg=18, rings=12,
                 cut=((0, -0.30, 1.65), (0, 0.32, 1.0)))
        h.torus(color, (x, y + 0.02, 1.565), 0.475, 0.035, rot=(-0.31, 0, 0), seg=20, tube=6)
        return
    if style == 'bob':
        h.sphere(color, (x, y + 0.03, z + 0.03), r=0.515, scale=(1.02, 1.0, 0.98), seg=18, rings=12,
                 cut=((0, -0.30, 1.55), (0, 0.78, 1.0)))
        for sx in (-1, 1):
            h.sphere(color, (sx * 0.40, 0.04, 1.20), r=1, scale=(0.14, 0.22, 0.24), seg=10, rings=7)
        return
    h.sphere(color, (x, y + 0.03, z + 0.03), r=0.50, scale=(1.0, 1.0, 0.97), seg=18, rings=12, cut=short)
    if style == 'bun':
        h.sphere(color, (0, 0.20, 1.95), r=0.17, seg=12, rings=8)
    elif style == 'pony':
        h.sphere(color, (0, 0.50, 1.62), r=0.09, seg=10, rings=6)
        h.sphere(color, (0, 0.60, 1.34), r=1, scale=(0.12, 0.13, 0.30), rot=(-0.25, 0, 0), seg=10, rings=7)
    elif style == 'side':
        h.sphere(color, (0.16, -0.36, 1.71), r=1, scale=(0.27, 0.15, 0.10), rot=(0.1, 0.25, 0), seg=10, rings=6)
    elif style == 'messy':
        for sx, sy, a in ((-0.14, -0.05, -0.4), (0.05, 0.02, 0.1), (0.2, -0.08, 0.5)):
            h.cone(color, (sx, sy, 1.95), 0.10, 0.0, 0.2, rot=(0.2, a, 0), seg=6)
        h.sphere(color, (-0.12, -0.38, 1.70), r=1, scale=(0.2, 0.13, 0.09), rot=(0.1, -0.2, 0), seg=10, rings=6)


def add_face(h, skin, *, glasses=False, mask=False):
    x, y, z = HEAD
    h.sphere(skin, HEAD, r=0.46, scale=(1, 0.95, 0.94), seg=20, rings=14)
    for sx in (-1, 1):
        h.sphere(skin, (sx * 0.45, 0.0, 1.40), r=0.085, seg=8, rings=6)                      # 耳朵
        h.sphere('eye', (sx * 0.165, -0.415, 1.43), r=1, scale=(0.058, 0.035, 0.082), seg=10, rings=7)
        h.sphere('white', (sx * 0.165 - 0.02, -0.447, 1.468), r=0.02, seg=6, rings=4)         # 眼睛反光
        if not mask:
            h.sphere('blush', (sx * 0.275, -0.368, 1.30), r=1, scale=(0.07, 0.025, 0.045), seg=8, rings=5)
    if mask:
        h.sphere('mask', (0, -0.27, 1.25), r=1, scale=(0.34, 0.22, 0.17), seg=14, rings=8)
        for sx in (-1, 1):
            h.box('mask', (sx * 0.40, -0.12, 1.30), (0.02, 0.34, 0.03), rot=(0.25, 0, 0))
    else:
        h.sphere('mouth', (0, -0.432, 1.27), r=1, scale=(0.055, 0.02, 0.022), seg=8, rings=5)
    if glasses:
        for sx in (-1, 1):
            h.torus('dark', (sx * 0.165, -0.447, 1.43), 0.105, 0.016, rot=(PI / 2, 0, 0), seg=14, tube=5)
            h.box('dark', (sx * 0.36, -0.25, 1.44), (0.02, 0.4, 0.02))
        h.box('dark', (0, -0.455, 1.44), (0.1, 0.02, 0.02))


def prop_tube(p):  # 乳酸檢體管（灰蓋）
    x, y, z = HAND_R
    p.cone('purple', (x, y - 0.03, z + 0.17), 0.05, 0.05, 0.14, seg=10)
    p.sphere('purple', (x, y - 0.03, z + 0.10), r=0.05, seg=10, rings=6)
    p.cone('glass', (x, y - 0.03, z + 0.29), 0.05, 0.05, 0.10, seg=10)
    p.cone('cap_grey', (x, y - 0.03, z + 0.365), 0.06, 0.06, 0.05, seg=10)


def prop_ivbag(p):  # 輸液袋
    x, y, z = HAND_R
    p.box('ivblue', (x, y - 0.03, z + 0.33), (0.25, 0.09, 0.34), bevel=0.04, bseg=2, smooth=True)
    p.box('paper', (x, y - 0.08, z + 0.35), (0.15, 0.01, 0.12))
    p.cone('metal', (x, y - 0.03, z + 0.13), 0.022, 0.022, 0.08, seg=8)
    p.torus('metal_d', (x, y - 0.03, z + 0.53), 0.04, 0.012, rot=(PI / 2, 0, 0), seg=10, tube=5)


def prop_culture(p):  # 血液培養瓶兩支（需氧＋厭氧）
    x, y, z = HAND_R
    for dx, cap in ((-0.07, 'cap_blue'), (0.09, 'cap_purple')):
        p.cone('amber', (x + dx, y - 0.04, z + 0.16), 0.07, 0.07, 0.17, seg=10)
        p.cone('amber', (x + dx, y - 0.04, z + 0.265), 0.07, 0.042, 0.04, seg=10)
        p.cone('glass', (x + dx, y - 0.04, z + 0.30), 0.042, 0.042, 0.04, seg=10)
        p.cone(cap, (x + dx, y - 0.04, z + 0.335), 0.052, 0.052, 0.035, seg=10)
        p.box('paper', (x + dx, y - 0.108, z + 0.16), (0.08, 0.01, 0.09))


def prop_pills(p):  # 藥罐
    x, y, z = HAND_R
    p.cone('orange', (x, y - 0.03, z + 0.17), 0.075, 0.075, 0.17, seg=12)
    p.cone('paper', (x, y - 0.03, z + 0.17), 0.078, 0.078, 0.08, seg=12)
    p.cone('white', (x, y - 0.03, z + 0.275), 0.082, 0.082, 0.05, seg=12)


def prop_syringe(p):  # 抗生素針筒
    x, y, z = HAND_R
    r = (0.0, -0.5, 0.0)
    M = Matrix.Translation((x, y - 0.04, z + 0.14)) @ Euler(r).to_matrix().to_4x4()

    def at(dz):
        v = M @ Vector((0, 0, dz))
        return (v.x, v.y, v.z)

    p.cone('glass', at(0.10), 0.045, 0.045, 0.22, rot=r, seg=10)
    p.cone('yellowliq', at(0.07), 0.047, 0.047, 0.12, rot=r, seg=10)
    p.cone('metal', at(0.235), 0.012, 0.004, 0.11, rot=r, seg=6)
    p.cone('white', at(-0.02), 0.07, 0.07, 0.015, rot=r, seg=10)
    p.cone('white', at(-0.075), 0.016, 0.016, 0.11, rot=r, seg=6)
    p.cone('white', at(-0.135), 0.05, 0.05, 0.015, rot=r, seg=10)


def prop_ambu(p):  # 甦醒球
    x, y, z = HAND_R
    p.sphere('ambu', (x, y - 0.10, z + 0.14), r=1, scale=(0.11, 0.17, 0.11), seg=12, rings=8)
    p.cone('glass', (x, y - 0.31, z + 0.14), 0.09, 0.04, 0.10, rot=(PI / 2, 0, 0), seg=10)
    p.cone('metal', (x, y + 0.08, z + 0.14), 0.035, 0.035, 0.05, rot=(PI / 2, 0, 0), seg=8)
    p.sphere('glass', (x, y + 0.19, z + 0.14), r=1, scale=(0.07, 0.10, 0.07), seg=8, rings=6)


def prop_clipboard(p):  # 板夾
    x, y, z = HAND_R
    rot = (-0.35, 0, 0.12)
    p.box('board', (x - 0.02, y - 0.07, z + 0.16), (0.24, 0.025, 0.32), rot=rot)
    p.box('paper', (x - 0.02, y - 0.088, z + 0.15), (0.20, 0.012, 0.26), rot=rot)
    p.box('metal', (x - 0.02, y - 0.06, z + 0.305), (0.10, 0.03, 0.035), rot=rot)
    for i in range(3):
        p.box('metal_d', (x - 0.03, y - 0.105 + i * 0.022, z + 0.21 - i * 0.06), (0.13, 0.006, 0.012), rot=rot)


def prop_pump(p):  # 輸液幫浦（升壓劑滴定）
    x, y, z = HAND_R
    p.box('pump', (x, y - 0.06, z + 0.17), (0.26, 0.14, 0.2), bevel=0.025)
    p.box('dark', (x - 0.03, y - 0.135, z + 0.19), (0.15, 0.012, 0.09))
    p.box('white', (x - 0.03, y - 0.143, z + 0.19), (0.12, 0.006, 0.06), mat='glow_green')
    for i in range(3):
        p.cone('red' if i == 0 else 'metal_d', (x + 0.09, y - 0.135, z + 0.23 - i * 0.045), 0.014, 0.014, 0.012,
               rot=(PI / 2, 0, 0), seg=8)
    p.cone('red', (x - 0.05, y - 0.06, z + 0.29), 0.022, 0.022, 0.05, seg=8)


def prop_tablet(p):  # 平板
    x, y, z = HAND_R
    rot = (-0.4, 0, 0.1)
    p.box('dark', (x - 0.02, y - 0.07, z + 0.17), (0.24, 0.022, 0.32), rot=rot, bevel=0.01)
    p.box('white', (x - 0.02, y - 0.084, z + 0.165), (0.20, 0.008, 0.27), rot=rot, mat='glow_cyan')


def prop_scalpel(p):  # 手術刀
    x, y, z = HAND_R
    p.box('metal_d', (x, y - 0.03, z + 0.14), (0.028, 0.028, 0.22))
    p.box('metal', (x, y - 0.03, z + 0.31), (0.012, 0.06, 0.14), rot=(0.25, 0, 0))


PROPS = {'tube': prop_tube, 'ivbag': prop_ivbag, 'culture': prop_culture, 'pills': prop_pills,
         'syringe': prop_syringe, 'ambu': prop_ambu, 'clipboard': prop_clipboard, 'pump': prop_pump,
         'tablet': prop_tablet, 'scalpel': prop_scalpel}

STAFF = [
    dict(id='rn_lactate', skin='skin1', hair='hair_black', style='bun', top='teal', pants='teal_d', prop='tube'),
    dict(id='rn_fluid', skin='skin2', hair='hair_brown', style='short', top='sky', pants='sky_d', prop='ivbag'),
    dict(id='ipc_culture', skin='skin1', hair='hair_dbrown', style='bob', top='lav', pants='lav_d',
         coat='gown_y', prop='culture'),
    dict(id='pharmacist', skin='skin3', hair='hair_black', style='side', top='mint', pants='slate',
         coat='coat', prop='pills'),
    dict(id='resident', skin='skin2', hair='hair_dbrown', style='messy', top='blue', pants='blue_d',
         coat='coat_short', prop='syringe', steth=True),
    dict(id='rt', skin='skin4', hair='hair_black', style='buzz', top='indigo', pants='indigo_d', prop='ambu'),
    dict(id='np', skin='skin1', hair='hair_auburn', style='pony', top='rose', pants='rose_d',
         prop='clipboard', steth=True),
    dict(id='senior_rn', skin='skin2', hair='hair_grey', style='bun', top='plum', pants='plum_d', prop='pump'),
    dict(id='attending', skin='skin3', hair='hair_grey', style='side', top='shirt', pants='slate',
         coat='coat_long', prop='tablet', glasses=True, tie=True),
    dict(id='surgeon', skin='skin2', hair='surg', style='cap', top='surg', pants='surg_d',
         coat='gown_g', prop='scalpel', mask=True),
]


def build_staff(spec, at):
    uid = spec['id']
    root = empty('unit_' + uid, at)
    skin, top, pants = spec['skin'], spec['top'], spec['pants']
    coat = spec.get('coat')
    sleeve = {'coat': 'coat', 'coat_short': 'coat', 'coat_long': 'coat', 'gown_y': 'gown_y', 'gown_g': 'surg'}.get(coat, top)

    b = Part()
    for sx in (-1, 1):
        b.sphere('shoe_w' if not spec.get('tie') else 'shoe_d', (sx * 0.17, -0.05, 0.085), r=1,
                 scale=(0.135, 0.195, 0.085), seg=10, rings=6)
        b.cone(pants, (sx * 0.17, 0.0, 0.27), 0.125, 0.115, 0.30, seg=10)
        b.sphere(sleeve, (sx * 0.355, 0.0, 0.87), r=0.145, seg=10, rings=7)
    b.sphere(top, (0, 0, 0.70), r=1, scale=(0.36, 0.30, 0.40), seg=16, rings=10)
    b.cone(skin, (0, 0, 1.02), 0.11, 0.11, 0.14, seg=10)
    if coat in ('coat', 'coat_long', 'coat_short'):
        h = {'coat': 0.66, 'coat_long': 0.74, 'coat_short': 0.50}[coat]
        zc = 0.93 - h / 2
        b.cone('coat', (0, 0, zc), 0.34 + h * 0.19, 0.30, h, seg=16, caps=False)
        b.cone('coat', (0, 0, 0.93), 0.30, 0.20, 0.07, seg=16)
        b.box(top, (0, -0.335, 0.74), (0.13, 0.05, 0.30))                       # 敞開的前襟
        for sx in (-1, 1):
            b.box('coat_s', (sx * 0.105, -0.345, 0.84), (0.09, 0.03, 0.17), rot=(0, sx * 0.5, 0))
        if spec.get('tie'):
            b.box('tie', (0, -0.365, 0.74), (0.05, 0.02, 0.24))
            b.box('tie', (0, -0.368, 0.87), (0.07, 0.025, 0.05))
    elif coat in ('gown_y', 'gown_g'):
        col = 'gown_y' if coat == 'gown_y' else 'surg'
        dark = 'gown_y_d' if coat == 'gown_y' else 'surg_d'
        b.cone(col, (0, 0, 0.555), 0.47, 0.30, 0.75, seg=16, caps=False)
        b.cone(col, (0, 0, 0.93), 0.30, 0.20, 0.07, seg=16)
        b.torus(dark, (0, 0, 0.97), 0.17, 0.035, seg=14, tube=6)
        b.torus(dark, (0, 0, 0.62), 0.385, 0.022, seg=18, tube=5)
    else:
        b.box('white', (0.17, -0.292, 0.80), (0.10, 0.02, 0.12), rot=(0.12, 0, 0))   # 識別證
        b.box(pants, (0.17, -0.303, 0.835), (0.10, 0.012, 0.03), rot=(0.12, 0, 0))
        b.box(pants, (-0.15, -0.262, 0.62), (0.14, 0.02, 0.12), rot=(-0.12, 0, 0))   # 口袋
    if spec.get('steth'):
        b.torus('dark', (0, -0.02, 1.0), 0.20, 0.024, rot=(-0.5, 0, 0), seg=16, tube=5)
        b.cone('dark', (0.11, -0.30, 0.82), 0.02, 0.02, 0.24, rot=(-0.2, 0, 0), seg=6)
        b.cone('metal', (0.11, -0.345, 0.69), 0.05, 0.05, 0.03, rot=(PI / 2, 0, 0), seg=10)
    b.build(uid + '__body', root)

    h = Part()
    add_face(h, skin, glasses=spec.get('glasses', False), mask=spec.get('mask', False))
    add_hair(h, spec['style'], spec['hair'])
    h.build(uid + '__head', root, pivot=(0, 0, 1.0))

    hl = Part()
    hl.sphere(skin, HAND_L, r=0.115, seg=10, rings=7)
    hl.build(uid + '__hand_L', root, pivot=HAND_L)

    hr = Part()
    hr.sphere(skin, HAND_R, r=0.115, seg=10, rings=7)
    PROPS[spec['prop']](hr)
    hr.build(uid + '__hand_R', root, pivot=HAND_R)
    return root


# ───────────────────────── 敵人（病理過程） ─────────────────────────
def angry_eyes(p, y, z, dx=0.15, s=1.0, brow='eye'):
    for sx in (-1, 1):
        p.sphere('white', (sx * dx, y, z), r=1, scale=(0.085 * s, 0.05 * s, 0.10 * s), seg=10, rings=7)
        p.sphere('eye', (sx * dx * 0.93, y - 0.035 * s, z - 0.01), r=0.045 * s, seg=8, rings=6)
        p.box(brow, (sx * dx, y - 0.03 * s, z + 0.105 * s), (0.17 * s, 0.03, 0.035 * s), rot=(0, sx * 0.45, 0))


def build_pathogen(at):
    root = empty('enemy_pathogen', at)
    c = (0, 0, 0.62)
    p = Part()
    p.ico('germ', c, r=0.42, sub=2, smooth=True)
    dirs = []
    for i in range(12):                      # 12 根刺，均勻分佈
        t = math.acos(1 - 2 * (i + 0.5) / 12)
        ph = PI * (1 + 5 ** 0.5) * i
        dirs.append(Vector((math.sin(t) * math.cos(ph), math.sin(t) * math.sin(ph), math.cos(t))))
    for d in dirs:
        if d.y < -0.55 and abs(d.z) < 0.6:   # 正面留給臉
            continue
        q = Vector((0, 0, 1)).rotation_difference(d).to_euler()
        pos = Vector(c) + d * 0.50
        p.cone('germ_d', pos, 0.085, 0.0, 0.26, rot=tuple(q), seg=6)
        p.sphere('germ_l', Vector(c) + d * 0.64, r=0.035, seg=6, rings=4)
    angry_eyes(p, -0.37, 0.70, dx=0.15)
    p.box('eye', (0, -0.405, 0.50), (0.17, 0.03, 0.035))
    for sx in (-1, 1):
        p.cone('white', (sx * 0.05, -0.41, 0.47), 0.022, 0.0, 0.05, rot=(PI, 0, 0), seg=4)
    p.build('enemy_pathogen__body', root, pivot=(0, 0, 0))
    for i, (bx, by, bz, r) in enumerate(((0.52, 0.12, 0.30, 0.16), (-0.5, 0.2, 0.36, 0.13))):
        s = Part()
        s.ico('germ_l' if i else 'germ', (bx, by, bz), r=r, sub=1, smooth=True)
        for sx in (-1, 1):
            s.sphere('eye', (bx + sx * r * 0.35, by - r * 0.85, bz + r * 0.15), r=r * 0.14, seg=6, rings=4)
        s.build('enemy_pathogen__bud_%d' % (i + 1), root, pivot=(bx, by, bz))
    return root


def build_hypotension(at):
    """血壓計造型：指針垂在低的那一側。"""
    root = empty('enemy_hypotension', at)
    c = (0, 0, 0.72)
    p = Part()
    rx = (PI / 2, 0, 0)
    p.cone('dial_rim', c, 0.52, 0.52, 0.24, rot=rx, seg=22)
    p.cone('dial', (0, -0.125, 0.72), 0.44, 0.44, 0.02, rot=rx, seg=22)
    for i in range(9):                       # 刻度：左下（低）是藍色
        a = PI * (1.15 - 1.3 * i / 8)
        col = 'dial_low' if i < 3 else ('eye' if i < 6 else 'dial_rim')
        p.box(col, (math.cos(a) * 0.36, -0.14, 0.72 + math.sin(a) * 0.36), (0.035, 0.012, 0.085), rot=(0, PI / 2 - a, 0))
    for sx in (-1, 1):                       # 沒精神的眼睛
        p.sphere('eye', (sx * 0.15, -0.14, 0.60), r=1, scale=(0.05, 0.02, 0.035), seg=8, rings=5)
        p.box('eye', (sx * 0.15, -0.145, 0.655), (0.13, 0.012, 0.022), rot=(0, -sx * 0.3, 0))
        p.sphere('dark', (sx * 0.22, -0.02, 0.09), r=1, scale=(0.15, 0.2, 0.09), seg=10, rings=6)
        p.cone('dark', (sx * 0.22, 0.0, 0.19), 0.05, 0.05, 0.12, seg=8)
    p.sphere('mouth', (0, -0.14, 0.50), r=1, scale=(0.07, 0.015, 0.02), seg=8, rings=5)
    p.sphere('dial_low', (0.36, -0.14, 0.86), r=1, scale=(0.035, 0.02, 0.055), seg=8, rings=6)   # 冷汗
    p.torus('dark', (-0.40, 0.05, 0.34), 0.26, 0.03, rot=(PI / 2, 0, 0), seg=16, tube=5, arc=0.45)  # 橡皮管
    p.sphere('dark', (-0.72, 0.05, 0.25), r=1, scale=(0.13, 0.13, 0.17), seg=10, rings=7)          # 打氣球
    p.build('enemy_hypotension__body', root)
    n = Part()
    n.box('needle', (0, -0.155, 0.72 + 0.15), (0.03, 0.014, 0.36))
    n.cone('eye', (0, -0.155, 0.72), 0.05, 0.05, 0.03, rot=rx, seg=10)
    ob = n.build('enemy_hypotension__needle', root, pivot=(0, -0.155, 0.72))
    ob.rotation_euler = (0, -2.2, 0)         # 指向左下：血壓低
    return root


def build_lactate(at):
    root = empty('enemy_lactate', at)
    p = Part()
    p.sphere('lac_d', (0, 0, 0.10), r=1, scale=(0.62, 0.62, 0.14), seg=18, rings=8)
    p.sphere('lac', (0, 0, 0.30), r=1, scale=(0.50, 0.50, 0.34), seg=18, rings=10)
    p.sphere('lac', (0.04, 0.02, 0.58), r=1, scale=(0.36, 0.36, 0.28), seg=16, rings=9)
    p.sphere('lac_l', (-0.02, 0.0, 0.80), r=1, scale=(0.22, 0.22, 0.17), seg=12, rings=8)
    for a, r, s in ((0.6, 0.56, 0.12), (2.4, 0.6, 0.10), (4.1, 0.55, 0.13), (5.3, 0.62, 0.08)):
        p.sphere('lac', (math.cos(a) * r, math.sin(a) * r, 0.07), r=1, scale=(s, s, 0.06), seg=8, rings=5)
    for sx in (-1, 1):                       # 半睜的眼睛
        p.sphere('white', (sx * 0.13, -0.335, 0.60), r=1, scale=(0.075, 0.04, 0.06), seg=10, rings=6)
        p.sphere('eye', (sx * 0.13, -0.365, 0.585), r=0.035, seg=8, rings=5)
        p.box('lac_d', (sx * 0.13, -0.36, 0.645), (0.17, 0.05, 0.04))
    p.sphere('lac_d', (0, -0.44, 0.40), r=1, scale=(0.09, 0.03, 0.03), seg=8, rings=5)
    p.build('enemy_lactate__body', root)
    for i, (bx, by, bz, r) in enumerate(((0.26, -0.1, 1.02, 0.07), (-0.2, 0.1, 1.12, 0.05), (0.05, 0.18, 1.24, 0.04))):
        s = Part()
        s.sphere('lac_l', (bx, by, bz), r=r, seg=8, rings=6)
        s.build('enemy_lactate__bub_%d' % (i + 1), root, pivot=(bx, by, bz))
    return root


def build_mods(at):
    root = empty('enemy_mods', at)
    c = Vector((0, 0, 1.05))
    p = Part()
    p.ico('mods', c, r=0.62, sub=1, smooth=False)
    p.ico('mods_d', c + Vector((0.0, 0.05, -0.05)), r=0.50, scale=(1.25, 1.1, 0.9), rot=(0.4, 0.2, 0.9), sub=1)
    for d in ((0.5, 0.2, 0.75), (-0.55, 0.1, 0.65), (0.1, 0.6, 0.6), (-0.2, -0.2, 0.95)):  # 尖角
        dv = Vector(d).normalized()
        q = Vector((0, 0, 1)).rotation_difference(dv).to_euler()
        p.cone('mods_d', c + dv * 0.66, 0.16, 0.0, 0.42, rot=tuple(q), seg=5, smooth=False)
    for sx in (-1, 1):                       # 發光的眼睛
        p.sphere('white', (sx * 0.20, -0.52, 1.12), r=1, scale=(0.12, 0.06, 0.055), rot=(0, sx * 0.4, 0),
                 seg=10, rings=6, mat='glow_red')
    p.box('white', (0, -0.52, 0.86), (0.26, 0.05, 0.035), mat='glow_red')
    for i in range(4):
        p.cone('white', (-0.09 + i * 0.06, -0.535, 0.83), 0.022, 0.0, 0.06, rot=(PI, 0, 0), seg=4, mat='glow_red')
    p.build('enemy_mods__body', root)

    def orb(name, ang, r, z, fn):
        pos = c + Vector((math.cos(ang) * r, math.sin(ang) * r, z))
        o = Part()
        fn(o, pos)
        o.build('enemy_mods__orb_' + name, root, pivot=tuple(pos))

    def lung(o, v):
        for sx in (-1, 1):
            o.sphere('lung', v + Vector((sx * 0.1, 0, 0)), r=1, scale=(0.11, 0.1, 0.17), seg=10, rings=7)
        o.cone('sick', v + Vector((0, 0, 0.15)), 0.025, 0.025, 0.12, seg=6)

    def kidney(o, v):
        o.sphere('kidney', v, r=1, scale=(0.12, 0.10, 0.18), seg=10, rings=7)
        o.sphere('sick', v + Vector((0.09, 0, 0)), r=0.07, seg=8, rings=5)

    def liver(o, v):
        o.sphere('liver', v, r=1, scale=(0.22, 0.13, 0.14), rot=(0, 0.3, 0), seg=10, rings=7)
        o.sphere('liver', v + Vector((0.14, 0, -0.03)), r=1, scale=(0.13, 0.10, 0.10), seg=8, rings=6)

    def heart(o, v):
        for sx in (-1, 1):
            o.sphere('heart', v + Vector((sx * 0.07, 0, 0.05)), r=0.11, seg=10, rings=7)
        o.cone('heart', v + Vector((0, 0, -0.09)), 0.15, 0.0, 0.2, rot=(PI, 0, 0), seg=10)

    def brain(o, v):
        for dx, dy, dz in ((-0.07, 0, 0.03), (0.07, 0, 0.03), (-0.06, 0.05, -0.04), (0.06, 0.05, -0.04), (0, -0.05, 0.06)):
            o.sphere('brain', v + Vector((dx, dy, dz)), r=0.1, seg=8, rings=6)

    for i, (name, fn) in enumerate((('lung', lung), ('kidney', kidney), ('liver', liver), ('heart', heart), ('brain', brain))):
        orb(name, 2 * PI * i / 5 + 0.3, 1.0, 0.12 * math.sin(i * 2.1), fn)
    return root


# ───────────────────────── 場景 ─────────────────────────
def build_tile(at):
    root = empty('tile_hex', at)
    p = Part()
    rz = (0, 0, PI / 6)                      # 轉 30°：尖角朝前後、平邊朝左右
    p.cone('tile_rim', (0, 0, -0.13), 1.0, 1.0, 0.22, rot=rz, seg=6, smooth=False)
    p.cone('tile_in', (0, 0, -0.012), 0.86, 0.84, 0.024, rot=rz, seg=6, smooth=False)
    p.build('tile_hex__body', root)
    return root


def build_bed(at):
    root = empty('env_bed', at)
    p = Part()
    for sx in (-1, 1):
        for sy in (-1, 1):
            p.cone('metal_d', (sx * 1.6, sy * 0.62, 0.3), 0.055, 0.055, 0.5, seg=8)
            p.sphere('dark', (sx * 1.6, sy * 0.62, 0.08), r=0.09, seg=8, rings=6)
    p.box('bed_d', (0, 0, 0.56), (3.7, 1.6, 0.14), bevel=0.03)
    p.box('sheet', (0, 0, 0.76), (3.5, 1.5, 0.28), bevel=0.09, bseg=3, smooth=True)
    p.box('bed', (-1.88, 0, 0.90), (0.12, 1.72, 0.95), bevel=0.05)       # 床頭板
    p.box('bed', (1.88, 0, 0.78), (0.12, 1.72, 0.62), bevel=0.05)        # 床尾板
    for sy in (-1, 1):                                                   # 床欄
        p.box('bed_d', (-0.3, sy * 0.80, 1.14), (1.5, 0.05, 0.05))
        for dx in (-1.0, -0.3, 0.4):
            p.box('bed_d', (dx, sy * 0.80, 1.0), (0.05, 0.05, 0.28))
    p.box('sheet', (-1.28, 0, 0.98), (0.72, 1.05, 0.18), bevel=0.07, bseg=3, smooth=True)   # 枕頭
    p.box('blanket', (0.52, 0, 0.88), (2.35, 1.56, 0.34), bevel=0.12, bseg=3, smooth=True)
    p.sphere('blanket', (0.35, 0, 1.0), r=1, scale=(1.05, 0.5, 0.2), seg=14, rings=8)       # 身體隆起
    p.box('blanket_l', (-0.62, 0, 0.90), (0.26, 1.58, 0.36), bevel=0.11, bseg=3, smooth=True)
    # 病人（躺著、戴氧氣面罩）
    p.sphere('skin2', (-1.25, 0, 1.19), r=0.30, seg=14, rings=10)
    p.sphere('hair_grey', (-1.27, 0, 1.19), r=0.325, seg=14, rings=10, cut=((-1.33, 0, 1.19), (-1, 0, -0.25)))
    for sy in (-1, 1):
        p.box('eye', (-1.20, sy * 0.11, 1.475), (0.03, 0.09, 0.015), rot=(0.25 * sy, 0.15, 0))
    p.cone('o2', (-1.07, 0, 1.43), 0.11, 0.05, 0.10, rot=(0, 0.55, 0), seg=10)
    p.cone('o2', (-1.5, 0.3, 1.2), 0.015, 0.015, 0.8, rot=(0, 1.2, 0.9), seg=5)              # 氧氣管
    p.build('env_bed__body', root)
    return root


def build_monitor(at):
    """床邊生理監視器。螢幕畫面由遊戲即時繪製，這裡只留一個定位點。"""
    root = empty('env_monitor', at)
    p = Part()
    p.cone('metal_d', (0, 0, 0.04), 0.5, 0.42, 0.08, seg=14)
    p.cone('metal', (0, 0, 0.75), 0.05, 0.05, 1.4, seg=8)
    p.box('dark', (0, 0, 1.95), (1.74, 0.2, 1.16), bevel=0.06)
    p.box('metal_d', (0, 0.12, 1.8), (0.5, 0.12, 0.5))
    p.box('red', (0.6, -0.105, 2.58), (0.34, 0.06, 0.07), mat='glow_red')    # 警示燈條
    for i in range(4):
        p.cone('metal', (-0.6 + i * 0.16, -0.11, 1.42), 0.03, 0.03, 0.02, rot=(PI / 2, 0, 0), seg=8)
    p.build('env_monitor__body', root)
    empty('env_monitor__screen', (0, -0.106, 1.99), parent=root)            # 螢幕位置（1.56 × 0.94）
    return root


def build_ivpole(at):
    root = empty('env_ivpole', at)
    p = Part()
    for i in range(5):
        a = 2 * PI * i / 5
        p.box('metal_d', (math.cos(a) * 0.22, math.sin(a) * 0.22, 0.06), (0.46, 0.06, 0.05), rot=(0, 0, a))
        p.sphere('dark', (math.cos(a) * 0.44, math.sin(a) * 0.44, 0.05), r=0.055, seg=6, rings=4)
    p.cone('metal', (0, 0, 1.6), 0.035, 0.035, 3.1, seg=8)
    p.box('metal', (0, 0, 3.15), (0.7, 0.04, 0.04))
    for sx in (-1, 1):
        p.torus('metal', (sx * 0.33, 0, 3.09), 0.05, 0.012, rot=(PI / 2, 0, 0), seg=10, tube=4, arc=0.6)
    p.box('ivblue', (-0.33, 0, 2.66), (0.36, 0.13, 0.52), bevel=0.05, bseg=2, smooth=True)
    p.box('paper', (-0.33, -0.07, 2.68), (0.22, 0.01, 0.2))
    p.cone('glass', (-0.33, 0, 2.32), 0.035, 0.035, 0.12, seg=8)
    p.cone('glass', (-0.33, 0, 1.95), 0.012, 0.012, 0.62, seg=5)
    p.box('pump', (0, -0.06, 1.55), (0.46, 0.26, 0.5), bevel=0.03)
    p.box('white', (-0.04, -0.195, 1.62), (0.26, 0.01, 0.16), mat='glow_green')
    for i in range(3):
        p.box('metal_d', (0.15, -0.195, 1.7 - i * 0.09), (0.06, 0.012, 0.05))
    p.build('env_ivpole__body', root)
    return root


def build_rail(at):
    """床頭設備帶：氧氣（綠）、空氣（黃）、抽吸（白）。"""
    root = empty('env_rail', at)
    p = Part()
    p.box('bed', (0, 0, 0), (10.0, 0.16, 0.44), bevel=0.03)
    p.box('bed_d', (0, -0.085, -0.15), (10.0, 0.012, 0.03))
    for cx in (-2.6, 2.6):
        for i, col in enumerate(('gas_g', 'gas_y', 'white')):
            x = cx + (i - 1) * 0.42
            p.cone(col, (x, -0.10, 0.03), 0.1, 0.1, 0.06, rot=(PI / 2, 0, 0), seg=12)
            p.cone('metal_d', (x, -0.135, 0.03), 0.04, 0.04, 0.03, rot=(PI / 2, 0, 0), seg=8)
        for i in range(3):
            p.box('dark', (cx + 1.1 + i * 0.26, -0.085, 0.02), (0.16, 0.012, 0.2))
        p.cone('red', (cx - 1.1, -0.10, 0.03), 0.07, 0.07, 0.05, rot=(PI / 2, 0, 0), seg=10)   # 緊急呼叫鈕
    p.build('env_rail__body', root)
    return root


def build_cart(at):
    """急救車。"""
    root = empty('env_cart', at)
    p = Part()
    for sx in (-1, 1):
        for sy in (-1, 1):
            p.sphere('dark', (sx * 0.42, sy * 0.27, 0.09), r=0.09, seg=8, rings=5)
    p.box('red', (0, 0, 0.78), (1.02, 0.7, 1.16), bevel=0.04)
    for i in range(4):
        z = 0.38 + i * 0.26
        p.box('red_d', (0, -0.355, z), (0.9, 0.012, 0.21))
        p.box('metal', (0, -0.372, z + 0.04), (0.34, 0.03, 0.03))
    p.box('metal', (0, 0, 1.385), (1.08, 0.76, 0.05))
    p.box('pump', (-0.15, 0.05, 1.6), (0.58, 0.44, 0.38), bevel=0.04)                    # 去顫器
    p.box('white', (-0.22, -0.175, 1.63), (0.3, 0.01, 0.2), mat='glow_green')
    for sx in (-1, 1):
        p.box('gas_y', (0.32, sx * 0.14, 1.47), (0.16, 0.16, 0.1), bevel=0.02)
    p.cone('gas_g', (0.62, 0.2, 0.75), 0.11, 0.11, 0.95, seg=10)                          # 氧氣鋼瓶
    p.sphere('gas_g', (0.62, 0.2, 1.22), r=0.11, seg=10, rings=6)
    p.cone('metal', (0.62, 0.2, 1.36), 0.035, 0.035, 0.1, seg=6)
    p.build('env_cart__body', root)
    return root


# ───────────────────────── 主程式 ─────────────────────────
def glb_report(path):
    data = open(path, 'rb').read()
    jlen = struct.unpack('<I', data[12:16])[0]
    j = json.loads(data[20:20 + jlen])
    acc = j['accessors']
    tris = 0
    no_color = []
    for m in j['meshes']:
        for prim in m['primitives']:
            tris += acc[prim['indices']]['count'] // 3
            if 'COLOR_0' not in prim['attributes'] and j['materials'][prim['material']]['name'] == 'clay':
                no_color.append(m['name'])
    roots = [j['nodes'][i]['name'] for i in j['scenes'][0]['nodes']]
    print('GLB  %s' % path)
    print('     %.0f KB, %d nodes, %d meshes, %d triangles, %d materials' % (
        len(data) / 1024, len(j['nodes']), len(j['meshes']), tris, len(j['materials'])))
    print('     roots: ' + ', '.join(sorted(roots)))
    if no_color:
        print('     WARNING 沒有頂點色：' + ', '.join(no_color))
        return False
    return True


def main():
    global COLL
    argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:]
    ap = argparse.ArgumentParser()
    ap.add_argument('--out', required=True, help='輸出的 .glb 路徑')
    ap.add_argument('--blend', help='另存 .blend（方便在 Blender 手修）')
    args = ap.parse_args(argv)

    bpy.ops.wm.read_factory_settings(use_empty=True)
    COLL = bpy.context.scene.collection
    make_materials()

    for i, spec in enumerate(STAFF):
        build_staff(spec, ((i % 5) * 1.6 - 3.2, -(i // 5) * 2.2, 0))
    build_pathogen((-3.2, 3, 0))
    build_hypotension((-1.2, 3, 0))
    build_lactate((0.8, 3, 0))
    build_mods((3.2, 3, 0))
    build_tile((6, 0, 0))
    build_bed((0, 7, 0))
    build_monitor((4, 7, 0))
    build_ivpole((-4, 7, 0))
    build_rail((0, 10, 2))
    build_cart((7, 7, 0))

    out = os.path.abspath(args.out)
    os.makedirs(os.path.dirname(out), exist_ok=True)
    props = set(bpy.ops.export_scene.gltf.get_rna_type().properties.keys())
    kw = dict(export_format='GLB', export_apply=True, export_yup=True, export_animations=False,
              export_cameras=False, export_lights=False, export_vertex_color='MATERIAL',
              export_texcoords=False, export_extras=False, use_selection=False)
    kw = {k: v for k, v in kw.items() if k in props}
    bpy.ops.export_scene.gltf(filepath=out, **kw)
    ok = glb_report(out)
    if args.blend:
        bpy.ops.wm.save_as_mainfile(filepath=os.path.abspath(args.blend))
        print('BLEND %s' % os.path.abspath(args.blend))
    if not ok:
        sys.exit(1)


if __name__ == '__main__':
    main()
