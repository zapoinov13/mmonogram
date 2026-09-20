# Gold Package cabin surface pass

Reference: the checked-in `g3-iconic-gold-cabin.jpg` and
`g3-iconic-gold-dash.jpg`, not an unrelated stock G-Class interior.

## Changes

- Split the four original door metal assemblies into complete connected
  components: piano-black inlays, dark bronze speaker mesh, leather straps and
  retained champagne hardware. The previous shared material painted every part
  gold, including the broad lacquer panels and the speaker perforations.
- Assign the original lower dashboard and lower door skins to the selected
  accent leather. Small switches, seals and upper window-frame components keep
  their original roles. No new geometry or seams are fabricated.
- Give leather a restrained physical specular response and continuous metric
  micrograin, without UV projection seams or image downloads. Grain fades below
  pixel resolution. The piano-black trim has a separate clearcoat response.
- Keep the original wheels, steering parts, instruments and camera positions.
  This is a material pass, not a claim of complete photographic reconstruction.

## Rebuild

`cabin-structure.glb` remains the input. `cabin-tailored.glb` is the active export.
All 882,513 source faces are retained, with original normals and transforms;
Draco uses the source precision of 15-bit positions and 10-bit normals.

```sh
node scripts/finish-cabin.mjs /absolute/path/to/gltf-tools/package.json
npm run verify
```

The tool installation needs `@gltf-transform/core`, `extensions`, `functions`
and `draco3dgltf`, matching the other asset preparation scripts. It is not a
production dependency. Component classification is specific to this CAD source:
recheck the four doors and dashboard visually when replacing the source file.

## Verification

- 23 configurator suites, lint, TypeScript, asset budget, production build and
  26-page SEO checks pass.
- Regression checks retain all source nodes/faces, compare all 58 mesh bounds
  within 1.5 mm compression tolerance, require lacquer/speaker/metal on each
  door and accent skin on all four doors plus the lower dashboard.
- Browser checks: driver/front/rear views; Burgundy, Cashmere and Onyx finish
  changes; desktop 1280x720 and mobile 390x844. No browser errors observed.
- Sampled actual canvas pixels: desktop standard deviation 32.46; mobile 30.91
  in the driver view and 25.90 after switching to Onyx/rear. The scene is nonblank
  and changes after interaction. No horizontal document overflow.
- Complete public model payload is 22.24 MiB, below the existing 23 MiB cap.
  This is a transfer-size check, not a measured FPS claim.

Original CAD facet/shading defects, simplified small controls and exact
upholstery modelling still limit a one-to-one match with photographs. Do not
hide those limitations by reporting this pass as a final CAD reconstruction.

## Release

Push to `zapoinov13/mmonogram` main and use its existing Vercel integration.
Verify `mmonogram.com` renderer/config chunks and `cabin-tailored.glb` against
the built files. Rollback is a revert of this pass, without force-pushing or
changing domain aliases.
