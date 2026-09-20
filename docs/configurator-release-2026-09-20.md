# Configurator release audit - 2026-09-20

## Scope

Public G63 ICONIC assembly and all seven Tuning sections. Keeps the original
steering, wheel fitment, grille, door infills, console and instrument work.
Based on the latest main branch, including the newer representatives/SEO edits.

## Changes

- Restored 14 painted body/roof/frame components from stock-body.glb. The source
  and simplified exports have different local axes and units; the export applies
  inverse(target world matrix) * source world matrix before replacing a mesh.
- Removed 90 previously hidden/replaced cabin meshes from the downloaded files.
  Kept the visible seat, door, floor, roof and dashboard surfaces. No mesh
  simplification was applied to the new cabin and dashboard exports.
- Welded identical vertices and pruned unused buffers/materials. Original files
  remain available for regeneration and explicit source comparison.
- Full default GLB payload: 24.56 MiB before, 22.17 MiB after (about 9.7% less).
  This includes all ten assets, not just the main body/interior files. It is a
  transfer-size measurement, not a claim of a measured FPS improvement.
- Preloads the selected assembly concurrently with one shared revision URL.
  Alternate wheel builds do not preload the hidden original wheels.
- Default and cad=1 links now use the same cabin lighting. Direct interior links
  start at the interior camera instead of flying through the exterior body.
- Added Front/Side/Rear/Roof controls and mobile roof framing.
- Metal-package selection preserves paint, wheel design, cabin and light choices.
  Default build consistently selects the Gold Package.
- Overview retains the current view and lists wheel design plus finish.
- Repeated saves do not duplicate a build; changing a finish clears saved status.
- Stopped the hidden loading-logo animation after readiness. A scene/chunk
  failure dismisses the cover so the error and reload control remain accessible.

## Verification

- `npm run verify`: lint, TypeScript, 19 configurator suites, asset checks,
  production build and SEO checks.
- Asset tests check all ten payloads, explicit material roles, preserved
  non-degenerate faces and world bounds of all 14 restored body parts.
- Browser inspection at desktop 1280x720, mobile 390x844 and 360x740.
- Inspected all five wheel designs seated in the source tires; three interior
  views, four upholstery finishes, roof/rear views, headlights on/off and night.
- Verified package selection keeps custom paint, Overview keeps interior view,
  repeated saves leave one saved build, and edited builds lose the saved mark.
- No browser error logs during the exercised flows. No horizontal document
  overflow at the two mobile widths.
- Original source GLBs are intentionally retained. The asset checker reports
  three unused source files copied into dist; the public loader does not request
  them. They are not included in the measured 22.17 MiB payload.

## Reproduction

`scripts/prepare-studio-assets.ts` regenerates the four new GLBs from the checked-in
source files. It takes an absolute package.json path for a tool installation
containing @gltf-transform/core, extensions, functions and draco3dgltf:

```sh
node --import tsx scripts/prepare-studio-assets.ts /absolute/path/to/tools/package.json
```

An experimental recompression of original wheels was rejected: no worthwhile
geometry reduction and a larger download. The original wheel GLB is unchanged.

## Remaining limitations

This is not a claim of photographic one-to-one reconstruction. Original CAD
surface normals, joined black wheel geometry, upholstery texture fidelity and
some reflective trim still differ from the Gold Package photographs. Accurate
gold edging of the original turbine face needs separately authored material
regions, not a blanket gold material. Door/hood opening is not rigged, and a
separate stock assembly is not offered by the current public controls.

## Release and rollback

Push only to zapoinov13/mmonogram main. Deployment is the connected Vercel
yuriy7/m-monogram1 project, serving mmonogram.com. Verify the domain's bundled
renderer/config chunks and new GLB bytes, then inspect the deployed browser scene.
If a regression requires rollback, revert this release commit and let the same
production integration deploy it. Do not force-push or replace the domain alias.
