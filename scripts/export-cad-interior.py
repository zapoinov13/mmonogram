"""Blender: export the untextured CAD cabin with explicit material roles.

Usage: blender -b source.blend --python export-cad-interior.py -- output.glb
The source stays outside the repository. Steering is supplied separately.
"""
import collections
import sys
from pathlib import Path

import bpy

sys.path.insert(0, str(Path(__file__).parent))
from cad_mesh import clean_cad_mesh


def role_for(name):
    name = name.lower()
    if "_display_" in name:
        return "cabinDisplay"
    if any(token in name for token in ("_gurt", "_fussm", "_boden", "_pedal")):
        return "cabinFloor"
    if any(token in name for token in ("_taste", "_schalter", "_radio", "_display", "_klima", "_blende", "_zbe")):
        return "cabinTrim"
    if any(token in name for token in ("_ziert", "_eleiste", "_lautsp", "_uhr", "_badge")):
        return "cabinMetal"
    if "_himmel_" in name:
        return "cabinRoof"
    if "_sitz_" in name and not any(token in name for token in ("_abdeck", "_halt", "_schiene")):
        return "cabinAccent"
    return "cabinLeather"


output = sys.argv[sys.argv.index("--") + 1]
groups = collections.defaultdict(list)
before = after = 0
for obj in list(bpy.data.objects):
    if obj.type != "MESH" or "_lenkr_" in obj.name.lower():
        bpy.data.objects.remove(obj, do_unlink=True)
        continue
    triangles = sum(len(poly.vertices) - 2 for poly in obj.data.polygons)
    before += triangles
    # CAD tessellation contains disconnected coincident vertices. Collapsing
    # those faces independently opens cracks along otherwise shared seams.
    clean_cad_mesh(obj.data)
    if triangles > 800:
        modifier = obj.modifiers.new("Web reduction", "DECIMATE")
        modifier.ratio = max(0.035, 800 / triangles)
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.modifier_apply(modifier=modifier.name)
    after += sum(len(poly.vertices) - 2 for poly in obj.data.polygons)
    obj.data.materials.clear()
    role = role_for(obj.name)
    # Keep door/seat assemblies independent for future articulation.
    assembly = "_".join(obj.name.split("_")[3:5])
    groups[(assembly, role)].append(obj)

palette = {
    "cabinDisplay": (0.004, 0.005, 0.006, 1),
    "cabinFloor": (0.008, 0.008, 0.009, 1),
    "cabinRoof": (0.018, 0.018, 0.02, 1),
    "cabinLeather": (0.024, 0.022, 0.02, 1),
    "cabinAccent": (0.12, 0.026, 0.018, 1),
    "cabinTrim": (0.008, 0.009, 0.01, 1),
    "cabinMetal": (0.42, 0.43, 0.45, 1),
}
materials = {}
for role, color in palette.items():
    material = bpy.data.materials.new(role)
    material.use_nodes = True
    shader = material.node_tree.nodes.get("Principled BSDF")
    shader.inputs["Base Color"].default_value = color
    shader.inputs["Roughness"].default_value = 0.32 if role in ("cabinMetal", "cabinTrim") else 0.8
    shader.inputs["Metallic"].default_value = 0.8 if role == "cabinMetal" else 0
    materials[role] = material

for (assembly, role), objects in groups.items():
    bpy.ops.object.select_all(action="DESELECT")
    for obj in objects:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = objects[0]
    bpy.ops.object.join()
    obj = bpy.context.object
    obj.name = assembly + "_" + role
    obj.data.materials.append(materials[role])
    for polygon in obj.data.polygons:
        polygon.use_smooth = True
    obj.data.set_sharp_from_angle(angle=0.6)

bpy.ops.export_scene.gltf(
    filepath=output,
    export_format="GLB",
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
    export_draco_position_quantization=16,
    export_draco_normal_quantization=12,
)
print("CAD_EXPORT", {"source_triangles": before, "triangles": after, "meshes": len(groups), "output": output})
