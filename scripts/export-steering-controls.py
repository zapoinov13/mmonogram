"""Export the original left/right steering controls without rebuilding them."""
import sys
from pathlib import Path
import bpy

sys.path.insert(0, str(Path(__file__).parent))
from cad_mesh import clean_cad_mesh

metal = ("744dc59", "7e05a66", "9199d43")
for obj in list(bpy.data.objects):
    if obj.type != "MESH" or "_lenkr_voli_bdf_amg_dtr" not in obj.name:
        bpy.data.objects.remove(obj, do_unlink=True)
        continue
    clean_cad_mesh(obj.data)
    role = "cabinMetal" if obj.name.endswith(metal) else "steeringBlack"
    material = bpy.data.materials.get(role) or bpy.data.materials.new(role)
    obj.data.materials.clear()
    obj.data.materials.append(material)
    for face in obj.data.polygons:
        face.use_smooth = True
    obj.data.set_sharp_from_angle(angle=0.6)

bpy.ops.export_scene.gltf(
    filepath=sys.argv[sys.argv.index("--") + 1], export_format="GLB",
    export_draco_mesh_compression_enable=True,
    export_draco_position_quantization=16, export_draco_normal_quantization=12,
)
