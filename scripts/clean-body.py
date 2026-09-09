"""Export an isolated body candidate without reducing disconnected CAD seams."""
import importlib.util
from pathlib import Path
import sys

import bpy

sys.path.insert(0, str(Path(__file__).parent))
from cad_mesh import clean_cad_mesh

spec = importlib.util.spec_from_file_location("converter", Path(__file__).with_name("fbx-to-glb.py"))
converter = importlib.util.module_from_spec(spec)
spec.loader.exec_module(converter)
source, output = sys.argv[sys.argv.index("--") + 1:]
converter.reset_scene()
converter.import_fbx(source)
for obj in bpy.data.objects:
    if obj.type != "MESH":
        continue
    clean_cad_mesh(obj.data)
converter.decimate(min(1, 220_000 / converter.scene_tris()))
for obj in bpy.data.objects:
    if obj.type == "MESH":
        for face in obj.data.polygons:
            face.use_smooth = True
        obj.data.set_sharp_from_angle(angle=0.6)
converter.export_glb(output)
print("BODY_TRIANGLES", converter.scene_tris(), flush=True)
