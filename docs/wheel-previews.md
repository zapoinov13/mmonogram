# Wheel Selection

The wheel selector uses WebP renders of the actual configurator geometry, not
schematic SVG icons. Each design has five finish images, 384 x 384 pixels.
Only the five images for the selected finish are requested by the page. No
additional WebGL contexts are created by the menu.

- ICONIC Original comes from `wheels-original.glb`; it remains unchanged.
- Alternative designs share `ForgedWheel` with the live vehicle.
- Spokes have swept, dished profiles. Brake hardware sits behind the faces.
- On mobile, the preview strip scrolls horizontally and brings the selected
  design into view without moving the vertical options list.
- Existing design indices and shared configuration links are preserved.

## Regenerating Images

Run `node scripts/render-wheel-previews.mjs` and open the printed localhost URL.
The authoring page renders 25 images through one canvas and writes them to
`public/images/wheels`. Wait for `Done: 25 wheel previews`, then stop the server.
The renderer is not imported into the production application.

Regenerate images whenever wheel geometry or finishes change. Run
`npm run verify`, then visually compare the previews with the actual wheel on
desktop and mobile. The preview test checks all 25 files, dimensions, distinct
content and a 1 MiB total budget. The geometry test checks that sweep changes
the vertices and that spokes have a non-flat profile.

This is a presentation and geometry correction, not a claim that the four
alternative designs are supplied M Monogram CAD models. Only ICONIC Original
uses the provided original wheel mesh.
