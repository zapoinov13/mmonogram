"""Export the original steering pad and badge from the saved CAD scene."""
import sys
import bpy

suffixes = ("polyS_9a095ca", "polySurface45", "___L_1_1_")
for obj in list(bpy.data.objects):
    if obj.type != "MESH" or "_lenkr_voli_amgnap" not in obj.name or not obj.name.endswith(suffixes):
        bpy.data.objects.remove(obj, do_unlink=True)
        continue
    badge = obj.name.endswith("___L_1_1_")
    role = "cabinMetal" if badge else "cabinLeather"
    material = bpy.data.materials.get(role) or bpy.data.materials.new(role)
    obj.data.materials.clear()
    obj.data.materials.append(material)
    if len(obj.data.polygons) > 15000:
        modifier = obj.modifiers.new("Web", "DECIMATE")
        modifier.ratio = 0.08
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.modifier_apply(modifier=modifier.name)

bpy.ops.export_scene.gltf(filepath=sys.argv[sys.argv.index("--") + 1], export_format="GLB", export_draco_mesh_compression_enable=True, export_draco_position_quantization=16, export_draco_normal_quantization=12)
