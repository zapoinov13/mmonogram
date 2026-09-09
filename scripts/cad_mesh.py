"""Topology cleanup shared by CAD exports; tolerance is in source units."""
import bmesh


def clean_cad_mesh(data):
    mesh = bmesh.new()
    try:
        mesh.from_mesh(data)
        bmesh.ops.remove_doubles(mesh, verts=list(mesh.verts), dist=0.000001)
        mesh.to_mesh(data)
    finally:
        mesh.free()
    data.validate(clean_customdata=True)
