"""Blender headless script: import a GLB, normalize it, export .usdc + textures.

Usage: blender -b -P glb2usd.py -- <input.glb> <output.usdc> <decimate_ratio> <max_texture_px>

Normalization: the object is uniformly scaled so its largest bounding-box
dimension equals 1.0 scene unit, and centered on the origin, so the game code
can apply simple, predictable scale factors.
"""
import bpy
import sys
from mathutils import Vector

argv = sys.argv[sys.argv.index("--") + 1:]
src, dst = argv[0], argv[1]
decimate_ratio = float(argv[2])
max_tex = int(argv[3])

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=src)

meshes = [o for o in bpy.context.scene.objects if o.type == "MESH"]
if not meshes:
    raise SystemExit("no mesh objects imported")

# Reduce polygon count for mobile rendering
if decimate_ratio < 1.0:
    before = sum(len(o.data.polygons) for o in meshes)
    for obj in meshes:
        mod = obj.modifiers.new("decimate", "DECIMATE")
        mod.ratio = decimate_ratio
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.modifier_apply(modifier=mod.name)
    after = sum(len(o.data.polygons) for o in meshes)
    print(f"DECIMATED {before} -> {after} tris")

# Downscale textures to cut bundle size
for img in bpy.data.images:
    w, h = img.size
    if w > max_tex or h > max_tex:
        factor = max_tex / max(w, h)
        img.scale(int(w * factor), int(h * factor))
        print(f"TEXTURE {img.name} {w}x{h} -> {img.size[0]}x{img.size[1]}")

depsgraph = bpy.context.evaluated_depsgraph_get()
mins = Vector((float("inf"),) * 3)
maxs = Vector((float("-inf"),) * 3)
for obj in meshes:
    for corner in obj.bound_box:
        world = obj.matrix_world @ Vector(corner)
        mins = Vector(map(min, mins, world))
        maxs = Vector(map(max, maxs, world))

size = maxs - mins
center = (maxs + mins) / 2
max_dim = max(size)
scale = 1.0 / max_dim
print(f"BBOX size=({size.x:.3f}, {size.y:.3f}, {size.z:.3f}) center=({center.x:.3f}, {center.y:.3f}, {center.z:.3f}) scale={scale:.5f}")

# Parent everything under a normalizing root so a single transform applies
root = bpy.data.objects.new("root", None)
bpy.context.scene.collection.objects.link(root)
for obj in bpy.context.scene.objects:
    if obj is not root and obj.parent is None:
        obj.parent = root
root.location = -center * scale
root.scale = (scale, scale, scale)

bpy.ops.wm.usd_export(
    filepath=dst,
    export_materials=True,
    export_textures=True,
    export_animation=False,
    use_instancing=False,
    convert_orientation=True,
    export_global_up_selection="Y",
    export_global_forward_selection="NEGATIVE_Z",
)
print("EXPORTED", dst)
