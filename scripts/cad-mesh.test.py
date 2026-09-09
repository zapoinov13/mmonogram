"""Blender regression: tessellated adjacent faces must share their seam."""
from pathlib import Path
import sys
import bpy

sys.path.insert(0, str(Path(__file__).parent))
from cad_mesh import clean_cad_mesh

mesh = bpy.data.meshes.new("disconnected-seam")
mesh.from_pydata(
    [(0, 0, 0), (1, 0, 0), (1, 1, 0),
     (0, 0, 0), (1, 1, 0), (0, 1, 0),
     (0, 0, .001), (1, 0, .001), (1, 1, .001)],
    [], [(0, 1, 2), (3, 4, 5), (6, 7, 8)],
)
clean_cad_mesh(mesh)
assert len(mesh.vertices) == 7, "coincident seam must weld without merging separate trim"
assert len(mesh.polygons) == 3, "visible faces must survive cleanup"
first, second, separate = [set(p.vertices) for p in mesh.polygons]
assert len(first & second) == 2, "adjacent faces must share the same edge before reduction"
assert not (first & separate), "nearby parallel trim must remain separate"
clean_cad_mesh(mesh)
assert len(mesh.vertices) == 7, "cleanup must be idempotent"
print("CAD topology regression passed", flush=True)
