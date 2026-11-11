# 把素材包裡的 FBX 轉成 GLB，並列出內容。資料是不可信的外部檔案：只匯入，不執行任何內嵌腳本。
import sys, os
import bpy
src_dir, out_dir, names = sys.argv[-3], sys.argv[-2], sys.argv[-1].split(',')
for name in names:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.context.preferences.filepaths.use_scripts_auto_execute = False
    bpy.ops.import_scene.fbx(filepath=os.path.join(src_dir, name + '.fbx'))
    arms = [o for o in bpy.data.objects if o.type == 'ARMATURE']
    meshes = [o for o in bpy.data.objects if o.type == 'MESH']
    tris = sum(sum(len(p.vertices) - 2 for p in m.data.polygons) for m in meshes)
    print('==', name, '| meshes', [(m.name, len(m.data.vertices)) for m in meshes], '| tris', tris)
    print('   bones', [len(a.data.bones) for a in arms], '| mats', sorted({s.material.name for m in meshes for s in m.material_slots if s.material}))
    print('   actions', sorted(a.name for a in bpy.data.actions))
    dims = [tuple(round(x, 2) for x in m.dimensions) for m in meshes]
    print('   dims', dims, 'scale', [tuple(round(x, 3) for x in a.scale) for a in arms])
    bpy.ops.export_scene.gltf(filepath=os.path.join(out_dir, name + '.glb'), export_format='GLB', export_yup=True, export_animations=True)
