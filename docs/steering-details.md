# Gold Package Steering

The custom leather rim and spoke body still come from `parts/steering-wheel.glb`.
`steering-details.glb` replaces the older separate centre/control exports with
25 details from the full CAD source: airbag pad, badge, button assemblies,
surround, upper/lower edging and both shift paddles. Source normals and node
transforms are preserved; the custom wheel body is not included a second time.

The thin inner D-shaped ring is reconstructed from the supplied Gold Package
photo, not claimed to be original CAD. Its 1.1 mm tube follows the steering
plane and sits behind the control faces. It does not turn with the camera.

Steering metal has its own champagne-gold material, independent of exterior
grille colour. Control legends are light, buttons/airbag are black, and the
leather grips follow the selected cabin colour with restrained specular light.
Other cabin materials and wheel/tire fitment are unchanged.

## Rebuild

Run `node scripts/extract-steering-details.mjs source.glb public/models/steering-details.glb /absolute/path/to/gltf-tools/package.json`.
The tools package must provide `@gltf-transform/core`, its extensions/functions
and `draco3dgltf`, as used by the existing CAD extraction scripts. The full CAD
source stays outside Git. This export is under 1 MiB; tests enforce a 2 MiB cap.

Run `npm run verify`. Check the driver view on desktop/mobile, both control
blocks, ring occlusion at the buttons, paddles and the black exterior package.
The source/reference photographs remain unchanged.
