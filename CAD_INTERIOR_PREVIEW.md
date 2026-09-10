# CAD Interior Preview

Status: local comparison, not approved as the default cabin.

Open `/configurator?cad=1&v=interiorDriver`. The normal URL keeps the
existing cabin. The comparison combines the CAD foundation with custom
upholstery and the separate steering wheel; no heavy HQ body is loaded.

## Source

- Yandex public folder: https://disk.yandex.ru/d/RZhCpgph2qvKHA
- File: `4) CAD interior.fbx`, 610,694,300 bytes.
- SHA256: `5e08858c07e5e844450f6e07f3080e30475513533eeb107cd023172a2264e2de`.
- 2,539 source meshes, 17,800,983 triangles, no materials or textures.
- Blender Z-up coordinates export to the same source axes as the body.

The CAD file alone is not the finished interior: upholstery is supplied by
the custom interior asset. Standalone CAD inspection exposed seat backing
and missing decorative surfaces. Do not replace the custom asset with CAD alone.

## Conversion

Import the FBX in Blender and save a working `.blend` outside the repository.
Run `scripts/export-cad-interior.py` in Blender with the blend open and pass
the intermediate GLB path after `--`. This excludes the duplicate steering
assembly, assigns seven material roles, reduces geometry, and joins by role
within assemblies.

Run `scripts/compact-cad.mjs INPUT OUTPUT TOOLCHAIN_PACKAGE_JSON` with an
isolated toolchain containing `@gltf-transform/core`, `extensions`, and
`functions` 4.4.2, plus `draco3dgltf` and `meshoptimizer`. It removes unused
UVs, preserves normals, simplifies, and recompresses the result.

Output: `public/models/cad-interior-web.glb`, 64 meshes, 953,271 triangles,
4.84 MiB. Run `node scripts/cad-interior.test.ts` (Node 24) to check budgets,
material roles, compression, and preservation of the default file selection.

## Remaining Visual Work

- Refine CAD/custom overlaps around headrests and dashboard trim.
- Original CAD steering pad and emblem now replace the temporary center cover;
  the separate compressed asset is checked under a 250 kB budget.
- Improve material assignment and upholstery shading using source references.
- Complete mobile/exterior regression checks before promoting to default.
- Door articulation is not implemented by this import.

No claim of photographic realism or production-ready cabin is made by this
preview. Source FBX and intermediate files must not be committed.
# Geometry repair, 2026-09-09

The visible tears remained with both custom trim and exterior hidden. Welding
coincident CAD vertices before decimation removed the tears in the same front
cabin view. Smooth shading now preserves edges above 0.6 radians. Cleanup has
a Blender regression test (`scripts/cad-mesh.test.py`) covering shared seams,
nearby separate trim and idempotence.

The rebuilt cabin is 4.84 MiB / 953,271 triangles. CAD preview also uses the
cleaned 901 KiB body, rebuilt from the verified Yandex stock FBX. Default and
HQ files remain unchanged. Glass tint and tire color changes are CAD-only.

Verified build, CAD budget, Gold mapping, camera tests, desktop front view,
mobile driver and exterior views. Remaining visual work: custom/CAD trim
ownership, instrument display, leather detail, wheel and kit geometry.
The FBX references external textures absent from the shared folder; these
exports still rely on runtime materials. This is not a final photo match.

## Display and Kit Comparison, 2026-09-10

CAD `_display_` meshes now have a separate `cabinDisplay` role. Their dark
dielectric material uses low specular intensity so the cabin point lights do
not produce an oversized white reflection. This is an unlit instrument screen
matching the reference photographs, not a functional instrument UI. Driver
and rotated cabin views were checked on desktop and at 390 x 844.

The experimental kit failed visual review: wheel fins and grille remain
distorted. It is not shipped or selectable. CAD and default URLs retain the
existing kit. A direct source FBX conversion was stopped after prolonged
decimation; its raw blend cache is retained outside the repository. Rework
the reduction per component before another conversion.
Keep source FBX, blend caches and intermediate GLBs outside the repository.
