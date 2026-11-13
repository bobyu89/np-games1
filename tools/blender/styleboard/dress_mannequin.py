#!/usr/bin/env python3
"""
風格候選 B：把 CC0 的通用人形（Quaternius Universal Animation Library 的 Mannequin）「穿」成醫療團隊。

做法：依每個面主要受哪根骨頭控制，分區上色（刷手服上衣、褲子、皮膚、鞋）；
頭髮、聽診器、手持物是另外建的小模型，綁在對應的骨頭上。骨架和動畫原封不動沿用。

用法：
  python tools/blender/styleboard/dress_mannequin.py <AnimationLibrary_Godot_Standard.glb> <輸出資料夾> [角色,角色…]

素材來源（CC0）：https://opengameart.org/content/universal-animation-library
外部檔案只匯入幾何、骨架和動畫，不執行其中任何腳本。
"""
import math
import os
import sys

import bpy
import bmesh
from mathutils import Matrix, Vector

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import build_models as BM  # noqa: E402  共用建模工具（Part、調色盤、材質）

KEEP = ['Idle_Loop', 'Idle_Talking_Loop', 'Interact', 'Spell_Simple_Shoot', 'Punch_Jab', 'Hit_Chest', 'Dance_Loop', 'PickUp_Table']

SPECS = {
    'np': dict(skin='skin1', hair='hair_auburn', style='pony', top='rose', pants='rose_d', shoe='shoe_w', steth=True, prop='clipboard'),
    'rn_lactate': dict(skin='skin2', hair='hair_black', style='bun', top='teal', pants='teal_d', shoe='shoe_w', prop='tube'),
    'attending': dict(skin='skin3', hair='hair_grey', style='short', top='shirt', pants='slate', shoe='shoe_d', coat=True, tie=True, prop='tablet'),
    'surgeon': dict(skin='skin2', hair='surg', style='cap', top='surg', pants='surg_d', shoe='shoe_w', gown=True, mask=True),
}


def dominant_groups(ob):
    names = {g.index: g.name for g in ob.vertex_groups}
    return [names[max(v.groups, key=lambda g: g.weight).group] if v.groups else '' for v in ob.data.vertices]


def tailor(ob, arm, spec):
    """分區上色＋把布料修鬆。

    1. 先沿著袖口、領口、下襬切出乾淨的邊線（切線會保留骨架權重）。
    2. 依每個面主要受哪根骨頭控制、落在切線的哪一側，決定是皮膚、上衣、褲子還是鞋。
    3. 布料區域做平滑再往外推一點，蓋掉假人的肌肉線條，看起來像寬鬆的刷手服。
    """
    me = ob.data
    bones = arm.data.bones
    gname = {g.index: g.name for g in ob.vertex_groups}
    bm = bmesh.new()
    bm.from_mesh(me)
    # glTF 匯入的頂點在法線接縫處是分開的；先焊接，平滑時表面才不會裂開
    bmesh.ops.remove_doubles(bm, verts=bm.verts[:], dist=1e-5)
    dl = bm.verts.layers.deform.verify()
    long_sleeve = bool(spec.get('coat') or spec.get('gown'))
    crotch = bones['DEF-thigh.R'].head_local.z
    hem = crotch - (0.34 if spec.get('gown') else 0.0 if spec.get('coat') else 0.035)
    outer = 'coat' if spec.get('coat') else spec['top']
    collar_p = Vector((0, 0.02, 1.478))
    collar_n = Vector((0, -0.28, 1.0)).normalized()
    sleeve = 0.9 if long_sleeve else 0.58

    def vdom(v):
        w = v[dl]
        return gname[max(w.keys(), key=lambda k: w[k])] if len(w) else ''

    def cut(pred, co, no):
        vs = [v for v in bm.verts if pred(vdom(v))]
        sv = set(vs)
        geom = vs + [e for e in bm.edges if e.verts[0] in sv and e.verts[1] in sv]
        geom += [f for f in bm.faces if all(v in sv for v in f.verts)]
        bmesh.ops.bisect_plane(bm, geom=geom, dist=1e-5, plane_co=Vector(co), plane_no=Vector(no).normalized(),
                               clear_inner=False, clear_outer=False)

    def along(name, t):
        b = bones[name]
        return b.head_local + (b.tail_local - b.head_local) * t, b.tail_local - b.head_local

    torso = lambda g: g.startswith('DEF-spine') or g.startswith('DEF-shoulder') or g == 'DEF-neck'   # noqa: E731
    for side in ('L', 'R'):
        arm_bone = ('DEF-forearm.' if long_sleeve else 'DEF-upper_arm.') + side
        co, axis = along(arm_bone, sleeve)
        cut(lambda g, n=arm_bone: g == n, co, axis)
    near_hem = [v for v in bm.verts if abs(v.co.z - hem) < 0.12 and abs(v.co.x) < 0.3]       # 下襬：整圈一起切
    sv = set(near_hem)
    geom = near_hem + [e for e in bm.edges if e.verts[0] in sv and e.verts[1] in sv] + [f for f in bm.faces if all(v in sv for v in f.verts)]
    bmesh.ops.bisect_plane(bm, geom=geom, dist=1e-5, plane_co=Vector((0, 0, hem)), plane_no=Vector((0, 0, 1)), clear_inner=False, clear_outer=False)
    cut(torso, collar_p, collar_n)
    if spec.get('coat'):
        for sx in (-1, 1):
            cut(torso, (sx * 0.042, 0, 0), (1, 0, 0))

    def fdom(f):
        sums = {}
        for v in f.verts:
            for k, w in v[dl].items():
                sums[k] = sums.get(k, 0.0) + w
        return gname[max(sums, key=sums.get)] if sums else ''

    def frac(name, co):
        b = bones[name]
        axis = b.tail_local - b.head_local
        return (co - b.head_local).dot(axis) / axis.length_squared

    def region(f):
        g, c = fdom(f), f.calc_center_median()
        if g == 'DEF-head':
            return 'skin'
        if torso(g):
            if (c - collar_p).dot(collar_n) > 0 and abs(c.x) < 0.075:
                return 'skin'
            if spec.get('coat') and abs(c.x) < 0.042 and f.normal.y < -0.2 and c.z > 1.08:
                return 'shirt'
            return outer
        if g.startswith('DEF-upper_arm'):
            return outer if long_sleeve or frac(g, c) < sleeve else 'skin'
        if g.startswith('DEF-forearm'):
            return outer if long_sleeve and frac(g, c) < sleeve else 'skin'
        if g.startswith('DEF-hand') or g.startswith('DEF-f_') or g.startswith('DEF-thumb'):
            return 'glove' if spec.get('gown') else 'skin'
        if g == 'DEF-hips' or g.startswith('DEF-thigh'):
            return outer if c.z > hem else 'pants'
        if g.startswith('DEF-shin'):
            return 'pants'
        return 'shoe'

    colors = {'skin': BM.P[spec['skin']], 'pants': BM.P[spec['pants']], 'shoe': BM.P[spec['shoe']], 'coat': BM.P['coat'],
              'shirt': BM.P['shirt'], 'glove': BM.P['glass'], spec['top']: BM.P[spec['top']]}
    cl = bm.loops.layers.float_color.get('Col') or bm.loops.layers.float_color.new('Col')
    reg = {}
    for f in bm.faces:
        reg[f] = region(f)
        f.material_index = 0
        for loop in f.loops:
            loop[cl] = colors[reg[f]]

    cloth_kinds = {outer, 'pants', 'shirt'}
    cloth = [v for v in bm.verts if v.link_faces and all(reg[f] in cloth_kinds for f in v.link_faces)]
    for _ in range(spec.get('smooth', 6)):
        bmesh.ops.smooth_vert(bm, verts=cloth, factor=0.5, use_axis_x=True, use_axis_y=True, use_axis_z=True)
    bm.normal_update()
    for v in cloth:
        v.co += v.normal * 0.014
    bm.normal_update()
    bm.to_mesh(me)
    bm.free()
    me.materials.clear()
    me.materials.append(BM.MATS['clay'])


def attach(ob, arm, bone):
    """把剛建好的小模型綁到骨頭上，位置維持不變。"""
    world = ob.matrix_world.copy()
    b = arm.data.bones[bone]
    ob.parent = arm
    ob.parent_type = 'BONE'
    ob.parent_bone = bone
    ob.matrix_parent_inverse = (arm.matrix_world @ b.matrix_local @ Matrix.Translation((0, b.length, 0))).inverted()
    ob.matrix_basis = world


def head_box(ob):
    dom = dominant_groups(ob)
    cos = [v.co for i, v in enumerate(ob.data.vertices) if dom[i] == 'DEF-head']
    lo = Vector((min(c.x for c in cos), min(c.y for c in cos), min(c.z for c in cos)))
    hi = Vector((max(c.x for c in cos), max(c.y for c in cos), max(c.z for c in cos)))
    return (lo + hi) / 2, (hi - lo) / 2


def add_hair(arm, c, r, spec, uid):
    col, style = spec['hair'], spec['style']
    p = BM.Part()
    centre = c + Vector((0, r.y * 0.10, r.z * 0.12))
    scale = (r.x * 1.13, r.y * 1.14, r.z * 1.05)
    front = c + Vector((0, -r.y * 0.72, r.z * (0.62 if style == 'cap' else 0.40)))
    slope = 0.45 if style == 'cap' else 0.85 if style in ('pony', 'bun') else 0.7
    p.sphere(col, centre, r=1, scale=scale, seg=18, rings=12, cut=(front, (0, slope, 1.0)))
    if style == 'pony':
        p.sphere(col, c + Vector((0, r.y * 1.12, r.z * 0.35)), r=r.x * 0.24, seg=10, rings=6)
        p.sphere(col, c + Vector((0, r.y * 1.38, -r.z * 0.35)), r=1, scale=(r.x * 0.26, r.x * 0.28, r.z * 0.62), rot=(-0.3, 0, 0), seg=10, rings=7)
    elif style == 'bun':
        p.sphere(col, c + Vector((0, r.y * 0.55, r.z * 1.08)), r=r.x * 0.42, seg=12, rings=8)
    elif style == 'short':
        p.sphere(col, c + Vector((r.x * 0.2, -r.y * 0.5, r.z * 0.86)), r=1, scale=(r.x * 0.8, r.y * 0.55, r.z * 0.26), rot=(0.25, 0.2, 0), seg=10, rings=6)
    if spec.get('mask'):
        p.sphere('mask', c + Vector((0, -r.y * 0.62, -r.z * 0.42)), r=1, scale=(r.x * 0.82, r.y * 0.5, r.z * 0.42), seg=14, rings=8)
    ob = p.build(uid + '__hair', None)
    attach(ob, arm, 'DEF-head')


def add_extras(arm, man, spec, uid):
    def front_y(x, z, tol=0.035):
        ys = [v.co.y for v in man.data.vertices if abs(v.co.x - x) < tol and abs(v.co.z - z) < tol]
        return min(ys) if ys else -0.1

    chest = BM.Part()
    used = False
    if spec.get('steth'):
        chest.torus('dark', (0, 0.0, 1.475), 0.075, 0.011, rot=(-0.45, 0, 0), seg=16, tube=5)
        y = front_y(0.045, 1.33)
        chest.cone('dark', (0.045, y - 0.012, 1.34), 0.009, 0.009, 0.16, rot=(0.12, 0, 0), seg=5)
        chest.cone('metal', (0.045, y - 0.03, 1.25), 0.024, 0.024, 0.014, rot=(math.pi / 2, 0, 0), seg=10)
        used = True
    if spec.get('tie'):
        y = front_y(0.0, 1.3)
        chest.box('tie', (0, y - 0.008, 1.27), (0.035, 0.012, 0.19))
        chest.box('tie', (0, y - 0.012, 1.375), (0.05, 0.018, 0.035))
        used = True
    if spec.get('coat'):
        for sx in (-1, 1):                                        # 翻領
            y = front_y(sx * 0.06, 1.36)
            chest.box('coat_s', (sx * 0.066, y - 0.01, 1.37), (0.05, 0.014, 0.15), rot=(0, sx * 0.35, 0))
        used = True
    elif not spec.get('gown'):
        y = front_y(0.085, 1.31)
        chest.box('white', (0.085, y - 0.006, 1.31), (0.05, 0.008, 0.065))        # 識別證
        chest.box(spec['pants'], (0.085, y - 0.011, 1.333), (0.05, 0.006, 0.014))
        used = True
    if used:
        attach(chest.build(uid + '__chest', None), arm, 'DEF-spine.003')

    if spec.get('coat') or spec.get('gown'):                      # 下襬：綁在骨盆上的硬殼
        col = 'coat' if spec.get('coat') else spec['top']
        top_z, bot_z = 1.0, (0.62 if spec.get('coat') else 0.42)
        sk = BM.Part()
        sk.cone(col, (0, 0.03, (top_z + bot_z) / 2), 0.215 if spec.get('coat') else 0.24, 0.165, top_z - bot_z, seg=16, caps=False)
        ob = sk.build(uid + '__skirt', None)
        ob.scale = (1.0, 0.78, 1.0)
        attach(ob, arm, 'DEF-hips')

    prop = spec.get('prop')
    if prop:
        hand = arm.data.bones['DEF-hand.R']
        grip = (hand.head_local + hand.tail_local) / 2
        h = BM.Part()
        if prop in ('clipboard', 'tablet'):                       # 垂手時貼在大腿外側
            col = 'board' if prop == 'clipboard' else 'dark'
            c = grip + Vector((-0.10, 0, -0.035))
            h.box(col, c, (0.30, 0.215, 0.012))
            h.box('paper' if prop == 'clipboard' else 'screen', c + Vector((-0.01, 0, 0.008)), (0.25, 0.18, 0.006))
            if prop == 'clipboard':
                h.box('metal', c + Vector((0.13, 0, 0.012)), (0.03, 0.09, 0.012))
        elif prop == 'tube':                                      # 握在拳心，垂手時朝前
            c = grip + Vector((-0.02, -0.03, -0.03))
            h.cone('purple', c, 0.014, 0.014, 0.07, rot=(math.pi / 2, 0, 0), seg=8)
            h.cone('glass', c + Vector((0, -0.05, 0)), 0.014, 0.014, 0.04, rot=(math.pi / 2, 0, 0), seg=8)
            h.cone('cap_grey', c + Vector((0, -0.078, 0)), 0.017, 0.017, 0.018, rot=(math.pi / 2, 0, 0), seg=8)
        attach(h.build(uid + '__prop', None), arm, 'DEF-hand.R')


def build(src, out_dir, uid):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.context.preferences.filepaths.use_scripts_auto_execute = False
    bpy.ops.import_scene.gltf(filepath=src)
    BM.COLL = bpy.context.scene.collection
    BM.MATS.clear()
    BM.make_materials()
    arm = bpy.data.objects['Rig']
    man = bpy.data.objects['Mannequin']
    for o in list(bpy.data.objects):
        if o not in (arm, man):
            bpy.data.objects.remove(o)
    arm.data.pose_position = 'REST'
    bpy.context.view_layer.update()
    spec = SPECS[uid]
    tailor(man, arm, spec)
    c, r = head_box(man)
    add_hair(arm, c, r, spec, uid)
    add_extras(arm, man, spec, uid)
    arm.data.pose_position = 'POSE'
    # 只留用得到的動畫
    if arm.animation_data:
        for tr in list(arm.animation_data.nla_tracks):
            if not any(s.action and s.action.name in KEEP for s in tr.strips):
                arm.animation_data.nla_tracks.remove(tr)
    for a in list(bpy.data.actions):
        if a.name not in KEEP:
            bpy.data.actions.remove(a)
    arm.name = 'unit_' + uid
    man.name = uid + '__body'
    out = os.path.join(out_dir, 'b_' + uid + '.glb')
    props = set(bpy.ops.export_scene.gltf.get_rna_type().properties.keys())
    kw = dict(export_format='GLB', export_yup=True, export_animations=True, export_vertex_color='MATERIAL',
              export_cameras=False, export_lights=False, export_skins=True, export_texcoords=False)
    bpy.ops.export_scene.gltf(filepath=out, **{k: v for k, v in kw.items() if k in props})
    print('WROTE %s  %.0f KB' % (out, os.path.getsize(out) / 1024))


if __name__ == '__main__':
    argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:]
    src, out_dir = argv[0], argv[1]
    os.makedirs(out_dir, exist_ok=True)
    for uid in (argv[2].split(',') if len(argv) > 2 else SPECS):
        build(src, out_dir, uid)
